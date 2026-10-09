#!/usr/bin/env python3
"""Exporta as telas em PNG 1080x1440, monta a visualização completa e confere estouro de conteúdo."""
import pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
TELAS = OUT / "telas"


def main():
    TELAS.mkdir(exist_ok=True)
    for v in TELAS.glob("tela-*.png"):
        v.unlink()
    erros = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1200, "height": 1500})
        pg.goto((OUT / "carrossel.html").as_uri())
        pg.wait_for_timeout(1000)
        n = pg.locator(".s").count()
        for i in range(n):
            s = pg.locator(".s").nth(i)
            box = s.bounding_box()
            if round(box["width"]) != 1080 or round(box["height"]) != 1440:
                erros.append(f"tela {i + 1}: tamanho {box['width']}x{box['height']}")
            c = s.locator(".conteudo").evaluate("e => e.scrollHeight - e.clientHeight")
            if c > 0:
                erros.append(f"tela {i + 1}: conteúdo estoura {c}px")
            s.screenshot(path=str(TELAS / f"tela-{i + 1:02d}.png"))
        b.close()
    t = sorted(TELAS.glob("tela-*.png"))
    cols, esc, g = 4, 0.3, 24
    w, h = int(1080 * esc), int(1440 * esc)
    lin = (len(t) + cols - 1) // cols
    f = Image.new("RGB", (cols * w + (cols + 1) * g, lin * h + (lin + 1) * g), (40, 43, 48))
    for i, pth in enumerate(t):
        f.paste(Image.open(pth).convert("RGB").resize((w, h), Image.LANCZOS),
                (g + (i % cols) * (w + g), g + (i // cols) * (h + g)))
    f.save(OUT / "visualizacao-completa.png", optimize=True)
    print(f"{len(t)} telas")
    if erros:
        print("\n".join(erros)); sys.exit(1)


if __name__ == "__main__":
    main()
