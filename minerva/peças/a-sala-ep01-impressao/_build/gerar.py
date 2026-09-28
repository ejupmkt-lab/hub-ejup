#!/usr/bin/env python3
"""A Sala · episódio 01 (caso Vorcaro) · provas impressas para sair da pasta.

Mesma identidade do carrossel "O caso Vorcaro": fotografias em cópia de
dossiê, borda de papel fotográfico e etiqueta "Anexo". Cada prova é uma foto
10×15 cm (formato padrão de laboratório), 300 dpi, 1181×1772 px.

* Anexo 02 a 05: os ministros, preto e branco frio (fotos institucionais,
  créditos em peças/carrossel-caso-vorcaro/fotos/CREDITOS.md).
* Anexo 06 a 13: as cenas do caso, as mesmas imagens geradas para o
  carrossel (Higgsfield, já pagas). São reconstituição: o verso da etiqueta
  diz "imagem ilustrativa", para ninguém tomar por foto real do fato.

Zero crédito novo.  python3 _build/gerar.py && python3 _build/render.py
"""
import base64
import io
import pathlib

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
VORC = RAIZ / "peças" / "carrossel-caso-vorcaro"
FOTOS, GERADO = VORC / "fotos", VORC / "gerado"

W, H = 1181, 1772            # 10 × 15 cm a 300 dpi
BORDA, BASE = 56, 250        # borda de papel e faixa da etiqueta

MINISTROS = [
    ("02", "toffoli", "Dias Toffoli", "Foto: Nelson Jr./STF"),
    ("03", "mendonca", "André Mendonça", "Foto: Rosinei Coutinho/STF"),
    ("04", "moraes", "Alexandre de Moraes", "Foto: Isac Nóbrega/PR"),
    ("05", "gilmar", "Gilmar Mendes", "Foto: Alejandro Zambrana/TSE"),
]
# (anexo, arquivo em gerado/, legenda da etiqueta)
CENAS = [
    ("06", "v1", "Aeroporto de Guarulhos · 18.11.2025"),
    ("07", "v2", "Banco Master · liquidação decretada pelo BC"),
    ("08", "v3", "Aplicação em CDB · taxa acima do mercado"),
    ("09", "v4", "Celular apreendido pela Polícia Federal"),
    ("10", "v8", "Relatório da Polícia Federal · set. 2026"),
    ("11", "v7", "Reunião em São Paulo · segundo a PF"),
    ("12", "v5", "Supremo Tribunal Federal"),
    ("13", "v6", "A sala · a cadeira vazia"),
]


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    return "\n".join(
        f"@font-face{{font-family:'Gotham';font-weight:{peso};font-style:{st};"
        f"src:url({b64(FONTS / f'Gotham-{n}.otf', 'font/otf')}) format('opentype')}}"
        for n, peso, st in (("Light", 300, "normal"), ("Book", 400, "normal"),
                            ("BookItalic", 400, "italic"), ("Medium", 500, "normal"),
                            ("Bold", 700, "normal"), ("Black", 900, "normal")))


PW, PH = W - 2 * BORDA, H - BORDA - BASE      # área da foto


def jpg(im):
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=93)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def ministro(nome):
    ia = FOTOS / f"{nome}-ia.png"
    src = ia if ia.exists() else next(FOTOS.glob(f"{nome}.*"))
    im = ImageOps.fit(Image.open(src).convert("RGB"), (PW, PH), Image.LANCZOS, centering=(.5, .3))
    g = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(2, 1))
    if not ia.exists():                      # original pequeno: nitidez e grão
        g = g.filter(ImageFilter.UnsharpMask(2, 80, 3))
        g = Image.blend(g, Image.effect_noise(g.size, 40).filter(ImageFilter.GaussianBlur(.7)), .08)
    g = ImageEnhance.Contrast(g).enhance(1.12)
    return jpg(ImageOps.colorize(g, black=(10, 16, 24), white=(236, 234, 228)))


def cena(arq):
    im = Image.open(GERADO / f"{arq}.png").convert("RGB")
    im = ImageOps.fit(im, (PW, PH), Image.LANCZOS, centering=(.5, .5))
    im = im.filter(ImageFilter.UnsharpMask(1.6, 50, 2))
    grao = Image.effect_noise(im.size, 30).filter(ImageFilter.GaussianBlur(.6)).convert("RGB")
    return jpg(Image.blend(im, grao, .04))


def prova(n, img, titulo, legenda, cred):
    return f"""<section class="prova">
  <div class="foto"><img src="{img}" alt=""></div>
  <div class="etiqueta">
    <p class="anexo">Anexo {n}</p>
    <p class="tit">{titulo}</p>
    <p class="leg">{legenda}</p>
    <p class="cred">{cred}</p>
  </div>
</section>"""


CSS = f"""
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#1a1f25;display:flex;flex-wrap:wrap;gap:30px;padding:30px;font-family:'Gotham',system-ui,sans-serif}}
.prova{{position:relative;width:{W}px;height:{H}px;overflow:hidden;
  background:radial-gradient(120% 90% at 30% 15%,#fbfaf7 0%,#f1efe9 60%,#e7e4dc 100%)}}
.prova::after{{content:"";position:absolute;inset:0;pointer-events:none;opacity:.06;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")}}
.foto{{position:absolute;left:{BORDA}px;top:{BORDA}px;width:{PW}px;height:{PH}px;background:#0d131a;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.25)}}
.foto img{{width:100%;height:100%;display:block}}
.etiqueta{{position:absolute;left:{BORDA}px;right:{BORDA}px;bottom:0;height:{BASE}px;padding-top:42px}}
.anexo{{position:absolute;right:0;top:44px;font-weight:500;font-size:26px;letter-spacing:.22em;
  text-transform:uppercase;color:#031c37;border:2px solid #031c37;padding:10px 18px 8px}}
.tit{{font-weight:900;font-size:50px;letter-spacing:-.02em;color:#031c37;line-height:1.05;max-width:760px}}
.tit i{{font-style:italic;font-weight:400;color:#9b6b26}}
.leg{{font-weight:400;font-size:28px;color:#414042;margin-top:14px;max-width:820px;line-height:1.35}}
.cred{{position:absolute;left:0;bottom:30px;font-weight:500;font-size:17px;letter-spacing:.18em;
  text-transform:uppercase;color:#5f6062}}
"""


def main():
    cartoes = [prova(n, ministro(a), nome, "Ministro do Supremo Tribunal Federal", cred)
               for n, a, nome, cred in MINISTROS]
    for n, arq, leg in CENAS:
        t, _, resto = leg.partition(" · ")
        cartoes.append(prova(n, cena(arq), t, resto, "Caso Master · imagem ilustrativa · A Sala"))
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>A Sala ep01 provas</title>'
            f'<style>{fontes()}{CSS}</style></head><body>{"".join(cartoes)}</body></html>')
    (OUT / "provas.html").write_text(html, encoding="utf-8")
    print(f"gerado: provas.html ({len(cartoes)} provas)")


if __name__ == "__main__":
    main()
