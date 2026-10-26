#!/usr/bin/env python3
"""Exporta os quatro stories em PNG 1080×1920 e confere as medidas."""
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
CHROMIUM = "/opt/pw-browsers/chromium"

MEDIR = """
() => Array.from(document.querySelectorAll('.story')).map(s => {
  const r = s.getBoundingClientRect();
  const c = s.querySelector('.conteudo').getBoundingClientRect();
  const l = s.querySelector('.logo').getBoundingClientRect();
  return {
    i: +s.dataset.i, escala: +s.dataset.escala,
    w: Math.round(r.width), h: Math.round(r.height),
    folga: Math.round(l.top - c.bottom),   // texto x logo
    pe: Math.round(r.bottom - l.bottom),   // logo x borda
  };
})
"""


def main() -> None:
    alvos = sorted(HERE.parent.glob("*/stories.html"))
    if not alvos:
        sys.exit("nenhum stories.html — rode gerar.py antes")
    problemas = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM)
        page = b.new_page(viewport={"width": 1200, "height": 1200},
                          device_scale_factor=1)
        for src in alvos:
            page.goto(src.as_uri())
            page.wait_for_timeout(600)
            for m in page.evaluate(MEDIR):
                n = m["i"] + 1
                if (m["w"], m["h"]) != (1080, 1920):
                    problemas.append(f"{src.parent.name} story {n}: "
                                     f"{m['w']}×{m['h']} ≠ 1080×1920")
                if m["folga"] < 0:
                    problemas.append(f"{src.parent.name} story {n}: "
                                     "o texto encosta no logo")
                if m["escala"] <= 62:
                    problemas.append(f"{src.parent.name} story {n}: texto "
                                     "encolheu ao limite — corte a copy")
                print(f"{src.parent.name} story {n} — escala {m['escala']}px, "
                      f"folga {m['folga']}px, pé {m['pe']}px")
                page.locator(f'.story[data-i="{m["i"]}"]').screenshot(
                    path=str(src.parent / f"estante-{n:02d}.png"))
        b.close()
    if problemas:
        print("\nPROBLEMAS:")
        for x in problemas:
            print("  ·", x)
        sys.exit(1)


if __name__ == "__main__":
    main()
