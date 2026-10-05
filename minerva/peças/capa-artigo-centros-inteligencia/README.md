# Capa · "Centros de Inteligência do Judiciário" (Dra. Rossana Fonseca)

Mesmo sistema da capa do Leonardo ("O poder de polícia ambiental
municipal", `peças/capa-artigo-poder-policia-ambiental/`), que o Victor
apontou em 05/10/2026 como o estilo de foto das divulgações: retrato
recortado, busto no centro, por baixo do texto, dissolvendo no navy com o
halo dourado atrás; logo centralizado embaixo nos verticais.

| arquivo | tamanho | uso |
|---|---|---|
| `capa-horizontal.png` | 1600×900 | site (texto até 471 px; o site mostra 512) |
| `capa-story.png` | 1080×1920 | stories |
| `capa-feed.png` | 1080×1440 | feed |

Também saem as versões `-limpa` (sem retrato e sem logo) e `-bg` (só fundo).

    python3 _build/tratar_foto.py && python3 _build/gerar.py && python3 _build/render.py

**Foto:** "Dra. Rossana - Fotos Profissionais-2.jpg" (ensaio da Panda Design,
Drive), a da estante de livros. Recorte com rembg (modelo isnet-general-use);
`foto.png` fica fora do versionamento, `_build/foto-tratada.webp` é o que vai
embutido. O ensaio corta a manga direita na borda, então a borda direita
também é esfumada (`FADE_DIR`). Boca fechada.

**A confirmar:** o cargo "Advogada e apresentadora do EJUPcast" (montado a
partir do próprio artigo e do papel dela no podcast; trocar em `ARTIGO` se
ela usa outra assinatura) e a categoria "Gestão judiciária".
