# PRD — HUB de Gestão do Ecossistema Pivotto

| | |
|---|---|
| **Versão** | 0.2 (incorpora as respostas de 13/10/2026) |
| **Data** | 13/10/2026 |
| **Dono do produto** | Roberto Pivotto Nicodemo |
| **Empresas atendidas** | Pivotto & Pivotto Advocacia · ORB · EJUP |
| **Primeiro fluxo a implantar** | Consultoria de Adequação à LGPD via HUB SEBRAE (Sebraetec, ficha técnica 13070-5) |
| **Fontes** | Modelo de entregas (capa), Modelo de Diagnóstico HUB SEBRAE, Relatório Técnico de 1ª e de 2ª entrega (Nyxelfy AI Agency, projeto HUB 88306), tela das etapas no HUB SEBRAE, descritivo das 5 etapas |

---

## 1. Resumo

O HUB é um sistema de gestão único para as pessoas jurídicas de Roberto (e de Leonardo, na Pivotto & Pivotto). As três empresas funcionam de formas diferentes: a Pivotto & Pivotto trabalha por projeto com fases e entregas, a EJUP trabalha por curso e a ORB tem funcionamento próprio, ainda a levantar. Cada empresa entra no HUB com o próprio espaço, o próprio catálogo de serviços e os próprios fluxos. Um serviço é descrito como um **modelo de fluxo**: fases, atividades, entregáveis, documentos-modelo, horas e prazos. Cada contratação vira um **projeto** que segue esse modelo, do diagnóstico até a última assinatura.

O primeiro modelo, e o que justifica o MVP, é a consultoria de LGPD feita pela Pivotto & Pivotto pelo HUB SEBRAE: 5 etapas, 23 entregáveis obrigatórios, relatórios técnicos com estrutura fixa, assinatura gov.br e envio etapa a etapa no portal do SEBRAE.

O ganho principal não está em guardar arquivos, e sim em guardar **os registros que atravessam as etapas** (riscos, marcos, plano de ação, RoPA, fornecedores, normas, calendário, treinamentos). Hoje esses registros vivem dentro de cada relatório e são copiados à mão para o seguinte. No HUB, passam a ser dados do projeto, e cada relatório é gerado a partir deles.

---

## 2. Problema

1. **Cada empresa tem fluxos próprios e não há um lugar que os represente.** O controle de fase, prazo e entrega fica em pastas, WhatsApp e memória.
2. **A consultoria LGPD tem prazos curtos e rígidos.** As etapas duram de 3 a 6 dias corridos, incluindo fins de semana (51 a 103 horas previstas cada), com entregas sequenciais no HUB SEBRAE. Perder o prazo de uma etapa atrasa todas as seguintes.
3. **Os relatórios repetem estrutura e conteúdo.** Ficha de identificação, seções fixas, faixas de entregável, quadros de alerta, referências normativas e bloco de assinaturas se repetem em toda entrega. A montagem é manual.
4. **O conteúdo de uma etapa alimenta a seguinte.** Os riscos levantados na Etapa 01 são revistos na 02 (R1–R6); o RoPA preliminar da 02 é validado na 03; os marcos M1–M10 cruzam as cinco etapas; os "Encaminhamentos para a Etapa seguinte" viram o escopo da próxima. Sem um registro estruturado, isso se perde ou diverge entre versões.
5. **Separação entre empresas.** Os próprios relatórios exigem dos clientes "individualidade documental, contratual, operacional e tecnológica" entre empresas parceiras (caso Nyxelfy / ORB Negócios e Growth, empresa do cliente sem relação com a ORB do ecossistema). O ecossistema Pivotto precisa praticar o mesmo: clientes, documentos e acessos de cada PJ separados, com compartilhamento só quando houver finalidade.

---

## 3. Objetivos e métricas

| Objetivo | Métrica | Meta inicial |
|---|---|---|
| Nenhuma etapa SEBRAE entregue fora do prazo | % de etapas enviadas até a data-fim prevista | 100% |
| Reduzir o tempo de montagem do relatório | Horas entre "fim do levantamento" e "relatório pronto para assinatura" | –50% em relação ao processo atual (medir linha de base nos 2 primeiros projetos) |
| Relatórios sempre completos | Relatórios enviados com todos os entregáveis da ficha e todas as seções obrigatórias | 100% (o sistema bloqueia o envio quando falta algo) |
| Visão consolidada do ecossistema | Projetos ativos, etapa atual e próximo prazo visíveis em uma tela, por empresa e no grupo | Disponível no MVP |
| Reaproveitar registros entre etapas | Riscos, marcos, ações e RoPA criados uma vez e referenciados nas etapas seguintes | 100% dos registros do modelo LGPD |

**Fora dos objetivos do MVP:** financeiro/faturamento, CRM de prospecção, módulo de cursos da EJUP, fluxos da ORB, portal do cliente, integração automática com o HUB SEBRAE.

---

## 4. Usuários e perfis

