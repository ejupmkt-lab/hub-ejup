import type { Etapa, Projeto } from "./dados/tipos";
import { diferencaDias, formatarData, hojeIso, somarDias } from "./datas";
import { avancoEtapa, etapaConcluida, etapaIniciada } from "./projeto";

// Projeção de quando cada etapa ainda não enviada vai terminar (o relatório sai no HUB), a partir do andamento de hoje:
// - etapa em curso: termina quando faltar fazer o que falta, no ritmo que o plano previa (duração × o que falta);
// - etapa que ainda não começou: começa quando a anterior termina (ou na data do plano, se for mais tarde) e dura o que o plano previa.
// É a base das datas previstas de recebimento: se o projeto atrasa ou adianta, as parcelas andam junto.

export type EnvioProjetado = { ordem: number; inicio: string; fim: string; emCurso: boolean; feito: number; texto: string };

const duracaoDaEtapa = (e: Etapa) => (e.dataInicio && e.dataFim ? diferencaDias(e.dataInicio, e.dataFim) + 1 : e.duracaoReferenciaDias || 7);

export function projetarEnvios(p: Projeto, hoje = hojeIso()): Map<number, EnvioProjetado> {
  const lista = new Map<number, EnvioProjetado>();
  let livre = hoje; // primeiro dia em que a próxima etapa pode começar
  for (const e of p.etapas) {
    if (etapaConcluida(e)) continue;
    const dur = Math.max(1, duracaoDaEtapa(e));
    const feito = avancoEtapa(e);
    const emCurso = etapaIniciada(e);
    let inicio: string;
    let fim: string;
    if (emCurso) {
      inicio = e.iniciadaEm && e.iniciadaEm <= hoje ? e.iniciadaEm : hoje;
      fim = somarDias(hoje, Math.max(0, Math.ceil(dur * (1 - feito))));
    } else {
      inicio = e.dataInicio && e.dataInicio > livre ? e.dataInicio : livre;
      fim = somarDias(inicio, dur - 1);
    }
    if (fim < livre) fim = livre;
    const pct = Math.round(feito * 100);
    const texto = emCurso
      ? `Etapa ${e.ordem} em andamento (${pct}% feita): termina por volta de ${formatarData(fim)}`
      : `Etapa ${e.ordem} ainda não começou: pelo plano, começa em ${formatarData(inicio)} e termina em ${formatarData(fim)}`;
    lista.set(e.ordem, { ordem: e.ordem, inicio, fim, emCurso, feito, texto });
    livre = somarDias(fim, 1);
  }
  return lista;
}
