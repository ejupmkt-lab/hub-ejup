#!/usr/bin/env python3
"""Exporta as telas em PNG 1080x1440 e monta a visualização completa."""
import pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
TELAS = OUT / "telas"


def main():
    TELAS.mkdir(exist_ok=True)
    for v in TELAS.glob("tela-*.png"):
        v.unlink()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1200, "height": 1500})
        pg.goto((OUT / "carrossel.html").as_uri())
        pg.wait_for_timeout(900)
        n = pg.locator(".s").count()
        for i in range(n):
            pg.locator(".s").nth(i).screenshot(path=str(TELAS / f"tela-{i + 1:02d}.png"))
        b.close()
    t = sorted(TELAS.glob("tela-*.png"))
    cols, esc, g = 5, 0.4, 24
    w, h = int(1080 * esc), int(1440 * esc)
    lin = (len(t) + cols - 1) // cols
    f = Image.new("RGB", (cols * w + (cols + 1) * g, lin * h + (lin + 1) * g), (40, 43, 48))
    for i, pth in enumerate(t):
        f.paste(Image.open(pth).convert("RGB").resize((w, h), Image.LANCZOS),
                (g + (i % cols) * (w + g), g + (i // cols) * (h + g)))
    f.save(OUT / "visualizacao-completa.png", optimize=True)
    print(f"{len(t)} telas")


if __name__ == "__main__":
    main()
