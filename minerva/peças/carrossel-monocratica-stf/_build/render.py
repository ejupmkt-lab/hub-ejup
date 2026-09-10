#!/usr/bin/env python3
"""Exporta as 9 telas em PNG 1080×1440 e confere as medidas."""
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
  const topo = s.querySelector('.bloco.topo').getBoundingClientRect();
  const baseEl = s.querySelector('.bloco.base');
  const base = baseEl ? baseEl.getBoundingClientRect() : null;
  const l = s.querySelector('.logo').getBoundingClientRect();
  let pTop = 1e9, pBot = -1e9;
  for (const e of s.querySelectorAll('.palco > *')) {
    const b = e.getBoundingClientRect();
    pTop = Math.min(pTop, b.top); pBot = Math.max(pBot, b.bottom);
  }
  return { i:+s.dataset.i, escala:+s.dataset.escala,
           w:Math.round(r.width), h:Math.round(r.height),
           topo:Math.round(topo.top - r.top),
           topoFim:Math.round(topo.bottom - r.top),
           palcoTopo:Math.round(pTop - r.top), palcoFim:Math.round(pBot - r.top),
           baseTopo: base ? Math.round(base.top - r.top) : null,
           baseFim: base ? Math.round(base.bottom - r.top) : null,
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
            if m["topoFim"] > m["palcoTopo"] + 6 and m["palcoTopo"] > m["topo"]:
                problemas.append(f"tela {n}: bloco de cima ({m['topoFim']}) "
                                 f"invade o palco ({m['palcoTopo']})")
            fim_texto = m["baseFim"] or m["topoFim"]
            if fim_texto > m["logoTopo"]:
                problemas.append(f"tela {n}: o texto encosta no logo")
            if m["palcoFim"] > m["logoTopo"]:
                problemas.append(f"tela {n}: o palco ({m['palcoFim']}) "
                                 f"encosta no logo ({m['logoTopo']})")
            if m["baseTopo"] is not None and m["palcoFim"] > m["baseTopo"] + 6:
                problemas.append(f"tela {n}: o palco ({m['palcoFim']}) invade "
                                 f"o bloco de baixo ({m['baseTopo']})")
            if m["escala"] <= 54:
                problemas.append(f"tela {n}: texto encolheu ao limite, "
                                 "corte a copy")
            print(f"tela {n}: escala {m['escala']}px · topo {m['topo']}–"
                  f"{m['topoFim']} · palco {m['palcoTopo']}–{m['palcoFim']} · "
                  f"base {m['baseTopo']}–{m['baseFim']} · logo {m['logoTopo']}")
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
