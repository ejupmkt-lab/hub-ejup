#!/usr/bin/env python3
"""Renderiza a arte de citação em PNG 1080×1440 e confere as medidas."""
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
CHROMIUM = "/opt/pw-browsers/chromium"

MEDIR = """
() => {
  const a = document.getElementById('arte').getBoundingClientRect();
  const f = document.querySelector('.aspa.fecha').getBoundingClientRect();
  const r = document.querySelector('.rodape').getBoundingClientRect();
  const l = document.querySelector('.logo').getBoundingClientRect();
  return {
    w: Math.round(a.width), h: Math.round(a.height),
    corpo: +document.documentElement.dataset.corpo,
    // folga entre o fim da frase e o começo do rodapé
    folga: Math.round(r.top - f.bottom),
    // quanto sobra abaixo do logo até a borda da arte
    pe: Math.round(a.bottom - l.bottom),
  };
}
"""


def main() -> None:
    alvos = sorted(OUT.glob("post-mandela.html"))
    if not alvos:
        sys.exit("nenhum post-mandela.html — rode gerar.py antes")
    problemas = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM)
        page = b.new_page(viewport={"width": 1240, "height": 1560},
                          device_scale_factor=1)
        for src in alvos:
            page.goto(src.as_uri())
            page.wait_for_timeout(500)
            m = page.evaluate(MEDIR)
            if (m["w"], m["h"]) != (1080, 1440):
                problemas.append(f"{src.name}: {m['w']}×{m['h']} ≠ 1080×1440")
            if m["folga"] < 0:
                problemas.append(f"{src.name}: a frase invade o rodapé")
            if m["pe"] < 60:
                problemas.append(f"{src.name}: logo a {m['pe']}px da borda (mínimo 60)")
            png = src.with_suffix(".png")
            page.locator("#arte").screenshot(path=str(png))
            print(f"{png.name} — corpo da frase {m['corpo']}px, "
                  f"folga {m['folga']}px, pé {m['pe']}px")
        b.close()
    if problemas:
        print("\nPROBLEMAS:")
        for x in problemas:
            print("  ·", x)
        sys.exit(1)


if __name__ == "__main__":
    main()
