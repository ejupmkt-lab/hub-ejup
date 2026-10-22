import { diferencaDias, hojeIso } from "./datas";
import type { Etapa, Projeto } from "./dados/tipos";
import { statusEtapa, type Tom } from "./rotulos";
import { modeloPorId } from "./modelos";
import { comQuem, dataDoPagamento, faseDoProjeto, fases, ondeEsta } from "./fase";
import { relatorioFeitoFora } from "./relatorio/secoes";

const concluidas = new Set(["enviada", "aprovada"]);

export function etapaConcluida(e: Etapa) {
  return concluidas.has(e.status);
}

export function etapaAtual(p: Projeto): Etapa | undefined {
  return p.etapas.find((e) => !concluidas.has(e.status));
}

export function diasParaFim(e: Etapa) {
  if (!e.dataFim) return null;
  return diferencaDias(hojeIso(), e.dataFim);
}

export function situacaoPrazo(e: Etapa): { texto: string; tom: Tom } {
  if (concluidas.has(e.status)) return { texto: "Concluída", tom: "ok" };
  const d = diasParaFim(e);
  if (d === null) return { texto: "Sem data", tom: "neutro" };
  if (d < 0) return { texto: d === -1 ? "1 dia de atraso" : `${-d} dias de atraso`, tom: "critico" };
  if (d === 0) return { texto: "Vence hoje", tom: "atencao" };
  if (d <= 2) return { texto: d === 1 ? "Vence amanhã" : `Vence em ${d} dias`, tom: "atencao" };
  return { texto: `${d} dias restantes`, tom: "neutro" };
}

export function progressoAtividades(e: Etapa) {
  const feitas = e.atividades.filter((a) => a.status !== "pendente").length;
  return { feitas, total: e.atividades.length };
}

export type Alerta = { projeto: Projeto; etapa?: Etapa; texto: string; tom: Tom; ordem: number };

// O que pede ação agora, do mais urgente ao menos urgente
export function alertasDoProjeto(p: Projeto): Alerta[] {
  if (p.status === "encerrado") return [];
  const fase = faseDoProjeto(p);
  if (fase !== "execucao" && fase !== "finalizado")
    return [{ projeto: p, texto: ondeEsta(p), tom: comQuem(p) === "consultor" ? "atencao" : "neutro", ordem: 3 }];
  if (fase === "execucao" && p.status === "aguardando_plano")
    return [{ projeto: p, texto: "Definir o plano de trabalho para as etapas ganharem datas", tom: "atencao", ordem: 3 }];
  const lista: Alerta[] = [];
  for (const e of p.etapas) {
    if (e.status === "devolvida") lista.push({ projeto: p, etapa: e, texto: "Devolvida pelo SEBRAE para ajuste", tom: "critico", ordem: 0 });
    else if (e.status === "a_enviar") lista.push({ projeto: p, etapa: e, texto: "Pronta para enviar no HUB", tom: "atencao", ordem: 2 });
  }
  const atual = etapaAtual(p);
  if (atual) {
    const d = diasParaFim(atual);
    if (d !== null && d < 0) lista.push({ projeto: p, etapa: atual, texto: situacaoPrazo(atual).texto, tom: "critico", ordem: 1 });
    else if (d !== null && d <= 2 && atual.status !== "a_enviar")
      lista.push({ projeto: p, etapa: atual, texto: situacaoPrazo(atual).texto, tom: "atencao", ordem: 2 });
  }
  return lista;
}

// ─── Avanço ───────────────────────────────────────────────────────────────

// Quanto do caminho da etapa o status representa (enviada = 100%)
const pesoStatus: Record<Etapa["status"], number> = {
  nao_iniciada: 0,
  em_levantamento: 0.2,
  em_redacao: 0.45,
  em_revisao: 0.65,
  aguardando_assinaturas: 0.8,
  a_enviar: 0.95,
  enviada: 1,
  aprovada: 1,
  devolvida: 0.8,
};

