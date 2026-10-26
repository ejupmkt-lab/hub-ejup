# EJUP — Estado do Squad de Marketing IA

Issue-mãe: [EJUA-1](/EJUA/issues/EJUA-1) (blocked — onboarding em andamento).
Projeto: Onboarding (91a00cab-bea9-411c-890c-475bd65f5890).

## Onboarding — perguntas

| # | Issue | Status | Decisão |
|---|---|---|---|
| 2 | EJUA-3 — Manual da Marca | done | — |
| 3 | EJUA-4 — Canal piloto | done | Instagram |
| 4 | EJUA-5 — Referências de conteúdo | done | — |
| 5 | EJUA-6 — Revisor humano | done | Roberto Pivotto |
| 6 | EJUA-7 — Peça-teste interna | in_review | Tema A v3 (prompt injection Parauapebas) — pilares diversificados |

EJUA-2 (insumos humanos) foi cancelada.

## Squad — agentes existentes

| Papel | Agente | Status | Issue de hire |
|---|---|---|---|
| Diretor de Marketing IA (eu, CEO) | 8960a048-3de7-4750-ab33-18b74c38e3a4 | running | — |
| Guardião da Marca | 51f267c7-8d28-4e1b-b8bb-dddc48dbd9c0 | idle | — |
| Estrategista de Conteúdo e Demanda | 86cb01f3-af94-4ad1-945b-2eb16d7bcceb | idle | EJUA-9 done |
| Copywriter Jurídico-Institucional | 48bfa758-11bc-4eef-b8df-4b0a18144393 | idle | EJUA-10 done |
| Designer / Prompt Designer Institucional | 15978020-c7df-4960-9d2f-adddaf809787 | idle | EJUA-11 done |
| Social Media Planner | 689624c0-235e-4e16-b522-e72cd9c36500 | idle | EJUA-12 (pré-criado, hire pendente de fechamento) |
| Revisor de Qualidade e Aprovação | 40640ff7-03b2-479a-ae84-6a918f459662 | idle | EJUA-13 (pré-criado, hire pendente de fechamento) |

## Pendências de cleanup

- `df95cbc7` — `[DEPRECATED-DUPLICATE] Estrategista`, criado por retry acidental. Precisa de board access para deletar.
- `c5c9e020` — `[EJUP] Estrategista de Conteúdo e Demanda` (role `pm`). Aparente segunda variante criada pelo run paralelo; investigar se é canônica ou duplicata vs `86cb01f3` (role `researcher`).

Workflow alvo (definido na issue-mãe):
briefing → Guardião da Marca → Estrategista → Copywriter → Designer →
Social Media Planner → Revisor de Qualidade → gate humano (Roberto).

## Bloqueio atual

Squad operacionalmente completo (todos os agentes pré-criados pelo run paralelo
de EJUA-8). Faltam apenas fechamentos formais das issues de hire 4/5 (EJUA-12)
e 5/5 (EJUA-13), que serão acordados em sequência via `issue_blockers_resolved`.

Relacionado: [[ejup-content-pillars]], [[ejup-peca-teste-interna]].
