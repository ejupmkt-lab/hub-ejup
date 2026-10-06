#!/usr/bin/env python3
"""Gera os PDFs do Em Ordem ep. 1: teleprompter (texto grande) e roteiro de gravação."""
import html, pathlib, re
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
FONTS = (HERE.parents[2] / "skills" / "ejup-design" / "assets" / "fonts").as_uri()

FACE = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
'''


def teleprompter():
    blocos = (OUT / "teleprompter-em-ordem-ep01.txt").read_text().strip().split("\n\n")
    corpo = "".join("<div class='b'>" + "".join(f"<p>{html.escape(l)}</p>" for l in b.split("\n")) + "</div>" for b in blocos)
    return f'''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>{FACE}
@page{{size:A4;margin:22mm 20mm}}
body{{font-family:Gotham,Montserrat,sans-serif;color:#0d131a;font-weight:400}}
h1{{font-weight:900;font-size:15pt;letter-spacing:-.01em;margin-bottom:6mm}}
.b{{margin-bottom:11mm;break-inside:avoid}}
.b p{{font-size:25pt;line-height:1.38;font-weight:400;margin-bottom:3mm}}
</style><h1>Em Ordem · Episódio 1 · Teleprompter</h1>{corpo}</html>'''


def md_para_html(md):
    out, lista = [], False
    for ln in md.splitlines():
        s = html.escape(ln)
        s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
        s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
        item = ln.startswith("- ")
        if lista and not item:
            out.append("</ul>"); lista = False
        if ln.startswith("# "):
            out.append(f"<h1>{s[2:]}</h1>")
        elif ln.startswith("## "):
            out.append(f"<h2>{s[3:]}</h2>")
        elif item:
            if not lista:
                out.append("<ul>"); lista = True
            out.append(f"<li>{s[2:]}</li>")
        elif ln.strip():
            out.append(f"<p>{s}</p>")
    if lista:
        out.append("</ul>")
    return "\n".join(out)


def roteiro():
    corpo = md_para_html((OUT / "roteiro-gravacao-em-ordem-ep01.md").read_text())
    return f'''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>{FACE}
@page{{size:A4;margin:20mm 18mm}}
body{{font-family:Gotham,Montserrat,sans-serif;color:#0d131a;font-weight:300;font-size:10.5pt;line-height:1.5}}
h1{{font-weight:900;font-size:19pt;letter-spacing:-.02em;color:#031c37;margin-bottom:6mm}}
h2{{font-weight:500;font-size:10pt;letter-spacing:.14em;text-transform:uppercase;color:#9b6b26;margin:8mm 0 3mm}}
p{{margin-bottom:3mm}} ul{{margin:0 0 3mm 5mm}} li{{margin-bottom:1.5mm}}
b{{font-weight:500}} code{{font-family:inherit;background:#eef0f1;padding:0 1.5mm}}
</style>{corpo}</html>'''


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        for nome, h in (("teleprompter-em-ordem-ep01.pdf", teleprompter()), ("roteiro-gravacao-em-ordem-ep01.pdf", roteiro())):
            arq = OUT / "_build" / (nome + ".html")
            arq.write_text(h)
            pg = b.new_page()
            pg.goto(arq.as_uri())
            pg.wait_for_timeout(800)
            pg.pdf(path=str(OUT / nome), prefer_css_page_size=True, print_background=True)
            pg.close()
            arq.unlink()
        b.close()
    print("pdfs gerados")


if __name__ == "__main__":
    main()
