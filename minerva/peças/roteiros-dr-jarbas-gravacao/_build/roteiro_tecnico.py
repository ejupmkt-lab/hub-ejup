#!/usr/bin/env python3
"""Roteiro técnico de gravação · Dr. Jarbas Bezerra · 19/10/2026, 10h30 às 12h.

Quatro vídeos verticais, sempre o Dr. Jarbas falando para a câmera. Cada quadro
tem a sua fotografia: O Que o Processo Não Mostra (A1, A2) numa locação e
Antes da Consequência (B1, B2) em outra.

Cada episódio é uma tabela em três colunas: IMAGEM, FALA e LETTERING. A fala é
a mesma do teleprompter (o script confere frase a frase com o gerar.py e para
se divergir). Palavras entre ** ** são as de ênfase na leitura.

Saída: Roteiro_Tecnico_Dr_Jarbas_19-10.pdf (páginas em imagem, abre em
qualquer leitor), aqui e em entregas/.
"""
import html, importlib.util, pathlib, re, shutil
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
spec = importlib.util.spec_from_file_location("gerar", HERE / "gerar.py")
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
FONTS = (RAIZ / "skills/ejup-design/assets/fonts").as_uri()
LOGO = (RAIZ / "skills/ejup-design/assets/logo/ejup-horizontal-navy.svg").read_text()
NOME_ARQ = "Roteiro_Tecnico_Dr_Jarbas_19-10.pdf"

PM = "PM"
PP = "PP"

