#!/usr/bin/env python3
"""EJUP — Capa de artigo (coluna jurídica do site).

Embute fontes Gotham + logos no template e gera a peça final.
Saída: ../capa.html
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
SKILL = HERE.parents[2] / "skills" / "ejup-design"
FONTS = SKILL / "assets" / "fonts"
LOGOS = SKILL / "assets" / "logo"
TOKENS = SKILL / "tokens"

FONT_WEIGHTS = {
    "Gotham-Light.otf": 300,
    "Gotham-Book.otf": 400,
    "Gotham-Medium.otf": 500,
    "Gotham-Bold.otf": 700,
    "Gotham-Black.otf": 900,
}


def b64(path: pathlib.Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("ascii")


def font_face_css() -> str:
    blocks = []
    for filename, weight in FONT_WEIGHTS.items():
        src = FONTS / filename
        blocks.append(
            "@font-face{font-family:'Gotham';font-style:normal;"
            f"font-weight:{weight};"
            f"src:url(data:font/otf;base64,{b64(src)}) format('opentype');}}"
        )
    return "\n".join(blocks)


def svg_inline(path: pathlib.Path) -> str:
    return "data:image/svg+xml;base64," + b64(path)


# (template, saída). O horizontal serve o site; o vertical, o feed.
FORMATOS = [
    ("template.html", "capa.html"),
    ("template-vertical.html", "capa-1080x1440.html"),
]


def main() -> None:
    for tpl, out in FORMATOS:
        build_one(HERE / tpl, OUT / out)


def build_one(tpl: pathlib.Path, dest: pathlib.Path) -> None:
    html = tpl.read_text(encoding="utf-8")
    replacements = {
        "__FONT_FACES__": font_face_css(),
        "__LOGO_WHITE__": svg_inline(LOGOS / "ejup-horizontal-white.svg"),
    }

    # o recorte com alpha (PNG) tem prioridade sobre a foto chapada
    photo_path = next((p for p in (OUT / "foto-autores.png", OUT / "foto-autores.jpg")
                       if p.exists()), OUT / "foto-autores.jpg")
    if photo_path.exists():
        mime = "image/jpeg" if photo_path.suffix.lower() in (".jpg", ".jpeg") else "image/png"
        img_tag = (
            f'<img src="data:{mime};base64,{b64(photo_path)}" '
            'alt="Thiago Praxedes de Vasconcelos e Thiago de Moura Correia">'
        )
        replacements["__FOTO_TAG__"] = img_tag
        replacements["__FOTO_CLASS__"] = "has-photo"
    else:
        # Sem arquivo real: nenhuma tag <img> — evita o ícone de imagem quebrada
        # e o alt-text vazando por cima do painel.
        replacements["__FOTO_TAG__"] = ""
        replacements["__FOTO_CLASS__"] = "no-photo"

    for token, value in replacements.items():
        if token not in html:
            raise SystemExit(f"token não encontrado: {token}")
        html = html.replace(token, value)

    dest.write_text(html, encoding="utf-8")
    print(f"gerado: {dest.name}  ({len(html)/1024:.0f} KB)  "
          f"foto={'sim' if photo_path.exists() else 'placeholder'}")


if __name__ == "__main__":
    main()
