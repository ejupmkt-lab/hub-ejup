# Carrossel — Startup Summit 2026 · Florianópolis

Doze telas (1080×1440) sobre a viagem de Roberto e Leonardo a Santa Catarina.

**Não é peça da EJUP.** É o perfil **pessoal** dos dois, então o charter da marca
não se aplica: paleta, assinatura e tom são próprios.

**Sem travessão entre palavras.** Vale aqui também, por decisão do Victor: dá
cara de texto de IA. Os quatro que existiam viraram vírgula ou sumiram, sem
mudar o sentido. Vale para as próximas revisões do texto.

## Como usar
1. Abra `carrossel.html` no navegador (funciona offline, sem servidor).
2. **Arraste uma foto** para a área de cada tela, ou clique para escolher.
3. Depois de solta, **arraste dentro da foto** para reenquadrar e use o
   controle de zoom abaixo da tela.
4. Exporte: **PNG** (por tela ou todas) ou **Salvar PDF** (12 páginas no
   tamanho exato).

O PNG sai por SVG + `foreignObject`: a tela é serializada com o próprio CSS
(fontes Gotham já embutidas em base64) e desenhada num canvas 1080×1440. Sem
biblioteca externa, porque a peça precisa rodar offline. Se algum navegador
recusar, o botão avisa e o PDF continua valendo.

## Direção
A referência enviada (carrossel do Sebrae SC / Ousaria) forneceu a **gramática
visual**, não a paleta:

- **chanfro** cortando cantos de foto e painel;
- **título em caixa alta com dois pesos** (Black + Light na mesma linha);
- **caixa contornada** com chanfro embaixo e um **quadrado** no canto;
- **etiqueta girada** sobre a borda do painel, como adesivo.

O que mudou em relação à referência: paleta própria (papel quente, azul
profundo, latão) no lugar do vermelho/bordô do Sebrae, e bem mais respiro —
o texto aqui é muito mais denso que o da referência, que é quase todo legenda
curta. Cada tela ganhou um **título curto em caixa alta** derivado do conteúdo,
para dar uma camada escaneável que o texto corrido sozinho não oferece.

## Revisão ortográfica
O texto veio dos autores e passa por revisão aqui. Já corrigido: início de frase
em maiúscula no fecho da tela 7, os travessões, e **Florianópolis** com acento na
assinatura de rodapé (o nome aparece em três lugares — capa, tela 2 e rodapé;
conferir os três).

## Estrutura de cada tela
título → linha de abertura (itálico) → corpo → **foto** → caixa com a linha de
fecho. Não há numeração de slide.

## Cinco enquadramentos de foto
A primeira versão repetia o mesmo corte em todas as telas e ficou monótona.
Agora o campo `lay` de cada item do `CONTEUDO` escolhe o enquadramento, e a
ordem alterna para que **duas telas vizinhas nunca repitam o mesmo**:

| `lay` | corte |
|---|---|
| `banda` | foto larga entre o texto e a caixa, chanfro em cima à esquerda |
| `topo` | foto sangrando pelo alto, chanfro embaixo à direita |
| `colDir` | foto vertical à direita, sangrando na borda; texto na coluna |
| `colEsq` | espelho do anterior |
| `fundo` | foto ocupando a tela inteira, texto por cima com scrim |
| `painel` | capa e fecho: foto ao fundo, painel escuro chanfrado por cima |

Ordem atual: painel · topo · banda · colDir · fundo · banda · colEsq · topo ·
banda · colDir · fundo · painel.

## Editar o texto
Está no array `CONTEUDO`, no início do `<script>` de `_build/template.html`.
Depois de mexer: `python3 _build/build.py`.

## Armadilhas resolvidas (não repetir)
- **`blob:` no `<img>` do SVG contamina o canvas.** Dentro do artifact (origem
  opaca) e em `file://`, `toBlob` morria em `SecurityError` e nenhum PNG saía.
  A URL do SVG tem de ser `data:image/svg+xml;charset=utf-8,` + `encodeURIComponent`.
- **O SVG não tem `<body>`.** A regra de fonte estava presa a `body`, então
  dentro do `foreignObject` o texto caía em serif — layout e cores certos,
  tipografia errada. A regra vale para `body,.slide`.
- **Screenshot não prova download.** As duas falhas acima passaram pelo
  `render.py` antigo, que só tirava screenshot. Agora `--fotos` chama o mesmo
  `pngBlob()` do botão nas 12 telas e compara com o screenshot (diferença média
  acima de 12 reprova; com o bug da serif dava 17, hoje dá 0,7).
- **`clip-path` corta `border`.** A caixa contornada é feita com duas camadas
  recortadas: a de baixo pinta a linha, a de cima devolve o fundo 2px para
  dentro.
- **`clip-path` também corta o que transborda.** A etiqueta girada, colocada
  dentro do painel, sumia. Precisou de um contêiner irmão sem recorte.
- **A prévia mostra as telas a 50%.** Ao medir e capturar é obrigatório
  desligar essa escala: `getBoundingClientRect` devolve valores em escala e o
  screenshot sairia 540×720 em vez de 1080×1440. E como o template é conteúdo
  puro, o `<style>` da peça vive no **body** — um `add_style_tag` no head perde
  na ordem do documento, então o override tem de ser anexado ao fim do body.
- **`scale()` exige número sem unidade.** `calc(540px / 1080)` devolve `px`, a
  regra é descartada em silêncio e a tela sai em tamanho cheio, cortada pela
  moldura. A escala é calculada em JS.
- **Chanfro de canto precisa de 5 pontos no `polygon()`.** Com 4, a diagonal
  atravessa a foto inteira em vez de cortar só o canto.
- **`<em>` dentro do painel escuro** herdava a cor de texto do fundo claro e
  ficava ilegível. Destaque em fundo escuro clareia, não escurece.

## PNG com fundo transparente
`python3 _build/exportar_transparente.py` gera `png-transparente/` com as 12
telas em RGBA. Transparente = o campo de papel e o espaço da foto; painel
escuro, scrim, caixa, etiqueta e texto continuam opacos. Serve para colocar a
foto por baixo num editor. Duas ressalvas que vão no LEIA-ME do zip: as telas
1, 5, 11 e 12 carregam o scrim sobre a tela inteira, e nas telas claras o
texto é azul-escuro/cinza, feito para papel — sobre foto escura ele some.

## Arquivos
- `carrossel.html` — a peça, pronta para uso.
- `_build/template.html` — fonte (conteúdo + layout + interação).
- `_build/build.py` — embute as fontes Gotham e gera o HTML final.
- `_build/render.py` — renderiza as 12 telas para conferência e acusa texto
  estourando (`--fotos` injeta uma foto sintética e ainda exercita o download).
- `_build/exportar_transparente.py` — as 12 telas em PNG com fundo transparente.