# (imagem, fala, lettering) · lettering "" = sem lettering
SEG = {
 "A1": [
  (PP + ". Olhar firme na lente, rosto sério.", "Na Justiça Militar estadual, a sentença costuma nascer numa **sala fechada**, depois que as partes saem.", ""),
  ("PM.", "Eu sou o Jarbas Bezerra, e este é O Que o Processo Não Mostra.", "Título do quadro, 2 s: O QUE O PROCESSO NÃO MOSTRA. Identificação: Jarbas Bezerra · [título a confirmar]"),
  ("PM.", "Desde dois mil e quatro, crime militar contra civil é julgado pelo juiz de direito, **sozinho**, e o doloso contra a vida vai ao júri.", "Constituição, art. 125, §§ 4º e 5º"),
  ("PM.", "Os demais vão ao **Conselho de Justiça**: o juiz preside e divide a mesa com quatro oficiais da corporação.", "Conselho de Justiça · 1 juiz + 4 oficiais"),
  ("PP.", "Terminados os debates, o Conselho delibera em **sessão secreta**.", "Sessão secreta · CPPM, art. 434"),
  ("PM.", "Os oficiais perguntam sobre o direito, o juiz esclarece, e a decisão sai da **maioria**.", ""),
  (PP + ". Pausa curta antes da frase.", "Em quase vinte e oito anos, meu voto contou como **um entre cinco**.", "Grafismo: cinco cadeiras em linha, uma acesa"),
  ("PM.", "À mesa estavam oficiais que conheciam a tropa por dentro e nunca tinham estudado processo penal.", ""),
  ("PM.", "Para quem advoga ali, a sustentação oral fala também a **quatro julgadores** que não são juristas.", ""),
  (PP + ". Segurar 1 s de silêncio depois da frase.", "Argumento que só o juiz togado entende convence **um voto em cinco**.", ""),
  (PM + ". Segurar o olhar 2 s depois da última palavra.", "Esta é uma reflexão geral, sem relação com processo real. Na próxima terça, volto com outro bastidor da decisão.", "Reflexão geral, sem relação com processo real · Toda terça, 12h"),
 ],
 "A2": [
  (PP + ". Dizer \"Oito dias\" e fazer uma pausa.", "**Oito dias.** É o prazo que separa uma ausência sem licença do crime de deserção.", "Número 8 grande, sozinho, por 1 s"),
  ("PM.", "Eu sou o Jarbas Bezerra, e este é O Que o Processo Não Mostra.", "Título do quadro, 2 s: O QUE O PROCESSO NÃO MOSTRA"),
  ("PM.", "O artigo cento e oitenta e sete do Código Penal Militar pune com detenção de seis meses a dois anos o militar que se ausenta da unidade, sem licença, por **mais de oito dias**.", "Código Penal Militar, art. 187 · detenção de 6 meses a 2 anos"),
  ("PP.", "Muitos jovens conheceram esse prazo diante de mim, **na audiência**.", ""),
  ("PM.", "Alguns voltaram no **nono dia**, certos de que responderiam a uma falta disciplinar.", ""),
  ("PP.", "Isso me levou para fora do gabinete.", ""),
  ("PM.", "Ajudei a criar o **Probec**, o Programa Brasileiro de Educação Cidadã, para levar a lei à sala de aula antes que ela chegue aos autos.", "Probec · Programa Brasileiro de Educação Cidadã (logotipo, se autorizado). 10 de setembro · Dia Estadual da Educação Cívica (RN, 2013)"),
  ("PP.", "A sentença alcança o fato depois que ele aconteceu. A aula alcança o jovem **antes**.", ""),
  ("PM.", "Quem comanda militares recém-incorporados pode começar por esse artigo.", "CPM, art. 187"),
  (PM + ". Segurar o olhar 2 s depois da última palavra.", "Esta é uma reflexão pessoal, sem relação com processo real. Na próxima terça, volto com outro bastidor da decisão.", "Reflexão pessoal, sem relação com processo real · Toda terça, 12h"),
 ],
 "B1": [
  (PP + ". Olhar firme na lente.", "Toda ordem recebida coloca o militar entre **dois artigos** do Código Penal Militar.", "Grafismo: art. 163 à esquerda, art. 38 à direita"),
  ("PM.", "Eu sou o Jarbas Bezerra, e este é o Antes da Consequência.", "Título do quadro, 2 s: ANTES DA CONSEQUÊNCIA. Identificação: Jarbas Bezerra · [título a confirmar]"),
  (PM + ". Mão esquerda marca o primeiro artigo.", "O cento e sessenta e três pune quem **recusa** obediência a ordem do superior sobre assunto de serviço.", "CPM, art. 163 · Recusa de obediência · detenção de 1 a 2 anos"),
  (PM + ". Mão direita marca o segundo artigo.", "O trinta e oito **protege** quem cumpre ordem direta do superior, em matéria de serviço.", "CPM, art. 38"),
  ("PP.", "A proteção acaba quando a ordem manda praticar ato **manifestamente criminoso**, ou quando há **excesso** na execução.", "manifestamente criminoso · excesso"),
  ("PM.", "Aí o subordinado responde junto com quem mandou.", ""),
  (PP + ". Pausa curta antes da frase.", "Repare na palavra **manifestamente**.", "MANIFESTAMENTE"),
  ("PM.", "A lei dispensa o soldado de dar parecer jurídico sobre cada ordem e cobra dele a recusa do **crime evidente**.", ""),
  ("PM.", "Nas audiências que presidi, a discussão mais difícil girava em torno do **excesso**, que pertence a quem executa, mesmo quando a ordem era legal.", ""),
  ("PP.", "O dever de cumprir vem da hierarquia. A forma de cumprir é **de quem executa**, e é por ela que se responde.", ""),
  (PM + ". Segurar o olhar 2 s depois da última palavra.", "Conteúdo educativo, sem orientação individual. Na próxima quinta, volto com outro cuidado antes da consequência.", "Conteúdo educativo, sem orientação individual · Toda quinta, 18h30"),
 ],
 "B2": [
  (PP + ". Olhar firme na lente.", "Há uma frase na Constituição que muito comandante lê **pela metade**: não caberá habeas corpus em relação a punições disciplinares militares.", "A frase escrita; a segunda metade aparece depois"),
  ("PM.", "Eu sou o Jarbas Bezerra, e este é o Antes da Consequência.", "Título do quadro, 2 s: ANTES DA CONSEQUÊNCIA"),
  ("PM.", "Está no artigo cento e quarenta e dois.", "Constituição, art. 142, § 2º"),
  ("PP.", "O Supremo leu a **frase inteira**: o mérito da punição fica com o comando, e a legalidade continua sob controle do juiz.", "STF, RE 338.840"),
  (PM + ". Contar os quatro pontos com a mão.", "O juiz examina hierarquia, poder disciplinar, ligação do fato com a função e pena cabível.", "hierarquia · poder disciplinar · ligação com a função · pena cabível"),
  ("PM.", "Desde dois mil e quatro, as ações contra punições disciplinares chegam ao **juiz de direito** do juízo militar.", "Constituição, art. 125, §§ 4º e 5º"),
  ("PP.", "Na minha mesa, as punições anuladas tinham quase sempre um **vício de rito**: acusação mal descrita, prazo de defesa ignorado, decisão sem fundamento.", "Contraditório e ampla defesa · Constituição, art. 5º, LV"),
  (PM + ", indo a PP na pergunta.", "Antes de assinar uma punição, vale uma pergunta: o acusado soube **exatamente** do que era acusado e teve prazo para responder?", ""),
  (PM + ". Segurar o olhar 2 s depois da última palavra.", "Conteúdo educativo, sem orientação individual. Na próxima quinta, volto com outro cuidado antes da consequência.", "Conteúdo educativo, sem orientação individual · Toda quinta, 18h30"),
 ],
}

