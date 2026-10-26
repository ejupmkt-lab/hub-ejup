#!/usr/bin/env python3
"""Carrossel · "A educação do futuro está em curso" (Roberto Pivotto).

Sete telas 1080x1350 no sistema de carrossel da EJUP (skills/ejup-design/CARROSSEL.md,
template do carrossel do LinkedIn da ANEEL): telas escuras com foto sangrada no
alto e texto no terço inferior, alternando com telas de papel com anel, cartões
e lista em bronze. Título de pesos mistos, corpo justificado, sem rótulo de seção.

Sem numeral nas telas das lições: em Gotham Black o "I" vazado vira barra e não
se lê como número; a sequência fica no próprio texto.

    python3 _build/gerar.py
"""
import base64, html as _html, io, math, pathlib
from PIL import Image, ImageEnhance, ImageOps
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
FOTOS = OUT / "fotos"
ROSTO = RAIZ / "peças" / "capa-artigo-educacao-china" / "_build" / "foto-tratada.webp"

# recorte (fração x0,y0,x1,y1) e centro do enquadramento de cada foto
RECORTE = {"01-capa": ((0.18, 0.12, 0.82, 0.86), (0.5, 0.5)),
           "03-escala": ((0.0, 0.18, 1.0, 0.80), (0.5, 0.5)),
           "05-regua": ((0.0, 0.0, 1.0, 1.0), (0.5, 0.5)),
           "07-fecho": ((0.0, 0.0, 1.0, 1.0), (0.5, 0.4))}


def anel(pct, claro):
    r, c = 42, 2 * math.pi * 42
    trilha, arco = ("rgba(3,28,55,.12)", "#9b6b26") if claro else ("#304557", "#f0b855")
    cor = "#031c37" if claro else "#fff"
    return (f'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="{r}" fill="none" stroke="{trilha}" stroke-width="8"/>'
            f'<circle cx="50" cy="50" r="{r}" fill="none" stroke="{arco}" stroke-width="8" stroke-linecap="round" '
            f'stroke-dasharray="{c * pct / 100:.1f} {c:.1f}" transform="rotate(-90 50 50)"/>'
            f'<text x="50" y="58" text-anchor="middle" style="font:900 24px Gotham;fill:{cor};letter-spacing:-1px">{pct}%</text></svg>')


T = [
    {"fundo": "escuro", "foto": "01-capa",
     "titulo": [("k", "A educação do futuro "), ("g", "está em curso.")],
     "corpo": ["Em cinco anos, a China revisou mais de 30% dos cursos de graduação. "
               "O método merece atenção. <b>A base da formação merece defesa.</b>"],
     "autoria": ("Roberto Pivotto", "Sócio da EJUP · Coluna jurídica"),
     "pilula": "Arraste e entenda o caso"},

    {"fundo": "claro",
     "titulo": [("k", "Mais de 30% da oferta "), ("l", "de graduação "), ("g", "mudou em cinco anos.")],
     "anel": (30, "Entre 2021 e 2025, as universidades chinesas revogaram ou suspenderam cerca de "
                  "<b>12.200 cursos</b> e criaram cerca de <b>10.200</b>.",
              "Ministério da Educação da China, via SCMP e Forbes"),
     "cartoes": [("2014", "57 cursos eliminados", False),
                 ("ciclos recentes", "mais de mil por ano", True)],
     "fonte2": "Caixin"},

    {"fundo": "escuro", "foto": "03-escala",
     "titulo": [("k", "A manchete diz que a China trocou humanidades por inteligência artificial. "),
                ("g", "Os números contam outra história.")],
     "corpo": ["O saldo entre cursos criados e retirados é de cerca de <b>2.000 a menos</b>. "
               "Uma reorganização do portfólio, com cortes em línguas, artes, gestão e marketing, "
               "e criações que vão de semicondutores a arteterapia."]},

    {"fundo": "claro",
     "titulo": [("k", "A revisão do currículo "), ("g", "virou política de Estado.")],
     "lista": [("Meta de 20% até 2025", "Guia do Ministério da Educação e de outros quatro órgãos, de 2023."),
               ("Canal de aprovação acelerada", "Para áreas ligadas a prioridades estratégicas."),
               ("15 cursos interdisciplinares", "No catálogo de graduação de abril de 2026.")],
     "fecho": "Um currículo que leva anos para mudar forma para <b>um mercado que já passou.</b>"},

    {"fundo": "escuro", "foto": "05-regua",
     "titulo": [("k", "O indicador escolhido "), ("l", "molda "), ("g", "o que a universidade faz.")],
     "corpo": ["O sistema de cartões vermelho e amarelo para cursos com baixa empregabilidade não tem "
               "critério nacional público. Quem defende avaliação por resultado precisa defender "
               "<b>a transparência de como o resultado é medido.</b>"]},

    {"fundo": "claro",
     "titulo": [("k", "Humanidades com inteligência artificial "), ("g", "ainda é uma hipótese.")],
     "corpo": ["As reformulações existem, mas ainda não há dados de emprego dos formados nem "
               "avaliação dos resultados. A China testa em escala nacional uma aposta sem resposta."],
     "cartoes": [("Future of Jobs 2025", "Pensamento analítico é a habilidade mais procurada", False),
                 ("7 em cada 10", "empresas a consideram essencial", True)]},

    {"fundo": "escuro", "foto": "07-fecho",
     "titulo": [("k", "A qualidade da educação do futuro "), ("g", "depende do critério "), ("l", "de quem forma.")],
     "corpo": ["Defendemos uma formação que une as duas frentes: repertório para usar a ferramenta e "
               "<b>profundidade para interpretá-la.</b>"],
     "pilula": "Leia o artigo completo · link na bio"},
]


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    return "\n".join(
        f"@font-face{{font-family:'Gotham';font-weight:{peso};src:url({b64(FONTS / f'Gotham-{n}.otf', 'font/otf')}) format('opentype')}}"
        for n, peso in (("Light", 300), ("Book", 400), ("Medium", 500), ("Bold", 700), ("Black", 900)))


