#!/usr/bin/env python3
"""Carrossel — "Quando dois ministros decidem o contrário no mesmo caso".

Nove telas 1080×1440 sobre a sucessão de decisões monocráticas no STF em
setembro de 2026, pela lente do processo, sem tomar lado.

O gancho não é isca: é **assimetria real de informação**. O leitor viu a
manchete e não viu o mecanismo. E há uma crença errada circulando nos
comentários ("isso é papel do Senado") que a peça corrige com o artigo na mão.
Contrariar um erro popular com precisão gera discussão de quem sabe e de quem
achava que sabia, sem pedir comentário a ninguém.

Cada tela termina numa linha que a seguinte responde.

**Peça datada.** Retrata a situação em 10/09/2026, com sessão plenária
extraordinária marcada para 15/09. Reconferir antes de publicar.
"""

import base64
import html as _html
import pathlib

import figuras
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"

FACES = [("Gotham-Light.otf", 300), ("Gotham-Book.otf", 400),
         ("Gotham-Medium.otf", 500), ("Gotham-Bold.otf", 700),
         ("Gotham-Black.otf", 900)]

# O que liga as telas é o PLACAR DO CASO, em figuras.py: quatro atores numa
# régua fixa no alto, mudando de estado a cada tela. A moldura que se completa
# ficou no carrossel anterior; repetir dispositivo entre peças é o que faz
# virar template.
#
# Estados: '.' inerte · '+' agiu · 'x' decisão suspensa · '>' é a vez dele
#          '?' à espera

T = [
    # ---------------------------------------------------------------- 1
    {"fundo": "escuro", "foto": "pan", "ancora": "abaixo",
     "placar": "....",
     "titulo": [("k", "Em 48 horas, três ministros do STF decidiram sobre o "
                      "mesmo cargo. "),
                ("l", "O desempate não coube a "),
                ("g", "nenhum dos três.")],
     "corpo": ["Um afastou o diretor-geral da Polícia Federal. Outro o "
               "reintegrou. O terceiro suspendeu as duas decisões e convocou "
               "o Plenário."],
     "pilula": "Arraste: o que o processo diz sobre um ministro revisar outro"},

    # ---------------------------------------------------------------- 2
    {"fundo": "claro", "ancora": "meio", "numeral": "1",
     "placar": "++x?",
     "titulo": [("k", "Quatro movimentos "),
                ("l", "em pouco mais de "),
                ("g", "dois dias.")],
     "figura": "linha_do_tempo",
     "fecho": "Nos comentários, uma frase se repetiu."},

    # ---------------------------------------------------------------- 3
    {"fundo": "escuro", "foto": "congresso", "ancora": "abaixo",
     "placar": "++x?",
     "titulo": [("k", "“Um ministro não pode anular a decisão do outro. "),
                ("g", "Isso é papel do Senado.”")],
     "corpo": ["A primeira metade da frase está certa, e é exatamente o que a "
               "Presidência do STF apontou.",
               "A segunda metade troca de Poder."],
     "fecho": "O Senado entra em outro lugar, e é um lugar preciso."},

    # ---------------------------------------------------------------- 4
    {"fundo": "claro", "ancora": "meio", "numeral": "2",
     "placar": "++x?",
     "titulo": [("k", "O Senado julga o ministro. "),
                ("l", "Quem revisa a decisão é "),
                ("g", "o próprio tribunal.")],
     "figura": "dois_trilhos",
     "corpo": ["São trilhos separados. Um apura conduta de magistrado; o "
               "outro corrige conteúdo de decisão. Cada um resolve o seu."],
     "fecho": "Dentro do tribunal, então, o que corrige uma monocrática?"},

    # ---------------------------------------------------------------- 5
    {"fundo": "escuro", "foto": "pan", "ancora": "abaixo",
     "placar": "++x?",
     "titulo": [("k", "Num tribunal colegiado, "),
                ("l", "quem corrige o individual é "),
                ("g", "o coletivo.")],
     "corpo": ["A decisão de um ministro se submete ao órgão de que ele faz "
               "parte, e a Presidência tem competências próprias de "
               "ordenação. Ministro é par de ministro, e par não revisa par."],
     "figura": "colisao",
     "fecho": "São três caminhos, e eles não se confundem."},

    # ---------------------------------------------------------------- 6
    {"fundo": "claro", "ancora": "meio", "numeral": "3",
     "placar": "++x?",
     "titulo": [("k", "Três caminhos "),
                ("l", "que o processo oferece, e "),
                ("g", "nenhum é outro ministro.")],
     "figura": "convergencia",
     "fecho": "Foi o segundo caminho que se abriu primeiro."},

    # ---------------------------------------------------------------- 7
    {"fundo": "escuro", "foto": "pan", "ancora": "abaixo",
     "placar": "++>?",
     "titulo": [("k", "A Presidência suspendeu as duas decisões "),
                ("l", "e devolveu a palavra a "),
                ("g", "quem decide junto.")],
     "corpo": ["O fundamento invocado foi a sobreposição: decisões "
               "monocráticas sucessivas, sobre os mesmos fatos, com comandos "
               "incompatíveis entre si.",
               "O mérito fica com o Plenário."],
     "fecho": "15 de setembro, sessão extraordinária."},

    # ---------------------------------------------------------------- 8
    {"fundo": "claro", "ancora": "meio", "numeral": "4",
     "placar": "++x?",
     "titulo": [("k", "O caso passa. "),
                ("l", "A pergunta que ele abre "),
                ("g", "fica.")],
     "lista": [("1", "Até onde vai a monocrática?",
                "Qual o limite da decisão individual num órgão que existe "
                "para decidir em conjunto."),
               ("2", "O que a Presidência pode ordenar?",
                "Onde termina a ordenação do processo e começa a "
                "substituição do relator."),
               ("3", "Quando chamar o colegiado?",
                "Antes de a divergência aparecer, ou depois que ela já "
                "produziu efeitos no mundo.")],
     "figura": "eixo_aberto",
     "fecho": "É pergunta de desenho institucional, e ela sobrevive a este "
              "caso."},

    # ---------------------------------------------------------------- 9
    {"fundo": "escuro", "foto": "pan", "ancora": "abaixo",
     "placar": "++x>",
     "titulo": [("k", "Interpretar o próprio tempo "),
                ("l", "exige "),
                ("g", "repertório.")],
     "corpo": ["Descrevemos o mecanismo, sem defender resultado. Situação em "
               "10 de setembro de 2026: o Plenário decide no dia 15.",
               "Qual limite você defenderia para a decisão monocrática?"],
     "slogan": "Alma clássica, repertório contemporâneo."},
]


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


