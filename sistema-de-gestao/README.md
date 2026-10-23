# Blimp — sistema de gestão de projetos

Blimp é o sistema de gestão de projetos e consultorias usado pelas empresas Pivotto & Pivotto, ORB e EJUP.
A logomarca fica em `src/components/logo.tsx` (completa e só o B), vetorizada do arquivo oficial; o ícone
do navegador está em `src/app/icon.svg`, `favicon.ico` e `apple-icon.png`.
Especificação completa no PRD: [`docs/prd-hub-gestao.md`](docs/prd-hub-gestao.md).

- **Produção:** https://sistema-de-gestao-alpha.vercel.app (Vercel, time EJUP, projeto `sistema-de-gestao`)
- **Banco e login:** Supabase, projeto "Sistema de gestão" (`lhbiuflzlnznilhqhfhu`, São Paulo)

## O que já funciona

- **Login** com e-mail e senha. Só cria acesso quem tem e-mail cadastrado em `convites`.
- **Três módulos**, um por empresa: Pivotto & Pivotto (ativo), ORB (em estruturação), EJUP (standby).
- **Isolamento por empresa no banco (RLS):** cada pessoa só recebe os dados das empresas a que tem acesso.
  O administrador do grupo vê todas, inclusive as inativas.
- **Empresa escolhida no menu** (`src/lib/dados/empresa-atual.tsx`): todo o sistema (painel, projetos,
  tarefas, clientes, serviços e equipe) mostra só a empresa escolhida no seletor do menu; a escolha fica
  guardada no navegador e acompanha o endereço (`/pivotto/...`).
- **Equipe por empresa** (`/[empresa]/equipe`, funções `equipe_da_empresa`, `salvar_membro`,
  `retirar_membro`): o gestor da empresa inclui pessoas (o convite sai copiado), muda a função
  (gestor, consultor ou equipe) e retira o acesso, só naquela empresa. O administrador do grupo também
  define a situação da empresa. Cada pessoa edita o próprio nome em "Meu perfil" (`atualizar_meu_perfil`).
- **Tarefas**: o que fazer agora em cada projeto, só na fase em que ele está: o checklist pendente da
  etapa em curso ou o próximo passo (diagnóstico, plano de trabalho, relatório, envio), com "Continuar no
  Desenvolvimento"; o que depende do gestor, da FUNCERN ou do cliente fica em "Aguardando outros", com "Cobrar". Marcar uma atividade-mãe marca as filhas pendentes; a filha não marca a mãe.
- **Painel** (página inicial de todos): projetos em andamento, tarefas pendentes do plano de trabalho,
  horas cumpridas e etapas atrasadas; depois, pendências, situação das etapas e carga por semana; por
  fim, um cartão por projeto com o avanço contra o previsto,
  a etapa, a entrega, os alertas (vermelho = devolução, laranja = atraso, verde = em dia) e o próximo
  passo. O avanço pesa cada etapa pelas horas: 40% pelo checklist e 60% pelo status do relatório
  (`avancoProjeto` em `src/lib/projeto.ts`); o previsto vem das datas do plano.
- **Projetos** em lista, quadro (por etapa do HUB), plano de trabalho de todos (linha do tempo) e calendário de prazos.
- **Menu**: lateral no computador; no celular, menu inferior com o botão central **Desenvolver projeto**
  (abre o Desenvolvimento de qualquer projeto em andamento).
- **Serviços** (tabela `servicos`, menu "Serviços"): as fichas técnicas que a empresa presta, em cartões
  como no catálogo do Sebraetec (nome, tema, descrição, credenciado ou não). Cada serviço tem a ficha
  (etapas, horas, duração de referência, checklist, entregáveis e instrumentos), editável por gestores, e a
  sua própria biblioteca de textos. O cadastro pode ser preenchido pela IA a partir do PDF ou do texto da
  ficha (`/api/servico-ficha`). O projeto novo escolhe o serviço na lista e copia as etapas dele; mudar a
  ficha depois não altera projetos em andamento.
- **Clientes** com os campos do Modelo de Diagnóstico do HUB SEBRAE.
- **Projetos** a partir dos serviços cadastrados; o primeiro é *Adequação à LGPD* (ficha 13070-5): 5
  etapas, 333 h, checklist de atividades e 23 entregáveis, com textos-padrão e referências próprios.
