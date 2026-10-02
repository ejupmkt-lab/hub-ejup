#!/usr/bin/env python3
"""Exporta as 6 telas em PNG 1080x1920 e confere que o texto não invade o logo."""
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
        pg = b.new_page(viewport={"width": 1200, "height": 2000})
        pg.goto((OUT / "destaque.html").as_uri())
        pg.wait_for_timeout(1000)
        n = pg.locator(".s").count()
        for i in range(n):
            s = pg.locator(".s").nth(i)
            box = s.bounding_box()
            if round(box["width"]) != 1080 or round(box["height"]) != 1920:
                erros.append(f"tela {i + 1}: tamanho {box['width']}x{box['height']}")
            c = s.locator(".conteudo").evaluate("e => e.scrollHeight - e.clientHeight")
            if c > 0:
                erros.append(f"tela {i + 1}: conteúdo estoura {c}px")
            top = s.locator(".conteudo").evaluate(
                "e => { const r=e.getBoundingClientRect(); const k=[...e.children]; "
                "return [Math.min(...k.map(x=>x.getBoundingClientRect().top))-r.top, r.height-(Math.max(...k.map(x=>x.getBoundingClientRect().bottom))-r.top)] }")
            if top[0] < 0 or top[1] < 0:
                erros.append(f"tela {i + 1}: conteúdo fora da área ({top})")
            s.screenshot(path=str(TELAS / f"tela-{i + 1:02d}.png"))
        b.close()
    t = sorted(TELAS.glob("tela-*.png"))
    cols, esc, g = 3, 0.3, 24
    w, h = int(1080 * esc), int(1920 * esc)
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