LOCACOES = {
 "A": dict(
  nome="Locação 1 · O gabinete", quadro="O Que o Processo Não Mostra", eps="Episódios 1 e 2 · terça, 12h",
  conceito="Bastidor da decisão. Conversa reservada, em tom baixo, como quem abre a porta do gabinete. Luz de fim de tarde, contraste marcado, calor da madeira.",
  itens=[
   ("Cenário", "Dr. Jarbas sentado à mesa de madeira, mãos sobre a mesa e a caneta ao lado. Estante de livros ao fundo, a 2 ou 3 metros, fora de foco. Uma luminária de mesa acesa no fundo, desfocada. Sem toga e sem martelo."),
   ("Enquadramento", "Vertical 9:16. Câmera na altura dos olhos. Plano médio do meio do peito para cima, olhos no terço superior, pouco ar acima da cabeça. Olhar sempre na lente."),
   ("Câmera", "4K na vertical (2160 × 3840), 30p, obturador 1/60, para permitir o punch-in do PP na edição. Lente de 50 mm (equivalente full frame) em f/2.8 para separar do fundo."),
   ("Luz", "Principal suave a 45°, do lado da janela ou softbox grande. Do outro lado, só um rebatedor (contraste perto de 4:1). Contraluz fraca e quente para separar cabeça e ombros do fundo. Fundo um ponto mais escuro que o rosto."),
   ("Cor", "Branco da câmera em 4300 K, acertado no rosto. A luminária do fundo fica quente (2700 a 3000 K). Nenhuma luz colorida."),
   ("Figurino", "Paletó escuro (azul-marinho ou grafite), camisa clara, gravata discreta. Trocar a gravata entre A1 e A2: os vídeos saem em semanas diferentes."),
   ("Som", "Lapela escondida e boom de referência, 48 kHz. Desligar o ar-condicionado nos takes."),
  ],
  svg="gabinete"),
 "B": dict(
  nome="Locação 2 · A orientação", quadro="Antes da Consequência", eps="Episódios 1 e 2 · quinta, 18h30",
  conceito="Aviso preventivo, direto e claro. Luz aberta e institucional, contraste baixo, nenhum elemento quente. O espectador sente que está recebendo uma orientação.",
  itens=[
   ("Cenário", "Dr. Jarbas em pé diante de uma parede lisa em tom neutro (cinza ou azul acinzentado), a 1,5 ou 2 metros. Uma faixa suave de luz na parede, de persiana ou recorte, para dar textura. Sem mesa em quadro, sem toga e sem martelo."),
   ("Enquadramento", "Vertical 9:16. Câmera na altura dos olhos. Plano médio da cintura para cima, mais aberto que no gabinete, para caber o gesto das mãos. Olhar sempre na lente."),
   ("Câmera", "4K na vertical (2160 × 3840), 30p, obturador 1/60. Lente de 35 a 50 mm em f/4, com a parede levemente desfocada."),
   ("Luz", "Principal mais frontal, a cerca de 30°, com difusão. Preenchimento presente do outro lado (contraste perto de 2:1). Luz separada para a parede, com a faixa de textura. Contraluz neutra."),
   ("Cor", "Tudo em 5600 K, neutro. Nenhum prático quente em quadro."),
   ("Figurino", "Mesmo padrão de alfaiataria, com camisa ou gravata diferente da locação 1. Trocar a gravata entre B1 e B2."),
   ("Som", "Lapela e boom. Atenção ao eco da parede lisa: tapete no chão, fora de quadro, se a sala reverberar."),
  ],
  svg="orientacao"),
}

