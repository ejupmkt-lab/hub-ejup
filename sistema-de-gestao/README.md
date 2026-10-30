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
- **Financeiro** (`src/lib/financeiro.ts`, tabelas `financeiro_servicos`, `financeiro_projetos`, `financeiro_empresas`):
  só quem tem a permissão "vê o financeiro" (`perfis.ve_financeiro`, função `privado.ve_financeiro`) lê ou altera;
  os demais não recebem nada do banco. A permissão é só do gestor master (Roberto Pivotto) e não pode ser dada pelo
  sistema: muda apenas direto no banco. No serviço: teto, valor da hora (R$ 90) e a parte da FUNCERN (10%); as horas
  são as que cabem no teto (R$ 30.000 ÷ 90 = 333 h) e podem ser distribuídas nas etapas pela complexidade. O SEBRAE
  paga até o dia 5 o que ficou pronto até o dia 20 do mês anterior: **30%** quando o Relatório 1 foi enviado e o
  restante (**70%**) quando o projeto é finalizado no HUB (último relatório e avaliação do cliente).
  - **Aba "Financeiro" de cada projeto** (`FinanceiroDoProjeto`; só aparece para quem vê o financeiro; antes ficava em
    "Dados"): valor do projeto, FUNCERN, o que fica para o consultor e o recebido até agora; a **Contrapartida**
    (desconto sobre o total a receber, uma espécie de cashback: o "Você recebe" já vem sem ela, e os 30% e 70% saem do
    valor descontado); e as parcelas em balões
    (`BalaoDeParcela`), cada uma com **nota fiscal** (número, data de emissão, valor se for outro, arquivo PDF/XML/imagem
    no bucket privado `notas-fiscais`, caminho `<projeto>/<arquivo>`, regra por empresa atual do projeto; lê e apaga só
    quem vê o financeiro). Mostra "NF emitida · nº …" ou "NF pendente" e quantas notas já saíram.
  - **Página Financeiro** (menu lateral, só gestor master; em desenvolvimento), com duas abas:
    - **Recebimentos**: resumo no topo (a receber, próximo pagamento, recebido no mês, imposto previsto), o seletor de
      **período** (Mês, Trimestre, Ano, Tudo ou Personalizado; abre no mês corrente, com setas e um seletor de mês;
      `src/lib/periodo.ts`) e, embaixo, os projetos no padrão da lista de Projetos (`ProjetosDoRecebimento`: tabela nas
      telas largas, cartões nas menores) com Cliente / projeto, Etapa atual, Progresso e as duas parcelas. **O período mostra só
      as parcelas que caem nele** (data de recebimento, ou a prevista): quem recebeu a 1ª em outubro aparece em novembro só com
      a 2ª, que continua na coluna dela. Cada
      parcela tem valor, "Previsto até" (ou "Recebida em"), situação (Projetada, Data do HUB, Combinada, Atrasada,
      Recebida), selo da nota fiscal e **Recebi** / **Editar** (data prevista em `previsoes`, valor em `valores`, dia
      em `recebidos`, nota em `notas`, "Voltar à projeção").       "Sem data (n)" lista as parcelas de projetos sem plano de trabalho. O pagamento único antigo ("100") vale para
      as duas parcelas.
    - **Configurações**: o imposto da empresa (abaixo).
  - **Sem a data do Relatório 1, sem perspectiva de recebimento**: enquanto o projeto não tem o Relatório 1 enviado nem a data dele na execução (antes do pagamento o plano ainda é proposta), as duas parcelas ficam "Sem data prevista" (botão "Sem data"); só a data combinada à mão vale.
  - **Projeção das datas** (`src/lib/projecao.ts`): vem do andamento do projeto. Etapa em curso termina em duração × o
    que falta (`avancoEtapa`); etapa que não começou começa quando a anterior termina (ou na data do plano, se for
    depois) e dura o que o plano previa. O fim da etapa 1 dá a 1ª parcela e o da última etapa, a 2ª (nunca no mesmo
    pagamento da 1ª enquanto não houver as duas datas do HUB); relatório enviado e projeto finalizado no HUB passam a
    valer no lugar da projeção. O balão explica a conta e avisa quando passar do dia 20 empurra o pagamento.
  - **Imposto** (`src/lib/imposto.ts`, tabela `financeiro_empresas`, em Configurações, uma configuração por empresa): a
    alíquota do Simples Nacional (serviços, Anexo III) cresce com o faturamento dos últimos 12 meses (6% → 11,2% →
    13,5% → 16% → 21% → 33%). A pessoa informa o faturamento; o sistema mostra a faixa, a alíquota efetiva (fórmula do
    Simples), quanto falta para a próxima faixa e avisa quando o que está previsto receber já a ultrapassa. Dá para
    fixar uma alíquota própria e programar **mudanças a partir de um mês** ("a partir de 12/2026 é 11%"). O imposto é
    descontado de cada entrada pela alíquota do mês em que o dinheiro entra (ou entra, se ainda previsto). É uma
    estimativa para planejamento: confirme faixa, anexo e fator R com o contador.
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
  **Ler agora com a extensão do Chrome/Edge** (`extensao-hub/`, arquivo para baixar em
  `public/blimp-hub-extensao.zip`, ponte em `src/lib/hub-extensao.ts`): uma página não lê outro site, então
  o consultor, na página do HUB, clica no ícone da extensão e em "Ler agora". A extensão lê o texto (com
  os quadros internos e os balões que só aparecem ao passar o mouse: dispara só eventos de passar o mouse
  em iniciais em círculo, ícones com title/tooltip e gatilhos de popover), acha os links de anexos, baixa com a sessão do próprio consultor (PDF e imagens
  até 10 MB cada, 24 MB no total, 12 arquivos; página de login no lugar do arquivo é recusada) e entrega
  ao projeto aberto no Blimp, cuja tela abre o painel sozinha. A IA lê o texto e os menores PDFs/imagens
  (limite de 4 MB do pedido); ao aplicar, todos os arquivos ficam em "Dados do projeto › Materiais do
  HUB" (bucket `evidencias`, pasta `hub/`). Só usa `activeTab` (acesso à aba só no clique); anexos em
  outro endereço pedem permissão no próprio botão da extensão. O botão "Puxar o texto da aba aberta do
  HUB" do Blimp continua para quem permitir o site nas opções. **Novo projeto a partir do HUB**
  (`src/components/projeto/importar-hub-novo.tsx`): o mesmo botão "Importar do HUB" na tela Novo projeto
  (a extensão também entrega ali). A IA, no modo "novo" da rota (recebe a lista de serviços da empresa),
  identifica cliente (CNPJ), serviço, código do pedido, gestor, contato e os passos/plano; o Blimp mostra a
  prévia e, ao criar, cadastra o cliente se não existir (dados da Receita + contato do HUB), cria o projeto
  (`src/lib/projeto-novo.ts`, a mesma montagem da tela manual) já nos passos do HUB e guarda os arquivos.
  Bloqueia pedido repetido (mesmo código) e cliente acima do limite de projetos. Sem CNPJ no conteúdo, o painel pede para digitar. O que a página do HUB não traz (datas dos passos, plano de trabalho, data de envio de cada etapa) o painel pede em campos de data (`CompletarDados`); pedido já cumprido no HUB entra com as etapas enviadas (ação `registrar_envio_etapa`: status, data, checklist e, se o PDF foi baixado do cartão da etapa, o relatório em Entregas), os passos e o plano. Os datados pela IA usam documentos como evidência (recibo = pagamento; atesto final = conclusão). **Botões de download sem endereço**: a extensão (opção ligada por padrão na janelinha) clica só no botão que parece de baixar em cada cartão de etapa e linha de documento (ícone de download; ou, em cartão com vários botões de ícone, o último que não pareça enviar/informações/excluir), com a página sem poder baixar sozinha nem navegar durante o clique: captura o `Blob` que a página monta (`URL.createObjectURL`), ou o endereço que ela abriria, e baixa com a sessão do consultor. **A IA lê cada relatório baixado** (rota no modo `relatorio`, um PDF por pedido, até 3,8 MB): data de fechamento, assinaturas, começo/fim das atividades e datas citadas. Elas preenchem o envio de cada etapa (a mais recente entre fechamento e assinaturas, editável), `iniciadaEm`, `dataRelatorio` e as assinaturas, e o histórico do projeto ganha eventos com as datas reais (`src/lib/hub-historico.ts`, `hub-documentos.ts`), reordenado do mais novo para o mais antigo. Os documentos que a página lista (contrato, recibo…) e não deu para baixar vão para o histórico do projeto (`src/lib/hub-documentos.ts`). Leitura e painel
  compartilhados em `src/components/projeto/hub-leitura.tsx`. Só o Blimp (`externally_connectable`)
  pede os dados à extensão, que apaga a cópia depois. O identificador é fixo (chave pública no
  manifesto). Depois de mudar a extensão, rode `extensao-hub/empacotar.sh` e suba o novo zip. Se o
  endereço do Blimp mudar, ajuste `externally_connectable`, `host_permissions` e `ORIGEM_BLIMP`.