- **Régua do HUB** (`src/lib/fase.ts`): todo projeto segue as 6 etapas do HUB SEBRAE (1 Solicitação
  aberta, 2 Diagnóstico, 3 Proposta, 4 Em execução, 5 Projeto finalizado, 6 Projeto concluído), cada uma
  com passos que dizem com quem está a bola (você, o gestor do SEBRAE, a FUNCERN ou o cliente) e há
  quantos dias. Cada passo é registrado com a data na linha do tempo do Desenvolvimento, pelo botão do
  próximo passo ou pela conversa com a IA (`avancar_hub`); dá para voltar um passo. O plano de trabalho é
  montado na proposta e enviado à FUNCERN, que lança no HUB. São dois calendários: o **plano do HUB**
  (as datas do orçamento, que não mudam e saem na mensagem do plano) e a **execução**, que começa quando o
  cliente paga, com a mesma duração e as mesmas horas de cada etapa (`ajustarPlanoAoPagamento`). As
  etapas são em sequência, sem sobreposição: a primeira começa no pagamento e cada seguinte no dia em que a
  anterior foi enviada no HUB (`reencadearExecucao`, recalculada a cada alteração a partir da data-base
  `dataInicioBase`/`dataFimBase`, então corrigir uma data de envio desfaz o deslocamento). O período
  realizado de cada relatório segue a mesma regra (`periodoEfetivo`). Prazos,
  atrasos, gráfico e avisos seguem a execução. Plano fechado depois do pagamento já nasce alinhado; nos
  projetos antigos, a aba Plano de trabalho oferece "Começar a execução no pagamento". O gráfico mostra o
  plano do HUB em tracejado e, ao passar o mouse sobre cada barra, um balão com as datas (plano do HUB, execução
  prevista e realizado). Depois do pagamento, "Alterar datas" também corrige as datas do plano do HUB, e a
  execução é recalculada a partir delas. O sistema pede confirmação para enviar uma etapa ou finalizar o projeto
  antes do fim previsto (o gestor recusa a nota quando muitas horas são entregues em poucos dias).
  Embaixo da régua do HUB, a trilha dos relatórios do serviço (um por etapa da ficha: 5 na LGPD, 2 no
  Planejamento Tecnológico), com o período previsto (plano do HUB) embaixo de cada relatório e, conforme a
  etapa anda, o período realizado (do início da execução ou do primeiro registro até o envio no HUB). O
  responsável é sempre o consultor do projeto; não há responsável por etapa. Projetos do formato antigo (`contratacao`) são
  lidos como o passo equivalente. Em Tarefas, "Aguardando outros" junta o que está com terceiros, com a
  mensagem pronta para cobrar (`src/lib/cobranca.ts`); o quadro de projetos tem uma coluna por etapa do HUB.
- **Valores e recebimento** (`src/lib/financeiro.ts`, tabelas `financeiro_servicos` e
  `financeiro_projetos`): só quem tem a permissão "vê o financeiro" (`perfis.ve_financeiro`, função
  `privado.ve_financeiro`) lê ou altera; os demais não recebem nada do banco. A permissão é só do gestor
  master (Roberto Pivotto) e não pode ser dada pelo sistema: muda apenas direto no banco. No serviço: teto, valor da hora (R$ 90) e a parte da
  FUNCERN (10%); as horas são as que cabem no teto (R$ 30.000 ÷ 90 = 333 h) e podem ser distribuídas nas
  etapas pela complexidade. No projeto ("Dados do projeto"): valor, FUNCERN, o que fica para o consultor e
  as parcelas: o SEBRAE paga até o dia 5 o que ficou pronto até o dia 20 do mês anterior; 30% quando o
  Relatório 1 foi enviado e o projeto ainda não foi finalizado, o restante (70%, ou 100% no mesmo mês)
  quando o projeto é finalizado no HUB (último relatório e avaliação do cliente). A área **Financeiro** (menu
  lateral, abaixo de Tarefas, só para o gestor master; marcada como em desenvolvimento) mostra o que cai em
  cada dia 5 e o que ainda dá para garantir até o próximo dia 20.
- **Projeto novo**: escolhe o serviço, o cliente, o consultor e onde o projeto está no HUB (começa no
  diagnóstico); as horas de cada etapa vêm da ficha ou da proposta (editáveis também no plano de trabalho); o código do pedido no HUB é um campo só (o
  mesmo número do projeto no HUB); o número de visitas é o de etapas do serviço (uma por etapa); o gestor
  ou gestora do SEBRAE vem de uma lista da empresa (tabela `gestores_sebrae`), com a opção de digitar
  outro nome e salvá-lo na lista.
- **Plano de trabalho**: definido pela IA a partir do início e do fim contados no Desenvolvimento, ou à
  mão na aba Plano de trabalho; alteração posterior exige justificativa.
- **Clientes e projetos**: cada cliente tem a sua página com todos os projetos (até 3 em andamento ao
  mesmo tempo; um 4º só excepcionalmente), cada um com o seu serviço e as suas etapas.
