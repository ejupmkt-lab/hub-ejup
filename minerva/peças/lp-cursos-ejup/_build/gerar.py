#!/usr/bin/env python3
"""Gera os artboards .dc.html da LP da EJUP (desktop e mobile).

O texto e a estrutura vivem em SECOES: as duas larguras saem da mesma fonte,
para não divergirem. Os valores de cor, raio, sombra e tipografia vêm do
design system em skills/ejup-design (tokens/ + components/core), não de
memória.

Fatos que a EJUP ainda não me passou entram entre colchetes, visíveis, para
serem preenchidos — não são inventados.
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
SKILL = HERE.parents[2] / "skills" / "ejup-design"
FONTS = SKILL / "assets" / "fonts"

# ---- tokens (valores exatos do design system) ----
NAVY, INK, STEEL = "#031c37", "#0d131a", "#304557"
GRAPHITE, GRAY, SILVER = "#414042", "#5f6062", "#d1d3d4"
BRONZE, GOLD = "#9b6b26", "#f0b855"
SH_GOLD = "0 6px 20px rgba(240,184,85,0.35)"
SH_MD = "0 4px 12px rgba(3,28,55,0.10), 0 2px 4px rgba(3,28,55,0.06)"

FACES = [("Gotham-Light.otf", 300), ("Gotham-Book.otf", 400),
         ("Gotham-Medium.otf", 500), ("Gotham-Black.otf", 900)]


def fontes() -> str:
    out = []
    for nome, peso in FACES:
        b64 = base64.b64encode((FONTS / nome).read_bytes()).decode()
        out.append("@font-face{font-family:'Gotham';font-style:normal;"
                   f"font-weight:{peso};"
                   f"src:url(data:font/otf;base64,{b64}) format('opentype');}}")
    return "\n".join(out)


class Bp:
    """Um conjunto de medidas por largura. Só números mudam entre as duas."""
    def __init__(self, w, pad, h1, h2, corpo, lead, olho, gap):
        self.w, self.pad, self.h1, self.h2 = w, pad, h1, h2
        self.corpo, self.lead, self.olho, self.gap = corpo, lead, olho, gap


DESKTOP = Bp(1440, 160, 60, 44, 18, 22, 12, 96)
MOBILE = Bp(390, 24, 34, 27, 16, 18, 11, 56)


def olho(b, txt, cor):
    return (f'<p style="margin:0 0 18px;font-size:{b.olho}px;font-weight:500;'
            f'letter-spacing:0.14em;text-transform:uppercase;color:{cor}">{txt}</p>')


def h2(b, txt, cor=NAVY):
    return (f'<h2 style="margin:0;font-size:{b.h2}px;font-weight:900;line-height:1.08;'
            f'letter-spacing:-0.02em;color:{cor};text-wrap:balance">{txt}</h2>')


def p(b, txt, cor=GRAY, mt=20, mx=760):
    return (f'<p style="margin:{mt}px 0 0;font-size:{b.corpo}px;font-weight:300;'
            f'line-height:1.62;color:{cor};max-width:{mx}px;text-wrap:pretty">{txt}</p>')


def secao(b, dentro, fundo, pt=None):
    pt = pt or b.gap
    return (f'<section style="background:{fundo};padding:{pt}px {b.pad}px">'
            f'<div style="max-width:1120px;margin:0 auto">{dentro}</div></section>')


def botao(b, txt, tipo="gold"):
    """Botão do design system: raio 4px, peso 500, tracking .02em."""
    if tipo == "gold":
        pele = f"background:{GOLD};color:{NAVY};border:1px solid {GOLD};box-shadow:{SH_GOLD}"
    else:
        pele = ("background:transparent;color:#fff;"
                "border:1px solid rgba(255,255,255,0.34)")
    fs = 16 if b.w > 800 else 15
    return (f'<span style="display:inline-flex;align-items:center;justify-content:center;'
            f'padding:16px 32px;border-radius:4px;font-size:{fs}px;font-weight:500;'
            f'letter-spacing:0.02em;{pele}">{txt}</span>')


# ============================================================
#  SEÇÕES — o conteúdo da página
# ============================================================

def cabecalho(b):
    nav = ""
    if b.w > 800:
        itens = "".join(
            f'<span style="font-size:14px;font-weight:300;color:rgba(255,255,255,0.8)">{t}</span>'
            for t in ("Programas", "Professores", "EJUPcast"))
        nav = f'<div style="display:flex;gap:36px;align-items:center">{itens}</div>'
    cta = (f'<span style="display:inline-flex;padding:10px 20px;border-radius:4px;'
           f'background:{GOLD};color:{NAVY};font-size:13px;font-weight:500;'
           f'letter-spacing:0.02em">Inscrever-se</span>')
    return (f'<header style="background:{NAVY};padding:20px {b.pad}px;display:flex;'
            f'align-items:center;justify-content:space-between;gap:24px">'
            f'<img src="ejup-horizontal-white.svg" alt="EJUP" style="height:30px;width:auto">'
            f'{nav}{cta}</header>')


def heroi(b):
    marca = ""
    if b.w > 800:
        marca = ('<img src="ejup-symbol-gold.svg" alt="" aria-hidden="true" '
                 'style="position:absolute;right:-130px;top:50%;transform:translateY(-50%);'
                 'height:560px;width:auto;opacity:0.10">')
    ctas = (f'<div style="display:flex;gap:14px;margin-top:40px;flex-wrap:wrap">'
            f'{botao(b, "Fazer minha inscrição")}'
            f'{botao(b, "Ver o programa completo", "sec")}</div>')
    dados = "".join(
        f'<div><div style="font-size:{34 if b.w>800 else 26}px;font-weight:900;'
        f'color:{GOLD};line-height:1">{n}</div>'
        f'<div style="font-size:13px;font-weight:300;color:rgba(255,255,255,0.66);'
        f'margin-top:8px;max-width:160px">{l}</div></div>'
        for n, l in (("[Nº]", "horas de formação"),
                     ("[Nº]", "professores de referência"),
                     ("[Nº]", "módulos")))
    return (f'<section style="position:relative;overflow:hidden;'
            f'background:linear-gradient(160deg,{NAVY} 0%,{INK} 100%);'
            f'padding:{b.gap + 24}px {b.pad}px {b.gap + 16}px">{marca}'
            f'<div style="position:relative;max-width:1120px;margin:0 auto">'
            f'{olho(b, "EJUP · Formação", GOLD)}'
            f'<h1 style="margin:0;font-size:{b.h1}px;font-weight:900;line-height:1.04;'
            f'letter-spacing:-0.025em;color:#fff;max-width:820px;text-wrap:balance">'
            f'Formação jurídica para quem recusa o atalho.</h1>'
            f'<p style="margin:26px 0 0;font-size:{b.lead}px;font-weight:300;'
            f'line-height:1.6;color:rgba(255,255,255,0.78);max-width:620px">'
            f'<strong style="font-weight:500;color:#fff">[NOME DO PROGRAMA]</strong> — '
            f'[CARGA HORÁRIA] de estudo denso, conduzido por quem tem notório saber '
            f'no que ensina. Turmas formadas por seleção. Início em [DATA].</p>'
            f'{ctas}'
            f'<div style="display:flex;gap:{56 if b.w>800 else 28}px;margin-top:{b.gap - 24}px;'
            f'flex-wrap:wrap">{dados}</div></div></section>')


def tensao(b):
    return secao(b,
        olho(b, "Por que esta formação existe", BRONZE) +
        h2(b, "Criaram um mercado onde estudar<br>profundamente parece excesso.") +
        p(b, "Conteúdo jurídico nunca foi tão abundante e tão raso. Cursos que prometem "
             "domínio em semanas. Resumo que substitui a fonte. Autoridade medida por "
             "exposição. O jurista sério acaba preso a uma escolha falsa: gritar para ser "
             "visto ou desaparecer sendo profundo.") +
        f'<p style="margin:32px 0 0;padding-top:28px;border-top:1px solid {SILVER};'
        f'font-size:{b.lead}px;font-weight:500;line-height:1.5;color:{NAVY};'
        f'max-width:720px">A EJUP existe para ocupar o espaço que a pressa abandonou.</p>',
        "#ffffff")


PILARES = [
    ("Direito", "A base jurídica: norma, doutrina, jurisprudência e controvérsia "
                "examinadas por dentro. Sem ela, os outros dois viram negócio com "
                "verniz jurídico."),
    ("Negócios e inovação", "O Direito operando por fora: dentro de mercados, empresas "
                            "e políticas públicas, onde a decisão encontra orçamento, "
                            "tecnologia, gestão e regulação."),
    ("Power skills", "O que decide o alcance real de um jurista: negociação, mediação, "
                     "posicionamento e construção de relacionamento. Quase nunca "
                     "ensinado na graduação."),
]


def pilares(b):
    col = "1fr" if b.w < 800 else "repeat(3, minmax(0, 1fr))"
    cards = "".join(
        f'<div style="background:rgba(255,255,255,0.05);'
        f'border:1px solid rgba(209,211,212,0.16);border-radius:8px;padding:32px 28px">'
        f'<div style="font-size:12px;font-weight:500;letter-spacing:0.14em;'
        f'color:{GOLD}">0{i}</div>'
        f'<h3 style="margin:14px 0 0;font-size:{22 if b.w>800 else 19}px;font-weight:700;'
        f'color:#fff;line-height:1.2">{t}</h3>'
        f'<p style="margin:14px 0 0;font-size:15px;font-weight:300;line-height:1.6;'
        f'color:rgba(255,255,255,0.72)">{d}</p></div>'
        for i, (t, d) in enumerate(PILARES, 1))
    return secao(b,
        olho(b, "Como a formação se organiza", GOLD) +
        h2(b, "Três pilares indissociáveis.", "#fff") +
        p(b, "Nenhum sustenta sozinho. É a articulação entre eles que separa quem sabe "
             "de quem é procurado por saber.", "rgba(255,255,255,0.74)") +
        f'<div style="display:grid;grid-template-columns:{col};gap:20px;'
        f'margin-top:44px">{cards}</div>',
        STEEL)


JORNADA = [
    ("Desalinhamento", "Você percebe que o repertório que tinha já não dá conta do "
                       "ambiente em que atua."),
    ("Elevação de padrão", "A régua sobe. O critério deixa de ser quantidade de "
                           "técnica e passa a ser qualidade de julgamento."),
    ("Travessia", "O trabalho é refinar critérios, não acumular atalhos. É a parte "
                  "que exige tempo e não tem como abreviar."),
    ("Legitimidade", "O retorno não é ostentação: é ser procurado pela profundidade "
                     "que você passou a ter."),
]


def percurso(b):
    linhas = "".join(
        f'<div style="display:flex;gap:{28 if b.w>800 else 16}px;padding:26px 0;'
        f'border-top:1px solid {SILVER}">'
        f'<div style="flex:none;width:{40 if b.w>800 else 30}px;font-size:{b.corpo}px;'
        f'font-weight:900;color:{BRONZE};line-height:1.4">0{i}</div>'
        f'<div><h3 style="margin:0;font-size:{20 if b.w>800 else 18}px;font-weight:700;'
        f'color:{NAVY}">{t}</h3>'
        f'<p style="margin:8px 0 0;font-size:{b.corpo}px;font-weight:300;line-height:1.6;'
        f'color:{GRAY};max-width:680px">{d}</p></div></div>'
        for i, (t, d) in enumerate(JORNADA, 1))
    return secao(b,
        olho(b, "O percurso", BRONZE) +
        h2(b, "Não é um curso que acaba.<br>É um patamar que fica.") +
        p(b, "[Nº] módulos, [CARGA HORÁRIA], distribuídos em [FORMATO: encontros ao vivo / "
             "gravados / presenciais em Natal].", GRAPHITE) +
        f'<div style="margin-top:40px">{linhas}</div>',
        "#ffffff")


def professores(b):
    col = "1fr" if b.w < 800 else "repeat(3, minmax(0, 1fr))"
    cards = "".join(
        f'<div style="background:#fff;border:1px solid {SILVER};border-radius:8px;'
        f'padding:28px;box-shadow:{SH_MD}">'
        f'<div style="width:52px;height:52px;border-radius:999px;background:{STEEL};'
        f'display:flex;align-items:center;justify-content:center;color:#fff;'
        f'font-size:15px;font-weight:700">[__]</div>'
        f'<h3 style="margin:18px 0 0;font-size:18px;font-weight:700;color:{NAVY}">'
        f'[NOME DO PROFESSOR {i}]</h3>'
        f'<p style="margin:6px 0 0;font-size:14px;font-weight:300;color:{GRAY};'
        f'line-height:1.55">[TITULAÇÃO E INSTITUIÇÃO]<br>[O QUE ENSINA NO PROGRAMA]</p>'
        f'</div>' for i in (1, 2, 3))
    return secao(b,
        olho(b, "Quem ensina", BRONZE) +
        h2(b, "Notório saber, em sala.") +
        p(b, "A EJUP não convida por audiência. Convida por domínio demonstrado no "
             "campo em que a pessoa vai ensinar.", GRAPHITE) +
        f'<div style="display:grid;grid-template-columns:{col};gap:20px;'
        f'margin-top:40px">{cards}</div>',
        "#f7f6f4")


SIM = ["Você trata aprendizado como percurso cumulativo, não como consumo.",
       "Você quer critério para decidir, não um roteiro para repetir.",
       "Você aceita que profundidade custa tempo e escolhe pagar esse preço."]
NAO = ["Você procura domínio de um tema em poucas semanas.",
       "Você quer um método replicável, com resultado garantido.",
       "Você busca visibilidade antes de repertório."]


def selecao(b):
    col = "1fr" if b.w < 800 else "repeat(2, minmax(0, 1fr))"

    def lista(titulo, itens, cor, marca):
        li = "".join(
            f'<li style="display:flex;gap:12px;padding:14px 0;'
            f'border-top:1px solid rgba(255,255,255,0.14);font-size:{b.corpo}px;'
            f'font-weight:300;line-height:1.55;color:rgba(255,255,255,0.82)">'
            f'<span style="color:{cor};flex:none">{marca}</span><span>{t}</span></li>'
            for t in itens)
        return (f'<div><h3 style="margin:0 0 8px;font-size:{18 if b.w>800 else 16}px;'
                f'font-weight:700;color:#fff">{titulo}</h3>'
                f'<ul style="margin:0;padding:0;list-style:none">{li}</ul></div>')

    return secao(b,
        olho(b, "Seleção", GOLD) +
        h2(b, "Esta formação não é para todo mundo.", "#fff") +
        f'<div style="display:grid;grid-template-columns:{col};gap:{40 if b.w>800 else 28}px;'
        f'margin-top:40px">'
        f'{lista("É para você, se", SIM, GOLD, "—")}'
        f'{lista("Não é para você, se", NAO, SILVER, "—")}</div>'
        f'<p style="margin:40px 0 0;font-size:{b.lead}px;font-weight:500;'
        f'line-height:1.5;color:{GOLD};max-width:640px">'
        f'Se isso parece exigente demais, a EJUP não é para você.</p>',
        NAVY)


OFERTA_LEAD = ("As vagas são limitadas porque a condução é próxima: o professor "
               "acompanha quem está na sala. A inscrição começa por uma conversa "
               "com a coordenação.")


def oferta(b):
    linhas = "".join(
        f'<div style="display:flex;justify-content:space-between;gap:16px;padding:16px 0;'
        f'border-top:1px solid {SILVER};font-size:{b.corpo}px">'
        f'<span style="font-weight:300;color:{GRAY}">{k}</span>'
        f'<span style="font-weight:500;color:{NAVY};text-align:right">{v}</span></div>'
        for k, v in (("Programa", "[NOME DO PROGRAMA]"),
                     ("Início", "[DATA]"),
                     ("Carga horária", "[Nº] horas"),
                     ("Formato", "[ONLINE AO VIVO / PRESENCIAL / HÍBRIDO]"),
                     ("Investimento", "[VALOR]")))
    return secao(b,
        f'<div style="display:{"grid" if b.w>800 else "block"};'
        f'grid-template-columns:1fr 1fr;gap:64px;align-items:center">'
        f'<div>{olho(b, "Inscrições", BRONZE)}'
        f'{h2(b, "Uma turma por vez.<br>Formada por seleção.")}'
        f'{p(b, OFERTA_LEAD, GRAPHITE)}'
        f'<div style="margin-top:32px">{botao(b, "Fazer minha inscrição")}</div></div>'
        f'<div style="background:#fff;border:1px solid {SILVER};border-radius:12px;'
        f'padding:{36 if b.w>800 else 26}px;box-shadow:{SH_MD};'
        f'margin-top:{0 if b.w>800 else 36}px">{linhas}</div></div>',
        "#f7f6f4")


def rodape(b):
    col = "1fr" if b.w < 800 else "1.4fr 1fr 1fr"
    return (f'<footer style="background:{INK};padding:{b.gap - 24}px {b.pad}px 48px">'
            f'<div style="max-width:1120px;margin:0 auto">'
            f'<div style="display:grid;grid-template-columns:{col};gap:36px">'
            f'<div><img src="ejup-horizontal-white.svg" alt="EJUP" '
            f'style="height:30px;width:auto">'
            f'<p style="margin:20px 0 0;font-size:15px;font-weight:300;line-height:1.6;'
            f'color:rgba(255,255,255,0.6);max-width:340px">'
            f'Alma clássica, repertório contemporâneo.</p></div>'
            f'<div><p style="margin:0;font-size:12px;font-weight:500;letter-spacing:0.14em;'
            f'text-transform:uppercase;color:{GOLD}">Contato</p>'
            f'<p style="margin:14px 0 0;font-size:15px;font-weight:300;line-height:1.7;'
            f'color:rgba(255,255,255,0.7)">85 9 9271.4050<br>contato@ejup.com.br</p></div>'
            f'<div><p style="margin:0;font-size:12px;font-weight:500;letter-spacing:0.14em;'
            f'text-transform:uppercase;color:{GOLD}">Endereço</p>'
            f'<p style="margin:14px 0 0;font-size:15px;font-weight:300;line-height:1.7;'
            f'color:rgba(255,255,255,0.7)">Rua da Saudade, 1028<br>'
            f'Lagoa Nova — Natal/RN</p></div></div></div></footer>')


def pagina(b):
    return "".join(f(b) for f in (cabecalho, heroi, tensao, pilares, percurso,
                                  professores, selecao, oferta, rodape))


def artboard(b) -> str:
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
{fontes()}
    body {{ margin:0; background:#ffffff;
           font-family:'Gotham','Montserrat',system-ui,sans-serif;
           -webkit-font-smoothing:antialiased; }}
    a {{ color:{BRONZE}; text-decoration:none; }}
    a:hover {{ color:{NAVY}; }}
    * {{ box-sizing:border-box; }}
  </style>
</helmet>
<div style="width:{b.w}px;background:#ffffff">
{pagina(b)}
</div>
</x-dc>
</body>
</html>
"""


def main() -> None:
    (OUT / "Main.dc.html").write_text(artboard(DESKTOP), encoding="utf-8")
    (OUT / "Mobile.dc.html").write_text(artboard(MOBILE), encoding="utf-8")
    for logo in ("ejup-horizontal-white.svg", "ejup-symbol-gold.svg"):
        (OUT / logo).write_bytes((SKILL / "assets" / "logo" / logo).read_bytes())
    for f in ("Main.dc.html", "Mobile.dc.html"):
        print(f"{f}: {(OUT / f).stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    main()