def logo_svg() -> str:
    return (LOGOS / "ejup-horizontal-navy.svg").read_text(encoding="utf-8")


def simbolo_svg() -> str:
    return (LOGOS / "ejup-symbol-navy.svg").read_text(encoding="utf-8")


def duo(nome: str) -> str:
    arq = HERE / "duotone" / f"{nome}.webp"
    if not arq.exists():
        return ""
    return ("data:image/webp;base64,"
            + base64.b64encode(arq.read_bytes()).decode("ascii"))


def anel_svg(parte: int, total: int, n: str, de: str, claro=False) -> str:
    """Anel com a fração marcada e o número dentro. Arco dourado sobre trilha
    em aço, como o anel de 29% do carrossel aprovado."""
    r, cx = 46, 56
    circ = 2 * 3.14159265 * r
    feito = circ * parte / total
    arco = "#9b6b26" if claro else "#f0b855"
    trilha = "#d9d6d0" if claro else "#304557"
    num = "#031c37" if claro else "#f0b855"
    apoio = "#5f6062" if claro else "#d1d3d4"
    return (f'<svg viewBox="0 0 112 112" xmlns="http://www.w3.org/2000/svg">'
            f'<circle cx="{cx}" cy="{cx}" r="{r}" fill="none" '
            f'stroke="{trilha}" stroke-width="11"/>'
            f'<circle cx="{cx}" cy="{cx}" r="{r}" fill="none" stroke="{arco}" '
            f'stroke-width="11" stroke-linecap="round" '
            f'stroke-dasharray="{feito:.1f} {circ:.1f}" '
            f'transform="rotate(-90 {cx} {cx})"/>'
            f'<text x="{cx}" y="{cx + 4}" text-anchor="middle" fill="{num}" '
            f'font-family="Gotham" font-size="34" font-weight="900" '
            f'letter-spacing="-.03em">{n}</text>'
            f'<text x="{cx}" y="{cx + 24}" text-anchor="middle" '
            f'fill="{apoio}" font-family="Gotham" font-size="12" '
            f'font-weight="500" letter-spacing=".1em">{de}</text></svg>')


