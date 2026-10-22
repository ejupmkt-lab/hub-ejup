import type { StatusEtapa } from "../rotulos";
import type { Servico } from "../modelos/tipos";

export type EmpresaSlug = "pivotto" | "orb" | "ejup";
export type Papel = "gestor" | "consultor" | "equipe";

export type Empresa = {
  slug: EmpresaSlug;
  nome: string;
  status: "ativo" | "em_estruturacao" | "standby";
  descricao: string;
  socios: string;
};

export type Usuario = {
  id: string;
  email: string;
  nome: string;
  nomeCompleto: string;
  adminGrupo: boolean;
  veFinanceiro?: boolean; // vê valores e recebimentos (permissão à parte)
  acessos: Partial<Record<EmpresaSlug, Papel>>;
};

export type Cliente = {
  id: string;
  empresa: EmpresaSlug;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  cep: string;
  cidadeUf: string;
  email: string;
  telefone: string;
  site: string;
  responsavel: string;
  cargoResponsavel: string;
  porte: string;
  tempoAtividade: string;
  ramo: string;
  produtosServicos: string;
  empregadosGestao: string;
  empregadosOperacionais: string;
};

export type Atividade = {
  codigo: string;
  texto: string;
  nivel: number;
  status: "pendente" | "feito" | "nao_aplicavel";
  justificativa: string;
};

export type Entregavel = {
  titulo: string;
  tipo: "entregavel" | "instrumento";
  conteudo: string;
};

export type Evidencia = {
  id: string;
  caminho: string; // no bucket "evidencias": <empresa>/<projeto>/<etapa>/<arquivo>
  legenda: string;
  largura: number; // pixels da imagem original
  altura: number;
  tipo: string; // image/png, image/jpeg…
};

export type Etapa = {
  ordem: number;
  nome: string;
  descricao: string;
  horasPrevistas: number;
  duracaoReferenciaDias: number;
  dataInicio: string | null;
  dataFim: string | null;
  dataInicioBase?: string | null; // execução prevista a partir do pagamento, antes de encadear (uma etapa só começa quando a anterior é enviada)
  dataFimBase?: string | null;
  dataInicioPlano: string | null;
  dataFimPlano: string | null;
  status: StatusEtapa;
  atividades: Atividade[];
  entregaveis: Entregavel[];
  secoes: Record<string, string>;
  dataRelatorio: string | null;
  assinaturaConsultor: string | null;
  assinaturaCliente: string | null;
  evidencias?: Evidencia[];
  relatorioAssinado?: RelatorioAssinado | null;
  enviadaEm?: string | null; // data em que o relatório foi enviado no Plano de Entrega do HUB
  assinaturaDigital?: AssinaturaDigital | null; // enviada para assinar na Autentique
  relatorioExterno?: boolean; // feito fora do sistema e importado: o PDF assinado é o relatório
};

// Relatório enviado para assinatura online (Autentique): cada signatário recebe o
// link por e-mail; ao assinarem todos, o PDF assinado entra na etapa
export type AssinaturaDigital = {
  provedor: "autentique";
  documentoId: string;
  estado: "aguardando" | "assinado" | "recusado";
  enviadoEm: string; // ISO data-hora
  por: string;
  signatarios: { publicId: string; nome: string; email: string; papel: "consultor" | "cliente"; link: string | null; viuEm: string | null; assinouEm: string | null; recusouEm: string | null }[];
};

// PDF final, já assinado no gov.br, guardado junto da etapa
export type RelatorioAssinado = {
  caminho: string; // no bucket "evidencias": <empresa>/<projeto>/<etapa>/assinado-<id>.pdf
  nome: string; // nome original do arquivo
  enviadoEm: string; // ISO data-hora
  por: string;
};

export type Registro = {
  id: string;
  tipo: string;
  codigo: string;
  dados: Record<string, string>;
  etapaOrigem: number;
};

export type Referencia = {
  id: string;
  texto: string;
  url: string;
  consultadoEm: string;
};

export type Evento = {
  em: string; // ISO data-hora
  usuario: string;
  acao: string;
  detalhe?: string;
};

// Visita, reunião ou trabalho interno registrado no projeto: conta horas e
// as anotações alimentam a redação do relatório da etapa

// Onde o projeto está no HUB SEBRAE: as 6 etapas do HUB, cada uma dividida
// em passos que dizem com quem está a bola (consultor, gestor do SEBRAE,
// FUNCERN ou cliente). Guarda a data em que o projeto chegou a cada passo.
export type PassoHub =
  | "solicitacao" // 1 Solicitação aberta: o gestor analisa o pedido do cliente
  | "diagnostico" // 2 Diagnóstico: o consultor elabora
  | "diagnostico_enviado" // 2 Diagnóstico: o gestor analisa a viabilidade
  | "proposta" // 3 Proposta: o consultor monta o plano de trabalho
  | "proposta_funcern" // 3 Proposta: a FUNCERN lança o plano no HUB
  | "proposta_cliente" // 3 Proposta: o cliente analisa e paga
  | "execucao" // 4 Em execução: as etapas do serviço
  | "finalizado" // 5 Projeto finalizado: o cliente avalia a consultoria
  | "avaliado" // 5 Projeto finalizado: o gestor analisa as entregas
  | "concluido"; // 6 Projeto concluído
export type Hub = { passo: PassoHub; datas: Partial<Record<PassoHub, string>> };

// Formato antigo (até a régua do HUB): só a fase pré-contratual. Lido para
// os projetos que ainda o têm; ao mudar de passo, vira o campo "hub".
export type SituacaoContratacao = "diagnostico" | "aguardando_aprovacao" | "aguardando_pagamento" | "contratado";
export type Contratacao = {
  situacao: SituacaoContratacao;
  enviadoEm: string | null;
  aprovadoEm: string | null;
  pagoEm: string | null;
};

export type Projeto = {
  id: string;
  empresa: EmpresaSlug;
  clienteId: string;
  modeloId: string; // id do serviço (área de Serviços)
  modeloVersao: number;
  servicoNome?: string; // nome curto do serviço quando o projeto foi criado
  hub?: Hub;
  contratacao?: Contratacao; // formato antigo, só leitura
  consultorId: string;
  status: "aguardando_plano" | "em_andamento" | "encerrado";
  prestadoraVinculada: string;
  numeroProjetoHub: string;
  codigoSolicitacaoHub: string; // "código do pedido" no HUB
  numeroVisitas?: string;
  gestorSebrae: string;
  fichaTecnica: string;
  codigoFichaTecnica: string;
  segmento: string;
  areaAtuacao: string;
  localAssinatura: string;
  planoFechadoEm: string | null;
  etapas: Etapa[];
  registros: Registro[];
  referencias: Referencia[];
  historico: Evento[];
};

export type { Servico };

export type Estado = {
  usuarioAtualId: string;
  usuarios: Usuario[];
  empresas: Empresa[];
  clientes: Cliente[];
  projetos: Projeto[];
  servicos: Servico[];
};
