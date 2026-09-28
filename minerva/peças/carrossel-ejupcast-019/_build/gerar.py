#!/usr/bin/env python3
"""Carrossel de divulgação · EJUPcast #019, com Marco Bruno.

Mesmo sistema do #018 (o do cartão, aprovado pelo Roberto) e a estrutura fixa
de 6 telas registrada em docs/minerva/prompts-conteudo.md.
Enquanto os frames do episódio não chegam em prints/, cada cartão de foto sai
como moldura sinalizada ("FOTO · ..."). Basta soltar os arquivos com os nomes
de FOTOS e rodar de novo.

Carrossel original do #018, de onde vem o sistema:

Estrutura adaptada da referência HUMAN Podcast (capa com número grande e
foto, tela de temas em tipografia gigante, uma frase por tela, cartão dos
convidados, tela de onde assistir). A paleta coral da referência vira navy,
aço e dourado; as facetas geométricas continuam, em SVG. Sem numeração nem
rótulo de tema no alto das telas.

Texto: texto-carrossel.md (falas extraídas da transcrição, com timecode).
Fotos: frames do episódio (prints/).
"""
import base64
import io, re
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


def reserva(rotulo, w=1200, h=900):
    """Cartão provisório em aço, com o que falta escrito nele."""
    from PIL import ImageDraw, ImageFont
    im = Image.new("RGB", (w, h), "#304557")
    d = ImageDraw.Draw(im)
    fonte = ImageFont.truetype(str(FONTS / "Gotham-Medium.otf"), max(28, w // 26))
    x0, y0, x1, y1 = d.textbbox((0, 0), rotulo, font=fonte)
    d.text(((w - x1) / 2, (h - y1) / 2), rotulo, font=fonte, fill="#d1d3d4")
    d.rectangle((24, 24, w - 24, h - 24), outline="#d1d3d4", width=3)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def foto(nome, caixa=None, largura=1400, rotulo="FOTO"):
    """Recorta (fração x0,y0,x1,y1) e devolve JPEG em base64.
    Sem o arquivo em prints/, devolve o cartão provisório."""
    alvo = next((PR / f"{nome}.{e}" for e in ("jpg", "png", "webp")
                 if (PR / f"{nome}.{e}").exists()), None)
    if alvo is None:
        return reserva(rotulo)
    im = Image.open(alvo).convert("RGB")
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


SETA = '<div class="seta"><span>&rarr;</span></div>'


def painel(altura, extra=""):
    """O painel navy de cantos arredondados, com facetas e o logo ejup/cast."""
    return (f'<div class="painel" style="height:{altura}px">{facetas(1000, altura)}'
            f'<div class="painel-logo">{LOGO_B}<span>/cast</span></div>{extra}</div>')


# Só o logotipo "ejup", sem o símbolo e sem "Educação Jurídica", como na TV do estúdio.
MARCA_B = re.sub(r'viewBox="[^"]*"', 'viewBox="352 690 282 118"', LOGO_B, count=1)


def selo_cast(d=540):
    """O selo EJUPcast da tela do estúdio: logotipo e /CAST num círculo fino com dois pontos."""
    import math
    r = d / 2 - 6
    pts = "".join(
        f'<circle cx="{d/2 + r*math.cos(math.radians(a)):.1f}" cy="{d/2 + r*math.sin(math.radians(a)):.1f}" r="7" fill="#f0b855"/>'
        for a in (-70, 115))
    return (f'<div class="selo" style="width:{d}px;height:{d}px">'
            f'<svg class="selo-aro" viewBox="0 0 {d} {d}"><circle cx="{d/2}" cy="{d/2}" r="{r}" fill="none" '
            f'stroke="#d1d3d4" stroke-opacity=".55" stroke-width="2"/>{pts}</svg>'
            f'<div class="selo-marca"><div>{MARCA_B}<span>/cast</span></div></div></div>')


def cartao(img, estilo):
    return f'<div class="foto-card" style="{estilo};background-image:url({img})"></div>'


def frase(texto, autor, tempo, img, lado, corpo=58):
    """Frase no sistema do cartão: painel no alto, foto em cartão sobreposta,
    citação e autor alinhados na mesma margem."""
    x = "left:112px" if lado == "e" else "right:112px"
    return f"""<section class="s papel">
  {painel(420)}
  {cartao(img, x + ";top:250px;width:560px;height:420px")}
  <p class="aspas">“</p>
  <h1 class="frase" style="font-size:{corpo}px">{texto}</h1>
  <p class="autor">{autor}<span>{tempo}</span></p>
  {SETA}
</section>"""


# A confirmar com quem edita o vídeo: nunca inventar tempo de corte nem duração.
TEMPO_1 = ""        # ex. "22:44"
TEMPO_2 = ""
DURACAO = "[duração]"  # ex. "1h06"; o colchete sinaliza que falta


def telas():
    capa_foto = foto("capa", rotulo="FOTO · MARCO BRUNO (3:4)")
    foto_f1 = foto("frase-1", rotulo="FOTO · MARCO BRUNO FALANDO")
    foto_f2 = foto("frase-2", rotulo="FOTO · OUTRO PLANO DELE")
    conversa = foto("conversa", largura=1712, rotulo="FOTO · MESA, ELE E A DRA. ROSSANA")
    return [
        # 1 · capa
        f"""<section class="s papel">
  {painel(760, '<p class="capa-ep">EP</p><p class="capa-num">019</p>')}
  {cartao(capa_foto, "right:112px;top:200px;width:480px;height:640px")}
  <h1 class="cartao-tit capa-tit"><span>Episódio #19</span>Marco Bruno</h1>
  <p class="capa-gancho" style="top:1130px;font-size:42px;line-height:1.25">A tradição só é tradição porque<br>um dia foi inovadora.</p>
  {SETA}
</section>""",
        # 2 · temas
        f"""<section class="s papel">
  {painel(300)}
  <p class="rotulo">Nesta conversa</p>
  <ul class="temas"><li>Inovação judicial</li><li>Doutrina e jurisprudência</li><li>Prevenção de litígios</li><li>Inteligência artificial</li><li>Berkeley</li></ul>
  <p class="temas-rod">__DURACAO__ de conversa com a Dra. Rossana Fonseca.</p>
  {SETA}
</section>""",
        frase("A gente vai perceber que a verdadeira perfeição <em>é imperfeita.</em>",
              "Marco Bruno", TEMPO_1, foto_f1, "e", corpo=80),
        frase("A missão da nossa geração é destruir a inteligência artificial, porque <em>criar é que é a parte bacana.</em>",
              "Marco Bruno", TEMPO_2, foto_f2, "d", corpo=64),
        # 5 · cartão (o que o Roberto aprovou)
        f"""<section class="s papel">
  {painel(460, '<div class="play" style="top:40px;right:48px">Assistir <span>&#9654;</span></div>')}
  {cartao(conversa, "left:112px;right:112px;top:230px;height:440px")}
  <h1 class="cartao-tit"><span>Episódio #19</span>Marco Bruno</h1>
  <p class="bio" style="margin-top:880px;font-size:30px"><b>Marco Bruno Miranda Clementino</b> é juiz federal no Rio Grande do Norte, professor da UFRN e visiting scholar na Universidade da Califórnia, em Berkeley.</p>
  <p class="bio" style="font-size:30px">Na Justiça Federal do RN, criou a comissão de prevenção de demandas que deu origem aos Centros de Inteligência da Justiça Federal. É um dos coordenadores do livro <b>Projeto Amaro</b>, sobre o jurista potiguar Amaro Cavalcanti.</p>
  <p class="bio mini" style="font-size:26px">Com a Dra. Rossana Fonseca.</p>
</section>""",
        # 6 · onde assistir
        f"""<section class="s papel">
  <div class="painel painel-selo" style="height:740px">{facetas(1000, 740)}{selo_cast()}</div>
  <h1 class="cartao-tit" style="top:816px"><span>Episódio completo</span>Assista no YouTube<br>e no Spotify.</h1>
  <p class="pergunta" style="top:1046px">E você: cita mais <em>doutrina</em> ou mais <em>jurisprudência</em> nas suas petições? Conta nos comentários.</p>
  <div class="play" style="top:1236px;left:112px;right:auto">Link na bio <span>&#9654;</span></div>
</section>""",
    ]


def main():
    html = (HERE / "template.html").read_text(encoding="utf-8")
    t = telas()
    html = html.replace("__FONT_FACES__", fontes()).replace("__SLIDES__", "\n".join(t)).replace("__DURACAO__", DURACAO)
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    print(f"gerado: {len(t)} telas")


if __name__ == "__main__":
    main()
