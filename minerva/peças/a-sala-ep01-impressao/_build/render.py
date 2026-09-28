#!/usr/bin/env python3
"""Exporta cada cartão em PNG (10×14 cm, 300 dpi) e monta o PDF A4 para a gráfica:
quatro cartões por folha, com marcas de corte."""
import pathlib
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).resolve().parent.parent
NOMES = ["02-toffoli", "03-mendonca", "04-moraes", "05-gilmar", "06-celular", "07-aviao",
         "08-banco", "09-cdb", "10-fgc", "11-credores", "12-contrato", "13-stf", "14-relatorio"]
A4 = (2480, 3508)        # 300 dpi
CW, CH = 1181, 1654


def main():
    d = OUT / "png"; d.mkdir(exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1300, "height": 1800})
        pg.goto((OUT / "cartoes.html").as_uri()); pg.wait_for_timeout(900)
        c = pg.locator(".cartao")
        for i in range(c.count()):
            c.nth(i).screenshot(path=str(d / f"anexo-{NOMES[i]}.png"))
        b.close()
    pngs = [Image.open(d / f"anexo-{n}.png").convert("RGB") for n in NOMES]
    for im in pngs:
        im.info["dpi"] = (300, 300)
    for n, im in zip(NOMES, pngs):
        im.save(d / f"anexo-{n}.png", dpi=(300, 300))
    folhas = []
    mx, my = (A4[0] - 2 * CW) // 3, (A4[1] - 2 * CH) // 3
    for k in range(0, len(pngs), 4):
        f = Image.new("RGB", A4, "white"); dr = ImageDraw.Draw(f)
        for j, im in enumerate(pngs[k:k + 4]):
            x = mx + (j % 2) * (CW + mx); y = my + (j // 2) * (CH + my)
            f.paste(im, (x, y))
            for cx, cy in ((x, y), (x + CW, y), (x, y + CH), (x + CW, y + CH)):   # marcas de corte
                dr.line((cx - 40, cy, cx - 12, cy) if cx == x else (cx + 12, cy, cx + 40, cy), fill="#888", width=2)
                dr.line((cx, cy - 40, cx, cy - 12) if cy == y else (cx, cy + 12, cx, cy + 40), fill="#888", width=2)
        folhas.append(f)
    folhas[0].save(OUT / "a-sala-ep01-provas-A4.pdf", save_all=True, append_images=folhas[1:], resolution=300)
    print(f"{len(pngs)} cartões em png/ + a-sala-ep01-provas-A4.pdf ({len(folhas)} folhas)")


if __name__ == "__main__":
    main()