ORDEM_DO_DIA = [
 ("9h30 às 10h30", "Equipe monta as duas locações: luz, câmera, teleprompter e som. Testes com um dublê no lugar do Dr. Jarbas."),
 ("10h30 às 10h40", "Chegada do Dr. Jarbas. Pó para tirar o brilho, lapela, leitura do primeiro roteiro no teleprompter, ajuste da velocidade."),
 ("10h40 às 11h00", "Locação 1 · A1, O voto que os autos não registram."),
 ("11h00 às 11h15", "Troca de gravata. Locação 1 · A2, Oito dias."),
 ("11h15 às 11h25", "Mudança para a locação 2, já montada. Ajuste fino de luz e enquadramento com ele em pé."),
 ("11h25 às 11h40", "Locação 2 · B1, Entre dois artigos."),
 ("11h40 às 11h55", "Troca de gravata. Locação 2 · B2, A frase lida pela metade."),
 ("11h55 às 12h00", "Margem: fechos extras de segurança e uma foto parado em cada locação, para capa."),
]

CONFIRMAR = [
 "Como o Dr. Jarbas quer ser identificado no lettering (cargo ou título).",
 "Os relatos na voz dele: o voto \"um entre cinco\", os jovens que voltavam no nono dia, as discussões sobre excesso, as punições anuladas por vício de rito. Ele confirma ou troca por palavras dele.",
 "A composição do Conselho de Justiça no RN (juiz e quatro oficiais).",
 "Autorização para usar o logotipo do Probec, e se cita a coautoria do programa.",
 "Conferência final no Planalto dos artigos citados (CF, arts. 5º, LV, 125 e 142; CPM, arts. 38, 163 e 187; CPPM, art. 434) e da Lei Complementar estadual nº 494/2013. O site estava fora do ar em 08/10.",
 "Regras para magistrado em rede social: Resolução CNJ nº 305/2019, art. 36 da LOMAN e a corregedoria do tribunal.",
]


def limpa(t):
    return re.sub(r"\s+", " ", t.replace("**", "")).strip()


def confere():
    """A fala do roteiro técnico tem de ser a mesma do teleprompter."""
    for k, segs in SEG.items():
        ep = next(e for e in g.EPS if e["id"] == k)
        tele = limpa(" ".join(" ".join(ls) for _, ls in ep["blocos"]))
        aqui = limpa(" ".join(f for _, f, _ in segs))
        assert tele == aqui, f"{k}: fala diverge do teleprompter\n{tele}\n{aqui}"


def tempo(segs):
    t, out = 0.0, []
    for _, f, _ in segs:
        out.append(t); t += len(re.findall(r"\w+", limpa(f))) / g.RITMO + 0.6
    return out, t


def mm(x):
    return f"{int(x // 60)}:{int(x % 60):02d}"


def enfase(t):
    t = html.escape(t)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)


