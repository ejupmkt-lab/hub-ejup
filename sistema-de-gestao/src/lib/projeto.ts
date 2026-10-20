import { diferencaDias, hojeIso } from "./datas";
import type { Etapa, Projeto } from "./dados/tipos";
import type { Tom } from "./rotulos";
import { modeloPorId } from "./modelos";

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
  if (p.status === "aguardando_plano")
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

// Andamento de uma etapa (0 a 1): 40% pelo checklist e 60% pelo status do relatório
export function avancoEtapa(e: Etapa) {
  if (concluidas.has(e.status)) return 1;
  const { feitas, total } = progressoAtividades(e);
  return 0.4 * (total ? feitas / total : 0) + 0.6 * pesoStatus[e.status];
}

// Avanço do projeto em %: o andamento de cada etapa pesado pelas horas dela
export function avancoProjeto(p: Projeto) {
  const horas = p.etapas.reduce((a, e) => a + e.horasPrevistas, 0) || 1;
  return Math.round((p.etapas.reduce((a, e) => a + e.horasPrevistas * avancoEtapa(e), 0) / horas) * 100);
}

// Quanto já deveria estar pronto hoje pelo plano de trabalho, em % (nulo sem plano)
export function previstoProjeto(p: Projeto, hoje = hojeIso()) {
  if (!p.planoFechadoEm || !p.etapas.every((e) => e.dataInicio && e.dataFim)) return null;
  const horas = p.etapas.reduce((a, e) => a + e.horasPrevistas, 0) || 1;
  const soma = p.etapas.reduce((a, e) => {
    const dias = diferencaDias(e.dataInicio!, e.dataFim!) + 1;
    const corridos = Math.min(dias, Math.max(0, diferencaDias(e.dataInicio!, hoje) + 1));
    return a + e.horasPrevistas * (corridos / dias);
  }, 0);
  return Math.round((soma / horas) * 100);
}

export function etapaAtrasada(e: Etapa, hoje = hojeIso()) {
  return !concluidas.has(e.status) && !!e.dataFim && e.dataFim < hoje;
}

// Fim previsto do projeto: o fim da última etapa
export const entregaFinal = (p: Projeto) => p.etapas[p.etapas.length - 1]?.dataFim ?? null;

// Dias desde o último registro de visita, reunião ou trabalho (nulo se nunca houve)
export function diasSemRegistro(p: Projeto, hoje = hojeIso()) {
  const ultima = (p.atividadesRegistradas ?? []).map((r) => r.data).sort().pop();
  return ultima ? Math.max(0, diferencaDias(ultima, hoje)) : null;
}

// Situação geral, nas três cores do painel: ponto crítico (devolução), atraso, em dia
export type SituacaoProjeto = { tom: Tom; rotulo: string };
export function situacaoProjeto(p: Projeto, hoje = hojeIso()): SituacaoProjeto {
  if (p.status === "encerrado") return { tom: "ok", rotulo: "Encerrado" };
  if (p.etapas.some((e) => e.status === "devolvida")) return { tom: "critico", rotulo: "Devolvida pelo SEBRAE" };
  if (!p.planoFechadoEm) return { tom: "neutro", rotulo: "Sem plano de trabalho" };
  if (p.etapas.some((e) => etapaAtrasada(e, hoje))) return { tom: "atencao", rotulo: "Atrasado" };
  return { tom: "ok", rotulo: "Em dia" };
}

// Nome do serviço contratado, para distinguir os projetos de um mesmo cliente
export const servicoDoProjeto = (p: Projeto) => modeloPorId(p.modeloId)?.nomeCurto ?? p.fichaTecnica;

// Até 3 projetos em andamento por cliente; um 4º só excepcionalmente
export const LIMITE_PROJETOS_CLIENTE = 3;
