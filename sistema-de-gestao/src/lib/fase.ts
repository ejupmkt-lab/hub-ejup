import type { Contratacao, Projeto, SituacaoContratacao } from "./dados/tipos";
import { doisDigitos } from "./rotulos";
import { etapaAtual } from "./projeto";

// Fase do projeto no Sebraetec. Antes da contratação: o diagnóstico (modelo do
// SEBRAE, assinado só pelo consultor) vai ao HUB, o gestor aprova e o cliente
// paga. Depois, a execução: as etapas do serviço, que variam (2, 5, 8…).

export type Fase = "diagnostico" | "aguardando_aprovacao" | "aguardando_pagamento" | "execucao" | "encerrado";

export const fases: Record<Fase, { rotulo: string; curto: string; descricao: string; cor: string }> = {
  diagnostico: {
    rotulo: "Diagnóstico em elaboração",
    curto: "Diagnóstico",
    descricao: "Pré-contratual: o consultor elabora o diagnóstico no modelo do SEBRAE, assina e envia no HUB.",
    cor: "#0e7490",
  },
  aguardando_aprovacao: {
    rotulo: "Aguardando o gestor aprovar",
    curto: "Com o gestor",
    descricao: "Diagnóstico enviado no HUB; o gestor do SEBRAE analisa e libera a contratação.",
    cor: "#0891b2",
  },
  aguardando_pagamento: {
    rotulo: "Aguardando o pagamento do cliente",
    curto: "Aguardando pagamento",
    descricao: "Contratação aprovada; falta o cliente pagar no HUB para a consultoria começar.",
    cor: "#22b8cf",
  },
  execucao: { rotulo: "Em execução", curto: "Execução", descricao: "Consultoria contratada: as etapas do serviço.", cor: "#2563eb" },
  encerrado: { rotulo: "Encerrado", curto: "Encerrado", descricao: "Todas as entregas aprovadas.", cor: "#16a34a" },
};

export const ordemFases: Fase[] = ["diagnostico", "aguardando_aprovacao", "aguardando_pagamento", "execucao", "encerrado"];
export const fasesAntesDaContratacao: Fase[] = ["diagnostico", "aguardando_aprovacao", "aguardando_pagamento"];

export function faseDoProjeto(p: Projeto): Fase {
  if (p.status === "encerrado") return "encerrado";
  const s = p.contratacao?.situacao ?? "contratado";
  return s === "contratado" ? "execucao" : s;
}

export const antesDaContratacao = (p: Projeto) => fasesAntesDaContratacao.includes(faseDoProjeto(p));

// Onde o projeto está, numa frase curta: "Diagnóstico" ou "Etapa 2 de 5"
export function ondeEsta(p: Projeto) {
  const f = faseDoProjeto(p);
  if (f !== "execucao") return fases[f].rotulo;
  const et = etapaAtual(p);
  return et ? `Etapa ${doisDigitos(et.ordem)} de ${doisDigitos(p.etapas.length)}` : "Todas as etapas enviadas";
}

// Situação inicial de um projeto novo
export function contratacaoInicial(situacao: SituacaoContratacao, hoje: string): Contratacao {
  const passou = (s: SituacaoContratacao) => ordemContratacao.indexOf(situacao) > ordemContratacao.indexOf(s);
  return {
    situacao,
    enviadoEm: passou("diagnostico") ? hoje : null,
    aprovadoEm: passou("aguardando_aprovacao") ? hoje : null,
    pagoEm: passou("aguardando_pagamento") ? hoje : null,
  };
}

export const ordemContratacao: SituacaoContratacao[] = ["diagnostico", "aguardando_aprovacao", "aguardando_pagamento", "contratado"];

// Avança (ou volta) um passo da contratação, registrando a data
export function mudarContratacao(atual: Contratacao | undefined, para: SituacaoContratacao, data: string): Contratacao {
  const c: Contratacao = { ...(atual ?? contratacaoInicial("contratado", data)) };
  const i = ordemContratacao.indexOf(para);
  c.situacao = para;
  c.enviadoEm = i >= 1 ? (c.enviadoEm ?? data) : null;
  c.aprovadoEm = i >= 2 ? (c.aprovadoEm ?? data) : null;
  c.pagoEm = i >= 3 ? (c.pagoEm ?? data) : null;
  return c;
}
