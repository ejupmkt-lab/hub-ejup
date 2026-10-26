#!/usr/bin/env python3
"""Carrossel — "Quem pode autorizar a quebra de cada sigilo".

Nove telas 1080×1440 sobre o desenho legal do acesso a dados protegidos:
quatro tipos de sigilo, três autoridades que podem autorizar, e os requisitos
que um pedido precisa cumprir.

**Peça de tese, sem caso concreto.** Descreve regra e precedente. Nenhum nome
de investigado, de processo em curso ou de agente político aparece. O gancho é
assimetria de informação: a expressão "quebra total do sigilo" circula como se
fosse uma decisão só, e no processo ela se desdobra em decisões distintas, com
autoridades distintas.

O dispositivo visual é O TRILHO: as três autoridades ficam fixas no alto de
toda tela e acendem uma por vez, na ordem em que o argumento as percorre. No
fim, o trilho vira o cabeçalho da tabela que fecha a peça.
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

# as três colunas do trilho, na ordem em que a peça as percorre
COLUNAS = [("Juiz", "reserva de jurisdição"),
           ("CPI", "deliberação fundamentada"),
           ("Adm. tributária", "hipótese legal própria")]

# linhas da tabela: (dado, o que é, célula juiz, célula CPI, célula fisco)
# cada célula é (marca, texto, alcança?)
LINHAS = [
    ("Sigilo bancário", "movimentação e saldos em instituição financeira",
     ("●", "ordem judicial", True),
     ("●", "por deliberação fundamentada", True),
     ("●", "LC 105/2001, art. 6º", True)),
    ("Sigilo fiscal", "declarações e dados em poder da Receita",
     ("●", "ordem judicial", True),
     ("●", "por deliberação fundamentada", True),
     ("●", "é quem detém o dado", True)),
    ("Registros telefônicos", "quem falou com quem, quando, por quanto tempo",
     ("●", "ordem judicial", True),
     ("●", "por deliberação fundamentada", True),
     ("○", "fora da hipótese legal", False)),
    ("Conteúdo das comunicações", "o que foi dito, captado em tempo real",
     ("●", "Lei 9.296/1996", True),
     ("○", "reserva de jurisdição", False),
     ("○", "reserva de jurisdição", False)),
]


T = [
    # ---------------------------------------------------------------- 1
    {"foto": "arquivo-galeria", "ancora": "topo", "max": 620, "trilho": -1,
     "titulo": [("k", "“Quebra total do sigilo.” "),
                ("l", "Uma frase que pede "),
                ("g", "decisões diferentes a autoridades diferentes.")],
     "corpo": ["Cada tipo de dado protegido tem regime próprio: quem pode "
               "autorizar o acesso, o que o pedido precisa demonstrar e até "
               "onde ele alcança."],
     "pilula": "Arraste: quem assina cada uma dessas autorizações"},

    # ---------------------------------------------------------------- 2
    {"ancora": "topo", "max": 1010, "base": 118, "trilho": -1,
     "titulo": [("k", "Quatro dados, "),
                ("l", "quatro regimes de "),
                ("g", "proteção.")],
     "regimes": [(d, s) for d, s, *_ in LINHAS],
     "fecho": "A autoridade que pode autorizar muda conforme a linha."},

    # ---------------------------------------------------------------- 3
    {"foto": "stf-lateral", "ancora": "topo", "max": 620, "trilho": 0,
     "titulo": [("k", "Escuta em tempo real, busca domiciliar e prisão "),
                ("l", "ficam com "),
                ("g", "o juiz.")],
     "corpo": ["São matérias que a Constituição entregou ao Judiciário e a "
               "mais ninguém, no que o STF chama de reserva de jurisdição "
               "(art. 5º, XI e XII). A interceptação das comunicações depende "
               "de ordem judicial e segue a Lei 9.296/1996."],
     "fecho": "As outras três linhas admitem um segundo caminho."},

    # ---------------------------------------------------------------- 4
    {"foto": "senado-comissao", "ancora": "topo", "max": 700, "trilho": 1,
     "titulo": [("k", "A CPI decide por conta própria "),
                ("l", "em parte desse quadro.")],
     "corpo": ["A Constituição dá à comissão parlamentar de inquérito poderes "
               "de investigação próprios das autoridades judiciais (art. 58, "
               "§ 3º). Ao fixar o alcance disso, o STF admitiu que a CPI "
               "determine a quebra de sigilo bancário, fiscal e de dados "
               "telefônicos, desde que por deliberação fundamentada, com "
               "demonstração concreta da necessidade da medida."],
     "fonte": "STF · MS 23.452/RJ, Plenário, rel. min. Celso de Mello, 1999",
     "fecho": "Interceptar comunicação em curso fica fora dessa deliberação."},

    # ---------------------------------------------------------------- 5
    {"foto": "banco-central", "ancora": "topo", "max": 640, "trilho": 2,
     "titulo": [("k", "A administração tributária recebe dados bancários "),
                ("l", "sem passar pelo "),
                ("g", "juiz.")],
     "corpo": ["Em 2016 o STF declarou constitucional o art. 6º da LC "
               "105/2001 e descreveu a operação como transferência do dever "
               "de sigilo: o dado sai protegido do banco e chega protegido à "
               "Receita, com a responsabilidade se deslocando junto."],
     "fonte": "STF · RE 601.314 (Tema 225) e ADIs 2.386, 2.390, 2.397 e 2.859",
     "fecho": "Aberta a via, o pedido ainda precisa de forma."},

    # ---------------------------------------------------------------- 6
    {"foto": "arquivo-caixas-esq", "ancora": "topo", "max": 640, "trilho": 2,
     "titulo": [("k", "Três requisitos, "),
                ("l", "e a falta de um deles "),
                ("g", "derruba o pedido.")],
     "corpo": ["Marco Civil da Internet, art. 22: quem requer registros de "
               "conexão ou de acesso a aplicações apresenta fundados indícios "
               "do ilícito, justificativa da utilidade daqueles registros para "
               "a prova e o período a que eles se referem, sob pena de "
               "inadmissibilidade."],
     "fecho": "O terceiro requisito é o que costuma faltar."},

    # ---------------------------------------------------------------- 7
    {"foto": "arquivo-caixas-dir", "ancora": "topo", "max": 620, "trilho": 2,
     "titulo": [("k", "O período recortado "),
                ("l", "separa investigação de "),
                ("g", "varredura.")],
     "corpo": ["Um requerimento sem janela temporal e sem vínculo com o fato "
               "apurado esbarra em texto expresso de lei. Recebidos os dados, "
               "o art. 23 impõe ao juízo preservar o sigilo do que chegou aos "
               "autos e a intimidade de quem aparece neles."],
     "fecho": "Reunindo as quatro linhas e as três colunas:"},

    # ---------------------------------------------------------------- 8
    {"fundo": "claro", "ancora": "topo", "max": 1030, "base": 116, "trilho": 3,
     "titulo": [("k", "O quadro inteiro, "),
                ("l", "em uma "),
                ("g", "tela.")],
     "matriz": True,
     "fonte": "CF, art. 5º, XI e XII, e art. 58, § 3º · LC 105/2001 · Lei "
              "9.296/1996 · Lei 12.965/2014 · STF: MS 23.452 e RE 601.314",
     "fecho": "Guarde o quadro. Ele resolve a maior parte do que o noticiário "
              "chama de quebra de sigilo."},

    # ---------------------------------------------------------------- 9
    {"foto": "biblioteca", "ancora": "topo", "max": 700, "trilho": 3,
     "titulo": [("k", "Interpretar o próprio tempo "),
                ("l", "exige "),
                ("g", "repertório.")],
     "corpo": ["Descrevemos o desenho legal e os precedentes, sem discutir "
               "caso concreto e sem defender resultado.",
               "Entre os três requisitos do art. 22, qual você vê faltar com "
               "mais frequência nos pedidos que chegam ao Judiciário?"],
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


def duo(nome: str):
    """Devolve a foto tratada em base64, ou None quando ela ainda não existe
    (a tela sai só com fundo, e o aviso aparece na saída)."""
    arq = HERE / "duotone" / f"{nome}.webp"
    if not arq.exists():
        print(f"  aviso: sem foto tratada para {nome}")
        return None
    return ("data:image/webp;base64,"
            + base64.b64encode(arq.read_bytes()).decode("ascii"))


def trilho_html(ativo: int) -> str:
    """ativo: -1 nenhuma coluna · 0,1,2 a coluna da vez · 3 todas percorridas"""
    cols = []
    for i, (nome, sub) in enumerate(COLUNAS):
        cls = "ativo" if i == ativo else ("visto" if i < ativo or ativo == 3
                                          else "")
        cols.append(f'<div class="col {cls}"><b>{_html.escape(nome)}</b>'
                    f'<small>{_html.escape(sub)}</small></div>')
    return f'<div class="trilho">{"".join(cols)}</div>'


def matriz_html() -> str:
    cab = "".join(f"<th>{_html.escape(n)}</th>" for n, _ in COLUNAS)
    corpo = []
    for dado, sub, *celulas in LINHAS:
        tds = []
        for marca, txt, alcanca in celulas:
            cls = "" if alcanca else ' class="nao"'
            tds.append(f'<td{cls}><i>{marca}</i>{_html.escape(txt)}</td>')
        corpo.append(f'<tr><th>{_html.escape(dado)}'
                     f'<small>{_html.escape(sub)}</small></th>'
                     + "".join(tds) + "</tr>")
    return ('<table class="matriz"><thead><tr><th></th>' + cab
            + "</tr></thead><tbody>" + "".join(corpo) + "</tbody></table>")


def bloco_html(s: dict) -> str:
    p = []
    if s.get("titulo"):
        p.append('<h2 class="titulo">'
                 + "".join(f'<span class="{k}">{_html.escape(t)}</span>'
                           for k, t in s["titulo"]) + "</h2>")
    for t in s.get("corpo", []):
        p.append(f'<p class="corpo">{t}</p>')
    if s.get("regimes"):
        itens = "".join(
            f'<div class="r"><span class="n">{i + 1}</span><div>'
            f'<b>{_html.escape(d)}</b><small>{_html.escape(sub)}</small>'
            f'</div></div>'
            for i, (d, sub) in enumerate(s["regimes"]))
        p.append(f'<div class="regimes">{itens}</div>')
    if s.get("matriz"):
        p.append(matriz_html())
    if s.get("fonte"):
        p.append(f'<p class="fonte">{_html.escape(s["fonte"])}</p>')
    if s.get("fecho"):
        p.append(f'<p class="fecho">{s["fecho"]}</p>')
    if s.get("pilula"):
        p.append('<div class="pilula"><i>&rarr;</i><span>'
                 + _html.escape(s["pilula"]) + "</span></div>")
    if s.get("slogan"):
        p.append('<div class="assina"><p class="m">EJUP</p>'
                 f'<p class="s">{_html.escape(s["slogan"])}</p></div>')
    return (f'<div class="bloco {s["ancora"]}" data-max="{s.get("max", 9999)}"'
            f' data-base="{s.get("base", 100)}">{"".join(p)}</div>')


def slide_html(s: dict, i: int, logo: str) -> str:
    fundo = ""
    if s.get("foto"):
        fundo = f'<div class="foto"><img src="{duo(s["foto"])}" alt=""></div>'
    return (f'<section class="slide {s.get("fundo", "")}" data-i="{i}">'
            + fundo + trilho_html(s["trilho"]) + bloco_html(s)
            + f'<div class="logo"><div>{logo}</div></div></section>')


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
