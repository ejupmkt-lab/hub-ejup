# HUB Pivotto — protótipo

Sistema de gestão das empresas do ecossistema Pivotto. Especificação completa no PRD
(`docs/prd-hub-gestao.md` no repositório `robertopivotto`).

> **Protótipo.** Não há banco nem login reais: os dados são fictícios e ficam salvos no
> `localStorage` do navegador. "Restaurar dados de exemplo", no menu, volta ao estado inicial.

## O que já funciona

- **Três módulos**, um por empresa: Pivotto & Pivotto (ativo), ORB (em estruturação), EJUP (standby).
- **Acesso por usuário** (troque em "Entrar como"): Roberto é administrador do grupo e vê tudo;
  Leonardo vê só a Pivotto & Pivotto.
- **Painel do grupo** com os próximos prazos de todas as empresas.
- **Clientes** com os campos do Modelo de Diagnóstico do HUB SEBRAE.
- **Projetos** criados a partir do modelo *Adequação à LGPD · HUB SEBRAE* (ficha 13070-5):
  5 etapas, 333 h, checklist de atividades e 23 entregáveis.
- **Plano de trabalho**: datas sugeridas pela duração de referência, fechadas por Roberto; alteração
  posterior exige justificativa e fica no histórico.
- **Etapas no formato do HUB SEBRAE**, com status (Não iniciada → … → A enviar → Enviada → Aprovada).
- **Registros do programa** (pessoas, marcos, fornecedores, normas, reuniões, treinamentos,
  processos, riscos, plano de ação, RoPA, incidentes), reaproveitados entre etapas.
- **Redação do relatório** por seção obrigatória e por entregável.
- **Checagem de completude** que impede marcar "A enviar" com pendências.
- **Relatório Técnico em Word (.docx)** no papel timbrado FUNCERN + Sebraetec do modelo
  (`public/modelos/relatorio-base.docx`), com ficha de identificação, faixas, quadros, tabelas,
  referências e assinaturas.

## Rodar

```bash
npm install
npm run dev   # http://localhost:3000
```

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/lib/modelos/` | Modelos de fluxo (o da LGPD SEBRAE está em `lgpd-sebrae.ts`) |
| `src/lib/relatorio/secoes.ts` | Seções do relatório e regras de completude |
| `src/lib/relatorio/docx.ts` | Geração do .docx a partir do modelo Word |
| `src/lib/registros.ts` | Tipos de registro do programa e suas colunas |
| `src/lib/prototipo/` | Estado no navegador e dados de exemplo |
| `docs/esquema-banco-producao.sql` | Esquema do banco para a versão de produção (Postgres/Supabase com isolamento por empresa via RLS) |

## Próximos passos para produção

1. Trocar o estado local pelo banco (`docs/esquema-banco-producao.sql`) e login com MFA.
2. Upload de evidências (imagens entram como figuras no relatório) e do PDF assinado.
3. Avisos de prazo por e-mail.