// Relatório feito fora do sistema, com o PDF assinado pelas duas partes: pronto
// para enviar, mesmo que o status ainda não tenha sido atualizado
export const prontaForaDoSistema = (e: Etapa) =>
  !concluidas.has(e.status) && e.status !== "devolvida" && relatorioFeitoFora(e) && !!e.assinaturaConsultor && !!e.assinaturaCliente;

// Quando a etapa foi feita de fato. Só há data de início se a etapa começou
// (iniciadaEm, registrada quando sai de "não iniciada"). Uma etapa enviada, sem
// esse registro, começou no dia em que a anterior foi enviada (as etapas são em
// sequência) ou, a primeira, no pagamento; termina no envio do relatório.
export function periodoEfetivo(p: Projeto, e: Etapa): { inicio: string | null; fim: string | null } | null {
  const i = p.etapas.findIndex((x) => x.ordem === e.ordem);
  const anterior = i > 0 ? p.etapas[i - 1] : null;
  const fim = concluidas.has(e.status) ? (e.enviadaEm ?? null) : null;
  if (!fim && !etapaIniciada(e)) return null;
  let inicio: string | null = e.iniciadaEm ?? null;
  if (!inicio && fim) inicio = !anterior ? (dataDoPagamento(p) ?? e.dataInicio) : concluidas.has(anterior.status) ? (anterior.enviadaEm ?? null) : null;
  if (inicio && fim && fim < inicio) inicio = fim;
  return { inicio, fim };
}

// A etapa começou: tem avanço registrado, ou o relatório já está pronto/enviado
export const etapaIniciada = (e: Etapa) => e.status !== "nao_iniciada" || prontaForaDoSistema(e);

export type SituacaoEtapa = { chave: "devolvida" | "concluida" | "atrasada" | "pronta" | "andamento" | "nao_iniciada"; rotulo: string };

// Situação da etapa, a mesma em toda a tela (cabeçalho, trilha, gráfico, cartões):
// devolvida > enviada > atrasada > pronta para enviar > em andamento > não iniciada
export function situacaoDaEtapa(e: Etapa, hoje = hojeIso()): SituacaoEtapa {
  if (e.status === "devolvida") return { chave: "devolvida", rotulo: "Devolvida" };
  if (concluidas.has(e.status)) return { chave: "concluida", rotulo: statusEtapa[e.status].rotulo };
  if (e.dataFim && e.dataFim < hoje) return { chave: "atrasada", rotulo: "Atrasada" };
  if (prontaForaDoSistema(e) || e.status === "a_enviar") return { chave: "pronta", rotulo: statusEtapa.a_enviar.rotulo };
  if (etapaIniciada(e)) return { chave: "andamento", rotulo: statusEtapa[e.status].rotulo };
  return { chave: "nao_iniciada", rotulo: statusEtapa.nao_iniciada.rotulo };
}

// Status para mostrar: a etapa pronta fora do sistema aparece como pronta para enviar
export const statusDaEtapa = (e: Etapa) => (prontaForaDoSistema(e) ? "a_enviar" : e.status);

// Andamento de uma etapa (0 a 1): 40% pelo checklist e 60% pelo status do relatório
export function avancoEtapa(e: Etapa) {
  if (concluidas.has(e.status)) return 1;
  if (prontaForaDoSistema(e)) return 0.4 + 0.6 * pesoStatus.a_enviar;
  const { feitas, total } = progressoAtividades(e);
  return 0.4 * (total ? feitas / total : 0) + 0.6 * pesoStatus[e.status];
}

// Avanço do projeto em %: o andamento de cada etapa pesado pelas horas dela
// Peso de cada etapa no avanço: as horas; sem horas definidas, pesos iguais
function pesos(p: Projeto) {
  const total = p.etapas.reduce((a, e) => a + (e.horasPrevistas || 0), 0);
  return (e: Etapa) => (total > 0 ? e.horasPrevistas || 0 : 1);
}

