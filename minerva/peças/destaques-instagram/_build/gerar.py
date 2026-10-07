#!/usr/bin/env python3
"""Capas dos destaques do Instagram da EJUP (1080x1920).

Sete destaques: curadoria, contato, quem somos, podcast, bastidores, a sala,
artigos. O Instagram mostra só o círculo central da capa, então o ícone vive
num diâmetro de ~560 px no centro; o resto da tela é fundo.

Duas direções, na paleta do MIV:
  A · navy  · fundo navy com facetas, aro dourado fino com os dois pontos do
              selo ejup/cast e ícone em traço dourado com brilho suave.
  B · ouro  · fundo dourado em degradê (ouro -> bronze) e ícone navy, a versão
              mais chamativa na grade, ainda com contraste máximo (navy sobre claro).

    python3 _build/gerar.py
"""
import base64, math, pathlib, re
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).resolve().parent
OUT = AQUI.parent
RAIZ = AQUI.parents[2]
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"

SIMBOLO = (LOGOS / "ejup-symbol-white.svg").read_text(encoding="utf-8")
SIMB_PATHS = re.search(r"<g[^>]*>(.*)</g>", SIMBOLO, re.S).group(1)

# ícones em traço, viewBox 0 0 100 100, desenhados para a mesma espessura
ICONES = {
    "curadoria": (  # livros empilhados com marcador
        '<path d="M22 70h56M26 70V36h12v34M40 70V30h12v40M54 70l8-36 11 2.5-8 35.5"/>'
        '<path d="M44 30v12l4-3 4 3V30"/><path d="M18 76h64"/>'),
    "contato": (  # balão de conversa
        '<path d="M20 30a8 8 0 0 1 8-8h44a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8H44l-14 12v-12h-2a8 8 0 0 1-8-8z"/>'
        '<path d="M34 40h32M34 50h22"/>'),
    "quem somos": None,  # símbolo da EJUP
    "podcast": (  # microfone de estúdio
        '<rect x="39" y="18" width="22" height="38" rx="11"/><path d="M39 32h8M39 41h8M53 32h8M53 41h8"/>'
        '<path d="M30 46a20 20 0 0 0 40 0M50 66v14M38 82h24"/>'),
    "bastidores": (  # claquete
        '<path d="M20 44h60v34a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z"/>'
        '<path d="M20 44l-2-12 58-10 2 12M30 30l8 12M46 27l8 12M62 24l8 12"/>'),
    "a sala": (  # mesa e duas cadeiras, de frente, sob a luz
        '<path d="M50 14v10M40 30h20l-4-6h-12z"/><path d="M26 58h48M32 58v22M68 58v22"/>'
        '<path d="M16 46v34M16 62h10v18M84 46v34M84 62H74v18"/>'),
    "artigos": (  # pena de escrever estilizada em bico de pena + linhas
        '<path d="M64 18l18 18-30 30-18 4 4-18z"/><path d="M48 52l-6 6"/><path d="M58 24l18 18"/>'
        '<path d="M18 82h40"/>'),
}
ORDEM = ["curadoria", "contato", "quem somos", "podcast", "bastidores", "a sala", "artigos"]


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def icone(nome, cor, larg=1.6):
    if ICONES[nome] is None:
        return (f'<svg viewBox="205 680 137 137" class="ic simb"><g fill="{cor}">{SIMB_PATHS}</g></svg>')
    return (f'<svg viewBox="0 0 100 100" class="ic"><g fill="none" stroke="{cor}" stroke-width="{larg}" '
            f'stroke-linecap="round" stroke-linejoin="round">{ICONES[nome]}</g></svg>')


def aro(cor, ponto, d=840):
    r = d / 2 - 18
    pts = "".join(f'<circle cx="{d/2 + r*math.cos(math.radians(a)):.1f}" cy="{d/2 + r*math.sin(math.radians(a)):.1f}" '
                  f'r="16" fill="{ponto}"/>' for a in (-70, 115))
    return (f'<svg class="aro" viewBox="0 0 {d} {d}" width="{d}" height="{d}"><circle cx="{d/2}" cy="{d/2}" r="{r}" '
            f'fill="none" stroke="{cor}" stroke-width="6"/>{pts}</svg>')


FACETAS = ('<svg class="fac" viewBox="0 0 1080 1920" preserveAspectRatio="none">'
           '<polygon points="0,0 700,0 180,1050 0,800" fill="#0a2a49"/>'
           '<polygon points="700,0 1080,0 1080,560" fill="#304557" opacity=".35"/>'
           '<polygon points="180,1050 1080,560 1080,1500 430,1920" fill="#0a2a49" opacity=".7"/>'
           '<polygon points="0,800 180,1050 430,1920 0,1920" fill="#061424"/></svg>')


def capa(nome, estilo):
    if estilo == "navy":
        return (f'<section class="c navy">{FACETAS}<div class="brilho"></div>'
                f'<div class="centro">{aro("rgba(240,184,85,.85)", "#f0b855")}{icone(nome, "#f0b855", 4.2)}</div></section>')
    return (f'<section class="c ouro"><div class="centro">{aro("rgba(3,28,55,.75)", "#031c37")}'
            f'{icone(nome, "#031c37", 4.6)}</div></section>')


def main():
    css = """
*{margin:0;box-sizing:border-box}
body{background:#222;display:flex;flex-wrap:wrap;gap:20px;padding:20px}
.c{position:relative;width:1080px;height:1920px;overflow:hidden;flex:none}
.navy{background:#031c37}
.fac{position:absolute;inset:0;width:100%;height:100%}
.brilho{position:absolute;left:50%;top:50%;width:900px;height:900px;transform:translate(-50%,-50%);
  background:radial-gradient(circle,rgba(240,184,85,.20) 0%,rgba(240,184,85,.06) 40%,rgba(240,184,85,0) 68%)}
.ouro{background:radial-gradient(70% 45% at 50% 46%,#f6cd7e 0%,#f0b855 45%,#c99a48 80%,#9b6b26 100%)}
.centro{position:absolute;left:50%;top:50%;width:840px;height:840px;transform:translate(-50%,-50%);
  display:flex;align-items:center;justify-content:center}
.aro{position:absolute;inset:0}
.ic{width:500px;height:500px;position:relative}
.ic.simb{width:400px;height:400px}
.navy .ic{filter:drop-shadow(0 0 22px rgba(240,184,85,.5))}
"""
    secoes = [capa(n, e) for e in ("navy", "ouro") for n in ORDEM]
    html = f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{"".join(secoes)}</body></html>'
    (OUT / "destaques.html").write_text(html, encoding="utf-8")
    for e in ("navy", "ouro"):
        (OUT / e).mkdir(exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1200, "height": 2000})
        pg.goto((OUT / "destaques.html").as_uri()); pg.wait_for_timeout(500)
        secs = pg.locator(".c")
        k = 0
        for e in ("navy", "ouro"):
            for n in ORDEM:
                secs.nth(k).screenshot(path=str(OUT / e / f"{ORDEM.index(n)+1:02d}-{n.replace(' ', '-')}.png")); k += 1
        b.close()
    print("ok")


if __name__ == "__main__":
    main()
