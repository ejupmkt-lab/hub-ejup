#!/usr/bin/env python3
"""Carrossel — "O poder de polícia ambiental municipal".

Doze telas 1080×1440, e o que faz cada uma diferente da outra:

* **fio condutor** — uma linha entra em cada tela na altura exata em que saiu
  da anterior. Passando o dedo, é uma linha só atravessando o carrossel;
* **ritmo escuro/claro** — as telas de respiro são brancas e carregam uma frase
  sozinha. Servem para o leitor descansar entre dois blocos densos;
* **diagramas** — federação, requisitos, fluxo comparado, matriz de 167
  municípios e responsabilidade. Mostram mecanismo, não decoram;
* **espaço de foto** — as telas 1 e 12 têm slot; se existir `foto-N.jpg` na
  pasta da peça, ela entra ali.

Correções de fato aplicadas ao roteiro original estão no README.
"""
import base64
import html as _html
import pathlib
import sys

import figuras

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"

FACES = [("Gotham-Light.otf", 300), ("Gotham-Book.otf", 400),
         ("Gotham-Medium.otf", 500), ("Gotham-Black.otf", 900)]

# Altura em que o fio entra e sai de cada tela. A saída de uma é a entrada da
# seguinte, e é isso que costura o carrossel. Os valores ficam na faixa baixa
# (1150 a 1300) de propósito: ali o fio não cruza texto nem diagrama, e o olho
# o encontra sempre no mesmo lugar ao passar o dedo.
FIO = [1160, 1230, 1180, 1290, 1200, 1260, 1170, 1240, 1190, 1280, 1210, 1250]

