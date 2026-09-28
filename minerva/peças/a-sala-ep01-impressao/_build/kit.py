#!/usr/bin/env python3
"""A Sala · ep. 01 · kit de provas para plano aberto.

As provas 10×15 somem num plano aberto: escuras e pequenas, viram retângulos
cinza. Este kit é em A4 (21×29,7 cm, 300 dpi) e segue o roteiro, na ordem em
que as coisas aparecem. Regras de legibilidade a 3 ou 4 metros de câmera:
* foto com contraste alto e recorte fechado (rosto ocupa metade da folha);
* cartão com UM dado grande (número ou nome com 3 a 5 cm de altura) e no
  máximo uma linha de apoio;
* etiqueta "Anexo NN" grande o bastante para ler no zoom de edição.
Envelhecimento leve (fotos antigas de arquivo), sem sépia.

    python3 _build/kit.py && python3 _build/render_kit.py
"""
import base64
import io
import pathlib
import random

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

from envelhecer import envelhecer

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
VORC = RAIZ / "peças" / "carrossel-caso-vorcaro"
W, H = 2480, 3508

LEVE = dict(preto=14, branco=238, vinheta=.82, grao=.09, macio=.5)


def uri(im, fmt="PNG"):
    buf = io.BytesIO(); im.save(buf, fmt, **({"quality": 90} if fmt == "JPEG" else {}))
    return f"data:image/{fmt.lower()};base64," + base64.b64encode(buf.getvalue()).decode()


def fontes():
    def b64(p):
        return base64.b64encode(p.read_bytes()).decode()
    return "\n".join(
        f"@font-face{{font-family:'Gotham';font-weight:{w};font-style:{st};"
        f"src:url(data:font/otf;base64,{b64(FONTS / f'Gotham-{n}.otf')}) format('opentype')}}"
        for n, w, st in (("Light", 300, "normal"), ("Book", 400, "normal"), ("BookItalic", 400, "italic"),
                         ("Medium", 500, "normal"), ("Bold", 700, "normal"), ("Black", 900, "normal")))


def papel(semente):
    """Folha de papel antigo frio: textura, manchas, uma dobra, bordas encardidas."""
    rnd = random.Random(semente)
    g = Image.new("L", (W, H), 234)
    g = Image.blend(g, Image.effect_noise((W, H), 40).filter(ImageFilter.GaussianBlur(1.2)), .06)
    for _ in range(3):
        x, y, r = rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(250, 600)
        m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).ellipse((x - r, y - r * .7, x + r, y + r * .7), outline=14, width=10)
        g = ImageChops.subtract(g, m.filter(ImageFilter.GaussianBlur(9)))
    y = rnd.uniform(H * .45, H * .55)                                   # dobra ao meio
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).line((0, y, W, y + rnd.uniform(-30, 30)), fill=26, width=6)
    g = ImageChops.subtract(g, m.filter(ImageFilter.GaussianBlur(4)))
    b = Image.new("L", (W, H), 0); ImageDraw.Draw(b).rectangle((0, 0, W, H), outline=26, width=60)
    g = ImageChops.subtract(g, b.filter(ImageFilter.GaussianBlur(40)))
    return ImageOps.colorize(g, black=(20, 24, 30), white=(240, 239, 234))


def foto(src, semente, centro=(.5, .3), rosto=False, recorte=None, brilho=1.0):
    im = Image.open(src).convert("RGB")
    if recorte:
        w, h = im.size; x0, y0, x1, y1 = recorte
        im = im.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1)))
    if brilho != 1.0:
        im = ImageEnhance.Brightness(ImageOps.autocontrast(im, cutoff=1)).enhance(brilho)
    im = ImageEnhance.Contrast(im).enhance(1.25)
    return envelhecer(im, W, H, semente, borda=70, centro=centro, rosto=rosto, **LEVE)


def ministro_src(nome):
    ia = VORC / "fotos" / f"{nome}-ia.png"
    return ia if ia.exists() else next((VORC / "fotos").glob(f"{nome}.*"))


def cartao_foto(n, img, nome, apoio="", cred=""):
    return f"""<section class="a4 foto"><img class="bg" src="{uri(img)}" alt="">
  <div class="tag"><span>Anexo {n}</span></div>
  <div class="placa"><p class="nome">{nome}</p>{f'<p class="apoio">{apoio}</p>' if apoio else ''}
  {f'<p class="cred">{cred}</p>' if cred else ''}</div></section>"""