- **Ler todos os projetos da lista do HUB** (extensão 1.6.0+, `lerLote` em `extensao-hub/fundo.js`): na lista de pedidos, "Ler todos os projetos da lista" acha o botão de abrir de cada linha (o código do pedido identifica a linha; link do mesmo site, senão a faixa da direita, senão a linha), clica, espera a página do pedido carregar, lê tudo como o "Ler agora" (`lerDetalhe`) e volta à lista **recarregando o endereço dela** (o botão "voltar" não serve: o Chrome pula telas que a página abriu sem clique de pessoa). Pede permissão ao endereço do HUB uma vez; o ícone mostra "2/7"; até 40 pedidos; dá para parar. O lote fica na extensão e o Blimp (tela Novo projeto, `LoteDoHub`) pede o resumo (`pegar-lote`) e, um a um, cada pedido com os arquivos (`pegar-item`). "Criar todos automaticamente" cria cliente e projeto de cada pedido pelo mesmo caminho do "Novo projeto a partir do HUB" (`ImportarHubNovo` com `inicial` e `automatico`): só cria sozinho se o CNPJ e o serviço foram reconhecidos e não há código repetido; senão o pedido espera pela pessoa e é criado assim que ela resolve (ou pula). O que já existe no Blimp (mesmo código) fica de fora.
- **Envolvidos e "Baixar"** (extensão 1.7.3): `lerPagina` acha as fotos e iniciais em círculo (a foto é `<img>`, as iniciais são texto curto; o círculo mais externo) e passa o mouse (eventos de ponteiro, mouse e foco, em cada elemento e nos 3 pais) lendo balões da página e texto novo; `descobrirBotoesDeDownload` passa o mouse em cada ícone do cartão da etapa e escolhe o que o balão chama de "Baixar" (as classes dos três botões são iguais), pula botão desligado e nunca clica em informações ou enviar. O botão pode abrir o PDF numa aba nova: `vigiarAbas` anota o endereço de cada aba que a página abre durante o clique, `baixarEndereco` baixa com a sessão (página, ou a extensão em outro site já permitido) e a aba é fechada; o arquivo costuma estar em outro site, então a janelinha pede uma vez a permissão `https://*/*` (opcional) e `padraoCasa` aceita o curinga. No Blimp, o CNPJ que a IA não achou no texto vem do relatório (a leitura de cada PDF devolve `cnpj` e `empresa`) ou do balão do cliente (`cnpjDoCliente`, com dígito verificador). No Blimp, a importação não pergunta mais as datas dos passos do HUB (pedido aberto, aceite…: são contexto para a IA); o plano e o envio das etapas ficam num bloco fechado, e a estimativa de envio é distribuída entre o pagamento e a conclusão, não a mesma data em todas. Opcional, "Mouse de verdade" na janelinha (permissão `debugger`): `chrome.debugger` move e clica o mouse de verdade (acende balões só de CSS) e, no clique, lê as respostas de rede e o `downloadWillBegin` para pegar o arquivo.
- **Botão de situação do HUB** (`lerStatus`): a leitura clica uma vez no botão colorido de situação, logo acima da trilha de passos, lê o que a página mostra e clica de novo para restaurar; o texto vai à IA na seção "[Ao clicar no botão de situação do projeto …]". Nunca clica em link nem em enviar de formulário.
- **Mover projeto para outra empresa** (`MoverProjeto`, função `mover_projeto` do banco): só gestor da empresa de origem, com acesso à de destino (administradores veem também as em estruturação). Os arquivos do bucket são copiados para a pasta da empresa de destino, a função do banco acerta empresa, cliente, consultor, serviço (o equivalente pela ficha, se existir), caminhos dos arquivos nos dados, na conversa e no financeiro, e registra o evento no histórico; só então os arquivos antigos saem (se algo falha, as cópias são removidas e nada muda). Cliente: o do mesmo CNPJ que já exista no destino; senão vai junto (se era só deste projeto) ou é copiado.
- **Etapas no formato do HUB SEBRAE**, tabelas do relatório (preenchidas pela conversa, ação
  `preencher_tabela`), redação por seção, checagem de completude.
