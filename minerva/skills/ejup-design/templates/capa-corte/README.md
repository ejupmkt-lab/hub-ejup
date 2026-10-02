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
