#!/usr/bin/env python3
"""A Sala · episódio 01 (caso Vorcaro) · provas impressas para sair da pasta.

Fotos antigas de arquivo, envelhecidas em código (_build/envelhecer.py):
preto e branco frio, grão, poeira, riscos, dobra, manchas e cantos gastos.
Sem sépia. Só uma etiqueta de papel "Anexo NN" colada no canto. Cada prova é uma foto
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

from envelhecer import envelhecer

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


def png(im):
    buf = io.BytesIO(); im.save(buf, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def fonte_foto(chave):
    if chave in dict((m[1], 1) for m in MINISTROS):
        ia = FOTOS / f"{chave}-ia.png"
        return Image.open(ia if ia.exists() else next(FOTOS.glob(f"{chave}.*"))), (.5, .3)
    return Image.open(GERADO / f"{chave}.png"), (.5, .5)


def prova(i, n, chave, rodape):
    im, centro = fonte_foto(chave)
    foto = envelhecer(im, W, H, semente=100 + i, centro=centro, rosto=i < len(MINISTROS))
    giro = [-1.2, .8, -.5, 1.4, -.9, .6, -1.5, 1.1, -.4, .9, -1.1, .5][i % 12]
    return f"""<section class="prova">
  <img class="copia" src="{png(foto)}" alt="">
  <div class="etiqueta" style="transform:rotate({giro}deg)">Anexo {n}</div>
  <p class="rodape">{rodape}</p>
</section>"""


CSS = f"""
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#1a1f25;display:flex;flex-wrap:wrap;gap:30px;padding:30px;font-family:'Gotham',system-ui,sans-serif}}
.prova{{position:relative;width:{W}px;height:{H}px}}
.copia{{position:absolute;inset:0;width:100%;height:100%}}
/* etiqueta de papel colada no canto, como numeração de prova */
.etiqueta{{position:absolute;right:90px;bottom:100px;padding:16px 26px 13px;background:#efede7;
  font-weight:500;font-size:30px;letter-spacing:.22em;text-transform:uppercase;color:#031c37;
  box-shadow:0 2px 6px rgba(0,0,0,.35);border-top:2px solid rgba(3,28,55,.7)}}
/* crédito ou aviso de reconstituição na borda de papel, discreto */
.rodape{{position:absolute;left:44px;bottom:9px;font-weight:500;font-size:13px;letter-spacing:.16em;
  text-transform:uppercase;color:rgba(65,64,66,.75)}}
"""


def main():
    itens = [(n, a, cred) for n, a, _nome, cred in MINISTROS]
    itens += [(n, arq, "Reconstituição · imagem ilustrativa") for n, arq, _leg in CENAS]
    cartoes = [prova(i, *it) for i, it in enumerate(itens)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>A Sala ep01 provas</title>'
            f'<style>{fontes()}{CSS}</style></head><body>{"".join(cartoes)}</body></html>')
    (OUT / "provas.html").write_text(html, encoding="utf-8")
    print(f"gerado: provas.html ({len(cartoes)} provas)")


if __name__ == "__main__":
    main()
