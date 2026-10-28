import { somarDias } from "./datas";

// Período de análise do financeiro: um mês, um trimestre, um ano, tudo ou um intervalo escolhido.
// O mês de referência é "AAAA-MM"; os limites vêm em "AAAA-MM-DD".
export type ModoDePeriodo = "mes" | "trimestre" | "ano" | "tudo" | "personalizado";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const doisDigitos = (n: number) => String(n).padStart(2, "0");
const ultimoDia = (a: number, m: number) => new Date(Date.UTC(a, m, 0)).getUTCDate();

export function somarMeses(ym: string, n: number) {
  const [a, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}`;
}

export const passoDoModo: Record<ModoDePeriodo, number> = { mes: 1, trimestre: 3, ano: 12, tudo: 0, personalizado: 0 };

export function intervaloDoPeriodo(modo: ModoDePeriodo, ref: string, de = "", ate = ""): { inicio: string; fim: string; rotulo: string } {
  const [a, m] = ref.split("-").map(Number);
  if (modo === "mes") return { inicio: `${ref}-01`, fim: `${ref}-${doisDigitos(ultimoDia(a, m))}`, rotulo: `${MESES[m - 1][0].toUpperCase()}${MESES[m - 1].slice(1)} de ${a}` };
  if (modo === "trimestre") {
    const q = Math.floor((m - 1) / 3);
    const mi = q * 3 + 1;
    return { inicio: `${a}-${doisDigitos(mi)}-01`, fim: `${a}-${doisDigitos(mi + 2)}-${doisDigitos(ultimoDia(a, mi + 2))}`, rotulo: `${q + 1}º trimestre de ${a}` };
  }
  if (modo === "ano") return { inicio: `${a}-01-01`, fim: `${a}-12-31`, rotulo: String(a) };
  if (modo === "tudo") return { inicio: "0000-01-01", fim: "9999-12-31", rotulo: "Todo o período" };
  const fmt = (d: string) => d.split("-").reverse().join("/");
  const inicio = de || "0000-01-01";
  const fim = ate || "9999-12-31";
  return { inicio, fim: fim < inicio ? somarDias(inicio, 0) : fim, rotulo: de && ate ? `${fmt(de)} a ${fmt(ate)}` : de ? `A partir de ${fmt(de)}` : ate ? `Até ${fmt(ate)}` : "Todo o período" };
}
