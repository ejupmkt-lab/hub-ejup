# Carrossel — Startup Summit 2026 · Florianópolis

Doze telas (1080×1440) sobre a viagem de Roberto e Leonardo a Santa Catarina.

**Não é peça da EJUP.** É o perfil **pessoal** dos dois, então o charter da marca
não se aplica: paleta, assinatura e tom são próprios. A regra da EJUP que proíbe
travessão entre palavras também não vale aqui — o texto é de autoria deles e foi
mantido como escrito.

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

## Estrutura de cada tela
título → linha de abertura (itálico) → corpo → **foto** → caixa com a linha de
fecho → rodapé. Capa e fecho invertem: foto sangrando no fundo, painel escuro
chanfrado por cima.

## Editar o texto
Está no array `CONTEUDO`, no início do `<script>` de `_build/template.html`.
Depois de mexer: `python3 _build/build.py`.

## Armadilhas resolvidas (não repetir)
- **`clip-path` corta `border`.** A caixa contornada é feita com duas camadas
  recortadas: a de baixo pinta a linha, a de cima devolve o fundo 2px para
  dentro.
- **`clip-path` também corta o que transborda.** A etiqueta girada, colocada
  dentro do painel, sumia. Precisou de um contêiner irmão sem recorte.
- **A prévia mostra as telas a 50%.** Ao medir e capturar é obrigatório
  desligar essa escala: `getBoundingClientRect` devolve valores em escala e o
  screenshot sairia 540×720 em vez de 1080×1440.
- **`<em>` dentro do painel escuro** herdava a cor de texto do fundo claro e
  ficava ilegível. Destaque em fundo escuro clareia, não escurece.

## Arquivos
- `carrossel.html` — a peça, pronta para uso.
- `_build/template.html` — fonte (conteúdo + layout + interação).
- `_build/build.py` — embute as fontes Gotham e gera o HTML final.
- `_build/render.py` — renderiza as 12 telas para conferência e acusa texto
  estourando (`--fotos` injeta uma foto sintética só para a prova).
