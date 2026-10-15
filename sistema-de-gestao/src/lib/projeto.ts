import { diferencaDias, hojeIso } from "./datas";
import type { Etapa, Projeto } from "./dados/tipos";
import type { Tom } from "./rotulos";

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
