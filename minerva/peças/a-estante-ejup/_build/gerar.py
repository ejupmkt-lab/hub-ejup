#!/usr/bin/env python3
"""A Estante EJUP — quatro stories 1080×1920 sobre o livro da semana.

O conteúdo de cada edição vive no dicionário LIVRO. Para a próxima indicação,
duplique o bloco, troque o texto e rode:

    python3 _build/gerar.py && python3 _build/render.py

A capa: se existir `capa.jpg` (ou .png) na pasta da edição, ela entra embutida
em base64. Se não existir, o lugar dela é desenhado como moldura pontilhada —
a peça sai inteira e a capa entra depois, sem refazer nada.
"""
import base64
import html as _html
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"

FACES = [("Gotham-Light.otf", 300), ("Gotham-Book.otf", 400),
         ("Gotham-Medium.otf", 500), ("Gotham-Black.otf", 900)]

# A escala é o fio que costura os quatro stories: a mesma ideia avançando.
# Ela vem do argumento do livro, não de um enfeite — em "Tribos" o caminho é
# pessoas → propósito → alguém que lidera → tribo.
ESCALA = ["PESSOAS", "PROPÓSITO", "LIDERANÇA", "TRIBO"]

LIVRO = {
    "pasta": "tribos",
    "titulo": "Tribos",
    "autor": "SETH GODIN",
    "sobre": "“Nós precisamos que você nos lidere.”",
    "stories": [
        {
            "etapa": "LIVRO DA SEMANA",
            "titulo": ("Toda transformação começa com alguém disposto a reunir "
                       "pessoas <b>em torno de um propósito</b>."),
            "corpo": ["A indicação de leitura de hoje é <b>“Tribos”</b>, "
                      "de Seth Godin."],
            "livro": True,
            "pilula": "Arraste para o lado e entenda por que este livro "
                      "conversa com o que discutimos aqui",
        },
        {
            "etapa": "A IDEIA",
            "titulo": "Uma tribo não nasce de um <b>produto</b> nem de um <b>cargo</b>.",
            "corpo": [
                "Para Seth Godin, ela nasce de um propósito compartilhado e "
                "de alguém disposto a guiar esse grupo.",
                "Comunidades fortes não se formam em torno do que uma marca "
                "vende, mas <b>do que ela representa</b>.",
            ],
        },
        {
            "etapa": "NA PRÁTICA",
            "titulo": "Queremos reunir uma comunidade em torno de um "
                      "<b>propósito comum</b>.",
            "corpo": [
                "Aqui na EJUP é esse o caminho que buscamos construir. Não "
                "queremos apenas formar profissionais do Direito: queremos "
                "pensar o Direito com inovação, estratégia e visão de negócio.",
                "Cada conteúdo que produzimos, sobre carreira, empreendedorismo "
                "jurídico ou gestão, é parte da construção dessa comunidade.",
            ],
        },
        {
            "etapa": "POR QUE INDICAMOS",
            "titulo": "Construir uma tribo é um <b>exercício constante</b>.",
            "corpo": [
                "Exige propósito claro, consistência e alguém disposto a "
                "liderar essa conversa todos os dias.",
                "Aqui na EJUP, é isso que nos move.",
            ],
            "livro": True,
            "pergunta": "Qual propósito você tem construído em volta do seu "
                        "trabalho? Conta pra gente no direct.",
            "assina": "EJUP. <b>Alma clássica, repertório contemporâneo.</b>",
        },
    ],
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
    return caminho.read_text(encoding="utf-8").strip()


def capa_html(pasta: pathlib.Path, titulo: str, autor: str) -> str:
    for ext, mime in (("jpg", "jpeg"), ("jpeg", "jpeg"), ("png", "png")):
        arq = pasta / f"capa.{ext}"
        if arq.exists():
            b64 = base64.b64encode(arq.read_bytes()).decode("ascii")
            return ('<div class="capa">'
                    f'<img src="data:image/{mime};base64,{b64}" '
                    f'alt="Capa de {_html.escape(titulo)}"></div>')
    return ('<div class="capa vazia"><b>CAPA</b>'
            '<span>solte o arquivo em<br>capa.jpg e rode de novo</span></div>')


def escala_html(i: int) -> str:
    # a bola cai no centro de cada quarto do trilho
    pos = (i + 0.5) / len(ESCALA) * 100
    passos = "".join(
        f'<span class="{"aqui" if j == i else ""}">{p}</span>'
        for j, p in enumerate(ESCALA))
    return ('<div class="escala"><div class="trilho">'
            f'<div class="feito" style="width:{pos:.2f}%"></div>'
            f'<div class="bola" style="left:{pos:.2f}%"></div></div>'
            f'<div class="passos">{passos}</div></div>')


def story_html(s: dict, i: int, simbolo: str, logo: str, capa: str,
               livro: dict) -> str:
    partes = [f'<div class="titulo">{s["titulo"]}</div>',
              '<div class="corpo">' +
              "".join(f"<p>{p}</p>" for p in s["corpo"]) + "</div>"]
    if s.get("livro"):
        partes.append(
            '<div class="livro">' + capa +
            '<div class="ficha">'
            f'<h3>{_html.escape(livro["titulo"])}</h3>'
            f'<p class="autor">{_html.escape(livro["autor"])}</p>'
            f'<p class="sobre">{_html.escape(livro["sobre"])}</p>'
            '</div></div>')
    if s.get("pilula"):
        partes.append('<div class="pilula"><i>&rarr;</i><span>'
                      + s["pilula"] + '</span></div>')
    if s.get("pergunta") or s.get("assina"):
        fecho = '<div class="fecho">'
        if s.get("pergunta"):
            fecho += f'<p class="pergunta">{s["pergunta"]}</p>'
        if s.get("assina"):
            fecho += f'<p class="assina">{s["assina"]}</p>'
        partes.append(fecho + "</div>")

    return (
        f'<div class="story" data-i="{i}">'
        f'<div class="marca-fundo">{simbolo}</div>'
        '<div class="cab"><div class="linha"><span class="serie">'
        'A ESTANTE EJUP</span></div>'
        f'<p class="etapa">{_html.escape(s["etapa"])}</p></div>'
        + escala_html(i) +
        '<div class="conteudo">' + "".join(partes) + '</div>'
        f'<div class="logo">{logo}</div>'
        '</div>')


def main() -> None:
    pasta = HERE.parent / LIVRO["pasta"]
    pasta.mkdir(exist_ok=True)
    capa = capa_html(pasta, LIVRO["titulo"], LIVRO["autor"])
    if "capa vazia" in capa:
        print("aviso: capa.jpg não encontrada — a moldura pontilhada fica no lugar")

    simbolo, logo = svg("ejup-symbol-navy.svg"), svg("ejup-horizontal-navy.svg")
    stories = "\n".join(
        story_html(s, i, simbolo, logo, capa, LIVRO)
        for i, s in enumerate(LIVRO["stories"]))

    html = (HERE / "template.html").read_text(encoding="utf-8")
    for marca, valor in (("__FONT_FACES__", fontes()), ("__STORIES__", stories)):
        if marca not in html:
            sys.exit(f"marcador ausente: {marca}")
        html = html.replace(marca, valor)

    destino = pasta / "stories.html"
    destino.write_text(html, encoding="utf-8")
    print(f"gerado: {destino.relative_to(HERE.parent)} "
          f"({destino.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
