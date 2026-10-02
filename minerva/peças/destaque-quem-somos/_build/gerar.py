#!/usr/bin/env python3
"""Monta destaque.html: 6 telas 1080x1920 do destaque 'Quem somos' (Instagram)."""
import pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()


def svg(nome, cor=None):
    s = (DS / "logo" / nome).read_text()
    if cor:
        s = re.sub(r'fill="#[0-9a-fA-F]{3,6}"', f'fill="{cor}"', s)
    return re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', s, 1)


LOGO_BRANCO = svg("ejup-horizontal-white.svg")
LOGO_NAVY = svg("ejup-horizontal-navy.svg")
SIMBOLO_OURO = svg("ejup-symbol-gold.svg")


def arcos(cx, base, larguras, cor, op, sw=3):
    p = []
    for w in larguras:
        r = w / 2
        p.append(f'<path d="M{cx - r},{base} V{base - r * 1.15} A{r},{r} 0 0 1 {cx + r},{base - r * 1.15} V{base}" '
                 f'fill="none" stroke="{cor}" stroke-opacity="{op}" stroke-width="{sw}"/>')
    return "".join(p)


def tela(classe, conteudo, fundo_svg="", logo=LOGO_BRANCO):
    return f'''<section class="s {classe}">
  {fundo_svg}
  <div class="conteudo">{conteudo}</div>
  <div class="logo">{logo}</div>
</section>'''


# 1. abertura
t1 = tela("navy", f'''
  <div class="simbolo">{SIMBOLO_OURO}</div>
  <h1 class="slogan">Alma clássica,<br><em>repertório contemporâneo.</em></h1>
''', f'<svg class="bg" viewBox="0 0 1080 1920">{arcos(540, 1920, [1500, 1250, 1000, 750], "#d1d3d4", 0.07)}</svg>')

# 2. quem somos
t2 = tela("ink", '''
  <div class="fio"></div>
  <p class="corpo">A EJUP é uma escola jurídica dedicada à <em>educação jurídica estratégica</em> e à formação de líderes.</p>
  <p class="apoio">Notório saber jurídico, rigor e tradição, em formato digital de alto nível.</p>
''', f'<svg class="bg" viewBox="0 0 1080 1920">{arcos(1080, 1560, [900, 680, 460], "#d1d3d4", 0.10)}</svg>')

# 3. missão (fundo claro)
t3 = tela("papel", '''
  <p class="corpo">Transformamos o <em>notório saber jurídico</em> em soluções educacionais digitais de alto nível.</p>
  <div class="ponte">
    <svg viewBox="0 0 800 230">
      <path d="M60,190 V150 A340,110 0 0 1 740,150 V190" fill="none" stroke="#9b6b26" stroke-width="5"/>
      <line x1="30" y1="190" x2="770" y2="190" stroke="#031c37" stroke-width="3"/>
      <circle cx="60" cy="150" r="11" fill="#9b6b26"/><circle cx="740" cy="150" r="11" fill="#9b6b26"/>
    </svg>
    <div class="ponte-r"><span>Experts</span><span>Mercado</span></div>
  </div>
  <p class="apoio">Conectamos experts ao mercado e capacitamos profissionais para a excelência na prática do Direito.</p>
''', logo=LOGO_NAVY)

# 4. fundamentos
t4 = tela("navy", '''
  <div class="linha"><span class="a">Tradição</span><span class="b">sem mofo</span></div>
  <div class="linha"><span class="a">Inovação</span><span class="b">sem vulgarização</span></div>
  <div class="linha"><span class="a">Digital</span><span class="b">sem superficialidade</span></div>
''')

# 5. para quem
t5 = tela("steel", '''
  <p class="corpo">Para o jurista que trata o aprendizado como <em>percurso</em> e respeita a densidade do estudo.</p>
  <div class="degraus"><i></i><i></i><i></i><i class="top"></i></div>
  <p class="corte">Se isso parece exigente demais, a EJUP não é para você.</p>
''')

