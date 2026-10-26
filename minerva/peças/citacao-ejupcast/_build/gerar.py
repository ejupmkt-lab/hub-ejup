#!/usr/bin/env python3
"""Arte de citação do EJUPcast — a peça branca com a frase do convidado.

Modelo reaproveitável: a cada episódio muda só o bloco CITACAO (ou os
argumentos de linha de comando). Gera o HTML e o PNG 1080×1440.

    python3 _build/gerar.py --episodio 017 \
        --nome "Zeca Melo" --funcao "Diretor Superintendente do SEBRAE/RN" \
        --frase "Se você <b>gosta</b> do que está querendo fazer, você <b>parte na frente</b>."

Regras da marca que estão embutidas aqui: acento é bronze (#9b6b26), porque o
fundo é claro e dourado sobre branco dá 1,8:1; frase em Gotham Light com o
destaque em Bold; rótulo em Medium, caixa alta, tracking 0,14em.
"""
import argparse
import base64
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"

FACES = [("Gotham-Light.otf", 300), ("Gotham-Book.otf", 400),
         ("Gotham-Medium.otf", 500), ("Gotham-Bold.otf", 700),
         ("Gotham-Black.otf", 900)]

CITACAO = {
    "episodio": "017",
    "nome": "Zeca Melo",
    "funcao": "Diretor Superintendente do SEBRAE/RN",
    "frase": ("Se você <b>gosta</b> do que está querendo fazer, "
              "você <b>parte&nbsp;na&nbsp;frente</b>."),
}


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


def svg(nome: str) -> str:
    caminho = LOGOS / nome
    if not caminho.exists():
        sys.exit(f"logo ausente: {caminho}")
    # o SVG vem com comentários e quebras; entra inteiro, sem o cabeçalho XML
    return re.sub(r"<\?xml.*?\?>", "", caminho.read_text(encoding="utf-8")).strip()


def main() -> None:
    ap = argparse.ArgumentParser()
    for campo in CITACAO:
        ap.add_argument("--" + campo, default=CITACAO[campo])
    a = ap.parse_args()

    html = (HERE / "template.html").read_text(encoding="utf-8")
    troca = {
        "__FONT_FACES__": fontes(),
        "__SIMBOLO__": svg("ejup-symbol-navy.svg"),
        "__LOGO__": svg("ejup-horizontal-navy.svg"),
        "__FRASE__": a.frase,
        "__NOME__": a.nome,
        "__FUNCAO__": a.funcao,
        "__ORIGEM__": f"Dito no EJUPcast · Episódio #{a.episodio}",
    }
    for k, v in troca.items():
        if k not in html:
            sys.exit(f"marcador não encontrado no template: {k}")
        html = html.replace(k, v)

    destino = OUT / f"citacao-{a.episodio}.html"
    destino.write_text(html, encoding="utf-8")
    print(f"gerado: {destino.name} ({destino.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
