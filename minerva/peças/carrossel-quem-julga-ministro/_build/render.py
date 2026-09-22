#!/usr/bin/env python3
"""Exporta as 11 telas em PNG 1080×1440 e confere as medidas."""
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
  const b = s.querySelector('.bloco').getBoundingClientRect();
  const sl = s.querySelector('.selo').getBoundingClientRect();
  const l = s.querySelector('.logo').getBoundingClientRect();
  const f = s.querySelector('.foto');
  return { i:+s.dataset.i, escala:+s.dataset.escala,
           w:Math.round(r.width), h:Math.round(r.height),
           seloFim:Math.round(sl.bottom - r.top),
           topo:Math.round(b.top - r.top), fim:Math.round(b.bottom - r.top),
           fotoTopo: f ? Math.round(f.getBoundingClientRect().top - r.top) : null,
           logoTopo:Math.round(l.top - r.top) };
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
            if m["topo"] < m["seloFim"] + 20:
                problemas.append(f"tela {n}: o texto ({m['topo']}) encosta no "
                                 f"trilho ({m['seloFim']})")
            if m["fim"] > m["logoTopo"] - 20:
                problemas.append(f"tela {n}: o texto ({m['fim']}) encosta no "
                                 f"logo ({m['logoTopo']})")
            if m["fotoTopo"] is not None and m["fim"] > m["fotoTopo"] + 120:
                problemas.append(f"tela {n}: o texto ({m['fim']}) invade a "
                                 f"foto ({m['fotoTopo']})")
            if m["escala"] <= 50:
                problemas.append(f"tela {n}: texto encolheu ao limite, "
                                 "corte a copy")
            print(f"tela {n}: escala {m['escala']}px · trilho até "
                  f"{m['seloFim']} · texto {m['topo']}–{m['fim']} · foto "
                  f"{m['fotoTopo']} · logo {m['logoTopo']}")
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