- **Dentro do projeto**: resumo fixo (avanço, etapa atual, período, horas, consultor), "Dados do projeto"
  no menu "Mais" (consultor, código do pedido no HUB, gestor do SEBRAE, local do relatório, correção do
  passo no HUB, exclusão) e três abas: Desenvolvimento (abre por padrão; o relatório é escrito aqui, pela
  conversa ou pelo "Preencher com a biblioteca"), Plano de trabalho e Entregas (como o Plano de Entrega do
  HUB: cada relatório com o Word, o PDF assinado, "Enviei no HUB" e a devolução do gestor; "Importar
  relatório pronto" traz um relatório feito fora do sistema: PDF assinado, fotos de evidência, data das
  assinaturas e do envio no HUB; o checklist fica feito e o PDF passa a ser o relatório da etapa). Só
  anexar o PDF assinado, sem nada escrito nas seções, também vale como relatório feito fora: as seções
  não são cobradas, as datas das assinaturas podem ser corrigidas na entrega, o checklist é dado por
  feito no envio e esses textos não vão para a biblioteca. O número de visitas do plano é editável nos
  Dados do projeto (em branco, uma por etapa). Dados do projeto
  e histórico ficam no menu "Mais". O processo (ficha, textos, referências) fica no serviço; o endereço
  antigo da etapa (`/etapas/N`) leva à entrega dela (`#etapa-N`).
- **Desenvolvimento com a IA** (`src/components/projeto/conversa.tsx`, rota `/api/conversa`, tabela
  `mensagens_projeto`): o consultor escreve ou dita (reconhecimento de voz do navegador), manda fotos e
  PDFs; a IA define o plano de trabalho, identifica a etapa, marca o checklist, guarda as fotos como evidência,
  escreve seções e entregáveis no modelo, guarda o PDF assinado e registra o
  envio no HUB e a aprovação ou devolução do SEBRAE. O sistema confere cada ação (o que não pode,
  aparece como aviso com o motivo); cada resposta mostra o que mudou e pode ser desfeita
  (`src/lib/conversa.ts`). Sugestões de mensagem levam ao próximo passo até a entrega final. Precisa da
  `ANTHROPIC_API_KEY` na Vercel.
- **Importar do HUB** (botão em "No HUB SEBRAE", `src/components/projeto/importar-hub.tsx`, rota
  `/api/hub/importar`, conferências em `src/lib/hub-importar.ts`): sem API do HUB, o consultor cola o texto
  da página do pedido (Ctrl+A, Ctrl+C) ou anexa prints e PDF; a IA lê código do pedido, gestor, passos com
  data (diagnóstico enviado, proposta, FUNCERN, pagamento…) e o plano de trabalho do HUB, e o sistema mostra
  a prévia (calculada numa cópia, pelas mesmas regras da conversa). Só aplica quando o consultor confirma;
  se o código do pedido ou o CNPJ lidos contradizem o projeto, bloqueia. O que foi aplicado vai para a
  conversa e pode ser desfeito lá. Relatórios enviados no HUB não são marcados como enviados: o PDF
  assinado precisa estar no projeto. Nada é gravado pela rota. Usa a mesma `ANTHROPIC_API_KEY`.
- **Etapas no formato do HUB SEBRAE**, tabelas do relatório (preenchidas pela conversa, ação
  `preencher_tabela`), redação por seção, checagem de completude.
- **Relatório Técnico em Word (.docx)** no papel timbrado do modelo (`public/modelos/relatorio-base.docx`).
  No texto: `## ` subtítulo, `a) ` alínea, `!QUADRO`/`!ALERTA` quadro, `[[tabela:x]]` tabela de registro e
  linhas `| A | B |` para tabelas avulsas (resumo, fluxo, metas). As colunas se ajustam ao conteúdo, e
  coluna vazia em todas as linhas não entra. O estilo que a IA segue (`src/lib/ia/estilo.ts`) inclui o
  padrão do Relatório 01 assinado da NOV4.
- **Assinatura online (Autentique)** nas Entregas: "Ou enviar para assinatura online" manda o PDF do
  relatório, o consultor e o responsável da empresa recebem o link por e-mail, e a tela mostra quem
  assinou ("Conferir assinaturas", "Lembrar quem falta"). Quando os dois assinam, o PDF assinado e as
  datas entram na etapa sozinhos. Rotas em `src/app/api/assinatura/*` (sempre com a sessão de quem pede)
  e cliente da API em `src/lib/assinatura/autentique.ts`. A assinatura gov.br por fora continua valendo.
  Na Vercel: `AUTENTIQUE_TOKEN` (chave da API, painel da Autentique › API keys) e, para testar sem gastar
  a cota, `AUTENTIQUE_SANDBOX=1`. Sem a chave, o envio avisa que falta ativar. Os PDFs vão até 4 MB.