def svg_luz(tipo):
    """Planta baixa simples da luz, vista de cima."""
    ink, aco, prata, ouro, bronze = "#0d131a", "#304557", "#d1d3d4", "#f0b855", "#9b6b26"
    def caixa(x, y, w, h, txt, cor=aco, fill="none"):
        return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{fill}" stroke="{cor}" stroke-width="1.5"/>'
                f'<text x="{x + w / 2}" y="{y + h / 2 + 4}" text-anchor="middle" font-size="11" fill="{ink}">{txt}</text>')
    def luz(x, y, txt, ang):
        return (f'<g transform="translate({x},{y}) rotate({ang})"><path d="M-14 -9 L14 -9 L22 9 L-22 9 Z" fill="{prata}" stroke="{aco}" stroke-width="1.2"/></g>'
                f'<text x="{x}" y="{y + 30}" text-anchor="middle" font-size="10.5" fill="{ink}">{txt}</text>')
    s = [f'<svg viewBox="0 0 420 300" width="420" height="300" font-family="Gotham" xmlns="http://www.w3.org/2000/svg">']
    if tipo == "gabinete":
        s.append(caixa(40, 18, 340, 26, "estante de livros (fundo, fora de foco)", prata))
        s.append(f'<circle cx="320" cy="62" r="7" fill="{ouro}"/><text x="334" y="66" font-size="10.5" fill="{ink}">luminária acesa</text>')
        s.append(f'<circle cx="210" cy="118" r="16" fill="{aco}"/><text x="210" y="96" text-anchor="middle" font-size="11" fill="{ink}">Dr. Jarbas (sentado)</text>')
        s.append(caixa(150, 140, 120, 34, "mesa de madeira", bronze))
        s.append(luz(92, 200, "principal suave 45°", -40))
        s.append(luz(330, 200, "rebatedor", 40))
        s.append(luz(340, 120, "contraluz quente", 140))
        s.append(caixa(185, 246, 50, 30, "câmera", ink, "#eef0f1"))
        s.append(f'<text x="210" y="292" text-anchor="middle" font-size="10" fill="{ink}">com teleprompter na lente</text>')
    else:
        s.append(caixa(40, 18, 340, 26, "parede lisa neutra, com faixa de luz", prata))
        s.append(luz(110, 70, "luz da parede", 160))
        s.append(f'<circle cx="210" cy="112" r="16" fill="{aco}"/><text x="210" y="90" text-anchor="middle" font-size="11" fill="{ink}">Dr. Jarbas (em pé)</text>')
        s.append(luz(120, 196, "principal 30°", -28))
        s.append(luz(310, 196, "preenchimento", 30))
        s.append(luz(300, 84, "contraluz neutra", 150))
        s.append(caixa(185, 246, 50, 30, "câmera", ink, "#eef0f1"))
        s.append(f'<text x="210" y="292" text-anchor="middle" font-size="10" fill="{ink}">com teleprompter na lente</text>')
    s.append("</svg>")
    return "".join(s)


CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
@page{{size:A4;margin:16mm 14mm 16mm}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:Gotham,Montserrat,sans-serif;color:#0d131a;font-weight:400;font-size:9.6pt;line-height:1.45}}
section{{break-after:page}} section:last-child{{break-after:auto}}
.eyebrow{{font-weight:500;font-size:7.6pt;letter-spacing:.14em;text-transform:uppercase;color:#9b6b26;margin:0 0 2mm}}
h1{{font-weight:900;font-size:22pt;letter-spacing:-.02em;line-height:1.05;color:#031c37;margin:0 0 3mm}}
h2{{font-weight:900;font-size:15pt;letter-spacing:-.015em;line-height:1.1;color:#031c37;margin:0 0 2mm}}
h3{{font-weight:500;font-size:8pt;letter-spacing:.14em;text-transform:uppercase;color:#304557;margin:6mm 0 2mm}}
.lead{{font-weight:300;font-size:11pt;line-height:1.45;color:#414042;margin:0 0 5mm}}
.logo{{width:34mm;margin-bottom:12mm}} .logo svg{{width:100%;height:auto;display:block}}
.ficha{{display:grid;grid-template-columns:38mm 1fr;border-top:1.5px solid #031c37;margin:2mm 0 4mm}}
.ficha div{{padding:2.2mm 0;border-bottom:.6px solid #d1d3d4}}
.ficha .k{{font-weight:500;font-size:7.8pt;letter-spacing:.1em;text-transform:uppercase;color:#304557;padding-top:2.6mm}}
table{{width:100%;border-collapse:collapse;table-layout:fixed}}
th{{font-weight:500;font-size:7.6pt;letter-spacing:.14em;text-transform:uppercase;color:#fff;background:#031c37;text-align:left;padding:2.2mm 2.6mm}}
td{{vertical-align:top;padding:1.9mm 2.6mm;border-bottom:.6px solid #d1d3d4}}
tr{{break-inside:avoid}}
td.img{{font-size:8.4pt;color:#304557}} td.img .t{{display:block;font-weight:500;color:#9b6b26;font-size:7.8pt;letter-spacing:.06em;margin-bottom:.8mm}}
td.fala{{font-size:10.3pt;line-height:1.4}} td.fala b{{font-weight:700;color:#031c37}}
td.gc{{font-size:8.4pt;color:#414042}} td.gc .nada{{color:#9a9b9d}}
.cab{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1.5px solid #031c37;padding-bottom:3mm;margin-bottom:4mm}}
.cab .meta{{text-align:right;font-size:8pt;color:#304557;line-height:1.5}}
.loc{{display:grid;grid-template-columns:1fr 112mm;gap:6mm;align-items:start}}
.loc dl{{margin:0}} .loc dt{{font-weight:500;font-size:7.8pt;letter-spacing:.12em;text-transform:uppercase;color:#304557;margin-top:3mm}}
.loc dd{{margin:.8mm 0 0;font-size:9.4pt}}
.planta{{border:.6px solid #d1d3d4;padding:3mm;border-radius:4px}} .planta svg{{width:100%;height:auto}}
.legenda{{font-size:7.6pt;color:#5f6062;margin-top:2mm}}
ol.dia{{list-style:none;padding:0;margin:0;border-top:1.5px solid #031c37}}
ol.dia li{{display:grid;grid-template-columns:32mm 1fr;padding:2.2mm 0;border-bottom:.6px solid #d1d3d4}}
ol.dia li span{{font-weight:500;color:#031c37}}
ul.chk{{padding-left:5mm;margin:0}} ul.chk li{{margin-bottom:1.6mm}}
.nota{{font-size:8.4pt;color:#414042;background:#f3f4f5;border-left:2px solid #9b6b26;padding:2.6mm 3.4mm;margin:4mm 0}}
'''


def capa():
    dur = {k: tempo(v)[1] for k, v in SEG.items()}
    lin = "".join(f"<li><span>{h}</span>{html.escape(t)}</li>" for h, t in ORDEM_DO_DIA)
    return f'''<section>
<div class="logo">{LOGO}</div>
<p class="eyebrow">Roteiro técnico de gravação</p>
<h1>Dr. Jarbas Bezerra<br>quatro vídeos, duas locações</h1>
<p class="lead">Todos os vídeos são o Dr. Jarbas falando direto para a câmera. Cada quadro tem a sua fotografia: os dois episódios de O Que o Processo Não Mostra são gravados no gabinete, e os dois de Antes da Consequência numa segunda locação, em pé.</p>
<div class="ficha">
 <div class="k">Data</div><div>Segunda-feira, 19 de outubro de 2026</div>
 <div class="k">Com o Dr. Jarbas</div><div>10h30 às 12h00 (equipe chega às 9h30)</div>
 <div class="k">Formato</div><div>Vídeo vertical 9:16, gravado em 4K na vertical, entrega em 1080 × 1920</div>
 <div class="k">Episódios</div><div>A1 O voto que os autos não registram ({round(dur["A1"])} s) · A2 Oito dias ({round(dur["A2"])} s)<br>B1 Entre dois artigos ({round(dur["B1"])} s) · B2 A frase lida pela metade ({round(dur["B2"])} s)</div>
 <div class="k">Teleprompter</div><div>De espelho, na lente. Cerca de 150 palavras por minuto. Textos em teleprompter/A1.txt, A2.txt, B1.txt e B2.txt</div>
 <div class="k">Aprovação</div><div>Dr. Jarbas Bezerra aprova texto e corte antes de publicar</div>
</div>
<h3>Ordem do dia</h3>
<ol class="dia">{lin}</ol>
<div class="nota">Como ler as tabelas. <b>PM</b> é o plano médio, o enquadramento da gravação. <b>PP</b> é o primeiro plano, feito na edição com punch-in (aproximação digital) sobre o mesmo take; por isso a gravação é em 4K. O tempo de cada linha é estimado pela leitura calma. Palavras em <b>negrito</b> na fala pedem ênfase. Legenda (closed caption) em todo o vídeo, fora dos 20% de baixo e dos 14% de cima da tela, onde o Instagram põe os botões.</div>
</section>'''


def pagina_locacao(q):
    L = LOCACOES[q]
    dl = "".join(f"<dt>{html.escape(k)}</dt><dd>{html.escape(v)}</dd>" for k, v in L["itens"])
    return f'''<section>
<div class="cab"><div><p class="eyebrow">{html.escape(L["quadro"])} · {html.escape(L["eps"])}</p><h2>{html.escape(L["nome"])}</h2></div>
<div class="meta">Direção de fotografia</div></div>
<p class="lead">{html.escape(L["conceito"])}</p>
<div class="loc"><dl>{dl}</dl>
<div class="planta">{svg_luz(L["svg"])}<p class="legenda">Planta baixa da luz, vista de cima. Distâncias e potências ajustadas no local.</p></div></div>
</section>'''


def pagina_ep(k):
    ep = next(e for e in g.EPS if e["id"] == k)
    L = LOCACOES[ep["q"]]
    ts, dur = tempo(SEG[k])
    linhas = ""
    for (img, fala, gc), t in zip(SEG[k], ts):
        gc_html = html.escape(gc) if gc else '<span class="nada">sem lettering</span>'
        linhas += f'<tr><td class="img"><span class="t">{mm(t)}</span>{html.escape(img)}</td><td class="fala">{enfase(fala)}</td><td class="gc">{gc_html}</td></tr>'
    return f'''<section>
<div class="cab"><div><p class="eyebrow">{html.escape(g.QN[ep["q"]])} · episódio {ep["n"]}</p><h2>{html.escape(ep["titulo"])}</h2></div>
<div class="meta">{html.escape(L["nome"])}<br>cerca de {round(dur)} s · teleprompter/{k}.txt</div></div>
<table><colgroup><col style="width:25%"><col style="width:47%"><col style="width:28%"></colgroup>
<thead><tr><th>Imagem</th><th>Fala</th><th>Lettering</th></tr></thead><tbody>{linhas}</tbody></table>
</section>'''


def pagina_final():
    itens = "".join(f"<li>{html.escape(x)}</li>" for x in CONFIRMAR)
    return f'''<section>
<div class="cab"><div><p class="eyebrow">Antes do dia 19</p><h2>O que precisa estar confirmado</h2></div><div class="meta">Revisão jurídica e aprovação</div></div>
<ul class="chk">{itens}</ul>
<h3>No set</h3>
<ul class="chk">
<li>Gravar cada episódio inteiro, do gancho ao fecho, sem cortar no meio. Se errar, voltar ao começo do bloco.</li>
<li>Depois do take bom, gravar só o gancho mais uma vez, com outra intenção. É a frase que segura quem está rolando o feed.</li>
<li>Conferir o foco nos olhos e o som da lapela a cada take, antes de seguir.</li>
<li>Em cada locação, um take de 10 s em silêncio, olhando para a lente, para usar de respiro na edição.</li>
</ul>
</section>'''


def main():
    confere()
    corpo = capa() + pagina_locacao("A") + pagina_ep("A1") + pagina_ep("A2") + pagina_locacao("B") + pagina_ep("B1") + pagina_ep("B2") + pagina_final()
    doc = f'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>{CSS}</style><body>{corpo}</body></html>'
    arq = HERE / "roteiro_tecnico.html"; arq.write_text(doc)
    vetor = HERE / "roteiro_tecnico_vetor.pdf"
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(); pg.goto(arq.as_uri()); pg.wait_for_timeout(1200)
        pg.pdf(path=str(vetor), prefer_css_page_size=True, print_background=True)
        b.close()
    # páginas em imagem, como os outros PDFs de gravação (abrem em qualquer leitor)
    import pymupdf
    src = pymupdf.open(vetor); dst = pymupdf.open()
    for pgn in src:
        pix = pgn.get_pixmap(dpi=200)
        nova = dst.new_page(width=pgn.rect.width, height=pgn.rect.height)
        nova.insert_image(nova.rect, stream=pix.tobytes("jpeg", jpg_quality=88))
    dst.save(OUT / NOME_ARQ, deflate=True)
    print("páginas:", len(src))
    src.close(); vetor.unlink(); arq.unlink()
    shutil.copy(OUT / NOME_ARQ, RAIZ / "entregas" / NOME_ARQ)


if __name__ == "__main__":
    main()
