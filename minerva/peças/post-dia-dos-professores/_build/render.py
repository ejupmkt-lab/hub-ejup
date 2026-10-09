#!/usr/bin/env python3
import pathlib
from playwright.sync_api import sync_playwright
OUT = pathlib.Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1080, "height": 1440})
    pg.goto((OUT / "post-dia-dos-professores.html").as_uri()); pg.wait_for_timeout(900)
    pg.locator(".cover").screenshot(path=str(OUT / "post-dia-dos-professores.png"))
    b.close()
print("png ok")
