"""As figuras que costuram as peças do artigo, em três estilos.

ESTILO (variável de ambiente) escolhe:
* portas  · os arcos originais (a versão aprovada antes do feedback);
* portico · versão A: as portas redesenhadas como fachada clássica em
            traço fino, sem preenchimento chapado. A porta ativa aparece
            entreaberta, com uma fresta de luz e o reflexo no piso;
* fios    · versão B: diagrama unifilar (a linguagem de projeto elétrico).
            Um barramento e quatro alimentadores, cada um com disjuntor e
            terminal; o circuito ativo conduz em dourado.
"""
import os

ESTILO = os.environ.get("ESTILO", "portas")
PORTAS = ["Ouvidoria", "Mediação", "Arbitragem", "Judiciário"]
ROMANOS = ["I", "II", "III", "IV"]


def pasta_saida(out):
    return out if ESTILO == "portas" else out / f"versao-{ESTILO}"


def cores(claro):
    if claro:
        return dict(on="#9b6b26", off="rgba(65,64,66,.42)", fraco="rgba(65,64,66,.18)",
                    luz="#9b6b26", txt="rgba(65,64,66,.62)")
    return dict(on="#f0b855", off="rgba(209,211,212,.42)", fraco="rgba(209,211,212,.16)",
                luz="#f0b855", txt="rgba(209,211,212,.62)")


def _svg(classe, vb_h, largura, corpo):
    w = f' width="{largura}"' if largura else ""
    return (f'<svg class="{classe}" viewBox="0 0 1000 {vb_h}"{w} style="height:auto;overflow:visible">'
            f'{corpo}</svg>')


# ------------------------------------------------------------------ versão A
def portico(acesas, claro=False, mini=False, largura=None, classe="fig"):
    c = cores(claro)
    uid = "p" + ("c" if claro else "e") + ("m" if mini else "") + "".join(map(str, sorted(acesas)))
    n, dw, gap = 4, 150, 100            # largura da porta e intervalo
    x0 = (1000 - (n * dw + (n - 1) * gap)) / 2
    topo = 110 if not mini else 70     # linha de baixo da arquitrave
    dh = 330 if not mini else 250      # altura da porta
    piso = topo + 40 + dh
    fs = 30 if not mini else 27
    sw = 2.2 if not mini else 2.6
    p = [f'<defs><linearGradient id="fresta{uid}" x1="0" y1="0" x2="0" y2="1">'
         f'<stop offset="0" stop-color="{c["luz"]}" stop-opacity=".0"/>'
         f'<stop offset="1" stop-color="{c["luz"]}" stop-opacity=".55"/></linearGradient>'
         f'<linearGradient id="chao{uid}" x1="0" y1="0" x2="0" y2="1">'
         f'<stop offset="0" stop-color="{c["luz"]}" stop-opacity=".35"/>'
         f'<stop offset="1" stop-color="{c["luz"]}" stop-opacity="0"/></linearGradient></defs>']
    # arquitrave: duas linhas finas de ponta a ponta
    tudo = bool(acesas) and len(acesas) == n
    cor_arq = c["on"] if tudo else c["off"]
    p.append(f'<line x1="0" y1="{topo - 34}" x2="1000" y2="{topo - 34}" stroke="{cor_arq}" stroke-width="{sw}"/>')
    p.append(f'<line x1="0" y1="{topo}" x2="1000" y2="{topo}" stroke="{cor_arq}" stroke-width="{sw * .6}"/>')
    # piso
    p.append(f'<line x1="0" y1="{piso}" x2="1000" y2="{piso}" stroke="{cor_arq}" stroke-width="{sw}"/>')
    for i in range(n):
        on = i in acesas
        cor = c["on"] if on else c["off"]
        x = x0 + i * (dw + gap)
        y = topo + 40
        # numeral romano no friso
        if not mini:
            p.append(f'<text x="{x + dw / 2}" y="{topo - 9}" text-anchor="middle" '
                     f'style="font:500 20px Gotham;letter-spacing:4px;fill:{cor}">{ROMANOS[i]}</text>')
        # moldura externa e interna (batente)
        p.append(f'<rect x="{x - 14}" y="{y - 14}" width="{dw + 28}" height="{dh + 14}" fill="none" '
                 f'stroke="{cor}" stroke-width="{sw * .6}"/>')
        p.append(f'<rect x="{x}" y="{y}" width="{dw}" height="{dh}" fill="none" stroke="{cor}" stroke-width="{sw}"/>')
        if on:
            # porta entreaberta: fresta de luz e folha recuada
            fx = x + dw * .62
            p.append(f'<rect x="{fx}" y="{y}" width="{dw * .38}" height="{dh}" fill="url(#fresta{uid})"/>')
            p.append(f'<line x1="{fx}" y1="{y}" x2="{fx}" y2="{y + dh}" stroke="{cor}" stroke-width="{sw}"/>')
            p.append(f'<polygon points="{fx},{piso} {x + dw},{piso} {x + dw + 70},{piso + 70} {fx - 30},{piso + 70}" '
                     f'fill="url(#chao{uid})"/>')
            p.append(f'<circle cx="{fx - 16}" cy="{y + dh * .55}" r="{sw * 1.6}" fill="{cor}"/>')
        else:
            # porta fechada: duas almofadas em traço
            for k in (0, 1):
                py = y + 22 + k * (dh - 44) / 2
                p.append(f'<rect x="{x + 22}" y="{py}" width="{dw - 44}" height="{(dh - 44) / 2 - 12}" '
                         f'fill="none" stroke="{c["fraco"]}" stroke-width="{sw * .6}"/>')
        p.append(f'<text x="{x + dw / 2}" y="{piso + (62 if not mini else 50)}" text-anchor="middle" '
                 f'style="font:500 {fs}px Gotham;letter-spacing:{fs * .12}px;fill:{c["on"] if on else c["txt"]}">'
                 f'{PORTAS[i].upper()}</text>')
    return _svg(classe, piso + (80 if not mini else 64), largura, "".join(p))