| Perfil | Quem | O que faz |
|---|---|---|
| **Administrador do grupo** | Roberto | Cria empresas, define quem acessa o quê, vê o painel consolidado de todas as PJs. |
| **Gestor da empresa** | Sócio responsável por cada PJ (na Pivotto & Pivotto: Roberto e Leonardo) | Mantém o catálogo de serviços e os modelos de fluxo da empresa, distribui projetos, aprova entregas. |
| **Consultor responsável** | Roberto ou Leonardo, nos projetos da Pivotto & Pivotto | Conduz o projeto, preenche registros, gera e revisa relatórios, assina. |
| **Equipe / apoio** | Associados, estagiários | Executa atividades atribuídas, anexa evidências, redige seções. Sem acesso a projetos para os quais não foi designado. |
| **Cliente** *(fase 2)* | Responsável pela empresa demandante (ex.: Ayron, na Nyxelfy) | Acompanha etapas, envia documentos e informações solicitadas, assina. |

Partes que **não** usam o sistema, mas aparecem nos dados: Gestor(a) SEBRAE, prestadora vinculada (FUNCERN), fornecedores do cliente.

Um usuário pode pertencer a mais de uma empresa (Roberto está em todas). A empresa ativa aparece sempre no topo da tela e determina o que ele vê.

**Acesso por empresa (definido até aqui)**

| Empresa | Quem acessa | Observação |
|---|---|---|
| Pivotto & Pivotto | Roberto e Leonardo | Os dois como gestores e consultores; ninguém mais no MVP |
| ORB | Roberto e o terceiro sócio | Acessos configurados quando o módulo for estruturado |
| EJUP | Roberto | Em standby |

Leonardo usa o HUB só no espaço da Pivotto & Pivotto: não vê clientes, projetos nem painéis da ORB e da EJUP, e o painel consolidado do grupo fica restrito ao administrador.

---

## 5. Conceitos do domínio

```
Grupo (ecossistema Pivotto)
└── Empresa (PJ)  ── Pivotto & Pivotto · ORB · EJUP
    ├── Membros e papéis
    ├── Catálogo de serviços
    │   └── Modelo de fluxo (versionado)
    │       ├── Fases (ordem, horas previstas, duração padrão)
    │       │   ├── Atividades (checklist numerado da ficha)
    │       │   └── Entregáveis (obrigatórios, com seção-modelo)
    │       ├── Documentos-modelo (diagnóstico, relatório de etapa, capa)
    │       └── Registros do programa (tipos de tabela que atravessam fases)
    ├── Clientes (dados cadastrais, responsável, contatos)
    └── Projetos (instância de um modelo para um cliente)
        ├── Diagnóstico
        ├── Etapas (datas reais, horas, status, responsável)
        │   ├── Atividades (feito / pendente / não aplicável)
        │   ├── Entregáveis (conteúdo, status)
        │   ├── Evidências (prints, áudios, atas, fotos)
        │   └── Relatório da etapa (versões, PDF assinado)
        └── Registros do programa (riscos, marcos, ações, RoPA…)
```

**Modelo de fluxo** é o que torna o HUB útil para as três empresas: o gestor descreve o serviço uma vez e todo projeto daquele serviço nasce com as fases, os prazos, o checklist e os documentos certos. Alterar o modelo cria uma nova versão; projetos em andamento continuam na versão em que começaram.

---

## 6. O fluxo LGPD · HUB SEBRAE (modelo nº 1)

### 6.1 Ciclo completo do projeto

```
Demanda no HUB SEBRAE (código da solicitação)
  → Diagnóstico de qualificação da demanda (Modelo de Diagnóstico)
  → Projeto aprovado no HUB (nº do projeto, gestora SEBRAE, ficha 13070-5)
  → Contratação
  → Plano de trabalho (registro interno: Roberto define as datas de cada etapa; não gera documento)
  → Etapa 01 → Etapa 02 → Etapa 03 → Etapa 04 → Etapa 05
       cada etapa: levantamento → redação → revisão → assinaturas gov.br → envio no HUB → aprovação
  → Encerramento
```

### 6.2 Dados do projeto (alimentam a ficha de identificação de todo relatório)

Prestadora vinculada · Cliente (razão social e nome fantasia) · CNPJ · Responsável e cargo · Contato · Endereço · Gestor(a) SEBRAE · Nº do projeto HUB · Código da solicitação no HUB · Ficha técnica · Código da ficha técnica · Segmento · Área de atuação da consultoria · Consultor responsável.

Por etapa: período previsto e carga horária prevista.

### 6.3 As cinco etapas

Datas abaixo vêm de um projeto de exemplo. No modelo, a etapa guarda **horas previstas e uma duração de referência**. As datas reais não são fixas: o consultor responsável (Roberto) as define depois da contratação, no **plano de trabalho**, e elas passam a ser a base de prazos e avisos do projeto.

