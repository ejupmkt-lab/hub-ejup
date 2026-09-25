# Continuidade da Minerva · sessão de 17 a 25/09/2026

Tudo o que foi decidido, produzido e aprendido na conversa com o Victor entre
17 e 25/09/2026. Complementa o `CLAUDE.md` (a lei) e o `HANDOFF-EJUP.md` (a
continuidade anterior). Repositório: `victorbarrosoc-hub/EJUPMinerva`, branch
`claude/ejupminerva-repo-setup-j1rhgg`.

---

## 1. Regras de trabalho com o Victor (valem para toda peça)

**Duras, em vigor:**
- **Crédito do Higgsfield só com aviso** (instrução de 23/09, já no `CLAUDE.md` §8).
  Antes de gerar ou editar, dizer quantas imagens ou vídeos, qual modelo e quantos
  créditos, e esperar o "pode". Consultar preço e saldo é livre.
- Sem travessão entre palavras. Nunca a figura "não é X, é Y" nem variantes.
- Nada é publicado sem o Roberto Pivotto. A Minerva entrega arquivo e legenda.

**Gosto do Victor, aprendido na prática:**
- Nada de rótulo de tema nem número de slide no alto das telas ("cara de IA").
- Nada de espaço vazio demais, nem composição com cara de colagem.
- Nada de imagem repetida entre slides, foto cortando cabeça ou pessoa, ou palavra
  solta sem frase.
- Poucas telas e poucas frases. Uma frase forte por tela vence três médias.
- Gancho em toda tela e gancho forte na capa, visual e de texto.
- Quem fala na foto tem que ser quem fala no texto.
- Quando ele manda uma grade de referência de volta, é essa versão que vale.
- Luz do set real de A Sala é **daylight** (branca). Luminária amarela só sobre o mural.

**Retorno do Roberto (cliente):** reprovou um carrossel por parecer "colagem de
escola", aprovou o estilo do slide 5 do EJUPcast #018 (painel navy com facetas +
foto em cartão arredondado sobreposto) e sugeriu esse visual também para artigos.

---

## 2. O que foi produzido

| Peça | Pasta | Estado |
| --- | --- | --- |
| Carrossel "Quem pode julgar um ministro do STF" | `peças/carrossel-quem-julga-ministro/` | 17 telas, **aprovado**. Conexões entre telas por carimbo, arco, recortes de artigo |
| Carrossel "A Sala" (explica o quadro) | `peças/carrossel-a-sala/` | 10 telas, **peça-modelo** cinematográfica. Imagens do Higgsfield com a foto real do set como referência |
| Roteiro A Sala ep. 01 · caso Vorcaro | `docs/formatos/a-sala-ep01-caso-master.md` | Roteiro do Roberto, com nomes, fontes e checagens antes de gravar |
| Carrossel "O caso Vorcaro" | `peças/carrossel-caso-vorcaro/` | 13 telas; fotos de ministros tratadas como prova de dossiê confidencial. `fotos/CREDITOS.md` |
| Carrossel EJUPcast #018 | `peças/carrossel-ejupcast-018/` | 6 telas no sistema do "slide 5". Nicácio Carvalho e Eduardo Pacheco, host Dra. Rossana Fonseca |
| Capa do corte do EJUPcast #18 (Rossana) | `peças/corte-ejupcast-018-rossana/` | 1080×1920. Escolhida a **A1**: título "Direito e moral", faixas da mesma foto, selo EJUPcast no alto |
| Vinheta de A Sala | `docs/formatos/a-sala-vinheta/` | v2 em Full HD, 13 s, trilha "Shades" (Ziv Moran), logo A no final |
| Logo "A Sala" | `docs/formatos/a-sala-vinheta/logo/` | Escolhido o **A**: "A SALA" Gotham Light espaçado, moldura fina, fio dourado entre dois alfinetes. PNG com fundo e transparente, animado em chroma (MP4) e com alfa (ProRes 4444 .mov) |
| Padrão de edição do EJUPcast | Doc: https://claude.ai/code/artifact/bb0d513e-8fcc-4716-868a-bc420fc4e9e0 · `docs/formatos/ejupcast-edicao/` | Padrão completo, com valores do projeto do ep. 18 ainda a preencher |
| Briefing do EJUPcast #19 (Marco Bruno) | `docs/formatos/ejupcast-edicao/ejupcast-ep19-briefing-completo.md` | Pronto para uma sessão no computador do Victor |
| Briefing e roteiro da vinheta | Doc: https://claude.ai/code/artifact/b361db36-2919-48f2-831d-8f2bb63a92f7 | Versão 1 (desenho técnico) e versão 2 (mural de provas) |

---

## 3. Sistemas visuais novos

