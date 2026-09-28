#!/usr/bin/env python3
"""A Sala · episódio 01 (caso Vorcaro) · provas para imprimir e pregar no mural.

Cartões de 10×14 cm a 300 dpi (1181×1654 px), quatro por A4:
* os quatro ministros como cópia impressa de dossiê (Anexo 02 a 05, a mesma
  numeração do carrossel), com as fotos institucionais já creditadas em
  peças/carrossel-caso-vorcaro/fotos/CREDITOS.md;
* nove cartões-ícone, as "iscas" do mural, desenhados em traço (Anexo 06 a 14).

Nenhum texto sugere culpa: legenda factual, verbo de fonte ("segundo a PF").
Mensagens do celular e trechos de documento saem tarjados: nada inventado
aparece legível. Zero crédito do Higgsfield.

    python3 _build/gerar.py && python3 _build/render.py
"""
import base64
import io
import pathlib

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
FOTOS = RAIZ / "peças" / "carrossel-caso-vorcaro" / "fotos"

W, H = 1181, 1654   # 10 × 14 cm a 300 dpi
NAVY, INK, BRONZE, PAPEL = "#031c37", "#0d131a", "#9b6b26", "#f2f1ee"

MINISTROS = [
    ("02", "Dias Toffoli", "toffoli", "Foto: Nelson Jr./STF"),
    ("03", "André Mendonça", "mendonca", "Foto: Rosinei Coutinho/STF"),
    ("04", "Alexandre de Moraes", "moraes", "Foto: Isac Nóbrega/PR"),
    ("05", "Gilmar Mendes", "gilmar", "Foto: Alejandro Zambrana/TSE"),
]


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    return "\n".join(
        f"@font-face{{font-family:'Gotham';font-weight:{peso};"
        f"src:url({b64(FONTS / f'Gotham-{n}.otf', 'font/otf')}) format('opentype')}}"
        for n, peso in (("Light", 300), ("Book", 400), ("Medium", 500),
                        ("Bold", 700), ("Black", 900)))


def foto(nome):
    """Cópia impressa fria, 3:4, 1200 px de largura. Usa a versão com
    textura (Higgsfield, rosto conferido) quando existe."""
    ia = FOTOS / f"{nome}-ia.png"
    src = ia if ia.exists() else next(FOTOS.glob(f"{nome}.*"))
    im = Image.open(src).convert("RGB")
    im = ImageOps.fit(im, (1200, 1600), Image.LANCZOS, centering=(0.5, 0.3))
    g = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(2, 1))
    if not ia.exists():                      # foto pequena: grão disfarça a ampliação
        g = g.filter(ImageFilter.UnsharpMask(2, 80, 3))
        g = Image.blend(g, Image.effect_noise(g.size, 40).filter(ImageFilter.GaussianBlur(.7)), .08)
    g = ImageEnhance.Contrast(g).enhance(1.12)
    im = ImageOps.colorize(g, black=(10, 16, 24), white=(236, 234, 228))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=92)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


# ---------------------------------------------------------------- ícones (viewBox 0 0 200 200)
S = 'fill="none" stroke="#031c37" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"'
TARJA = '#0d131a'

