import type { Etapa, Hub, PassoHub, Projeto } from "./dados/tipos";
import { doisDigitos } from "./rotulos";
import { entregaFinal, etapaAtual, etapaConcluida } from "./projeto";
import { diferencaDias, formatarData, hojeIso } from "./datas";

// A régua do projeto é a do HUB SEBRAE: 6 etapas, as mesmas que aparecem no
// HUB. Cada uma tem passos que dizem com quem está a bola, para nenhum projeto
// ficar parado sem que se saiba quem cobrar. As datas do plano de trabalho são
// as oficiais e não são recalculadas quando o cliente paga.

export type Fase = "solicitacao" | "diagnostico" | "proposta" | "execucao" | "finalizado" | "concluido";
export type Responsavel = "consultor" | "gestor" | "funcern" | "cliente";

export const fases: Record<Fase, { numero: number; rotulo: string; descricao: string; cor: string }> = {
  solicitacao: { numero: 1, rotulo: "Solicitação aberta", descricao: "O cliente pediu no HUB e o gestor do SEBRAE analisa a demanda.", cor: "#64748b" },
  diagnostico: { numero: 2, rotulo: "Diagnóstico", descricao: "O consultor elabora o diagnóstico no modelo do SEBRAE e o gestor analisa a viabilidade.", cor: "#0e7490" },
  proposta: { numero: 3, rotulo: "Proposta", descricao: "Plano de trabalho enviado à FUNCERN, que lança no HUB; o cliente analisa e paga.", cor: "#7c3aed" },
  execucao: { numero: 4, rotulo: "Em execução", descricao: "As etapas do serviço, cada uma enviada no Plano de Entrega do HUB.", cor: "#2563eb" },
  finalizado: { numero: 5, rotulo: "Projeto finalizado", descricao: "Todas as etapas enviadas: o cliente avalia a consultoria e o gestor analisa as entregas.", cor: "#d97706" },
  concluido: { numero: 6, rotulo: "Projeto concluído", descricao: "O gestor do SEBRAE concluiu o projeto.", cor: "#16a34a" },
};
export const ordemFases: Fase[] = ["solicitacao", "diagnostico", "proposta", "execucao", "finalizado", "concluido"];
export const fasesAntesDaContratacao: Fase[] = ["solicitacao", "diagnostico", "proposta"];

export const responsaveis: Record<Responsavel, string> = {
  consultor: "Com você",
  gestor: "Com o gestor do SEBRAE",
  funcern: "Com a FUNCERN",
  cliente: "Com o cliente",
};

// "com o gestor do SEBRAE", no meio de uma frase
export const comQuemTexto = (r: Responsavel) => responsaveis[r].charAt(0).toLowerCase() + responsaveis[r].slice(1);
// "desde hoje", "há 1 dia", "há 5 dias"
export const tempoNoPasso = (dias: number) => (dias === 0 ? "desde hoje" : dias === 1 ? "há 1 dia" : `há ${dias} dias`);

export const passosHub: Record<PassoHub, { fase: Fase; rotulo: string; com: Responsavel | null; acao?: string }> = {
  solicitacao: { fase: "solicitacao", rotulo: "Gestor analisando o pedido do cliente", com: "gestor", acao: "O gestor me enviou a demanda" },
  diagnostico: { fase: "diagnostico", rotulo: "Elaborar o diagnóstico", com: "consultor", acao: "Enviei o diagnóstico" },
  diagnostico_enviado: { fase: "diagnostico", rotulo: "Gestor analisando a viabilidade", com: "gestor", acao: "O gestor pediu a proposta" },
  proposta: { fase: "proposta", rotulo: "Montar o plano de trabalho", com: "consultor", acao: "Enviei o plano à FUNCERN" },
  proposta_funcern: { fase: "proposta", rotulo: "FUNCERN lançando a proposta no HUB", com: "funcern", acao: "A FUNCERN lançou no HUB" },
  proposta_cliente: { fase: "proposta", rotulo: "Cliente analisando a proposta e pagando", com: "cliente", acao: "O cliente pagou" },
  execucao: { fase: "execucao", rotulo: "Etapas da consultoria", com: "consultor", acao: "Finalizei no HUB" },
  finalizado: { fase: "finalizado", rotulo: "Cliente avaliando a consultoria", com: "cliente", acao: "O cliente avaliou" },
  avaliado: { fase: "finalizado", rotulo: "Gestor analisando as entregas", com: "gestor", acao: "O gestor concluiu" },
  concluido: { fase: "concluido", rotulo: "Concluído", com: null },
};
export const ordemPassos = Object.keys(passosHub) as PassoHub[];

