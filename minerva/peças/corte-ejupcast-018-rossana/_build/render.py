#!/usr/bin/env python3
"""Exporta cada opção de capa em PNG 1080x1920."""
import pathlib
from playwright.sync_api import sync_playwright
OUT = pathlib.Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 3600, "height": 2000})
    pg.goto((OUT / "capa.html").as_uri()); pg.wait_for_timeout(900)
    for i, n in enumerate(("a1", "a2", "a3")):
        pg.locator(".s").nth(i).screenshot(path=str(OUT / f"capa-opcao-{n}.png"))
    b.close()
print("ok")
