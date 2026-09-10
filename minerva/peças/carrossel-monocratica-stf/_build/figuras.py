#!/usr/bin/env python3
"""Diagramas e o placar do caso.

Nada aqui decora. Cada figura mostra um mecanismo do argumento, e o placar
mostra em que ponto da história a tela está.
"""

G, BR, PRATA, ACO, NAVY = "#f0b855", "#9b6b26", "#d1d3d4", "#304557", "#031c37"
LARG = 920


def _t(x, y, txt, tam=20, peso=500, cor="#fff", anc="middle", trk=".04em"):
    return (f'<text x="{x}" y="{y}" text-anchor="{anc}" fill="{cor}" '
            f'font-family="Gotham" font-size="{tam}" font-weight="{peso}" '
            f'letter-spacing="{trk}">{txt}</text>')


def _svg(partes, alt, larg=LARG):
    return (f'<svg viewBox="0 0 {larg} {alt}" '
            f'xmlns="http://www.w3.org/2000/svg">{"".join(partes)}</svg>')


def _cx(claro):
    """Cores conforme o fundo."""
    return {"ac": BR if claro else G,
            "tx": NAVY if claro else "#fff",
            "ap": "#5f6062" if claro else PRATA,
            "li": "rgba(3,28,55,.22)" if claro else "rgba(255,255,255,.26)"}


# ----------------------------------------------------------------- placar
# O mesmo objeto em todas as telas, na mesma posição, mudando de estado. É ele
# que liga uma tela à outra: o leitor sempre sabe em que ponto do caso está.
ATORES = ["MENDONÇA", "DINO", "PRESIDÊNCIA", "PLENÁRIO"]


def placar(estados, claro=False) -> str:
    """estados: uma letra por ator.
    '.' inerte · '+' agiu · 'x' decisão suspensa · '>' é a vez dele · '?' à espera
    """
    c = _cx(claro)
    p, larg, gap = [], 218, 16
    for i, (nome, e) in enumerate(zip(ATORES, estados)):
        x = i * (larg + gap)
        meio = x + larg / 2
        # trilho
        p.append(f'<rect x="{x}" y="26" width="{larg}" height="3" '
                 f'fill="{c["ac"] if e in "+x>" else c["li"]}"/>')
        # marcador
        if e == "+":
            p.append(f'<circle cx="{meio}" cy="27" r="11" fill="{c["ac"]}"/>')
        elif e == "x":
            p.append(f'<circle cx="{meio}" cy="27" r="11" fill="none" '
                     f'stroke="{c["ac"]}" stroke-width="3"/>'
                     f'<path d="M{meio-6} 21l12 12M{meio+6} 21l-12 12" '
                     f'stroke="{c["ac"]}" stroke-width="3"/>')
        elif e == ">":
            p.append(f'<circle cx="{meio}" cy="27" r="13" fill="{c["ac"]}"/>'
                     f'<circle cx="{meio}" cy="27" r="21" fill="none" '
                     f'stroke="{c["ac"]}" stroke-opacity=".45" stroke-width="2"/>')
        elif e == "?":
            p.append(f'<circle cx="{meio}" cy="27" r="11" fill="none" '
                     f'stroke="{c["ac"]}" stroke-width="2.5" '
                     f'stroke-dasharray="5 5"/>')
        else:
            p.append(f'<circle cx="{meio}" cy="27" r="7" fill="none" '
                     f'stroke="{c["li"]}" stroke-width="2"/>')
        p.append(_t(meio, 72, nome, 18, 500,
                    c["ac"] if e in "+x>" else c["ap"], trk=".16em"))
    return _svg(p, 84)


