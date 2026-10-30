import type { Etapa, Projeto } from "./dados/tipos";
import { formatarData, hojeIso } from "./datas";
import { antesDaContratacao, hubDoProjeto, ordemPassos } from "./fase";
import { etapaConcluida } from "./projeto";
import { projetarEnvios, type EnvioProjetado } from "./projecao";
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
  valores: Record<string, number>; // valor de cada parcela ajustado à mão, no lugar do calculado
  notas: Record<string, NotaFiscal>; // nota fiscal de cada parcela
  fonteContrapartida: string | null; // de quem saiu o dinheiro da contrapartida (para onde ele volta): ver FONTES_DE_CUSTEIO
};

// Fontes de custeio da contrapartida: quem adiantou o valor e, por isso, recebe de volta (ou o caixa da empresa, que não devolve)
export const FONTES_DE_CUSTEIO = [
  { valor: "roberto", rotulo: "Roberto" },
  { valor: "leonardo", rotulo: "Leonardo" },
  { valor: "caixa", rotulo: "Caixa da empresa" },
  { valor: "outra", rotulo: "Outra" },
] as const;
export const rotuloDaFonte = (v: string | null | undefined) => FONTES_DE_CUSTEIO.find((f) => f.valor === v)?.rotulo ?? null;

// Nota fiscal de uma parcela: emitida quando tem a data de emissão (ou o número)
export type NotaFiscal = {
  numero: string;
  emitidaEm: string | null;
  valor: number | null; // quando a nota sai por outro valor que o da parcela
  arquivo: { caminho: string; nome: string } | null;
};
export const notaEmitida = (n: NotaFiscal | undefined | null) => !!n && (!!n.emitidaEm || !!n.numero.trim());

// As duas parcelas do SEBRAE. A "Contrapartida" (valores.contrapartida) e o percentual do imposto (valores.aliquota) não são parcelas
export type ChaveDeParcela = "30" | "70";
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
  chave: ChaveDeParcela;
  ordem: 1 | 2;
  explicacao: string | null; // de onde vem a data, quando é uma projeção
  percentual: number;
  valor: number;
  valorCalculado: number;
  previsao: string | null; // dia 5 previsto
  origem: OrigemDaData | null;
  condicao: string;
  recebidaEm: string | null;
};

// Projetos antigos guardaram o pagamento único como "100": vale para as duas parcelas
const lerMapa = <T,>(mapa: Record<string, T> | undefined, chave: string): T | undefined => mapa?.[chave] ?? mapa?.["100"];