| Etapa | Nome | Horas previstas | Duração no exemplo | Entregáveis obrigatórios |
|---|---|---|---|---|
| 01 | Preparação | 51 h | 4 dias (05–08/10) | 6 |
| 02 | Organização | 64 h | 5 dias (09–13/10) | 4 |
| 03 | Implementação | 103 h | 6 dias (14–19/10) | 5 |
| 04 | Governança | 64 h | 4 dias (20–23/10) | 4 |
| 05 | Análise e Melhoria | 51 h | 3 dias (24–26/10) | 4 |
| **Total** | | **333 h** | **22 dias corridos** | **23** |

**ETAPA 01 | PREPARAÇÃO**
*Descrição:* analisar os requisitos de PD&P e seus impactos sobre o negócio; identificar leis, regulamentos e normas relevantes.
*Atividades:* 1. Estabelecer e organizar a governança de PD&P — 1.1 marcos críticos do programa; 1.2 lista de contatos dos Encarregados de fornecedores e parceiros · 2. Identificar leis pertinentes — 2.1 levantar normas e manifestações da ANPD · 3. Gerenciar o envolvimento da alta administração — 3.1 calendário de reuniões periódicas · 4. Processo de conscientização e treinamentos — 4.1 Plano de Treinamento anual; 4.2 reunião com comunicação/marketing e RH para o Plano de Comunicação e Conscientização.
*Entregáveis:* E1 Programa de Governança em Privacidade · E2 Relação de Encarregados de fornecedores e parceiros · E3 Inventário de normas e guias de PD&P · E4 Calendário de reuniões periódicas · E5 Plano de Treinamento para colaboradores · E6 Plano de Comunicação e Conscientização em PD&P.

**ETAPA 02 | ORGANIZAÇÃO**
*Descrição:* estabelecer as estruturas organizacionais e os mecanismos necessários à conformidade.
*Atividades:* 1. Manter e fortalecer o Programa, políticas e controles — 1.1 avaliar necessidade de criar/atualizar políticas, normas e procedimentos · 2. Atribuir responsabilidades — 2.1 revisitar riscos do ciclo anterior; 2.2 reunião com cada unidade que contém riscos · 3. Comprometimento institucional — 3.1 levantar documentos a publicar internamente; 3.2 reunião com stakeholders; 3.3 garantir conhecimento dos colaboradores · 4. Sistemas automatizados de PD&P — 4.1 formulário de RoPA; 4.2 incluir processos mapeados em planilha; 4.3 pesquisa de due diligence com fornecedores · 5. Planos de ação — 5.1 plano de ação das medidas aprovadas.
*Entregáveis:* E1 Revisão das políticas, normas e procedimentos · E2 Aprovação das medidas de prevenção e mitigação junto às áreas · E3 Disseminação e socialização de documentos · E4 Plano de ação para implementação das medidas.
*Instrumentos operacionais (das atividades 4.1 e 4.3):* RoPA preliminar · Due diligence de fornecedores e parceiros.

**ETAPA 03 | IMPLEMENTAÇÃO**
*Descrição:* executar o plano de ação; registrar as operações de tratamento; executar o Plano de Treinamento e Conscientização; criar canal de atendimento aos titulares.
*Atividades:* 1. Integração de PD&P — 1.1 notificação de cookies; 1.2 inventário de bancos de dados; 1.3 inventário de diretórios de arquivos; 1.4 outros diretórios a mapear · 2. Registro das operações — 2.1 reunião com cada responsável de processo para o RoPA · 3. Automatizar requisições de titulares · 4. Controles de segurança — 4.1 política de backup; 4.2 relatório de teste de integridade de backup; 4.3 ativação de serviços de cibersegurança; 4.4 registro de incidentes.
*Entregáveis:* E1 Mapeamento dos dados estruturados e não estruturados · E2 Registros das atividades de tratamento (RoPA) · E3 Automatização do atendimento aos titulares · E4 Integridade dos backups · E5 Central de registro de incidentes.

**ETAPA 04 | GOVERNANÇA**
*Descrição:* reunir informações sobre as atividades realizadas em relatórios de (i) treinamento e conscientização, (ii) impacto à proteção de dados e (iii) listagem de documentos elaborados.
*Atividades:* 1. Práticas de gestão do tratamento — 1.1 treinamentos e campanhas realizados · 2. Avaliar riscos — 2.1 relatório de riscos com medidas técnicas e administrativas; 2.2 riscos residuais às instâncias decisórias; 2.3 RIPDs de dados críticos e sensíveis · 3. Documentação atualizada — 3.1 atualizações no relatório de lições aprendidas.
*Entregáveis:* E1 Relatório de treinamentos e campanhas · E2 Relatório de riscos a dados pessoais · E3 Relatórios de Impacto à Proteção de Dados (RIPDs) · E4 Relatório de lições aprendidas.

