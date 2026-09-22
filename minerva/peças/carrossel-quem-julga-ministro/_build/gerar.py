#!/usr/bin/env python3
"""Carrossel — "Quem, de fato, pode julgar um ministro do STF?".

Dezessete telas 1080x1440 sobre o desenho de competências que o
ordenamento prevê para responsabilizar um integrante do Supremo: infração
penal comum, crime de responsabilidade, alcance do CNJ, código de ética e
afastamento cautelar. Pouco texto por tela: cada uma carrega uma ideia e
termina deixando a seguinte em aberto.

Peça descritiva. Nenhum ministro é nomeado como investigado, nenhum caso
concreto é julgado, nenhum lado do debate público é encampado.

A LIGAÇÃO ENTRE TELAS é a colunata do Palácio do Supremo. Cada emenda entre
duas telas é uma coluna de Niemeyer, desenhada em vetor e partida ao meio
pela borda: metade fecha uma tela, metade abre a seguinte. Arrastar o
carrossel é caminhar ao longo da fachada. Nas telas escuras a coluna é
mármore; nas claras, a mesma coluna aparece em navy, contraluz.
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

T = [
    # ---------------------------------------------------------------- 1
    {"foto": "stf-fachada", "ancora": "topo", "max": 580, "cap": 132,
     "titulo": [("k", "Quem, de fato, pode "),
                ("g", "julgar um ministro do STF?")],
     "corpo": ["A resposta é menos simples do que o debate público costuma "
               "sugerir."],
     "pilula": "Arraste e atravesse a praça"},

    # ---------------------------------------------------------------- 2
    {"ancora": "centro", "max": 1000, "cap": 176,
     "titulo": [("g", "Setembro de 2026. "),
                ("k", "O tema entra na pauta institucional "),
                ("l", "da advocacia.")],
     "fecho": "E entra com um pedido concreto na mesa."},

    # ---------------------------------------------------------------- 3
    {"foto": "oab-sede", "ancora": "topo", "max": 580, "cap": 150,
     "titulo": [("k", "Seccionais da OAB "),
                ("l", "convocaram sessões extraordinárias "),
                ("g", "em diferentes estados.")],
     "corpo": ["Um requerimento pedindo que o Conselho Pleno discutisse "
               "medidas cautelares chegou a ser protocolado."],
     "fecho": "Antes do mérito, existe uma pergunta técnica que vem "
              "primeiro."},

    # ---------------------------------------------------------------- 4
    {"ancora": "centro", "max": 1060, "cap": 150,
     "titulo": [("k", "A Constituição divide a competência "),
                ("l", "conforme "),
                ("g", "o tipo de infração.")],
     "pergunta": [("Infração penal comum", "?"),
                  ("Crime de responsabilidade", "?")],
     "fecho": "Duas vias, dois julgadores. Um deles não usa toga."},

    # ---------------------------------------------------------------- 5
    {"foto": "stf-plenario", "ancora": "topo", "max": 580, "cap": 150,
     "titulo": [("l", "Infração penal comum: "),
                ("k", "quem julga é "),
                ("g", "o próprio Supremo.")],
     "corpo": ["Os ministros respondem perante a própria Corte, por foro de "
               "prerrogativa de função."],
     "fonte": "CF, art. 102, I, “b”",
     "fecho": "A segunda via fica do outro lado da praça."},

    # ---------------------------------------------------------------- 6
    {"foto": "senado-plenario", "ancora": "topo", "max": 580, "cap": 150,
     "titulo": [("l", "Crime de responsabilidade: "),
                ("k", "quem julga é "),
                ("g", "o Senado Federal.")],
     "corpo": ["O rito está previsto na Lei nº 1.079/1950."],
     "fonte": "CF, art. 52, II · Lei 1.079/1950 · Brossard, O Impeachment",
     "fecho": "E a condenação cobra duas vezes."},

    # ---------------------------------------------------------------- 7
    {"ancora": "centro", "max": 1060, "cap": 150,
     "titulo": [("k", "Dois efeitos, "),
                ("g", "cumulativos.")],
     "efeitos": [("Perda do cargo", "a investidura se encerra com a "
                  "decisão do Senado"),
                 ("Inabilitação por 8 anos", "para o exercício de qualquer "
                  "função pública")],
     "fecho": "Por isso tanta manifestação recente se dirige ao Senado. "
              "Falta um nome nessa conta."},

    # ---------------------------------------------------------------- 8
    {"fundo": "claro", "ancora": "centro", "max": 1000, "cap": 240,
     "titulo": [("k", "E o "),
                ("g", "CNJ?")],
     "corpo": ["O Conselho fiscaliza magistrados em todo o país."],
     "fecho": "Com uma exceção."},

    # ---------------------------------------------------------------- 9
    {"ancora": "centro", "max": 1060, "cap": 150,
     "titulo": [("k", "O CNJ "),
                ("g", "não alcança "),
                ("k", "os ministros do STF.")],
     "corpo": ["Segundo o entendimento consolidado, o Conselho integra o "
               "Judiciário e está submetido à própria Corte."],
     "fonte": "CF, art. 103-B, § 4º · entendimento consolidado",
     "fecho": "Em agosto, essa fronteira apareceu por escrito."},

    # ---------------------------------------------------------------- 10
    {"ancora": "centro", "max": 1060, "cap": 140,
     "titulo": [("g", "Agosto de 2026. "),
                ("k", "Uma proposta de código de ética "),
                ("l", "para o Judiciário.")],
     "alcance": [(True, "Magistrados de todo o país", "alcançados"),
                 (False, "Ministros do próprio Supremo", "fora do texto")],
     "fonte": "Proposta apresentada ao CNJ pela presidência do STF",
     "fecho": "A Corte está escrevendo a resposta em outro texto."},

    # ---------------------------------------------------------------- 11
    {"foto": "colunata-esq", "ancora": "topo", "max": 580, "cap": 150,
     "titulo": [("k", "Um código próprio para os ministros "),
                ("g", "está em elaboração.")],
     "corpo": ["Relatoria da ministra Cármen Lúcia. Seria o primeiro da "
               "história da Corte, com votação prevista para 2026."],
     "fecho": "E existe um instrumento que divide mais opiniões."},

    # ---------------------------------------------------------------- 12
    {"foto": "colunata-dir", "ancora": "topo", "max": 580, "cap": 176,
     "titulo": [("g", "Afastamento cautelar.")],
     "corpo": ["Retirada temporária das funções enquanto a apuração corre, "
               "sem juízo sobre culpa."],
     "fecho": "E ele não tem caminho único."},

    # ---------------------------------------------------------------- 13
    {"ancora": "centro", "max": 1060, "cap": 150,
     "titulo": [("k", "Dois caminhos "),
                ("g", "possíveis.")],
     "efeitos": [("Pelo próprio Supremo", "a Corte decide sobre um dos seus"),
                 ("Pelo Senado", "no rito de crime de responsabilidade")],
     "fecho": "É aqui que o debate se divide."},

    # ---------------------------------------------------------------- 14
    {"fundo": "claro", "ancora": "centro", "max": 1080, "cap": 150,
     "titulo": [("k", "Dois fundamentos legítimos, "),
                ("g", "em colisão.")],
     "choque": [("Isonomia",
                 "O afastamento preserva a investigação e trata a autoridade "
                 "como qualquer outro cidadão."),
                ("Presunção de inocência",
                 "Afastar antes do julgamento antecipa efeitos de sanção.")],
     "fecho": "Os dois lados têm razão. É esse o problema."},

    # ---------------------------------------------------------------- 15
    {"foto": "oab-conselho", "ancora": "topo", "max": 580, "cap": 150,
     "titulo": [("k", "A OAB tem assento "),
                ("g", "garantido pela Constituição.")],
     "corpo": ["Cabe a ela a defesa da ordem jurídica do Estado democrático "
               "de direito, e a legitimidade para propor ação direta de "
               "inconstitucionalidade."],
     "fonte": "Lei 8.906/1994, art. 44, I · CF, art. 103, VII",
     "fecho": "Agora a pergunta da capa tem resposta."},

    # ---------------------------------------------------------------- 16
    {"ancora": "centro", "max": 1060, "cap": 140,
     "pergunta": [("Infração penal comum", "o próprio STF"),
                  ("Crime de responsabilidade", "o Senado Federal"),
                  ("Controle administrativo", "fora do alcance do CNJ")],
     "titulo": [("k", "O ordenamento prevê caminhos. "),
                ("l", "Eles só não estão "),
                ("g", "em um único lugar.")]},

    # ---------------------------------------------------------------- 17
    {"ancora": "centro", "max": 1060, "cap": 150,
     "titulo": [("k", "Qual desses mecanismos "),
                ("g", "deveria ser fortalecido primeiro?")],
     "corpo": ["Conta pra gente nos comentários."],
     "cta": "Leia a análise completa no site da EJUP. Link na bio.",
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
    arq = HERE / "duotone" / f"{nome}.webp"
    if not arq.exists():
        print(f"  aviso: sem foto tratada para {nome}")
        return None
    return ("data:image/webp;base64,"
            + base64.b64encode(arq.read_bytes()).decode("ascii"))


COL_W, COL_H = 196, 1440


def coluna_svg(claro: bool, gid: str) -> str:
    """Coluna do Palácio do STF em elevação: pescoço estreito no alto, onde
    encosta na laje, abrindo em curva até a parte mais larga e fechando em
    ponta no chão."""
    w, h = COL_W, COL_H
    n = w * 0.30
    d = (f"M{(w - n) / 2:.1f},0 L{(w + n) / 2:.1f},0 "
         f"C{w * .60:.1f},{h * .30:.1f} {w:.1f},{h * .52:.1f} "
         f"{w * .93:.1f},{h * .72:.1f} "
         f"C{w * .84:.1f},{h * .88:.1f} {w * .58:.1f},{h * .98:.1f} "
         f"{w / 2:.1f},{h:.1f} "
         f"C{w * .42:.1f},{h * .98:.1f} {w * .16:.1f},{h * .88:.1f} "
         f"{w * .07:.1f},{h * .72:.1f} "
         f"C0,{h * .52:.1f} {w * .40:.1f},{h * .30:.1f} "
         f"{(w - n) / 2:.1f},0Z")
    if claro:
        paradas = ('<stop offset="0" stop-color="#304557"/>'
                   '<stop offset=".55" stop-color="#0a2a49"/>'
                   '<stop offset="1" stop-color="#031c37"/>')
    else:
        paradas = ('<stop offset="0" stop-color="#ffffff"/>'
                   '<stop offset=".5" stop-color="#eceeef"/>'
                   '<stop offset="1" stop-color="#d1d3d4"/>')
    return (f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<defs><linearGradient id="{gid}" x1="0" x2="1" y1="0" y2="0">'
            f'{paradas}</linearGradient></defs>'
            f'<path d="{d}" fill="url(#{gid})"/></svg>')


def colunas_html(s: dict, i: int, total: int) -> str:
    claro = s.get("fundo") == "claro"
    out = []
    if i > 0:
        out.append(f'<div class="coluna" style="left:-{COL_W // 2}px">'
                   f'{coluna_svg(claro, f"c{i}e")}</div>')
    if i < total - 1:
        out.append(f'<div class="coluna" style="right:-{COL_W // 2}px">'
                   f'{coluna_svg(claro, f"c{i}d")}</div>')
    return "".join(out)


def bloco_html(s: dict) -> str:
    p = []
    if s.get("pergunta"):
        itens = "".join(
            f'<div><b>{_html.escape(a)}</b><i>&rarr;</i>'
            f'<strong class="{"vazio" if b == "?" else ""}">'
            f'{_html.escape(b)}</strong></div>'
            for a, b in s["pergunta"])
        tab = f'<div class="recap">{itens}</div>'
        if s.get("pergunta_depois", s["pergunta"][0][1] == "?"):
            s = {**s, "_tab_depois": tab}
        else:
            p.append(tab)
    if s.get("recap"):
        itens = "".join(
            f'<div><b>{_html.escape(a)}</b><i>&rarr;</i>'
            f'<strong>{_html.escape(b)}</strong></div>'
            for a, b in s["recap"])
        p.append(f'<div class="recap">{itens}</div>')
    if s.get("titulo"):
        p.append('<h2 class="titulo">'
                 + "".join(f'<span class="{k}">{_html.escape(t)}</span>'
                           for k, t in s["titulo"]) + "</h2>")
    if s.get("_tab_depois"):
        p.append(s["_tab_depois"])
    for t in s.get("corpo", []):
        p.append(f'<p class="corpo">{t}</p>')
    if s.get("efeitos"):
        p.append('<div class="efeitos">' + "".join(
            f'<div><b>{_html.escape(a)}</b><small>{_html.escape(b)}</small>'
            "</div>" for a, b in s["efeitos"]) + "</div>")
    if s.get("alcance"):
        p.append('<div class="alcance">' + "".join(
            f'<div class="{"" if ok else "nao"}"><i>{"&#9679;" if ok else "&#9675;"}'
            f'</i><b>{_html.escape(txt)}</b><span>{_html.escape(marca)}</span>'
            "</div>" for ok, txt, marca in s["alcance"]) + "</div>")
    if s.get("choque"):
        p.append('<div class="choque">' + "".join(
            f'<div><b>{_html.escape(a)}</b><p>{_html.escape(b)}</p></div>'
            for a, b in s["choque"]) + "</div>")
    if s.get("fonte"):
        p.append(f'<p class="fonte">{_html.escape(s["fonte"])}</p>')
    if s.get("fecho"):
        p.append(f'<p class="fecho">{s["fecho"]}</p>')
    if s.get("pilula"):
        p.append('<div class="pilula"><i>&rarr;</i><span>'
                 + _html.escape(s["pilula"]) + "</span></div>")
    if s.get("cta"):
        p.append(f'<p class="cta">{_html.escape(s["cta"])}</p>')
    if s.get("slogan"):
        p.append('<div class="assina"><p class="m">EJUP</p>'
                 f'<p class="s">{_html.escape(s["slogan"])}</p></div>')
    return (f'<div class="bloco {s["ancora"]}" data-max="{s.get("max", 9999)}"'
            f' data-cap="{s.get("cap", 150)}">{"".join(p)}</div>')


def slide_html(s: dict, i: int, logo: str, total: int) -> str:
    fundo = ""
    if s.get("foto"):
        fundo = f'<div class="foto"><img src="{duo(s["foto"])}" alt=""></div>'
    return (f'<section class="slide {s.get("fundo", "")}" data-i="{i}">'
            + fundo + colunas_html(s, i, total) + bloco_html(s)
            + f'<div class="logo"><div>{logo}</div></div></section>')


def main() -> None:
    logo = logo_svg()
    corpo = "\n".join(slide_html(s, i, logo, len(T)) for i, s in enumerate(T))
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
