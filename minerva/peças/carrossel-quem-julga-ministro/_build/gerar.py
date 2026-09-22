#!/usr/bin/env python3
"""Carrossel — "Quem, de fato, pode julgar um ministro do STF?".

Onze telas 1080x1440 sobre o desenho de competências que o ordenamento
prevê para responsabilizar um integrante do Supremo: infração penal comum,
crime de responsabilidade, alcance do CNJ, código de ética e afastamento
cautelar.

Peça descritiva. Nenhum ministro é nomeado como investigado, nenhum caso
concreto é julgado, nenhum lado do debate público é encampado.

Sem rótulo no alto: cada tela abre direto no título. A base legal entra como
linha de fonte, embaixo do corpo, onde ela pertence. A fotografia ocupa a
metade inferior inteira do quadro e o texto sobe até a margem de topo, para
não sobrar quadro vazio.
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
    {"foto": "stf-fachada", "ancora": "topo", "max": 740, "base": 120,
     "titulo": [("k", "Quem, de fato, pode "),
                ("g", "julgar um ministro do STF?")],
     "corpo": ["A resposta é menos simples do que o debate público costuma "
               "sugerir."],
     "pilula": "Arraste: os mecanismos que o ordenamento realmente prevê"},

    # ---------------------------------------------------------------- 2
    {"foto": "oab-sede", "ancora": "topo", "max": 800, "base": 116,
     "sai": ("01", 560, 600),
     "titulo": [("k", "Setembro de 2026: "),
                ("l", "o tema entra na "),
                ("g", "pauta institucional da advocacia.")],
     "corpo": ["Seccionais da OAB em diferentes estados convocaram sessões "
               "extraordinárias, e um requerimento pedindo que o Conselho "
               "Pleno discutisse medidas cautelares chegou a ser "
               "protocolado."],
     "fecho": "Antes de qualquer posição sobre o mérito, existe uma pergunta "
              "técnica que vem primeiro."},

    # ---------------------------------------------------------------- 3
    {"foto": "stf-plenario", "ancora": "topo", "max": 740, "base": 120,
     "entra": ("01", 560, 600), "sai": ("02", 560, 600),
     "titulo": [("k", "A Constituição divide a competência "),
                ("l", "conforme "),
                ("g", "o tipo de infração.")],
     "corpo": ["Em infrações penais comuns, é o próprio Supremo quem julga "
               "seus integrantes, por foro de prerrogativa de função."],
     "fonte": "CF, art. 102, I, “b”",
     "fecho": "E existe uma segunda via, com um julgador que não usa "
              "toga."},

    # ---------------------------------------------------------------- 4
    {"foto": "senado-plenario", "ancora": "topo", "max": 900, "base": 112,
     "entra": ("02", 560, 600), "sai": ("03", 560, 600),
     "titulo": [("k", "Em crimes de responsabilidade, "),
                ("l", "quem julga é o "),
                ("g", "Senado Federal.")],
     "corpo": ["O rito está previsto na Lei nº 1.079/1950. A condenação "
               "produz dois efeitos, cumulativos:"],
     "efeitos": [("Perda do cargo", "a investidura se encerra com o "
                  "trânsito da decisão do Senado"),
                 ("Inabilitação por 8 anos", "para o exercício de qualquer "
                  "função pública")],
     "fonte": "CF, art. 52, II · Lei 1.079/1950 · Brossard, O Impeachment",
     "fecho": "Falta o terceiro nome que todo mundo cita quando o assunto "
              "aparece, e que não entra nessa conta."},

    # ---------------------------------------------------------------- 5
    {"fundo": "claro", "ancora": "topo", "max": 1150, "base": 168,
     "entra": ("03", 560, 600),
     "titulo": [("k", "E o CNJ, "),
                ("l", "que fiscaliza magistrados "),
                ("g", "em todo o país?")],
     "corpo": ["Segundo o entendimento consolidado, o Conselho não alcança "
               "os ministros do Supremo. Ele integra a estrutura do "
               "Judiciário e está submetido à própria Corte que deveria "
               "fiscalizar."],
     "fonte": "CF, art. 103-B, § 4º · entendimento consolidado",
     "fecho": "Em agosto de 2026 essa fronteira apareceu escrita, em uma "
              "proposta assinada pelo próprio Supremo."},

    # ---------------------------------------------------------------- 6
    {"ancora": "topo", "max": 1090, "base": 138,
     "sai": ("ÉTICA", 230, 660),
     "titulo": [("k", "Agosto de 2026: "),
                ("l", "uma proposta de "),
                ("g", "código de ética para o Judiciário.")],
     "corpo": ["O presidente do STF apresentou o texto ao CNJ. O alcance "
               "declarado da proposta expõe a mesma fronteira:"],
     "alcance": [(True, "Magistrados de todo o país", "alcançados"),
                 (False, "Ministros do próprio Supremo", "fora do texto")],
     "fonte": "Proposta apresentada ao CNJ pela presidência do STF",
     "fecho": "A Corte já está escrevendo a resposta. Em outro texto."},

    # ---------------------------------------------------------------- 7
    {"foto": "colunata-esq", "ancora": "topo", "max": 740, "base": 122,
     "entra": ("ÉTICA", 230, 660),
     "titulo": [("k", "Um código próprio para os ministros "),
                ("l", "está "),
                ("g", "em elaboração.")],
     "corpo": ["Seria a primeira norma desse tipo na história da Corte, com "
               "expectativa de votação ainda em 2026."],
     "fonte": "Relatoria da ministra Cármen Lúcia · votação prevista para 2026",
     "fecho": "E existe um instrumento que divide muito mais opiniões do "
              "que qualquer código de ética."},

    # ---------------------------------------------------------------- 8
    {"foto": "colunata-dir", "ancora": "topo", "max": 930, "base": 110,
     "titulo": [("k", "Afastamento cautelar "),
                ("l", "é retirada temporária, "),
                ("g", "sem juízo sobre culpa.")],
     "corpo": ["A autoridade fica suspensa das funções enquanto a apuração "
               "corre. Para ministros do Supremo não existe caminho único:"],
     "efeitos": [("Pelo próprio Supremo", "a Corte decide sobre um dos seus"),
                 ("Pelo Senado", "no rito de crime de responsabilidade")],
     "fecho": "Os dois lados desse debate têm razão. É esse o problema."},

    # ---------------------------------------------------------------- 9
    {"fundo": "claro", "ancora": "topo", "max": 1150, "base": 158,
     "titulo": [("k", "Dois fundamentos legítimos, "),
                ("l", "em rota de "),
                ("g", "colisão.")],
     "choque": [("A favor · isonomia",
                 "O afastamento preserva a investigação e submete a "
                 "autoridade apurada ao mesmo tratamento que qualquer outro "
                 "cidadão receberia."),
                ("Contra · presunção de inocência",
                 "Afastar antes do julgamento antecipa efeitos de sanção "
                 "sobre quem ainda não foi condenado.")],
     "fecho": "Falta dizer quem, além dos dois lados, tem direito "
              "garantido de sentar nessa mesa."},

    # ---------------------------------------------------------------- 10
    {"foto": "oab-conselho", "ancora": "topo", "max": 760, "base": 118,
     "titulo": [("k", "A OAB tem assento "),
                ("l", "garantido pela "),
                ("g", "Constituição.")],
     "corpo": ["O Estatuto da Advocacia atribui à entidade a defesa da ordem "
               "jurídica do Estado democrático de direito, e a Constituição "
               "a legitima a propor ação direta de "
               "inconstitucionalidade."],
     "fonte": "Lei 8.906/1994, art. 44, I · CF, art. 103, VII",
     "fecho": "Recapitulando os três endereços, e o que nenhum deles "
              "resolve sozinho:"},

    # ---------------------------------------------------------------- 11
    {"ancora": "topo", "max": 1090, "base": 122,
     "recap": [("Infração penal comum", "o próprio STF"),
               ("Crime de responsabilidade", "o Senado Federal"),
               ("Controle administrativo", "fora do alcance do CNJ")],
     "titulo": [("k", "O ordenamento prevê caminhos. "),
                ("l", "Eles só não estão "),
                ("g", "concentrados em um único lugar.")],
     "corpo": ["Na sua avaliação, qual desses mecanismos deveria ser "
               "fortalecido primeiro? Conta pra gente nos comentários."],
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


def ponte_html(s: dict, lado: str) -> str:
    """lado: 'sai' (metade esquerda, encostada na borda direita) ou 'entra'
    (metade direita, encostada na borda esquerda)."""
    p = s.get("sai") if lado == "sai" else s.get("entra")
    if not p:
        return ""
    txt, tam, larg = p
    borda = "right" if lado == "sai" else "left"
    return (f'<div class="ponte" style="font-size:{tam}px;width:{larg}px;'
            f'{borda}:-{larg // 2}px">{_html.escape(txt)}</div>')


def bloco_html(s: dict) -> str:
    p = []
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
            f' data-base="{s.get("base", 100)}">{"".join(p)}</div>')


def slide_html(s: dict, i: int, logo: str) -> str:
    fundo = ""
    if s.get("foto"):
        fundo = f'<div class="foto"><img src="{duo(s["foto"])}" alt=""></div>'
    return (f'<section class="slide {s.get("fundo", "")}" data-i="{i}">'
            + fundo + ponte_html(s, 'sai') + ponte_html(s, 'entra')
            + bloco_html(s)
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
