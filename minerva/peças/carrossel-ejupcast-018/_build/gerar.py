#!/usr/bin/env python3
"""Carrossel — EJUPcast #018, com Nicácio Carvalho e Eduardo Pacheco.

Estrutura adaptada da referência HUMAN Podcast (capa com número grande e
foto, tela de temas em tipografia gigante, uma frase por tela, cartão dos
convidados, tela de onde assistir). A paleta coral da referência vira navy,
aço e dourado; as facetas geométricas continuam, em SVG. Sem numeração nem
rótulo de tema no alto das telas.

Texto: texto-carrossel.md (falas extraídas da transcrição, com timecode).
Fotos: frames do episódio (prints/).
"""
import base64
import io
import pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
PR = OUT / "prints"


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    out = []
    for nome, peso, estilo in (("Thin", 200, "normal"), ("Light", 300, "normal"),
                               ("Book", 400, "normal"), ("BookItalic", 400, "italic"),
                               ("Medium", 500, "normal"), ("Black", 900, "normal")):
        out.append(f"@font-face{{font-family:'Gotham';font-weight:{peso};font-style:{estilo};"
                   f"src:url({b64(FONTS / f'Gotham-{nome}.otf', 'font/otf')}) format('opentype')}}")
    return "\n".join(out)


def foto(nome, caixa=None, largura=1400):
    """Recorta (fração x0,y0,x1,y1) e devolve JPEG em base64."""
    im = Image.open(PR / nome).convert("RGB")
    if caixa:
        w, h = im.size
        im = im.crop((int(w * caixa[0]), int(h * caixa[1]), int(w * caixa[2]), int(h * caixa[3])))
    if im.width > largura:
        im = im.resize((largura, round(im.height * largura / im.width)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


LOGO_B = (LOGOS / "ejup-horizontal-white.svg").read_text(encoding="utf-8")
LOGO_N = (LOGOS / "ejup-horizontal-navy.svg").read_text(encoding="utf-8")
SIMB_B = b64(LOGOS / "ejup-symbol-white.svg", "image/svg+xml")


def facetas(w=1080, h=1440, tom="escuro"):
    """Planos geométricos à maneira da referência, na paleta EJUP."""
    if tom == "escuro":
        c = ["#031c37", "#0a2a49", "#304557", "#1b3550", "#0d131a", "#3d5467"]
    else:
        c = ["#304557", "#3d5467", "#031c37", "#4d6376", "#1b3550", "#5a6f80"]
    pol = [
        (c[0], f"0,0 {w},0 {w},{h} 0,{h}"),
        (c[1], f"0,0 {w*.62},0 {w*.18},{h*.55} 0,{h*.42}"),
        (c[2], f"{w*.62},0 {w},0 {w},{h*.3}"),
        (c[3], f"{w*.18},{h*.55} {w},{h*.3} {w},{h*.78} {w*.4},{h}"),
        (c[4], f"0,{h*.42} {w*.18},{h*.55} {w*.4},{h} 0,{h}"),
        (c[5], f"{w},{h*.78} {w},{h} {w*.4},{h}"),
    ]
    g = "".join(f'<polygon points="{p}" fill="{f}"/>' for f, p in pol)
    return (f'<svg class="facetas" viewBox="0 0 {w} {h}" preserveAspectRatio="none">'
            f'<defs><linearGradient id="br" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="#fff" stop-opacity=".10"/>'
            f'<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'
            f'{g}<polygon points="{w*.62},0 {w*.18},{h*.55} {w},{h*.3}" fill="url(#br)"/></svg>')


def banda(img, altura=520):
    return (f'<div class="banda" style="height:{altura}px">'
            f'<div class="banda-foto" style="background-image:url({img})"></div></div>')


SETA = '<div class="seta"><span>&rarr;</span></div>'


def frase(texto, autor, tempo, escuro=False, img=None, tam=78):
    cls = "s tinta" if escuro else "s papel"
    return f"""<section class="{cls}">
  <p class="aspas">“</p>
  <h1 class="frase" style="font-size:{tam}px">{texto}</h1>
  <p class="autor">{autor}<span>{tempo}</span></p>
  {banda(img) if img else ''}
  {SETA}
</section>"""


def telas():
    capa_foto = foto("duo-vertical.webp", (0, .06, 1, .74), 1080)
    # recortes pensados para o quadro onde cada foto entra (proporção já certa)
    conversa = foto("duo-conversa.webp", (.20, 0.0, .86, .92))       # cartão, 460x360 (mesma proporção)
    faixa_duo = foto("duo-conversa.webp", (.10, .06, .95, .78))      # faixa 1080x520: rostos e mãos
    faixa_dir = foto("mesa-tres.webp", (.585, .21, 1.0, .61))        # faixa 1080x520: os dois à direita
    mesa = foto("mesa-tres.webp", (.08, .12, 1, .95))
    rossana = foto("rossana.webp", (.22, .08, .78, .9))
    return [
        # 1 · capa
        f"""<section class="s capa">
  {facetas()}
  <div class="capa-foto" style="background-image:url({capa_foto})"></div>
  <div class="capa-logo">{LOGO_B}<span>/cast</span></div>
  <p class="ep">EP</p>
  <p class="numero">018</p>
  <h1 class="nomes">Nicácio<br>Carvalho<br><em>&amp;</em> Eduardo<br>Pacheco</h1>
  <p class="capa-gancho">O advogado que<br>a IA não substitui.</p>
  <img class="capa-simb" src="{SIMB_B}" alt="">
</section>""",
        # 2 · temas
        f"""<section class="s papel">
  <h1 class="temas">INTELIGÊNCIA<br>ARTIFICIAL<br>ADVOCACIA<br>JOVEM<br>ADVOCACIA<br>OAB<br>SUPREMO</h1>
  <p class="lateral">EP 018 · NICÁCIO CARVALHO · EDUARDO PACHECO</p>
  <div class="arco">{facetas(1080, 420, "claro")}</div>
  <p class="temas-rod">1h06 de conversa. Arraste para o que ficou.</p>
  {SETA}
</section>""",
        frase("Se a IA faz o meu trabalho por mim, eu mesmo estou me colocando numa posição de <em>ser substituível.</em>",
              "Eduardo Pacheco", "22:44", img=faixa_duo, tam=80),
        frase("O advogado usa IA para peticionar, o juiz para sentenciar, o outro lado para recorrer. <em>O processo é julgado em cinco segundos.</em>",
              "Nicácio Carvalho", "27:19", escuro=True, tam=76, img=faixa_dir),
        # 5 · cartão
        f"""<section class="s papel">
  <div class="cartao-topo">{facetas(1000, 460)}<div class="cartao-logo">{LOGO_B}<span>/cast</span></div></div>
  <div class="cartao-foto" style="background-image:url({conversa})"></div>
  <h1 class="cartao-tit"><span>Episódio #18</span>Nicácio Carvalho<br>e Eduardo Pacheco</h1>
  <p class="bio"><b>Nicácio Carvalho</b> é sócio do Carvalho Costa Guerra Sociedade de Advogados, onde lidera a advocacia para empresas: trabalhista, contratos, direito digital, proteção de dados e societário.</p>
  <p class="bio"><b>Eduardo Pacheco</b> é sócio da Souza Pacheco e Oliveira Advocacia, com atuação para empresas nas áreas contratual, trabalhista, tributária e cível.</p>
  <p class="bio mini">Os dois presidiram a Comissão da Jovem Advocacia da OAB/RN. Com a Dra. Rossana Fonseca.</p>
  <div class="play">Assistir <span>&#9654;</span></div>
</section>""",
        # 6 · onde assistir
        f"""<section class="s cta">
  {facetas()}
  <div class="cta-foto" style="background-image:url({mesa})"></div>
  <h1 class="cta-tit">Assista ao<br>episódio<br><em>completo.</em></h1>
  <div class="canais"><p><small>no</small>YouTube</p><p><small>no</small>Spotify</p><p><small>link</small>na bio</p></div>
  <p class="pergunta">E você: usa IA para <em>escrever</em><br>ou para <em>pensar</em>?</p>
  <div class="cta-logo">{LOGO_B}</div>
</section>""",
    ]


def main():
    html = (HERE / "template.html").read_text(encoding="utf-8")
    t = telas()
    html = html.replace("__FONT_FACES__", fontes()).replace("__SLIDES__", "\n".join(t))
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    print(f"gerado: {len(t)} telas")


if __name__ == "__main__":
    main()