# --------------------------------------------------------------- diagramas
def linha_do_tempo(claro=False) -> str:
    """Quatro atos em pouco mais de dois dias, na ordem.

    Os rótulos alternam acima e abaixo da linha: SVG não quebra texto sozinho,
    e em quatro marcos lado a lado eles se atropelam se ficarem todos embaixo.
    """
    c = _cx(claro)
    atos = [("Afastamento", "monocrática"),
            ("Reintegração", "monocrática"),
            ("Suspensão das duas", "Presidência"),
            ("Plenário", "15 de setembro")]
    eixo = 120
    p = [f'<path d="M40 {eixo}H{LARG-40}" stroke="{c["li"]}" stroke-width="2"/>']
    passo = (LARG - 80) / (len(atos) - 1)
    for i, (t1, t2) in enumerate(atos):
        x = 40 + i * passo
        ultimo = i == len(atos) - 1
        if ultimo:
            p.append(f'<circle cx="{x}" cy="{eixo}" r="13" fill="none" '
                     f'stroke="{c["ac"]}" stroke-width="3" '
                     f'stroke-dasharray="6 6"/>')
        else:
            p.append(f'<circle cx="{x}" cy="{eixo}" r="13" fill="{c["ac"]}"/>')
        acima = i % 2 == 1
        y1 = eixo - 42 if acima else eixo + 48
        y2 = y1 - 28 if acima else y1 + 28
        # as pontas ancoram para dentro: centralizadas, elas passariam da
        # margem de 80px da tela e seriam cortadas
        anc = "start" if i == 0 else ("end" if ultimo else "middle")
        tx = x - 16 if i == 0 else (x + 16 if ultimo else x)
        p.append(_t(tx, y1, t1, 25, 700, c["tx"], anc=anc, trk="0"))
        p.append(_t(tx, y2, t2, 19, 300, c["ap"], anc=anc, trk="0"))
    p.append(f'<path d="M40 26h{passo*2}" stroke="{c["ac"]}" stroke-width="2" '
             f'stroke-opacity=".5"/>')
    p.append(_t(40 + passo, 16, "POUCO MAIS DE 48 HORAS", 18, 500, c["ac"],
                trk=".18em"))
    return _svg(p, 210)


def dois_trilhos(claro=False) -> str:
    """O que cada via controla, e onde cada uma termina."""
    c = _cx(claro)
    p = []
    for i, (obj, via, ref, destaque) in enumerate([
            ("A PESSOA DO MINISTRO", "Senado Federal",
             "CF, art. 52, II · crime de responsabilidade", False),
            ("O ATO DECISÓRIO", "Colegiado do próprio STF",
             "Turma ou Plenário, pela via recursal", True)]):
        y = i * 128
        cor = c["ac"] if destaque else c["ap"]
        p.append(f'<rect x="0" y="{y}" width="6" height="98" fill="{cor}"/>')
        p.append(_t(28, y + 26, obj, 19, 500, cor, anc="start", trk=".18em"))
        p.append(_t(28, y + 62, via, 30, 700, c["tx"], anc="start", trk="-.01em"))
        p.append(_t(28, y + 92, ref, 21, 300, c["ap"], anc="start", trk="0"))
    return _svg(p, 226)


def convergencia(claro=False) -> str:
    """Três caminhos, um destino: o colegiado."""
    c = _cx(claro)
    vias = ["Agravo interno", "Competência da Presidência",
            "Prevenção e distribuição"]
    p = []
    for i, v in enumerate(vias):
        y = 18 + i * 62
        p.append(f'<rect x="0" y="{y-26}" width="440" height="50" rx="4" '
                 f'fill="none" stroke="{c["li"]}" stroke-width="1.5"/>')
        p.append(_t(22, y + 6, v, 23, 500, c["tx"], anc="start", trk="0"))
        p.append(f'<path d="M448 {y}C520 {y} 540 108 610 108" fill="none" '
                 f'stroke="{c["ac"]}" stroke-width="2" stroke-opacity=".8"/>')
    p.append(f'<rect x="616" y="72" width="304" height="72" rx="4" '
             f'fill="none" stroke="{c["ac"]}" stroke-width="3"/>')
    p.append(_t(768, 116, "O COLEGIADO", 26, 500, c["ac"], trk=".1em"))
    return _svg(p, 200)


def eixo_aberto(claro=False) -> str:
    """A pergunta que fica: onde repousa o poder de decidir."""
    c = _cx(claro)
    p = [f'<path d="M60 60H{LARG-60}" stroke="{c["li"]}" stroke-width="3"/>']
    for x, rot in ((60, "DECISÃO INDIVIDUAL"), (LARG - 60, "DECISÃO CONJUNTA")):
        p.append(f'<path d="M{x} 40v40" stroke="{c["ap"]}" stroke-width="3"/>')
    p.append(_t(60, 118, "DECISÃO INDIVIDUAL", 19, 500, c["ap"], anc="start",
                trk=".16em"))
    p.append(_t(LARG - 60, 118, "DECISÃO CONJUNTA", 19, 500, c["ap"], anc="end",
               trk=".16em"))
    meio = LARG / 2
    p.append(f'<circle cx="{meio}" cy="60" r="15" fill="none" '
             f'stroke="{c["ac"]}" stroke-width="3" stroke-dasharray="6 6"/>')
    p.append(_t(meio, 24, "ONDE FICA O LIMITE?", 20, 500, c["ac"], trk=".16em"))
    return _svg(p, 130)


FIGURAS = {"linha_do_tempo": linha_do_tempo, "dois_trilhos": dois_trilhos,
           "convergencia": convergencia, "eixo_aberto": eixo_aberto}
