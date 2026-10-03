#!/usr/bin/env python3
"""Carrossel "Minerva, a guardiã da marca EJUP".

Sete telas 1080x1440 numa faixa única. A orbe de Minerva (a mesma da
interface de voz: esfera navy, aro dourado, anéis que abrem) aparece pequena
e fechada na capa e vai abrindo tela a tela; o fio dourado passa por dentro
de cada orbe e liga a sequência. A moeda da coruja de Atenas atravessa da
tela 2 para a 3. Depois a faixa é cortada em sete PNGs (render.py).

Imagens: domínio público ou CC BY, créditos em material/CREDITOS.md.
"""
import base64, io, pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
MAT = OUT / "material" / "web"
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
W, H, N = 1080, 1440, 7
ESCURAS = {0, 1, 3, 5, 6}        # 2 (verbete) e 4 (semana) são papel


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def img(nome, larg=1600, caixa=None):
    im = Image.open(MAT / nome)
    if caixa:
        im = im.crop(caixa)
    png = im.mode in ("RGBA", "L")
    if im.width > larg:
        im = im.resize((larg, int(im.height * larg / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    if png:
        im.save(buf, "PNG"); mime = "image/png"
    else:
        im.convert("RGB").save(buf, "JPEG", quality=88); mime = "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()


def fontes():
    out = []
    for nome, peso in (("Light", 300), ("Book", 400), ("Medium", 500), ("Bold", 700), ("Black", 900)):
        out.append(f"@font-face{{font-family:'Gotham';font-weight:{peso};"
                   f"src:url({b64(FONTS / f'Gotham-{nome}.otf', 'font/otf')}) format('opentype')}}")
    return "\n".join(out)


def x(k):
    return k * W


# a orbe 3D de Minerva: quadros do vídeo de abertura, do fechado ao aberto
# a orbe 3D aparece só em três momentos: capa, fonte e fecho (imagens de fundo)
PTS = [(749, 439), (900, 300), (1080, 120), (1600, 90), (2160, 140), (2700, 150), (3140, 200),
       (3205, 420), (3210, 900), (3240, 1250), (3380, 1385), (3800, 1395), (4180, 1360),
       (4330, 1110), (4600, 1100), (5000, 1100), (5304, 1100), (5370, 900), (5400, 560), (5700, 380),
       (6160, 364), (6580, 300), (7020, 430)]


def caminho(p):
    d = f"M{p[0][0]},{p[0][1]}"
    for i in range(len(p) - 1):
        p0 = p[i - 1] if i else p[i]
        p1, p2 = p[i], p[i + 1]
        p3 = p[i + 2] if i + 2 < len(p) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.0f},{c1[1]:.0f} {c2[0]:.0f},{c2[1]:.0f} {p2[0]},{p2[1]}"
    return d


def fio_e_orbes():
    d = caminho(PTS)
    claros = "".join(f'<rect x="{x(k)}" y="0" width="{W}" height="{H}"/>' for k in range(N) if k not in ESCURAS)
    escuros = "".join(f'<rect x="{x(k)}" y="0" width="{W}" height="{H}"/>' for k in ESCURAS)
    return f"""<svg class="fio" viewBox="0 0 {W*N} {H}" width="{W*N}" height="{H}">
  <defs><clipPath id="ce">{escuros}</clipPath><clipPath id="cc">{claros}</clipPath>
  <filter id="brilho" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
  <g clip-path="url(#ce)"><path d="{d}" stroke="#f0b855" stroke-width="10" fill="none" opacity=".35" filter="url(#brilho)"/>
    <path d="{d}" stroke="#f0b855" stroke-width="2.6" fill="none"/></g>
  <g clip-path="url(#cc)"><path d="{d}" stroke="#9b6b26" stroke-width="2.6" fill="none"/></g>
</svg>"""


def tela(k, classe, miolo, fundo=""):
    return f'<section class="t {classe}" style="left:{x(k)}px">{fundo}{miolo}</section>'


def semana():
    """A semana do aluno: aulas e revisões distribuídas no tempo que ele tem."""
    dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    blocos = {1: ("aula", "Aula", "40 min"), 2: ("rev", "Revisão", "1 dia"), 3: ("aula", "Aula", "40 min"),
              5: ("rev", "Revisão", "7 dias")}
    col = []
    for i, d in enumerate(dias):
        b = blocos.get(i)
        miolo = f'<div class="bloco {b[0]}"><b>{b[1]}</b><span>{b[2]}</span></div>' if b else '<div class="bloco livre"></div>'
        col.append(f'<div class="dia"><p>{d}</p>{miolo}</div>')
    return f'<div class="semana">{"".join(col)}</div>'


def main():
    logo_b = b64(LOGOS / "ejup-horizontal-white.svg", "image/svg+xml")
    t = []
    # 1 · capa: a cena do dia a dia
    t.append(tela(0, "escura", f"""
  <h1 class="tit" style="top:700px">22h40. Você saiu do escritório com uma dúvida <em>da aula de ontem.</em></h1>
  <p class="sub" style="top:1100px">Quem estuda na EJUP tem a quem perguntar.</p>
  <img class="logo" src="{logo_b}" alt="">
  <p class="arraste">Arraste</p>""",
        f'<div class="bg" style="background:#05080c url({img("../orbe-3d/orbe-coruja.png", 1600)}) no-repeat -60px 0/1600px auto"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,0) 34%,rgba(13,19,26,.8) 52%,#0d131a 64%)"></div>'))
    # 2 · a conversa no portal (campo azul)
    falas = [("eu", "Tenho 40 minutos hoje. Por onde eu começo?"),
             ("ela", "Pela revisão da aula de ontem, que vence hoje. A próxima aula fica para quinta, no seu horário de estudo."),
             ("eu", "E aquela parte do fim da aula que eu não entendi?"),
             ("ela", "Eu explico com base no material da aula e sugiro uma leitura para aprofundar.")]
    chat = "".join(
        (f'<div class="fala ela"><p class="quem">Minerva</p><p>{f}</p></div>' if q == "ela"
         else f'<div class="fala eu"><p>{f}</p></div>') for q, f in falas)
    t.append(tela(1, "azul", f"""
  <div class="chat" style="top:200px">{chat}</div>
  <p class="fonte">Conversa ilustrativa no portal do aluno EJUP.</p>"""))
    # 3 · verbete (papel)
    t.append(tela(2, "papel", """
  <p class="classe" style="top:250px">Substantivo próprio · feminino</p>
  <h2 class="verbete" style="top:302px">Mi·ner·va</h2>
  <ol class="acepcoes" style="top:630px">
    <li>Deusa romana da sabedoria, a Atena dos gregos. Seu símbolo é a coruja.</li>
    <li>No portal do aluno EJUP, a orientadora de estudo. Responde dúvidas do curso com base no material da escola e organiza o estudo no tempo que você tem.</li>
  </ol>"""))
    # 4 · voto de Minerva: a estátua
    t.append(tela(3, "escura", """
  <h2 class="tit" style="top:620px">Vem dela o<br><em>voto de Minerva.</em></h2>
  <p class="txt" style="top:830px;width:820px">Na tragédia de Ésquilo, Atena desempata o julgamento de Orestes. No seu estudo, Minerva ajuda a decidir o que vem primeiro.</p>
  <p class="fonte topo">Ésquilo, <i>Eumênides</i> · Atena Varvakeion, séc. III d.C.</p>""",
        f'<div class="bg" style="background-image:url({img("atena-varv2-up.jpg", 1400)});background-size:auto 112%;background-position:62% 0%;filter:brightness(.72) saturate(.5)"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,.15) 0%,rgba(13,19,26,0) 30%,rgba(13,19,26,.82) 50%,#0d131a 68%)"></div>'))
    # 5 · tempo (papel): a semana
    t.append(tela(4, "papel", f"""
  <h2 class="tit" style="top:190px">Ela organiza<br><em>o seu tempo.</em></h2>
  <p class="txt" style="top:400px">Você diz quantas horas tem e em quais dias estuda. Ela distribui as aulas, marca as revisões e ajusta o plano quando a semana foge do previsto.</p>
  <div style="position:absolute;left:96px;top:780px;z-index:3">{semana()}</div>
  <p class="nota" style="top:1270px">Revisões marcadas em 1, 7 e 30 dias.</p>"""))
    # 6 · dúvidas: a orbe sobre os livros
    t.append(tela(5, "escura", """
  <h2 class="tit" style="top:700px">Ela responde com<br><em>o material da escola.</em></h2>
  <p class="txt" style="top:910px">A dúvida do curso ganha resposta com base nas aulas e nos materiais da EJUP, no momento em que aparece.</p>
  <p class="txt" style="top:1150px">Com o mesmo critério das aulas: referência clara e nenhum atalho.</p>""",
        f'<div class="bg" style="background:#05080c url({img("../orbe-3d/orbe-livros.png", 2600)}) no-repeat -489px 0/auto 1440px"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,0) 35%,rgba(13,19,26,.82) 52%,rgba(13,19,26,.9) 100%)"></div>'))
    # 7 · fecho: exclusiva de quem estuda na EJUP
    t.append(tela(6, "escura", f"""
  <h2 class="tit" style="top:790px">Minerva é exclusiva de quem <em>estuda na EJUP.</em></h2>
  <p class="txt" style="top:1080px">Ela acompanha cada aluno no portal, da primeira aula à última revisão.</p>
  <p class="cta">Conheça as formações · ejup.com.br</p>
  <img class="logo" src="{logo_b}" alt="">""",
        f'<div class="bg" style="background:#05080c url({img("../orbe-3d/orbe-arco.png", 2000)}) no-repeat -421px -89px/auto 1100px"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,0) 45%,rgba(13,19,26,.85) 58%,#0d131a 72%)"></div>'))

    ponte = f'<img class="moeda" src="{img("moeda-recorte.png", 900)}" alt="" style="left:{x(3) - 240}px;top:1110px;width:440px">'

    html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Carrossel Minerva aluno</title><style>
{fontes()}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#222;font-family:'Gotham',sans-serif}}
.faixa{{position:relative;width:{W*N}px;height:{H}px;overflow:hidden}}
.t{{position:absolute;top:0;width:{W}px;height:{H}px;overflow:hidden}}
.escura{{background:#0d131a;color:#fff}}
.azul{{background:#031c37;color:#fff}}
.papel{{background:radial-gradient(90% 60% at 50% 30%,#f3f1ec 0%,#ecebe7 65%,#e4e2dd 100%);color:#031c37}}
.bg{{position:absolute;inset:0;background-size:cover}}
.veu{{position:absolute;inset:0}}
.tit{{position:absolute;left:96px;right:96px;font-weight:900;font-size:80px;line-height:1.04;letter-spacing:-.025em;z-index:3}}
.tit.pequeno{{font-size:48px;letter-spacing:-.02em}}
h1.tit{{font-size:84px}}
.tit em{{font-style:normal;color:#f0b855}}
.papel .tit em{{color:#9b6b26}}
.sub{{position:absolute;left:96px;right:120px;font-weight:300;font-size:40px;line-height:1.35;color:#d1d3d4;z-index:3}}
.txt{{position:absolute;left:96px;width:860px;font-weight:300;font-size:40px;line-height:1.42;z-index:3;color:#d1d3d4}}
.papel .txt{{color:#414042}}
.fonte{{position:absolute;left:96px;bottom:64px;font-weight:400;font-size:20px;line-height:1.4;letter-spacing:.02em;z-index:3;color:rgba(209,211,212,.75)}}
.fonte.topo{{bottom:auto;top:64px;left:auto;right:96px;text-align:right}}
.logo{{position:absolute;left:96px;bottom:64px;width:190px;z-index:3}}
.arraste{{position:absolute;right:96px;bottom:74px;font-weight:500;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#f0b855;z-index:3}}
.arraste::after{{content:"";display:inline-block;width:46px;height:2px;background:#f0b855;margin-left:14px;vertical-align:middle}}
.cta{{position:absolute;right:96px;bottom:70px;font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:#f0b855;z-index:3}}
.classe{{position:absolute;left:96px;font-weight:500;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:#9b6b26;z-index:3}}
.verbete{{position:absolute;left:84px;font-weight:900;font-size:176px;line-height:1;letter-spacing:-.03em;color:#031c37;z-index:3}}
.acepcoes{{position:absolute;left:96px;right:96px;list-style:none;counter-reset:a;display:grid;gap:40px;z-index:3}}
.acepcoes li{{counter-increment:a;position:relative;padding-left:72px;font-weight:300;font-size:40px;line-height:1.4;color:#414042}}
.acepcoes li::before{{content:counter(a);position:absolute;left:0;top:-2px;font-weight:900;font-size:44px;color:#9b6b26}}
.acepcoes li+li{{padding-top:40px;border-top:1px solid rgba(3,28,55,.14)}}
.acepcoes li+li::before{{top:38px}}
.manifesto{{position:absolute;left:96px;font-weight:900;font-size:118px;line-height:.98;letter-spacing:-.035em;color:#fff;z-index:3}}
.manifesto em{{font-style:normal;color:#f0b855}}
.chat{{position:absolute;left:96px;right:96px;display:grid;gap:44px;z-index:3}}
.fala{{max-width:800px;display:grid;gap:10px}}
.fala p{{font-weight:300;font-size:40px;line-height:1.38}}
.fala.eu{{justify-self:end}}
.fala.eu p{{background:rgba(209,211,212,.12);border:1px solid rgba(209,211,212,.22);border-radius:12px 12px 2px 12px;padding:26px 30px;color:#fff}}
.fala.ela p:last-child{{background:#0d131a;border:1.5px solid rgba(240,184,85,.55);border-radius:12px 12px 12px 2px;padding:26px 30px;color:#ecebe7}}
.fala .quem{{font-weight:500;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#f0b855;padding-left:4px}}
.semana{{display:grid;grid-template-columns:repeat(7,120px);gap:8px}}
.dia p{{font-weight:500;font-size:18px;letter-spacing:.14em;text-transform:uppercase;color:#5f6062;text-align:center;margin-bottom:14px}}
.bloco{{height:360px;border-radius:8px;display:flex;flex-direction:column;justify-content:flex-end;padding:16px 12px;gap:6px}}
.bloco.livre{{border:1px dashed rgba(3,28,55,.2)}}
.bloco.aula{{background:#031c37;color:#fff}}
.bloco.rev{{background:#fff;border:2px solid #9b6b26;color:#9b6b26}}
.bloco b{{font-weight:900;font-size:21px;letter-spacing:-.01em}}
.bloco span{{font-weight:300;font-size:17px}}
.nota{{position:absolute;left:96px;font-weight:500;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:#9b6b26;z-index:3}}
.regua line{{stroke:#f0b855;stroke-width:2}}
.regua line.maior{{stroke-width:3}}
.regua text{{fill:#d1d3d4;font-family:'Gotham';font-weight:500;font-size:17px;letter-spacing:.14em;text-transform:uppercase}}
.grade{{position:absolute;left:96px;right:96px;display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(3,28,55,.16);z-index:3}}
.grade div{{padding:30px 24px 30px 0;font-weight:300;font-size:34px;line-height:1.3;color:#414042;border-bottom:1px solid rgba(3,28,55,.16)}}
.grade div:nth-child(even){{padding-left:32px;border-left:1px solid rgba(3,28,55,.16)}}
.grade b{{font-weight:900;color:#031c37}}
.fio{{position:absolute;left:0;top:0;z-index:2;pointer-events:none}}
.moeda{{position:absolute;z-index:4;transform:rotate(-8deg);filter:drop-shadow(0 30px 40px rgba(0,0,0,.55)) saturate(.7)}}
.carta{{position:absolute;z-index:4;transform:rotate(-5deg);box-shadow:0 50px 80px -30px rgba(3,28,55,.55)}}
.carta img{{display:block;width:100%}}
</style></head><body><div class="faixa">
{''.join(t)}
{ponte}
{fio_e_orbes()}
</div></body></html>"""
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    print("ok")


if __name__ == "__main__":
    main()
