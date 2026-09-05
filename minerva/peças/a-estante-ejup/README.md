# A Estante EJUP — quatro stories por indicação

Stories 1080×1920, fundo escuro, ouro como acento (9,5:1 sobre navy — sobre
fundo claro seria 1,8:1 e por isso não existe versão clara desta série).

Edições:
- `utopia-para-realistas/` — só os PNGs; foi feita no Claude Design, sem fonte.
- `tribos/` — Seth Godin. Primeira edição gerada por este modelo.

## Gerar a próxima
Edite o dicionário `LIVRO` em `_build/gerar.py` e rode:

```
python3 _build/gerar.py && python3 _build/render.py
```

`gerar.py` monta o HTML, `render.py` exporta `estante-01..04.png` e reprova se
o texto encostar no logo, se o quadro sair de 1080×1920 ou se a copy for tão
longa que o ajuste automático chegue ao limite.

## A capa do livro
Se existir `capa.jpg` (ou `.png`) na pasta da edição, ela é embutida. Sem o
arquivo, o lugar dela sai como moldura pontilhada e a peça fica pronta assim —
é só soltar a capa e rodar de novo. **Esta sessão não consegue baixar imagem
nenhuma** (saída de rede bloqueada por política), então a capa precisa vir de
fora.

## Decisões da série
- **A escala no topo é o fio que costura os quatro stories**: a mesma ideia
  avançando por quatro estágios. Ela sai do argumento do livro, não é enfeite —
  em *Tribos* o caminho é pessoas → propósito → liderança → tribo. Em *Utopia
  para Realistas* era a janela de Overton. Cada indicação pede a sua.
- **O corpo se ajusta sozinho.** Os tamanhos são em `em` sobre `.conteudo`, e o
  script encolhe esse número até o texto caber acima do logo. Um story mais
  longo que os outros não estoura nem exige acerto manual.
- **O conteúdo é centrado** entre a escala e o logo. Sem isso ele cola no topo
  e a sobra toda cai embaixo, justamente onde o Instagram cobre com a barra de
  resposta.
- **Sem emoji.** O 👉 do roteiro virou a seta da pílula de chamada, que já era
  o gesto da série. O charter proíbe emoji como muleta de tom; a seta faz o
  mesmo trabalho e é elemento de marca.
- **Ouro é acento, não fundo.** Um título inteiro em ouro perde o contraste
  hierárquico: destaque no máximo o fecho da frase.
