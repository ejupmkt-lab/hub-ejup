import type { Atividade, Etapa, Projeto } from "./dados/tipos";
import { hojeIso } from "./datas";
import { etapaAtrasada, etapaAtual } from "./projeto";
import { aguardandoOutros, faseDoProjeto } from "./fase";
import { passoDoProjeto, type Passo } from "./proximo-passo";

// Tarefas: o que fazer agora em cada projeto, só na fase em que ele está.
// Na etapa em curso (pelo plano de trabalho e pela ficha do serviço), as
// atividades do checklist ainda pendentes; fora disso (diagnóstico, plano de
// trabalho, relatório, envio), o próximo passo do projeto.
export type Tarefa = { projeto: Projeto; etapa: Etapa; atividade: Atividade; indice: number; atrasada: boolean };

export type TarefasDoProjeto = {
  projeto: Projeto;
  etapa?: Etapa; // etapa em curso (ou devolvida), quando há
  itens: Tarefa[]; // checklist pendente da etapa
  passo: Passo | null; // quando não há checklist pendente: o próximo passo
  aguardando: boolean; // depende do gestor do SEBRAE, da FUNCERN ou do cliente
  atrasada: boolean;
};

// Etapa em que o trabalho está agora: a devolvida primeiro, senão a em curso
function etapaDoMomento(p: Projeto) {
  return p.etapas.find((e) => e.status === "devolvida") ?? etapaAtual(p);
}

export function tarefasDoProjeto(p: Projeto, hoje = hojeIso()): TarefasDoProjeto | null {
  if (p.status === "encerrado") return null;
  const fase = faseDoProjeto(p);
  const passo = passoDoProjeto(p);
  const aguardando = aguardandoOutros(p);
  if ((fase !== "execucao" && fase !== "finalizado") || !p.planoFechadoEm) return { projeto: p, itens: [], passo, aguardando, atrasada: false };
  const e = etapaDoMomento(p);
  if (!e) return { projeto: p, itens: [], passo, aguardando, atrasada: false };
  const atrasada = etapaAtrasada(e, hoje);
  const itens = e.atividades.flatMap((atividade, indice) => (atividade.status === "pendente" ? [{ projeto: p, etapa: e, atividade, indice, atrasada }] : []));
  return { projeto: p, etapa: e, itens, passo, aguardando: e.status === "enviada", atrasada };
}

// Atividades pendentes do checklist das etapas em curso (para os números do painel)
export function tarefasPendentes(projetos: Projeto[], hoje = hojeIso()): Tarefa[] {
  return projetos.flatMap((p) => tarefasDoProjeto(p, hoje)?.itens ?? []);
}

// Quantas tarefas há: cada atividade pendente da etapa em curso, ou 1 pelo
// próximo passo quando ele depende de quem usa o sistema (não de terceiros)
export function contarTarefas(projetos: Projeto[], hoje = hojeIso()) {
  let total = 0;
  let atrasadas = 0;
  for (const p of projetos) {
    const t = tarefasDoProjeto(p, hoje);
    if (!t) continue;
    if (t.itens.length) {
      total += t.itens.length;
      if (t.atrasada) atrasadas += t.itens.length;
    } else if (t.passo && !t.aguardando) {
      total += 1;
      if (t.atrasada) atrasadas += 1;
    }
  }
  return { total, atrasadas };
}
