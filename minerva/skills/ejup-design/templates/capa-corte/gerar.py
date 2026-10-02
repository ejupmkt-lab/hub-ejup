#!/usr/bin/env python3
"""Capa padrão dos cortes do EJUPcast (1080x1920), sistema "faixas de foto".

Modelo aprovado: capa do corte #18 da Dra. Rossana ("Direito e moral", opção A1).
Fundo papel, selo ejup/cast no alto, título em Gotham com as palavras
intercaladas por janelas arredondadas para a MESMA foto, na mesma escala e
alinhadas entre si (juntas, remontam a cena), fio com nome e episódio, e uma
linha de apoio em Light com o trecho final em itálico bronze.

Uso:
    python3 gerar.py capa.json            # gera capa.html e capa.png ao lado do json

capa.json:
{
  "foto": "material/frame.jpg",          # frame do episódio, boca fechada
  "foco": [1100, 330],                   # ponto da foto (px) que vai ao centro da faixa larga
  "escala": 0.72,                        # escala da foto nas janelas (opcional)
  "linhas": [                            # 3 ou 4 linhas, na ordem
    {"texto": "Direito", "estilo": "it"},                      # só texto
    {"faixa": true},                                           # janela larga (onde cai o foco)
    {"texto": "e", "estilo": "bk", "janela": "direita"},       # texto + janela à direita
    {"texto": "moral", "estilo": "it", "janela": "esquerda"}   # janela à esquerda + texto
  ],
  "nome": "Dra. Rossana Fonseca",
  "episodio": "EJUPcast #18",
  "apoio": "A primeira lição do curso de Direito, e a que muita gente",
  "apoio_destaque": "esqueceu."
}
estilo: "it" = Book itálico · "bk" = Black. O título encolhe sozinho se não couber.
Tudo o que importa fica dentro do recorte 3:4 da grade do Instagram (y 240 a 1680).
"""
import base64, io, json, math, pathlib, random, re, sys
from PIL import Image, ImageEnhance
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).resolve().parent
DS = AQUI.parents[1]
FONTS, LOGOS = DS / "assets" / "fonts", DS / "assets" / "logo"


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    out = []
    for nome, peso, estilo in (("Light", 300, "normal"), ("Book", 400, "normal"), ("BookItalic", 400, "italic"),
                               ("Medium", 500, "normal"), ("Black", 900, "normal")):
        out.append(f"@font-face{{font-family:'Gotham';font-weight:{peso};font-style:{estilo};"
                   f"src:url({b64(FONTS / f'Gotham-{nome}.otf', 'font/otf')}) format('opentype')}}")
    return "\n".join(out)


def selo(d=210):
    logo = (LOGOS / "ejup-horizontal-navy.svg").read_text(encoding="utf-8")
    marca = re.sub(r'viewBox="[^"]*"', 'viewBox="352 690 282 118"', logo, count=1)
    r = d / 2 - 4
    pts = "".join(f'<circle cx="{d/2 + r*math.cos(math.radians(a)):.1f}" cy="{d/2 + r*math.sin(math.radians(a)):.1f}" r="4.5" fill="#9b6b26"/>'
                  for a in (-70, 115))
    return (f'<div class="selo" style="width:{d}px;height:{d}px"><svg class="aro" viewBox="0 0 {d} {d}">'
            f'<circle cx="{d/2}" cy="{d/2}" r="{r}" fill="none" stroke="rgba(3,28,55,.35)" stroke-width="1.5"/>{pts}</svg>'
            f'<div class="marca"><div>{marca}<span>/cast</span></div></div></div>')


def grao(w=540, h=960):
    random.seed(7)
    buf = io.BytesIO(); Image.effect_noise((w, h), 22).convert("L").save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


ARCOS = ('<svg class="arcos" viewBox="0 0 1080 1920"><g fill="none" stroke="#d1d3d4" stroke-width="70" opacity=".42">'
         '<path d="M-200 760 C 200 210, 700 0, 1300 120"/><path d="M-160 2160 C 300 1560, 800 1560, 1300 1310"/></g></svg>')


def linha(l):
    if l.get("faixa"):
        return '<div class="row larga"><div class="faixa principal"></div></div>'
    t = f'<p class="t {l.get("estilo", "it")}">{l["texto"]}</p>'
    j = l.get("janela")
    if j == "direita":
        return f'<div class="row curta">{t}<div class="faixa"></div></div>'
    if j == "esquerda":
        return f'<div class="row curta"><div class="faixa"></div>{t}</div>'
    return f'<div class="row so">{t}</div>'


