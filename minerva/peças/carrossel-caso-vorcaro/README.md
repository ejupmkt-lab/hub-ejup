# Carrossel · "O caso Vorcaro"

Treze telas 1080×1440, derivadas do roteiro do episódio 01 de A Sala
(`docs/formatos/a-sala-ep01-caso-master.md`), na linha cinematográfica
definida em `peças/carrossel-a-sala`.

## Imagens e custo

Geradas no Higgsfield com o modelo gpt_image_2_5, **opção B aprovada pelo
Victor antes da geração**: 9 imagens em qualidade baixa 1k (0,25 crédito
cada), a da Sala em qualidade média 2k com a foto real como referência
(1 crédito) e 1 recorte de fundo para a capa (1 crédito). **Total: 4,25
créditos.**

Nenhum rosto real. Os nomes ficam no texto, com fonte; as imagens são
objetos (aeroporto vazio, porta de banco, comprovante, celular, plenário,
cadeira, xícaras, contrato).

## Regras de conteúdo aplicadas

- Todo nome próprio com fonte no rodapé e com o verbo certo ("segundo a
  PF", "investigado").
- Toda acusação citada acompanhada da resposta de quem foi citado.
- Divergências entre fontes resolvidas pelo mínimo comum ("cerca de R$ 130
  milhões", "março de 2026"; valor do FGC não citado).
- Tela 7 deixa claro que nenhum dos três ministros é investigado por crime
  neste caso.

## Antes do gate humano

1. Revisão jurídica do texto final (cita três ministros do STF e a mulher de
   um deles).
2. Confirmação de ausência de conflito de interesse.
3. Reconferir os fatos na data da publicação: o caso está em andamento.

## Reconstruir

```
python3 _build/preparar.py
python3 _build/gerar.py
python3 _build/render.py
```
