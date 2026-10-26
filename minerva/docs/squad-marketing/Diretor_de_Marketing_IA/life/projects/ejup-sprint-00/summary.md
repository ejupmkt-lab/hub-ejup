---
name: ejup-sprint-00
description: Estado da Sprint 00 (peça-teste institucional EJUP) — cadeia de produção e bloqueios.
metadata:
  type: project
---

# EJUP — Sprint 00: Peça Institucional de Posicionamento

Issue-mãe: [EJUA-19](/EJUA/issues/EJUA-19) (in_review — gate humano aberto).
Origem: definida pelo board em [EJUA-17](/EJUA/issues/EJUA-17) (28/mai/2026).

**Tema central (board, não negociável):** "O Direito não precisa correr para parecer atual."

## Cadeias de produção (28/mai/2026) — DUAS criadas em paralelo

**Cadeia A (adotada na consolidação)** — criada provavelmente por run paralela do CEO:

| Etapa | Issue | Agente | Status |
|---|---|---|---|
| 1/6 — Briefing | [EJUA-20](/EJUA/issues/EJUA-20) | Estrategista | done |
| 2/6 — Direção Criativa | [EJUA-21](/EJUA/issues/EJUA-21) | Guardião | done |
| 3/6 — Copywriting | [EJUA-22](/EJUA/issues/EJUA-22) | Copywriter | done |
| 4/6 — Direção Visual | [EJUA-23](/EJUA/issues/EJUA-23) | Designer | done |
| 5/6 — Adaptação por Canal | [EJUA-24](/EJUA/issues/EJUA-24) | Social Media | done |
| 6/6 — Revisão de Qualidade | [EJUA-25](/EJUA/issues/EJUA-25) | Revisor | done |

**Cadeia B (redundante)** — criada por mim explicitamente nesta sessão:

| Etapa | Issue | Status |
|---|---|---|
| 1/6 | [EJUA-26](/EJUA/issues/EJUA-26) | done |
| 2/6 | [EJUA-27](/EJUA/issues/EJUA-27) | done |
| 3/6 | [EJUA-28](/EJUA/issues/EJUA-28) | done |
| 4/6 | [EJUA-29](/EJUA/issues/EJUA-29) | done |
| 5/6 | [EJUA-30](/EJUA/issues/EJUA-30) | done |
| 6/6 | [EJUA-31](/EJUA/issues/EJUA-31) | done |

Razão da escolha de Cadeia A: documentos significativamente mais densos
(`briefing` 11.654 chars vs sem documento em EJUA-26; `revisao` 13.086 vs
2.507 chars). Cadeia B é redundância operacional — não há retrabalho sobre ela.

## Restrições da sprint (replicadas em cada subtask)

- Sem publicação automática.
- Sem calendário editorial.
- Sem EJUP Qórum, EIX CORE/XCore.
- EJUP Experts não é tema.
- Sem área jurídica específica (institucional puro).
- Sem venda apelativa, promessa de resultado, fórmula mágica, urgência artificial, viralização vazia.
- Sem imitar estilo pessoal de profissional específico.

## Entregáveis finais (consolidação por mim quando EJUA-31 done)

1. Briefing estratégico
2. Direção criativa institucional
3. Carrossel completo, slide a slide
4. Legenda IG
5. Texto curto LinkedIn
6. Roteiro curto Reels
7. Direção visual
8. Adaptação por canal
9. Checklist de revisão
10. Pontos que exigem aprovação humana antes de publicação

## Decisões de orquestração registradas

- **Cadeia sequencial pura** (não paralela). Cada papel tem insumo único do anterior; paralelizar entrópia a peça.
- **Briefing decide número de slides macro; Copywriter consolida slide a slide.** Não pré-decidir do topo.
- **EJUA-19 bloqueada por todos os 6 filhos** (não só o último) — explícito, primeira classe.
- **Resultado vai a gate humano (Roberto Pivotto)** após eu consolidar.

## Consolidação final entregue (28/mai/2026, 23:50)

- Documento [`pacote-final`](/EJUA/issues/EJUA-19#document-pacote-final) publicado (19.558 chars) com os 10 entregáveis consolidados.
- Interaction `request_confirmation` `d642ba4a-efb6-41bc-879c-007bd7f2ca4f` criada para Roberto Pivotto.
- EJUA-19 movida para `in_review` com `continuationPolicy: wake_assignee`.

## O que esperar no próximo wake meu

`request_confirmation` aceita por Roberto → wake automático → libero próxima fase
(produção visual + agendamento). Em caso de rejeição com motivo, reabrir ciclo de
ajuste — `supersedeOnUserComment: true` faz a interaction superceder se Roberto
comentar sem usar o botão.

## Lições de orquestração (registradas em [[2026-05-28]])

- Criar cadeia paralela duplica trabalho — gate de unicidade na criação inicial
  de subtarefas pelo CEO é necessário em sprints futuras.
- Quando há cadeias redundantes, escolher pela densidade dos documentos
  (`briefing`/`revisao` são bons proxies de qualidade).

Relacionado: [[ejup-squad-state]], [[ejup-content-pillars]].
