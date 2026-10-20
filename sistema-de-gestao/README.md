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
- **Painel** (página inicial de todos): projetos em andamento, tarefas pendentes do plano de trabalho,
  horas registradas e etapas atrasadas; abaixo, um cartão por projeto com o avanço contra o previsto,
  a etapa, a entrega, os alertas (vermelho = devolução, laranja = atraso, verde = em dia) e o próximo
  passo. O avanço pesa cada etapa pelas horas: 40% pelo checklist e 60% pelo status do relatório
  (`avancoProjeto` em `src/lib/projeto.ts`); o previsto vem das datas do plano.
- **Projetos** em lista, quadro (por etapa), cronograma de todos e calendário de prazos.
- **Tarefas**: as atividades do checklist ainda pendentes nas etapas em curso, marcáveis ali mesmo.
- **Menu**: lateral no computador; no celular, menu inferior com o botão central **Desenvolver projeto**
  (abre o Desenvolvimento de qualquer projeto em andamento).
- **Clientes** com os campos do Modelo de Diagnóstico do HUB SEBRAE.
- **Projetos** a partir do modelo *Adequação à LGPD · HUB SEBRAE* (ficha 13070-5): 5 etapas, 333 h,
  checklist de atividades e 23 entregáveis.
- **Plano de trabalho / cronograma**: definido pela IA a partir do início e do fim contados no
  Desenvolvimento, ou à mão na aba Cronograma; alteração posterior exige justificativa.
- **Clientes e projetos**: cada cliente tem a sua página com todos os projetos (até 3 em andamento ao
  mesmo tempo; um 4º só excepcionalmente), cada um com o seu serviço e as suas etapas, conforme o modelo
  em `src/lib/modelos/` (hoje, Adequação à LGPD).
- **Dentro do projeto**: resumo fixo (avanço, etapa atual, período, horas, consultor) e três abas:
  Desenvolvimento (abre por padrão), Cronograma (Gantt das etapas e o plano de trabalho, editável) e
  Entregas (o relatório técnico de cada etapa). Ficha, tabelas do relatório, referências, horas e
  visitas e histórico ficam no menu "Mais".
- **Desenvolvimento com a IA** (`src/components/projeto/conversa.tsx`, rota `/api/conversa`, tabela
  `mensagens_projeto`): o consultor escreve ou dita (reconhecimento de voz do navegador), manda fotos e
  PDFs; a IA define o cronograma, identifica a etapa, marca o checklist, guarda as fotos como evidência,
  registra visitas e horas, escreve seções e entregáveis no modelo, guarda o PDF assinado e registra o
  envio no HUB e a aprovação ou devolução do SEBRAE. O sistema confere cada ação (o que não pode,
  aparece como aviso com o motivo); cada resposta mostra o que mudou e pode ser desfeita
  (`src/lib/conversa.ts`). Sugestões de mensagem levam ao próximo passo até a entrega final. Precisa da
  `ANTHROPIC_API_KEY` na Vercel.
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
- **Visitas e horas**: cada visita presencial, reunião remota ou trabalho interno é registrado com data,
  horas, participantes e anotações (aba "Visitas e horas" no projeto e em cada etapa). As horas somam contra
  as 333 h previstas, por etapa; fotos da visita entram como evidências do relatório; o texto-padrão das
  evidências cita as datas dos encontros.
- **Biblioteca de textos aprovados** (tabela `biblioteca_textos`, tela "Biblioteca" de cada empresa): quando
  uma etapa é marcada como aprovada, as seções e os entregáveis completos entram anonimizados (empresa,
  responsável, CNPJ, participantes e datas viram marcadores). Nos próximos projetos, cada seção mostra
  "Da biblioteca (N)" com os mais parecidos (mesmo ramo primeiro), e "Preencher" usa o melhor texto aprovado
  antes do texto-padrão. Textos de relatórios antigos podem ser colados à mão.
- **Redação com IA** (`/api/redigir`): redige as seções do relatório a partir das anotações da etapa, do
  checklist e dos dados do cliente (Claude, modelo `claude-opus-5-5`, saída em JSON estruturado). Os dados
  são lidos no banco com a sessão de quem pediu. O que faltar volta como `[completar: …]`. Requer a variável
  `ANTHROPIC_API_KEY` na Vercel (Settings → Environment Variables); sem ela, a tela avisa e nada quebra.
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

Pelo próprio sistema, em **Acessos** (menu lateral, só administrador do grupo): e-mail, nome, nome
completo, papel em cada empresa e, se for o caso, administrador do grupo. Se a pessoa ainda não tem
conta, a tela gera a mensagem de convite para copiar e enviar; se já tem, o acesso vale na hora. Na mesma
tela dá para alterar papéis e retirar acessos (`public.salvar_acesso` e `public.retirar_acesso`, que
conferem se quem chama é administrador).

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

1. Avisos de prazo por e-mail (precisa de um serviço de envio, como Resend, e da chave dele).
