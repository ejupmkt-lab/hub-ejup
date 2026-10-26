#!/usr/bin/env python3
"""Gera as entregas do carrossel: PDF de aprovação, ZIP dos PNGs e a
apresentação com UI de download.

A UI referencia os arquivos por caminho relativo, então precisa ser servida
(`python3 -m http.server` na pasta da peça). Aberta como file:// o navegador
bloqueia o download disparado pela própria página.
"""
import pathlib
import zipfile

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SLUG = "EJUP-Carrossel-Quatro-Competencias"

TITULOS = [
    "Capa · O que continua o mesmo",
    "A pressa chegou antes da estrutura",
    "01 · Notório saber jurídico",
    "02 · Alfabetização em IA",
    "03 · Visão estratégica e de gestão",
    "04 · Critério ético diante da inovação",
    "Síntese · Quatro competências, um perfil",
    "Assinatura · EJUPcast e site",
]


def telas() -> list[pathlib.Path]:
    found = sorted(ROOT.glob("tela-*.png"))
    if len(found) != 8:
        raise SystemExit(f"esperava 8 telas, achei {len(found)}")
    for png in found:
        w, h = Image.open(png).size
        if (w, h) != (1080, 1440):
            raise SystemExit(f"{png.name} está em {w}×{h}, não 1080×1440")
    return found


def build_pdf(pngs: list[pathlib.Path]) -> pathlib.Path:
    pages = [Image.open(p).convert("RGB") for p in pngs]
    dest = ROOT / f"{SLUG}.pdf"
    pages[0].save(dest, save_all=True, append_images=pages[1:], resolution=144.0)
    return dest


def build_zip(pngs: list[pathlib.Path]) -> pathlib.Path:
    dest = ROOT / f"{SLUG}-PNG.zip"
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as z:
        for p in pngs:
            z.write(p, arcname=p.name)
    return dest


def build_apresentacao(pngs: list[pathlib.Path], pdf: pathlib.Path,
                       zipf: pathlib.Path) -> pathlib.Path:
    cards = "\n".join(
        f"""    <figure class="card">
      <img src="{p.name}" alt="{TITULOS[i]}" loading="lazy">
      <figcaption>
        <span class="n">{i + 1:02d}</span>
        <span class="t">{TITULOS[i]}</span>
        <a class="dl" href="{p.name}" download>Baixar PNG</a>
      </figcaption>
    </figure>"""
        for i, p in enumerate(pngs)
    )
    nomes = ", ".join(f'"{p.name}"' for p in pngs)

    html = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EJUP — As quatro colunas · aprovação</title>
<style>
  :root {{
    --navy: #031c37; --ink: #0d131a; --steel: #304557;
    --silver: #d1d3d4; --gold: #f0b855; --gray: #5f6062;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; padding: 48px 32px 96px; background: var(--ink);
    color: var(--silver);
    font-family: "Gotham", "Montserrat", system-ui, sans-serif;
  }}
  header {{ max-width: 1180px; margin: 0 auto 40px; }}
  h1 {{ font-size: 30px; font-weight: 300; letter-spacing: -0.01em; margin: 0; }}
  h1 b {{ font-weight: 700; color: #fff; }}
  .meta {{ font-size: 15px; color: var(--gray); margin: 12px 0 0; }}
  .bar {{ display: flex; flex-wrap: wrap; gap: 14px; margin: 28px 0 0; }}
  .btn {{
    display: inline-flex; align-items: center; gap: 10px;
    border: 1.5px solid rgba(240,184,85,0.55); border-radius: 999px;
    background: rgba(240,184,85,0.07); color: #fff;
    padding: 14px 26px; font-size: 15px; font-weight: 500;
    text-decoration: none; cursor: pointer;
  }}
  .btn:hover {{ background: rgba(240,184,85,0.16); }}
  .btn span {{ color: var(--gold); }}
  .grid {{
    max-width: 1180px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 28px;
  }}
  .card {{ margin: 0; background: rgba(255,255,255,0.04); border: 1px solid rgba(209,211,212,0.12); border-radius: 12px; overflow: hidden; }}
  .card img {{ display: block; width: 100%; height: auto; }}
  figcaption {{ padding: 16px 18px 18px; display: grid; gap: 6px; }}
  .n {{ font-size: 12px; letter-spacing: 0.16em; color: var(--gold); font-weight: 500; }}
  .t {{ font-size: 14px; line-height: 1.4; color: var(--silver); }}
  .dl {{ font-size: 13px; color: var(--gray); text-decoration: none; border-bottom: 1px solid rgba(209,211,212,0.25); justify-self: start; margin-top: 6px; }}
  .dl:hover {{ color: #fff; }}
  .nota {{ max-width: 1180px; margin: 40px auto 0; font-size: 13px; line-height: 1.6; color: var(--gray); }}
</style>
</head>
<body>
<header>
  <h1>As quatro colunas do <b>jurista do presente</b></h1>
  <p class="meta">Carrossel conceitual · eixo temático de setembro · 8 telas · 1080×1440 px</p>
  <div class="bar">
    <button class="btn" id="all"><span>&#8595;</span> Baixar as 8 telas</button>
    <a class="btn" href="{zipf.name}" download><span>&#8595;</span> ZIP dos PNGs</a>
    <a class="btn" href="{pdf.name}" download><span>&#8595;</span> PDF de aprovação</a>
  </div>
</header>

<div class="grid">
{cards}
</div>

<p class="nota">Os botões de download exigem que esta página esteja sendo servida
(<code>python3 -m http.server</code> dentro da pasta da peça). Aberta direto como
arquivo, o navegador bloqueia o download disparado pela própria página.</p>

<script>
  var ARQUIVOS = [{nomes}];
  document.getElementById('all').addEventListener('click', function () {{
    ARQUIVOS.forEach(function (nome, i) {{
      setTimeout(function () {{
        var a = document.createElement('a');
        a.href = nome; a.download = nome;
        document.body.appendChild(a); a.click(); a.remove();
      }}, i * 320);
    }});
  }});
</script>
</body>
</html>
"""
    dest = ROOT / "apresentacao.html"
    dest.write_text(html, encoding="utf-8")
    return dest


def main() -> None:
    pngs = telas()
    pdf = build_pdf(pngs)
    zipf = build_zip(pngs)
    apr = build_apresentacao(pngs, pdf, zipf)
    for f in (pdf, zipf, apr):
        print(f"{f.name}  ({f.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
