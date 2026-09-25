#!/usr/bin/env python3
"""A Estante EJUP — quatro stories 1080×1920 sobre o livro da semana.

O conteúdo de cada edição vive num dicionário (TRIBOS, ZERO_A_UM...). Para a
próxima indicação, duplique o bloco, registre em EDICOES e rode:

    python3 _build/gerar.py --edicao <pasta> && python3 _build/render.py

A capa: se existir `capa.jpg` (ou .png) na pasta da edição, ela entra embutida
em base64. Se não existir, o lugar dela é desenhado como moldura pontilhada —
a peça sai inteira e a capa entra depois, sem refazer nada.
"""
import argparse
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
# Ela vem do argumento do livro, não de um enfeite: em "Tribos" o caminho é
# pessoas → propósito → alguém que lidera → tribo.
TRIBOS = {
    "pasta": "tribos",
    "escala": ["PESSOAS", "PROPÓSITO", "LIDERANÇA", "TRIBO"],
    "cabecalho": True,
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
            "slogan": "Alma clássica, repertório contemporâneo.",
        },
    ],
}

# De Zero a Um: o trilho vai literalmente do 0 ao 1, e a bola sai do zero no
# primeiro story e chega ao um no último. Edição feita depois da regra do
# Victor (set/2026): nada de rótulo no alto da tela, então sem cabeçalho; o
# nome do quadro passa para a ficha do livro.
ZERO_A_UM = {
    "pasta": "de-zero-a-um",
    "escala": ["PERGUNTAR", "CRIAR", "ENXERGAR", "CONSTRUIR"],
    "extremos": ("0", "1"),
    "cabecalho": False,
    "capa_quadrada": True,
    "teto": 132,
    "titulo": "De Zero a Um",
    "autor": "PETER THIEL",
    "sobre": "Com Blake Masters. O que aprender sobre empreendedorismo com o Vale do Silício.",
    "stories": [
        {
            "titulo": ("Toda grande construção começa com uma pergunta "
                       "desconfortável: <b>o que ainda não existe e deveria "
                       "existir?</b>"),
            "corpo": ["A indicação de leitura de hoje é <b>“De Zero a Um”</b>, "
                      "de Peter Thiel."],
            "livro": True,
            "pilula": "Avance e entenda por que este livro conversa com o "
                      "que discutimos aqui",
        },
        {
            "titulo": ("Repetir o que funciona leva de um a muitos. "
                       "<b>Criar leva de zero a um.</b>"),
            "corpo": [
                "Para Peter Thiel, o progresso que muda o jogo nasce de fazer "
                "algo que ainda não existia.",
                "Competir pelo que já existe é disputar as sobras. Construir o "
                "que ainda não existe <b>abre um caminho inteiro</b>.",
            ],
        },
        {
            "titulo": ("No Direito, a pergunta é a mesma: <b>onde ele ainda "
                       "não chegou?</b>"),
            "corpo": [
                "Aqui na EJUP, é essa a lógica que buscamos aplicar. A "
                "advocacia tradicional é a base, e a partir dela enxergamos "
                "onde o Direito ainda não chegou para construir estrutura "
                "até lá.",
                "Cada novo caminho profissional que discutimos aqui nasce da "
                "mesma pergunta: <b>o que ainda não existe nesse mercado e "
                "pode ser construído?</b>",
            ],
        },
        {
            "titulo": "Ir de zero a um exige <b>critério e coragem</b>.",
            "corpo": [
                "Critério para reconhecer o caminho já pavimentado. Coragem "
                "para construir o trecho que ainda falta.",
                "Aqui na EJUP, é esse tipo de construção que buscamos inspirar.",
            ],
            "pergunta": "Qual “zero a um” você está construindo na sua "
                        "carreira? Conta pra gente no direct.",
            "slogan": "Alma clássica, repertório contemporâneo.",
        },
    ],
}

EDICOES = {e["pasta"]: e for e in (TRIBOS, ZERO_A_UM)}


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


