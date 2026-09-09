# Carrossel — "O poder de polícia ambiental municipal"

Doze telas 1080×1440, casadas com as capas do mesmo artigo
(`../capa-artigo-poder-policia-ambiental/`). Autor: Leonardo Pivotto.

```
python3 _build/tratar_fotos.py   # duotone das fotos (só quando trocar foto)
python3 _build/gerar.py
python3 _build/render.py         # exporta telas/ e confere as medidas
```

## Os quatro dispositivos que fazem disso um carrossel, e não oito cartazes

**1. Fio condutor.** Uma linha dourada entra em cada tela na altura exata em
que saiu da anterior. Passando o dedo, é uma linha só atravessando as doze.
As alturas estão no array `FIO` em `gerar.py`; elas vivem na faixa 1150 a 1300
de propósito, onde não cruzam texto nem diagrama. O `render.py` reprova se o
conteúdo descer até o fio. **É o mesmo princípio da linha contínua do
carrossel de superendividamento, que foi aprovado.**

**2. Ritmo escuro/claro.** As telas 3, 7 e 9 são brancas e carregam uma frase
sozinha. São o respiro entre blocos densos, e no fundo claro o acento vira
bronze, nunca dourado (dourado sobre branco dá 1,8:1).

**3. Diagramas.** Cinco, em `_build/figuras.py`, todos mostrando mecanismo:
federação e a soma com o interesse local · os três requisitos e o desvio
quando falta um · **o fluxo comparado, que é o coração do argumento** (no rito
ordinário o controle está na análise prévia; na LAC, depois da licença) ·
matriz de 167 quadrados com 13 em dourado · responsabilidade em três frentes.

**4. Fotos em duotone navy.** Sangradas no fundo (telas 1 e 8) e em caixa
dentro da coluna (telas 2 e 11), com filete dourado no alto. Fontes e critério
em `fotos/CREDITOS.md`.

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
