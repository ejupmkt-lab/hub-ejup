# Capa — "A legitimidade da investigação defensiva no processo penal"

Capa para a coluna jurídica do site, 1600×900. Autores: Thiago Praxedes de
Vasconcelos e Thiago de Moura Correia.

**Status: rascunho aguardando foto real dos autores.** O corte enviado pelo
usuário chegou só como imagem na conversa, sem arquivo anexado — não há como
extrair os pixels reais, e não se deve gerar rosto sintético no lugar de duas
pessoas nomeadas e reais.

Para finalizar: salvar a foto real dos dois advogados como
`foto-autores.jpg` (ou `.png`) nesta pasta e rodar `_build/build.py` de novo
— o template já tem o slot pronto e detecta o arquivo automaticamente.

## O que foi corrigido em relação ao rascunho original
- Painel bege (fora das 8 cores do MIV) → fundo navy/aço/tinta, único degradê.
- Título em serifada → Gotham Black 900, como manda a tipografia da marca.
- Corte diagonal duro entre os dois blocos → costura fina dourada, com
  gradiente suave fundindo a foto ao fundo.
- Coluna decorativa recolocada como friso no topo, longe do texto (a área de
  respiro em volta do título não pode ser invadida).
- Foto de pessoa real mantida em cor natural — duotone navy é tratamento para
  imagem de banco/ilustrativa, não para retrato de gente nomeada.

## Arquivos
- `capa.png` — a peça em 1600×900 (com placeholder de foto).
- `capa.html` — versão viva, com Gotham e logo embutidos.
- `_build/` — motor: `template.html`, `build.py`, `render.py`.
