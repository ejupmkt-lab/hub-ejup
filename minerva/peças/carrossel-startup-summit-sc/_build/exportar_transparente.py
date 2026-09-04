#!/usr/bin/env python3
"""Exporta as 12 telas em PNG 1080×1440 com fundo transparente.

Transparente aqui = o campo de fundo da tela (o papel) e o espaço reservado
para a foto. Tudo que é desenho continua opaco: painel escuro, scrim, caixa
contornada, etiqueta e o texto. A ideia é sobrepor essas telas às fotos num
editor, com a arte por cima.
"""
import pathlib
import shutil
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "carrossel.html"
OUT = ROOT / "png-transparente"
CHROMIUM = "/opt/pw-browsers/chromium"

# A prévia mostra as telas a 50% e o <style> da peça vive no BODY (o template
# é conteúdo puro), então o override precisa ir no fim do body para vencer na
# ordem do documento.
OVERRIDE = """
.frame{width:1080px;height:1440px}
.frame .slide{transform:none}
.bar{display:none}
html,body{background:transparent}
.slide{background:transparent !important}
.shot,.shot.empty{background:none !important}
.hint{display:none !important}
"""


def main() -> None:
    if not SRC.exists():
        sys.exit(f"não encontrei {SRC} — rode build.py antes")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()

    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM)
        page = b.new_page(viewport={"width": 1300, "height": 1000},
                          device_scale_factor=1)
        page.goto(SRC.as_uri())
        page.evaluate("""(css) => {
            const st = document.createElement('style');
            st.textContent = css;
            document.body.appendChild(st);
        }""", OVERRIDE)
        page.wait_for_timeout(700)

        for i in range(12):
            el = page.locator(f'.slide[data-i="{i}"]')
            el.screenshot(path=str(OUT / f"tela-{i+1:02d}.png"),
                          omit_background=True)
        b.close()

    print(f"12 PNGs com fundo transparente em {OUT}")


if __name__ == "__main__":
    main()
