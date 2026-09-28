#!/usr/bin/env python3
"""Carrossel do LinkedIn · "O sistema multiportas da ANEEL".

Sete telas 1080×1350 no sistema do carrossel de poder de polícia ambiental
(o aprovado; regras em skills/ejup-design/CARROSSEL.md): telas escuras com
foto em duotone sangrada, scrim só embaixo e texto no terço inferior,
alternando com telas de papel claro com lista e cartões em bronze.
Título de pesos mistos, corpo justificado, sem rótulo de seção.

O fio entre as telas são as quatro portas, pequenas, acima de cada título:
cada tela acende a porta de que fala.

    python3 _build/linkedin.py && python3 _build/render.py
"""
import base64
import html as _html
import io
import pathlib

from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
FOTOS = OUT / "fotos"

PORTAS = ["Ouvidoria", "Mediação", "Arbitragem", "Judiciário"]
TODAS = {0, 1, 2, 3}

# mesmo duotone do carrossel de poder de polícia
SOMBRA, LUZ = (3, 16, 30), (168, 198, 224)

T = [
    {"fundo": "escuro", "foto": "01-capa", "portas": TODAS,
     "titulo": [("k", "O setor elétrico tem "), ("g", "quatro portas "),
                ("l", "para um mesmo conflito.")],
     "corpo": ["Ouvidoria, mediação administrativa, arbitragem e Judiciário. "
               "Conhecer cada via, e a base legal que a sustenta, integra a "
               "atuação de quem advoga no setor."],
     "pilula": "Arraste e conheça cada uma"},

    {"fundo": "claro", "portas": set(),
     "titulo": [("k", "A via administrativa "), ("l", "nasce com a "),
                ("g", "própria ANEEL.")],
     "corpo": ["A <b>Lei nº 9.427/1996</b>, que criou a Agência, atribui a ela "
               "dirimir as divergências entre os agentes do setor e entre eles "
               "e os consumidores."],
     "lista": [("Lei nº 13.848/2019", "Art. 22: a ouvidoria das agências reguladoras."),
               ("Lei nº 10.848/2004", "Art. 4º, §5º: a arbitragem na comercialização."),
               ("REN ANEEL nº 957/2021", "As câmaras arbitrais credenciadas."),
               ("REN ANEEL nº 1.061/2023", "Cria a SMA, que conduz a mediação.")]},

    {"fundo": "escuro", "foto": "03-ouvidoria", "portas": {0},
     "titulo": [("k", "200 mil reclamações por ano "), ("l", "chegam à ANEEL pela "),
                ("g", "Ouvidoria Setorial.")],
     "corpo": ["É a porta do consumidor que não resolveu o problema com a "
               "distribuidora. Cada registro segue para a concessionária "
               "responder, e o conjunto <b>alimenta a fiscalização</b> e as "
               "novas regras do setor."]},

    {"fundo": "claro", "portas": {1},
     "titulo": [("k", "O mediador facilita o diálogo. "), ("g", "O acordo é das partes.")],
     "corpo": ["Conduzida pela própria Agência, a mediação administrativa trata "
               "conflitos técnicos e regulatórios com quem conhece o setor."],
     "cartoes": [("2018 a 2023", "36 mediações conduzidas", False),
                 ("prazo médio", "383 dias até a conclusão", True)],
     "fecho": "Volume pequeno diante das 200 mil reclamações: a porta existe e "
              "ainda é <b>pouco usada</b>."},

    {"fundo": "escuro", "foto": "05-arbitragem", "portas": {2},
     "titulo": [("k", "Na comercialização, "), ("l", "os agentes escolhem "),
                ("g", "a câmara arbitral.")],
     "corpo": ["A <b>REN ANEEL nº 957/2021</b> abriu as disputas no âmbito da "
               "CCEE a qualquer câmara credenciada. Antes, uma única câmara "
               "concentrava esses casos.",
               "Em certos contratos, arbitragem e processo judicial convivem, "
               "conforme os critérios de matéria e valor definidos entre as partes."]},

    {"fundo": "claro", "portas": {3},
     "titulo": [("k", "25 mil ações "), ("l", "no setor elétrico em 2021, "),
                ("g", "o pico da série.")],
     "cartoes": [("2021", "25 mil ações judiciais", True),
                 ("apagão no Amapá", "cerca de 4 mil delas", False)],
     "fecho": "A via judicial segue aberta a qualquer parte. As outras portas "
              "<b>ampliam o repertório</b> de quem conduz o conflito."},

    {"fundo": "escuro", "foto": "07-fecho", "portas": TODAS,
     "titulo": [("k", "Escolher a porta certa "), ("g", "integra a estratégia "),
                ("l", "do caso.")],
     "corpo": ["Assessorar um consumidor diante da distribuidora ou orientar um "
               "agente numa controvérsia contratual começa pela via adequada."],
     "pilula": "Leia o artigo completo no site da EJUP"},
]


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    return "\n".join(
        f"@font-face{{font-family:'Gotham';font-weight:{peso};"
        f"src:url({b64(FONTS / f'Gotham-{n}.otf', 'font/otf')}) format('opentype')}}"
        for n, peso in (("Light", 300), ("Book", 400), ("Medium", 500),
                        ("Bold", 700), ("Black", 900)))