def foto(nome):
    """Cor natural, levemente contida: sem duotone."""
    im = Image.open(FOTOS / f"{nome}.jpg").convert("RGB")
    (x0, y0, x1, y1), centro = RECORTE[nome]
    im = im.crop((int(im.width * x0), int(im.height * y0), int(im.width * x1), int(im.height * y1)))
    im = ImageEnhance.Color(im).enhance(.72)
    im = ImageEnhance.Brightness(im).enhance(.86)
    im = ImageOps.fit(im, (1080, 1350), Image.LANCZOS, centering=centro)
    buf = io.BytesIO(); im.save(buf, "WEBP", quality=86)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def rosto():
    im = Image.open(ROSTO).convert("RGBA")
    w, h = im.size
    im = im.crop((int(w * .3), 0, int(w * .7), int(w * .4)))
    bg = Image.new("RGBA", im.size, (3, 28, 55, 255)); bg.alpha_composite(im)
    buf = io.BytesIO(); bg.convert("RGB").save(buf, "JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def bloco(s):
    claro = s["fundo"] == "claro"
    p = ['<h1 class="titulo">' + "".join(f'<span class="{k}">{_html.escape(t)}</span>' for k, t in s["titulo"]) + "</h1>"]
    p += [f'<p class="corpo">{c}</p>' for c in s.get("corpo", [])]
    if s.get("anel"):
        pct, txt, fonte = s["anel"]
        p.append(f'<div class="anel">{anel(pct, claro)}<p class="txt">{txt}</p></div><p class="fonte">Fonte: {fonte}</p>')
    if s.get("lista"):
        p.append('<div class="lista">' + "".join(
            f'<div class="it"><span class="n">{i + 1}</span><span class="t">{_html.escape(t)}<small>{_html.escape(d)}</small></span></div>'
            for i, (t, d) in enumerate(s["lista"])) + "</div>")
    if s.get("cartoes"):
        p.append('<div class="cartoes">' + "".join(
            f'<div class="c{" destaque" if dst else ""}"><p class="i">{_html.escape(i.upper())}</p><p class="r">{_html.escape(r)}</p></div>'
            for i, r, dst in s["cartoes"]) + "</div>")
    if s.get("fonte2"):
        p.append(f'<p class="fonte">Fonte: {s["fonte2"]}</p>')
    if s.get("fecho"):
        p.append(f'<p class="fecho">{s["fecho"]}</p>')
    if s.get("autoria"):
        nome, cargo = s["autoria"]
        # sem foto do autor na capa (Victor, 09/10/2026): só nome e cargo
        p.append(f'<div class="autoria"><p class="quem">{nome}<span>{cargo}</span></p></div>')
    if s.get("pilula"):
        p.append(f'<div class="pilula"><i>&rarr;</i><span>{_html.escape(s["pilula"])}</span></div>')
    ancora = "abaixo" if s.get("foto") else "meio"
    return f'<div class="bloco {ancora}">' + "".join(p) + "</div>"


def main():
    logo = (LOGOS / "ejup-horizontal-navy.svg").read_text(encoding="utf-8")
    slides = []
    for s in T:
        fundo = f'<div class="foto"><img src="{foto(s["foto"])}" alt=""></div>' if s.get("foto") else ""
        num = f'<div class="numeral">{s["numeral"]}</div>' if s.get("numeral") else ""
        slides.append(f'<section class="slide {s["fundo"]}">{fundo}{num}{bloco(s)}<div class="logo"><div>{logo}</div></div></section>')
    html = (HERE / "template.html").read_text(encoding="utf-8")
    html = html.replace("__FONT_FACES__", fontes()).replace("__SLIDES__", "\n".join(slides))
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1200, "height": 1500})
        pg.goto((OUT / "carrossel.html").as_uri()); pg.wait_for_timeout(900)
        print("escala por tela:", pg.evaluate("() => [...document.querySelectorAll('.slide')].map(s => +s.dataset.escala)"))
        for i in range(len(T)):
            pg.locator(".slide").nth(i).screenshot(path=str(OUT / "telas" / f"tela-{i + 1:02d}.png"))
        b.close()
    ims = [Image.open(OUT / "telas" / f"tela-{i + 1:02d}.png").convert("RGB").resize((432, 540)) for i in range(len(T))]
    c = Image.new("RGB", (4 * 442, 2 * 550), "#222")
    for k, im in enumerate(ims):
        c.paste(im, ((k % 4) * 442, (k // 4) * 550))
    c.save(OUT / "visualizacao-completa.png")
    print("ok")


if __name__ == "__main__":
    main()
