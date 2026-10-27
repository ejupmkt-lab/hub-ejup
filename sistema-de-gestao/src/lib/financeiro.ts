import type { Etapa, Projeto } from "./dados/tipos";
import { formatarData, hojeIso } from "./datas";
import { hubDoProjeto, ordemPassos } from "./fase";
import { etapaConcluida } from "./projeto";
import { aliquotaNoMes, imposto, type ConfigImposto } from "./imposto";

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
//
// Enquanto o relatório não é enviado, a data do pagamento é uma estimativa feita
// com o fim previsto da etapa 1 e da última etapa do plano (nunca antes de hoje);
// a pessoa pode combinar outra data com o SEBRAE e registrá-la na parcela. Depois
// do pagamento, o imposto (Simples, pela faixa do faturamento) vem de imposto.ts.

export const VALOR_HORA_PADRAO = 90;
export const PERC_FUNCERN_PADRAO = 10;

export type FinServico = { servicoId: string; empresa: string; teto: number; valorHora: number; percFuncern: number };
export type FinProjeto = {
  projetoId: string;
  empresa: string;
  valorHora: number | null;
  percFuncern: number | null;
  recebidos: Record<string, string>;
  previsoes: Record<string, string>; // data combinada de cada parcela, no lugar da estimada
};
export type FinEmpresa = ConfigImposto & { empresa: string };

export const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// O maior número inteiro de horas cujo valor não passa do teto (30.000 ÷ 90 = 333 h)
export const horasNoTeto = (teto: number, valorHora: number) => (valorHora > 0 ? Math.floor(teto / valorHora + 1e-9) : 0);

// Dia 5 em que cai o pagamento do que ficou pronto na data: até o dia 20, no
// mês seguinte; depois do dia 20, no outro
export function diaDoPagamento(data: string): string {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + (d <= 20 ? 1 : 2), 5)).toISOString().slice(0, 10);
}

// Dia 5 do mês seguinte ao do pagamento dado
const proximoPagamento = (pagamento: string) => {
  const [a, m] = pagamento.split("-").map(Number);
  return new Date(Date.UTC(a, m, 5)).toISOString().slice(0, 10);
};

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

// De onde vem a data da parcela: do HUB (relatório enviado ou projeto finalizado), do plano de trabalho
// (estimada) ou combinada à mão
export type OrigemDaData = "hub" | "plano" | "manual";

export type Parcela = {
  chave: "30" | "70" | "100";
  percentual: number;
  valor: number;
  previsao: string | null; // dia 5 previsto
  origem: OrigemDaData | null;
  condicao: string;
  recebidaEm: string | null;
};

