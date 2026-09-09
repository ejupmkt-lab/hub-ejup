#!/usr/bin/env python3
"""Carrossel — "O poder de polícia ambiental municipal".

Onze telas 1080×1440, montadas no sistema descrito em
`skills/ejup-design/CARROSSEL.md`, que foi extraído do carrossel de
superendividamento (o aprovado). Em resumo, e cada item existe porque a
versão sem ele foi reprovada:

* foto sangrada com scrim **só embaixo**, texto no terço inferior;
* título de **pesos mistos** na mesma frase (Black / Light / Black dourado);
* corpo **justificado**;
* fundo claro de papel, com lista numerada e grade de cartões, acento bronze;
* **linha dourada grossa com nó**, atravessando de borda a borda, por cima da
  foto, subindo e descendo com o argumento;
* percentual e proporção em **anel**;
* tela preenchida, sem terço vazio embaixo.

Correções de fato do roteiro e pendências de verificação: ver README.
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

# Altura em que a linha corre em cada tela. A entrada de uma é a altura da
# anterior, e a mudança de nível acontece dentro da margem de 80px, à
# esquerda: assim a linha atravessa a área de conteúdo sempre reta e nunca
# corta texto. Nas telas de foto ela corre logo acima do bloco de texto, na
# fronteira onde o scrim começa; nas claras, embaixo do bloco.
LINHA = [600, 1230, 575, 1205, 550, 1250, 585, 1215, 560]

T = [
    # ---------------------------------------------------------------- 1
    {"fundo": "escuro", "foto": "cidade", "ancora": "abaixo",
     "rotulo": "Poder de polícia ambiental",
     "titulo": [("k", "Seu município pode licenciar hoje mesmo. "),
                ("l", "Mas está "),
                ("g", "preparado para isso?")],
     "corpo": ["A competência para licenciar está distribuída entre os quatro "
               "entes federativos. O que separa quem pode exercê-la de quem "
               "apenas a detém no papel é <b>estrutura</b>."],
     "pilula": "Arraste e entenda por que essa pergunta importa"},

    # ---------------------------------------------------------------- 2
    {"fundo": "claro", "ancora": "meio", "numeral": "1",
     "rotulo": "O que está em jogo",
     "titulo": [("k", "Poder de polícia ambiental "),
                ("l", "se exerce por "),
                ("g", "três instrumentos.")],
     "lista": [("1", "Licenciamento", "Autoriza, condiciona ou nega a "
                                      "atividade antes dela começar."),
               ("2", "Fiscalização", "Verifica se o que foi autorizado é o "
                                     "que está sendo feito."),
               ("3", "Sanção", "Responde ao descumprimento, do auto de "
                               "infração ao embargo.")],
     "fecho": "É a autoridade de <b>condicionar o privado</b> em nome do meio "
              "ambiente. E sim, os municípios também a têm."},

    # ---------------------------------------------------------------- 3
    {"fundo": "escuro", "foto": "natureza", "ancora": "abaixo",
     "rotulo": "A base constitucional",
     "titulo": [("k", "Competência comum "),
                ("l", "para proteger o meio ambiente, somada ao "),
                ("g", "interesse local.")],
     "cartoes": [("CF, art. 23, VI", "União, Estados, DF e Municípios "
                                     "protegem o meio ambiente", False),
                 ("CF, art. 30, I", "Ao município cabe legislar sobre "
                                    "assunto de interesse local", True)],
     "fecho": "Da soma dos dois nasce o licenciamento ambiental municipal."},

    # ---------------------------------------------------------------- 4
    {"fundo": "claro", "ancora": "meio", "numeral": "2",
     "rotulo": "O requisito que muda tudo",
     "titulo": [("k", "A LC 140/2011 "),
                ("l", "não deixa margem: "),
                ("g", "sem estrutura, não há competência.")],
     "lista": [("1", "Órgão ambiental capacitado", "Estrutura administrativa "
                                                   "própria para licenciar."),
               ("2", "Técnicos habilitados", "Corpo técnico com formação para "
                                             "a análise que a licença exige."),
               ("3", "Conselho de Meio Ambiente",
                "Em funcionamento regular, não apenas criado por lei.")],
     "cartoes": [("com os três", "O município licencia", True),
                 ("falta um", "Licencia o Estado", False)],
     "fecho": "Mesmo que o município queira assumir."},

    # ---------------------------------------------------------------- 5
    {"fundo": "escuro", "foto": "declaracao", "ancora": "abaixo",
     "rotulo": "A busca por agilidade",
     "titulo": [("k", "O rito simplificado "),
                ("l", "tira a análise técnica "),
                ("g", "da frente da licença.")],
     "corpo": ["A Lei Geral do Licenciamento Ambiental, sancionada em 2025 e "
               "<b>em vigor desde fevereiro de 2026</b>, generalizou "
               "modalidades em que o empreendedor declara as características "
               "do projeto e a fiscalização acontece depois.",
               "No rito ordinário, o controle está antes da licença. Na "
               "Licença por Adesão e Compromisso, <b>ele vem depois</b>."],
     "fecho": "Menos entrave na entrada. Mas e o controle depois?"},

    # ---------------------------------------------------------------- 6
    {"fundo": "claro", "ancora": "meio", "numeral": "3",
     "rotulo": "O que o STF decidiu",
     "titulo": [("k", "Capacidade institucional "),
                ("l", "não é formalidade. É "),
                ("g", "requisito de competência.")],
     "citacao": ("Em dezembro de 2022, o Supremo Tribunal Federal validou o "
                 "modelo descentralizado de competências ambientais. O detalhe "
                 "está na letra miúda: a Corte tratou a capacidade "
                 "institucional do órgão ambiental como requisito da própria "
                 "competência, não como exigência dispensável.",
                 "ADI 4.757 · julgada em 12/12/2022"),
     "fecho": "Agilidade sem estrutura não é simplificação. <b>É risco.</b>"},

    # ---------------------------------------------------------------- 7
    {"fundo": "escuro", "foto": "colunas", "ancora": "abaixo",
     "rotulo": "A realidade no Rio Grande do Norte",
     "titulo": [("k", "A competência existe para todos. "),
                ("l", "A capacidade de "),
                ("g", "exercê-la, não.")],
     "anel": (13, 167, "13", "de 167",
              "municípios potiguares têm <b>estrutura própria</b> de "
              "licenciamento ambiental. Nos outros 154, quem licencia "
              "continua sendo o próprio Estado."),
     "fonte": "Fonte: Idema"},

    # ---------------------------------------------------------------- 8
    {"fundo": "claro", "ancora": "meio", "numeral": "4",
     "rotulo": "O risco de ignorar isso",
     "titulo": [("k", "Simplificar o rito "),
                ("l", "não pode significar "),
                ("g", "simplificar a responsabilidade.")],
     "corpo": ["Uma licença concedida sem capacidade técnica pode ser "
               "anulada. E, dependendo do caso, o agente público responsável "
               "responde em três frentes ao mesmo tempo."],
     "cartoes": [("01", "Responsabilidade civil", False),
                 ("02", "Responsabilidade administrativa", False),
                 ("03", "Responsabilidade criminal", False),
                 ("04", "Anulação da própria licença", True)],
     "fecho": "O rito encurta. O dever, não."},

    # ---------------------------------------------------------------- 9
    {"fundo": "escuro", "foto": "cidade2", "ancora": "abaixo",
     "rotulo": "O artigo completo",
     "titulo": [("k", "Fundamentos, limites e "),
                ("g", "aplicação prática.")],
     "corpo": ["Para entender o cenário com profundidade, dados e base legal "
               "completa, o artigo está no site da EJUP."],
     "link": "Link na bio",
     "autoria": ("Leonardo Pivotto", "Sócio-fundador da EJUP e da EIX CORE"),
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


def linha_svg(entra: int, plano: int, claro: bool) -> str:
    """Linha grossa com nó. Reta na área de conteúdo; o degrau de nível
    acontece dentro da margem esquerda, onde não há texto."""
    cor = "#9b6b26" if claro else "#f0b855"
    return ('<div class="linha"><svg viewBox="0 0 1080 1440" '
            'xmlns="http://www.w3.org/2000/svg">'
            f'<path d="M0 {entra}C22 {entra} 52 {plano} 78 {plano}'
            f'L1080 {plano}" fill="none" stroke="{cor}" stroke-width="3"/>'
            f'<circle cx="540" cy="{plano}" r="9" fill="{cor}"/>'
            '</svg></div>')


def titulo_html(partes) -> str:
    return ('<h2 class="titulo">'
            + "".join(f'<span class="{k}">{_html.escape(t)}</span>'
                      for k, t in partes) + '</h2>')


def bloco_html(s: dict) -> str:
    p = []
    if s.get("rotulo"):
        p.append(f'<p class="rotulo">{_html.escape(s["rotulo"])}</p>')
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
    if s.get("citacao"):
        txt, ref = s["citacao"]
        p.append(f'<div class="citacao"><p>{_html.escape(txt)}</p>'
                 f'<p class="ref">{_html.escape(ref)}</p></div>')
    if s.get("anel"):
        parte, total, n, de, txt = s["anel"]
        p.append(f'<div class="anel">'
                 f'{anel_svg(parte, total, n, de, s["fundo"] == "claro")}'
                 f'<p class="txt">{txt}</p></div>')
    if s.get("fonte"):
        p.append(f'<p class="fonte">{_html.escape(s["fonte"])}</p>')
    if s.get("fecho"):
        p.append(f'<p class="fecho">{s["fecho"]}</p>')
    if s.get("pilula"):
        p.append('<div class="pilula"><i>&rarr;</i><span>'
                 + _html.escape(s["pilula"]) + '</span></div>')
    if s.get("link"):
        p.append(f'<span class="link">{_html.escape(s["link"])}</span>')
    if s.get("autoria"):
        nome, cargo = s["autoria"]
        retrato = (RAIZ / "peças" / "capa-artigo-poder-policia-ambiental"
                   / "_build" / "foto-tratada.webp")
        rosto = ""
        if retrato.exists():
            rosto = ('<div class="rosto"><img src="data:image/webp;base64,'
                     + base64.b64encode(retrato.read_bytes()).decode("ascii")
                     + '" alt=""></div>')
        p.append('<div class="autoria">' + rosto
                 + f'<p class="quem">{_html.escape(nome)}'
                   f'<span>{_html.escape(cargo)}</span></p></div>')
    if s.get("slogan"):
        p.append('<div class="assina"><p class="m">EJUP</p>'
                 f'<p class="s">{_html.escape(s["slogan"])}</p></div>')
    return f'<div class="bloco {s["ancora"]}">{"".join(p)}</div>'


def slide_html(s: dict, i: int, logo: str, simbolo: str) -> str:
    claro = s["fundo"] == "claro"
    fundo = ""
    if s.get("foto") and duo(s["foto"]):
        fundo = f'<div class="foto"><img src="{duo(s["foto"])}" alt=""></div>'
    elif not claro:
        fundo = f'<div class="marca-fundo">{simbolo}</div>'
    numeral = (f'<div class="numeral">{s["numeral"]}</div>'
               if s.get("numeral") else "")
    return (f'<section class="slide {s["fundo"]}" data-i="{i}">'
            + fundo + numeral
            + linha_svg(LINHA[i - 1], LINHA[i], claro)
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