def cartao(n, semente, miolo, classe=""):
    return f"""<section class="a4 doc {classe}"><img class="bg" src="{uri(papel(semente), 'JPEG')}" alt="">
  <div class="tag"><span>Anexo {n}</span></div><div class="miolo">{miolo}</div></section>"""


SILHUETA = """<svg class="silhueta" viewBox="0 0 400 420"><path d="M200 40c52 0 88 40 88 96 0 38-18 70-44 86
  74 18 128 70 138 150H18c10-80 64-132 138-150-26-16-44-48-44-86 0-56 36-96 88-96z" fill="#0d131a"/></svg>"""


def itens():
    ger = VORC / "gerado"
    fotos = {
        "bc": foto(OUT / "fotos" / "banco-central.jpg", 21, centro=(.5, .5)),
        "aero": foto(ger / "v1.png", 22, centro=(.5, .5), brilho=1.5),
    }
    ks = []
    # PARTE 1 · QUEM É QUEM
    ks.append(cartao("01", 1, f"""{SILHUETA}<p class="grande">Daniel Vorcaro</p>
      <p class="apoio">Dono do Banco Master · investigado pela PF · ainda não julgado</p>""", "pessoa"))
    ks.append(cartao_foto("02", fotos["bc"], "Banco Central", "Fechou o Master · 18.11.2025",
                          "Foto: Jonas Pereira/Agência Senado · CC BY 2.0"))
    ks.append(cartao_foto("03", fotos["aero"], "Guarulhos", "PF prende Vorcaro · 18.11.2025",
                          "Reconstituição · imagem ilustrativa"))
    ks.append(cartao("04", 4, """<p class="numero">1,6<br>milhão</p>
      <p class="apoio">de pessoas com dinheiro preso no banco</p>"""))
    # PARTE 2 · A ISCA
    ks.append(cartao("05", 5, """<div class="recibo"><p class="rt">Comprovante de aplicação</p>
      <p class="rl"><span>Produto</span><b>CDB</b></p><p class="rl"><span>Garantia</span><b>FGC</b></p>
      <p class="rl"><span>Rentabilidade</span></p>
      <p class="taxa"><span class="circ">140%</span> do CDI</p>
      <p class="rodape-r">Os bancos grandes pagavam cerca de 100%.</p></div>""", "doc-recibo"))
    ks.append(cartao("06", 6, """<p class="rot">O seguro tem teto</p><p class="numero n2">R$ 250<br>mil</p>
      <p class="apoio">por pessoa, por banco. Acima disso, fila.</p>"""))
    # PARTE 3 · O SUPREMO
    for i, (n, nome, rot, cred) in enumerate([
            ("07", "toffoli", "Dias Toffoli", "Foto: Nelson Jr./STF"),
            ("08", "mendonca", "André Mendonça", "Foto: Rosinei Coutinho/STF"),
            ("09", "moraes", "Alexandre de Moraes", "Foto: Isac Nóbrega/PR · CC BY 2.0"),
            ("10", "gilmar", "Gilmar Mendes", "Foto: Alejandro Zambrana/Secom/TSE")]):
        img = foto(ministro_src(nome), 30 + i, centro=(.5, .2), rosto=True, recorte=(.05, 0, .95, .78))
        ks.append(cartao_foto(n, img, rot, "Ministro do STF", cred))
    ks.append(cartao("11", 11, """<p class="numero data">14.03<br>2025</p>
      <p class="apoio">Reunião de duas horas em São Paulo. Mendonça confirma: foi uma única vez.</p>"""))
    ks.append(cartao("12", 12, """<p class="rot">Contrato · segundo a PF</p><p class="numero n2">R$ 130<br>mi</p>
      <p class="apoio">em três anos. Moraes nega relação com Vorcaro.</p>"""))
    ks.append(cartao("13", 13, """<p class="citacao">“Até a máfia tem ética.”</p>
      <p class="apoio">Gilmar Mendes, em sessão do STF</p>"""))
    # PARTE 4 · O QUE A LEI DIZ
    ks.append(cartao("14", 14, """<p class="rot">Código de Processo Penal</p>
      <p class="art"><b>Art. 252.</b> O juiz não poderá exercer jurisdição no processo em que:<br>
      I – <mark>tiver funcionado seu cônjuge</mark> ou parente, consangüíneo ou afim, em linha reta ou colateral
      até o terceiro grau, inclusive, <mark>como defensor ou advogado</mark>, órgão do Ministério Público,
      autoridade policial, auxiliar da justiça ou perito;</p>
      <p class="art"><b>Art. 254.</b> O juiz dar-se-á por suspeito, e, se não o fizer, poderá ser recusado
      por qualquer das partes:<br>I – <mark>se for amigo íntimo ou inimigo capital</mark> de qualquer deles;</p>""", "doc-lei"))
    return ks


