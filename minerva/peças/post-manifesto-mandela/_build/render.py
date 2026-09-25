#!/usr/bin/env python3
"""Renderiza post-mandela.html em PNG 1080×1440."""
import pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1200, "height": 1560})
    pg.goto((OUT / "post-mandela.html").as_uri())
    pg.wait_for_timeout(500)
    pg.locator("#arte").screenshot(path=str(OUT / "post-mandela.png"))
    b.close()
print("ok")