ICONES = {
    "celular": f'''<rect x="62" y="14" width="76" height="172" rx="12" {S}/>
      <line x1="90" y1="24" x2="110" y2="24" {S}/>
      <rect x="70" y="34" width="60" height="136" rx="3" {S} stroke-width="1.6"/>
      <rect x="74" y="44" width="36" height="12" rx="6" fill="{TARJA}"/>
      <rect x="90" y="62" width="36" height="12" rx="6" fill="#304557"/>
      <rect x="74" y="80" width="42" height="12" rx="6" fill="{TARJA}"/>
      <rect x="74" y="98" width="28" height="12" rx="6" fill="{TARJA}"/>
      <rect x="86" y="116" width="40" height="12" rx="6" fill="#304557"/>
      <rect x="74" y="134" width="38" height="12" rx="6" fill="{TARJA}"/>
      <line x1="112" y1="160" x2="126" y2="160" {S} stroke-width="1.6"/>''',
    "aviao": f'''<path d="M100 22 C106 22 108 30 108 40 L108 84 L168 116 L168 130 L108 112 L108 150
      L128 166 L128 176 L100 168 L72 176 L72 166 L92 150 L92 112 L32 130 L32 116 L92 84 L92 40
      C92 30 94 22 100 22 Z" {S}/>
      <path d="M22 190 Q 60 170 100 186 T 180 184" {S} stroke-dasharray="4 8" stroke-width="2"/>''',
    "banco": f'''<path d="M26 70 L100 30 L174 70 Z" {S}/><line x1="22" y1="78" x2="178" y2="78" {S}/>
      <line x1="44" y1="88" x2="44" y2="150" {S}/><line x1="78" y1="88" x2="78" y2="150" {S}/>
      <line x1="122" y1="88" x2="122" y2="150" {S}/><line x1="156" y1="88" x2="156" y2="150" {S}/>
      <line x1="30" y1="158" x2="170" y2="158" {S}/><line x1="20" y1="170" x2="180" y2="170" {S}/>
      <g transform="rotate(-12 100 116)"><rect x="40" y="96" width="120" height="38" rx="4" fill="none"
      stroke="{BRONZE}" stroke-width="3.5"/><text x="100" y="122" text-anchor="middle"
      style="font:900 15px Gotham;letter-spacing:1px;fill:{BRONZE}">LIQUIDADO</text></g>''',
    "cdb": f'''<path d="M46 20 H130 L156 46 V180 H46 Z" {S}/><path d="M130 20 V46 H156" {S}/>
      <line x1="62" y1="62" x2="116" y2="62" {S} stroke-width="2"/>
      <line x1="62" y1="76" x2="100" y2="76" {S} stroke-width="2"/>
      <text x="100" y="128" text-anchor="middle" style="font:900 27px Gotham;fill:#031c37">% CDI</text>
      <ellipse cx="100" cy="116" rx="52" ry="26" fill="none" stroke="{BRONZE}" stroke-width="3" transform="rotate(-6 100 116)"/>
      <polyline points="64,166 84,150 100,158 136,136" {S}/><polyline points="124,136 136,136 136,148" {S}/>''',
    "fgc": f'''<path d="M100 18 L162 40 V96 C162 140 134 168 100 184 C66 168 38 140 38 96 V40 Z" {S}/>
      <text x="100" y="98" text-anchor="middle" style="font:900 28px Gotham;fill:#031c37">R$ 250</text>
      <text x="100" y="124" text-anchor="middle" style="font:500 15px Gotham;letter-spacing:3px;fill:#031c37">MIL</text>
      <line x1="70" y1="140" x2="130" y2="140" stroke="{BRONZE}" stroke-width="3"/>''',
    "pessoas": "".join(
        f'<circle cx="{28 + c * 29}" cy="{36 + r * 42}" r="7" {S} stroke-width="2.4"/>'
        f'<path d="M{16 + c * 29} {62 + r * 42} C{16 + c * 29} {48 + r * 42} {40 + c * 29} {48 + r * 42} {40 + c * 29} {62 + r * 42}" {S} stroke-width="2.4"/>'
        for r in range(4) for c in range(6)),
    "contrato": f'''<path d="M44 16 H156 V184 H44 Z" {S}/>
      <text x="100" y="42" text-anchor="middle" style="font:700 12px Gotham;letter-spacing:4px;fill:#031c37">CONTRATO</text>
      <rect x="60" y="58" width="80" height="8" fill="{TARJA}"/><rect x="60" y="74" width="62" height="8" fill="{TARJA}"/>
      <rect x="60" y="90" width="74" height="8" fill="{TARJA}"/>
      <text x="100" y="128" text-anchor="middle" style="font:900 19px Gotham;fill:#031c37">R$ 130 mi</text>
      <line x1="62" y1="136" x2="138" y2="136" stroke="{BRONZE}" stroke-width="3"/>
      <rect x="60" y="148" width="54" height="8" fill="{TARJA}"/>
      <path d="M70 172 C 80 162, 90 178, 100 168 S 120 164, 132 172" {S} stroke-width="2"/>''',
    "stf": f'''<line x1="18" y1="60" x2="182" y2="60" {S}/><line x1="18" y1="150" x2="182" y2="150" {S}/>
      ''' + "".join(
        f'<path d="M{30 + i * 28} 60 Q {38 + i * 28} 105 {30 + i * 28} 150 M{30 + i * 28} 60 Q {22 + i * 28} 105 {30 + i * 28} 150" {S} stroke-width="2.6"/>'
        for i in range(6)) + f'<line x1="10" y1="166" x2="190" y2="166" {S}/>',
    "relatorio": f'''<path d="M40 14 H160 V186 H40 Z" {S}/>
      <text x="100" y="40" text-anchor="middle" style="font:700 11px Gotham;letter-spacing:3px;fill:#031c37">RELATÓRIO</text>
      <line x1="56" y1="50" x2="144" y2="50" {S} stroke-width="1.6"/>
      <rect x="56" y="64" width="88" height="7" fill="{TARJA}"/><rect x="56" y="78" width="70" height="7" fill="{TARJA}"/>
      <rect x="56" y="92" width="80" height="7" fill="{TARJA}"/><rect x="56" y="106" width="50" height="7" fill="{TARJA}"/>
      <rect x="56" y="120" width="84" height="7" fill="{TARJA}"/><rect x="56" y="134" width="64" height="7" fill="{TARJA}"/>
      <g transform="rotate(-10 104 160)"><rect x="58" y="146" width="96" height="28" rx="3" fill="none"
      stroke="{BRONZE}" stroke-width="3"/><text x="106" y="166" text-anchor="middle"
      style="font:900 15px Gotham;letter-spacing:3px;fill:{BRONZE}">SIGILOSO</text></g>''',
}

