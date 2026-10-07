# Capa padrão dos cortes do EJUPcast (1080x1920)

Padrão definido pelo Victor em 02/10/2026 a partir da capa "Direito e moral"
(corte #18, Dra. Rossana, opção A1). Todo corte sai nesse sistema.

**Elementos fixos:** fundo papel com grão e dois arcos de prata · selo
ejup/cast no alto · título em Gotham (Book itálico e Black) intercalado por
janelas arredondadas para a mesma foto, na mesma escala e alinhadas entre si
· fio com o nome do convidado (Medium, caixa alta) e o episódio · uma linha de
apoio em Light com o fim em itálico bronze.

**Regras:** frame com boca fechada e pessoa centrada na faixa larga (campo
`foco`); janela pequena só quando mostra algo da cena (gesto, microfone,
mão), senão a linha fica só com texto; título escolhido pelo Victor; o apoio
é fala verificada do corte ou leitura fiel dela; tudo dentro do recorte 3:4
da grade (y 240 a 1680).

    python3 skills/ejup-design/templates/capa-corte/gerar.py peças/<corte>/capa.json

O formato do `capa.json` está no topo de `gerar.py`. Exemplos:
`peças/corte-ejupcast-018-rossana/padrao/` e `peças/corte-ejupcast-019-exemplo/`.

**Modo reels (06/10/2026):** com `"reels": true` no `capa.json`, as faixas
ficam mais altas e o bloco ocupa a tela 9:16 inteira, dentro do recorte da
grade. Pedido do Victor para as capas de reels ("ajuste o tamanho da capa, é
pra reels"). Usado nos cortes do #18 (Eduardo) e do #19 (Harvard, Berkeley).

**Capa de reels no tamanho do feed (06/10/2026):** a capa que sobe no reels
sai em **1080x1440 (3:4)**, com `"feed": true` no `capa.json`, para aparecer
certa na grade. Regra do Victor: "é pra capa do reels, mas pra ficar do
tamanho certo tem que ser no tamanho de post do feed". O modo `reels` (9:16)
fica só para quando for pedida a tela cheia.

**Correção (06/10/2026): capa de reels = `"grade": true`.** Subir a arte em
1080x1440 não funciona: o Instagram estica a capa para 9:16 e a grade do perfil
corta as laterais e o topo (print do Victor, "ta ficando assim"). O formato
certo é 1080x1920 com a composição do feed (selo, título, faixas, fio) inteira
dentro de y 240 a 1680, que é exatamente o que a grade mostra; acima e abaixo
fica só o fundo. Na tela cheia a capa aparece inteira; na grade, sem corte.