export function recebimento(p: Projeto, fs?: FinServico, fp?: FinProjeto, hoje = hojeIso()) {
  const valorHora = fp?.valorHora ?? fs?.valorHora ?? VALOR_HORA_PADRAO;
  const percFuncern = fp?.percFuncern ?? fs?.percFuncern ?? PERC_FUNCERN_PADRAO;
  const horas = p.etapas.reduce((a, e) => a + (e.horasPrevistas || 0), 0);
  const bruto = horas * valorHora;
  const funcern = (bruto * percFuncern) / 100;
  // Contrapartida: desconto sobre o total a receber (uma espécie de cashback), tirado antes de repartir em 30% e 70%
  const contrapartida = Math.min(Math.max(0, fp?.valores?.contrapartida ?? 0), bruto - funcern);
  const liquido = bruto - funcern - contrapartida;
  const envio1 = p.etapas[0] ? dataDeEnvio(p, p.etapas[0]) : null;
  const fim = dataFinalizacao(p);
  // Sem relatório ou finalização, a projeção pelo andamento do projeto (ver projecao.ts)
  // Sem a data do Relatório 1 definida (enviado, ou com data na execução do plano), não há perspectiva de receber: antes do
  // pagamento o plano é só proposta e as datas ainda vão mudar
  const relatorio1Definido = !!envio1 || (!!p.etapas[0]?.dataFim && !antesDaContratacao(p));
  const noPlano = !!p.planoFechadoEm && p.status !== "encerrado" && relatorio1Definido;
  const projecao = noPlano ? projetarEnvios(p, hoje) : new Map<number, EnvioProjetado>();
  const primeira = p.etapas[0];
  const ultima = p.etapas[p.etapas.length - 1];
  const todasEnviadas = noPlano && p.etapas.length > 0 && p.etapas.every(etapaConcluida);
  const planoEnvio1 = primeira ? (projecao.get(primeira.ordem)?.fim ?? null) : null;
  const planoFim = ultima ? (projecao.get(ultima.ordem)?.fim ?? (todasEnviadas ? hoje : null)) : null;
  const porque1 = primeira ? (projecao.get(primeira.ordem)?.texto ?? null) : null;
  const porqueFim = ultima ? (projecao.get(ultima.ordem)?.texto ?? (todasEnviadas ? "Todas as etapas foram enviadas: falta o cliente avaliar a consultoria no HUB" : null)) : null;
  const data1 = envio1 ?? planoEnvio1;
  const dataFim = fim ?? (planoFim && data1 && planoFim < data1 ? data1 : planoFim);
  const ciclo1 = data1 ? diaDoPagamento(data1) : null;
  let cicloFim = dataFim ? diaDoPagamento(dataFim) : null;
  // Estimativa: o restante só é pago depois da finalização, então nunca no mesmo pagamento dos 30% (a menos que o HUB mostre o contrário)
  if (!(envio1 && fim) && cicloFim && ciclo1 && cicloFim <= ciclo1) cicloFim = proximoPagamento(ciclo1);
  const condicaoFim = fim ? `Finalizado no HUB em ${formatarData(fim)}` : "Quando o projeto for finalizado no HUB";
  const parcela = (chave: "30" | "70", ordem: 1 | 2, percentual: number, previsao: string | null, doHub: boolean, condicao: string, porque: string | null, base: string | null): Parcela => {
    const manual = lerMapa(fp?.previsoes, chave);
    const valorCalculado = (liquido * percentual) / 100;
    return {
      chave,
      ordem,
      percentual,
      valor: lerMapa(fp?.valores, chave) ?? valorCalculado,
      valorCalculado,
      previsao: manual ?? previsao,
      origem: manual ? "manual" : previsao ? (doHub ? "hub" : "plano") : null,
      explicacao: manual
        ? "Data combinada por você"
        : !previsao
          ? "Sem a data do Relatório 1 definida, ainda não há perspectiva de recebimento."
          : !doHub && porque
            ? `${porque}.${base && Number(base.slice(8)) > 20 ? " Passando do dia 20, o pagamento fica para o mês seguinte." : ""}`
            : null,
      condicao,
      recebidaEm: lerMapa(fp?.recebidos, chave) ?? null,
    };
  };
  // Sempre duas parcelas, na ordem em que o dinheiro entra (mesmo que caiam no mesmo dia 5)
  const parcelas = [
    parcela("30", 1, 30, ciclo1, !!envio1, envio1 ? `Relatório 1 enviado em ${formatarData(envio1)}` : "Quando o Relatório 1 for enviado no HUB", porque1, data1),
    parcela("70", 2, 70, cicloFim, !!fim, condicaoFim, porqueFim, dataFim),
  ];
  return { horas, valorHora, percFuncern, bruto, funcern, contrapartida, liquido, parcelas };
}

// Percentual de imposto definido à mão no projeto (valores.aliquota); vazio: vale o da faixa do faturamento da empresa
export const aliquotaDoProjeto = (fp: FinProjeto | undefined | null): number | null => {
  const a = fp?.valores?.aliquota;
  return typeof a === "number" && Number.isFinite(a) && a >= 0 ? a : null;
};

export type Entrada = {
  projeto: Projeto;
  parcela: Parcela;
  nota: NotaFiscal | null;
  mes: string | null; // AAAA-MM em que o dinheiro entrou (ou entra)
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
      const dia = parcela.recebidaEm ?? parcela.previsao;
      const mes = dia ? dia.slice(0, 7) : null;
      // O percentual definido no projeto vale no lugar da faixa do faturamento da empresa
      const aliquota = aliquotaDoProjeto(fps[p.id]) ?? (mes ? aliquotaNoMes(empresas[p.empresa], mes) : null);
      const imp = aliquota === null ? 0 : imposto(parcela.valor, aliquota);
      return { projeto: p, parcela, nota: fps[p.id]?.notas?.[parcela.chave] ?? null, mes, aliquota, imposto: imp, aposImposto: parcela.valor - imp };
    }),
  );
  const dataDe = (e: Entrada) => e.parcela.recebidaEm ?? e.parcela.previsao ?? "9999";
  return lista.sort((a, b) => dataDe(a).localeCompare(dataDe(b)) || a.projeto.id.localeCompare(b.projeto.id) || a.parcela.chave.localeCompare(b.parcela.chave));
}
