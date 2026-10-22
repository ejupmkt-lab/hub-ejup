import type { Etapa, Projeto } from "./dados/tipos";
import { diferencaDias, hojeIso, somarDias } from "./datas";
import { etapaConcluida, situacaoDaEtapa, type SituacaoEtapa } from "./projeto";
import { antesDaContratacao, comQuem, etapasTodasEnviadas, faseDoProjeto, ondeEsta, comQuemTexto } from "./fase";

// Números, cronograma, calendário e gráficos do painel, calculados a partir
// das datas do plano de trabalho e do status de cada etapa.

// Situação de uma etapa para o cronograma, o calendário e os gráficos. As
// mesmas cores do painel: vermelho para devolução (ponto crítico), laranja
// para atraso, verde para o que foi entregue; azul para o que está em curso.
export type Grupo = "nao_iniciada" | "andamento" | "a_enviar" | "concluida" | "atrasada" | "devolvida";
export const grupos: Record<Grupo, { rotulo: string; cor: string; texto: string }> = {
  nao_iniciada: { rotulo: "Não iniciada", cor: "#d3d9e3", texto: "#121a2b" },
  andamento: { rotulo: "Em andamento", cor: "#2563eb", texto: "#ffffff" },
  a_enviar: { rotulo: "Pronta para enviar", cor: "#7c3aed", texto: "#ffffff" },
  concluida: { rotulo: "Enviada ou aprovada", cor: "#16a34a", texto: "#ffffff" },
  atrasada: { rotulo: "Atrasada", cor: "#f97316", texto: "#ffffff" },
  devolvida: { rotulo: "Devolvida", cor: "#dc2626", texto: "#ffffff" },
};
export const ordemGrupos: Grupo[] = ["nao_iniciada", "andamento", "a_enviar", "concluida", "atrasada", "devolvida"];
export const pedeAcao = (g: Grupo) => g === "atrasada" || g === "devolvida";

// O grupo vem da situação única da etapa (situacaoDaEtapa), a mesma de toda a tela
const grupoDaSituacao: Record<SituacaoEtapa["chave"], Grupo> = {
  devolvida: "devolvida",
  concluida: "concluida",
  atrasada: "atrasada",
  pronta: "a_enviar",
  andamento: "andamento",
  nao_iniciada: "nao_iniciada",
};
export const grupoDaEtapa = (e: Etapa, hoje = hojeIso()): Grupo => grupoDaSituacao[situacaoDaEtapa(e, hoje).chave];

export const ativos = (projetos: Projeto[]) => projetos.filter((p) => p.status !== "encerrado");

// ─── Indicadores ──────────────────────────────────────────────────────────

export function indicadores(projetos: Projeto[]) {
  const hoje = hojeIso();
  const lista = ativos(projetos);
  const etapas = lista.flatMap((p) => p.etapas);
  const semPlano = lista.filter((p) => !p.planoFechadoEm && !antesDaContratacao(p)).length;
  const comPlano = lista.filter((p) => p.planoFechadoEm && !antesDaContratacao(p)).flatMap((p) => p.etapas);
  const proximos7 = comPlano.filter((e) => !etapaConcluida(e) && e.dataFim && e.dataFim >= hoje && e.dataFim <= somarDias(hoje, 7)).length;
  const acao = comPlano.filter((e) => pedeAcao(grupoDaEtapa(e, hoje))).length;
  const atrasadas = comPlano.filter((e) => grupoDaEtapa(e, hoje) === "atrasada").length;
  const devolvidas = comPlano.filter((e) => e.status === "devolvida").length;
  const concluidas = etapas.filter(etapaConcluida).length;
  const semana = cargaSemanal(projetos, 0, 1)[0]?.horas ?? 0;
  const preContrato = lista.filter(antesDaContratacao).length;
  return { projetos: lista.length, preContrato, emExecucao: lista.length - preContrato, semPlano, proximos7, acao, atrasadas, devolvidas, concluidas, totalEtapas: etapas.length, horasSemana: Math.round(semana) };
}

// ─── Cronograma (Gantt) ───────────────────────────────────────────────────

export function janelaCronograma(projetos: Projeto[]) {
  const hoje = hojeIso();
  const datas = ativos(projetos)
    .filter((p) => p.planoFechadoEm)
    .flatMap((p) => p.etapas.flatMap((e) => [e.dataInicio, e.dataFim]))
    .filter((d): d is string => !!d)
    .sort();
  const inicio = segunda(datas[0] && datas[0] < somarDias(hoje, -7) ? datas[0] : somarDias(hoje, -7));
  const fimDados = datas[datas.length - 1] ?? hoje;
  const fim = somarDias(segunda(fimDados > somarDias(hoje, 21) ? fimDados : somarDias(hoje, 21)), 6);
  return { inicio, fim, dias: diferencaDias(inicio, fim) + 1 };
}

// Segunda-feira da semana da data
export function segunda(iso: string) {
  const dia = new Date(iso + "T00:00:00Z").getUTCDay(); // 0 = domingo
  return somarDias(iso, dia === 0 ? -6 : 1 - dia);
}

// ─── Calendário ───────────────────────────────────────────────────────────

export type Evento = { data: string; tipo: "prazo" | "inicio"; projeto: Projeto; etapa: Etapa; grupo: Grupo };

