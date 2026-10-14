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

## Ajuste ao padrão (09/10/2026)
Comparada com as capas do Leonardo e da Rossana, a do Roberto estava com o
retrato fechado demais (rosto grande, sem tronco). Recorte refeito de y 250 a
6900 do original, até a cintura, na mesma proporção do retrato do Leonardo, e
posição do horizontal igual à da capa dele (right 70, top 14, altura 1000).
O halo é centrado na cabeça e dimensionado pelo retrato (`FX`, `FY`, `DH` no
script do template).

    python3 _build/recortar_hd.py original.jpg foto.png 0 250 4912 6900

**Luz (09/10/2026):** centrada na cabeça parecia aura ("parece que ele virou
anjo"). Agora é luz de estúdio difusa atrás do ombro direito, deslocada para o
lado como na capa do Leonardo: centro em FX 0,66 / FY 0,30 do retrato,
diâmetro 0,8 da altura dele, gradiente mais suave e desfoque proporcional.
Ajuste seguinte: luz centralizada atrás do tronco (FX 0,482 / FY 0,36,
diâmetro 1,0 da altura do retrato), simétrica nos dois lados, ainda abaixo da
cabeça para não virar aura.

## Foto trocada (14/10/2026)
Pedido do Victor: "tenta outra foto de roberto". Agora é a FOTO-03 do ensaio
(blazer escuro sem gravata, camisa branca, mãos juntas, corpo levemente
virado, boca fechada), recortada de x 300 a 4500 e y 200 a 5900 do original.
Luz centralizada atrás do tronco (FX 0,53). A versão com a FOTO-01 (terno e
gravata, mãos na lapela) fica no histórico do git.

    python3 _build/recortar_hd.py original-foto03.jpg foto.png 300 200 4500 5900
