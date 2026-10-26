# Minerva por voz

Um círculo que ouve, pensa e responde falando. Roda na sua máquina: o
navegador ouve você, um servidor local em Python pede a resposta ao Claude e
a voz ao ElevenLabs. As chaves ficam no seu computador.

Por que local, e não no claude.ai: a página publicada como artifact não pode
chamar serviço externo nenhum (bloqueio de rede do sandbox), então o
ElevenLabs só entra com um servidor seu no meio.

## Subir em três passos

```bash
cd peças/minerva-voz
pip install anthropic
export ANTHROPIC_API_KEY=sk-ant-...        # ou: ant auth login
export ELEVENLABS_API_KEY=...
export ELEVENLABS_VOICE_ID=...             # opcional; ver abaixo
python3 server.py
```

Abra **http://localhost:8765** no **Chrome** (é o navegador com
reconhecimento de fala em pt-BR). Toque no círculo, autorize o microfone e
fale. Ela responde por voz e volta a ouvir sozinha. Se você falar por cima,
ela para e escuta.

## A voz

O padrão é a voz "Rachel" do ElevenLabs (id `21m00Tcm4TlvDq8ikWAM`), que fala
português pelo modelo multilíngue, mas com sotaque. Para uma voz brasileira,
abra a Voice Library do ElevenLabs, filtre por Portuguese (Brazil), escolha
uma voz feminina grave e calma, adicione à sua conta e copie o Voice ID para
`ELEVENLABS_VOICE_ID`. O modelo é o `eleven_flash_v2_5` (baixa latência);
para mais qualidade e mais demora, `ELEVENLABS_MODEL_ID=eleven_multilingual_v2`.

## Como funciona por dentro

- **Ouvir:** Web Speech API do Chrome, `pt-BR`. Silêncio reinicia a escuta;
  fala final vira pergunta.
- **Pensar:** `POST /chat` → Claude Opus 5 em streaming, pensamento
  adaptativo em esforço baixo (resposta rápida, adequada a voz), fallback
  server-side ligado, base de conhecimento em cache de prompt. A base é
  `docs/minerva/base-de-conhecimento.md` mais um bloco "modo voz" que pede
  frases curtas e sem listas.
- **Falar:** o texto é cortado em frases conforme chega; cada frase vai a
  `POST /tts`, que repassa ao ElevenLabs em streaming. A primeira frase
  começa a tocar enquanto o Claude ainda escreve o resto.
- **Interromper:** o microfone fica aberto durante a fala dela (com
  cancelamento de eco). Nível acima do limiar por um instante corta o áudio
  e a resposta em curso, e ela volta a ouvir.
- **O círculo:** desenhado em canvas, reage ao volume do microfone quando
  ouve e ao volume da voz dela quando fala; arco girante enquanto pensa.
  Respeita `prefers-reduced-motion`.
- **Teclado:** botão para escrever em vez de falar; **Voz** silencia a
  síntese; **Nova conversa** esquece o histórico (que só vive na página).

## Custo por pergunta

Claude: a base de 16 KB entra em cache, então cada pergunta paga
principalmente a resposta. ElevenLabs: cobra por caractere sintetizado; uma
resposta de quatro frases fica em torno de 300 caracteres.

## Ensinar algo novo

Edite `docs/minerva/base-de-conhecimento.md` e reinicie o servidor. A mesma
base alimenta a versão em texto publicada no claude.ai.
