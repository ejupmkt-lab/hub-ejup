#!/usr/bin/env python3
"""Exporta as 8 telas em PNG 1080×1440 e confere as medidas."""
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
SRC = OUT / "carrossel.html"
CHROMIUM = "/opt/pw-browsers/chromium"

MEDIR = """
() => Array.from(document.querySelectorAll('.slide')).map(s => {
  const r = s.getBoundingClientRect();
  const c = s.querySelector('.bloco').getBoundingClientRect();
  const l = s.querySelector('.logo').getBoundingClientRect();
  return { i:+s.dataset.i, escala:+s.dataset.escala,
           w:Math.round(r.width), h:Math.round(r.height),
           topo:Math.round(c.top - r.top),
           folga:Math.round(l.top - c.bottom),
           pe:Math.round(r.bottom - l.bottom) };
})
"""


import importlib.util as _il

_spec = _il.spec_from_file_location("gerar", HERE / "gerar.py")
_gerar = _il.module_from_spec(_spec)
_spec.loader.exec_module(_gerar)


def main() -> None:
    if not SRC.exists():
        sys.exit("carrossel.html não existe — rode gerar.py antes")
    prev = OUT / "telas"
    # limpa antes: sobra de uma versão com mais telas ia junto no zip
    if prev.exists():
        for velho in prev.glob("tela-*.png"):
            velho.unlink()
    prev.mkdir(exist_ok=True)
    problemas = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM)
        page = b.new_page(viewport={"width": 1200, "height": 1200},
                          device_scale_factor=1)
        page.goto(SRC.as_uri())
        page.wait_for_timeout(700)
        medidas = page.evaluate(MEDIR)
        for m in medidas:
            n = m["i"] + 1
            if (m["w"], m["h"]) != (1080, 1440):
                problemas.append(f"tela {n}: {m['w']}×{m['h']} ≠ 1080×1440")
            if m["folga"] < 0:
                problemas.append(f"tela {n}: o texto encosta no logo")
            if m["topo"] < 90:
                problemas.append(f"tela {n}: o bloco começa a {m['topo']}px "
                                 "da borda de cima")
            if m["escala"] <= 54:
                problemas.append(f"tela {n}: texto encolheu ao limite, "
                                 "corte a copy")
            print(f"tela {n}: escala {m['escala']}px, topo {m['topo']}px, "
                  f"folga {m['folga']}px")
            page.locator(f'.slide[data-i="{m["i"]}"]').screenshot(
                path=str(prev / f"tela-{n:02d}.png"))
        b.close()
    print(f"\n{len(medidas)} telas em {prev}")
    if problemas:
        print("\nPROBLEMAS:")
        for x in problemas:
            print("  ·", x)
        sys.exit(1)


if __name__ == "__main__":
    main()