export function recebimento(p: Projeto, fs?: FinServico, fp?: FinProjeto, hoje = hojeIso()) {
  const valorHora = fp?.valorHora ?? fs?.valorHora ?? VALOR_HORA_PADRAO;
  const percFuncern = fp?.percFuncern ?? fs?.percFuncern ?? PERC_FUNCERN_PADRAO;
  const horas = p.etapas.reduce((a, e) => a + (e.horasPrevistas || 0), 0);
  const bruto = horas * valorHora;
  const funcern = (bruto * percFuncern) / 100;
  const liquido = bruto - funcern;
  const envio1 = p.etapas[0] ? dataDeEnvio(p, p.etapas[0]) : null;
  const fim = dataFinalizacao(p);
  // Sem relatório ou finalização, o fim previsto no plano (o que já passou vira "hoje")
  const noPlano = !!p.planoFechadoEm && p.status !== "encerrado";
  const naoAntesDeHoje = (d: string | null | undefined) => (d ? (d < hoje ? hoje : d) : null);
  const planoEnvio1 = noPlano ? naoAntesDeHoje(p.etapas[0]?.dataFim) : null;
  const planoFim = noPlano ? naoAntesDeHoje(p.etapas.reduce<string | null>((m, e) => (e.dataFim && (!m || e.dataFim > m) ? e.dataFim : m), null)) : null;
  const data1 = envio1 ?? planoEnvio1;
  const dataFim = fim ?? (planoFim && data1 && planoFim < data1 ? data1 : planoFim);
  const ciclo1 = data1 ? diaDoPagamento(data1) : null;
  const juntosDeVerdade = !!envio1 && !!fim; // as duas datas são do HUB: dá para saber se caem no mesmo pagamento
  let cicloFim = dataFim ? diaDoPagamento(dataFim) : null;
  // Estimativa: o restante só é pago depois da finalização, então nunca no mesmo pagamento dos 30% (a menos que o HUB mostre o contrário)
  if (!juntosDeVerdade && cicloFim && ciclo1 && cicloFim <= ciclo1) cicloFim = proximoPagamento(ciclo1);
  const recebidos = fp?.recebidos ?? {};
  const previsoes = fp?.previsoes ?? {};
  const condicaoFim = fim ? `Finalizado no HUB em ${formatarData(fim)}` : "Quando o projeto for finalizado no HUB (último relatório e avaliação do cliente)";
  const parcela = (chave: Parcela["chave"], percentual: number, previsao: string | null, doHub: boolean, condicao: string): Parcela => ({
    chave,
    percentual,
    valor: (liquido * percentual) / 100,
    previsao: previsoes[chave] ?? previsao,
    origem: previsoes[chave] ? "manual" : previsao ? (doHub ? "hub" : "plano") : null,
    condicao,
    recebidaEm: recebidos[chave] ?? null,
  });
  // Tudo no mesmo pagamento: o Relatório 1 e a finalização no mesmo ciclo (a menos que os 30% já tenham sido pagos)
  const juntos = juntosDeVerdade && !!ciclo1 && !!cicloFim && ciclo1 >= cicloFim && !recebidos["30"] && !recebidos["70"];
  const parcelas = juntos
    ? [parcela("100", 100, cicloFim, true, condicaoFim)]
    : [
        parcela("30", 30, ciclo1, !!envio1, envio1 ? `Relatório 1 enviado em ${formatarData(envio1)}` : "Quando o Relatório 1 for enviado no HUB"),
        parcela("70", 70, cicloFim, !!fim, condicaoFim),
      ];
  // Na ordem em que o dinheiro entra; as sem data ficam no fim
  parcelas.sort((a, b) => (a.previsao ?? "9999").localeCompare(b.previsao ?? "9999"));
  return { horas, valorHora, percFuncern, bruto, funcern, liquido, parcelas };
}

export type Entrada = {
  projeto: Projeto;
  parcela: Parcela;
  mes: string | null; // AAAA-MM do pagamento
  aliquota: number | null; // % de imposto do mês do pagamento
  imposto: number;
  aposImposto: number;
};

// Todas as parcelas dos projetos, na ordem de recebimento, com o imposto do mês em que cada uma cai
export function entradasDeRecebimento(
  projetos: Projeto[],
  servicos: Record<string, FinServico>,
  fps: Record<string, FinProjeto>,
  empresas: Record<string, FinEmpresa>,
  hoje = hojeIso(),
): Entrada[] {
  const lista = projetos.flatMap((p) =>
    recebimento(p, servicos[p.modeloId], fps[p.id], hoje).parcelas.map((parcela): Entrada => {
      const mes = parcela.previsao ? parcela.previsao.slice(0, 7) : null;
      const aliquota = mes ? aliquotaNoMes(empresas[p.empresa], mes) : null;
      const imp = aliquota === null ? 0 : imposto(parcela.valor, aliquota);
      return { projeto: p, parcela, mes, aliquota, imposto: imp, aposImposto: parcela.valor - imp };
    }),
  );
  return lista.sort((a, b) => (a.parcela.previsao ?? "9999").localeCompare(b.parcela.previsao ?? "9999") || a.projeto.id.localeCompare(b.projeto.id) || a.parcela.chave.localeCompare(b.parcela.chave));
}
