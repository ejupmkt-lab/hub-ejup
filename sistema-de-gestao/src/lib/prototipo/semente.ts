import { modeloLgpdSebrae } from "../modelos/lgpd-sebrae";
import type { ModeloFluxo } from "../modelos/tipos";
import { sugerirDatas } from "../datas";
import type { Cliente, Estado, Etapa, Projeto } from "./tipos";

// Dados fictícios para o protótipo. Nenhum cliente real.

export function etapasDoModelo(modelo: ModeloFluxo): Etapa[] {
  return modelo.etapas.map((e) => ({
    ordem: e.ordem,
    nome: e.nome,
    descricao: e.descricao,
    horasPrevistas: e.horasPrevistas,
    duracaoReferenciaDias: e.duracaoReferenciaDias,
    dataInicio: null,
    dataFim: null,
    dataInicioPlano: null,
    dataFimPlano: null,
    status: "nao_iniciada",
    atividades: e.atividades.map(([codigo, texto]) => ({
      codigo,
      texto,
      nivel: codigo.split(".").length,
      status: "pendente",
      justificativa: "",
    })),
    entregaveis: [
      ...e.entregaveis.map((titulo) => ({ titulo, tipo: "entregavel" as const, conteudo: "" })),
      ...e.instrumentos.map((titulo) => ({ titulo, tipo: "instrumento" as const, conteudo: "" })),
    ],
    secoes: {},
    dataRelatorio: null,
    assinaturaConsultor: null,
    assinaturaCliente: null,
  }));
}

const clienteExemplo: Cliente = {
  id: "cli-aurora",
  empresa: "pivotto",
  razaoSocial: "CLÍNICA AURORA SERVIÇOS MÉDICOS LTDA",
  nomeFantasia: "CLÍNICA AURORA",
  cnpj: "00.000.000/0001-00",
  endereco: "Av. Exemplo, nº 100, Sala 2, Lagoa Nova",
  cep: "59.000-000",
  cidadeUf: "Natal/RN",
  email: "contato@clinicaaurora.exemplo",
  telefone: "(84) 90000-0000",
  site: "clinicaaurora.exemplo",
  responsavel: "Mariana Exemplo da Silva",
  cargoResponsavel: "Sócia-administradora",
  porte: "Microempresa",
  tempoAtividade: "6 anos",
  ramo: "Saúde — clínica médica",
  produtosServicos: "Consultas, exames laboratoriais e telemedicina",
  empregadosGestao: "2",
  empregadosOperacionais: "9",
};

const clienteExemplo2: Cliente = {
  ...clienteExemplo,
  id: "cli-vela",
  razaoSocial: "VELA SOLUÇÕES DIGITAIS LTDA",
  nomeFantasia: "VELA DIGITAL",
  cnpj: "11.111.111/0001-11",
  email: "contato@vela.exemplo",
  site: "vela.exemplo",
  responsavel: "Pedro Exemplo Santos",
  cargoResponsavel: "Diretor",
  ramo: "Tecnologia — desenvolvimento de software",
  produtosServicos: "Aplicativos e sistemas sob demanda",
  empregadosGestao: "1",
  empregadosOperacionais: "4",
};

