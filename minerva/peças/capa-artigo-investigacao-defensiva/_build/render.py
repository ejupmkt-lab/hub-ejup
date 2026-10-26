#!/usr/bin/env python3
"""Renderiza os dois formatos da capa e confere se nada vaza da margem."""
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
CHROMIUM = "/opt/pw-browsers/chromium"

# (html, png, largura, altura)
PECAS = [
    ("capa.html", "capa.png", 1600, 900),
    ("capa-1080x1440.html", "capa-1080x1440.png", 1080, 1440),
]

MEASURE = """
() => {
  const post = document.querySelector('.cover');
  const pr = post.getBoundingClientRect();
  const rel = el => {
    const r = el.getBoundingClientRect();
    return { cls: el.className.toString().slice(0, 24),
             x: r.x - pr.x, y: r.y - pr.y,
             right: r.right - pr.x, bottom: r.bottom - pr.y };
  };
  return {
    frame: { w: pr.width, h: pr.height },
    items: Array.from(post.querySelectorAll('.body > *')).map(rel),
    logo: rel(document.querySelector('.footer-logo img')),
  };
}
"""


def main() -> None:
    problems = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROMIUM)
        for html, png, w, h in PECAS:
            src = ROOT / html
            if not src.exists():
                sys.exit(f"não encontrei {src} — rode build.py antes")
            page = browser.new_page(viewport={"width": w, "height": h},
                                    device_scale_factor=1)
            page.goto(src.as_uri())
            page.wait_for_timeout(600)

            m = page.evaluate(MEASURE)
            if round(m["frame"]["w"]) != w or round(m["frame"]["h"]) != h:
                problems.append(f"{png}: moldura {m['frame']} ≠ {w}×{h}")
            for it in m["items"]:
                if it["right"] > w - 40:
                    problems.append(f"{png}: {it['cls']} chega a x={it['right']:.0f} (>{w-40})")
                if it["bottom"] > h - 40:
                    problems.append(f"{png}: {it['cls']} chega a y={it['bottom']:.0f} (>{h-40})")
            if m["logo"]["bottom"] > h - 1:
                problems.append(f"{png}: logo vaza embaixo")

            page.locator(".cover").screenshot(path=str(ROOT / png))
            print(f"gerado: {png}  ({w}×{h})")
            page.close()
        browser.close()

    if problems:
        print("\nPROBLEMAS:")
        for pb in problems:
            print("  ·", pb)
        sys.exit(1)
    print("medidas ok: nada vaza da margem")


if __name__ == "__main__":
    main()