# 6. contato
t6 = tela("ink", '''
  <div class="contato">
    <div class="c"><b>Site</b><span>ejup.com.br</span></div>
    <div class="c"><b>E-mail</b><span>contato@ejup.com.br</span></div>
    <div class="c"><b>WhatsApp</b><span class="ouro">85 9 9271.4050</span></div>
    <div class="c"><b>Endereço</b><span class="peq">Rua da Saudade, 1028<br>Lagoa Nova, Natal/RN</span></div>
    <div class="c"><b>Instagram</b><span>@ejup.oficial</span></div>
  </div>
''')

CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
:root{{--ink:#0d131a;--navy:#031c37;--steel:#304557;--silver:#d1d3d4;--bronze:#9b6b26;--gold:#f0b855;--graphite:#414042}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#222;font-family:Gotham,Montserrat,system-ui,sans-serif;-webkit-font-smoothing:antialiased}}
.s{{position:relative;width:1080px;height:1920px;margin:0 0 40px;overflow:hidden;color:#fff}}
.navy{{background:var(--navy)}} .ink{{background:var(--ink)}} .steel{{background:var(--steel)}}
.papel{{background:#fff;color:var(--graphite)}}
.bg{{position:absolute;inset:0;width:100%;height:100%}}
.conteudo{{position:absolute;left:110px;right:110px;top:300px;bottom:380px;display:flex;flex-direction:column;justify-content:center}}
.logo{{position:absolute;left:0;right:0;bottom:230px;display:flex;justify-content:center}}
.logo svg{{height:64px;width:auto}}
em{{font-style:normal;color:var(--gold)}}
.papel em{{color:var(--bronze)}}
p{{text-align:left;hyphens:manual}}
.corpo{{font-weight:300;font-size:82px;line-height:1.22;letter-spacing:-.01em}}
.corpo em{{font-weight:500}}
.apoio{{font-weight:300;font-size:44px;line-height:1.45;color:var(--silver);margin-top:72px}}
.papel .apoio{{color:var(--graphite)}}
.fio{{width:96px;height:4px;background:var(--gold);margin-bottom:64px}}
/* 1 */
.simbolo{{width:360px;margin:0 auto 100px}}
.slogan{{font-weight:900;font-size:104px;line-height:1.08;letter-spacing:-.025em;text-align:center}}
.slogan em{{display:inline-block;margin-top:10px}}
/* 3 */
.papel .corpo{{color:var(--navy)}}
.ponte{{margin:70px 0 10px}} .ponte svg{{width:100%;height:auto;display:block}}
.ponte-r{{display:flex;justify-content:space-between;padding:0 10px;margin-top:18px}}
.ponte-r span{{font-weight:500;font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:var(--navy)}}
.papel .apoio{{margin-top:56px}}
/* 4 */
.linha{{padding:62px 0;border-top:2px solid rgba(209,211,212,.25)}}
.linha:last-child{{border-bottom:2px solid rgba(209,211,212,.25)}}
.linha .a{{display:block;font-weight:900;font-size:128px;line-height:1.02;letter-spacing:-.025em}}
.linha .b{{display:block;font-weight:300;font-size:60px;margin-top:14px;color:var(--gold)}}
/* 5 */
.steel .corpo{{font-size:72px}}
.degraus{{display:flex;align-items:flex-end;gap:16px;height:210px;margin:72px 0}}
.degraus i{{display:block;flex:1;background:rgba(209,211,212,.28)}}
.degraus i:nth-child(1){{height:25%}} .degraus i:nth-child(2){{height:50%}} .degraus i:nth-child(3){{height:75%}}
.degraus i.top{{height:100%;background:var(--gold)}}
.corte{{font-weight:500;font-size:46px;line-height:1.3}}
/* 6 */
.contato{{display:flex;flex-direction:column}}
.c{{padding:38px 0;border-top:2px solid rgba(209,211,212,.22)}}
.c:last-child{{border-bottom:2px solid rgba(209,211,212,.22)}}
.c b{{display:block;font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:var(--silver);margin-bottom:14px}}
.c span{{display:block;font-weight:300;font-size:56px;line-height:1.2}}
.c .peq{{font-size:44px}} .c .ouro{{color:var(--gold);font-weight:500}}
'''

html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Destaque Quem somos</title>
<style>{CSS}</style></head><body>
{t1}{t2}{t3}{t4}{t5}{t6}
</body></html>'''
(OUT / "destaque.html").write_text(html)
print("destaque.html gerado")
