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
  fichaTecnica: string;
  codigoFichaTecnica: string;
  prestadoraVinculada: string;
  etapas: EtapaModelo[];
};
