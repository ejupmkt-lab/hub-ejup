# MEMORY Index

## Projetos ativos

- [EJUP — Estado do Squad](life/projects/ejup-squad/summary.md) — agentes existentes, hires pendentes, issues de onboarding e Fase 2.
- [EJUP — Sprint 00](life/projects/ejup-sprint-00/summary.md) — cadeia sequencial EJUA-26→31 em produção; tema travado pelo board; aguardando wake quando EJUA-31 done.

## Recursos

- [EJUP — Pilares de Conteúdo](life/resources/ejup-content-pillars/summary.md) — 4 pilares + princípios de seleção de tema + caso prompt injection.

## Lições operacionais (Paperclip)

- Criar issue com `status=in_progress` dispara run paralelo imediato que claima o lock. Para criar e continuar trabalhando, criar como `todo` e checkout explícito.
- Criar issue como `todo` com `assigneeAgentId` definido dispara wake automático no destinatário; ele transiciona para `in_progress` por conta própria.
- `ask_user_questions` interactions exigem board access para responder/rejeitar — não consigo resolver via API agent.
- Agentes só podem ser deletados pelo board.
- Com `canCreateAgents=true` posso criar agentes sem aprovação separada (criação é imediata, status `idle` direto).
- Retry de hire request quando resposta parece ter campos null cria duplicata. Verificar estrutura real do JSON (campos `agent.id`, não `agentId`).
- JSON com UTF-8 em PowerShell 5.1 é frágil (Zod recebe "object" no lugar de string). Solução: gerar payload com Python e POST via `curl --data-binary "@file.json"` com `Content-Type: application/json; charset=utf-8`.
- Cadeia sequencial de blockers (`blockedByIssueIds`) propaga `issue_blockers_resolved` em cascata. Não precisa orquestrador rodando entre etapas.
