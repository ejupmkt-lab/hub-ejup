#!/usr/bin/env python3
"""Diagramas do carrossel, em SVG.

Cada figura mostra um mecanismo do argumento, não enfeita. Todas usam a
paleta da marca e a mesma gramática: caixa de contorno prata, o que é decisivo
em dourado, seta fina indicando direção.
"""

LARG = 920           # largura útil dentro das margens de 80px
G, PRATA, ACO = "#f0b855", "#d1d3d4", "#304557"
BR = "#9b6b26"


def _txt(x, y, t, tam=20, peso=500, cor="#ffffff", anc="middle", trk=".04em"):
    return (f'<text x="{x}" y="{y}" text-anchor="{anc}" fill="{cor}" '
            f'font-family="Gotham" font-size="{tam}" font-weight="{peso}" '
            f'letter-spacing="{trk}">{t}</text>')


def _caixa(x, y, w, h, cor=PRATA, op=".45", r=4, fill="none"):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
            f'fill="{fill}" stroke="{cor}" stroke-opacity="{op}" '
            f'stroke-width="1.5"/>')


def _seta(x1, y1, x2, y2, cor=PRATA, op=".5"):
    return (f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{cor}" stroke-opacity="{op}" '
            f'stroke-width="1.5" marker-end="url(#pta)"/>')


DEFS = (f'<defs><marker id="pta" viewBox="0 0 10 10" refX="9" refY="5" '
        f'markerWidth="6" markerHeight="6" orient="auto">'
        f'<path d="M0 0L10 5L0 10z" fill="{PRATA}" fill-opacity=".55"/>'
        f'</marker></defs>')


def federacao() -> str:
    """Competência comum dos quatro entes, e de onde sai o município."""
    entes = ["UNIÃO", "ESTADOS", "DF", "MUNICÍPIOS"]
    w, gap = 215, 20
    p = [DEFS]
    for i, e in enumerate(entes):
        x = i * (w + gap)
        destaque = i == 3
        p.append(_caixa(x, 0, w, 74, G if destaque else PRATA,
                        ".9" if destaque else ".4"))
        p.append(_txt(x + w / 2, 46, e, 22, 500 if destaque else 400,
                      G if destaque else "#ffffff", trk=".12em"))
    # barra da competência comum
    p.append(f'<path d="M8 96V110H{LARG-8}V96" stroke="{PRATA}" '
             f'stroke-opacity=".35" stroke-width="1.5" fill="none"/>')
    p.append(_txt(LARG / 2, 142, "COMPETÊNCIA COMUM · CF, ART. 23, VI", 20, 500,
                  PRATA, trk=".14em"))
    # soma com o interesse local
    p.append(_txt(LARG / 2, 196, "+", 30, 300, PRATA))
    p.append(_caixa(LARG / 2 - 240, 216, 480, 62))
    p.append(_txt(LARG / 2, 254, "INTERESSE LOCAL · CF, ART. 30, I", 20, 500,
                  "#ffffff", trk=".12em"))
    p.append(_seta(LARG / 2, 288, LARG / 2, 320))
    p.append(_caixa(LARG / 2 - 300, 330, 600, 66, G, ".9"))
    p.append(_txt(LARG / 2, 371, "LICENCIAMENTO AMBIENTAL MUNICIPAL", 22, 500, G,
                  trk=".1em"))
    return _svg(p, 400)


def requisitos() -> str:
    """Os três requisitos, e o desvio quando falta um."""
    itens = ["Órgão ambiental capacitado",
             "Técnicos habilitados",
             "Conselho de Meio Ambiente em funcionamento"]
    p = [DEFS]
    y = 0
    for it in itens:
        p.append(_caixa(0, y, LARG, 68))
        p.append(f'<rect x="26" y="{y+25}" width="18" height="18" rx="3" '
                 f'fill="none" stroke="{G}" stroke-width="2"/>')
        p.append(f'<path d="M30 {y+34}l4 4 8-9" stroke="{G}" stroke-width="2.4" '
                 f'fill="none" stroke-linecap="round"/>')
        p.append(_txt(64, y + 42, it, 24, 400, "#ffffff", anc="start", trk="0"))
        y += 84
    y += 6
    meio = LARG / 2
    p.append(_seta(meio - 230, y, meio - 230, y + 34))
    p.append(_seta(meio + 230, y, meio + 230, y + 34))
    # duas linhas por caixa: a condição em cima, o resultado embaixo. Numa
    # linha só, o rótulo mais longo estourava a caixa de 420px.
    for lado, cor, op, cond, fim in (
            (-440, G, ".9", "COM OS TRÊS", "O MUNICÍPIO LICENCIA"),
            (20, PRATA, ".4", "FALTA UM", "LICENCIA O ESTADO")):
        x = meio + lado
        p.append(_caixa(x, y + 44, 420, 96, cor, op))
        p.append(_txt(x + 210, y + 76, cond, 17, 500, PRATA, trk=".18em"))
        p.append(_txt(x + 210, y + 110, fim, 22, 500, cor, trk=".06em"))
    return _svg(p, y + 150)


