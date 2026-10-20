import type { Atividade, Etapa, Projeto } from "./dados/tipos";
import { hojeIso } from "./datas";
import { etapaAtrasada, etapaAtual, etapaConcluida } from "./projeto";

// Tarefas do plano de trabalho: as atividades do checklist ainda pendentes nas
// etapas já começadas (pelas datas do plano) e na etapa em curso. Atrasada é a
// tarefa de uma etapa cujo prazo já passou.
export type Tarefa = { projeto: Projeto; etapa: Etapa; atividade: Atividade; indice: number; atrasada: boolean };

export function tarefasPendentes(projetos: Projeto[], hoje = hojeIso()): Tarefa[] {
  const lista: Tarefa[] = [];
  for (const p of projetos) {
    if (p.status === "encerrado") continue;
    const atual = etapaAtual(p);
    for (const e of p.etapas) {
      if (etapaConcluida(e)) continue;
      const comecou = (e.dataInicio && e.dataInicio <= hoje) || e.ordem === atual?.ordem;
      if (!comecou) continue;
      const atrasada = etapaAtrasada(e, hoje);
      e.atividades.forEach((a, indice) => {
        if (a.status === "pendente") lista.push({ projeto: p, etapa: e, atividade: a, indice, atrasada });
      });
    }
  }
  return lista;
}
