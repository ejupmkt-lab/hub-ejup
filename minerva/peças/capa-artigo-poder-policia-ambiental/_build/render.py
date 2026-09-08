#!/usr/bin/env python3
"""Exporta os três formatos e confere o que o site vai cortar.

O site mostra só a faixa de cima da capa horizontal. `--guia` marca essa
linha na prova; a conferência reprova se qualquer texto passar dela.
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
SRC = OUT / "capas.html"
CHROMIUM = "/opt/pw-browsers/chromium"

# fração da altura que o site mantém na capa horizontal (medida no print do
# card: a imagem aparece em ~3,09:1, então de 1600×900 sobra o topo até 512px)
CORTE_H = 512

MEDIR = """
() => Array.from(document.querySelectorAll('.cover')).map(s => {
  const r = s.getBoundingClientRect();
  const fim = Math.max(...Array.from(s.querySelectorAll('.texto > *'))
                        .map(e => e.getBoundingClientRect().bottom));
  const logo = s.querySelector('.logo').getBoundingClientRect();
  const img = s.querySelector('.foto img');
  const foto = img ? img.getBoundingClientRect().top - r.top : null;
  return {
    fmt: s.dataset.fmt,
    w: Math.round(r.width), h: Math.round(r.height),
    textoFim: Math.round(fim - r.top),
    logoTopo: Math.round(logo.top - r.top),
    fotoTopo: foto === null ? null : Math.round(foto),
  };
})
"""


def main() -> None:
    if not SRC.exists():
        sys.exit("capas.html não existe — rode gerar.py antes")
    guia = "--guia" in sys.argv
    problemas = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM)
        page = b.new_page(viewport={"width": 1700, "height": 1200},
                          device_scale_factor=1)
        page.goto(SRC.as_uri())
        if guia:
            page.evaluate("() => document.body.classList.add('guia')")
        page.wait_for_timeout(700)

        for m in page.evaluate(MEDIR):
            esperado = {"horizontal": (1600, 900), "story": (1080, 1920),
                        "feed": (1080, 1440)}[m["fmt"]]
            if (m["w"], m["h"]) != esperado:
                problemas.append(f"{m['fmt']}: {m['w']}×{m['h']} ≠ "
                                 f"{esperado[0]}×{esperado[1]}")
            if m["fmt"] == "horizontal" and m["textoFim"] > CORTE_H:
                problemas.append(
                    f"horizontal: o texto termina em {m['textoFim']}px e o site "
                    f"corta em {CORTE_H}px — some {m['textoFim']-CORTE_H}px")
            # no story e no feed o retrato entra por baixo do texto; se o
            # topo dele sobe acima da última linha, a foto passa por trás
            if (m["fmt"] in ("story", "feed") and m["fotoTopo"] is not None
                    and m["fotoTopo"] < m["textoFim"]):
                problemas.append(
                    f"{m['fmt']}: o retrato começa em {m['fotoTopo']}px e o "
                    f"texto só termina em {m['textoFim']}px — a foto passa "
                    "por trás do texto")
            if m["textoFim"] > m["logoTopo"]:
                problemas.append(f"{m['fmt']}: o texto encosta no logo")
            print(f"{m['fmt']}: {m['w']}×{m['h']}, texto até {m['textoFim']}px"
                  + (f", retrato a partir de {m['fotoTopo']}px"
                     if m["fotoTopo"] is not None else ""))
            page.locator(f'.cover[data-fmt="{m["fmt"]}"]').screenshot(
                path=str(OUT / f"capa-{m['fmt']}.png"))
        b.close()

    if problemas:
        print("\nPROBLEMAS:")
        for x in problemas:
            print("  ·", x)
        sys.exit(1)


if __name__ == "__main__":
    main()
