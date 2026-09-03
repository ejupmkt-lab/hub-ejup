#!/usr/bin/env python3
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "capa.html"
CHROMIUM = "/opt/pw-browsers/chromium"

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROMIUM)
    page = browser.new_page(viewport={"width": 1600, "height": 900}, device_scale_factor=1)
    page.goto(SRC.as_uri())
    page.wait_for_timeout(500)
    page.locator(".cover").screenshot(path=str(ROOT / "capa.png"))
    browser.close()
print("gerado:", ROOT / "capa.png")
