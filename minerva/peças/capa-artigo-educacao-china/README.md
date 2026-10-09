# Capa · "A educação do futuro está em curso: o que o caso da China nos ensina" (Roberto Pivotto)

Mesmo sistema da capa do artigo dos Centros de Inteligência (retrato recortado
dissolvendo no navy, halo dourado, texto no alto), com os cinco formatos:

| arquivo | tamanho | uso |
|---|---|---|
| `capa-horizontal.png` | 1600×900 | site (texto até 433 px; o site mostra 512) |
| `capa-story.png` | 1080×1920 | stories |
| `capa-feed.png` | 1080×1440 | feed do Instagram |
| `capa-linkedin.png` | 1200×627 | LinkedIn, imagem horizontal |
| `capa-linkedinv.png` | 1080×1350 | LinkedIn, vertical 4:5 |

    python3 _build/recortar_hd.py original.jpg foto.png 0 300 4912 4700
    python3 _build/tratar_foto.py && python3 _build/gerar.py && python3 _build/render.py

**Foto:** "Roberto---EJUP---FOTO-01.jpg" (ensaio da Panda Design, Drive), de
frente, terno escuro e gravata, boca fechada. Recorte BiRefNet + matting; a cor
original já é neutra, então não passou por correção. As outras três do ensaio:
blazer sem gravata (FOTO-03), camiseta preta de braços cruzados (FOTO-06) e
terno claro olhando para o lado (FOTO-07).

**A confirmar:** cargo "Sócio da EJUP" (se ele assina como sócio-fundador,
trocar em `ARTIGO`) e o rótulo de tema "Educação". Sem o texto do artigo, o
título e o subtítulo vêm do tema enviado pelo Victor.
