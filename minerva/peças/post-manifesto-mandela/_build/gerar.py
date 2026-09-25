#!/usr/bin/env python3
"""Post manifesto / aspas · Nelson Mandela. Gera o HTML 1080×1440 com Gotham embutida."""
import base64
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"

W, H = 1080, 1440


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    return "\n".join(
        f"@font-face{{font-family:'Gotham';font-weight:{peso};"
        f"src:url({b64(FONTS / f'Gotham-{nome}.otf', 'font/otf')}) format('opentype')}}"
        for nome, peso in (("Light", 300), ("Book", 400), ("Medium", 500),
                           ("Bold", 700), ("Black", 900)))


def svg(nome):
    return re.sub(r"<\?xml.*?\?>", "", (LOGOS / nome).read_text(encoding="utf-8")).strip()


def facetas(w=W, h=H):
    """Planos geométricos do sistema do cartão (EJUPcast #018), versão escura."""
    c = ["#031c37", "#0a2a49", "#304557", "#1b3550", "#0d131a", "#3d5467"]
    pol = [
        (c[0], f"0,0 {w},0 {w},{h} 0,{h}"),
        (c[1], f"0,0 {w*.62},0 {w*.18},{h*.55} 0,{h*.42}"),
        (c[2], f"{w*.62},0 {w},0 {w},{h*.3}"),
        (c[3], f"{w*.18},{h*.55} {w},{h*.3} {w},{h*.78} {w*.4},{h}"),
        (c[4], f"0,{h*.42} {w*.18},{h*.55} {w*.4},{h} 0,{h}"),
        (c[5], f"{w},{h*.78} {w},{h} {w*.4},{h}"),
    ]
    g = "".join(f'<polygon points="{p}" fill="{f}"/>' for f, p in pol)
    return (f'<svg class="facetas" viewBox="0 0 {w} {h}" preserveAspectRatio="none">'
            f'<defs><linearGradient id="br" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="#fff" stop-opacity=".10"/>'
            f'<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
            f'<linearGradient id="sc" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="#0d131a" stop-opacity=".0"/>'
            f'<stop offset=".55" stop-color="#0d131a" stop-opacity=".35"/>'
            f'<stop offset="1" stop-color="#0d131a" stop-opacity=".7"/></linearGradient></defs>'
            f'{g}<polygon points="{w*.62},0 {w*.18},{h*.55} {w},{h*.3}" fill="url(#br)"/>'
            f'<rect width="{w}" height="{h}" fill="url(#sc)"/></svg>')


FRASE = ("A educação é a<br><b>arma mais poderosa</b><br>"
         "que podemos usar<br>para mudar o mundo.")

HTML = """<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Post Mandela</title><style>
__FONTES__
*{margin:0;padding:0;box-sizing:border-box}
body{background:#8a8f95;padding:40px;display:flex;justify-content:center;
     font-family:'Gotham','Montserrat',system-ui,sans-serif}
.arte{position:relative;width:1080px;height:1440px;overflow:hidden;background:#031c37}
.facetas{position:absolute;inset:0;width:100%;height:100%}
.simbolo{position:absolute;right:-230px;top:-200px;width:720px;opacity:.05}
.simbolo svg{width:100%;height:auto;display:block}
.simbolo path{fill:#d1d3d4 !important}
.conteudo{position:absolute;inset:0;padding:140px 104px 104px;display:flex;flex-direction:column}
  .bloco{margin-top:auto;margin-bottom:auto;padding-bottom:40px}
.aspa{font-weight:900;color:#f0b855;font-size:260px;line-height:.62;letter-spacing:-.02em;height:140px}
.frase{margin-top:70px;font-weight:300;color:#fff;font-size:85px;line-height:1.14;white-space:nowrap;letter-spacing:-.022em}
.frase b{font-weight:900;color:#f0b855;letter-spacing:-.03em}
.rodape{display:flex;align-items:flex-end;justify-content:space-between;gap:40px}
.regua{width:104px;height:3px;background:#f0b855;margin-bottom:34px}
.nome{font-weight:700;font-size:50px;color:#fff;letter-spacing:-.015em}
.fonte{font-weight:300;font-size:27px;white-space:nowrap;color:#d1d3d4;margin-top:14px;line-height:1.35}
.data{font-weight:500;font-size:22px;color:#f0b855;text-transform:uppercase;letter-spacing:.14em;margin-top:26px}
.logo{width:200px;flex:none;margin-bottom:6px}
.logo svg{width:100%;height:auto;display:block}
</style></head><body>
<div class="arte" id="arte">
  __FACETAS__
  <div class="simbolo">__SIMBOLO__</div>
  <div class="conteudo">
    <div class="bloco">
    <div class="aspa">&ldquo;</div>
    <p class="frase">__FRASE__</p>
    </div>
    <div class="rodape">
      <div>
        <div class="regua"></div>
        <p class="nome">Nelson Mandela</p>
        <p class="fonte">Discurso no lançamento da Mindset Network</p>
        <p class="data">Joanesburgo · 16.07.2003</p>
      </div>
      <div class="logo">__LOGO__</div>
    </div>
  </div>
</div></body></html>"""


def main():
    html = (HTML.replace("__FONTES__", fontes())
                .replace("__FACETAS__", facetas())
                .replace("__SIMBOLO__", svg("ejup-symbol-white.svg"))
                .replace("__LOGO__", svg("ejup-vertical-white.svg"))
                .replace("__FRASE__", FRASE))
    dst = OUT / "post-mandela.html"
    dst.write_text(html, encoding="utf-8")
    print("gerado:", dst.name)


if __name__ == "__main__":
    main()