- **Cadastro pelo CNPJ**: razão social, nome fantasia, endereço, CEP, porte, atividade e data de abertura
  vêm da Receita Federal (BrasilAPI, com cnpj.ws de reserva), pela rota `/api/cnpj/[cnpj]`.
- **Textos-padrão do relatório** no estilo dos relatórios entregues (`src/lib/relatorio/padroes.ts`);
  o que só o consultor sabe fica como `[completar: …]` e a checagem de pendências acusa.
- **Referências normativas** cadastradas no serviço (aba Referências) e copiadas para o projeto ao nascer;
  a LGPD sem lista própria usa as referências-padrão.
- **Imagens de evidência** no Supabase Storage (bucket privado `evidencias`, separado por empresa),
  inseridas no Word como Figura 1, Figura 2…
- **Status automático**: primeira atividade marcada leva a "Em levantamento"; as duas assinaturas com o
  relatório completo levam a "A enviar". A data do relatório já vem com o fim da etapa.
- **Salvamento automático** com controle de versão: se duas pessoas editam o mesmo projeto ao mesmo
  tempo, quem salvar por último é avisado e recebe a versão mais recente.
- **PDF assinado** de cada entrega guardado com a etapa (mesmo bucket, `assinado-<id>.pdf`); ao anexar,
  as datas de assinatura em branco recebem a data do dia. Nas Entregas, "Enviei no HUB".
- **Exclusão** de projeto (leva junto imagens e PDF) e de cliente sem projeto, só para gestores (RLS).
- **Verificação em duas etapas** opcional (aplicativo autenticador), em Minha conta. Com ela ativa, o
  banco só entrega dados à sessão confirmada com o código (`privado.sessao_verificada`, aal2).
- **Situação das etapas, uma só em toda a tela** (`situacaoDaEtapa` em `src/lib/projeto.ts`): devolvida,
  enviada, atrasada (fim da execução passou), pronta para enviar, em andamento ou não iniciada. O cabeçalho,
  a trilha dos relatórios, o gráfico, os cartões e o painel usam a mesma função. Só há data de início
  quando a etapa começou de fato (`iniciadaEm`, registrada quando ela sai de "não iniciada"); uma etapa
  enviada sem esse registro começou no envio da anterior (ou, a primeira, no pagamento). Etapa que não
  começou mostra só o previsto.
- **Desvio do plano do HUB**: o atraso (`Atrasada`) conta pela execução, a partir do pagamento; separado
  disso, o sistema mostra "N dias além do plano do HUB" (cabeçalho, cartão, trilha, Entregas e balão do
  gráfico) quando uma etapa ainda não enviada passou do fim previsto no orçamento, ou foi enviada depois
  dele (`diasAlemDoPlano`). A IA corrige as datas do plano com a ação `alterar_plano_hub` (todas as etapas
  citadas de uma vez, em sequência, com desfazer); `alterar_datas_etapa` mexe só na execução.
- **Chat**: Enter envia a mensagem; Shift+Enter pula a linha. A mensagem do plano de trabalho para a FUNCERN
  não fica mais na aba: a IA entrega pronta quando pedida (o texto vai no contexto do projeto).
- **Horas**: não há registro de visitas nem de horas trabalhadas. As horas de cada etapa são as do plano
  de trabalho e contam como cumpridas quando o relatório da etapa é enviado no HUB (`horasDoProjeto`); o
  cabeçalho do projeto mostra "51 h de 333 h" e quantas etapas foram enviadas. O número de visitas do
  plano é só informativo (sai na mensagem do plano). Fotos entram como evidência pela conversa ou pela
  importação de relatório pronto.
- **Biblioteca de textos aprovados** (tabela `biblioteca_textos`, aba "Biblioteca de textos" de cada serviço): quando
  uma etapa é marcada como aprovada, as seções e os entregáveis completos entram anonimizados (empresa,
  responsável, CNPJ, participantes e datas viram marcadores). Nos próximos projetos, "Preencher o relatório
  com a biblioteca", no Desenvolvimento, usa o texto aprovado mais parecido (mesmo ramo primeiro) antes do
  texto-padrão. Textos de relatórios antigos podem ser colados à mão.
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

Pela **Equipe** de cada empresa (menu lateral). O gestor da empresa inclui a pessoa (e-mail, nome, nome
completo e função) e, no botão **Acessos** de cada linha, muda a função ou retira a pessoa da empresa
(`public.salvar_membro` e `public.retirar_membro`). O administrador do grupo vê ali também o acesso às outras
empresas, o de administrador e "Retirar todo o acesso" (`public.salvar_acesso` e `public.retirar_acesso`).
Se a pessoa ainda não tem conta, a mensagem de convite é copiada; se já tem, o acesso vale na hora.

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
