# A Sala · episódio 01 (caso Vorcaro) · provas impressas

Doze fotografias de prova para sair da pasta durante a gravação, como cópias
antigas de arquivo: preto e branco frio, preto lavado, grão, exposição
irregular, manchas de umidade, poeira, riscos, uma dobra, orelha num canto e
borda fina de papel gasta (`_build/envelhecer.py`, semente fixa por foto).
Sem sépia, que o mapa imagético veta. Na frente, só uma etiqueta de papel
"Anexo NN" colada no canto; crédito ou aviso de reconstituição em letra
miúda na borda.

Nas fotos dos ministros a dobra e os riscos ficam fora da faixa central: o
desgaste nunca passa pelo rosto de pessoa real.

- `png/`: cada prova em **10×15 cm, 300 dpi** (1181×1772), o formato padrão
  de laboratório fotográfico. Pedir papel **fosco**, que não reflete a luz do set.
- `a-sala-ep01-provas-A4.pdf`: duas por folha A4 paisagem, com marcas de
  corte, para impressora comum.

    python3 _build/gerar.py && python3 _build/render.py

## As provas
| Anexo | Imagem | Origem |
|---|---|---|
| 02 a 05 | Toffoli, Mendonça, Moraes, Gilmar | fotos institucionais ou de ato público, preto e branco frio (créditos na etiqueta e em `peças/carrossel-caso-vorcaro/fotos/CREDITOS.md`) |
| 06 | Aeroporto de Guarulhos · 18.11.2025 | cena gerada para o carrossel |
| 07 | Banco Master · liquidação decretada pelo BC | idem |
| 08 | Aplicação em CDB · taxa acima do mercado | idem |
| 09 | Celular apreendido pela Polícia Federal | idem |
| 10 | Relatório da Polícia Federal · set. 2026 | idem |
| 11 | Reunião em São Paulo · segundo a PF | idem |
| 12 | Supremo Tribunal Federal | idem |
| 13 | A sala · a cadeira vazia | idem |

As cenas são as imagens do Higgsfield já pagas no carrossel (nenhum crédito
novo). Por serem reconstituição, a etiqueta de cada uma traz "imagem
ilustrativa": ninguém toma por foto real do fato.

**Resolução:** as cenas saíram do Higgsfield em 880×1168 e os ministros
Toffoli, Moraes e Gilmar em 1744×2336. Na foto de 10×15 as cenas ficam em
~240 dpi e o Mendonça (original de 593 px) em ~160 dpi, com grão que
disfarça. Para impressão maior que 10×15, gerar as cenas em 2k.

## Antes de gravar
Continuam valendo as pendências do episódio: revisão jurídica, conflito de
interesse e reconferência dos fatos na data da gravação.
