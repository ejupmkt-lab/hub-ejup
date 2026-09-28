#!/usr/bin/env python3
"""Exporta o kit A4 (300 dpi) em PNG e num PDF único para imprimir."""
import pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).resolve().parent.parent
NOMES = ["01-vorcaro", "02-banco-central", "03-guarulhos", "04-1-6-milhao", "05-comprovante-cdb",
         "06-fgc-teto", "07-toffoli", "08-mendonca", "09-moraes", "10-gilmar", "11-reuniao-14-03",
         "12-contrato-130mi", "13-ate-a-mafia", "14-cpp-252-254"]


def main():
    d = OUT / "kit-a4"; d.mkdir(exist_ok=True)
    for v in d.glob("*.png"):
        v.unlink()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 2600, "height": 3600})
        pg.goto((OUT / "kit-a4.html").as_uri()); pg.wait_for_timeout(1500)
        c = pg.locator(".a4")
        for i in range(c.count()):
            c.nth(i).screenshot(path=str(d / f"anexo-{NOMES[i]}.png"))
        b.close()
    ims = []
    for n in NOMES:
        im = Image.open(d / f"anexo-{n}.png").convert("RGB"); im.save(d / f"anexo-{n}.png", dpi=(300, 300)); ims.append(im)
    ims[0].save(OUT / "a-sala-ep01-kit-A4.pdf", save_all=True, append_images=ims[1:], resolution=300)
    print(f"{len(ims)} folhas em kit-a4/ + a-sala-ep01-kit-A4.pdf")


if __name__ == "__main__":
    main()
