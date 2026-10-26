#!/usr/bin/env python3
import pathlib
from playwright.sync_api import sync_playwright
OUT = pathlib.Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width":1100,"height":1500})
    pg.goto((OUT/"capa.html").as_uri()); pg.wait_for_timeout(600)
    m = pg.evaluate("""() => { const r=document.querySelector('.capa').getBoundingClientRect();
      const t=document.querySelector('.texto').getBoundingClientRect(); const c=document.querySelector('.cta').getBoundingClientRect();
      return {topo:Math.round(t.top-r.top), fim:Math.round(t.bottom-r.top), cta:Math.round(c.top-r.top)}; }""")
    print(m)
    pg.locator(".capa").screenshot(path=str(OUT/"capa-feed.png"))
    b.close()
print("capa-feed.png")
