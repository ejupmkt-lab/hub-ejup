import type { ModeloFluxo } from "./tipos";
import type { Etapa } from "../dados/tipos";

// Etapas de um projeto novo, copiadas do modelo de fluxo (o projeto guarda
// a cópia, então mudanças futuras no modelo não alteram projetos em andamento).
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