**ETAPA 05 | ANÁLISE E MELHORIA**
*Descrição:* avaliar e melhorar o Programa de Conformidade, com relatório de lições aprendidas e atualização do Plano de Ação.
*Atividades:* 1. Monitorar leis e regulamentos — 1.1 analisar novas normas e guias da ANPD · 2. Avaliação Interna de Riscos à Privacidade (AIRP) · 3. Lições aprendidas — 3.1 propor novo ciclo DPMS · 4. Pesquisa interna — 4.1 pesquisa com pontos focais/colaboradores para o Relatório de Autoavaliação.
*Entregáveis:* E1 Relatório de monitoramento de leis e normas · E2 Relatório de AIRP · E3 Relatório de mudanças para o próximo ciclo do DPMS · E4 Relatório de Autoavaliação.

### 6.4 Status de uma etapa

A tela do HUB SEBRAE mostra, por etapa: título, descrição resumida, botões **informações / enviar / baixar** e o status **"A enviar"**. O HUB interno espelha isso e acrescenta os estados de produção:

`Não iniciada → Em levantamento → Em redação → Em revisão → Aguardando assinaturas → A enviar → Enviada no HUB → Aprovada` (ou `Devolvida para ajuste` → volta para `Em redação`).

Os estados do lado SEBRAE (enviada, aprovada, devolvida) são marcados à mão até que exista integração. *A confirmar: quais status o HUB SEBRAE exibe depois de "A enviar".*

---

## 7. Padrão obrigatório das entregas

Extraído dos dois modelos e dos dois relatórios entregues. A Pivotto & Pivotto segue este padrão **sem variação**: fluxo, papel timbrado, estrutura e escrita são os dos documentos de referência. O sistema trata isto como **regras do documento-modelo**: o gerador produz a estrutura, e a checagem de completude impede marcar a etapa como "A enviar" se algo faltar.

### 7.1 Diagnóstico de qualificação da demanda (antes da Etapa 01)

Documento no papel timbrado SEBRAE, com:
- **Dados da empresa demandante:** empresa cliente, CNPJ/inscrição, endereço, CEP, cidade/UF, e-mail, telefone/WhatsApp, site, responsável e cargo, porte, tempo de atividade, ramo, produtos/serviços, nº de empregados (administração/gestão, operacionais, total), código da solicitação no HUB.
- **Quatro seções:** 1. Contextualização/Anamnese (narrativa do cliente; distinguir *sintoma > problema > causa*) · 2. Investigação/Análise documental (roteiro da ficha técnica, quando houver) · 3. Parecer técnico (confirma se a ficha atende; se outra ficha for indicada, avisar o gestor SEBRAE) · 4. Evidências (prints da reunião online, fotos etc.).
- **Rodapé:** prestador/empresa credenciada, telefone, e-mail, local e data, assinatura do consultor responsável.

Os dados cadastrais do diagnóstico preenchem o cadastro do cliente e a ficha de identificação de todos os relatórios seguintes.

### 7.2 Relatório Técnico de Nª Entrega (uma por etapa)

**Formato**
- A4, papel timbrado FUNCERN + Sebraetec no cabeçalho de todas as páginas, exatamente como no modelo Word enviado (fonte oficial do cabeçalho e rodapé); número da página no rodapé.
- Tipografia serifada, corpo justificado com recuo de primeira linha; listas em alíneas `a)`, `b)`… com recuo grande, terminando em "; e" no penúltimo item.
- Títulos de seção numerados em azul (`1.`, `8.1.`); tabelas com cabeçalho azul-escuro e linhas zebradas.
- Numeração de seções **contínua dentro do relatório** (1 a 19), recomeçando a cada relatório.

**Estrutura**

