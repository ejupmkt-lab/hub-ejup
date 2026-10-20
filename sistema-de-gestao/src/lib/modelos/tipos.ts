export type EtapaModelo = {
  ordem: number;
  nome: string;
  descricao: string;
  horasPrevistas: number;
  duracaoReferenciaDias: number;
  // [código, texto] — o nível é deduzido do código ("1" = 1, "1.1" = 2)
  atividades: [string, string][];
  entregaveis: string[];
  // Instrumentos complementares/operacionais (ex.: RoPA preliminar)
  instrumentos: string[];
};

export type ModeloFluxo = {
  id: string;
  versao: number;
  empresa: string;
  nome: string;
  nomeCurto: string; // para distinguir os projetos de um mesmo cliente
  fichaTecnica: string;
  codigoFichaTecnica: string;
  prestadoraVinculada: string;
  etapas: EtapaModelo[];
};

// Serviço cadastrado na área de Serviços: a ficha técnica (etapas, atividades,
// entregáveis) e os dados do card, como no catálogo do Sebraetec. Cada serviço
// tem a sua biblioteca de textos; os projetos copiam as etapas ao nascer.
export type Servico = ModeloFluxo & {
  area: string; // tema do catálogo (ex.: Gestão da Qualidade)
  descricao: string; // resumo do serviço, como no card do catálogo
  credenciado: boolean; // credenciado no Sebraetec para prestar este serviço
  areaAtuacao: string; // "área de atuação da consultoria", usada nos relatórios
  preDiagnostico?: string[]; // perguntas do pré-diagnóstico da ficha técnica
};
