#!/usr/bin/env python3
"""Seção "Minerva" para o site ejup.com.br.

A orbe 3D abre quando a seção entra na tela (quadros do vídeo de abertura,
desenhados num canvas com mistura "screen", então o fundo preto do vídeo some
no azul da seção). Com prefers-reduced-motion a orbe já aparece aberta.
Saída: site/minerva-guardia.html (arquivo único, fontes e quadros embutidos).
"""
import base64, io, pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
QUADROS = OUT / "material" / "orbe-3d" / "quadros"
FONTS = HERE.parents[2] / "skills" / "ejup-design" / "assets" / "fonts"
LADO = 560


def quadros():
    out = []
    for n in list(range(1, 122, 2)):
        im = Image.open(QUADROS / f"abertura-{n:03d}.png").convert("RGB")
        c = im.crop((954 - 560, 531 - 560, 954 + 560, 531 + 560)).resize((LADO, LADO), Image.LANCZOS)
        b = io.BytesIO(); c.save(b, "JPEG", quality=78)
        out.append("data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode())
    return out


def fontes():
    r = []
    for nome, peso in (("Light", 300), ("Book", 400), ("Medium", 500), ("Black", 900)):
        d = base64.b64encode((FONTS / f"Gotham-{nome}.otf").read_bytes()).decode()
        r.append(f"@font-face{{font-family:'Gotham';font-weight:{peso};font-display:swap;"
                 f"src:url(data:font/otf;base64,{d}) format('opentype')}}")
    return "\n".join(r)


HTML = """<title>Minerva na EJUP</title>
<style>
__FONTES__
/* Seção escura de marca: orbe à esquerda que abre ao entrar na tela, texto à direita; pilares em três colunas abaixo. */
:root{
  --tinta:#0d131a; --navy:#031c37; --aco:#304557; --prata:#d1d3d4; --dourado:#f0b855; --branco:#ffffff;
  --linha:rgba(209,211,212,.16); --apoio:rgba(209,211,212,.72);
  --display:'Gotham','Montserrat',system-ui,sans-serif;
  --ease:cubic-bezier(.16,1,.3,1);
  color-scheme:dark;
}
html,body{background:var(--tinta);overflow-x:clip}
body{color:var(--branco);font-family:var(--display);font-weight:300;padding-inline:clamp(16px,5vw,72px);padding-block:0}
.minerva{max-width:1180px;margin:0 auto;padding-block:clamp(56px,9vw,120px)}
.palco::before{content:"";position:absolute;inset:-25%;background:radial-gradient(closest-side,rgba(15,58,99,.6),rgba(3,28,55,0));pointer-events:none}
.topo{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:clamp(24px,5vw,72px);align-items:center}
.palco{position:relative;aspect-ratio:1;max-width:100%}
.palco canvas{width:100%;height:100%;display:block;mix-blend-mode:screen}
.eyebrow{font-weight:500;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--dourado);margin:0 0 20px}
h2{font-weight:900;font-size:clamp(36px,5.2vw,60px);line-height:1.04;letter-spacing:-.025em;margin:0;text-wrap:balance}
h2 em{font-style:normal;color:var(--dourado)}
.lead{font-size:clamp(17px,1.6vw,20px);line-height:1.6;color:var(--prata);max-width:34em;margin:24px 0 0}
.nome{margin:36px 0 0;padding:24px 0 0;border-top:1px solid var(--linha);display:grid;gap:10px;max-width:36em}
.nome h3{font-weight:500;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--prata);margin:0}
.nome p{margin:0;font-size:16px;line-height:1.65;color:var(--apoio)}
.nome b{font-weight:500;color:var(--dourado)}
.pilares{list-style:none;margin:clamp(48px,7vw,88px) 0 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--linha)}
.pilares li{padding:32px 32px 8px 0;display:grid;gap:12px;align-content:start;min-width:0}
.pilares li+li{padding-left:32px;border-left:1px solid var(--linha)}
.pilares h4{margin:0;font-weight:900;font-size:24px;letter-spacing:-.015em}
.pilares h4 span{color:var(--dourado)}
.pilares p{margin:0;font-size:16px;line-height:1.65;color:var(--apoio)}
.fecho{margin:clamp(40px,6vw,72px) 0 0;display:flex;flex-wrap:wrap;gap:16px 32px;align-items:baseline;justify-content:space-between;
  padding:28px 0 0;border-top:1px solid var(--linha)}
.fecho p{margin:0;font-size:18px;line-height:1.5;color:var(--prata);max-width:40em}
.fecho strong{font-weight:500;color:var(--branco)}
.de-novo{font:500 12px/1 var(--display);letter-spacing:.14em;text-transform:uppercase;color:var(--dourado);background:none;
  border:1px solid rgba(240,184,85,.5);border-radius:4px;padding:12px 16px;cursor:pointer;transition:background .2s var(--ease)}
.de-novo:hover{background:rgba(240,184,85,.1)}
.de-novo:focus-visible{outline:2px solid var(--dourado);outline-offset:3px}
.sobe{animation:sobe .36s var(--ease) both}
.sobe:nth-child(2){animation-delay:.09s}.sobe:nth-child(3){animation-delay:.18s}
@keyframes sobe{from{transform:translateY(16px);opacity:.001}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.sobe{animation:none}}
@media (max-width:760px){
  .topo{grid-template-columns:1fr}
  .palco{width:min(78vw,380px);margin:0 auto}
  .pilares{grid-template-columns:1fr}
  .pilares li,.pilares li+li{padding:24px 0;border-left:0}
  .pilares li+li{border-top:1px solid var(--linha)}
}
</style>

<section class="minerva" aria-labelledby="minerva-titulo">
  <div class="topo">
    <div class="palco"><canvas id="orbe" width="560" height="560" role="img" aria-label="A orbe de Minerva se abrindo em fitas de metal e luz dourada"></canvas></div>
    <div>
      <p class="eyebrow">Guardiã da marca</p>
      <h2 id="minerva-titulo">Antes de chegar até você, tudo passa <em>por Minerva.</em></h2>
      <p class="lead">Minerva é a inteligência que a EJUP criou para guardar a própria marca. Antes de qualquer conteúdo existir em público, ela confere qualidade, segurança e coerência com a escola.</p>
      <div class="nome">
        <h3>Por que Minerva</h3>
        <p>Minerva é o nome romano de Atena, deusa da sabedoria. Na tragédia de Ésquilo, Atena instala um tribunal e desempata o julgamento de Orestes. Vem daí o <b>voto de Minerva</b>: a decisão que pesa quando os lados se equilibram.</p>
      </div>
    </div>
  </div>

  <ul class="pilares">
    <li class="sobe"><h4>Ela guarda <span>o critério</span></h4><p>Palavra, tom, cor, tipografia e imagem passam pela régua da marca. O que destoa volta para ajuste. A EJUP não grita. A EJUP tem peso.</p></li>
    <li class="sobe"><h4>Ela guarda <span>a fonte</span></h4><p>Número, citação, decisão e nome próprio só entram com origem rastreada, sustentada por fontes de naturezas diferentes. Afirmação sem fonte devolve o conteúdo.</p></li>
    <li class="sobe"><h4>Ela guarda <span>a confiança</span></h4><p>Ética profissional da advocacia, dados pessoais tratados conforme a LGPD, direito de imagem e autoria verificados. Nenhuma promessa de resultado, nenhuma urgência fabricada.</p></li>
  </ul>

  <div class="fecho">
    <p>Minerva confere, aponta e devolve. <strong>Quem decide é sempre uma pessoa da escola.</strong></p>
    <button class="de-novo" id="de-novo" type="button">Ver a orbe abrir</button>
  </div>
</section>

<script>
(function(){
  const fontes = __QUADROS__;
  const cv = document.getElementById('orbe'), cx = cv.getContext('2d');
  const imgs = fontes.map(s => { const i = new Image(); i.src = s; return i; });
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ultimo = imgs.length - 1;
  let rodando = false;
  function pinta(k){ const i = imgs[k]; if (i.complete) { cx.clearRect(0,0,cv.width,cv.height); cx.drawImage(i,0,0,cv.width,cv.height); } else i.onload = () => pinta(k); }
  function abre(){
    if (rodando) return; rodando = true;
    const dur = 2600, t0 = performance.now();
    function passo(t){
      const p = Math.min(1,(t - t0)/dur), e = 1 - Math.pow(1 - p, 3);
      pinta(Math.round(e * ultimo));
      if (p < 1) requestAnimationFrame(passo); else rodando = false;
    }
    requestAnimationFrame(passo);
  }
  if (quieto) { pinta(ultimo); }
  else {
    pinta(0);
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { abre(); io.disconnect(); } });
    }, {threshold:.45}) : null;
    if (io) io.observe(cv); else abre();
  }
  document.getElementById('de-novo').addEventListener('click', () => { if (quieto) { pinta(ultimo); return; } pinta(0); setTimeout(abre, 120); });
})();
</script>
"""


def main():
    q = quadros()
    html = HTML.replace("__FONTES__", fontes()).replace("__QUADROS__", "[" + ",".join(f'"{s}"' for s in q) + "]")
    (OUT / "site").mkdir(exist_ok=True)
    p = OUT / "site" / "minerva-guardia.html"
    p.write_text(html, encoding="utf-8")
    print(p, round(p.stat().st_size / 1e6, 2), "MB")


if __name__ == "__main__":
    main()