| # | Bloco | Obrigatório | Observação |
|---|---|---|---|
| — | Título "RELATÓRIO TÉCNICO DE Nª ENTREGA" + "Adequação à Lei Geral de Proteção de Dados Pessoais (LGPD)" | Sim | N = número da etapa, por extenso no título da faixa ("PRIMEIRA ENTREGA") |
| — | Ficha de identificação (tabela de 2 colunas) | Sim | Campos de 6.2; da 2ª entrega em diante inclui "Período da Etapa NN" e "Carga horária prevista" |
| — | Faixa "DETALHES — Nª ENTREGA - ETAPA NN \| NOME" | Sim | |
| 1 | Objeto da Nª entrega | Sim | Cita a ficha técnica Sebraetec nº 13070-5 e a finalidade da etapa |
| — | Quadro **NATUREZA DA ENTREGA** | Sim | Delimita o que a entrega é e o que fica para as etapas seguintes |
| 2 | Escopo, metodologia e limitações | Sim | Fontes usadas (i)…(vii), objetivos em alíneas, **o que não foi feito** e data-limite das informações |
| 3 | Atividades realizadas | Sim | Alíneas, uma por atividade |
| 4 | Caracterização da empresa / organizacional e responsabilidades | Sim | Inclui tabela pessoa/entidade · função · responsabilidade em PD&P |
| 5–7 | Mapeamento, diagnóstico técnico-jurídico, riscos | Conforme etapa | Processos (P1…), papéis controlador/operador, riscos com nível |
| — | Faixa **ENTREGÁVEL N — NOME** para cada entregável da ficha | Sim, todos | Na ordem da ficha |
| — | Faixa **INSTRUMENTO COMPLEMENTAR / OPERACIONAL** | Quando houver | Ex.: Marcos críticos, RoPA preliminar, Due diligence |
| — | Quadros de destaque | Quando couber | **ALERTA** (borda laranja), **CRITÉRIO DE VALIDAÇÃO**, **SEPARAÇÃO ENTRE AS EMPRESAS**, **COMPROMETIMENTO INSTITUCIONAL**, **CONTROLE TRANSITÓRIO** |
| — | Medidas imediatas / Plano de ação | Sim | Tabela com ID, medida, conteúdo/evidência, responsável, prazo ("Imediato", "Até Etapa 3") |
| — | Encaminhamentos para a Etapa NN+1 | Sim (Etapas 01–04) | Alíneas; viram a pauta inicial da próxima etapa |
| — | Conclusão da Nª entrega | Sim | Fecha com "considera-se cumprida/estruturada…" e lista o que foi entregue |
| — | Evidências de levantamento e validação | Sim | Figuras numeradas com legenda em itálico ("Figura 1 - …"): prints de WhatsApp, áudios, atas, comunicados |
| — | Referências normativas e técnicas | Sim | Numeradas `[1]…[n]`, citadas no texto como `[1][3]`; fontes externas com "Consulta em dd/mm/aaaa" |
| — | Quadro **ATUALIZAÇÃO REGULATÓRIA** | Sim | Data da consulta e aviso de monitoramento contínuo |
| — | Local e data ("Natal/RN, 06 de agosto de 2026.") | Sim | |
| — | Assinaturas gov.br | Sim | Consultor Responsável + Responsável pela Empresa Demandante |

### 7.3 Modelo de entregas (capa)

Capa/folha de assinatura com: Projeto nº, Cliente, Gestor, Consultor, "Natal, __ de ____ de 2026." e campos de assinatura CLIENTE e CONSULTOR. O sistema preenche a partir do projeto.

### 7.4 Regras de conteúdo que o sistema deve apoiar

- Linguagem técnico-jurídica, impessoal, sem afirmar controle que não foi verificado: controles classificados como **"informados"**, **"não formalizados"** ou **"pendentes de verificação"**.
- Fornecedor não identificado com segurança fica como **pendência** até confirmação (caso "Rushing").
- Toda medida tem responsável, evidência esperada e prazo.
- Cada referência externa guarda a data de consulta.

---

## 8. Requisitos funcionais

Prioridade: **P0** = MVP · **P1** = logo após o MVP · **P2** = depois.

### 8.1 Empresas, usuários e acesso
- **RF-01 (P0)** Cadastro de empresas do grupo com identidade própria (nome, CNPJ, logo, papel timbrado padrão).
- **RF-02 (P0)** Usuários com papel por empresa (seção 4). Um usuário pode ter papéis diferentes em empresas diferentes.
- **RF-03 (P0)** Troca de empresa ativa; tudo o que aparece na tela é filtrado pela empresa ativa, exceto o painel do grupo.
- **RF-04 (P0)** Isolamento de dados por empresa no banco (não só na interface). Compartilhar um cliente ou projeto entre empresas exige ação explícita e fica registrado.
- **RF-05 (P0)** Acesso a projeto por designação: equipe só vê projetos em que está alocada.
- **RF-06 (P0)** Login com MFA obrigatório para administradores e consultores.
- **RF-07 (P0)** **Módulos visíveis desde o MVP.** O menu mostra os três módulos, um por empresa, cada um com seu status:

  | Módulo | Status no MVP | O que aparece |
  |---|---|---|
  | **Pivotto & Pivotto** | Ativo | Sistema completo (projetos, etapas, relatórios, registros, painéis) |
  | **ORB** | Em estruturação | Tela do módulo com nome, sócios (Roberto e o terceiro sócio) e o aviso "módulo em estruturação"; sem projetos nem cadastros |
  | **EJUP** | Standby | Tela do módulo com o aviso "em standby", indicando que o modelo será por curso |

  As empresas já existem no banco, com isolamento ativo, para que cada módulo seja ligado depois sem migração. Só o administrador do grupo vê os módulos ORB e EJUP enquanto estiverem inativos.

### 8.2 Catálogo e modelos de fluxo
- **RF-10 (P0)** Cadastro de serviço com modelo de fluxo: fases ordenadas, descrição, horas previstas, duração padrão em dias (corridos ou úteis, configurável), atividades numeradas (com subitens) e entregáveis.
- **RF-11 (P0)** Modelo LGPD · HUB SEBRAE pré-carregado com o conteúdo da seção 6.
- **RF-12 (P0)** Documento-modelo por fase (relatório da etapa) e por projeto (diagnóstico, capa), com as regras da seção 7.
- **RF-13 (P1)** Editor de modelos para o gestor da empresa criar novos serviços sem desenvolvedor.
- **RF-14 (P1)** Versionamento de modelos; projetos ficam presos à versão de origem.
- **RF-15 (P1)** Tipos de registro configuráveis por modelo (seção 8.5).

