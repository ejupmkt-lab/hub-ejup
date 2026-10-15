# Sistema de Gestão — ecossistema Pivotto

Sistema de gestão das empresas do ecossistema Pivotto (Pivotto & Pivotto, ORB e EJUP).
Especificação completa no PRD: [`docs/prd-hub-gestao.md`](docs/prd-hub-gestao.md).

- **Produção:** https://sistema-de-gestao-alpha.vercel.app (Vercel, time EJUP, projeto `sistema-de-gestao`)
- **Banco e login:** Supabase, projeto "Sistema de gestão" (`lhbiuflzlnznilhqhfhu`, São Paulo)

## O que já funciona

- **Login** com e-mail e senha. Só cria acesso quem tem e-mail cadastrado em `convites`.
- **Três módulos**, um por empresa: Pivotto & Pivotto (ativo), ORB (em estruturação), EJUP (standby).
- **Isolamento por empresa no banco (RLS):** cada pessoa só recebe os dados das empresas a que tem acesso.
  O administrador do grupo vê todas, inclusive as inativas.
- **Painel do grupo** com os próximos prazos (só administrador).
- **Clientes** com os campos do Modelo de Diagnóstico do HUB SEBRAE.
- **Projetos** a partir do modelo *Adequação à LGPD · HUB SEBRAE* (ficha 13070-5): 5 etapas, 333 h,
  checklist de atividades e 23 entregáveis.
- **Plano de trabalho**: datas sugeridas e fechadas por Roberto; alteração posterior exige justificativa.
- **Etapas no formato do HUB SEBRAE**, registros do programa, redação por seção, checagem de completude.
- **Relatório Técnico em Word (.docx)** no papel timbrado do modelo (`public/modelos/relatorio-base.docx`).
- **Cadastro pelo CNPJ**: razão social, nome fantasia, endereço, CEP, porte, atividade e data de abertura
  vêm da Receita Federal (BrasilAPI, com cnpj.ws de reserva), pela rota `/api/cnpj/[cnpj]`.
- **Textos-padrão do relatório** no estilo dos relatórios entregues (`src/lib/relatorio/padroes.ts`);
  o que só o consultor sabe fica como `[completar: …]` e a checagem de pendências acusa.
- **Referências normativas e inventário de normas** já carregados em todo projeto novo.
- **Imagens de evidência** no Supabase Storage (bucket privado `evidencias`, separado por empresa),
  inseridas no Word como Figura 1, Figura 2…
- **Status automático**: primeira atividade marcada leva a "Em levantamento"; as duas assinaturas com o
  relatório completo levam a "A enviar". A data do relatório já vem com o fim da etapa.
- **Salvamento automático** com controle de versão: se duas pessoas editam o mesmo projeto ao mesmo
  tempo, quem salvar por último é avisado e recebe a versão mais recente.
- **PDF assinado** de cada entrega guardado com a etapa (mesmo bucket, `assinado-<id>.pdf`); ao anexar,
  as datas de assinatura em branco recebem a data do dia. Botão "Marcar como enviada no HUB".
- **Exclusão** de projeto (leva junto imagens e PDF) e de cliente sem projeto, só para gestores (RLS).
- **Verificação em duas etapas** opcional (aplicativo autenticador), em Minha conta. Com ela ativa, o
  banco só entrega dados à sessão confirmada com o código (`privado.sessao_verificada`, aal2).
- **Senhas vazadas recusadas** no cadastro e na troca de senha (consulta anônima ao Have I Been Pwned;
  só os 5 primeiros caracteres do hash saem do navegador).

## Como o banco guarda os dados

| Tabela | Conteúdo |
|---|---|
| `empresas` | As três empresas e o status de cada módulo |
| `perfis`, `membros` | Pessoas e o papel de cada uma em cada empresa |
| `convites` | E-mails liberados e os acessos que recebem ao criar a conta |
| `clientes` | Cadastro do cliente (documento `dados`) |
| `projetos` | O projeto inteiro em `dados` (etapas, checklist, redação, registros, referências, histórico) + `versao` |

Migrações em `supabase/migrations/`. As funções de acesso usadas pelas regras ficam no esquema `privado`,
fora da API.

### Liberar o acesso de alguém

No SQL Editor do Supabase:

```sql
insert into public.convites (email, nome, nome_completo, admin_grupo, acessos) values
  ('pessoa@exemplo.com', 'Nome', 'Nome Completo', false, '{"pivotto": "gestor"}');
```

Depois a pessoa abre o sistema, clica em **Primeiro acesso? Criar conta** e usa esse e-mail.
Papéis: `gestor`, `consultor`, `equipe`. Empresas: `pivotto`, `orb`, `ejup`.

## Rodar localmente

```bash
npm install
npx supabase start          # banco local (Docker); aplica as migrações
# .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY do `npx supabase status`
npm run dev                 # http://localhost:3000
```

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/app/(sistema)/` | Telas do sistema (exigem login) |
| `src/app/login`, `src/app/auth/` | Login, criação de conta, recuperação de senha |
| `src/lib/dados/store.tsx` | Carrega do Supabase e salva as alterações |
| `src/lib/modelos/` | Modelos de fluxo (LGPD SEBRAE em `lgpd-sebrae.ts`) |
| `src/lib/relatorio/` | Seções do relatório, completude e geração do .docx |
| `src/lib/registros.ts` | Tipos de registro do programa |

## Próximos passos

1. Tela para o administrador liberar acessos (hoje é pelo SQL Editor).
2. Avisos de prazo por e-mail (precisa de um serviço de envio, como Resend, e da chave dele).