- **Relatório Técnico em Word (.docx)** no papel timbrado do modelo (`public/modelos/relatorio-base.docx`).
  No texto: `## ` subtítulo, `a) ` alínea, `!QUADRO`/`!ALERTA` quadro, `[[tabela:x]]` tabela de registro e
  linhas `| A | B |` para tabelas avulsas (resumo, fluxo, metas). As colunas se ajustam ao conteúdo, e
  coluna vazia em todas as linhas não entra. O estilo que a IA segue (`src/lib/ia/estilo.ts`, em blocos:
  estilo, padrão, fidelidade aos fatos, RIPD, conclusão e matriz, parecer conclusivo e conteúdo) inclui o
  padrão do Relatório 01 assinado da NOV4. A capa leva as 14 linhas em todas as etapas (Período e Carga
  horária também na Etapa 01; sem plano, "A definir"). Marcadores `[completar: …]` e `[a confirmar: …]` saem
  com realce amarelo no Word e uma caixa "Pendências antes do envio" logo após a capa, que a pessoa apaga ao
  concluir; baixar o Word ou marcar "Enviei no HUB" com marcadores abertos avisa a contagem (e o envio fica
  bloqueado). O modelo `.docx` não leva a miniatura do Word (4,6 MB): cada relatório sem imagens pesa
  cerca de 300 KB. A data de "Consulta em" das referências e a "data-limite das informações" seguem a data
  "Informações até" da etapa (vazia: o fim previsto). Na conclusão, a "Matriz de entregas da Etapa 0X" traz o
  status de cada entregável (Atendido, Atendido parcialmente, Pendente de evidência, `statusDoEntregavel`).
  A seção final da última etapa é "Continuidade do programa após a consultoria" (`ehUltimaEtapa`).
