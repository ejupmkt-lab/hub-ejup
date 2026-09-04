# LP — cursos.ejup.com.br

Canvas de design com a landing page em duas larguras: **Main.dc.html** (1440) e
**Mobile.dc.html** (390).

Canvas publicado: https://claude.ai/code/artifact/5c28be05-ffc8-40d9-bd61-11cdd4bdf95d

## O que é e o que não é
- É **mockup estático**: nenhum controle funciona, não há formulário ligado a
  nada. Serve para aprovar direção, hierarquia e copy antes de virar código.
- Não é uma cópia da LP de referência (`lauradireitodigital.com/pt/imersao-lt`).
  Esse endereço e o `cursos.ejup.com.br` **não abriram nesta sessão** — saída de
  rede bloqueada por política, não erro contornável. A página foi construída
  sobre o design system da própria EJUP, não sobre o estilo da referência.
- **Tudo entre [colchetes] é fato pendente**: nome do programa, data, carga
  horária, formato, valor e os nomes dos professores. Nada disso foi inventado.

## Estrutura
cabeçalho · herói · tensão · pilares · percurso · professores · seleção ·
oferta · rodapé.

A copy é da marca, não genérica: a linha do manifesto ("A EJUP existe para
ocupar o espaço que a pressa abandonou"), os três fundamentos (tradição sem
mofo · inovação sem vulgarização · digital sem superficialidade) e a linha de
corte do anti-público ("Se isso parece exigente demais, a EJUP não é para
você") como seção de seleção — que é o que substitui, no charter, o bloco de
escassez que uma LP de lançamento costuma ter. Sem contador, sem "últimas
vagas", sem promessa de resultado.

## Editar
Não editar os `.dc.html` na mão. As duas larguras saem das **mesmas funções de
seção** em `_build/gerar.py` — é lá que se mexe, para os dois lados não
divergirem:

```
python3 _build/gerar.py     # regenera Main.dc.html e Mobile.dc.html
```

Depois, re-semear o canvas e republicar o mesmo arquivo.

## Medidas reais (Chromium)
1440 → 5061px · 390 → 6549px. O `canvas.json` declara molduras maiores
(5300 e 6700): sobra de moldura só pinta o fundo, falta **corta o rodapé**.
Se a página crescer, medir de novo antes de re-semear.
