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

---

# Kit A4 para plano aberto (substitui as provas 10×15 no mural)

As provas 10×15 somem num plano aberto. O kit `kit-a4/` (14 folhas A4, 300
dpi) e `a-sala-ep01-kit-A4.pdf` seguem o roteiro na ordem em que as coisas
aparecem, com foto de contraste alto e recorte fechado e cartões com um dado
grande só (3 a 5 cm de altura).

    python3 _build/kit.py && python3 _build/render_kit.py

| Anexo | Folha | Momento do roteiro |
|---|---|---|
| 01 | Daniel Vorcaro (silhueta + nome) | Parte 1 · quem é quem |
| 02 | Banco Central (foto da sede) | Parte 1 |
| 03 | Guarulhos · 18.11.2025 (reconstituição) | Parte 1 |
| 04 | 1,6 milhão | Parte 1 |
| 05 | Comprovante de aplicação · 140% do CDI circulado | Parte 2 · Roberto pega o comprovante |
| 06 | R$ 250 mil · o seguro tem teto | Parte 2 · cartela do FGC |
| 07 a 10 | Toffoli, Mendonça, Moraes, Gilmar | Parte 3 |
| 11 | 14.03.2025 · reunião | Parte 3 · Mendonça |
| 12 | R$ 130 mi · contrato, segundo a PF | Parte 3 · Moraes |
| 13 | "Até a máfia tem ética." | Parte 3 · Gilmar |
| 14 | CPP, arts. 252 e 254, trechos marcados | Parte 4 |

Vorcaro entra como silhueta: a única foto dele disponível é retrato sem ato
público (item 23). O comprovante não tem nome de banco nem logotipo, como
pede o roteiro. "Até 140% do CDI": Seu Dinheiro, Investidor10, Times
Brasil/CNBC. Foto do Banco Central: Jonas Pereira/Agência Senado, CC BY 2.0.
A foto do Mendonça é pequena (593 px): em A4 fica macia; serve em plano
aberto, não em close.
