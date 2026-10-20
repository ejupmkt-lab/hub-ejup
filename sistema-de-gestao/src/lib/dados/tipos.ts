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
export type TipoAtividade = "visita" | "reuniao_remota" | "trabalho_interno";
export type RegistroAtividade = {
  id: string;
  data: string; // AAAA-MM-DD
  etapa: number;
  tipo: TipoAtividade;
  horas: number;
  participantes: string;
  anotacoes: string;
  registradoPor: string;
};

// Antes da consultoria: o diagnóstico (pré-contratual, assinado só pelo
// consultor) vai ao HUB, o gestor do SEBRAE aprova e o cliente paga. Projetos
// sem este campo são anteriores a ele e já estavam contratados.
export type SituacaoContratacao = "diagnostico" | "aguardando_aprovacao" | "aguardando_pagamento" | "contratado";
export type Contratacao = {
  situacao: SituacaoContratacao;
  enviadoEm: string | null; // diagnóstico enviado no HUB
  aprovadoEm: string | null; // gestor aprovou a contratação
  pagoEm: string | null; // cliente pagou: a consultoria começa
};

export type Projeto = {
  id: string;
  empresa: EmpresaSlug;
  clienteId: string;
  modeloId: string; // id do serviço (área de Serviços)
  modeloVersao: number;
  servicoNome?: string; // nome curto do serviço quando o projeto foi criado
  contratacao?: Contratacao;
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
  atividadesRegistradas?: RegistroAtividade[];
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
