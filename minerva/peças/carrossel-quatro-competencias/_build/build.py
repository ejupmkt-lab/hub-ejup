#!/usr/bin/env python3
"""EJUP — Carrossel "As quatro colunas".

Monta o carrossel a partir de `template.html`, embutindo fontes Gotham, logos e
tokens do design system em base64/inline, de modo que o HTML final rode sozinho
(sem depender de caminhos relativos) tanto no navegador quanto no headless.

Saída: ../carrossel.html
"""
import base64
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
SKILL = HERE.parents[2] / "skills" / "ejup-design"
FONTS = SKILL / "assets" / "fonts"
LOGOS = SKILL / "assets" / "logo"
TOKENS = SKILL / "tokens"

FONT_WEIGHTS = {
    "Gotham-Thin.otf": 200,
    "Gotham-Light.otf": 300,
    "Gotham-Book.otf": 400,
    "Gotham-Medium.otf": 500,
    "Gotham-Bold.otf": 700,
    "Gotham-Black.otf": 900,
}


def b64(path: pathlib.Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


def font_face_css() -> str:
    """@font-face com os OTF embutidos. Gotham-BookItalic é omitido de
    propósito: o arquivo é declarado no design system mas não existe no pacote,
    e itálico sintético não passa no padrão da marca."""
    blocks = []
    for filename, weight in FONT_WEIGHTS.items():
        src = FONTS / filename
        if not src.exists():
            raise SystemExit(f"fonte ausente: {src}")
        blocks.append(
            "@font-face{font-family:'Gotham';font-style:normal;"
            f"font-weight:{weight};"
            f"src:url(data:font/otf;base64,{b64(src)}) format('opentype');}}"
        )
    return "\n".join(blocks)


def svg_inline(path: pathlib.Path) -> str:
    """SVG como data URI, para uso em <img src>."""
    return "data:image/svg+xml;base64," + b64(path)


def tokens_css() -> str:
    """Só os tokens que a peça usa. `fonts.css` fica de fora porque as fontes
    já entram embutidas por font_face_css()."""
    parts = []
    for name in ("colors.css", "typography.css", "spacing.css"):
        parts.append((TOKENS / name).read_text(encoding="utf-8"))
    css = "\n".join(parts)
    # `styles.css` resolveria os @import; aqui já concatenamos, então removemos.
    return re.sub(r'@import\s+"[^"]+";', "", css)


def main() -> None:
    html = (HERE / "template.html").read_text(encoding="utf-8")

    replacements = {
        "__FONT_FACES__": font_face_css(),
        "__TOKENS_CSS__": tokens_css(),
        "__LOGO_WHITE__": svg_inline(LOGOS / "ejup-horizontal-white.svg"),
        "__LOGO_NAVY__": svg_inline(LOGOS / "ejup-horizontal-navy.svg"),
        "__SYMBOL_WHITE__": svg_inline(LOGOS / "ejup-symbol-white.svg"),
        "__SYMBOL_NAVY__": svg_inline(LOGOS / "ejup-symbol-navy.svg"),
    }
    for token, value in replacements.items():
        if token not in html:
            raise SystemExit(f"token não encontrado no template: {token}")
        html = html.replace(token, value)

    dest = OUT / "carrossel.html"
    dest.write_text(html, encoding="utf-8")
    print(f"gerado: {dest}  ({len(html)/1024:.0f} KB)")


if __name__ == "__main__":
    main()
