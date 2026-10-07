#!/usr/bin/env python3
"""Simula a fileira de destaques no perfil (círculo central de cada capa, com o nome embaixo)."""
import pathlib
from PIL import Image, ImageDraw, ImageFont
OUT = pathlib.Path(__file__).resolve().parent.parent
RAIZ = OUT.parents[1]
f = ImageFont.truetype(str(RAIZ / "skills/ejup-design/assets/fonts/Gotham-Book.otf"), 22)
nomes = ["Curadoria", "Contato", "Quem somos", "Podcast", "Bastidores", "A Sala", "Artigos"]
D, G = 150, 40
for estilo in ("navy", "ouro"):
    for fundo, tinta, suf in (("#ffffff", "#262626", "claro"), ("#000000", "#f5f5f5", "escuro")):
        W = len(nomes) * (D + G) + G
        im = Image.new("RGB", (W, D + 110), fundo); d = ImageDraw.Draw(im)
        for i, (arq, nome) in enumerate(zip(sorted((OUT / estilo).glob("*.png")), nomes)):
            c = Image.open(arq).convert("RGB").crop((0, 420, 1080, 1500)).resize((D, D), Image.LANCZOS)
            m = Image.new("L", (D * 4, D * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, D * 4 - 1, D * 4 - 1), fill=255)
            x = G + i * (D + G)
            # anel cinza do Instagram em volta da capa
            d.ellipse((x - 6, 24, x + D + 6, 24 + D + 12), outline="#dbdbdb" if suf == "claro" else "#363636", width=2)
            im.paste(c, (x, 30), m.resize((D, D), Image.LANCZOS))
            w = d.textlength(nome, font=f); d.text((x + D / 2 - w / 2, D + 50), nome, font=f, fill=tinta)
        im.save(OUT / f"mockup-{estilo}-{suf}.png")
print("ok")
