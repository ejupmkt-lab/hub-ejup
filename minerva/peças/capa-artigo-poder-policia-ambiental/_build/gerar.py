#!/usr/bin/env python3
"""Capa de artigo da coluna jurídica — três formatos a partir do mesmo conteúdo.

    horizontal  1600×900   (site; o site corta e mostra só a faixa de cima)
    story       1080×1920
    feed        1080×1440

O texto vive em ARTIGO. A foto entra se existir `foto.jpg` (ou .png) na pasta
da peça; sem ela, o lugar do retrato sai marcado e a capa fica pronta para
receber o arquivo depois.
"""
import base64
import html as _html
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"

FACES = [("Gotham-Light.otf", 300), ("Gotham-Book.otf", 400),
         ("Gotham-Medium.otf", 500), ("Gotham-Bold.otf", 700),
         ("Gotham-Black.otf", 900)]

ARTIGO = {
    "tag": "EJUP · Artigo",
    # o título quebra em duas partes: a segunda é a que vai em dourado Light
    "titulo": "O poder de polícia",
    "titulo_g": "ambiental municipal",
    "sub": "Eficácia do licenciamento ambiental simplificado.",
    "coluna": "Coluna jurídica",
    "tema": "Direito ambiental",
    "autor": "Leonardo Pivotto",
    "cargo": "Sócio-fundador da EJUP e da EIX CORE",
}

FORMATOS = [("horizontal", "fmt-h", 1600, 900),
            ("story", "fmt-v", 1080, 1920),
            ("feed", "fmt-f", 1080, 1440)]

ICONE_COLUNA = ('<svg viewBox="0 0 24 24" fill="none" stroke="#f0b855" '
                'stroke-width="1.8" stroke-linecap="round">'
                '<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>')
ICONE_TEMA = ('<svg viewBox="0 0 24 24" fill="none" stroke="#f0b855" '
              'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
              '<path d="M20 4c0 9-5.5 14-13 14H5C5 9 10.5 4 18 4z"/>'
              '<path d="M4 21c1.5-5 4.5-8.5 9-11"/></svg>')


def fontes() -> str:
    out = []
    for nome, peso in FACES:
        src = FONTS / nome
        if not src.exists():
            sys.exit(f"fonte ausente: {src}")
        b64 = base64.b64encode(src.read_bytes()).decode("ascii")
        out.append("@font-face{font-family:'Gotham';font-style:normal;"
                   f"font-weight:{peso};"
                   f"src:url(data:font/otf;base64,{b64}) format('opentype');}}")
    return "\n".join(out)


def data_uri(caminho: pathlib.Path) -> str:
    mime = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "webp": "webp",
            "svg": "svg+xml"}[caminho.suffix.lstrip(".").lower()]
    b64 = base64.b64encode(caminho.read_bytes()).decode("ascii")
    return f"data:image/{mime};base64,{b64}"


def foto() -> tuple:
    # a tratada vem primeiro: é a que tem o degradê de borda
    for arq in (HERE / "foto-tratada.webp", OUT / "foto.png", OUT / "foto.jpg"):
        if arq.exists():
            return "has-foto", (f'<img src="{data_uri(arq)}" '
                                f'alt="{_html.escape(ARTIGO["autor"])}">')
    return "sem-foto", ""


def cover(nome: str, classe: str, tag_foto: str, classe_foto: str,
          logo: str, modo: str = "cheia") -> str:
    a = ARTIGO
    return (
        f'<section class="cover {classe} {classe_foto}'
        f'{"" if modo == "cheia" else " " + modo}" '
        f'data-fmt="{nome}{"" if modo == "cheia" else "-" + modo}">'
        '<div class="bokeh"><span class="b1"></span><span class="b2"></span>'
        '<span class="b3"></span></div>'
        '<div class="halo"></div>'
        f'<div class="foto">{tag_foto}'
        '<div class="slot"><span>Retrato de<br>Leonardo Pivotto</span></div></div>'
        '<div class="piso"></div>'
        '<div class="texto">'
        f'<span class="tag">{_html.escape(a["tag"])}</span>'
        f'<h1 class="titulo">{_html.escape(a["titulo"])} '
        f'<span class="g">{_html.escape(a["titulo_g"])}</span></h1>'
        f'<p class="sub">{_html.escape(a["sub"])}</p>'
        '<div class="meta">'
        f'<span class="item">{ICONE_COLUNA}{_html.escape(a["coluna"])}</span>'
        '<span class="sep"></span>'
        f'<span class="item">{ICONE_TEMA}{_html.escape(a["tema"])}</span>'
        '</div>'
        f'<p class="autor">{_html.escape(a["autor"])}<span class="dot"></span>'
        f'<span class="cargo">{_html.escape(a["cargo"])}</span></p>'
        '</div>'
        f'<div class="logo"><img src="{logo}" alt="EJUP"></div>'
        '</section>')


def main() -> None:
    classe_foto, tag_foto = foto()
    if classe_foto == "sem-foto":
        print("aviso: foto.jpg não encontrada — o lugar do retrato sai marcado")
    logo = data_uri(LOGOS / "ejup-horizontal-white.svg")
    covers = "\n".join(
        cover(n, c, tag_foto, classe_foto, logo, modo)
        for modo in ("cheia", "limpa", "bg")
        for n, c, _, _ in FORMATOS)

    html = (HERE / "template.html").read_text(encoding="utf-8")
    for marca, valor in (("__FONT_FACES__", fontes()), ("__COVERS__", covers)):
        if marca not in html:
            sys.exit(f"marcador ausente: {marca}")
        html = html.replace(marca, valor)

    destino = OUT / "capas.html"
    destino.write_text(html, encoding="utf-8")
    print(f"gerado: {destino.name} ({destino.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
