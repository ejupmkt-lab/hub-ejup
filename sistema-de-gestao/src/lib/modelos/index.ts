import { modeloLgpdSebrae } from "./lgpd-sebrae";
import type { ModeloFluxo } from "./tipos";

export const modelos: ModeloFluxo[] = [modeloLgpdSebrae];

export function modeloPorId(id: string) {
  return modelos.find((m) => m.id === id);
}

export function modelosDaEmpresa(slug: string) {
  return modelos.filter((m) => m.empresa === slug);
}

// Payload aceito pela função criar_projeto do banco
export function etapasParaCriacao(modelo: ModeloFluxo) {
  return modelo.etapas.map((e) => ({
    ordem: e.ordem,
    nome: e.nome,
    descricao: e.descricao,
    horas_previstas: e.horasPrevistas,
    duracao_referencia_dias: e.duracaoReferenciaDias,
    atividades: e.atividades.map(([codigo, texto]) => ({
      codigo,
      texto,
      nivel: codigo.split(".").length,
    })),
    entregaveis: [
      ...e.entregaveis.map((titulo) => ({ titulo, tipo: "entregavel" })),
      ...e.instrumentos.map((titulo) => ({ titulo, tipo: "instrumento" })),
    ],
  }));
}

export type { ModeloFluxo, EtapaModelo } from "./tipos";
