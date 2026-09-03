#!/usr/bin/env python3
"""Carrossel "Startup Summit 2026" — perfil pessoal de Roberto e Leonardo.

Embute as fontes Gotham no template e gera `../carrossel.html`, que roda
sozinho no navegador (arrastar-e-soltar das fotos + exportação).

Não é peça da EJUP: o charter da marca não se aplica aqui. A paleta e a
tipografia ficam num único bloco de tokens no topo do template, para reskin.
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
FONTS = HERE.parents[2] / "skills" / "ejup-design" / "assets" / "fonts"

# (arquivo, peso, estilo)
FACES = [
    ("Gotham-Light.otf", 300, "normal"),
    ("Gotham-Book.otf", 400, "normal"),
    ("Gotham-BookItalic.otf", 400, "italic"),
    ("Gotham-Medium.otf", 500, "normal"),
    ("Gotham-Bold.otf", 700, "normal"),
    ("Gotham-Black.otf", 900, "normal"),
]


def font_face_css() -> str:
    out = []
    for name, weight, style in FACES:
        src = FONTS / name
        if not src.exists():
            raise SystemExit(f"fonte ausente: {src}")
        b64 = base64.b64encode(src.read_bytes()).decode("ascii")
        out.append(
            "@font-face{font-family:'Gotham';"
            f"font-weight:{weight};font-style:{style};"
            f"src:url(data:font/otf;base64,{b64}) format('opentype');}}"
        )
    return "\n".join(out)


def main() -> None:
    html = (HERE / "template.html").read_text(encoding="utf-8")
    token = "__FONT_FACES__"
    if token not in html:
        raise SystemExit(f"token não encontrado: {token}")
    html = html.replace(token, font_face_css())

    dest = OUT / "carrossel.html"
    dest.write_text(html, encoding="utf-8")
    print(f"gerado: {dest.name} ({len(html)/1024:.0f} KB)")


if __name__ == "__main__":
    main()