export function eventos(projetos: Projeto[]): Evento[] {
  const hoje = hojeIso();
  return ativos(projetos)
    .filter((p) => p.planoFechadoEm)
    .flatMap((p) =>
      p.etapas.flatMap((e) => {
        const grupo = grupoDaEtapa(e, hoje);
        const lista: Evento[] = [];
        if (e.dataInicio) lista.push({ data: e.dataInicio, tipo: "inicio", projeto: p, etapa: e, grupo });
        if (e.dataFim) lista.push({ data: e.dataFim, tipo: "prazo", projeto: p, etapa: e, grupo });
        return lista;
      }),
    )
    .sort((a, b) => a.data.localeCompare(b.data) || (a.tipo === "prazo" ? -1 : 1));
}

// Dias exibidos no mês (semanas completas, de segunda a domingo)
export function diasDoMes(mes: string) {
  const primeiro = `${mes}-01`;
  const [a, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
  const inicio = segunda(primeiro);
  const fim = somarDias(segunda(ultimo), 6);
  const dias: string[] = [];
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) dias.push(d);
  return dias;
}

// ─── Pendências ───────────────────────────────────────────────────────────

export type Pendencia = { projeto: Projeto; etapa?: Etapa; texto: string; grupo: Grupo; data?: string };

export function pendenciasDoGrupo(projetos: Projeto[]): Pendencia[] {
  const hoje = hojeIso();
  const lista: Pendencia[] = [];
  for (const p of ativos(projetos)) {
    const fase = faseDoProjeto(p);
    const devolvida = p.etapas.find((e) => e.status === "devolvida");
    if (fase !== "execucao" && !(fase === "finalizado" && devolvida)) {
      const com = comQuem(p);
      lista.push({ projeto: p, texto: `${ondeEsta(p)}${com && com !== "consultor" ? ` (${comQuemTexto(com)})` : ""}`, grupo: com === "consultor" ? "andamento" : "nao_iniciada" });
      continue;
    }
    if (fase === "execucao" && etapasTodasEnviadas(p)) {
      lista.push({ projeto: p, texto: "Todas as etapas enviadas: finalize no HUB", grupo: "a_enviar" });
      continue;
    }
    if (!p.planoFechadoEm) {
      lista.push({ projeto: p, texto: "Sem plano de trabalho", grupo: "nao_iniciada" });
      continue;
    }
    for (const e of p.etapas) {
      const g = grupoDaEtapa(e, hoje);
      if (e.status === "devolvida") lista.push({ projeto: p, etapa: e, texto: "Devolvida pelo SEBRAE", grupo: "devolvida" });
      else if (g === "atrasada" && e.status === "a_enviar")
        lista.push({ projeto: p, etapa: e, texto: "Pronta para enviar, com o prazo vencido", grupo: "atrasada", data: e.dataFim! });
      else if (g === "atrasada") {
        const d = diferencaDias(e.dataFim!, hoje);
        lista.push({ projeto: p, etapa: e, texto: d === 1 ? "1 dia de atraso" : `${d} dias de atraso`, grupo: "atrasada", data: e.dataFim! });
      } else if (g === "a_enviar") lista.push({ projeto: p, etapa: e, texto: "Pronta para enviar no HUB", grupo: "a_enviar" });
      else if (!etapaConcluida(e) && e.dataFim && e.dataFim >= hoje && e.dataFim <= somarDias(hoje, 7)) {
        const d = diferencaDias(hoje, e.dataFim);
        lista.push({
          projeto: p,
          etapa: e,
          texto: d === 0 ? "Prazo hoje" : d === 1 ? "Prazo amanhã" : `Prazo em ${d} dias`,
          grupo: "andamento",
          data: e.dataFim,
        });
      }
    }
  }
  const peso: Record<Grupo, number> = { devolvida: 0, atrasada: 0, a_enviar: 1, andamento: 2, nao_iniciada: 3, concluida: 4 };
  return lista.sort((a, b) => peso[a.grupo] - peso[b.grupo] || (a.data ?? "").localeCompare(b.data ?? ""));
}

// ─── Gráficos ─────────────────────────────────────────────────────────────

export function contagemPorGrupo(projetos: Projeto[]) {
  const hoje = hojeIso();
  const c = Object.fromEntries(ordemGrupos.map((g) => [g, 0])) as Record<Grupo, number>;
  for (const p of ativos(projetos)) for (const e of p.etapas) c[p.planoFechadoEm ? grupoDaEtapa(e, hoje) : "nao_iniciada"]++;
  return c;
}

// Horas previstas por semana: as horas de cada etapa divididas igualmente
// pelos dias corridos dela. Semanas a partir da atual (deslocamento em semanas).
export function cargaSemanal(projetos: Projeto[], desde = -2, semanas = 12) {
  const base = somarDias(segunda(hojeIso()), desde * 7);
  const lista = Array.from({ length: semanas }, (_, i) => ({ semana: somarDias(base, i * 7), horas: 0 }));
  for (const p of ativos(projetos)) {
    if (!p.planoFechadoEm) continue;
    for (const e of p.etapas) {
      if (!e.dataInicio || !e.dataFim) continue;
      const dias = diferencaDias(e.dataInicio, e.dataFim) + 1;
      const porDia = e.horasPrevistas / dias;
      for (let i = 0; i < dias; i++) {
        const d = somarDias(e.dataInicio, i);
        const idx = Math.floor(diferencaDias(base, d) / 7);
        if (idx >= 0 && idx < semanas) lista[idx].horas += porDia;
      }
    }
  }
  return lista;
}
