#!/usr/bin/env python3
"""PDF único e simples: episódios 1 e 2 de cada quadro, só o roteiro falado."""
import html, importlib.util, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
spec = importlib.util.spec_from_file_location("gerar", HERE / "gerar.py")
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)

NOMES = {"A": "O-Que-o-Processo-Nao-Mostra", "B": "Antes-da-Consequencia"}
CSS = f'''{g.FACE}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{background:#fff}}
body{{width:794px;height:1123px;padding:64px 76px;font-family:Gotham,Montserrat,sans-serif;color:#0d131a}}
h1{{font-weight:900;font-size:17px;letter-spacing:-.005em;margin-bottom:34px;color:#031c37;border-bottom:2px solid #031c37;padding-bottom:12px}}
.b{{margin-bottom:19px}}
.b p{{font-size:21px;line-height:1.32;margin-bottom:6px}}'''


def pagina(q, n):
    ep = next(e for e in g.EPS if e["q"] == q and e["n"] == n)
    corpo = "".join("<div class='b'>" + "".join(f"<p>{html.escape(l)}</p>" for l in ls) + "</div>" for _, ls in ep["blocos"])
    return f'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>{CSS}</style><h1>EPISÓDIO {n} - {g.QN[q].upper()} - ROTEIRO</h1>{corpo}</html>'


from PIL import Image
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    for q in ("A", "B"):
        for n in (1, 2):
            arq = HERE / "tmp.html"; arq.write_text(pagina(q, n))
            pg = b.new_page(viewport={"width": 794, "height": 1123}, device_scale_factor=2)
            pg.goto(arq.as_uri()); pg.wait_for_timeout(800)
            h = pg.evaluate("document.querySelector('body').scrollHeight")
            if h > 1123: print("ATENÇÃO: estoura a página", q, n, h)
            png = HERE / "tmp.png"; pg.screenshot(path=str(png))
            Image.open(png).convert("RGB").save(OUT / f"Episodio{n}_{NOMES[q]}_Roteiro.pdf", "PDF", resolution=192.0, quality=92, title=f"Episódio {n} - {g.QN[q]} - Roteiro")
            pg.close(); arq.unlink(); png.unlink()
    b.close()
print("ok")
