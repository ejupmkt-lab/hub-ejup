#!/usr/bin/env python3
"""Exporta as 5 telas do modelo em PNG 1080×1350 e confere as medidas."""
import pathlib
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
SRC = OUT / "modelo-perfil-roberto.html"
CHROMIUM = "/opt/pw-browsers/chromium"

MEDIR = """
() => Array.from(document.querySelectorAll('.slide')).map(s => {
  const q = s.querySelectorAll('.quadro');
  const l = s.querySelectorAll('.legenda');
  return { s:+s.dataset.s, quadros:q.length,
           alturas:[...q].map(x => Math.round(x.getBoundingClientRect().height / 0.5)),
           legendas:[...l].map(x => Math.round(x.getBoundingClientRect().height / 0.5)) };
})
"""


def main() -> None:
    if not SRC.exists():
        sys.exit("modelo não existe, rode gerar.py antes")
    prev = OUT / "telas"
    if prev.exists():
        for velho in prev.glob("tela-*.png"):
            velho.unlink()
    prev.mkdir(exist_ok=True)
    problemas = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM)
        page = b.new_page(viewport={"width": 1400, "height": 1200},
                          device_scale_factor=1)
        page.goto(SRC.as_uri())
        page.wait_for_timeout(900)
        # tira a escala de visualização e a interface para o screenshot sair
        # em tamanho real, sem a barra fixa por cima
        page.evaluate("""() => {
            document.querySelector('.barra').style.display = 'none';
            document.querySelector('header').style.display = 'none';
            document.querySelectorAll('.slide').forEach(s => {
                s.style.transform = 'none';
                s.parentElement.style.height = '1350px';
            });
        }""")
        page.wait_for_timeout(300)
        medidas = page.evaluate(MEDIR)
        for m in medidas:
            n = m["s"] + 1
            if m["quadros"] != 2:
                problemas.append(f"tela {n}: {m['quadros']} quadros, esperado 2")
            for i, h in enumerate(m["legendas"]):
                if h > 300:
                    problemas.append(f"tela {n}, legenda {i+1}: {h}px de altura, "
                                     "corte a frase")
            print(f"tela {n}: quadros {m['quadros']} · legendas "
                  + " e ".join(f"{h}px" for h in m["legendas"]))
            destino = prev / f"tela-{n:02d}.png"
            page.locator(f'.slide[data-s="{m["s"]}"]').screenshot(
                path=str(destino))
            # o screenshot sai com um pixel de sobra por arredondamento
            im = Image.open(destino)
            if im.size != (1080, 1350):
                im.crop((0, 0, 1080, 1350)).save(destino)
        b.close()
    print(f"\n{len(medidas)} telas em {prev}")
    if problemas:
        print("\nPROBLEMAS:")
        for x in problemas:
            print("  ·", x)
        sys.exit(1)


if __name__ == "__main__":
    main()
