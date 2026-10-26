#!/usr/bin/env python3
"""Fotografa a faixa de 7560 px e corta em sete telas 1080x1440."""
import pathlib
from playwright.sync_api import sync_playwright
from PIL import Image
OUT = pathlib.Path(__file__).resolve().parent.parent
TELAS = OUT / "telas"; TELAS.mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 7560, "height": 1440})
    pg.goto((OUT / "carrossel.html").as_uri()); pg.wait_for_timeout(1200)
    pg.locator(".faixa").screenshot(path=str(OUT / "faixa.png"))
    b.close()
f = Image.open(OUT / "faixa.png").convert("RGB")
for k in range(7):
    f.crop((k * 1080, 0, (k + 1) * 1080, 1440)).save(TELAS / f"tela-{k+1:02d}.png")
v = f.resize((f.width // 4, f.height // 4), Image.LANCZOS); v.save(OUT / "visualizacao-faixa.jpg", quality=88)
print("7 telas")
