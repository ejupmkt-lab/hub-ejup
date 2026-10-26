#!/usr/bin/env python3
"""PDF da versão da Dra. Rossana com as perguntas-subtítulo (texto selecionável, fonte padrão)."""
import html, importlib.util, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
spec = importlib.util.spec_from_file_location("rossana", HERE / "rossana.py")
r = importlib.util.module_from_spec(spec); spec.loader.exec_module(r)

corpo = ""
for sub, pars in r.SECOES:
    if sub:
        corpo += f"<h2>{html.escape(sub)}</h2>"
    corpo += "".join(f"<p>{html.escape(p)}</p>" for p in pars)

h = f'''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>
@page{{size:A4;margin:22mm 22mm}}
body{{font-family:"Liberation Sans",Arial,Helvetica,sans-serif;color:#1a1a1a;font-size:11.5pt;line-height:1.5}}
h1{{font-size:21pt;line-height:1.15;color:#031c37;margin-bottom:8mm}}
h2{{font-size:13.5pt;color:#031c37;margin:8mm 0 3mm;break-after:avoid}}
p{{text-align:justify;margin-bottom:3.2mm;hyphens:auto}}
</style><h1>{html.escape(r.TITULO)}</h1>{corpo}</html>'''
arq = HERE / "tmp.html"; arq.write_text(h)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(); pg.goto(arq.as_uri()); pg.wait_for_timeout(500)
    pg.pdf(path=str(OUT / "Artigo_Centros_de_Inteligencia_versao_Dra_Rossana_com_perguntas.pdf"), prefer_css_page_size=True, print_background=True)
    b.close()
arq.unlink(); print("ok")
