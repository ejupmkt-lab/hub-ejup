# A Sala ep. 01 · animação das telas

Pranchas do Victor (32 telas) em `pranchas/`. Teste de 02/10/2026 com as 5
telas essenciais da Parte 2 (07, 10, 12, 13, 15).

- `recortes/`: os quadros recortados das pranchas, usados como referência.
- `quadros-2k/`: os mesmos quadros refeitos em 2688x1520 (gpt_image_2_5,
  média 2k, 1 crédito cada), com cartões e etiquetas em branco para o texto
  entrar na edição.
- `clipes/13-teto.mp4` e `clipes/15-fila.mp4`: Kling 3.0 padrão, 3 s, sem som,
  4,5 créditos cada. Saem em 1276x720: o modo padrão não entrega Full HD.
- `clipes/*-movimento-codigo.mp4`: aproximação lenta feita em código a partir
  do quadro 2k, 1920x1080, sem custo.

Gasto: 5 + 9 = 14 créditos (saldo 14,66 → 0,66).

## Versão com ação (02/10/2026, aprovada para gerar pelo Victor)

Cada tela com quadro de início e de fim, para a IA executar a ação do roteiro.

- `quadros-fim/`: quadros de fim (e o início sem caixa da 13), gpt_image_2_5
  alta 2k, 2,75 créditos cada, 5 imagens.
- `clipes-acao/`: Kling 3.0 pro, 5 s, 1912x1080, sem som, 8,75 créditos cada.
  - 07 · a chave passa de uma mão para a outra (2ª tomada)
  - 10 · as moedas deslizam até o banco
  - 12 · as moedas dos bancos caem na tigela do FGC
  - 13 · a caixa de acrílico desce e deixa três pilhas de fora
  - 15 · a câmera percorre a fila e para no cofre (2ª tomada)
  - `*-take1-descartado.mp4`: primeiras tomadas da 07 (chave solta no ar) e
    da 15 (silhuetas deformando), guardadas só como registro.

Gasto desta etapa: 13,75 + 43,75 + 17,5 (refações) = 75 créditos.

## Versão final (02/10/2026)

`clipes-final/`: os cinco clipes em 1920x1080, 24 fps, com zoom lento em
todos (nenhum de câmera parada) e o texto aplicado sem Higgsfield
(`_build/finalizar.py`): LIQUIDANTE e BANCO CENTRAL nos cartões da 07, FGC na
etiqueta da tigela da 12, em Gotham, impressos por multiplicação para a
sombra da mão passar por cima da tinta.

## Telas animadas em código (sem IA generativa)

- `telas-codigo/fonte/NN.png`: quadros recortados das pranchas (~480 px).
- `_build/preparar_telas.py`: Real-ESRGAN x4 (CPU) e mapa de profundidade
  (Depth Anything V2 Small). Saídas em `telas-codigo/up/` e `profundidade/`,
  fora do git porque se refazem com o script.
- `_build/motor.py`: câmera 2,5D com paralaxe, foco que muda, luzes, poeira,
  grão e vinheta; fio dourado e alfinetes.
- `_build/cenas_p1.py`: prancha 01 (01, 02, 03, 04, 06, 08). A 05 é a vinheta.
- Para refazer em alta: trocar `telas-codigo/up/NN.png` pela imagem nova (mesmo
  enquadramento), apagar `profundidade/NN.png` e rodar de novo os dois scripts.
