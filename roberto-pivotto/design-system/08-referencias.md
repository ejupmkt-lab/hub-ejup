# 08 · Referências de estética e texto

Referências que o time manda para orientar as peças. Servem de direção e nunca de cópia: não se reaproveita post, texto ou imagem de outro perfil. As folhas de quadros estão em `referencias/`.

---

## 1. @bragatheo · carrossel em vídeo · 26/10/2026
https://www.instagram.com/p/DexVNHlGP4E/

**O que é:** carrossel de 6 telas, cada uma um vídeo curto em preto e branco, com uma frase que continua de uma tela para a outra ("até que os seus **sábados** sejam assim", "até que suas **férias** se tornem trabalho", "até que todo mundo pergunte como **você fez isso**").

**O que aproveitar:**
- Uma frase dividida em telas: o leitor arrasta para terminar a frase.
- Hierarquia de duas alturas na mesma frase: a parte de ligação pequena e a palavra que importa grande e em negrito.
- Imagem real da rotina, em preto e branco, sem pose de estúdio.
- Legenda curta, com uma convicção pessoal.

**O que não serve para o Roberto:** a promessa de estilo de vida (helicóptero, carro, praia) e o CTA de newsletter.

## 2. @amann.dev · Reels "truque de prompt ASD-STE100" · 26/10/2026
https://www.instagram.com/reel/DexzpETtgCT/
É a referência de que o time mais gosta, também pelo conteúdo.

**Estética:** fundo claro com sombra de janela, título em duas camadas (linha pequena em serifa itálica + palavra-chave em caixa alta pesada sobre marca-texto amarelo), cards de interface limpos, um elemento por tela, troca a cada 3 ou 4 segundos, `@amann.dev` discreto no rodapé.

**Estrutura do texto:** gancho com promessa concreta ("um truque de prompt esquisito... nunca mais escreve prompt do mesmo jeito"), quatro itens numerados ("primeiro, segundo..."), autoridade com nome e fonte (Andrej Karpathy), exemplo prático testável, um limite honesto ("seguir 100% soa robótico, então 80%"), fecho que eleva o tema ("o nosso trabalho sobe de nível") e CTA de palavra-chave na DM.

**A dica que vale para os textos (ASD-STE100, a 80%):** frases curtas, palavras simples, uma ideia por linha, voz ativa. Seguir a regra até soar natural, sem ficar robótico. Aplicação nas peças do Roberto:
- Uma ideia por frase. Frase longa vira duas.
- Palavra comum no lugar do jargão; termo técnico só com a explicação junto.
- Sujeito e verbo no começo da frase.
- Nas falas de Reels, uma frase por respiração.

## 3. @amann.dev · Reels "alternativa local ao ElevenLabs" · 26/10/2026
https://www.instagram.com/reel/Desu6f3t5_q/

**Estética:** a mesma base clara, com cor de destaque própria do tema (rosa), números grandes ("R$ 0", "646 idiomas"), itens riscados (mensalidade, limite de uso), contador "01 / 04".

**Estrutura do texto:** gancho com correção ("fizeram engenharia reversa... ou melhor, não foram os caras"), dados em sequência rápida, virada no fim ("sabe essa narração? é a minha voz clonada") e o limite na legenda (licença não comercial). A legenda segue o mesmo esqueleto do método 07: fato, mecanismo, limite, pergunta e CTA.

---

## Como isso entra no sistema do Roberto

- **Texto:** a regra ASD-STE100 a 80% passa a valer para legendas, falas e telas.
- **Estrutura:** gancho concreto, itens numerados, uma fonte com nome, um limite honesto e pergunta no fim continuam iguais ao método 07; as referências confirmam o caminho.
- **Visual (a decidir com o Roberto):** as referências 2 e 3 são vídeo de motion design narrado, com tela trocando a cada poucos segundos. Isso pede produção, e o Roberto decidiu por vídeo caseiro sem lettering. O que dá para trazer sem contrariar a decisão: a hierarquia de duas alturas no título (linha pequena em serifa itálica e palavra grande), um elemento por tela e números grandes nos carrosséis e nas capas, dentro da paleta do caderno de obra (Caneta no lugar do amarelo).

## Modelo no visual das referências

`posts/modelo-referencia/artes.html` reproduz o visual do @amann.dev, aplicado ao carrossel de 26/10 e às capas dos Reels. É um modelo à parte do caderno de obra: fundo claro com sombra de janela, linha pequena em Instrument Serif itálico, título em Inter Tight 900 caixa alta com marca-texto, cartões brancos com sombra, chips pretos em JetBrains Mono, etiqueta com miras e estrelinhas. A cor do marca-texto fica em `--acento`, hoje o azul Caneta forte (`#2B57A6`) com texto branco no destaque.

Linhas e figuras das referências: linhas-guia com ponto entre objeto e rótulo (`data-ligas` na seção), rótulos pretos e azuis (`.rot`), régua no máximo (`.slider`), linha do tempo (`.tempo`), ícones riscados (`.icones` + `.xis`), curva que pivota, quadradinhos (`.quad`), cruzes (`.cruz`) e cartão de perfil (`.avatar`).

Componentes: `.lead`, `.big`, `.mk`, `.card` (com `.meta`, `.barra`), `.chip`, `.tag`, `.num`, `.lista`, `.risc`, `.input`, `.coment`, `.estrela`, `.mira`. Para gerar: `node posts/render.mjs modelo-referencia`.
