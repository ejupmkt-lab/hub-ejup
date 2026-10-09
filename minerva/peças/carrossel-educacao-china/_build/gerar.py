#!/usr/bin/env python3
"""Carrossel do artigo "A educação do futuro está em curso" (Roberto Pivotto).

8 telas 1080x1350. A tela 1 é a capa vertical do LinkedIn/4:5 do artigo
(peças/capa-artigo-educacao-china/capa-linkedinv.png); as telas 2 a 8 seguem o
mesmo fundo navy com grão e halo, título Gotham Black com o fecho em dourado
Light, número grande em dourado nas telas de dado, fonte em rodapé.

    python3 _build/gerar.py
"""
import base64, pathlib, shutil
from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).resolve().parent
OUT = AQUI.parent
RAIZ = AQUI.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGO = RAIZ / "skills" / "ejup-design" / "assets" / "logo" / "ejup-horizontal-white.svg"
CAPA = RAIZ / "peças" / "capa-artigo-educacao-china" / "capa-linkedinv.png"


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    return "\n".join(
        f"@font-face{{font-family:'Gotham';font-weight:{peso};src:url({b64(FONTS / f'Gotham-{n}.otf', 'font/otf')}) format('opentype')}}"
        for n, peso in (("Light", 300), ("Book", 400), ("Medium", 500), ("Bold", 700), ("Black", 900)))


TELAS = [
    dict(numero="30%", titulo="", texto=(
        "Entre 2021 e 2025, as universidades chinesas revogaram ou suspenderam cerca de "
        "<b>12.200 cursos</b> de graduação e criaram cerca de <b>10.200</b>. A mudança "
        "alcançou mais de 30% da oferta."),
        fonte="Ministério da Educação da China, via South China Morning Post e Forbes"),
    dict(numero="57 <i>→</i> 1.000+", num_cls="menor", rot="cursos eliminados por ano", titulo="", texto=(
        "Em 2014, foram eliminados 57 cursos. Os ciclos recentes passam de "
        "<b>mil cancelamentos por ano</b>."), fonte="Caixin"),
    dict(titulo=("A manchete diz que a China trocou humanidades por inteligência artificial. "
                 "<span>Os números contam outra história.</span>"), texto=(
        "O saldo entre cursos criados e retirados é de cerca de <b>2.000 a menos</b>. Uma "
        "reorganização do portfólio, com cortes em línguas, artes, gestão e marketing, e "
        "criações que vão de semicondutores a arteterapia."),
        fonte="Rest of World · Xinhua, via People's Daily"),
    dict(eyebrow="Primeira lição · o ritmo", titulo="A revisão do currículo <span>virou política de Estado.</span>", texto=(
        "Meta de ajustar cerca de 20% dos cursos até 2025, canal de aprovação acelerada para "
        "áreas estratégicas e revisão em ciclos curtos. Um currículo que leva anos para mudar "
        "<b>forma para um mercado que já passou.</b>"), fonte="China Daily · Xinhua"),
    dict(eyebrow="Segunda lição · a régua", titulo="O indicador escolhido <span>molda o que a universidade faz.</span>", texto=(
        "O sistema de cartões vermelho e amarelo para cursos com baixa empregabilidade não tem "
        "critério nacional público. Quem defende avaliação por resultado precisa defender "
        "<b>a transparência de como o resultado é medido.</b>"), fonte="Xinhua · The Wire China"),
    dict(eyebrow="Terceira lição · a aposta", titulo="Humanidades com inteligência artificial <span>ainda é uma hipótese.</span>", texto=(
        "As reformulações existem, mas ainda não há dados de emprego dos formados nem avaliação "
        "dos resultados. Enquanto isso, o pensamento analítico segue como a habilidade central "
        "mais procurada, <b>essencial para 7 em cada 10 empresas.</b>"),
        fonte="Rest of World · Future of Jobs 2025, Fórum Econômico Mundial"),
    dict(titulo="A qualidade da educação do futuro <span>depende do critério de quem forma.</span>", texto=(
        "Defendemos uma formação que une as duas frentes: repertório para usar a ferramenta e "
        "<b>profundidade para interpretá-la.</b>"), cta="Leia o artigo completo · link na bio", fim=True),
]


