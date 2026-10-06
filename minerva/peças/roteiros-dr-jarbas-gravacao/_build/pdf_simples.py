#!/usr/bin/env python3
"""PDF único e simples: episódios 1 e 2 de cada quadro, só o roteiro falado."""
import html, importlib.util, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
spec = importlib.util.spec_from_file_location("gerar", HERE / "gerar.py")
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)

NOMES = {"A": "O-QUE-O-PROCESSO-NAO-MOSTRA", "B": "ANTES-DA-CONSEQUENCIA"}
CSS = f'''{g.FACE}
@page{{size:A4;margin:16mm 20mm}}
body{{font-family:Gotham,Montserrat,sans-serif;color:#0d131a}}
h1{{font-weight:900;font-size:13pt;letter-spacing:-.005em;margin-bottom:9mm;color:#031c37;border-bottom:1.5px solid #031c37;padding-bottom:3mm}}
.b{{margin-bottom:5mm;break-inside:avoid}}
.b p{{font-size:16pt;line-height:1.3;margin-bottom:1.5mm}}'''


def pagina(q, n):
    ep = next(e for e in g.EPS if e["q"] == q and e["n"] == n)
    corpo = "".join("<div class='b'>" + "".join(f"<p>{html.escape(l)}</p>" for l in ls) + "</div>" for _, ls in ep["blocos"])
    return f'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>{CSS}</style><h1>EPISÓDIO {n} - {g.QN[q].upper()} - ROTEIRO</h1>{corpo}</html>'


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    for q in ("A", "B"):
        for n in (1, 2):
            arq = HERE / "tmp.html"; arq.write_text(pagina(q, n))
            pg = b.new_page(); pg.goto(arq.as_uri()); pg.wait_for_timeout(800)
            pg.pdf(path=str(OUT / f"EPISODIO-{n}-{NOMES[q]}-ROTEIRO.pdf"), prefer_css_page_size=True, print_background=True)
            pg.close(); arq.unlink()
    b.close()
print("ok")