# ------------------------------------------------------------------ versão B
def cabo(p, x, y0, y1, on, cor, sw):
    """Condutor isolado: capa escura larga com a alma de cobre por dentro.
    Energizado, a alma é dourada e contínua; desligado, é um fio apagado."""
    p.append(f'<line x1="{x}" y1="{y0}" x2="{x}" y2="{y1}" stroke="rgba(3,28,55,.9)" '
             f'stroke-width="{sw * 4.2}" stroke-linecap="round"/>')
    p.append(f'<line x1="{x}" y1="{y0}" x2="{x}" y2="{y1}" stroke="{cor}" stroke-width="{sw * 4.2}" '
             f'stroke-opacity=".28" stroke-linecap="round"/>')
    traco = "" if on else ' stroke-dasharray="2 10"'
    p.append(f'<line x1="{x}" y1="{y0}" x2="{x}" y2="{y1}" stroke="{cor}" stroke-width="{sw * (1.3 if on else .9)}"'
             f'{traco} stroke-linecap="round"/>')



def fios(acesas, claro=False, mini=False, largura=None, classe="fig"):
    c = cores(claro)
    n = 4
    xs = [125 + i * 250 for i in range(n)]
    bus = 70 if not mini else 40
    brk = 250 if not mini else 150          # centro do disjuntor
    term = 440 if not mini else 250          # terminal
    fs = 30 if not mini else 27
    sw = 3 if not mini else 3.4
    uid = "f" + ("c" if claro else "e") + ("m" if mini else "") + "".join(map(str, sorted(acesas)))
    p = [f'<defs><filter id="brilho{uid}" x="-50%" y="-50%" width="200%" height="200%">'
         f'<feGaussianBlur stdDeviation="6"/></filter></defs>']
    # alimentação chegando pela esquerda e barramento
    tudo = len(acesas) == n
    cor_bus = c["on"] if acesas else c["off"]
    p.append(f'<line x1="0" y1="{bus}" x2="1000" y2="{bus}" stroke="rgba(3,28,55,.9)" stroke-width="{sw * 5}"/>')
    p.append(f'<line x1="0" y1="{bus}" x2="1000" y2="{bus}" stroke="{cor_bus}" stroke-width="{sw * 5}" stroke-opacity=".3"/>')
    p.append(f'<line x1="0" y1="{bus}" x2="1000" y2="{bus}" stroke="{cor_bus}" stroke-width="{sw * 1.6}"/>')
    if not mini:
        p.append(f'<text x="0" y="{bus - 26}" style="font:500 20px Gotham;letter-spacing:4px;fill:{c["txt"]}">'
                 f'BARRAMENTO · SISTEMA MULTIPORTAS</text>')
    for i, x in enumerate(xs):
        on = i in acesas
        cor = c["on"] if on else c["off"]
        s = 34 if not mini else 44
        # derivação do barramento
        p.append(f'<circle cx="{x}" cy="{bus}" r="{sw * 2.2}" fill="{cor}"/>')
        if on:
            p.append(f'<line x1="{x}" y1="{bus}" x2="{x}" y2="{term}" stroke="{cor}" stroke-width="{sw * 3}" '
                     f'opacity=".35" filter="url(#brilho{uid})"/>')
        cabo(p, x, bus, brk - s, on, cor, sw)
        # disjuntor: quadrado; fechado no ativo, aberto (lâmina inclinada) no inativo
        p.append(f'<rect x="{x - s}" y="{brk - s}" width="{2 * s}" height="{2 * s}" fill="none" '
                 f'stroke="{cor}" stroke-width="{sw}"/>')
        if on:
            p.append(f'<line x1="{x}" y1="{brk - s}" x2="{x}" y2="{brk + s}" stroke="{cor}" stroke-width="{sw}"/>')
        else:
            p.append(f'<line x1="{x}" y1="{brk + s}" x2="{x + s * .8}" y2="{brk - s * .6}" stroke="{cor}" '
                     f'stroke-width="{sw}"/>')
        cabo(p, x, brk + s, term - sw * 3.2, on, cor, sw)
        # terminal
        p.append(f'<circle cx="{x}" cy="{term}" r="{sw * 3.2}" fill="{cor if on else "none"}" '
                 f'stroke="{cor}" stroke-width="{sw}"/>')
        p.append(f'<text x="{x}" y="{term + (70 if not mini else 52)}" text-anchor="middle" '
                 f'style="font:500 {fs}px Gotham;letter-spacing:{fs * .12}px;fill:{c["on"] if on else c["txt"]}">'
                 f'{PORTAS[i].upper()}</text>')
    return _svg(classe, term + (90 if not mini else 64), largura, "".join(p))


def figura(acesas, claro=False, mini=False, largura=None, classe="fig"):
    return {"portico": portico, "fios": fios}[ESTILO](acesas, claro, mini, largura, classe)
