# Carrossel — "O poder de polícia ambiental municipal"

Oito telas 1080×1440, casadas com as capas do mesmo artigo
(`../capa-artigo-poder-policia-ambiental/`): mesmo fundo navy, mesmo dourado,
mesma Gotham. Autor: Leonardo Pivotto.

`python3 _build/gerar.py && python3 _build/render.py` gera o HTML e exporta
`telas/tela-01..08.png`. O render reprova texto encostando no logo, quadro
fora de 1080×1440 e copy que force o ajuste automático ao limite.

## Correções de fato aplicadas ao roteiro
- **ADI 4.757: julgada em 12/12/2022**, não em 2023. O roteiro dizia 2023.
  Data confirmada em fontes secundárias (Conjur, MPPR, Informativo STF 1079).
  O acórdão foi publicado depois, o que talvez explique a confusão, mas em
  peça assinada por sócio-fundador a data do julgamento é o que se cita.
- **Lei 15.190/2025**: sancionada em 08/08/2025 com 63 vetos e **em vigor desde
  04/02/2026**. O roteiro tratava a lei como novidade de 2025 sem dizer que já
  está valendo, o que enfraquecia o argumento. Também: a lei **generalizou** a
  Licença por Adesão e Compromisso, que já existia em normas estaduais e do
  CONAMA; ela não criou a modalidade. E o nome legal é **Licença** por Adesão e
  Compromisso, não Licenciamento.

## Não verificado
O número do Idema (13 de 167 municípios) não foi possível conferir: a saída de
rede desta sessão bloqueia os domínios de imprensa e do órgão. **Confirmar a
data-base antes de publicar** e, de preferência, citá-la na peça.

## Charter aplicado
- O emoji de mão do roteiro virou a **seta da pílula de chamada**. Emoji como
  muleta de tom é proibido; a seta faz o mesmo trabalho e é elemento de marca.
- Sem travessão entre palavras.
- Dourado só sobre o navy, nunca em fundo claro.
- Trilha de progresso de oito segmentos, **sem número de slide**.

## Estrutura de cada tela
rótulo em dourado (caixa alta, tracking largo) · título em Black com o trecho
decisivo em dourado Light · corpo em Light prata · **fecho** com filete
dourado à esquerda, que é a linha que fecha o raciocínio e prepara a próxima
tela. A tela 7 troca o título por um número grande; a 8 acrescenta CTA,
autoria e o bloco de assinatura da marca.

O corpo se ajusta sozinho entre 58 e 100px e fica centrado entre a trilha e o
logo, então uma tela mais densa não estoura nem exige acerto manual.
