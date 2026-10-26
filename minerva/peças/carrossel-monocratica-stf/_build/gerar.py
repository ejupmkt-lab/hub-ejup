#!/usr/bin/env python3
"""Carrossel — "Quando dois ministros decidem o contrário no mesmo caso".

Nove telas 1080×1440 sobre a sucessão de decisões monocráticas no STF em
setembro de 2026, pela lente do processo, sem tomar lado.

O gancho é **assimetria real de informação**: o leitor viu a manchete e não
viu o mecanismo. E há uma crença errada circulando nos comentários ("isso é
papel do Senado") que a peça corrige com o artigo na mão. Cada tela termina
numa linha que a seguinte responde.

O dispositivo visual são AS CAMADAS: cada decisão é um painel translúcido, e
a composição evolui de tela em tela. Uma ordem entra pela borda; duas se
cruzam e a zona do cruzamento fica hachurada; uma frase popular passa por
cima delas; Senado e tribunal se separam em duas colunas; o colegiado cerca a
decisão individual; três caminhos saem da pilha; a Presidência congela as
duas numa moldura tracejada; a pilha se recolhe atrás de um painel dourado
único, o Plenário; e o caso fica arquivado, alinhado, ao fim. Sem foto, sem
alternância claro/escuro: o mesmo objeto mudando de estado.

**Peça datada.** Situação em 10/09/2026, sessão plenária extraordinária
marcada para 15/09. Reconferir antes de publicar.
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

GOLD, SILVER, STEEL = "#f0b855", "#d1d3d4", "#304557"

# Os painéis, um por decisão. A composição de cada tela usa o subconjunto.
PAINEIS = {
    "afasta": ("1ª decisão · ministro Mendonça", "AFASTA",
               "o diretor-geral da PF deixa o cargo"),
    "reintegra": ("2ª decisão · ministro Dino", "REINTEGRA",
                  "o mesmo diretor volta ao cargo"),
    "suspende": ("Presidência · ministro Fachin", "SUSPENDE",
                 "as duas decisões, até o Plenário"),
    "plenario": ("15 de setembro · sessão extraordinária", "PLENÁRIO",
                 "onze ministros decidem juntos"),
}


# ---------------------------------------------------------------- peças
def duo(nome: str) -> str:
    arq = HERE / "duotone" / f"{nome}.webp"
    if not arq.exists():
        sys.exit(f"foto tratada ausente: {arq} (rode tratar_fotos.py)")
    return ("data:image/webp;base64,"
            + base64.b64encode(arq.read_bytes()).decode("ascii"))


def foto(nome):
    return f'<div class="foto"><img src="{duo(nome)}" alt=""></div>'


def caixa(nome, x, y, w, h):
    return (f'<div class="caixa" style="left:{x}px;top:{y}px;width:{w}px;'
            f'height:{h}px"><img src="{duo(nome)}" alt=""></div>')


def painel(nome, x, y, cls="a", escala=1.0, selo=None, rot=None,
           vazio=False, foto=None):
    car, verbo, de = PAINEIS[nome]
    ang = 0 if rot is None else rot
    selo_html = f'<div class="selo">{selo}</div>' if selo else ""
    if vazio:  # folha atrás da pilha: só a borda, sem texto
        return (f'<div class="painel {cls}" style="left:{x}px;top:{y}px;'
                f'transform-origin:0 0;transform:rotate({ang}deg) '
                f'scale({escala})"></div>')
    dentro = (f'<div class="dentro"><img src="{duo(foto)}" alt=""></div>'
              if foto else "")
    return (f'<div class="painel {cls}" style="left:{x}px;top:{y}px;'
            f'transform-origin:0 0;transform:rotate({ang}deg) scale({escala})">'
            f'{dentro}<div class="car">{_html.escape(car)}</div>'
            f'<div><div class="verbo">{verbo}</div>'
            f'<div class="de">{_html.escape(de)}</div></div>{selo_html}</div>')


def choque(x, y, w, h, opac=1.0):
    return (f'<div class="choque" style="left:{x}px;top:{y}px;width:{w}px;'
            f'height:{h}px;opacity:{opac}"></div>')


def tag(txt, x, y, cinza=False):
    return (f'<div class="tag{" cinza" if cinza else ""}" '
            f'style="left:{x}px;top:{y}px">{_html.escape(txt)}</div>')


def legenda(titulo, txt, x, y, w=300, ouro=False):
    return (f'<div class="legenda" style="left:{x}px;top:{y}px;width:{w}px">'
            f'<b{" class=ouro" if ouro else ""}>{_html.escape(titulo)}</b>'
            f'{_html.escape(txt)}</div>')


def hair(x, y, w, h):
    return (f'<div class="hair" style="left:{x}px;top:{y}px;width:{w}px;'
            f'height:{h}px"></div>')


def fio(x, y, w, h, svg_inner):
    return (f'<div class="fio" style="left:{x}px;top:{y}px;width:{w}px;'
            f'height:{h}px"><svg viewBox="0 0 {w} {h}" '
            f'xmlns="http://www.w3.org/2000/svg">{svg_inner}</svg></div>')


def congela(x, y, w, h, rot):
    return (f'<div class="congela" style="left:{x}px;top:{y}px;width:{w}px;'
            f'height:{h}px"><span class="rot">{_html.escape(rot)}</span></div>')


# ---------------------------------------------------------------- figuras
def linha_do_tempo(px=80, py=1060, w=920):
    """Quatro movimentos numa régua; a chave de 48 h cobre os três primeiros."""
    h = 150
    passo = (w - 120) / 3
    xs = [60 + i * passo for i in range(4)]
    nomes = [("afasta", "1ª monocrática"), ("reintegra", "2ª monocrática"),
             ("suspende as duas", "Presidência"), ("Plenário", "15 de setembro")]
    y = 78
    s = [f'<line x1="{xs[0]}" y1="{y}" x2="{xs[-1]}" y2="{y}" '
         f'stroke="{SILVER}" stroke-opacity=".35" stroke-width="2"/>']
    for i, (x, (n, sub)) in enumerate(zip(xs, nomes)):
        cor = GOLD if i < 3 else SILVER
        fill = GOLD if i < 3 else "none"
        s.append(f'<circle cx="{x}" cy="{y}" r="9" fill="{fill}" '
                 f'stroke="{cor}" stroke-width="3"/>')
        s.append(f'<text x="{x}" y="{y + 40}" text-anchor="middle" '
                 f'fill="#fff" font-family="Gotham" font-weight="700" '
                 f'font-size="20">{n}</text>')
        s.append(f'<text x="{x}" y="{y + 64}" text-anchor="middle" '
                 f'fill="{SILVER}" fill-opacity=".8" font-family="Gotham" '
                 f'font-weight="300" font-size="17">{sub}</text>')
    # chave das 48 horas
    s.append(f'<path d="M{xs[0]} 34 v-12 h{xs[2] - xs[0]} v12" fill="none" '
             f'stroke="{GOLD}" stroke-width="2"/>')
    s.append(f'<text x="{(xs[0] + xs[2]) / 2}" y="14" text-anchor="middle" '
             f'fill="{GOLD}" font-family="Gotham" font-weight="500" '
             f'font-size="17" letter-spacing="3">48 HORAS</text>')
    return fio(px, py, w, h, "".join(s))


def pessoa(x, y):
    """Silhueta institucional: a pessoa do ministro, e só ela."""
    w, h = 200, 220
    s = (f'<circle cx="100" cy="62" r="46" fill="none" stroke="{GOLD}" '
         f'stroke-width="3"/>'
         f'<path d="M22 214 a78 78 0 0 1 156 0" fill="none" stroke="{GOLD}" '
         f'stroke-width="3"/>')
    return fio(x, y, w, h, s)


def colegiado(cx, cy, r):
    """Onze assentos em círculo. Um só destacado: o que decidiu sozinho."""
    import math
    s = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" '
         f'stroke="{SILVER}" stroke-opacity=".28" stroke-width="2" '
         f'stroke-dasharray="4 10"/>']
    for i in range(11):
        a = -math.pi / 2 + i * 2 * math.pi / 11
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        if i == 0:
            s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="26" '
                     f'fill="{GOLD}"/>')
            s.append(f'<text x="{x:.1f}" y="{y + 7:.1f}" text-anchor="middle" '
                     f'fill="#031c37" font-family="Gotham" font-weight="900" '
                     f'font-size="20">1</text>')
        else:
            s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="22" fill="none" '
                     f'stroke="{GOLD}" stroke-width="3"/>')
    s.append(f'<text x="{cx}" y="{cy + r + 62}" text-anchor="middle" '
             f'fill="{SILVER}" font-family="Gotham" font-weight="500" '
             f'font-size="19" letter-spacing="4">ONZE MINISTROS</text>')
    m = r + 30
    inner = "".join(s).replace(f'cx="{cx}"', f'cx="{m}"')
    # coordenadas relativas à caixa do desenho
    import re
    inner = re.sub(r'cx="([\d.]+)" cy="([\d.]+)"',
                   lambda k: f'cx="{float(k[1]) - cx + m:.1f}" '
                             f'cy="{float(k[2]) - cy + m:.1f}"', "".join(s))
    inner = re.sub(r'<text x="([\d.]+)" y="([\d.]+)"',
                   lambda k: f'<text x="{float(k[1]) - cx + m:.1f}" '
                             f'y="{float(k[2]) - cy + m:.1f}"', inner)
    return fio(cx - m, cy - m, 2 * m, 2 * m + 60, inner)


def tres_caminhos(y0):
    """Da pilha, três traços para três destinos. Nenhum deles é um par."""
    w, h = 920, 460
    dest = [("1", "AGRAVO INTERNO", "o colegiado revisa a decisão"),
            ("2", "PRESIDÊNCIA", "ordena o andamento do processo"),
            ("3", "PREVENÇÃO", "define quem é o relator do caso")]
    s = []
    x0, x1 = 320, 390
    ys = [70, 170, 420]
    for (n, t, d), y in zip(dest, ys):
        if n == "2":  # o traço chega ao card que sai pela borda
            s.append(f'<path d="M{x0} 230 C {x0 + 160} 230, {SAI - 80 - 160} '
                     f'{y}, {SAI - 80} {y}" fill="none" stroke="{GOLD}" '
                     f'stroke-width="2"/>')
            continue
        s.append(f'<path d="M{x0} 230 C {x0 + 120} 230, {x1 - 120} {y}, '
                 f'{x1} {y}" fill="none" stroke="{GOLD}" stroke-width="2"/>')
        s.append(f'<circle cx="{x1}" cy="{y}" r="7" fill="{GOLD}"/>')
        s.append(f'<text x="{x1 + 24}" y="{y - 8}" fill="{GOLD}" '
                 f'font-family="Gotham" font-weight="500" font-size="19" '
                 f'letter-spacing="4">{n} · {t}</text>')
        s.append(f'<text x="{x1 + 24}" y="{y + 22}" fill="{SILVER}" '
                 f'font-family="Gotham" font-weight="300" font-size="21">'
                 f'{d}</text>')
    return fio(80, y0, w, h, "".join(s))


# ---------------------------------------------------------------- telas
# Grade: cards de 520×340, sem rotação, sempre nas mesmas linhas (y = 300,
# 470, 610). A conexão entre telas é o card ATRAVESSANDO a borda: sai cortado
# à direita (x = 820) e entra pela esquerda da tela seguinte (x = -260).
# Telas 7 e 8 dividem uma única fotografia da sessão plenária.
SAI, ENTRA = 820, -260


def palco_1():
    return [foto("estatua"),
            tag("A primeira camada", SAI, 264, cinza=True),
            painel("afasta", SAI, 300, "a", selo="1")]


def palco_2():
    return [painel("afasta", ENTRA, 300, "a", selo="1"),
            painel("reintegra", SAI, 610, "b", selo="2"),
            linha_do_tempo(80, 990, 920)]


def palco_3():
    # lado a lado, na mesma linha: o card que entrou e o que já estava
    return [painel("reintegra", ENTRA, 610, "b apagado", selo="2"),
            painel("afasta", 300, 610, "a apagado", selo="1")]


def palco_4():
    return [hair(539, 500, 2, 520),
            caixa("senado", 80, 552, 420, 468),
            tag("Senado", 80, 500), pessoa(190, 600),
            legenda("A pessoa", "Julga o ministro por crime de "
                    "responsabilidade. Nada diz sobre a decisão.", 100, 860, 380),
            caixa("tribunal", 580, 552, 420, 468),
            tag("Tribunal", 580, 500),
            painel("afasta", 604, 600, "a apagado", .45),
            painel("reintegra", 680, 680, "b", .45),
            legenda("O ato", "Revisa o conteúdo da decisão pelas vias do "
                    "próprio processo.", 600, 860, 380)]


def palco_5():
    return [colegiado(540, 730, 215),
            painel("afasta", 431, 659, "a", .42)]


def palco_6():
    return [painel("afasta", 80, 600, "a apagado", .48),
            painel("reintegra", 120, 660, "b apagado", .48),
            tres_caminhos(520),
            painel("suspende", SAI, 470, "a", selo="P")]


def palco_7():
    return [foto("sessao-esq"),
            painel("suspende", ENTRA, 470, "a", selo="P"),
            congela(300, 470, 716, 340, "Suspensas"),
            painel("afasta", 330, 500, "a apagado", .5, selo="1"),
            painel("reintegra", 650, 590, "b apagado", .5, selo="2")]


def palco_8():
    return [foto("sessao-dir"),
            painel("afasta", SAI - 36, 404, "apagado", vazio=True),
            painel("reintegra", SAI - 18, 422, "apagado", vazio=True),
            painel("plenario", SAI, 440, "ouro")]


def palco_9():
    return [foto("fachada"),
            painel("afasta", ENTRA - 36, 404, "apagado", vazio=True),
            painel("reintegra", ENTRA - 18, 422, "apagado", vazio=True),
            painel("plenario", ENTRA, 440, "ouro"),
            tag("O caso, em 10 · 09 · 2026", 300, 470, cinza=True)]


T = [
    # ---------------------------------------------------------------- 1
    {"ancora": "base", "max": 640, "palco": palco_1,
     "titulo": [("k", "Em 48 horas, três ministros do STF decidiram sobre o "
                      "mesmo cargo. "),
                ("l", "O desempate não coube a "),
                ("g", "nenhum dos três.")],
     "corpo": ["Um afastou o diretor-geral da Polícia Federal. Outro o "
               "reintegrou. O terceiro suspendeu as duas decisões e convocou "
               "o Plenário."],
     "pilula": "Arraste: o que o processo diz sobre um ministro revisar outro"},

    # ---------------------------------------------------------------- 2
    {"ancora": "topo", "max": 300, "palco": palco_2,
     "titulo": [("k", "Quatro movimentos "),
                ("l", "em pouco mais de "),
                ("g", "dois dias.")],
     "base": {"max": 110,
              "fecho": "Nos comentários, uma frase se repetiu."}},

    # ---------------------------------------------------------------- 3
    {"fundo": "claro", "ancora": "topo", "max": 470, "palco": palco_3,
     "titulo": [("k", "“Um ministro não pode anular a decisão do outro. "),
                ("g", "Isso é papel do Senado.”")],
     "corpo": ["A primeira metade da frase está certa, e é exatamente o que a "
               "Presidência do STF apontou.",
               "A segunda metade troca de Poder."],
     "fecho": "O Senado entra em outro lugar, e é um lugar preciso."},

    # ---------------------------------------------------------------- 4
    {"ancora": "topo", "max": 330, "palco": palco_4,
     "titulo": [("k", "O Senado julga o ministro. "),
                ("l", "Quem revisa a decisão é "),
                ("g", "o próprio tribunal.")],
     "base": {"max": 250,
              "corpo": ["São trilhos separados. Um apura conduta de "
                        "magistrado; o outro corrige conteúdo de decisão. "
                        "Cada um resolve o seu."],
              "fecho": "Dentro do tribunal, então, o que corrige uma "
                       "monocrática?"}},

    # ---------------------------------------------------------------- 5
    {"ancora": "topo", "max": 330, "palco": palco_5,
     "titulo": [("k", "Num tribunal colegiado, "),
                ("l", "quem corrige o individual é "),
                ("g", "o coletivo.")],
     "base": {"max": 290,
              "corpo": ["A decisão de um ministro se submete ao órgão de que "
                        "ele faz parte, e a Presidência tem competências "
                        "próprias de ordenação. Ministro é par de ministro, "
                        "e par não revisa par."],
              "fecho": "São três caminhos, e eles não se confundem."}},

    # ---------------------------------------------------------------- 6
    {"ancora": "topo", "max": 330, "palco": palco_6,
     "titulo": [("k", "Três caminhos "),
                ("l", "que o processo oferece, e "),
                ("g", "nenhum é outro ministro.")],
     "base": {"max": 250,
              "corpo": ["Recurso ao colegiado, ordenação pela Presidência, "
                        "prevenção do relator. Cada um tem pressuposto "
                        "próprio e nenhum passa por um segundo voto isolado."],
              "fecho": "Foi o segundo caminho que se abriu primeiro."}},

    # ---------------------------------------------------------------- 7
    {"ancora": "base", "max": 440, "palco": palco_7,
     "titulo": [("k", "A Presidência suspendeu as duas decisões "),
                ("l", "e devolveu a palavra a "),
                ("g", "quem decide junto.")],
     "corpo": ["O fundamento invocado foi a sobreposição: decisões "
               "monocráticas sucessivas, sobre os mesmos fatos, com comandos "
               "incompatíveis entre si. O mérito fica com o Plenário."],
     "fecho": "15 de setembro, sessão extraordinária."},

    # ---------------------------------------------------------------- 8
    {"ancora": "topo", "max": 270, "palco": palco_8,
     "titulo": [("k", "O caso passa. "),
                ("l", "A pergunta que ele abre "),
                ("g", "fica.")],
     "base": {"max": 520,
              "lista": [("1", "Até onde vai a monocrática?",
                         "Qual o limite da decisão individual num órgão que "
                         "existe para decidir em conjunto."),
                        ("2", "O que a Presidência pode ordenar?",
                         "Onde termina a ordenação do processo e começa a "
                         "substituição do relator."),
                        ("3", "Quando chamar o colegiado?",
                         "Antes de a divergência aparecer, ou depois que ela "
                         "já produziu efeitos no mundo.")],
              "fecho": "É pergunta de desenho institucional, e ela sobrevive "
                       "a este caso."}},

    # ---------------------------------------------------------------- 9
    {"ancora": "base", "max": 490, "palco": palco_9,
     "titulo": [("k", "Interpretar o próprio tempo "),
                ("l", "exige "),
                ("g", "repertório.")],
     "corpo": ["Descrevemos o mecanismo, sem defender resultado. Situação em "
               "10 de setembro de 2026: o Plenário decide no dia 15.",
               "Qual limite você defenderia para a decisão monocrática?"],
     "slogan": "Alma clássica, repertório contemporâneo."},
]


# ---------------------------------------------------------------- montagem
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


def titulo_html(partes) -> str:
    return ('<h2 class="titulo">'
            + "".join(f'<span class="{k}">{_html.escape(t)}</span>'
                      for k, t in partes) + '</h2>')


def bloco_html(s: dict, ancora: str) -> str:
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
    if s.get("fecho"):
        p.append(f'<p class="fecho">{s["fecho"]}</p>')
    if s.get("pilula"):
        p.append('<div class="pilula"><i>&rarr;</i><span>'
                 + _html.escape(s["pilula"]) + '</span></div>')
    if s.get("slogan"):
        p.append('<div class="assina"><p class="m">EJUP</p>'
                 f'<p class="s">{_html.escape(s["slogan"])}</p></div>')
    return (f'<div class="bloco {ancora}" data-max="{s.get("max", 9999)}">'
            f'{"".join(p)}</div>')


def slide_html(s: dict, i: int, logo: str) -> str:
    partes = [f'<section class="slide {s.get("fundo", "")}" data-i="{i}">',
              '<div class="palco">', *s["palco"](), '</div>',
              bloco_html(s, s["ancora"])]
    if s.get("base"):
        partes.append(bloco_html(s["base"], "base"))
    partes.append(f'<div class="logo"><div>{logo}</div></div></section>')
    return "".join(partes)


def main() -> None:
    logo = logo_svg()
    corpo = "\n".join(slide_html(s, i, logo) for i, s in enumerate(T))
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