def fluxo() -> str:
    """Onde o controle acontece: antes ou depois da licença."""
    p = [DEFS]

    def trilho(y, rotulo, etapas, marcar):
        out = [_txt(0, y - 18, rotulo, 20, 500, PRATA, anc="start", trk=".16em")]
        n = len(etapas)
        w = (LARG - (n - 1) * 46) / n
        for i, e in enumerate(etapas):
            x = i * (w + 46)
            alvo = i == marcar
            out.append(_caixa(x, y, w, 76, G if alvo else PRATA,
                              ".9" if alvo else ".4"))
            for j, linha in enumerate(e.split("|")):
                out.append(_txt(x + w / 2, y + (44 if len(e.split("|")) == 1
                                                else 34 + j * 24),
                                linha, 21, 500 if alvo else 400,
                                G if alvo else "#ffffff", trk=".02em"))
            if i < n - 1:
                out.append(_seta(x + w + 8, y + 38, x + w + 38, y + 38))
        return out

    # y=52 e não 30: o rótulo fica acima do trilho e, mais alto que isso, o
    # acento do "Á" sai do viewBox e é cortado sem aviso
    p += trilho(52, "RITO ORDINÁRIO", ["Projeto", "Análise|técnica prévia",
                                       "Licença"], 1)
    p.append(f'<path d="M0 212H{LARG}" stroke="{PRATA}" stroke-opacity=".18" '
             f'stroke-width="1"/>')
    p += trilho(270, "LICENÇA POR ADESÃO E COMPROMISSO",
                ["Projeto", "Declaração|de adesão", "Licença", "Fiscalização"], 3)
    p.append(_txt(LARG, 388, "onde o controle acontece", 21, 500, G,
                  anc="end", trk=".02em"))
    return _svg(p, 402)


def matriz(total=167, cheios=13, por_linha=21) -> str:
    """167 municípios, 13 com estrutura própria."""
    lado, gap = 32, 8
    p = []
    for i in range(total):
        col, lin = i % por_linha, i // por_linha
        x, y = col * (lado + gap), lin * (lado + gap)
        if i < cheios:
            p.append(f'<rect x="{x}" y="{y}" width="{lado}" height="{lado}" '
                     f'rx="3" fill="{G}"/>')
        else:
            p.append(f'<rect x="{x}" y="{y}" width="{lado}" height="{lado}" '
                     f'rx="3" fill="none" stroke="{ACO}" stroke-width="1.5"/>')
    linhas = (total + por_linha - 1) // por_linha
    return _svg(p, linhas * (lado + gap) - gap, larg=por_linha * (lado + gap) - gap)


def responsabilidade() -> str:
    """A licença cai, e a responsabilidade sobra em três frentes."""
    p = [DEFS]
    p.append(_caixa(LARG / 2 - 280, 0, 560, 74, G, ".9"))
    p.append(_txt(LARG / 2, 46, "LICENÇA PODE SER ANULADA", 22, 500, G, trk=".1em"))
    p.append(_seta(LARG / 2, 86, LARG / 2, 118))
    w = (LARG - 2 * 30) / 3
    for i, t in enumerate(["CIVIL", "ADMINISTRATIVA", "CRIMINAL"]):
        x = i * (w + 30)
        p.append(_caixa(x, 128, w, 88))
        p.append(_txt(x + w / 2, 180, t, 22, 500, "#ffffff", trk=".12em"))
    p.append(_txt(LARG / 2, 250, "RESPONSABILIDADE DO AGENTE PÚBLICO", 20, 500,
                  PRATA, trk=".14em"))
    return _svg(p, 262)


def _svg(partes, alt, larg=LARG) -> str:
    return (f'<svg viewBox="0 0 {larg} {alt}" '
            f'xmlns="http://www.w3.org/2000/svg">{"".join(str(x) for x in partes)}</svg>')


FIGURAS = {"federacao": federacao, "requisitos": requisitos, "fluxo": fluxo,
           "matriz": matriz, "responsabilidade": responsabilidade}
