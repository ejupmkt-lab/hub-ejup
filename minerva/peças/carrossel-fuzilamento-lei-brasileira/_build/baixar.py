#!/usr/bin/env python3
"""Baixa as imagens do Wikimedia Commons para fotos/. Uso: baixar.py nome Arquivo.jpg [largura] ..."""
import hashlib, sys, time, urllib.parse, urllib.request, pathlib
UA = {"User-Agent": "EJUP-Minerva/1.0 (contato@ejup.com.br)"}
DEST = pathlib.Path(__file__).resolve().parent.parent / "fotos"
DEST.mkdir(exist_ok=True)


def url(arquivo, largura=None):
    nome = arquivo.replace(" ", "_")
    h = hashlib.md5(nome.encode()).hexdigest()
    q = urllib.parse.quote(nome)
    if largura:
        return f"https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{q}/{largura}px-{q}"
    return f"https://upload.wikimedia.org/wikipedia/commons/{h[0]}/{h[:2]}/{q}"


def baixa(nome, arquivo, largura=None):
    alvo = DEST / f"{nome}.jpg"
    if alvo.exists():
        print(f"já existe {nome}"); return
    d = 15
    for _ in range(7):
        try:
            b = urllib.request.urlopen(urllib.request.Request(url(arquivo, largura), headers=UA), timeout=180).read()
            alvo.write_bytes(b); print(f"{nome}: {len(b)/1024:.0f} KB", flush=True); return
        except Exception as e:
            print(f"  {nome} ({e}) espera {d}s", flush=True); time.sleep(d); d = min(int(d * 1.7), 120)
    print(f"FALHOU {nome}")


args = sys.argv[1:]
i = 0
while i < len(args):
    nome, arq = args[i], args[i + 1]
    larg = args[i + 2] if i + 2 < len(args) and args[i + 2].isdigit() else None
    baixa(nome, arq, larg)
    i += 3 if larg else 2
    time.sleep(5)