SLIDES = [
    {"fundo": "escuro", "foto_bg": "cidade",
     "rotulo": "Poder de polícia ambiental",
     "titulo": "Seu município pode emitir uma licença ambiental hoje mesmo. "
               "<b>Mas isso significa que ele está preparado para isso?</b>",
     "chamada": "Arraste para o lado e entenda por que essa pergunta importa "
                "mais do que parece"},

    {"fundo": "escuro",
     "rotulo": "O que está em jogo",
     "titulo": "A autoridade de <b>condicionar o privado</b> em nome do meio "
               "ambiente",
     "texto": ["Poder de polícia ambiental é a autoridade que o poder público "
               "tem para limitar ou condicionar atividades privadas em nome da "
               "proteção ao meio ambiente, por meio de licenciamento, "
               "fiscalização e sanções."],
     "caixa_foto": "natureza",
     "fecho": "E sim, os municípios também têm essa competência."},

    {"fundo": "claro", "respiro": True,
     "frase": "Ter competência no papel é apenas <b>o primeiro passo</b>.",
     "nota": "A Constituição distribui a competência. Quem a exerce depende de "
             "outra coisa."},

    {"fundo": "escuro",
     "rotulo": "A base constitucional",
     "titulo": "Competência <b>comum</b> para proteger o meio ambiente",
     "figura": "federacao"},

    {"fundo": "escuro",
     "rotulo": "O requisito que muda tudo",
     "titulo": "A <b>LC 140/2011</b> não deixa margem",
     "figura": "requisitos",
     "fecho": "Sem essa estrutura, quem licencia é o Estado, mesmo que o "
              "município queira assumir."},

    {"fundo": "escuro",
     "rotulo": "A busca por agilidade",
     "titulo": "O licenciamento <b>simplificado</b> ganhou força",
     "texto": ["A Lei Geral do Licenciamento Ambiental, sancionada em 2025 e "
               "<b>em vigor desde fevereiro de 2026</b>, generalizou "
               "modalidades sem análise técnica prévia."],
     "figura": "fluxo"},

    {"fundo": "claro", "respiro": True,
     "frase": "Menos entrave na entrada. <b>Mas e o controle depois?</b>",
     "nota": "A pergunta não é retórica. É o ponto em que a decisão do STF "
             "passa a importar."},

    {"fundo": "escuro", "foto_bg": "colunas",
     "rotulo": "O que o STF decidiu",
     "titulo": "Capacidade institucional como <b>requisito de competência</b>",
     "texto": ["Em <b>dezembro de 2022</b>, o Supremo Tribunal Federal validou "
               "o modelo descentralizado na ADI 4.757.",
               "O detalhe importante está na letra miúda: a Corte tratou a "
               "capacidade institucional do órgão ambiental como requisito da "
               "própria competência, não como formalidade dispensável."],
     "fecho": "Agilidade sem estrutura não é simplificação. É risco."},

    {"fundo": "claro", "respiro": True,
     "frase": "A competência formal existe para todos. <b>A capacidade real de "
              "exercê-la, não.</b>",
     "nota": "E é aqui que o Rio Grande do Norte entra na conta."},

    {"fundo": "escuro",
     "rotulo": "A realidade no Rio Grande do Norte",
     "dado": ("13", "de 167"),
     "legenda": "municípios potiguares têm estrutura própria de licenciamento "
                "ambiental. Nos outros 154, quem licencia continua sendo o "
                "próprio Estado.",
     "figura": "matriz",
     "legenda_fig": "Cada quadrado é um município · fonte: Idema"},

    {"fundo": "escuro",
     "rotulo": "O risco de ignorar isso",
     "titulo": "Simplificar o rito não pode significar <b>simplificar a "
               "responsabilidade</b>",
     "caixa_foto": "declaracao",
     "figura": "responsabilidade"},

    {"fundo": "escuro",
     "rotulo": "O artigo completo",
     "titulo": "Fundamentos, limites e <b>aplicação prática</b>",
     "cta": "Para entender o cenário com profundidade, dados e base legal "
            "completa, o artigo está no site da EJUP.",
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


def svg(nome: str) -> str:
    caminho = LOGOS / nome
    if not caminho.exists():
        sys.exit(f"logo ausente: {caminho}")
    return caminho.read_text(encoding="utf-8").strip()


def duo(nome: str) -> str:
    """Foto em duotone, embutida. Vazio se o arquivo não existir."""
    arq = HERE / "duotone" / f"{nome}.webp"
    if not arq.exists():
        return ""
    b64 = base64.b64encode(arq.read_bytes()).decode("ascii")
    return f'data:image/webp;base64,{b64}'


def foto_tag(n: int):
    for ext, mime in (("jpg", "jpeg"), ("jpeg", "jpeg"), ("png", "png"),
                      ("webp", "webp")):
        arq = OUT / f"foto-{n}.{ext}"
        if arq.exists():
            b64 = base64.b64encode(arq.read_bytes()).decode("ascii")
            return (f'<div class="slot cheio">'
                    f'<img src="data:image/{mime};base64,{b64}" alt=""></div>')
    return ('<div class="slot"><span>foto ' + str(n) +
            '<br>solte foto-' + str(n) + '.jpg na pasta</span></div>')


def fio_svg(entra: int, sai: int, claro: bool) -> str:
    cor = "#9b6b26" if claro else "#f0b855"
    op = ".28" if claro else ".34"
    meio = 540
    d = (f"M0 {entra}C{meio*0.55} {entra} {meio*0.45} {sai} 1080 {sai}")
    return ('<div class="fio"><svg viewBox="0 0 1080 1440" '
            'preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'
            f'<path d="{d}" fill="none" stroke="{cor}" stroke-opacity="{op}" '
            'stroke-width="2"/></svg></div>')


def slide_html(s: dict, i: int, total: int, simbolo: str, logo: str) -> str:
    claro = s["fundo"] == "claro"
    trilha = "".join(f'<i class="{"aqui" if j == i else ""}"></i>'
                     for j in range(total))
    if s.get("foto_bg") and duo(s["foto_bg"]):
        fundo = (f'<div class="foto-bg"><img src="{duo(s["foto_bg"])}" '
                 'alt=""></div>')
    else:
        fundo = "" if claro else f'<div class="marca-fundo">{simbolo}</div>'

    if s.get("respiro"):
        miolo = ('<div class="respiro"><div class="regua"></div>'
                 f'<p>{s["frase"]}</p>'
                 + (f'<p class="nota">{_html.escape(s["nota"])}</p>'
                    if s.get("nota") else "") + '</div>')
    else:
        p = [f'<p class="rotulo">{_html.escape(s["rotulo"])}</p>']
        if s.get("titulo"):
            p.append(f'<h2 class="titulo">{s["titulo"]}</h2>')
        if s.get("dado"):
            n, de = s["dado"]
            p.append(f'<div class="dado"><span class="n">{n}</span>'
                     f'<span class="de">{_html.escape(de)}</span></div>'
                     f'<p class="legenda">{_html.escape(s["legenda"])}</p>')
        if s.get("texto"):
            p.append('<div class="texto">'
                     + "".join(f"<p>{t}</p>" for t in s["texto"]) + "</div>")
        if s.get("caixa_foto") and duo(s["caixa_foto"]):
            p.append(f'<div class="caixa-foto">'
                     f'<img src="{duo(s["caixa_foto"])}" alt=""></div>')
        if s.get("figura"):
            p.append('<div class="fig">' + figuras.FIGURAS[s["figura"]]()
                     + (f'<p class="cap">{_html.escape(s["legenda_fig"])}</p>'
                        if s.get("legenda_fig") else "") + '</div>')
        if s.get("fecho"):
            p.append(f'<div class="fecho"><p>{_html.escape(s["fecho"])}</p></div>')
        if s.get("foto"):
            p.append(foto_tag(s["foto"]))
        if s.get("chamada"):
            p.append('<div class="chamada"><i>&rarr;</i><span>'
                     + _html.escape(s["chamada"]) + '</span></div>')
        if s.get("cta"):
            p.append(f'<div class="cta"><p>{_html.escape(s["cta"])}</p>'
                     f'<span class="link">{_html.escape(s["link"])}</span></div>')
        if s.get("autoria"):
            nome, cargo = s["autoria"]
            # o retrato do autor já existe tratado na peça das capas do mesmo
            # artigo; reaproveitar mantém as duas peças na mesma imagem
            retrato = (RAIZ / "peças" / "capa-artigo-poder-policia-ambiental"
                       / "_build" / "foto-tratada.webp")
            rosto = ""
            if retrato.exists():
                b64 = base64.b64encode(retrato.read_bytes()).decode("ascii")
                rosto = ('<div class="rosto"><img src="data:image/webp;base64,'
                         + b64 + '" alt=""></div>')
            p.append('<div class="autoria">' + rosto +
                     f'<p class="quem">{_html.escape(nome)}'
                     f'<span>{_html.escape(cargo)}</span></p></div>')
        if s.get("slogan"):
            p.append('<div class="assina"><p class="m">EJUP</p>'
                     f'<p class="s">{_html.escape(s["slogan"])}</p></div>')
        miolo = f'<div class="corpo">{"".join(p)}</div>'

    limite = min(FIO[i], FIO[(i + 1) % len(FIO)])
    return (f'<section class="slide {s["fundo"]}" data-i="{i}" '
            f'data-fio="{limite}">'
            + fundo + fio_svg(FIO[i], FIO[(i + 1) % len(FIO)], claro)
            + f'<div class="trilha">{trilha}</div>' + miolo
            + f'<div class="logo">{logo}</div></section>')


def main() -> None:
    if len(FIO) < len(SLIDES):
        sys.exit("FIO precisa de uma altura por tela")
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
    faltando = [s["foto"] for s in SLIDES
                if s.get("foto") and "solte foto" in foto_tag(s["foto"])]
    if faltando:
        print("aviso: sem foto nas telas com slot", faltando)
    print(f"gerado: {destino.name} ({destino.stat().st_size/1024:.0f} KB), "
          f"{len(SLIDES)} telas")


if __name__ == "__main__":
    main()