PROVAS = [
    ("06", "celular", "Celular apreendido", "Segundo a Polícia Federal, nele estavam as mensagens que levaram o caso ao Supremo."),
    ("07", "aviao", "Guarulhos, 18.11.2025", "O dono do banco é preso no aeroporto, na Operação Compliance Zero."),
    ("08", "banco", "Liquidação extrajudicial", "No mesmo dia, o Banco Central fecha o Banco Master."),
    ("09", "cdb", "CDB acima do mercado", "O banco pagava muito mais que os outros. E repetia: tem garantia do FGC."),
    ("10", "fgc", "Teto do FGC", "R$ 250 mil por pessoa, em cada banco. Quem tinha mais foi para a fila."),
    ("11", "pessoas", "1,6 milhão de credores", "Com dinheiro travado no maior acionamento da história do FGC."),
    ("12", "contrato", "Contrato de cerca de R$ 130 milhões", "Segundo a PF, com o escritório de Viviane Barci de Moraes. Moraes nega relação com Vorcaro."),
    ("13", "stf", "Supremo Tribunal Federal", "Onde o caso chegou. Nenhum ministro é investigado por crime neste caso."),
    ("14", "relatorio", "Relatório da Polícia Federal", "Setembro de 2026. Trouxe o terceiro nome ao caso."),
]


def cartao_ministro(n, nome, arq, credito):
    return f"""<section class="cartao ministro">
  <div class="foto"><img src="{foto(arq)}" alt=""></div>
  <div class="rodape"><p class="anexo">Anexo {n}</p><p class="nome">{nome}</p>
    <p class="credito">{credito}</p></div>
</section>"""


def cartao_prova(n, icone, titulo, legenda):
    return f"""<section class="cartao prova">
  <p class="anexo topo">Anexo {n}</p>
  <svg class="icone" viewBox="0 0 200 200">{ICONES[icone]}</svg>
  <div class="rodape"><p class="titulo">{titulo}</p><p class="legenda">{legenda}</p></div>
</section>"""


CSS = f"""
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#5b6169;display:flex;flex-wrap:wrap;gap:30px;padding:30px;font-family:'Gotham',system-ui,sans-serif}}
.cartao{{position:relative;width:{W}px;height:{H}px;overflow:hidden;background:
  radial-gradient(120% 90% at 30% 20%,#f7f6f3 0%,{PAPEL} 55%,#e9e7e1 100%);color:{NAVY}}}
.cartao::after{{content:"";position:absolute;inset:0;pointer-events:none;opacity:.05;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")}}
.anexo{{font-weight:500;font-size:30px;letter-spacing:.2em;text-transform:uppercase;color:{BRONZE}}}
/* ministro: moldura de cópia fotográfica */
.ministro .foto{{position:absolute;left:70px;right:70px;top:70px;height:1240px;background:#111}}
.ministro .foto img{{width:100%;height:100%;object-fit:cover;display:block}}
.ministro .rodape{{position:absolute;left:70px;right:70px;top:1350px}}
.ministro .nome{{font-weight:900;font-size:66px;letter-spacing:-.02em;margin-top:14px;line-height:1}}
.ministro .credito{{position:absolute;right:0;top:4px;font-weight:400;font-size:22px;color:#5f6062}}
/* prova: ícone em traço */
.prova .topo{{position:absolute;left:90px;top:90px}}
.prova .icone{{position:absolute;left:165px;top:210px;width:850px;height:850px}}
.prova .rodape{{position:absolute;left:90px;right:90px;top:1170px;border-top:3px solid {NAVY};padding-top:44px}}
.prova .titulo{{font-weight:900;font-size:68px;line-height:1.05;letter-spacing:-.02em}}
.prova .legenda{{font-weight:300;font-size:36px;line-height:1.4;margin-top:22px;color:#414042}}
"""


def main():
    cartoes = [cartao_ministro(*m) for m in MINISTROS] + [cartao_prova(*p) for p in PROVAS]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>A Sala ep01 impressão</title>'
            f'<style>{fontes()}{CSS}</style></head><body>{"".join(cartoes)}</body></html>')
    (OUT / "cartoes.html").write_text(html, encoding="utf-8")
    print(f"gerado: cartoes.html ({len(cartoes)} cartões)")


if __name__ == "__main__":
    main()
