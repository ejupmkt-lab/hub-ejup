#!/usr/bin/env python3
"""Exporta cada prova em PNG 10×15 cm a 300 dpi (laboratório fotográfico) e o
PDF A4 paisagem com duas por folha e marcas de corte (impressora comum)."""
import pathlib
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).resolve().parent.parent
NOMES = ["02-toffoli", "03-mendonca", "04-moraes", "05-gilmar", "06-aeroporto", "07-banco",
         "08-cdb", "09-celular", "10-relatorio-pf", "11-reuniao", "12-supremo", "13-cadeira"]
A4 = (3508, 2480)          # paisagem, 300 dpi
CW, CH = 1181, 1772


def main():
    d = OUT / "png"; d.mkdir(exist_ok=True)
    for v in d.glob("*.png"):
        v.unlink()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1300, "height": 1900})
        pg.goto((OUT / "provas.html").as_uri()); pg.wait_for_timeout(900)
        c = pg.locator(".prova")
        for i in range(c.count()):
            c.nth(i).screenshot(path=str(d / f"anexo-{NOMES[i]}.png"))
        b.close()
    ims = []
    for n in NOMES:
        im = Image.open(d / f"anexo-{n}.png").convert("RGB")
        im.save(d / f"anexo-{n}.png", dpi=(300, 300)); ims.append(im)
    folhas = []
    mx, my = (A4[0] - 2 * CW) // 3, (A4[1] - CH) // 2
    for k in range(0, len(ims), 2):
        f = Image.new("RGB", A4, "white"); dr = ImageDraw.Draw(f)
        for j, im in enumerate(ims[k:k + 2]):
            x, y = mx + j * (CW + mx), my
            f.paste(im, (x, y))
            for cx in (x, x + CW):
                for cy in (y, y + CH):
                    sx = -1 if cx == x else 1; sy = -1 if cy == y else 1
                    dr.line((cx + sx * 12, cy, cx + sx * 44, cy), fill="#888", width=2)
                    dr.line((cx, cy + sy * 12, cx, cy + sy * 44), fill="#888", width=2)
        folhas.append(f)
    folhas[0].save(OUT / "a-sala-ep01-provas-A4.pdf", save_all=True, append_images=folhas[1:], resolution=300)
    print(f"{len(ims)} provas em png/ + a-sala-ep01-provas-A4.pdf ({len(folhas)} folhas)")


if __name__ == "__main__":
    main()
