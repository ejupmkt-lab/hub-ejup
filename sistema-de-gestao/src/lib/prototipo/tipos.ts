import type { StatusEtapa } from "../rotulos";

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

export type Projeto = {
  id: string;
  empresa: EmpresaSlug;
  clienteId: string;
  modeloId: string;
  modeloVersao: number;
  consultorId: string;
  status: "aguardando_plano" | "em_andamento" | "encerrado";
  prestadoraVinculada: string;
  numeroProjetoHub: string;
  codigoSolicitacaoHub: string;
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

export type Estado = {
  versao: number;
  usuarioAtualId: string;
  usuarios: Usuario[];
  empresas: Empresa[];
  clientes: Cliente[];
  projetos: Projeto[];
};