def tela(t):
    num = f'<p class="num {t.get("num_cls", "")}">{t["numero"]}</p>' if t.get("numero") else ""
    rot = f'<p class="rot">{t["rot"]}</p>' if t.get("rot") else ""
    eb = f'<p class="eb">{t["eyebrow"]}</p>' if t.get("eyebrow") else ""
    tit = f'<h1>{t["titulo"]}</h1>' if t.get("titulo") else ""
    cta = f'<p class="cta">{t["cta"]} <i>→</i></p>' if t.get("cta") else ""
    fonte = f'<p class="fonte">Fonte: {t["fonte"]}</p>' if t.get("fonte") else ""
    seta = "" if t.get("fim") else '<p class="seta">→</p>'
    return (f'<section class="t"><div class="halo"></div><div class="miolo">{eb}{num}{rot}{tit}'
            f'<p class="txt">{t["texto"]}</p>{cta}</div>{fonte}<img class="logo" src="{b64(LOGO, "image/svg+xml")}">{seta}</section>')


CSS = """
*{margin:0;box-sizing:border-box}
body{background:#222;display:flex;flex-wrap:wrap;gap:20px;padding:20px;font-family:'Gotham',Montserrat,sans-serif}
.t{position:relative;width:1080px;height:1350px;overflow:hidden;color:#fff;flex:none;
  background:radial-gradient(70% 80% at 8% 0%,#0a2340 0%,rgba(10,35,64,0) 60%),
             linear-gradient(160deg,#071a2f 0%,#061424 55%,#040d18 100%)}
.t::before{content:"";position:absolute;inset:0;opacity:.035;mix-blend-mode:overlay;pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>")}
.halo{position:absolute;right:-260px;top:-200px;width:900px;height:900px;border-radius:50%;filter:blur(40px);
  background:radial-gradient(circle,rgba(240,184,85,.16) 0%,rgba(155,107,38,.07) 40%,rgba(240,184,85,0) 70%)}
.miolo{position:absolute;left:96px;right:96px;top:50%;transform:translateY(-54%)}
.eb{font-weight:500;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:#f0b855;margin-bottom:36px}
.num{font-weight:900;font-size:260px;line-height:.9;letter-spacing:-.04em;color:#f0b855;margin-bottom:20px}
.num.menor{font-size:150px;white-space:nowrap}
.num i{font-style:normal;font-weight:300;color:rgba(240,184,85,.7)}
.rot{font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:#d1d3d4;margin:-4px 0 40px}
h1{font-weight:900;font-size:74px;line-height:1.06;letter-spacing:-.024em}
h1 span{display:block;color:#f0b855;font-weight:300;letter-spacing:-.01em}
.txt{font-weight:300;font-size:36px;line-height:1.45;color:rgba(209,211,212,.92);margin-top:44px}
.num + .txt,.rot + .txt{margin-top:24px}
.txt b{font-weight:500;color:#fff}
.cta{display:inline-flex;gap:18px;align-items:center;margin-top:56px;padding:22px 34px;border:1.5px solid rgba(240,184,85,.6);
  border-radius:999px;font-weight:500;font-size:24px;letter-spacing:.12em;text-transform:uppercase;color:#f0b855}
.cta i{font-style:normal}
.fonte{position:absolute;left:96px;right:300px;bottom:84px;font-weight:300;font-size:20px;color:rgba(209,211,212,.6)}
.logo{position:absolute;right:96px;bottom:80px;height:36px}
.seta{position:absolute;right:96px;top:72px;font-size:40px;color:rgba(240,184,85,.8)}
"""


def main():
    html = f'<!doctype html><html><head><meta charset="utf-8"><style>{fontes()}{CSS}</style></head><body>{"".join(tela(t) for t in TELAS)}</body></html>'
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    (OUT / "telas").mkdir(exist_ok=True)
    shutil.copy(CAPA, OUT / "telas" / "tela-01.png")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1200, "height": 1500})
        pg.goto((OUT / "carrossel.html").as_uri()); pg.wait_for_timeout(600)
        for i in range(len(TELAS)):
            pg.locator(".t").nth(i).screenshot(path=str(OUT / "telas" / f"tela-{i + 2:02d}.png"))
        b.close()
    print("ok")


if __name__ == "__main__":
    main()