### 8.3 Clientes e projetos
- **RF-20 (P0)** Cadastro de cliente com os campos do Diagnóstico (7.1).
- **RF-21 (P0)** Criar projeto a partir de um modelo, informando cliente, consultor, nº do projeto HUB, código da solicitação, gestor(a) SEBRAE, prestadora vinculada, segmento e área de atuação.
- **RF-22 (P0)** **Plano de trabalho**: depois da contratação, o consultor responsável define data de início e fim de cada etapa. O sistema sugere datas a partir da duração de referência do modelo (em dias corridos, inclusive fins de semana, como no exemplo: Etapa 05 de sábado 24/10 a segunda 26/10), mas a decisão é do consultor. O plano de trabalho é **só um registro interno** no projeto (datas e horas por etapa): não é enviado formalmente ao SEBRAE nem ao cliente e não tem documento-modelo. Enquanto o plano de trabalho não for fechado, o projeto fica em "Aguardando plano de trabalho" e as etapas não geram avisos.
- **RF-22b (P0)** Alterar uma data depois do plano fechado exige justificativa e fica no histórico do projeto (data original × data atual).
- **RF-23 (P0)** Tela do projeto no formato da tela do HUB SEBRAE: uma linha por etapa, com título, descrição resumida, período, horas, status e ações (ver detalhes, enviar arquivo, baixar).
- **RF-24 (P0)** Checklist de atividades por etapa (feito / pendente / não aplicável com justificativa).
- **RF-25 (P1)** Lançamento de horas por etapa, comparado às horas previstas.

### 8.4 Etapas, entregas e documentos
- **RF-30 (P0)** Status da etapa conforme 6.4, com histórico (quem mudou, quando).
- **RF-31 (P0)** Área de redação do relatório organizada pelas seções obrigatórias (7.2), já com ficha de identificação, faixas e textos fixos preenchidos.
- **RF-32 (P0)** Geração do relatório em **DOCX** (editável) e **PDF** no papel timbrado, com numeração de seções, figuras e referências automática.
- **RF-33 (P0)** Checagem de completude antes de "A enviar": todos os entregáveis da ficha presentes, seções obrigatórias preenchidas, ao menos uma evidência, referências com data de consulta, local e data.
- **RF-34 (P0)** Upload do PDF assinado (gov.br) e marcação de cada assinatura (consultor, responsável do cliente) com data.
- **RF-35 (P0)** Upload de evidências (imagem, áudio, PDF) com legenda; as marcadas como "incluir no relatório" entram como figuras numeradas.
- **RF-36 (P0)** Geração do Diagnóstico de qualificação e da capa (Modelo de entregas).
- **RF-37 (P1)** Versões do relatório (rascunho 1, 2, final) com comparação.
- **RF-38 (P1)** Biblioteca de trechos reutilizáveis por empresa: textos-padrão de "Natureza da entrega", quadros de alerta, inventário normativo.

### 8.5 Registros do programa (o que atravessa as etapas)

Tabelas estruturadas por projeto, com ID estável, editadas em qualquer etapa e inseridas nos relatórios como tabelas formatadas. Cada linha guarda em que etapa foi criada e quando foi alterada.

| Registro | Colunas mínimas | Nasce | Usado em |
|---|---|---|---|
| Pessoas e responsabilidades | pessoa/entidade, função, responsabilidade em PD&P | 01 | todas |
| Marcos críticos (M1…) | objetivo, critério de conclusão, fase, responsável, status | 01 | 01–05 |
| Fornecedores e parceiros | nome, serviço, dados/ativos, canal/encarregado, providência, status de due diligence | 01 | 02, 03 |
| Inventário normativo | norma/guia, conteúdo, aplicação ao cliente, data de consulta | 01 | 01, 05 |
| Calendário de reuniões | data, horário, pauta, evidência, realizada? | 01 | todas |
| Plano de treinamento (T1…) | tema, conteúdo, carga, previsão, realizado? | 01 | 03, 04 |
| Plano de comunicação | mês, tema, mensagem-chave, formato | 01 | 03, 04 |
| Processos (P1…) | processo, descrição, dados/ativos | 01–02 | 02, 03 |
| Riscos (R1…) | tema, achado, nível, medida, prazo, responsável, status | 01–02 | 02, 04, 05 |
| Plano de ação (A1…) | ação, responsável, evidência esperada, prazo, status | 01–02 | 03–05 |
| Arquitetura documental | documento, status (criar/revisar), conteúdo mínimo | 02 | 03, 04 |
| RoPA | os 16 campos do formulário (identificador, processo, área, papel, titulares, dados, finalidade, base legal/instrução, origem, sistemas, compartilhamentos, transferência internacional, retenção, segurança, risco/mitigação, data da revisão) | 02 | 03 |
| Incidentes | data, descrição, dados afetados, contenção, comunicação | 03 | 04 |