def titulo_html(partes) -> str:
    return ('<h2 class="titulo">'
            + "".join(f'<span class="{k}">{_html.escape(t)}</span>'
                      for k, t in partes) + '</h2>')


def bloco_html(s: dict) -> str:
    p = []
    if s.get("titulo"):
        p.append(titulo_html(s["titulo"]))
    for t in s.get("corpo", []):
        p.append(f'<p class="corpo">{t}</p>')
    if s.get("lista"):
        itens = "".join(
            f'<div class="it"><span class="n">{n}</span>'
            f'<span class="t">{_html.escape(t)}'
            f'<small>{_html.escape(d)}</small></span></div>'
            for n, t, d in s["lista"])
        p.append(f'<div class="lista">{itens}</div>')
    if s.get("cartoes"):
        cs = "".join(
            f'<div class="c{" destaque" if dest else ""}">'
            f'<p class="i">{_html.escape(i.upper())}</p>'
            f'<p class="r">{_html.escape(r)}</p></div>'
            for i, r, dest in s["cartoes"])
        p.append(f'<div class="cartoes">{cs}</div>')
    if s.get("figura"):
        p.append('<div class="fig">'
                 + figuras.FIGURAS[s["figura"]](s["fundo"] == "claro")
                 + '</div>')
    if s.get("citacao"):
        txt, ref = s["citacao"]
        p.append(f'<div class="citacao"><p>{_html.escape(txt)}</p>'
                 f'<p class="ref">{_html.escape(ref)}</p></div>')
    if s.get("fonte"):
        p.append(f'<p class="fonte">{_html.escape(s["fonte"])}</p>')
    if s.get("fecho"):
        p.append(f'<p class="fecho">{s["fecho"]}</p>')
    if s.get("pilula"):
        p.append('<div class="pilula"><i>&rarr;</i><span>'
                 + _html.escape(s["pilula"]) + '</span></div>')
    if s.get("link"):
        p.append(f'<span class="link">{_html.escape(s["link"])}</span>')
    if s.get("slogan"):
        p.append('<div class="assina"><p class="m">EJUP</p>'
                 f'<p class="s">{_html.escape(s["slogan"])}</p></div>')
    return f'<div class="bloco {s["ancora"]}">{"".join(p)}</div>'


def slide_html(s: dict, i: int, logo: str, simbolo: str) -> str:
    claro = s["fundo"] == "claro"
    fundo = ""
    if s.get("foto") == "pan":
        # a enésima tela escura recebe a enésima fatia da faixa
        ordem = [j for j, t in enumerate(T) if t.get("foto") == "pan"]
        s = dict(s, foto=f"pan{ordem.index(i) + 1}")
    if s.get("foto") and duo(s["foto"]):
        fundo = f'<div class="foto"><img src="{duo(s["foto"])}" alt=""></div>'
    elif not claro:
        fundo = f'<div class="marca-fundo">{simbolo}</div>'
    numeral = (f'<div class="numeral">{s["numeral"]}</div>'
               if s.get("numeral") else "")
    return (f'<section class="slide {s["fundo"]}" data-i="{i}">'
            + fundo + numeral
            + f'<div class="placar">{figuras.placar(s["placar"], claro)}</div>'
            + bloco_html(s)
            + f'<div class="logo"><div>{logo}</div></div></section>')


def main() -> None:
    logo, simbolo = logo_svg(), simbolo_svg()
    corpo = "\n".join(slide_html(s, i, logo, simbolo) for i, s in enumerate(T))
    html = (HERE / "template.html").read_text(encoding="utf-8")
    for marca, valor in (("__FONT_FACES__", fontes()), ("__SLIDES__", corpo)):
        if marca not in html:
            sys.exit(f"marcador ausente: {marca}")
        html = html.replace(marca, valor)
    destino = OUT / "carrossel.html"
    destino.write_text(html, encoding="utf-8")
    print(f"gerado: {destino.name} ({destino.stat().st_size/1024:.0f} KB), "
          f"{len(T)} telas")


if __name__ == "__main__":
    main()
