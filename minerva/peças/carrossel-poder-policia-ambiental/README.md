# Carrossel — "O poder de polícia ambiental municipal"

Nove telas 1080×1440, casadas com as capas do mesmo artigo
(`../capa-artigo-poder-policia-ambiental/`). Autor: Leonardo Pivotto.

```
python3 _build/tratar_fotos.py   # duotone das fotos (só ao trocar foto)
python3 _build/gerar.py
python3 _build/render.py         # limpa telas/, exporta e confere medidas
```

## O sistema
Montado nas regras de `skills/ejup-design/CARROSSEL.md`, que foram extraídas
do carrossel de superendividamento (o aprovado) **depois de duas versões
reprovadas desta peça**. Ler aquele arquivo antes de mexer aqui.

O que a segunda versão errou, e que aqui está corrigido: scrim cobrindo a foto
inteira em vez de só a parte de baixo; texto centrado por cima do assunto da
foto em vez de ancorado no terço inferior; título todo em Black em vez de
pesos mistos na mesma frase; corpo com bandeira em vez de justificado; fundo
claro branco com uma frase solta em vez de papel com lista e cartões; fio de
1px apagado no rodapé em vez de linha de 3px com nó atravessando por cima da
foto; dado em texto corrido em vez de anel.

**A linha muda de nível dentro da margem de 80px**, à esquerda, e atravessa a
área de conteúdo sempre reta. É o que permite ela passar por cima da foto sem
cortar texto. As alturas estão no array `LINHA` em `gerar.py`: alta nas telas
de foto (logo acima do bloco), baixa nas claras (embaixo do bloco).

## Correções de fato aplicadas ao roteiro
- **ADI 4.757 foi julgada em 12/12/2022**, não em 2023.
- **Lei 15.190/2025** está **em vigor desde 04/02/2026** e **generalizou** a
  Licença por Adesão e Compromisso; não criou a modalidade. O nome legal é
  *Licença*, não *Licenciamento*, por Adesão e Compromisso.

## A verificar antes de publicar
- **O número do Idema (13 de 167).** Os domínios de imprensa e do órgão estão
  bloqueados na saída de rede desta sessão. Confirmar a data-base.
- **A fonte normativa do Conselho Municipal de Meio Ambiente.** O roteiro
  atribui os três requisitos à LC 140/2011. A exigência de órgão capacitado
  está lá; a do conselho aparece também em Resolução CONAMA 237/1997 e em
  normas estaduais. Numa peça sobre rigor institucional, vale citar a fonte
  certa de cada um. O diagrama por isso não aponta artigo e alínea; as
  citações da Constituição (art. 23, VI e art. 30, I) são as únicas
  pinçadas, porque dessas há certeza.

## Charter aplicado
Emoji de mão virou seta · sem travessão entre palavras · dourado só sobre
escuro, bronze sobre claro · trilha de progresso sem número de slide.

## Armadilhas resolvidas (não repetir)
- **Acento cortado em `<text>` de SVG.** O rótulo do primeiro trilho do fluxo
  ficava a y=30 com corpo 20; o acento do "Á" saía do viewBox e desaparecia
  **sem erro nenhum**. Rótulo de figura precisa de meia altura de corpo de
  folga acima.
- **Texto de figura estourando a caixa.** "OS TRÊS: O MUNICÍPIO LICENCIA" não
  cabia em 420px. SVG não quebra linha sozinho: ou se mede, ou se divide em
  duas linhas, que foi o caminho.
- **Duotone cheio mata vegetação.** O mangue virava floresta congelada. A foto
  de natureza mistura 55% de duotone com o original e mantém verde suficiente.
- **Foto de banco com texto legível em inglês** numa peça sobre direito
  brasileiro. A do formulário foi fechada na mão e na caneta até o texto
  impresso sair do quadro.
- **Excesso de elementos por tela.** As telas 6 e 11 tinham título, texto,
  foto e diagrama; o ajuste automático encolhia o corpo a 54px. A correção é
  editorial, não tipográfica: cortar o parágrafo que o diagrama já conta.