**Sistema do cartão (EJUPcast, aprovado pelo Roberto).** Fundo papel `#ecebe7`;
painel navy de cantos 24 px com facetas geométricas em SVG no alto (left/right/top
40 px); foto em cartão arredondado sobreposta ao painel; título Gotham Black em
navy com "Episódio #NN" em Book cinza acima; texto alinhado em 112 px; botão pill
navy com texto dourado. Logo "ejup /cast" no painel. Última tela com o **selo
EJUPcast** (logotipo ejup + /CAST num aro fino com dois pontos dourados, como na
TV do estúdio), montado em código a partir do SVG oficial com viewBox recortado
`352 690 282 118` (só a palavra "ejup").

**Sistema cinematográfico (A Sala).** Preto e navy, luz dura, grão, papel de
dossiê, fio dourado ligando provas, símbolo EJUP no papel de cortiça. Fotos reais
tratadas como impressão de dossiê (borda de papel, clipe ou fita, "Anexo 0X").

**Faixas de foto (capa de corte).** Adaptado de referência externa: título grande
com faixas arredondadas entre as linhas. As faixas são **janelas da mesma foto,
na mesma escala e alinhadas**, senão o Victor reprova ("não faz sentido um
recorte com o outro"). Bloco centrado na altura para caber no recorte 3:4 do feed.

---

## 4. O quadro A Sala

- Set montado no estúdio em 21/09: sala escura, mesa clara, **duas cadeiras** (a
  do apresentador e a de quem assiste, de frente para a câmera), mural de cortiça.
  HD e disquete foram só objetos de cena; na mesa vão provas, fotos, pasta confidencial.
- Abertura: Roberto diz "Eu preciso confessar uma coisa." e a frase do tema.
- Episódio 1: caso Vorcaro (Banco Master), roteiro com nomes e fontes. Antes de
  gravar: revisão jurídica, conflito de interesse e direito de imagem (item 23).
- Vinheta v2 (13 s): mural em macro → fio dourado → pasta "CONFIDENCIAL" →
  silhueta diante do mural → mesa de cima → sala vazia → logo A. Trilha: trecho
  final de "Shades" (37,5 s até o fim), para o fechamento coincidir com o logo.
- Luz: daylight no set; luminária amarela só sobre o mural; nenhuma luminária
  sobre a mesa aparecendo.

---

## 5. Custos do Higgsfield (referência)

| Uso | Modelo | Custo |
| --- | --- | --- |
| Imagem | gpt_image_2_5, low 1k | 0,25 |
| Imagem | gpt_image_2_5, medium 2k | 1 |
| Imagem | gpt_image_2_5, high 2k | 2,75 |
| Vídeo 3 s, 1080p, sem som | kling3_0 pro | 5,25 |
| Vídeo 3 s | cinematic_studio_video_v2 pro | 4,5 |
| Vídeo 4 s, 1080p | seedance_2_5 | 48 |

Saldo em 25/09: **364,75**. Gastos da vinheta: 45,5 créditos.

**Como operar:** foto local vira referência com `media_upload` → `curl PUT` →
`media_confirm` (grátis). Se o lote de vídeo voltar com "preset recomendado",
reenviar com `declined_preset_id`. Imagem gerada guarda cadeiras e objetos da
referência: pedir a troca explicitamente e conferir. Vídeo gerado pode inventar
objetos no meio do clipe (braço de luminária no c3): conferir frame a frame.

---

## 6. Ferramental técnico

- Render de peças: HTML com Gotham em base64 + Playwright em `/opt/pw-browsers/chromium`.
- Vídeo: `pip install imageio-ffmpeg` dá um ffmpeg com libx264 e prores_ks.
  Montagem da vinheta em `docs/formatos/a-sala-vinheta/montagem/montar.sh`.
- Logo animado: animação CSS pausada e avançada frame a frame com
  `document.getAnimations()`, capturada a 24 fps (`logo/animar.py`).
- Conectores: Higgsfield, Claude Docs, ClickUp, Google Drive, GitHub. O Artlist
  precisa ser autorizado de novo nas configurações de conectores do claude.ai.
- **Limite da nuvem:** a sessão roda num servidor; não abre DaVinci, HD nem
  arquivos do computador do Victor. Para isso, sessão local (Claude Desktop ou
  `claude remote-control` no terminal).

---

## 7. Pendências

- [ ] EJUPcast #19 (Marco Bruno): edição no DaVinci pela sessão local, seguindo o briefing.
- [ ] Preencher no padrão de edição os valores do projeto do ep. 18 (export, nós de cor, áudio, abertura, fonte da legenda).
- [ ] Confirmar a grafia "Nicácio" e a atribuição das falas do carrossel #018 no vídeo.
- [ ] Links de fonte das telas 3, 10 e 11 do carrossel do STF.
- [ ] Data do episódio 1 de A Sala; revisão jurídica e conflito de interesse do caso Vorcaro.
- [ ] Autorização de imagem das pessoas identificáveis.
- [ ] Confirmar a licença da faixa "Shades" na conta Artlist da EJUP.
- [ ] Vinheta: versões de 6 s e 9:16, se forem para Reels.
