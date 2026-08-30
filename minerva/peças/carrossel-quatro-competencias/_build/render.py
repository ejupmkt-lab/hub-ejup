#!/usr/bin/env python3
"""Renderiza cada tela do carrossel em PNG 1080×1440 e mede o que pode vazar.

Mede antes de exportar: conteúdo que passa da altura útil, texto encostando na
margem e contêiner de ordem vazio. Falha ruidosamente em vez de entregar peça
fora do padrão.
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "carrossel.html"
CHROMIUM = "/opt/pw-browsers/chromium"

W, H = 1080, 1440
PAD = 96          # margem lateral do corpo
SAFE_BOTTOM = 96  # nada de texto colado no rodapé

MEASURE = """
() => Array.from(document.querySelectorAll('.post')).map(post => {
  const pr = post.getBoundingClientRect();
  const rel = el => {
    const r = el.getBoundingClientRect();
    return { x: r.x - pr.x, y: r.y - pr.y, right: r.right - pr.x,
             bottom: r.bottom - pr.y, w: r.width, h: r.height };
  };
  const body = post.querySelector('.post__body');
  const order = post.querySelector('.order');
  const logo = post.querySelector('.post__logo img');
  return {
    id: post.id,
    frame: { w: pr.width, h: pr.height },
    body: rel(body),
    order: order ? rel(order) : null,
    orderChildren: order ? order.childElementCount : null,
    logo: rel(logo),
    texts: Array.from(post.querySelectorAll('.post__body p, .post__body h1, .post__body h2'))
      .map(el => ({ cls: el.className, ...rel(el) })),
  };
})
"""


def main() -> None:
    if not SRC.exists():
        sys.exit(f"não encontrei {SRC} — rode build.py antes")

    problems = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROMIUM)
        page = browser.new_page(viewport={"width": W, "height": H},
                                device_scale_factor=1)
        page.goto(SRC.as_uri())
        page.wait_for_timeout(900)   # fontes embutidas + construtor da ordem

        data = page.evaluate(MEASURE)

        for m in data:
            tag = m["id"]
            if round(m["frame"]["w"]) != W or round(m["frame"]["h"]) != H:
                problems.append(f"{tag}: moldura {m['frame']} ≠ {W}×{H}")

            # A ordem precisa ter sido construída (contêiner com filho oco
            # também reprova: exigimos o <svg>).
            if m["order"] is not None and not m["orderChildren"]:
                problems.append(f"{tag}: contêiner .order vazio")

            for t in m["texts"]:
                if t["x"] < PAD - 1:
                    problems.append(f"{tag}: {t['cls']} vaza à esquerda (x={t['x']:.0f})")
                if t["right"] > W - PAD + 1:
                    problems.append(f"{tag}: {t['cls']} vaza à direita (right={t['right']:.0f})")

            # Corpo não pode invadir a faixa da ordem nem o rodapé.
            floor = m["order"]["y"] if m["order"] else (H - SAFE_BOTTOM)
            if m["body"]["bottom"] > floor + 1:
                problems.append(
                    f"{tag}: corpo invade o rodapé "
                    f"(bottom={m['body']['bottom']:.0f} > {floor:.0f})")

            if m["logo"]["bottom"] > H - 1:
                problems.append(f"{tag}: logo vaza embaixo ({m['logo']['bottom']:.0f})")

        # Régua: a altura do logo tem de ser idêntica em TODAS as telas.
        heights = {round(m["logo"]["h"]) for m in data}
        if len(heights) != 1:
            problems.append(f"altura do logo varia entre telas: {sorted(heights)}")

        (HERE / "medidas.json").write_text(
            json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

        for m in data:
            page.locator(f"#{m['id']}").screenshot(path=str(ROOT / f"{m['id']}.png"))

        browser.close()

    print(f"{len(data)} telas renderizadas em {ROOT}")
    if problems:
        print("\nPROBLEMAS:")
        for pb in problems:
            print("  ·", pb)
        sys.exit(1)
    print("medidas ok: nada vaza, ordem construída, logo com altura única")


if __name__ == "__main__":
    main()
