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

**Fotos reais dos citados** (Toffoli, Mendonça, Moraes, Gilmar Mendes),
todas em registro institucional ou de ato público, com crédito no rodapé
(ver `fotos/CREDITOS.md`). Tratadas em código como **cópia impressa de
dossiê**: preto e branco frio, grão, borda de papel, clipe ou fita e a
etiqueta "Anexo 02 a 05" (`_build/provas.py`). O rosto não é alterado, e
nenhum crédito foi gasto nisso.

O retrato de Daniel Vorcaro ficou de fora: é retrato sem evento
identificado, e não registro de ato público (item 23). Só entra com
decisão expressa do Victor.

As imagens geradas cadeira, xícaras e contrato ficam como reserva no
código (caem de fundo se faltar a foto real).

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