- **Diagnóstico nas Entregas** (`DiagnosticoDoProjeto`, `src/components/projeto/diagnostico.tsx`; campo `projeto.diagnostico`):
  a área "Diagnóstico" fica no topo das Entregas, antes do Plano de Entrega (relatórios), para registrar o fluxo do
  projeto desde a fase 2 do HUB. **O diagnóstico segue o modelo do SEBRAE, nunca o dos relatórios**: o Word é o
  arquivo oficial (`public/modelos/diagnostico-base.docx`: capa, tabela "Dados da empresa demandante", os quatro quadros
  Contextualização/Anamnese, Investigação/Análise documental, Parecer técnico e Evidências, e o quadro de assinatura),
  preenchido por `gerarDocxDiagnostico` (`src/lib/relatorio/diagnostico-docx.ts`): os dados da empresa vêm do cadastro do
  cliente (e o código da solicitação, do projeto), as orientações em cinza do modelo saem, o que falta vira
  `[completar: …]` realçado, com uma caixa "Pendências antes do envio" antes da seção 1. **A IA não reescreve o texto a
  cada mensagem**: durante a conversa ela só reúne as informações e diz o que falta (a lista de `faltasDoDiagnostico` vai
  no contexto e aparece na tela); escreve os três textos **uma vez** (`escrever_diagnostico`, com desfazer) quando tem tudo
  ou quando o consultor pede, e só mexe depois a pedido. **A imagem da reunião** (foto ou print) é guardada na hora como
  evidência do diagnóstico (`guardar_evidencia_diagnostico`, não `guardar_anexo`, que é das etapas) e vai ao fim do Word com
  a legenda "Evidência 01 – …". **Telefone e e-mail do prestador e a data do quadro de assinatura não são campos de tela**:
  a IA pede ao consultor na conversa (entram na lista do que falta) e registra com `dados_do_diagnostico` (com desfazer).
  A área pode ser **reduzida ou expandida** (cabeçalho clicável; abre recolhida quando o arquivo final já está anexado
  ou enviado no HUB, mostrando só o resumo, e `#diagnostico` sempre abre). Nela: ver e editar os três textos à mão,
  adicionar/tirar imagens e editar legendas, baixar o Word, e **anexar o arquivo final** (Word ou PDF,
  o enviado no HUB; bucket `evidencias`, pasta `<empresa>/<projeto>/diagnostico/`), trocar e remover. A situação mostra
  "A elaborar", "Em elaboração", "Arquivo anexado" ou "Enviado no HUB em…". O "próximo passo" da fase do diagnóstico leva a
  `#diagnostico`. A IA nunca diz que "não pode enviar" o arquivo: aponta o botão em Entregas. O bucket aceita Word desde a
  migração `20261101000000_evidencias_word.sql`. O formato antigo (um texto só) é lido como a Contextualização.
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
  enviada, atrasada (passou do fim da execução ou do fim do plano do HUB), pronta para enviar, em andamento ou não iniciada. O cabeçalho,
  a trilha dos relatórios, o gráfico, os cartões e o painel usam a mesma função. Só há data de início
  quando a etapa começou de fato (`iniciadaEm`, registrada quando ela sai de "não iniciada"); uma etapa
  enviada sem esse registro começou no envio da anterior (ou, a primeira, no pagamento). Etapa que não
  começou mostra só o previsto.
