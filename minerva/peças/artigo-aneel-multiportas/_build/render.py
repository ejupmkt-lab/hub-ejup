#!/usr/bin/env python3
"""Rode antes gerar.py e linkedin.py. Exporta capa do site, story, telas do LinkedIn (PNG) e o PDF do carrossel."""
import pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

import sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from figuras import pasta_saida
OUT = pasta_saida(pathlib.Path(__file__).resolve().parent.parent)
CORTE_SITE = 512  # o site só mostra a faixa de cima da capa


def main():
    (OUT / "linkedin").mkdir(exist_ok=True)
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
        # carrossel do LinkedIn: sistema do carrossel de poder de polícia (linkedin.py)
        for v in (OUT / "linkedin").glob("tela-*.png"):
            v.unlink()
        pg.goto((OUT / "linkedin.html").as_uri())
        pg.wait_for_timeout(900)
        escalas = pg.evaluate("() => [...document.querySelectorAll('.slide')].map(s => +s.dataset.escala)")
        print("escala do texto por tela:", escalas)
        telas = pg.locator(".slide")
        for i in range(telas.count()):
            telas.nth(i).screenshot(path=str(OUT / "linkedin" / f"tela-{i + 1:02d}.png"))
        b.close()
    pngs = sorted((OUT / "linkedin").glob("tela-*.png"))
    ims = [Image.open(x).convert("RGB") for x in pngs]
    ims[0].save(OUT / "carrossel-linkedin.pdf", save_all=True, append_images=ims[1:], resolution=150)
    print(f"{len(pngs)} telas + carrossel-linkedin.pdf")


if __name__ == "__main__":
    main()
