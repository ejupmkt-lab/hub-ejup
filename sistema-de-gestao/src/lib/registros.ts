// Registros do programa: tabelas que nascem numa etapa e atravessam as seguintes.
// Inseridos no relatório com o marcador [[tabela:<tipo>]].

export type TipoRegistro = {
  tipo: string;
  nome: string;
  prefixo: string;
  colunas: { chave: string; titulo: string; largura?: number }[];
};

export const tiposRegistro: TipoRegistro[] = [
  {
    tipo: "pessoas",
    nome: "Pessoas e responsabilidades",
    prefixo: "PR",
    colunas: [
      { chave: "pessoa", titulo: "Pessoa/entidade" },
      { chave: "funcao", titulo: "Função" },
      { chave: "responsabilidade", titulo: "Responsabilidade em PD&P", largura: 2 },
    ],
  },
  {
    tipo: "marcos",
    nome: "Marcos críticos",
    prefixo: "M",
    colunas: [
      { chave: "objetivo", titulo: "Objetivo" },
      { chave: "criterio", titulo: "Critério de conclusão", largura: 2 },
      { chave: "fase", titulo: "Fase" },
      { chave: "responsavel", titulo: "Responsável" },
    ],
  },
  {
    tipo: "fornecedores",
    nome: "Fornecedores e parceiros",
    prefixo: "F",
    colunas: [
      { chave: "nome", titulo: "Fornecedor/parceiro" },
      { chave: "servico", titulo: "Serviço" },
      { chave: "dados", titulo: "Dados/ativos" },
      { chave: "canal", titulo: "Canal público/contato" },
      { chave: "providencia", titulo: "Providência" },
    ],
  },
  {
    tipo: "normas",
    nome: "Inventário normativo",
    prefixo: "N",
    colunas: [
      { chave: "norma", titulo: "Norma/guia" },
      { chave: "conteudo", titulo: "Conteúdo relevante" },
      { chave: "aplicacao", titulo: "Aplicação ao cliente" },
    ],
  },
  {
    tipo: "reunioes",
    nome: "Calendário de reuniões",
    prefixo: "RE",
    colunas: [
      { chave: "data", titulo: "Data proposta" },
      { chave: "horario", titulo: "Horário" },
      { chave: "pauta", titulo: "Pauta temática", largura: 2 },
      { chave: "evidencia", titulo: "Evidência" },
    ],
  },
  {
    tipo: "treinamentos",
    nome: "Plano de treinamento",
    prefixo: "T",
    colunas: [
      { chave: "tema", titulo: "Tema" },
      { chave: "conteudo", titulo: "Conteúdo", largura: 2 },
      { chave: "carga", titulo: "Carga" },
      { chave: "previsao", titulo: "Previsão" },
    ],
  },
  {
    tipo: "processos",
    nome: "Processos mapeados",
    prefixo: "P",
    colunas: [
      { chave: "processo", titulo: "Processo" },
      { chave: "descricao", titulo: "Descrição" },
      { chave: "dados", titulo: "Dados/ativos envolvidos" },
    ],
  },
  {
    tipo: "riscos",
    nome: "Riscos",
    prefixo: "R",
    colunas: [
      { chave: "tema", titulo: "Tema" },
      { chave: "achado", titulo: "Achado" },
      { chave: "nivel", titulo: "Nível" },
      { chave: "medida", titulo: "Medida", largura: 2 },
      { chave: "prazo", titulo: "Prazo" },
      { chave: "responsavel", titulo: "Responsável" },
    ],
  },
  {
    tipo: "acoes",
    nome: "Plano de ação",
    prefixo: "A",
    colunas: [
      { chave: "acao", titulo: "Ação", largura: 2 },
      { chave: "responsavel", titulo: "Responsável" },
      { chave: "evidencia", titulo: "Evidência esperada" },
      { chave: "prazo", titulo: "Prazo" },
    ],
  },
  {
    tipo: "ropa",
    nome: "RoPA",
    prefixo: "OP",
    colunas: [
      { chave: "processo", titulo: "Processo" },
      { chave: "papel", titulo: "Papel" },
      { chave: "titulares", titulo: "Titulares" },
      { chave: "dados", titulo: "Dados" },
      { chave: "finalidade", titulo: "Finalidade" },
      { chave: "baseLegal", titulo: "Base legal/instrução" },
      { chave: "sistemas", titulo: "Sistemas" },
      { chave: "retencao", titulo: "Retenção" },
    ],
  },
  {
    tipo: "incidentes",
    nome: "Incidentes",
    prefixo: "I",
    colunas: [
      { chave: "data", titulo: "Data" },
      { chave: "descricao", titulo: "Descrição", largura: 2 },
      { chave: "dados", titulo: "Dados afetados" },
      { chave: "contencao", titulo: "Contenção" },
    ],
  },
];

export function tipoRegistro(tipo: string) {
  return tiposRegistro.find((t) => t.tipo === tipo);
}