export function avancoProjeto(p: Projeto) {
  const peso = pesos(p);
  const total = p.etapas.reduce((a, e) => a + peso(e), 0) || 1;
  return Math.round((p.etapas.reduce((a, e) => a + peso(e) * avancoEtapa(e), 0) / total) * 100);
}

// Quanto já deveria estar pronto hoje pelo plano de trabalho, em % (nulo sem plano)
export function previstoProjeto(p: Projeto, hoje = hojeIso()) {
  if (!p.planoFechadoEm || !p.etapas.every((e) => e.dataInicio && e.dataFim)) return null;
  const peso = pesos(p);
  const horas = p.etapas.reduce((a, e) => a + peso(e), 0) || 1;
  const soma = p.etapas.reduce((a, e) => {
    const dias = diferencaDias(e.dataInicio!, e.dataFim!) + 1;
    const corridos = Math.min(dias, Math.max(0, diferencaDias(e.dataInicio!, hoje) + 1));
    return a + peso(e) * (corridos / dias);
  }, 0);
  return Math.round((soma / horas) * 100);
}

export function etapaAtrasada(e: Etapa, hoje = hojeIso()) {
  return !concluidas.has(e.status) && !!e.dataFim && e.dataFim < hoje;
}

// Fim previsto do projeto: o fim da última etapa
export const entregaFinal = (p: Projeto) => p.etapas[p.etapas.length - 1]?.dataFim ?? null;

// Horas: as do plano de trabalho. Uma etapa finalizada, com o relatório enviado
// no HUB, tem cumpridas as horas definidas para ela.
export function horasDoProjeto(p: Projeto) {
  const previstas = p.etapas.reduce((a, e) => a + (e.horasPrevistas || 0), 0);
  const cumpridas = p.etapas.filter((e) => concluidas.has(e.status)).reduce((a, e) => a + (e.horasPrevistas || 0), 0);
  return { previstas, cumpridas, etapasEnviadas: p.etapas.filter((e) => concluidas.has(e.status)).length, etapas: p.etapas.length };
}

export const horasFmt = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1).replace(".", ",")} h`;

// Situação geral, nas três cores do painel: ponto crítico (devolução), atraso, em dia
export type SituacaoProjeto = { tom: Tom; rotulo: string };
export function situacaoProjeto(p: Projeto, hoje = hojeIso()): SituacaoProjeto {
  if (p.status === "encerrado") return { tom: "ok", rotulo: "Concluído" };
  const fase = faseDoProjeto(p);
  if (fase !== "execucao" && fase !== "finalizado") return { tom: "neutro", rotulo: fases[fase].rotulo };
  if (p.etapas.some((e) => e.status === "devolvida")) return { tom: "critico", rotulo: "Devolvida pelo SEBRAE" };
  if (fase === "finalizado") return { tom: "neutro", rotulo: "Finalizado" };
  if (!p.planoFechadoEm) return { tom: "neutro", rotulo: "Sem plano de trabalho" };
  if (p.etapas.some((e) => etapaAtrasada(e, hoje))) return { tom: "atencao", rotulo: "Atrasado" };
  return { tom: "ok", rotulo: "Em dia" };
}

// Nome do serviço contratado, para distinguir os projetos de um mesmo cliente
export const servicoDoProjeto = (p: Projeto) => p.servicoNome || modeloPorId(p.modeloId)?.nomeCurto || p.fichaTecnica;

// Código do pedido no HUB: é o mesmo número do projeto no HUB (projetos
// antigos podem ter só um dos dois campos preenchidos)
export const codigoHub = (p: Projeto) => (p.codigoSolicitacaoHub || p.numeroProjetoHub || "").trim();

// Uma visita por etapa do serviço (cada etapa tem o seu relatório)
export const visitasDoProjeto = (p: Projeto) => p.etapas.length;

// Até 3 projetos em andamento por cliente; um 4º só excepcionalmente
export const LIMITE_PROJETOS_CLIENTE = 3;
