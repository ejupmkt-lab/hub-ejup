#!/usr/bin/env python3
"""Minerva por voz: servidor local que liga o navegador ao Claude e ao ElevenLabs.

Roda na sua máquina. O navegador ouve você (reconhecimento de fala do
Chrome), manda o texto para cá, este servidor pede a resposta ao Claude em
streaming e devolve; o navegador corta a resposta em frases e pede a voz de
cada frase ao ElevenLabs, também por aqui, para as chaves nunca saírem do seu
computador.

Variáveis de ambiente:
  ANTHROPIC_API_KEY      chave do Claude (ou `ant auth login`)
  ELEVENLABS_API_KEY     chave do ElevenLabs
  ELEVENLABS_VOICE_ID    id da voz (padrão: Rachel, "21m00Tcm4TlvDq8ikWAM";
                         troque por uma voz feminina pt-BR da Voice Library)
  MINERVA_PORTA          porta local (padrão 8765)

Uso:
  pip install anthropic
  python3 server.py
  abrir http://localhost:8765
"""
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

try:
    import anthropic
except ImportError:  # a página e a voz continuam servindo; só o chat avisa
    anthropic = None

HERE = pathlib.Path(__file__).resolve().parent
RAIZ = HERE.parents[1]
BASE = RAIZ / "docs" / "minerva" / "base-de-conhecimento.md"
MODELO = "claude-opus-5"
VOZ = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
XI_MODELO = os.environ.get("ELEVENLABS_MODEL_ID", "eleven_flash_v2_5")
PORTA = int(os.environ.get("MINERVA_PORTA", "8765"))

MODO_VOZ = """

## MODO VOZ
Você está falando em voz alta, por síntese de fala. Responda como quem fala,
e não como quem escreve: frases curtas, sem listas, sem markdown, sem
cabeçalhos, sem símbolos, sem siglas soltas que não se pronunciam. Números
por extenso quando forem pequenos. Respostas de duas a cinco frases, salvo
quando a pessoa pedir detalhe. Termine com uma pergunta ou um próximo passo
só quando isso ajudar de verdade."""


def carregar_base() -> str:
    texto = BASE.read_text(encoding="utf-8")
    if "---" in texto:
        texto = texto.split("---", 1)[1].strip()
    return texto + MODO_VOZ


SISTEMA = carregar_base()
cliente = anthropic.Anthropic() if anthropic else None


class Minerva(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # silencia o log padrão
        pass

    def _json(self):
        n = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(n) or b"{}")

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self._arquivo(HERE / "index.html", "text/html; charset=utf-8")
        elif self.path.startswith("/fonts/"):
            nome = pathlib.Path(self.path).name
            arq = RAIZ / "skills" / "ejup-design" / "assets" / "fonts" / nome
            if arq.suffix == ".otf" and arq.exists():
                self._arquivo(arq, "font/otf")
            else:
                self.send_error(404)
        elif self.path == "/simbolo.svg":
            self._arquivo(RAIZ / "skills" / "ejup-design" / "assets" / "logo"
                          / "ejup-symbol-gold.svg", "image/svg+xml")
        else:
            self.send_error(404)

    def _arquivo(self, arq: pathlib.Path, tipo: str):
        corpo = arq.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "max-age=3600")
        self.end_headers()
        self.wfile.write(corpo)

    def do_POST(self):
        if self.path == "/chat":
            self.chat()
        elif self.path == "/tts":
            self.tts()
        else:
            self.send_error(404)

    # ---- Claude, em streaming de texto puro ----
    def chat(self):
        dados = self._json()
        turnos = [t for t in dados.get("messages", [])
                  if t.get("role") in ("user", "assistant") and t.get("content")]
        if not turnos or turnos[-1]["role"] != "user":
            self.send_error(400, "a conversa precisa terminar numa fala sua")
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()
        if cliente is None:
            self.wfile.write("O SDK do Claude não está instalado. Rode: pip install anthropic".encode("utf-8"))
            return
        try:
            with cliente.beta.messages.stream(
                model=MODELO,
                max_tokens=2048,
                system=[{"type": "text", "text": SISTEMA,
                         "cache_control": {"type": "ephemeral"}}],
                messages=turnos,
                thinking={"type": "adaptive"},
                output_config={"effort": "low"},
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            ) as fluxo:
                for trecho in fluxo.text_stream:
                    self.wfile.write(trecho.encode("utf-8"))
                    self.wfile.flush()
                final = fluxo.get_final_message()
                if final.stop_reason == "refusal":
                    self.wfile.write("Não posso responder a isso.".encode("utf-8"))
        except anthropic.RateLimitError:
            self.wfile.write("Muitas perguntas seguidas. Me dê um instante.".encode("utf-8"))
        except anthropic.APIStatusError as e:
            self.wfile.write(f"O Claude recusou a chamada: {e.status_code}.".encode("utf-8"))
        except anthropic.APIConnectionError:
            self.wfile.write("Perdi a conexão com o Claude.".encode("utf-8"))
        except (BrokenPipeError, ConnectionResetError):
            pass  # o navegador interrompeu (barge-in)

    # ---- ElevenLabs, áudio em streaming ----
    def tts(self):
        chave = os.environ.get("ELEVENLABS_API_KEY")
        if not chave:
            self.send_error(503, "ELEVENLABS_API_KEY não definida")
            return
        texto = self._json().get("text", "").strip()
        if not texto:
            self.send_error(400)
            return
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOZ}/stream"
            "?output_format=mp3_44100_128",
            data=json.dumps({
                "text": texto,
                "model_id": XI_MODELO,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.8,
                                   "style": 0.15, "use_speaker_boost": True},
            }).encode("utf-8"),
            headers={"xi-api-key": chave, "Content-Type": "application/json",
                     "Accept": "audio/mpeg"},
            method="POST")
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                while True:
                    pedaco = resp.read(8192)
                    if not pedaco:
                        break
                    self.wfile.write(pedaco)
                    self.wfile.flush()
        except urllib.error.HTTPError as e:
            self.send_error(e.code, f"ElevenLabs: {e.read()[:200].decode('utf-8', 'replace')}")
        except (BrokenPipeError, ConnectionResetError):
            pass


def main() -> None:
    if anthropic is None:
        print("aviso: pip install anthropic (o chat não vai funcionar sem isso)",
              file=sys.stderr)
    if not os.environ.get("ELEVENLABS_API_KEY"):
        print("aviso: ELEVENLABS_API_KEY não definida; a voz não vai funcionar",
              file=sys.stderr)
    print(f"Minerva ouvindo em http://localhost:{PORTA}  (base: {BASE.name}, "
          f"{len(SISTEMA)//1024} KB, voz {VOZ})")
    ThreadingHTTPServer(("127.0.0.1", PORTA), Minerva).serve_forever()


if __name__ == "__main__":
    main()
