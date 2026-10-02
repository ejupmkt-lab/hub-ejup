#!/usr/bin/env python3
"""Exporta cada tela em PNG 1920x1080 e monta a folha de aprovação."""
import pathlib
from playwright.sync_api import sync_playwright
from PIL import Image
OUT = pathlib.Path(__file__).resolve().parent.parent
(OUT / "amostra").mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 2000, "height": 1200})
    pg.goto((OUT / "telas.html").as_uri()); pg.wait_for_timeout(1000)
    n = pg.locator(".s").count()
    for i in range(n):
        pg.locator(".s").nth(i).screenshot(path=str(OUT / "amostra" / f"tela-{i+1:02d}.png"))
    b.close()
fs = sorted((OUT / "amostra").glob("tela-*.png"))
W, H, g = 960, 540, 20
f = Image.new("RGB", (2 * W + 3 * g, ((len(fs) + 1) // 2) * (H + g) + g), (34, 34, 34))
for i, pth in enumerate(fs):
    f.paste(Image.open(pth).convert("RGB").resize((W, H), Image.LANCZOS), (g + (i % 2) * (W + g), g + (i // 2) * (H + g)))
f.save(OUT / "amostra" / "folha-amostra.jpg", quality=88)
print(len(fs), "telas")