// Como cada passo fica registrado no histórico e na conversa
export const registroHub: Record<PassoHub, (data: string) => string> = {
  solicitacao: (d) => `Solicitação aberta no HUB em ${formatarData(d)}`,
  diagnostico: (d) => `Demanda recebida do gestor em ${formatarData(d)}: elaborar o diagnóstico`,
  diagnostico_enviado: (d) => `Diagnóstico enviado no HUB em ${formatarData(d)}; aguardando o gestor`,
  proposta: (d) => `Gestor pediu a proposta em ${formatarData(d)}: montar o plano de trabalho`,
  proposta_funcern: (d) => `Plano de trabalho enviado à FUNCERN em ${formatarData(d)}`,
  proposta_cliente: (d) => `FUNCERN lançou a proposta no HUB em ${formatarData(d)}; aguardando o cliente pagar`,
  execucao: (d) => `Cliente pagou em ${formatarData(d)}: a execução começou`,
  finalizado: (d) => `Projeto finalizado no HUB em ${formatarData(d)}; aguardando a avaliação do cliente`,
  avaliado: (d) => `Cliente avaliou a consultoria em ${formatarData(d)}; aguardando o gestor`,
  concluido: (d) => `Gestor concluiu o projeto em ${formatarData(d)}`,
};
// "2 Diagnóstico · Gestor analisando a viabilidade", para listas de escolha
export const rotuloPassoHub = (s: PassoHub) => {
  const f = fases[passosHub[s].fase];
  return s === "concluido" ? `${f.numero} ${f.rotulo}` : `${f.numero} ${f.rotulo} · ${passosHub[s].rotulo}`;
};
export const passosDaFase = (f: Fase) => ordemPassos.filter((s) => passosHub[s].fase === f);

// Projetos do formato antigo: a situação pré-contratual vira o passo do HUB
function doFormatoAntigo(p: Projeto): Hub {
  const c = p.contratacao;
  if (!c) return { passo: "execucao", datas: {} };
  const passo = ({ diagnostico: "diagnostico", aguardando_aprovacao: "diagnostico_enviado", aguardando_pagamento: "proposta_cliente", contratado: "execucao" } as const)[
    c.situacao
  ];
  const datas: Hub["datas"] = {};
  if (c.enviadoEm) datas.diagnostico_enviado = c.enviadoEm;
  if (c.aprovadoEm) datas.proposta = datas.proposta_cliente = c.aprovadoEm;
  if (c.pagoEm) datas.execucao = c.pagoEm;
  return { passo, datas };
}

export function hubDoProjeto(p: Projeto): Hub {
  const h = p.hub ?? doFormatoAntigo(p);
  // Encerrado pelo jeito antigo ("Encerrar projeto"): concluído
  return p.status === "encerrado" && h.passo !== "concluido" ? { ...h, passo: "concluido" } : h;
}
export const passoHubDoProjeto = (p: Projeto) => hubDoProjeto(p).passo;
export const faseDoProjeto = (p: Projeto): Fase => passosHub[passoHubDoProjeto(p)].fase;
export const antesDaContratacao = (p: Projeto) => fasesAntesDaContratacao.includes(faseDoProjeto(p));
export const comQuem = (p: Projeto) => passosHub[passoHubDoProjeto(p)].com;
// Aguardando gestor, FUNCERN ou cliente: nada a fazer além de cobrar
export const aguardandoOutros = (p: Projeto) => {
  const c = comQuem(p);
  return !!c && c !== "consultor";
};

// Há quantos dias o projeto está no passo atual (nulo sem a data)
export function diasNoPasso(p: Projeto, hoje = hojeIso()) {
  const h = hubDoProjeto(p);
  const d = h.datas[h.passo];
  return d ? Math.max(0, diferencaDias(d, hoje)) : null;
}

// Todas as etapas do serviço enviadas no Plano de Entrega do HUB
export const etapasTodasEnviadas = (p: Projeto) => p.etapas.length > 0 && p.etapas.every(etapaConcluida);

