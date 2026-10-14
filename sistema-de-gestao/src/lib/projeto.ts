import { diferencaDias, hojeIso } from "./datas";
import type { Etapa, Projeto } from "./dados/tipos";

const concluidas = new Set(["enviada", "aprovada"]);

export function etapaAtual(p: Projeto): Etapa | undefined {
  return p.etapas.find((e) => !concluidas.has(e.status));
}

export function diasParaFim(e: Etapa) {
  if (!e.dataFim) return null;
  return diferencaDias(hojeIso(), e.dataFim);
}

export function situacaoPrazo(e: Etapa): { texto: string; cor: "cinza" | "verde" | "ambar" | "vermelho" } {
  if (concluidas.has(e.status)) return { texto: "Concluída", cor: "verde" };
  const d = diasParaFim(e);
  if (d === null) return { texto: "Sem data", cor: "cinza" };
  if (d < 0) return { texto: `${-d} dia(s) de atraso`, cor: "vermelho" };
  if (d === 0) return { texto: "Vence hoje", cor: "ambar" };
  if (d <= 2) return { texto: `Vence em ${d} dia(s)`, cor: "ambar" };
  return { texto: `${d} dias restantes`, cor: "cinza" };
}

export function progressoAtividades(e: Etapa) {
  const feitas = e.atividades.filter((a) => a.status !== "pendente").length;
  return { feitas, total: e.atividades.length };
}
