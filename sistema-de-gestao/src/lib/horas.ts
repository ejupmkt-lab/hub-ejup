import type { Projeto, RegistroAtividade, TipoAtividade } from "./dados/tipos";
import { formatarData } from "./datas";

export const tiposAtividade: Record<TipoAtividade, { rotulo: string; curto: string }> = {
  visita: { rotulo: "Visita presencial", curto: "Visita" },
  reuniao_remota: { rotulo: "Reunião remota", curto: "Reunião remota" },
  trabalho_interno: { rotulo: "Trabalho interno", curto: "Trabalho interno" },
};

export const registros = (p: Projeto) => p.atividadesRegistradas ?? [];
export const registrosDaEtapa = (p: Projeto, ordem: number) => registros(p).filter((r) => r.etapa === ordem);
const somar = (l: RegistroAtividade[]) => l.reduce((a, r) => a + (Number(r.horas) || 0), 0);

export function horasDoProjeto(p: Projeto) {
  const previstas = p.etapas.reduce((a, e) => a + e.horasPrevistas, 0);
  const realizadas = somar(registros(p));
  const porEtapa = p.etapas.map((e) => ({ ordem: e.ordem, previstas: e.horasPrevistas, realizadas: somar(registrosDaEtapa(p, e.ordem)) }));
  const visitas = registros(p).filter((r) => r.tipo === "visita").length;
  const visitasPrevistas = Number(p.numeroVisitas) || null;
  return { previstas, realizadas, porEtapa, visitas, visitasPrevistas };
}

export const horasFmt = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1).replace(".", ",")} h`;

// Frase para o relatório: quando e como houve contato com o cliente na etapa
export function encontrosDaEtapa(p: Projeto, ordem: number) {
  const encontros = registrosDaEtapa(p, ordem)
    .filter((r) => r.tipo !== "trabalho_interno")
    .sort((a, b) => a.data.localeCompare(b.data));
  if (!encontros.length) return "";
  const itens = encontros.map((r) => `${formatarData(r.data)} (${r.tipo === "visita" ? "visita presencial" : "reunião remota"})`);
  const lista = itens.length === 1 ? itens[0] : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
  return `Os encontros com a empresa ocorreram em ${lista}.`;
}
