#!/usr/bin/env python3
"""Rode antes gerar.py. Exporta capa do site, story, feed e post em PNG."""
import pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).resolve().parent.parent
CORTE_SITE = 512  # o site só mostra a faixa de cima da capa


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1700, "height": 2000})
        pg.goto((OUT / "pecas.html").as_uri())
        pg.wait_for_timeout(800)
        # nada da capa do site pode passar da faixa que o site exibe
        baixo = pg.evaluate("""() => {const s=document.getElementById('site').getBoundingClientRect();
          return Math.max(...[...document.querySelectorAll('#site .texto, #site .arte')]
            .map(e=>e.getBoundingClientRect().bottom - s.top))}""")
        print(f"capa do site: conteúdo termina em {baixo:.0f}px (limite {CORTE_SITE})")
        if baixo > CORTE_SITE:
            raise SystemExit("capa do site passa da faixa exibida")
        pg.locator("#site").screenshot(path=str(OUT / "capa-site-1600x900.png"))
        pg.locator("#story").screenshot(path=str(OUT / "story-1080x1920.png"))
        pg.locator("#feed").screenshot(path=str(OUT / "feed-1080x1440.png"))
        pg.locator("#post").screenshot(path=str(OUT / "post-1080x1350.png"))
        b.close()


if __name__ == "__main__":
    main()
