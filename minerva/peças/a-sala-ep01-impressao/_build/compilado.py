#!/usr/bin/env python3
"""A Sala · ep. 01 · compilado de provas (fotos antigas), na ordem do roteiro.

Tudo sai como fotografia antiga de arquivo (envelhecer.py), impressa em A4
(21×29,7 cm, 300 dpi) para ser lida num plano aberto. Três tipos de prova:
* retratos dos ministros (fotos institucionais, as mesmas aprovadas);
* fotos de lugar claras e de assunto único (aeroporto, Banco Central,
  sala de reunião, plenário do STF);
* documentos fotografados: comprovante, regras do FGC, contrato, mensagens,
  relatório e CPP, com uma única informação grande, circulada ou marcada.
Documentos sem logotipo nem brasão de órgão real; dados sigilosos tarjados.

    python3 _build/compilado.py
"""
import argparse
import base64
import pathlib

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps
from playwright.sync_api import sync_playwright

from envelhecer import envelhecer

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
VORC = RAIZ / "peças" / "carrossel-caso-vorcaro" / "fotos"
FOT = OUT / "fotos"
W, H = 2480, 3508
DOCS = ["d-cdb", "d-fgc", "d-contrato", "d-msg", "d-rel", "d-cpp", "d-vorc"]

# (anexo, tipo, fonte, legenda da etiqueta, crédito na borda)
PROVAS = [
    ("01", "doc", "d-vorc", "Daniel Vorcaro", "Sem imagem de ato público"),
    ("02", "foto", FOT / "banco-central.jpg", "Banco Central · 18.11.2025", "Foto: Jonas Pereira/Agência Senado · CC BY 2.0"),
    ("03", "foto", FOT / "aviao.jpg", "Guarulhos · 18.11.2025", "Imagem ilustrativa · Pexels"),
    ("04", "doc", "d-cdb", "CDB · 140% do CDI", "Documento cenográfico"),
    ("05", "doc", "d-fgc", "FGC · teto de R$ 250 mil", "Documento cenográfico"),
    ("06", "rosto", "toffoli", "Dias Toffoli", "Foto: Nelson Jr./STF"),
    ("07", "rosto", "mendonca", "André Mendonça", "Foto: Rosinei Coutinho/STF"),
    ("08", "foto", FOT / "reuniao.jpg", "Reunião · 14.03.2025", "Imagem ilustrativa · Pexels"),
    ("09", "rosto", "moraes", "Alexandre de Moraes", "Foto: Isac Nóbrega/PR · CC BY 2.0"),
    ("10", "doc", "d-contrato", "Contrato · cerca de R$ 130 mi", "Documento cenográfico"),
    ("11", "doc", "d-msg", "Mensagens · segundo a PF", "Documento cenográfico"),
    ("12", "doc", "d-rel", "Relatório · set. 2026", "Documento cenográfico"),
    ("13", "rosto", "gilmar", "Gilmar Mendes", "Foto: Alejandro Zambrana/Secom/TSE"),
    ("14", "foto", FOT / "plenario.jpg", "Supremo Tribunal Federal", "Foto: Yuri Ikeda · CC BY-SA 4.0"),
    ("15", "doc", "d-cpp", "CPP · arts. 252 e 254", "Documento cenográfico"),
]


def fonte(n, tam):
    return ImageFont.truetype(str(FONTS / f"Gotham-{n}.otf"), tam)


HORIZ = False


def render_docs():
    d = HERE / "docs"; d.mkdir(exist_ok=True)
    faces = "\n".join(
        f"@font-face{{font-family:'Gotham';font-weight:{w};font-style:{st};src:url(data:font/otf;base64,"
        f"{base64.b64encode((FONTS / f'Gotham-{n}.otf').read_bytes()).decode()}) format('opentype')}}"
        for n, w, st in (("Book", 400, "normal"), ("BookItalic", 400, "italic"), ("Medium", 500, "normal"),
                         ("Bold", 700, "normal"), ("Black", 900, "normal")))
    html = (HERE / ("documentos-h.html" if HORIZ else "documentos.html")).read_text(encoding="utf-8").replace("__FONTES__", faces)
    tmp = HERE / "docs" / "_docs.html"; tmp.write_text(html, encoding="utf-8")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 2400, "height": 2400}); pg.goto(tmp.as_uri()); pg.wait_for_timeout(800)
        for i in DOCS:
            pg.locator(f"#{i}").screenshot(path=str(d / f"{i}.png"))
        b.close()
    tmp.unlink()


