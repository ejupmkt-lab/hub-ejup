# Tools / Capacidades do Estrategista

## Transcrição de YouTube (episódios EJUPcast)
O `WebFetch` da página do YouTube NÃO retorna a transcrição (só título/rodapé), e o
endpoint `timedtext` por GET está bloqueado (responde vazio). Use a biblioteca:

```bash
python -m pip install --user youtube-transcript-api
python fetch_youtube_transcript.py "https://www.youtube.com/watch?v=VIDEO_ID" transcript.txt
```

`fetch_youtube_transcript.py` está nesta pasta de instruções. Saída = texto corrido UTF-8
das legendas (auto-geradas em pt funcionam). Construa o conteúdo a partir do que foi
REALMENTE dito no episódio; nunca atribua falas/dados não verificados ao vídeo.
