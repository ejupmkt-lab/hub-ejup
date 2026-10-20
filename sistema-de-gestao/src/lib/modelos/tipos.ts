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
