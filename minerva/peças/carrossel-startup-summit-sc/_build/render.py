#!/usr/bin/env python3
"""Renderiza as 12 telas para conferência visual e acusa texto estourando.

Injeta uma foto sintética em cada tela só para a prova: a peça real recebe as
fotos por arrastar-e-soltar no navegador.

Com --fotos também exercita o botão de download de verdade: chama o mesmo
`pngBlob()` da peça e compara o PNG exportado com o screenshot da tela. Isso
existe porque o download já quebrou duas vezes de um jeito que o screenshot
não via — canvas contaminado e fonte caindo em serif dentro do SVG.
"""
import base64
import io
import pathlib
import sys

from PIL import Image, ImageChops, ImageDraw, ImageStat
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "carrossel.html"
PREV = HERE / "preview"
CHROMIUM = "/opt/pw-browsers/chromium"


def foto_falsa() -> str:
    """Cinza com diagonais: mostra o enquadramento sem fingir ser foto real."""
    im = Image.new("RGB", (1400, 900), (150, 146, 136))
    d = ImageDraw.Draw(im)
    for x in range(-900, 1400, 60):
        d.line([(x, 900), (x + 900, 0)], fill=(163, 159, 148), width=18)
    d.text((40, 30), "FOTO", fill=(230, 228, 222))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=80)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


MEDIR = """
() => Array.from(document.querySelectorAll('.slide')).map(s => {
  const r = s.getBoundingClientRect();
  const box  = s.querySelector('.box').getBoundingClientRect();
  const ultimo = s.querySelector('.foot') || s.querySelector('.box');
  const u = ultimo.getBoundingClientRect();
  // recuo inferior útil: no painel é a margem do painel + o padding dele
  const limite = s.classList.contains('lay-painel') ? 56 + 56 : 80;
  return {
    i: +s.dataset.i,
    lay: (s.className.match(/lay-(\w+)/) || [])[1],
    frame: { w: s.offsetWidth, h: s.offsetHeight },
    // quanto sobra entre o fim do conteúdo e a margem inferior da tela
    sobra: Math.round(r.bottom - limite - u.bottom),
    // o quadrado projeta 16px abaixo da caixa e pode avancar na margem;
    // o que nao pode e chegar perto da borda da tela (minimo 40px)
    folga_quadrado: Math.round(r.bottom - 40 - (box.bottom + 16)),
  };
})
"""


EXPORTAR = """
async (i) => {
  try {
    const b = await pngBlob(i);
    const d = await new Promise(r => {
      const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b);
    });
    return { ok:true, d };
  } catch (e) { return { ok:false, err:String((e && e.message) || e) }; }
}
"""


def conferir_download(page) -> list:
    """Exporta as 12 telas pelo caminho real do botão e compara com o screenshot.

    Uma diferença média alta significa que o PNG saiu diferente do que se vê —
    foi assim que a queda para serif apareceu (o SVG não tem <body>, então uma
    regra de fonte presa ao body não valia lá dentro).
    """
    problemas = []
    for i in range(12):
        r = page.evaluate(EXPORTAR, i)
        if not r["ok"]:
            problemas.append(f"tela {i+1}: download falhou ({r['err']})")
            continue
        png = base64.b64decode(r["d"].split(",", 1)[1])
        (PREV / f"export-{i+1:02d}.png").write_bytes(png)
        exp = Image.open(io.BytesIO(png)).convert("RGB")
        if exp.size != (1080, 1440):
            problemas.append(f"tela {i+1}: PNG exportado {exp.size} ≠ 1080×1440")
            continue
        ref = Image.open(PREV / f"tela-{i+1:02d}.png").convert("RGB")
        d = ImageStat.Stat(ImageChops.difference(exp, ref)).mean
        if max(d) > 12:
            problemas.append(
                f"tela {i+1}: PNG exportado destoa do screenshot "
                f"(diferença média {max(d):.1f}) — confira fonte e enquadramento")
    return problemas


def main() -> None:
    if not SRC.exists():
        sys.exit(f"não encontrei {SRC} — rode build.py antes")
    PREV.mkdir(exist_ok=True)
    com_foto = "--fotos" in sys.argv

    problemas = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROMIUM)
        page = b.new_page(viewport={"width": 1300, "height": 1000}, device_scale_factor=1)
        page.goto(SRC.as_uri())
        # A prévia mostra as telas a 50%. Para medir e capturar em tamanho real
        # é preciso desligar essa escala — senão o screenshot sai 540×720.
        # O <style> da peça vive no BODY (o template é conteúdo puro, sem head),
        # então um add_style_tag no head perderia na ordem do documento: o
        # override precisa ser anexado ao fim do body.
        page.evaluate("""() => {
            const st = document.createElement('style');
            st.textContent = '.frame{width:1080px;height:1440px}'
                           + '.frame .slide{transform:none}'
                           + '.bar{display:none}';
            document.body.appendChild(st);
        }""")
        page.wait_for_timeout(700)

        if com_foto:
            page.evaluate("""(src) => {
                estado.forEach((e, i) => { estado[i] = { src, scale:1, x:0, y:0 }; aplicar(i); });
            }""", foto_falsa())
            page.wait_for_timeout(500)

        for m in page.evaluate(MEDIR):
            f = m["frame"]
            if (f["w"], f["h"]) != (1080, 1440):
                problemas.append(f"tela {m['i']+1}: moldura {f} ≠ 1080×1440")
            if m["sobra"] < -1:
                problemas.append(
                    f"tela {m['i']+1} ({m['lay']}): conteúdo passa {-m['sobra']}px da margem")
            if m["folga_quadrado"] < 0:
                problemas.append(
                    f"tela {m['i']+1} ({m['lay']}): quadrado da caixa fora da margem")

        for i in range(12):
            page.locator(f'.slide[data-i="{i}"]').screenshot(
                path=str(PREV / f"tela-{i+1:02d}.png"))

        if com_foto:
            problemas += conferir_download(page)
        b.close()

    print(f"12 telas em {PREV}")
    if problemas:
        print("\nPROBLEMAS:")
        for x in problemas:
            print("  ·", x)
        sys.exit(1)
    print("medidas ok: moldura certa, nenhum texto estourando")


if __name__ == "__main__":
    main()