- **RF-40 (P0)** Os registros acima, para o modelo LGPD.
- **RF-41 (P0)** Inserir um registro (inteiro ou filtrado) em qualquer seção do relatório.
- **RF-42 (P1)** Exportar RoPA e due diligence em planilha (o relatório 2 cita "o modelo será mantido em planilha").
- **RF-43 (P1)** "Encaminhamentos para a próxima etapa" viram itens de checklist da etapa seguinte.

### 8.6 Prazos, tarefas e avisos
- **RF-50 (P0)** Painel do grupo: projetos ativos de todas as empresas, etapa atual, dias restantes, atrasos.
- **RF-51 (P0)** Painel da empresa e "Minhas tarefas" por usuário.
- **RF-52 (P0)** Avisos por e-mail: etapa começando, 2 dias e 1 dia antes do fim, etapa atrasada, assinatura pendente.
- **RF-53 (P1)** Avisos por WhatsApp.
- **RF-54 (P1)** Exportação da agenda do projeto para Google Calendar.

### 8.7 Assistência por IA (P1)
- **RF-60** Transcrição de áudios enviados como evidência (o levantamento da Etapa 02 do caso Nyxelfy foi feito por áudios de WhatsApp).
- **RF-61** Rascunho de seções a partir de transcrições, notas e registros, sempre marcado como rascunho até revisão do consultor.
- **RF-62** Sugestão de itens para registros (processos, riscos, fornecedores) a partir do material coletado.
- **RF-63** Revisão de completude e coerência: entregável sem conteúdo, risco sem medida, referência sem data de consulta.

A IA nunca envia, assina nem muda status de etapa. O provedor de IA passa pela mesma due diligence que a consultoria exige dos clientes (contrato, DPA, região, não uso para treinamento).

### 8.8 Integrações
- **RF-70 (P1)** Google Drive como repositório oficial: pasta por empresa › cliente › projeto › etapa, criada automaticamente, com o PDF final e as evidências.
- **RF-71 (P2)** HUB SEBRAE: sem API conhecida. No MVP, o sistema gera o arquivo final pronto para upload manual e o usuário registra o envio. Avaliar automação depois.
- **RF-72 (P2)** Assinatura gov.br: fluxo manual (assinador ITI) no MVP; avaliar API de assinatura depois.

---

## 9. Outras empresas e serviços

As três empresas têm funcionamentos diferentes. O MVP entrega o fluxo da Pivotto & Pivotto completo e a estrutura de empresas e modelos que vai receber as outras duas:

| Empresa | Serviços prováveis | O que precisamos saber |
|---|---|---|
| **Pivotto & Pivotto** | LGPD · HUB SEBRAE (modelo 1) | **Definido:** segue exatamente o fluxo, o papel timbrado e a escrita dos documentos de referência (seções 6 e 7). Em aberto: outras fichas Sebraetec e serviços advocatícios de Leonardo. |
| **EJUP** | Cursos | **Standby.** Trabalha por curso, não por projeto. O módulo aparece no MVP só como tela de aviso (RF-07); o modelo de cursos será desenhado quando o processo estiver estruturado. |
| **ORB** | A levantar | **Depois do MVP.** Sócios: Roberto e um terceiro sócio. Funcionamento próprio, diferente das outras duas. O módulo aparece no MVP só como tela de aviso (RF-07); serviços, etapas e entregas serão levantados quando for estruturado. |

---

## 10. Requisitos não funcionais

O HUB guarda dados pessoais de clientes de uma consultoria de LGPD. Ele precisa cumprir o que os relatórios recomendam.

- **Segurança:** MFA; contas individuais; menor privilégio por empresa e por projeto; sessões com expiração; criptografia em trânsito e em repouso; segredos fora do código.
- **Separação entre empresas:** isolamento no banco (ex.: Row Level Security por empresa), não só na interface.
- **Auditoria:** log de acesso e alteração em projetos, registros, documentos e permissões.
- **Retenção:** prazo de guarda configurável por empresa; descarte com evidência ao fim do prazo.
- **Backup:** diário, com teste de restauração periódico registrado.
- **Titulares:** exportação e exclusão de dados de uma pessoa sob demanda.
- **Fornecedores do próprio HUB** (hospedagem, banco, IA, e-mail) listados com região, DPA e subprocessadores — a "Relação de fornecedores" do próprio sistema.
- **Usabilidade:** interface em português; funcionar bem no celular para consulta de status e envio de evidência; redação do relatório pensada para desktop.
- **Documentos:** o DOCX gerado deve abrir no Word sem perder formatação e ser fiel ao padrão visual dos relatórios atuais.

---

## 11. Escopo do MVP

