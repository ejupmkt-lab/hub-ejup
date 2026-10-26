import type { Etapa, Projeto } from "./dados/tipos";
import { formatarData, hojeIso } from "./datas";
import { hubDoProjeto, ordemPassos } from "./fase";
import { etapaConcluida } from "./projeto";

// Valores e recebimento de cada projeto. Só quem tem a permissão de ver o
// financeiro carrega estes dados (tabelas financeiro_servicos e
// financeiro_projetos, protegidas no banco).
//
// Regras: o valor é horas × valor da hora (as horas são as que cabem no teto
// do serviço); a FUNCERN fica com a sua parte (10%). O SEBRAE paga até o dia 5
// de cada mês o que ficou pronto até o dia 20 do mês anterior: 30% quando o
// Relatório 1 foi enviado e o projeto ainda não foi finalizado; o restante
// (70%, ou 100% se tudo sair no mesmo mês) quando o projeto é finalizado no
// HUB (último relatório enviado e o cliente avaliou a consultoria).

export const VALOR_HORA_PADRAO = 90;
export const PERC_FUNCERN_PADRAO = 10;

export type FinServico = { servicoId: string; empresa: string; teto: number; valorHora: number; percFuncern: number };
export type FinProjeto = { projetoId: string; empresa: string; valorHora: number | null; percFuncern: number | null; recebidos: Record<string, string> };

export const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// O maior número inteiro de horas cujo valor não passa do teto (30.000 ÷ 90 = 333 h)
export const horasNoTeto = (teto: number, valorHora: number) => (valorHora > 0 ? Math.floor(teto / valorHora + 1e-9) : 0);

// Dia 5 em que cai o pagamento do que ficou pronto na data: até o dia 20, no
// mês seguinte; depois do dia 20, no outro
export function diaDoPagamento(data: string): string {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + (d <= 20 ? 1 : 2), 5)).toISOString().slice(0, 10);
}

// Próximo dia 20 (hoje, se for dia 20): o corte do pagamento do mês
export function proximoCorte(hoje = hojeIso()): string {
  const [a, m, d] = hoje.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + (d <= 20 ? 0 : 1), 20)).toISOString().slice(0, 10);
}

// Quando o relatório da etapa foi enviado no HUB: a data registrada; nos
// projetos antigos, a do histórico
export function dataDeEnvio(p: Projeto, e: Etapa): string | null {
  if (!etapaConcluida(e)) return null;
  if (e.enviadaEm) return e.enviadaEm;
  const n = String(e.ordem).padStart(2, "0");
  const ev = p.historico.find((h) => h.acao.startsWith(`Etapa ${n}:`) && /enviada/i.test(h.acao));
  return ev ? ev.em.slice(0, 10) : null;
}

// Finalizado no HUB: último relatório enviado e o cliente avaliou a consultoria
export function dataFinalizacao(p: Projeto): string | null {
  const h = hubDoProjeto(p);
  if (ordemPassos.indexOf(h.passo) < ordemPassos.indexOf("avaliado")) return null;
  return h.datas.avaliado ?? h.datas.concluido ?? null;
}

export type Parcela = {
  chave: "30" | "70" | "100";
  percentual: number;
  valor: number;
  previsao: string | null; // dia 5 previsto
  condicao: string;
  recebidaEm: string | null;
};

export function recebimento(p: Projeto, fs?: FinServico, fp?: FinProjeto) {
  const valorHora = fp?.valorHora ?? fs?.valorHora ?? VALOR_HORA_PADRAO;
  const percFuncern = fp?.percFuncern ?? fs?.percFuncern ?? PERC_FUNCERN_PADRAO;
  const horas = p.etapas.reduce((a, e) => a + (e.horasPrevistas || 0), 0);
  const bruto = horas * valorHora;
  const funcern = (bruto * percFuncern) / 100;
  const liquido = bruto - funcern;
  const envio1 = p.etapas[0] ? dataDeEnvio(p, p.etapas[0]) : null;
  const fim = dataFinalizacao(p);
  const ciclo1 = envio1 ? diaDoPagamento(envio1) : null;
  const cicloFim = fim ? diaDoPagamento(fim) : null;
  const recebidos = fp?.recebidos ?? {};
  const condicaoFim = fim ? `Finalizado no HUB em ${formatarData(fim)}` : "Quando o projeto for finalizado no HUB (último relatório e avaliação do cliente)";
  const parcela = (chave: Parcela["chave"], percentual: number, previsao: string | null, condicao: string): Parcela => ({
    chave,
    percentual,
    valor: (liquido * percentual) / 100,
    previsao,
    condicao,
    recebidaEm: recebidos[chave] ?? null,
  });
  // Tudo no mesmo pagamento: o Relatório 1 e a finalização no mesmo ciclo
  const juntos = !!ciclo1 && !!cicloFim && ciclo1 >= cicloFim;
  const parcelas = juntos
    ? [parcela("100", 100, cicloFim, condicaoFim)]
    : [
        parcela("30", 30, ciclo1, envio1 ? `Relatório 1 enviado em ${formatarData(envio1)}` : "Quando o Relatório 1 for enviado no HUB"),
        parcela("70", 70, cicloFim, condicaoFim),
      ];
  return { horas, valorHora, percFuncern, bruto, funcern, liquido, parcelas };
}