- **Uma regra de atraso só** (`prazoDaEtapa` em `src/lib/projeto.ts`): etapa não enviada está atrasada
  quando passou do fim da execução (conta do pagamento) **ou** do fim do plano do HUB (o orçamento). A função
  devolve os dois números, a data vencida mais antiga e o texto ("3 dias de atraso · 7 dias além do plano do
  HUB"). Nenhuma tela compara datas por conta própria: situação da etapa, `etapasAtrasadas` (por projeto,
  só com a execução em curso), painel (números, pendências, cronograma, calendário, gráficos), cartões,
  filtro "Atrasados", tarefas, Entregas, trilha, balão do gráfico e o contexto da IA leem dela
  (`textoDoPrazo` para o texto). Etapa enviada guarda só a informação histórica ("enviada N dias além do plano").
- **Desvio do plano do HUB**: o sistema mostra "N dias além do plano do HUB" (cabeçalho, cartão, trilha,
  Entregas e balão do gráfico) quando uma etapa ainda não enviada passou do fim previsto no orçamento, ou
  foi enviada depois dele (`diasAlemDoPlano`). A IA corrige as datas do plano com a ação `alterar_plano_hub` (todas as etapas
  citadas de uma vez, em sequência, com desfazer); `alterar_datas_etapa` mexe só na execução.
  A situação do projeto (`situacaoProjeto`) segue a mesma regra do desvio (`desvioDoPlano`): devolvida >
  "Atrasado" (execução) > "N dias além do plano do HUB" > "Em dia", então nunca diz "Em dia" com o desvio à
  vista. Projeto concluído mostra "projeto entregue" (previsto 100%) e, se a última etapa saiu depois do
  plano, "entregue N dias além do plano do HUB" (`entregueAlemDoPlano`); o fim dele é o envio real da última etapa.
- **Chat**: Enter envia a mensagem; Shift+Enter pula a linha. A mensagem do plano de trabalho para a FUNCERN
  não fica mais na aba: a IA entrega pronta quando pedida (o texto vai no contexto do projeto). A resposta
  da IA vem em fluxo (uma linha JSON por evento: `vivo`, `progresso`, `fim`, `erro`; `src/lib/ia/fluxo.ts`), então
  a conexão não fica muda em respostas longas e o chat mostra "A IA está escrevendo…". Os erros do provedor são
  explicados por tipo (chave, saldo ou limite, modelo, requisição inválida, tempo esgotado, conexão, provedor;
  `src/lib/ia/erros.ts`), e o servidor registra status, tipo, request-id e corpo da resposta de erro. Para caber
  no tempo limite da função, a IA escreve no máximo três seções ou entregáveis por resposta e pede "continue".
  Se a conexão cair sem a resposta final, o chat diz que foi o tempo limite do servidor. As sugestões do chat
  e o "próximo passo" acompanham o estado real (escrever, resolver marcadores, anexar evidências). O Histórico
  mostra uma linha por alteração.
- **Cadastro de cliente por CNPJ**: só os dados da empresa (razão social, endereço, porte, ramo…) preenchem o
  cadastro. Responsável, e-mail e telefone da Receita são dados pessoais de sócios ou do contador: ficam como
  "Contato sugerido pela Receita Federal: dado pessoal, a conferir", com o botão "Usar depois de conferir"
  (minimização e finalidade, LGPD art. 6º). "Atualizar" e a importação do HUB também não os preenchem.
- **Excluir projeto** usa um modal próprio que pede para digitar EXCLUIR (sem `window.prompt`, que não funciona em
  navegadores embutidos); Esc e Cancelar não apagam nada.
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

## Testes

```bash
npm test    # textos-padrão, matriz de entregas, Word das 5 etapas, prompts, erros e fluxo da IA, CNPJ, exclusão
```

Rodam no Node (sem navegador nem banco; `testes/registrar.mjs` resolve os imports do projeto). Para ver os 5
Word de um projeto de teste: `SAIDA=pasta npm test`. A validação com a IA de verdade (seis cenários, projeto e
cliente fictícios, só em banco local) é `testes/cenarios-ia.mjs`, que precisa da chave da Anthropic no servidor:
instruções no topo do arquivo.

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