def capa_html(pasta: pathlib.Path, titulo: str, autor: str,
              quadrada: bool = False) -> str:
    classe = "capa quadrada" if quadrada else "capa"
    for ext, mime in (("jpg", "jpeg"), ("jpeg", "jpeg"), ("png", "png")):
        arq = pasta / f"capa.{ext}"
        if arq.exists():
            b64 = base64.b64encode(arq.read_bytes()).decode("ascii")
            return (f'<div class="{classe}">'
                    f'<img src="data:image/{mime};base64,{b64}" '
                    f'alt="Capa de {_html.escape(titulo)}"></div>')
    return ('<div class="capa vazia"><b>CAPA</b>'
            '<span>solte o arquivo em<br>capa.jpg e rode de novo</span></div>')


def escala_html(i: int, escala: list, extremos=None) -> str:
    n = len(escala)
    if not extremos:
        # a bola cai no centro de cada quarto do trilho
        pos = (i + 0.5) / n * 100
        passos = "".join(
            f'<span class="{"aqui" if j == i else ""}">{p}</span>'
            for j, p in enumerate(escala))
        return ('<div class="escala"><div class="trilho">'
                f'<div class="feito" style="width:{pos:.2f}%"></div>'
                f'<div class="bola" style="left:{pos:.2f}%"></div></div>'
                f'<div class="passos">{passos}</div></div>')
    # com extremos, a bola vai da ponta do zero (primeiro story) à do um (último)
    pos = i / (n - 1) * 100
    marcas = "".join(
        f'<span class="{"aqui" if j == i else ""}" '
        f'style="left:{j / (n - 1) * 100:.2f}%">{p}</span>'
        for j, p in enumerate(escala))
    ini, fim = extremos
    return ('<div class="escala extremos">'
            f'<b class="ponta {"aqui" if i == 0 else ""}">{ini}</b>'
            '<div class="meio"><div class="trilho">'
            f'<div class="feito" style="width:{pos:.2f}%"></div>'
            f'<div class="bola" style="left:{pos:.2f}%"></div></div>'
            f'<div class="marcas">{marcas}</div></div>'
            f'<b class="ponta {"aqui" if i == n - 1 else ""}">{fim}</b></div>')


def story_html(s: dict, i: int, simbolo: str, logo: str, capa: str,
               livro: dict) -> str:
    partes = [f'<div class="titulo">{s["titulo"]}</div>',
              '<div class="corpo">' +
              "".join(f"<p>{p}</p>" for p in s["corpo"]) + "</div>"]
    if s.get("livro"):
        partes.append(
            '<div class="livro">' + capa +
            '<div class="ficha">'
            + ('' if livro.get("cabecalho", True)
               else '<p class="serie-ficha">A ESTANTE EJUP</p>') +
            f'<h3>{_html.escape(livro["titulo"])}</h3>'
            f'<p class="autor">{_html.escape(livro["autor"])}</p>'
            f'<p class="sobre">{_html.escape(livro["sobre"])}</p>'
            '</div></div>')
    if s.get("pilula"):
        partes.append('<div class="pilula"><i>&rarr;</i><span>'
                      + s["pilula"] + '</span></div>')
    if s.get("pergunta"):
        partes.append('<div class="fecho">'
                      f'<p class="pergunta">{s["pergunta"]}</p></div>')
    if s.get("slogan"):
        partes.append('<div class="assina"><p class="marca">EJUP</p>'
                      f'<p class="slogan">{_html.escape(s["slogan"])}</p></div>')

    cab = ('<div class="cab"><div class="linha"><span class="serie">'
           'A ESTANTE EJUP</span></div>'
           f'<p class="etapa">{_html.escape(s["etapa"])}</p></div>'
           if livro.get("cabecalho", True) else "")
    return (
        f'<div class="story{"" if cab else " sem-cab"}" data-i="{i}" '
        f'data-teto="{livro.get("teto", 100)}">'
        f'<div class="marca-fundo">{simbolo}</div>'
        + cab + escala_html(i, livro["escala"], livro.get("extremos")) +
        '<div class="conteudo">' + "".join(partes) + '</div>'
        f'<div class="logo">{logo}</div>'
        '</div>')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--edicao", default=ZERO_A_UM["pasta"], choices=EDICOES)
    LIVRO = EDICOES[ap.parse_args().edicao]
    pasta = HERE.parent / LIVRO["pasta"]
    pasta.mkdir(exist_ok=True)
    capa = capa_html(pasta, LIVRO["titulo"], LIVRO["autor"],
                     LIVRO.get("capa_quadrada", False))
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