def duo(nome):
    im = Image.open(FOTOS / f"{nome}.jpg").convert("RGB")
    cinza = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(1, 3))
    im = ImageOps.colorize(cinza, black=SOMBRA, white=LUZ)
    im = ImageOps.fit(im, (1080, 1350), Image.LANCZOS, centering=(0.5, 0.35))
    buf = io.BytesIO(); im.save(buf, "WEBP", quality=86)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def portas_mini(acesas, claro):
    luz, apagada = ("#9b6b26", "rgba(65,64,66,.35)") if claro else ("#f0b855", "rgba(209,211,212,.45)")
    fundo_on = "rgba(155,107,38,.14)" if claro else "rgba(240,184,85,.18)"
    n, gap = 4, 0.3
    w = 100 / (n + (n - 1) * gap); h = w * 1.25; r = w / 2
    p = []
    for i in range(n):
        x = i * w * (1 + gap); on = i in acesas
        d = f"M{x:.2f},{h:.2f} V{r:.2f} A{r:.2f},{r:.2f} 0 0 1 {x + w:.2f},{r:.2f} V{h:.2f} Z"
        p.append(f'<path d="{d}" fill="{fundo_on if on else "none"}" stroke="{luz if on else apagada}" '
                 f'stroke-width="{1.6 if on else 1.1}" vector-effect="non-scaling-stroke"/>')
        p.append(f'<text x="{x + r:.2f}" y="{h + 7:.2f}" text-anchor="middle" '
                 f'class="rot{" on" if on else ""}">{PORTAS[i].upper()}</text>')
    return f'<svg class="portas-mini" viewBox="-1 -1 102 {h + 10:.2f}">{"".join(p)}</svg>'


def bloco(s):
    claro = s["fundo"] == "claro"
    p = [portas_mini(s["portas"], claro),
         '<h1 class="titulo">' + "".join(f'<span class="{k}">{_html.escape(t)}</span>'
                                          for k, t in s["titulo"]) + "</h1>"]
    p += [f'<p class="corpo">{c}</p>' for c in s.get("corpo", [])]
    if s.get("lista"):
        p.append('<div class="lista">' + "".join(
            f'<div class="it"><span class="n">{i + 1}</span><span class="t">{_html.escape(t)}'
            f'<small>{_html.escape(d)}</small></span></div>'
            for i, (t, d) in enumerate(s["lista"])) + "</div>")
    if s.get("cartoes"):
        p.append('<div class="cartoes">' + "".join(
            f'<div class="c{" destaque" if dst else ""}"><p class="i">{_html.escape(i.upper())}</p>'
            f'<p class="r">{_html.escape(r)}</p></div>' for i, r, dst in s["cartoes"]) + "</div>")
    if s.get("fecho"):
        p.append(f'<p class="fecho">{s["fecho"]}</p>')
    if s.get("pilula"):
        p.append(f'<div class="pilula"><i>&rarr;</i><span>{_html.escape(s["pilula"])}</span></div>')
    ancora = "meio" if claro else "abaixo"
    return f'<div class="bloco {ancora}">' + "".join(p) + "</div>"


def main():
    logo = (LOGOS / "ejup-horizontal-navy.svg").read_text(encoding="utf-8")
    simb = (LOGOS / "ejup-symbol-navy.svg").read_text(encoding="utf-8")
    slides = []
    for s in T:
        fundo = (f'<div class="foto"><img src="{duo(s["foto"])}" alt=""></div>' if s.get("foto")
                 else '<div class="arco"></div>')
        slides.append(f'<section class="slide {s["fundo"]}">{fundo}{bloco(s)}'
                      f'<div class="logo"><div>{logo}</div></div></section>')
    html = (HERE / "template-linkedin.html").read_text(encoding="utf-8")
    html = html.replace("__FONT_FACES__", fontes()).replace("__SLIDES__", "\n".join(slides))
    (OUT / "linkedin.html").write_text(html, encoding="utf-8")
    print(f"gerado: linkedin.html ({len(slides)} telas)")


if __name__ == "__main__":
    main()