CSS = f"""
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#1a1f25;display:flex;flex-wrap:wrap;gap:40px;padding:40px;font-family:'Gotham',system-ui,sans-serif}}
.a4{{position:relative;width:{W}px;height:{H}px;overflow:hidden;color:#0d131a}}
.bg{{position:absolute;inset:0;width:100%;height:100%}}
.tag{{position:absolute;left:180px;top:170px;transform:rotate(-1.2deg)}}
.tag span{{display:inline-block;background:#efede7;padding:34px 56px 28px;font-weight:500;font-size:84px;
  letter-spacing:.2em;text-transform:uppercase;color:#031c37;border-top:5px solid #031c37;
  box-shadow:0 4px 14px rgba(0,0,0,.35)}}
/* foto: placa de nome embaixo, legível de longe */
.foto .placa{{position:absolute;left:70px;right:70px;bottom:70px;background:rgba(239,237,231,.96);
  padding:70px 110px 80px;border-top:8px solid #031c37}}
.foto .nome{{font-weight:900;font-size:230px;letter-spacing:-.03em;line-height:.95;color:#031c37}}
.foto .apoio{{font-weight:500;font-size:84px;margin-top:30px;color:#414042}}
.foto .cred{{position:absolute;right:110px;bottom:30px;font-weight:500;font-size:34px;letter-spacing:.14em;
  text-transform:uppercase;color:#5f6062}}
/* cartões de papel */
.doc .miolo{{position:absolute;left:200px;right:200px;top:520px;bottom:260px;display:flex;flex-direction:column;justify-content:center}}
.numero{{font-weight:900;font-size:640px;line-height:.86;letter-spacing:-.045em;color:#031c37}}
.numero.data{{font-size:560px}}
.numero.n2{{font-size:500px;white-space:nowrap}}
.rot{{font-weight:500;font-size:96px;letter-spacing:.16em;text-transform:uppercase;color:#9b6b26;margin-bottom:70px}}
.apoio{{font-weight:500;font-size:110px;line-height:1.2;margin-top:90px;color:#2a2d31}}
.grande{{font-weight:900;font-size:330px;line-height:.92;letter-spacing:-.035em;color:#031c37}}
.pessoa .silhueta{{width:1100px;margin:0 0 80px -20px;opacity:.9}}
.citacao{{font-weight:400;font-style:italic;font-size:360px;line-height:1.02;letter-spacing:-.02em;color:#031c37}}
/* comprovante de aplicação */
.recibo{{background:#fbfaf6;padding:120px 130px;border:6px solid #0d131a;box-shadow:0 20px 50px rgba(0,0,0,.18)}}
.recibo .rt{{font-weight:900;font-size:120px;text-transform:uppercase;letter-spacing:.04em;border-bottom:6px solid #0d131a;padding-bottom:50px;margin-bottom:60px}}
.recibo .rl{{display:flex;justify-content:space-between;font-size:110px;font-weight:400;padding:24px 0;border-bottom:3px dashed #8b8d90}}
.recibo .rl b{{font-weight:900}}
.recibo .taxa{{white-space:nowrap;font-weight:900;font-size:250px;letter-spacing:-.03em;margin-top:70px;line-height:1}}
.recibo .circ{{position:relative;display:inline-block;padding:0 40px}}
.recibo .circ::after{{content:"";position:absolute;left:-30px;right:-30px;top:-50px;bottom:-40px;border:14px solid #031c37;
  border-radius:50%;transform:rotate(-5deg);opacity:.85}}
.recibo .rodape-r{{font-size:84px;font-weight:400;margin-top:80px;color:#414042}}
/* página da lei */
.doc-lei .miolo{{justify-content:flex-start;top:560px}}
.art{{font-weight:400;font-size:112px;line-height:1.36;margin-bottom:90px;color:#1c1f24}}
.art b{{font-weight:900}}
.art mark{{background:linear-gradient(transparent 12%,rgba(240,184,85,.75) 12%,rgba(240,184,85,.75) 92%,transparent 92%);color:inherit;padding:0 6px}}
"""


def main():
    ks = itens()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>A Sala ep01 kit A4</title>'
            f'<style>{fontes()}{CSS}</style></head><body>{"".join(ks)}</body></html>')
    (OUT / "kit-a4.html").write_text(html, encoding="utf-8")
    print(f"gerado: kit-a4.html ({len(ks)} folhas A4)")


if __name__ == "__main__":
    main()
