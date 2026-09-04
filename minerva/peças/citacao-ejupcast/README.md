# Citação do EJUPcast — a arte branca com a frase do convidado

Peça semanal, 1080×1440. Reconstruída a partir da arte do episódio #016 (feita
no Claude Design), agora como modelo que se regenera a cada episódio.

## Gerar a próxima

```
python3 _build/gerar.py \
  --episodio 018 \
  --nome "Fulano de Tal" \
  --funcao "Cargo, Instituição" \
  --frase "Começo da frase <b>com o destaque em negrito</b>, e o resto."
python3 _build/render.py          # exporta o PNG e confere as medidas
```

Sem argumentos, `gerar.py` usa o bloco `CITACAO` no topo do arquivo (hoje o
#017). O `<b>` marca o destaque; `&nbsp;` entre palavras impede que o destaque
quebre no meio da linha.

## Decisões que valem para todos os episódios
- **O corpo da frase se ajusta sozinho.** Uma busca binária acha o maior corpo
  entre 34 e 66px que ainda deixa a frase inteira acima do rodapé. O teto é
  baixo de propósito: uma frase curta poderia crescer muito e a série ficaria
  desigual de uma semana para a outra.
- **A citação fica centrada no espaço acima do rodapé.** Aspas e frase formam
  um bloco só, com margens automáticas em cima e embaixo, então a sobra se
  divide igual e a frase não cola no topo — vale para frase de qualquer
  tamanho, sem acerto manual.
- **Acento é bronze `#9b6b26`, não dourado.** O fundo é claro, e dourado sobre
  branco dá 1,8:1 — ilegível. Bronze dá 4,6:1. Vale para a régua e para o
  rótulo do episódio.
- **Frase em Gotham Light, destaque em Bold**, nome em Bold, função em Light
  cinza, rótulo em Medium caixa alta com tracking 0,14em.
- **O grafismo do canto é o próprio símbolo** ampliado em prata a 42%. Ele é
  assinatura, não ilustração: se disputar atenção com a frase, diminuir.
- O `render.py` reprova se a frase invadir o rodapé, se a arte sair fora de
  1080×1440 ou se o logo chegar a menos de 60px da borda.

## Arquivos
- `citacao-0NN.html` / `.png` — a arte de cada episódio.
- `_build/template.html` — layout, tokens e o ajuste de corpo.
- `_build/gerar.py` — embute as fontes e os logos, troca o conteúdo.
- `_build/render.py` — exporta o PNG e confere as medidas.