// Onde o projeto está, numa frase curta: "Gestor analisando a viabilidade" ou "Etapa 02 de 05"
export function ondeEsta(p: Projeto) {
  const passo = passoHubDoProjeto(p);
  if (passo !== "execucao") return passosHub[passo].rotulo;
  const et = etapaAtual(p);
  return et ? `Etapa ${doisDigitos(et.ordem)} de ${doisDigitos(p.etapas.length)}` : "Todas as etapas enviadas";
}

export const hubInicial = (passo: PassoHub, hoje: string): Hub => ({ passo, datas: { [passo]: hoje } });

// Avança (ou volta) o projeto para um passo do HUB, registrando a data. Voltar
// apaga as datas dos passos seguintes. Concluir tira o projeto dos ativos.
export function mudarHub(p: Projeto, para: PassoHub, data: string) {
  const h = hubDoProjeto(p);
  const i = ordemPassos.indexOf(para);
  const datas: Hub["datas"] = {};
  for (const s of ordemPassos.slice(0, i + 1)) if (h.datas[s]) datas[s] = h.datas[s];
  datas[para] ??= data;
  p.hub = { passo: para, datas };
  delete p.contratacao;
  if (para === "concluido") p.status = "encerrado";
  else if (p.status === "encerrado") p.status = p.planoFechadoEm ? "em_andamento" : "aguardando_plano";
}

// O próximo passo pode ser registrado? (o motivo, quando não)
export function bloqueioHub(p: Projeto): string | null {
  const passo = passoHubDoProjeto(p);
  if (passo === "proposta" && !p.planoFechadoEm) return "Feche o plano de trabalho antes de enviar à FUNCERN";
  if (passo === "execucao" && !etapasTodasEnviadas(p)) return "Envie todas as etapas no Plano de Entrega antes de finalizar";
  if (passo === "concluido") return "O projeto já está concluído";
  return null;
}

// Bloqueio para chegar a um passo à frente (a IA pode pular passos)
export function bloqueioAte(p: Projeto, para: PassoHub): string | null {
  const i = ordemPassos.indexOf(para);
  if (i > ordemPassos.indexOf("proposta") && antesDaContratacao(p) && !p.planoFechadoEm) return "o plano de trabalho ainda não foi fechado";
  if (i >= ordemPassos.indexOf("finalizado") && !etapasTodasEnviadas(p)) return "ainda há etapas sem enviar no Plano de Entrega";
  return null;
}

export const proximoPassoHub = (p: Projeto): PassoHub | null => ordemPassos[ordemPassos.indexOf(passoHubDoProjeto(p)) + 1] ?? null;

// ─── Período compatível com as horas ────────────────────────────────────────
// O gestor recusa a nota quando as entregas saem em poucos dias para muitas
// horas (ex.: o cliente paga dia 15 e tudo é enviado dia 20). As datas do
// plano não mudam: o sistema avisa para não enviar antes do fim previsto.

export function avisoEnvioAntecipado(e: Etapa, hoje = hojeIso()): string | null {
  if (!e.dataFim || hoje >= e.dataFim) return null;
  return (
    `O plano de trabalho prevê o fim da etapa ${doisDigitos(e.ordem)} em ${formatarData(e.dataFim)}. ` +
    `Enviar antes pode parecer incompatível com as ${e.horasPrevistas || "horas"}${e.horasPrevistas ? " h" : ""} da etapa e levar o gestor a recusar a nota.`
  );
}

export function avisoFinalizarAntecipado(p: Projeto, hoje = hojeIso()): string | null {
  const fim = entregaFinal(p);
  if (!fim || hoje >= fim) return null;
  return `O plano de trabalho prevê o fim do projeto em ${formatarData(fim)}. Finalizar antes pode parecer incompatível com as horas contratadas.`;
}

// Pagamento depois do início previsto no plano: as datas continuam, e a última
// entrega não deve sair antes do fim previsto
export function avisoPagamentoTardio(p: Projeto): string | null {
  const pago = hubDoProjeto(p).datas.execucao;
  const inicio = p.etapas[0]?.dataInicio;
  const fim = entregaFinal(p);
  if (!pago || !inicio || !p.planoFechadoEm || pago <= inicio) return null;
  return (
    `O cliente pagou em ${formatarData(pago)}, depois do início previsto no plano (${formatarData(inicio)}). ` +
    `As datas do plano continuam as mesmas${fim ? `: não envie a última etapa antes de ${formatarData(fim)}` : ""}.`
  );
}