**Dentro**
1. Empresas, usuários, papéis e isolamento, com os módulos ORB e EJUP visíveis como inativos (RF-01 a 07).
2. Modelo LGPD · HUB SEBRAE pré-carregado (RF-10 a 12).
3. Clientes e projetos com calendário de etapas e tela no formato do HUB (RF-20 a 24).
4. Status, redação estruturada, geração DOCX/PDF, checagem de completude, assinaturas, evidências, diagnóstico e capa (RF-30 a 36).
5. Registros do programa do modelo LGPD (RF-40, 41).
6. Painéis e avisos por e-mail (RF-50 a 52).

**Critério de pronto do MVP:** um projeto LGPD real conduzido do diagnóstico ao relatório da Etapa 05 dentro do HUB, com os cinco relatórios gerados pelo sistema e enviados no prazo.

**Depois do MVP:** editor de modelos e versões, horas, biblioteca de trechos, IA, Drive, WhatsApp, Calendar, portal do cliente, fluxos da ORB, módulo de cursos da EJUP.

---

## 12. Roadmap sugerido

| Fase | Entrega | Foco |
|---|---|---|
| 0 | Validação deste PRD; levantamento do funcionamento da ORB | Decisões |
| 1 — MVP | Seção 11 | Pivotto & Pivotto · LGPD SEBRAE |
| 2 | Editor de modelos, versões, horas, biblioteca de trechos, Google Drive, exportação de planilhas; fluxos da ORB | ORB e outros serviços |
| 3 | IA (transcrição, rascunho, revisão), WhatsApp, Calendar | Velocidade de produção |
| 4 | Portal do cliente, módulo de cursos da EJUP, painel financeiro | Expansão |

---

## 13. Sugestão técnica (não vinculante)

- **Aplicação web:** Next.js hospedado na Vercel (o repositório já usa Vercel).
- **Banco e autenticação:** Postgres com Row Level Security por empresa (ex.: Supabase), MFA nativo.
- **Documentos:** geração de DOCX a partir dos modelos Word atuais (ex.: docxtemplater), conversão para PDF no servidor.
- **Arquivos:** armazenamento de objetos com URLs assinadas; espelho no Google Drive na fase 2.
- **E-mail:** serviço transacional para avisos.
- **IA:** API de modelo de linguagem com contrato empresarial, sem retenção para treinamento.

---

## 14. Perguntas em aberto

1. **Nome do sistema** e domínio.
2. **ORB:** quais serviços presta, como é o fluxo de cada um, quem trabalha neles.
3. **Status no HUB SEBRAE:** quais aparecem depois de "A enviar" (enviado, em análise, aprovado, devolvido)? Existe prazo de análise pelo gestor SEBRAE?
4. **Serviços de Leonardo:** além da consultoria LGPD SEBRAE, há outros serviços da Pivotto & Pivotto (advocacia, processos, prazos processuais) que ele vai gerir no HUB? Cada um vira um modelo de fluxo.
5. **Cliente com acesso:** o responsável do cliente deve entrar no sistema já no início, ou só na fase 4?
6. **Volume:** quantos projetos LGPD SEBRAE simultâneos são esperados por mês?

### Decisões registradas (13/10/2026)

| Tema | Decisão |
|---|---|
| Terceira empresa | ORB |
| Funcionamento das empresas | As três funcionam de formas diferentes; cada uma terá os próprios modelos |
| Pivotto & Pivotto | Segue exatamente o fluxo SEBRAE descrito, com o papel timbrado (FUNCERN + Sebraetec) e a escrita dos documentos de referência |
| Ordem de construção | Começa pela Pivotto & Pivotto, que já tem estrutura fechada |
| EJUP | Trabalha por curso; em standby. Módulo visível, sem funcionalidade |
| Datas das etapas | Definidas por Roberto depois da contratação, no plano de trabalho |
| Plano de trabalho | Registro interno no sistema; não é enviado formalmente e não tem documento |
| Leonardo | Usa o HUB, no espaço da Pivotto & Pivotto |
| Acesso à Pivotto & Pivotto | Somente Roberto e Leonardo |
| ORB | Empresa própria do ecossistema (Roberto e um terceiro sócio); não é a ORB Negócios e Growth citada nos relatórios da Nyxelfy. Estruturação depois do MVP; módulo visível, sem funcionalidade |

---

## Anexo A — Glossário

| Termo | Significado |
|---|---|
| **HUB SEBRAE** | Portal do SEBRAE onde demandas, projetos e entregas Sebraetec são registrados e enviados |
| **Ficha técnica** | Especificação do serviço Sebraetec (aqui, 13070-5 — Adequação à LGPD), com etapas, horas e entregas |
| **PD&P** | Proteção de Dados e Privacidade |
| **DPMS** | *Data Protection Management System*, o ciclo do programa de privacidade |
| **RoPA** | Registro das Operações de Tratamento de dados pessoais (art. 37 da LGPD) |
| **RIPD** | Relatório de Impacto à Proteção de Dados Pessoais |
| **AIRP** | Avaliação Interna de Riscos à Privacidade |
| **DPA** | Acordo de processamento de dados com fornecedor |
| **Encarregado** | Pessoa indicada para atuar como canal com titulares e ANPD (DPO) |