def main(cfg_path):
    cfg_path = pathlib.Path(cfg_path).resolve()
    base = cfg_path.parent
    c = json.loads(cfg_path.read_text(encoding="utf-8"))
    foto = Image.open(base / c["foto"]).convert("RGB")
    foto = ImageEnhance.Contrast(ImageEnhance.Color(foto).enhance(.82)).enhance(1.06)
    buf = io.BytesIO(); foto.save(buf, "JPEG", quality=92)
    img = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    esc = c.get("escala", .72)
    fw = foto.width * esc
    linhas = "\n".join(linha(l) for l in c["linhas"])
    html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
{fontes()}
*{{box-sizing:border-box;margin:0}}
body{{width:1080px;height:1920px;font-family:'Gotham',Montserrat,sans-serif}}
.s{{position:relative;width:1080px;height:1920px;overflow:hidden;color:#031c37;
  background:radial-gradient(90% 60% at 50% 40%,#f3f1ec 0%,#ecebe7 60%,#e4e2dd 100%)}}
.arcos,.grao{{position:absolute;inset:0}}
.grao{{background:url({grao()});background-size:540px 960px;mix-blend-mode:overlay;opacity:.18}}
.selo{{position:absolute;left:50%;top:100px;transform:translateX(-50%)}}
.aro{{position:absolute;inset:0;width:100%;height:100%}}
.marca{{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}}
.marca>div{{display:flex;align-items:flex-end;gap:5px}}
.marca svg{{width:96px;height:auto;display:block}}
.marca svg path{{fill:#031c37!important}}
.marca span{{font-weight:500;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:5px;opacity:.8}}
.bloco{{position:absolute;left:112px;right:112px;top:0;display:flex;flex-direction:column}}
.row{{display:flex;align-items:center;gap:32px}}
.row.so{{height:210px}} .row.larga{{height:290px;margin:8px 0 14px}} .row.curta{{height:186px}}
.t{{line-height:.9;letter-spacing:-.035em;white-space:nowrap;font-size:var(--fs,206px)}}
.it{{font-style:italic;font-weight:400}} .bk{{font-weight:900}}
.faixa{{flex:1;align-self:stretch;border-radius:28px;background:url({img}) no-repeat;background-size:{fw:.0f}px auto;
  box-shadow:0 24px 44px -26px rgba(3,28,55,.6),inset 0 0 0 1px rgba(255,255,255,.08)}}
.row.curta .faixa{{margin:16px 0}}
.rodape{{display:flex;justify-content:space-between;align-items:baseline;border-top:1.5px solid rgba(3,28,55,.25);
  padding-top:26px;margin-top:44px}}
.nome{{font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase}}
.ep{{font-weight:300;font-size:24px;color:#5f6062}}
.apoio{{font-weight:300;font-size:40px;line-height:1.3;color:#414042;margin-top:30px}}
.apoio em{{font-style:italic;color:#9b6b26}}
</style></head><body><section class="s">
{ARCOS}
{selo()}
<div class="bloco">
{linhas}
<div class="rodape"><p class="nome">{c["nome"]}</p><p class="ep">{c["episodio"]}</p></div>
<p class="apoio">{c["apoio"]} <em>{c.get("apoio_destaque", "")}</em></p>
</div>
<div class="grao"></div>
</section>
<script>
const s = document.querySelector('.s'), bloco = document.querySelector('.bloco');
// o título encolhe por igual até toda linha com janela deixar ao menos 180px de foto
let fs = 206;
const cabe = () => [...document.querySelectorAll('.row')].every(r => {{
  const f = r.querySelector('.faixa'); const t = r.querySelector('.t');
  return (!f || r.classList.contains('larga') || f.getBoundingClientRect().width >= 180) &&
         (!t || t.getBoundingClientRect().right <= r.getBoundingClientRect().right + 1);
}});
while (!cabe() && fs > 120) {{ fs -= 4; s.style.setProperty('--fs', fs + 'px'); }}
// bloco centrado na área entre o selo e o fim do recorte 3:4 da grade (y 330 a 1680)
const h = bloco.getBoundingClientRect().height;
bloco.style.top = Math.round(330 + Math.max(0, (1680 - 330 - h) / 2)) + 'px';
// janelas para a mesma foto: o foco cai no centro da faixa larga (ou da primeira janela),
// e a foto sempre cobre todas as janelas (sobe a escala e trava o deslocamento se preciso)
const sr = s.getBoundingClientRect();
const fs_ = [...document.querySelectorAll('.faixa')].map(f => {{
  const r = f.getBoundingClientRect(); return {{f, x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height}}; }});
const U = {{x: Math.min(...fs_.map(a => a.x)), y: Math.min(...fs_.map(a => a.y)),
           r: Math.max(...fs_.map(a => a.x + a.w)), b: Math.max(...fs_.map(a => a.y + a.h))}};
let e = {esc};
e = Math.max(e, (U.r - U.x) / {foto.width} * 1.02, (U.b - U.y) / {foto.height} * 1.02);
const PW = {foto.width} * e, PH = {foto.height} * e;
const ref = fs_.find(a => a.f.classList.contains('principal')) || fs_[0];
let L = ref.x + ref.w / 2 - {c["foco"][0]} * e, T = ref.y + ref.h / 2 - {c["foco"][1]} * e;
L = Math.min(U.x, Math.max(U.r - PW, L)); T = Math.min(U.y, Math.max(U.b - PH, T));
fs_.forEach(a => {{ a.f.style.backgroundSize = PW + 'px auto';
  a.f.style.backgroundPosition = (L - a.x) + 'px ' + (T - a.y) + 'px'; }});
document.body.dataset.pronto = fs;
</script></body></html>"""
    saida = base / c.get("saida", "capa.png")
    (base / "capa.html").write_text(html, encoding="utf-8")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1080, "height": 1920})
        pg.goto((base / "capa.html").as_uri()); pg.wait_for_selector("body[data-pronto]")
        pg.wait_for_timeout(400)
        print("título em", pg.evaluate("document.body.dataset.pronto"), "px")
        pg.locator(".s").screenshot(path=str(saida))
        b.close()
    print(saida)


if __name__ == "__main__":
    main(sys.argv[1])
