#!/usr/bin/env python3
"""Carrossel — "O poder de polícia ambiental municipal", 8 telas 1080×1440.

Peça da EJUP: o charter vale. Duas consequências no texto original do roteiro:
o emoji de mão virou a seta da pílula de chamada, e não há travessão entre
palavras.

Correções de fato aplicadas (ver README):
* a ADI 4.757 foi julgada em **12 de dezembro de 2022**, não em 2023;
* a Lei 15.190/2025 foi sancionada em 08/08/2025 e está **em vigor desde
  04/02/2026**, e a LAC ficou restrita a empreendimentos de baixo impacto.
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
         ("Gotham-Medium.otf", 500), ("Gotham-Black.otf", 900)]

SLIDES = [
    {
        "rotulo": "Poder de polícia ambiental",
        "titulo": "Seu município pode emitir uma licença ambiental hoje mesmo. "
                  "<b>Mas isso significa que ele está preparado para isso?</b>",
        "chamada": "Arraste para o lado e entenda por que essa pergunta "
                   "importa mais do que parece",
    },
    {
        "rotulo": "O que está em jogo",
        "titulo": "A autoridade de <b>condicionar o privado</b> em nome do "
                  "meio ambiente",
        "texto": ["Poder de polícia ambiental é a autoridade que o poder "
                  "público tem para limitar ou condicionar atividades privadas "
                  "em nome da proteção ao meio ambiente, por meio de "
                  "licenciamento, fiscalização e sanções."],
        "fecho": "E sim, os municípios também têm essa competência.",
    },
    {
        "rotulo": "A base constitucional",
        "titulo": "Competência <b>comum</b> para proteger o meio ambiente",
        "texto": ["A Constituição Federal atribui a União, Estados, Distrito "
                  "Federal e Municípios a competência comum para proteger o "
                  "meio ambiente. Some isso à competência municipal para "
                  "tratar de assuntos de interesse local, e chega-se ao "
                  "fundamento do licenciamento ambiental municipal."],
        "fecho": "Só que ter competência no papel é apenas o primeiro passo.",
    },
    {
        "rotulo": "O requisito que muda tudo",
        "titulo": "A <b>LC 140/2011</b> é clara",
        "texto": ["O município só pode exercer essa competência se tiver órgão "
                  "ambiental capacitado, com técnicos habilitados, e Conselho "
                  "Municipal de Meio Ambiente em funcionamento regular."],
        "fecho": "Sem essa estrutura, quem licencia é o Estado, mesmo que o "
                 "município queira assumir.",
    },
    {
        "rotulo": "A busca por agilidade",
        "titulo": "O licenciamento <b>simplificado</b> ganhou força",
        "texto": ["Para reduzir a burocracia sobre pequenos e médios "
                  "empreendimentos, ganharam espaço os ritos simplificados.",
                  "A Lei Geral do Licenciamento Ambiental, sancionada em 2025 "
                  "e <b>em vigor desde fevereiro de 2026</b>, generalizou "
                  "modalidades como a Licença por Adesão e Compromisso, em que "
                  "o empreendedor declara as características do projeto e a "
                  "fiscalização acontece depois."],
        "fecho": "Menos entrave na entrada. Mas e o controle depois?",
    },
    {
        "rotulo": "O que o STF decidiu",
        "titulo": "Capacidade institucional como <b>requisito de competência</b>",
        "texto": ["Em dezembro de 2022, o Supremo Tribunal Federal validou o "
                  "modelo descentralizado na ADI 4.757.",
                  "O detalhe importante está na letra miúda da decisão: a Corte "
                  "tratou a capacidade institucional do órgão ambiental como "
                  "requisito da própria competência, não como formalidade "
                  "dispensável."],
        "fecho": "Agilidade sem estrutura não é simplificação. É risco.",
    },
    {
        "rotulo": "A realidade no Rio Grande do Norte",
        "dado": ("13", "de 167"),
        "legenda": "municípios potiguares têm estrutura própria de "
                   "licenciamento ambiental. Nos outros 154, quem licencia "
                   "continua sendo o próprio Estado.",
        "fonte": "Fonte: Idema",
        "fecho": "A competência formal existe para todos. A capacidade real de "
                 "exercê-la, não.",
    },
    {
        "rotulo": "O risco de ignorar isso",
        "titulo": "Simplificar o rito não pode significar "
                  "<b>simplificar a responsabilidade</b>",
        "texto": ["Uma licença concedida sem capacidade técnica pode ser "
                  "anulada. E, dependendo do caso, o agente público "
                  "responsável pode responder civil, administrativa e até "
                  "criminalmente."],
        "cta": "Para entender o cenário com profundidade, dados e base legal "
               "completa, o artigo está no site da EJUP.",
        "link": "Link na bio",
        "autoria": ("Leonardo Pivotto",
                    "Sócio-fundador da EJUP e da EIX CORE"),
        "slogan": "Alma clássica, repertório contemporâneo.",
    },
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


def svg(nome: str) -> str:
    caminho = LOGOS / nome
    if not caminho.exists():
        sys.exit(f"logo ausente: {caminho}")
    return caminho.read_text(encoding="utf-8").strip()


def slide_html(s: dict, i: int, total: int, simbolo: str, logo: str) -> str:
    partes = [f'<p class="rotulo">{_html.escape(s["rotulo"])}</p>']
    if s.get("titulo"):
        partes.append(f'<h2 class="titulo">{s["titulo"]}</h2>')
    if s.get("dado"):
        n, de = s["dado"]
        partes.append(f'<div class="dado"><span class="n">{n}</span>'
                      f'<span class="de">{_html.escape(de)}</span></div>'
                      f'<p class="legenda">{_html.escape(s["legenda"])}</p>'
                      f'<p class="fonte">{_html.escape(s["fonte"])}</p>')
    if s.get("texto"):
        partes.append('<div class="texto">'
                      + "".join(f"<p>{p}</p>" for p in s["texto"]) + "</div>")
    if s.get("fecho"):
        partes.append(f'<div class="fecho"><p>{_html.escape(s["fecho"])}</p></div>')
    if s.get("chamada"):
        partes.append('<div class="chamada"><i>&rarr;</i><span>'
                      + _html.escape(s["chamada"]) + '</span></div>')
    if s.get("cta"):
        partes.append(f'<div class="cta"><p>{_html.escape(s["cta"])}</p>'
                      f'<span class="link">{_html.escape(s["link"])}</span></div>')
    if s.get("autoria"):
        nome, cargo = s["autoria"]
        partes.append(f'<p class="autoria">{_html.escape(nome)} '
                      f'<span>· {_html.escape(cargo)}</span></p>')
    if s.get("slogan"):
        partes.append('<div class="assina"><p class="m">EJUP</p>'
                      f'<p class="s">{_html.escape(s["slogan"])}</p></div>')

    trilha = "".join(f'<i class="{"aqui" if j == i else ""}"></i>'
                     for j in range(total))
    return (f'<section class="slide" data-i="{i}">'
            f'<div class="marca-fundo">{simbolo}</div>'
            f'<div class="trilha">{trilha}</div>'
            f'<div class="corpo">{"".join(partes)}</div>'
            f'<div class="logo">{logo}</div>'
            '</section>')


def main() -> None:
    simbolo, logo = svg("ejup-symbol-navy.svg"), svg("ejup-horizontal-navy.svg")
    corpo = "\n".join(slide_html(s, i, len(SLIDES), simbolo, logo)
                      for i, s in enumerate(SLIDES))
    html = (HERE / "template.html").read_text(encoding="utf-8")
    for marca, valor in (("__FONT_FACES__", fontes()), ("__SLIDES__", corpo)):
        if marca not in html:
            sys.exit(f"marcador ausente: {marca}")
        html = html.replace(marca, valor)
    destino = OUT / "carrossel.html"
    destino.write_text(html, encoding="utf-8")
    print(f"gerado: {destino.name} ({destino.stat().st_size/1024:.0f} KB), "
          f"{len(SLIDES)} telas")


if __name__ == "__main__":
    main()