def fonte_img(tipo, src):
    if tipo == "doc":
        return Image.open(HERE / "docs" / f"{src}.png"), (.5, .5), {}
    if tipo == "rosto":
        ia = VORC / f"{src}-ia.png"
        im = Image.open(ia if ia.exists() else next(VORC.glob(f"{src}.*")))
        if HORIZ:
            im = alargar(im.convert("RGB"), W / H)
            return im, (.5, .5), {"rosto": True}
        return im, (.5, .3), {"rosto": True}
    im = Image.open(src).convert("RGB")
    im = ImageEnhance.Contrast(ImageOps.autocontrast(im, cutoff=1)).enhance(1.15)
    return im, (.5, .5), {}


def alargar(im, razao):
    """Retrato vertical numa folha horizontal sem cortar a cabeça: a foto
    inteira no centro, e as laterais preenchidas com a própria foto ampliada
    e desfocada, que o envelhecimento funde no fundo."""
    from PIL import ImageFilter
    h = im.height; w = int(h * razao)
    fundo = ImageOps.fit(im, (w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(45))
    fundo = ImageEnhance.Brightness(fundo).enhance(.8)
    x = (w - im.width) // 2
    m = Image.new("L", im.size, 255); dm = ImageDraw.Draw(m)
    borda = int(im.width * .12)
    for k in range(borda):
        v = int(255 * k / borda)
        dm.line((k, 0, k, im.height), fill=v); dm.line((im.width - 1 - k, 0, im.width - 1 - k, im.height), fill=v)
    fundo.paste(im, (x, 0), m)
    return fundo


def prova(i, n, tipo, src, legenda, cred):
    im, centro, extra = fonte_img(tipo, src)
    # documentos e lugares: envelhecimento que preserva a leitura
    tom = (dict(preto=22, branco=240, vinheta=.8, grao=.08, macio=.4) if tipo != "rosto" else {})
    folha = envelhecer(im, W, H, semente=300 + i, borda=70, centro=centro, **extra, **tom)
    d = ImageDraw.Draw(folha)
    # etiqueta de papel colada no canto inferior direito
    f1, f2 = fonte("Medium", 92), fonte("Bold", 70)
    t1 = f"ANEXO {n}"
    w1 = d.textlength(t1, font=f1) + 92 * .2 * len(t1) * .5
    w2 = d.textlength(legenda, font=f2)
    lw, lh = int(max(w1, w2) + 140), 330
    et = Image.new("RGBA", (lw, lh), (239, 237, 231, 255)); de = ImageDraw.Draw(et)
    de.rectangle((0, 0, lw, 10), fill=(3, 28, 55, 255))
    x = 70
    for ch in t1:
        de.text((x, 60), ch, font=f1, fill=(3, 28, 55, 255)); x += de.textlength(ch, font=f1) + 18
    de.text((70, 190), legenda, font=f2, fill=(20, 24, 30, 255))
    sombra = Image.new("RGBA", (lw + 40, lh + 40), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rectangle((20, 26, lw + 20, lh + 26), fill=(0, 0, 0, 90))
    from PIL import ImageFilter
    sombra = sombra.filter(ImageFilter.GaussianBlur(10))
    giro = [-1.5, 1, -.6, 1.3, -1, .7][i % 6]
    sombra.alpha_composite(et, (20, 20)); et = sombra.rotate(giro, expand=True, resample=Image.BICUBIC)
    folha.alpha_composite(et, (W - et.width - 150, H - et.height - 170))
    d.text((80, H - 62), cred.upper(), font=fonte("Medium", 34), fill=(95, 96, 98))
    return folha


def main():
    global W, H, HORIZ
    ap = argparse.ArgumentParser(); ap.add_argument("--horizontal", action="store_true")
    HORIZ = ap.parse_args().horizontal
    if HORIZ:
        W, H = 3508, 2480
    render_docs()
    d = OUT / ("compilado-horizontal" if HORIZ else "compilado"); d.mkdir(exist_ok=True)
    for v in d.glob("*.png"):
        v.unlink()
    pags = []
    for i, p in enumerate(PROVAS):
        folha = prova(i, *p)
        nome = f"anexo-{p[0]}.png"
        folha.save(d / nome, dpi=(300, 300))
        base = Image.new("RGB", (W, H), "white"); base.paste(folha, mask=folha.split()[-1]); pags.append(base)
        print(nome, p[3])
    pdf = OUT / ("a-sala-ep01-compilado-A4-horizontal.pdf" if HORIZ else "a-sala-ep01-compilado-A4.pdf")
    pags[0].save(pdf, save_all=True, append_images=pags[1:], resolution=300)
    print(f"{len(pags)} provas + {pdf.name}")


if __name__ == "__main__":
    main()