function projetoExemplo(): Projeto {
  const etapas = etapasDoModelo(modeloLgpdSebrae);
  const datas = sugerirDatas("2026-10-05", etapas.map((e) => e.duracaoReferenciaDias));
  etapas.forEach((e, i) => {
    e.dataInicio = e.dataInicioPlano = datas[i].inicio;
    e.dataFim = e.dataFimPlano = datas[i].fim;
  });

  // Etapa 01: enviada, completa
  const e1 = etapas[0];
  e1.status = "enviada";
  e1.atividades.forEach((a) => (a.status = "feito"));
  e1.dataRelatorio = "2026-10-08";
  e1.assinaturaConsultor = "2026-10-08";
  e1.assinaturaCliente = "2026-10-08";
  e1.secoes = {
    objeto:
      "O presente Relatório Técnico registra a primeira entrega da consultoria de Adequação à Lei Geral de Proteção de Dados Pessoais (LGPD) contratada pela Clínica Aurora Serviços Médicos Ltda., correspondente à ETAPA 01 | PREPARAÇÃO da ficha técnica Sebraetec nº 13070-5. A entrega abrange a análise inicial dos requisitos de privacidade e proteção de dados pessoais e de seus impactos sobre o negócio, a estruturação preliminar da governança, os marcos críticos do programa, o levantamento normativo e os planos de reuniões, treinamento, comunicação e conscientização.",
    natureza:
      "Este relatório consolida o diagnóstico técnico-jurídico e entrega os instrumentos iniciais de governança previstos para a Etapa 01. O mapeamento exaustivo das operações e o Registro das Operações de Tratamento (RoPA) serão aprofundados nas etapas subsequentes.",
    escopo:
      "A elaboração utilizou: (i) o diagnóstico de qualificação da demanda; (ii) entrevista com a sócia-administradora; (iii) informações cadastrais da empresa; e (iv) pesquisa das normas e orientações oficiais vigentes.\n\na) Identificação das atividades que envolvem dados pessoais, inclusive dados sensíveis de saúde;\nb) Avaliação inicial da maturidade de governança e segurança; e\nc) Estruturação dos seis entregáveis previstos para a Etapa 01.\n\nAs conclusões refletem as informações disponíveis até 08 de outubro de 2026. Não foram realizados, nesta etapa, testes técnicos, inspeção de sistemas ou análise de contratos; por isso, determinados controles foram classificados como \"informados\" ou \"pendentes de verificação\".",
    atividades_realizadas:
      "a) Análise do diagnóstico e do contexto que motivou a consultoria;\nb) Levantamento da estrutura organizacional e definição do responsável interno pelo programa;\nc) Elaboração do inventário normativo, do calendário de reuniões e dos planos de treinamento e comunicação; e\nd) Definição dos marcos críticos e dos encaminhamentos para a Etapa 02.",
    caracterizacao:
      "A Clínica Aurora presta serviços de consultas, exames e telemedicina, com tratamento rotineiro de dados pessoais sensíveis de saúde. A estrutura informada conta com duas pessoas na gestão e nove na operação.\n\n[[tabela:pessoas]]",
    medidas: "[[tabela:acoes]]",
    encaminhamentos:
      "a) Mapear detalhadamente os processos de atendimento, agendamento, exames e telemedicina;\nb) Configurar o formulário simplificado de RoPA; e\nc) Realizar due diligence dos fornecedores de prontuário eletrônico e telemedicina.",
    conclusao:
      "Com esta entrega, considera-se estruturada a preparação do programa: foram definidos o responsável interno, a arquitetura de governança, os marcos críticos, o inventário normativo, o calendário de reuniões, o plano anual de treinamento e o plano de comunicação e conscientização.",
    evidencias:
      "Os registros abaixo comprovam a interação consultiva e a coleta de informações.\n\nFigura: Reunião de levantamento com a responsável interna.",
  };
  e1.entregaveis[0].conteudo =
    "## Objetivo\nEstabelecer estrutura proporcional ao porte e aos riscos da Clínica Aurora para demonstrar conformidade, prevenir danos e organizar responsabilidades.\n\n## Escopo\na) Dados de pacientes, representantes, empregados e fornecedores;\nb) Prontuário eletrônico, agenda, telemedicina e exames; e\nc) Cada operação, desde o agendamento até o descarte.";
  e1.entregaveis[1].conteudo = "[[tabela:fornecedores]]";
  e1.entregaveis[2].conteudo = "[[tabela:normas]]";
  e1.entregaveis[3].conteudo = "[[tabela:reunioes]]";
  e1.entregaveis[4].conteudo = "[[tabela:treinamentos]]";
  e1.entregaveis[5].conteudo =
    "A responsável interna será a emissora dos comunicados. E-mail e WhatsApp poderão ser usados para alertas rápidos; o Google Drive será o repositório oficial das versões, atas e evidências.";
  e1.entregaveis[6].conteudo = "[[tabela:marcos]]";

  // Etapa 02: em redação (hoje é o último dia previsto)
  const e2 = etapas[1];
  e2.status = "em_redacao";
  e2.atividades.slice(0, 9).forEach((a) => (a.status = "feito"));
  e2.secoes = {
    objeto:
      "O presente Relatório Técnico registra a segunda entrega da consultoria de Adequação à LGPD da Clínica Aurora, correspondente à ETAPA 02 | ORGANIZAÇÃO da ficha técnica Sebraetec nº 13070-5.",
    diagnostico: "[[tabela:riscos]]",
  };

  return {
    id: "prj-aurora",
    empresa: "pivotto",
    clienteId: clienteExemplo.id,
    modeloId: modeloLgpdSebrae.id,
    modeloVersao: modeloLgpdSebrae.versao,
    consultorId: "roberto",
    status: "em_andamento",
    prestadoraVinculada: "FUNCERN",
    numeroProjetoHub: "90001",
    codigoSolicitacaoHub: "SOL-0001",
    gestorSebrae: "Gestora Exemplo",
    fichaTecnica: modeloLgpdSebrae.fichaTecnica,
    codigoFichaTecnica: modeloLgpdSebrae.codigoFichaTecnica,
    segmento: "Clínica médica e telemedicina",
    areaAtuacao: "Governança em privacidade e proteção de dados pessoais aplicada a serviços de saúde",
    localAssinatura: "Natal/RN",
    planoFechadoEm: "2026-10-03T14:00:00",
    etapas,
    registros: [
      { id: "r1", tipo: "pessoas", codigo: "PR1", etapaOrigem: 1, dados: { pessoa: "Mariana Exemplo da Silva", funcao: "Sócia-administradora / responsável interna", responsabilidade: "Aprovar políticas e riscos; coordenar o programa; receber incidentes e solicitações." } },
      { id: "r2", tipo: "pessoas", codigo: "PR2", etapaOrigem: 1, dados: { pessoa: "Roberto Pivotto Nicodemo", funcao: "Consultor responsável", responsabilidade: "Orientar a adequação, elaborar entregas e apoiar a validação técnica." } },
      { id: "r3", tipo: "marcos", codigo: "M1", etapaOrigem: 1, dados: { objetivo: "Formalizar a governança", criterio: "Aprovar programa e confirmar a responsável interna.", fase: "Etapa 1", responsavel: "Direção" } },
      { id: "r4", tipo: "marcos", codigo: "M2", etapaOrigem: 1, dados: { objetivo: "Mapear operações", criterio: "Inventariar atendimento, agenda, exames e telemedicina.", fase: "Etapas 2 e 3", responsavel: "Responsável interna + equipe" } },
      { id: "r5", tipo: "fornecedores", codigo: "F1", etapaOrigem: 1, dados: { nome: "Sistema de prontuário (a confirmar)", servico: "Prontuário eletrônico", dados: "Dados de saúde de pacientes", canal: "Pendente de identificação", providencia: "Confirmar contrato, DPA, região e subprocessadores." } },
      { id: "r6", tipo: "normas", codigo: "N1", etapaOrigem: 1, dados: { norma: "Lei nº 13.709/2018 - LGPD", conteudo: "Princípios, bases legais, direitos, agentes, segurança e incidentes.", aplicacao: "Norma central do programa." } },
      { id: "r7", tipo: "normas", codigo: "N2", etapaOrigem: 1, dados: { norma: "Resolução CD/ANPD nº 2/2022", conteudo: "Regime para agentes de tratamento de pequeno porte.", aplicacao: "Procedimentos simplificados; atenção ao tratamento de dados sensíveis." } },
      { id: "r8", tipo: "reunioes", codigo: "RE1", etapaOrigem: 1, dados: { data: "06/10/2026", horario: "9h", pauta: "Aprovação do programa, papéis e prioridades", evidencia: "Ata simplificada" } },
      { id: "r9", tipo: "treinamentos", codigo: "T1", etapaOrigem: 1, dados: { tema: "Fundamentos da LGPD e dados de saúde", conteudo: "Princípios, titular, controlador, operador e dados sensíveis.", carga: "1h30", previsao: "Novembro/2026" } },
      { id: "r10", tipo: "acoes", codigo: "A1", etapaOrigem: 1, dados: { acao: "Criar canal externo de privacidade", responsavel: "Responsável interna", evidencia: "E-mail dedicado publicado", prazo: "Imediato" } },
      { id: "r11", tipo: "acoes", codigo: "A2", etapaOrigem: 1, dados: { acao: "Ativar MFA e individualizar acessos ao prontuário", responsavel: "Responsável interna", evidencia: "Checklist e prints", prazo: "Até Etapa 3" } },
      { id: "r12", tipo: "riscos", codigo: "R1", etapaOrigem: 2, dados: { tema: "Credenciais e acessos", achado: "Senha compartilhada no prontuário.", nivel: "Crítico", medida: "Contas individuais, MFA e revogação no desligamento.", prazo: "Etapa 03", responsavel: "Responsável interna" } },
      { id: "r13", tipo: "riscos", codigo: "R2", etapaOrigem: 2, dados: { tema: "Telemedicina", achado: "Plataforma sem DPA identificado.", nivel: "Alto", medida: "Due diligence e cláusulas contratuais.", prazo: "Etapa 03", responsavel: "Responsável interna" } },
    ],
    referencias: [
      { id: "ref1", texto: "BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais - texto compilado.", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709compilado.htm", consultadoEm: "2026-10-06" },
      { id: "ref2", texto: "AGÊNCIA NACIONAL DE PROTEÇÃO DE DADOS. Resolução CD/ANPD nº 2, de 27 de janeiro de 2022 - agentes de tratamento de pequeno porte.", url: "https://www.gov.br/anpd", consultadoEm: "2026-10-06" },
    ],
    historico: [
      { em: "2026-10-02T10:00:00", usuario: "Roberto", acao: "Projeto criado" },
      { em: "2026-10-03T14:00:00", usuario: "Roberto", acao: "Plano de trabalho fechado" },
      { em: "2026-10-08T17:30:00", usuario: "Roberto", acao: "Etapa 01: status alterado para Enviada no HUB" },
    ],
  };
}

function projetoAguardandoPlano(): Projeto {
  return {
    ...projetoExemplo(),
    id: "prj-vela",
    clienteId: clienteExemplo2.id,
    consultorId: "leonardo",
    status: "aguardando_plano",
    numeroProjetoHub: "90002",
    codigoSolicitacaoHub: "SOL-0002",
    segmento: "Desenvolvimento de software sob demanda",
    areaAtuacao: "Governança em privacidade e proteção de dados pessoais aplicada ao desenvolvimento de software",
    planoFechadoEm: null,
    etapas: etapasDoModelo(modeloLgpdSebrae),
    registros: [],
    referencias: [],
    historico: [{ em: "2026-10-12T09:00:00", usuario: "Leonardo", acao: "Projeto criado" }],
  };
}

export const VERSAO_ESTADO = 1;

export function estadoInicial(): Estado {
  return {
    versao: VERSAO_ESTADO,
    usuarioAtualId: "roberto",
    usuarios: [
      { id: "roberto", nome: "Roberto", nomeCompleto: "Roberto Pivotto Nicodemo", adminGrupo: true, acessos: { pivotto: "gestor", orb: "gestor", ejup: "gestor" } },
      { id: "leonardo", nome: "Leonardo", nomeCompleto: "Leonardo", adminGrupo: false, acessos: { pivotto: "gestor" } },
    ],
    empresas: [
      { slug: "pivotto", nome: "Pivotto & Pivotto", status: "ativo", descricao: "Escritório de advocacia. Consultoria de Adequação à LGPD via HUB SEBRAE.", socios: "Roberto e Leonardo" },
      { slug: "orb", nome: "ORB", status: "em_estruturacao", descricao: "Funcionamento próprio, diferente das outras empresas. Serviços, etapas e entregas serão levantados quando o módulo for estruturado.", socios: "Roberto e terceiro sócio" },
      { slug: "ejup", nome: "EJUP", status: "standby", descricao: "Escola Jurídica para Profissionais. Trabalha por curso; o modelo será desenhado quando o processo estiver estruturado.", socios: "Roberto" },
    ],
    clientes: [clienteExemplo, clienteExemplo2],
    projetos: [projetoExemplo(), projetoAguardandoPlano()],
  };
}
