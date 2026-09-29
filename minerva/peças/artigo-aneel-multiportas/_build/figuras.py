"""As figuras que costuram as peças do artigo, em três estilos.

ESTILO (variável de ambiente) escolhe:
* portas  · os arcos originais (a versão aprovada antes do feedback);
* portico · versão A: as portas redesenhadas como fachada clássica em
            traço fino, sem preenchimento chapado. A porta ativa aparece
            entreaberta, com uma fresta de luz e o reflexo no piso;
* linhas  · versão C: a usina hidrelétrica e quatro linhas de transmissão
            (torres treliçadas, cabos em catenária); cada condutor é uma porta;
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


# ------------------------------------------------------------------ versão C
def _torre(p, cx, topo, base, bracos, cor, sw):
    """Torre treliçada autoportante, em traço fino: pernas afuniladas,
    contraventamento em X, braços e cadeias de isoladores. Os condutores
    passam pelo eixo (a torre vista de frente, a linha seguindo para o fundo)."""
    mb, mt = 44, 9
    def larg(y):
        return mt + (mb - mt) * (y - topo) / (base - topo)
    for s_ in (-1, 1):
        p.append(f'<line x1="{cx + s_ * mt}" y1="{topo}" x2="{cx + s_ * mb}" y2="{base}" stroke="{cor}" stroke-width="{sw}"/>')
    p.append(f'<path d="M{cx - mt},{topo} L{cx},{topo - 22} L{cx + mt},{topo}" fill="none" stroke="{cor}" stroke-width="{sw}"/>')
    ys = [topo + (base - topo) * k / 10 for k in range(11)]
    for a, b in zip(ys, ys[1:]):
        la, lb = larg(a), larg(b)
        p.append(f'<line x1="{cx - la}" y1="{a}" x2="{cx + lb}" y2="{b}" stroke="{cor}" stroke-width="{sw * .5}"/>')
        p.append(f'<line x1="{cx + la}" y1="{a}" x2="{cx - lb}" y2="{b}" stroke="{cor}" stroke-width="{sw * .5}"/>')
    pontos = []
    for y, a in bracos:
        l = larg(y)
        p.append(f'<line x1="{cx - a}" y1="{y}" x2="{cx + a}" y2="{y}" stroke="{cor}" stroke-width="{sw}"/>')
        for s_ in (-1, 1):
            p.append(f'<line x1="{cx + s_ * a}" y1="{y}" x2="{cx + s_ * l}" y2="{y + 16}" stroke="{cor}" stroke-width="{sw * .5}"/>')
            p.append(f'<line x1="{cx + s_ * a}" y1="{y}" x2="{cx + s_ * a}" y2="{y + 14}" stroke="{cor}" stroke-width="{sw * 1.4}"/>')
        pontos.append((cx, y + 14))
    return pontos


def _portico(p, cx, topo, base, alturas, cor, sw):
    """Pórtico de subestação: duas colunas e travessas, de onde saem
    (ou onde chegam) os condutores."""
    for s_ in (-1, 1):
        p.append(f'<line x1="{cx + s_ * 22}" y1="{topo}" x2="{cx + s_ * 22}" y2="{base}" stroke="{cor}" stroke-width="{sw}"/>')
    pontos = []
    for y in alturas:
        p.append(f'<line x1="{cx - 30}" y1="{y}" x2="{cx + 30}" y2="{y}" stroke="{cor}" stroke-width="{sw}"/>')
        p.append(f'<line x1="{cx}" y1="{y}" x2="{cx}" y2="{y + 14}" stroke="{cor}" stroke-width="{sw * 1.4}"/>')
        pontos.append((cx, y + 14))
    return pontos


def _usina(p, x0, x1, topo, base, c, sw):
    """Barragem de gravidade vista de lado: reservatório atrás, paramento
    inclinado com condutos forçados e a casa de força ao pé."""
    cor = c["off"]
    agua = "rgba(48,69,87,.35)" if c["on"] == "#f0b855" else "rgba(48,69,87,.12)"
    crista = x0 + 46
    p.append(f'<rect x="{x0}" y="{topo + 18}" width="{crista - x0}" height="{base - topo - 18}" fill="{agua}"/>')
    for k in range(5):
        y = topo + 30 + k * 16
        p.append(f'<line x1="{x0 + 4}" y1="{y}" x2="{crista - 8}" y2="{y}" stroke="{c["fraco"]}" stroke-width="{sw * .6}"/>')
    p.append(f'<polygon points="{crista},{topo} {crista + 22},{topo} {x1},{base - 70} {x1},{base} {crista},{base}" '
             f'fill="none" stroke="{cor}" stroke-width="{sw}"/>')
    for k in range(4):
        xa = crista + 26 + k * 14
        p.append(f'<line x1="{xa}" y1="{topo + 24 + k * 8}" x2="{x1 - 8 - (3 - k) * 10}" y2="{base - 72}" stroke="{c["fraco"]}" stroke-width="{sw * .8}"/>')
    p.append(f'<rect x="{crista}" y="{base - 70}" width="{x1 - crista}" height="70" fill="none" stroke="{cor}" stroke-width="{sw}"/>')
    n = 4; w = (x1 - crista - 20) / n
    for k in range(n):
        p.append(f'<rect x="{crista + 10 + k * w + 3}" y="{base - 52}" width="{w - 6}" height="30" fill="none" '
                 f'stroke="{c["fraco"]}" stroke-width="{sw * .7}"/>')


def linhas(acesas, claro=False, mini=False, largura=None, classe="fig"):
    """A usina gera; a energia sai pelo pórtico da subestação e segue por
    quatro condutores de uma linha de transmissão. Cada condutor é uma
    porta. O ativo conduz em dourado; os outros ficam em traço apagado."""
    c = cores(claro)
    sw = 1.6 if not mini else 2.2
    fs = 22 if not mini else 27
    uid = "l" + ("c" if claro else "e") + ("m" if mini else "") + "".join(map(str, sorted(acesas)))
    topo, base = 50, 390
    alturas = [90, 145, 200, 255]
    bracos = [(y, 30 + k * 8) for k, y in enumerate(alturas)]
    estrut = c["off"]
    p = [f'<defs><filter id="luz{uid}" x="-10%" y="-60%" width="120%" height="220%">'
         f'<feGaussianBlur stdDeviation="5"/></filter></defs>']
    _usina(p, 0, 190, 120, base, c, sw)
    saida = _portico(p, 245, 70, base, alturas, estrut, sw)
    torres = [_torre(p, cx, topo, base, bracos, estrut, sw * .8) for cx in (390, 530, 670)]
    chegada = _portico(p, 780, 70, base, alturas, estrut, sw)
    # ligação da casa de força ao pórtico de saída
    p.append(f'<line x1="190" y1="{base - 40}" x2="223" y2="{base - 40}" stroke="{estrut}" stroke-width="{sw}"/>')
    for i in range(4):
        on = i in acesas
        cor = c["on"] if on else c["off"]
        pts = [saida[i]] + [t[i] for t in torres] + [chegada[i]]
        d = f"M{pts[0][0]},{pts[0][1]}"
        for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
            d += f" Q{(xa + xb) / 2},{max(ya, yb) + 20} {xb},{yb}"        # catenária
        if on:
            p.append(f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="{sw * 4.5}" opacity=".4" filter="url(#luz{uid})"/>')
        p.append(f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="{sw * (1.7 if on else .9)}"/>')
        xe, ye = chegada[i]
        p.append(f'<circle cx="{xe}" cy="{ye}" r="{sw * 2.4}" fill="{cor if on else "none"}" stroke="{cor}" stroke-width="{sw}"/>')
        p.append(f'<text x="{xe + 34}" y="{ye + fs * .36}" style="font:500 {fs}px Gotham;letter-spacing:{fs * .1}px;'
                 f'fill:{c["on"] if on else c["txt"]}">{PORTAS[i].upper()}</text>')
    p.append(f'<line x1="0" y1="{base}" x2="820" y2="{base}" stroke="{c["fraco"]}" stroke-width="{sw * .8}"/>')
    return _svg(classe, base + 30, largura, "".join(p))


def figura(acesas, claro=False, mini=False, largura=None, classe="fig"):
    return {"portico": portico, "fios": fios, "linhas": linhas}[ESTILO](acesas, claro, mini, largura, classe)
