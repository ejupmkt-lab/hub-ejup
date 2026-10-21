"use client";

import Link from "next/link";
import type { Projeto } from "@/lib/dados/tipos";
import { diferencaDias, hojeIso, somarDias } from "@/lib/datas";
import { grupoDaEtapa, grupos } from "@/lib/painel";
import { avancoEtapa } from "@/lib/projeto";
import { doisDigitos, statusEtapa } from "@/lib/rotulos";
import { Botao, Cartao } from "@/components/ui";

const mesesCurtos = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const mesMaiusculo = (m: string) => m.charAt(0).toUpperCase() + m.slice(1);
const diaMes = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

// Gantt de um projeto: uma linha por etapa, a barra no período do plano de
// trabalho, preenchida conforme o andamento, e a linha vermelha de hoje.
export function CronogramaProjeto({ projeto, aoEditar }: { projeto: Projeto; aoEditar: () => void }) {
  const etapas = projeto.etapas;
  const comDatas = !!projeto.planoFechadoEm && etapas.every((e) => e.dataInicio && e.dataFim);

  if (!comDatas)
    return (
      <Cartao className="p-4 sm:p-5">
        <h2 className="text-[17px] font-bold">Etapas no tempo</h2>
        <p className="mt-1 text-sm text-tinta-2">As etapas ganham datas quando o plano de trabalho for definido.</p>
        <Botao className="mt-4 w-full sm:w-auto" onClick={aoEditar}>
          Definir o plano de trabalho
        </Botao>
      </Cartao>
    );

  const hoje = hojeIso();
  const inicio = somarDias(etapas[0].dataInicio!, -2);
  const fim = somarDias(etapas[etapas.length - 1].dataFim!, 2);
  const dias = diferencaDias(inicio, fim) + 1;
  const pos = (d: string) => (diferencaDias(inicio, d) / dias) * 100;
  const meses: string[] = [];
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) if (d === inicio || d.endsWith("-01")) meses.push(d);
  const posHoje = hoje >= inicio && hoje <= fim ? ((diferencaDias(inicio, hoje) + 0.5) / dias) * 100 : null;
  const colunas = "grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] gap-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-4";

  return (
    <Cartao className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold">Etapas no tempo</h2>
        <button onClick={aoEditar} className="text-sm font-semibold text-azul hover:underline">
          Editar plano
        </button>
      </div>

      <div className={colunas}>
        <span />
        <div className="relative h-6 border-b border-linha">
          {meses.map((m, i) => {
            // O primeiro mês só ganha rótulo se não colar no do mês seguinte
            if (i === 0 && meses[1] && pos(meses[1]) < 18) return null;
            return (
              <span key={m} className="absolute top-0 whitespace-nowrap text-[13px] font-semibold text-tinta-2" style={{ left: `${pos(m)}%` }}>
                {mesMaiusculo(mesesCurtos[Number(m.slice(5, 7)) - 1])}
              </span>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <ul>
          {etapas.map((e) => {
            const g = grupos[grupoDaEtapa(e, hoje)];
            const pct = Math.round(avancoEtapa(e) * 100);
            const esquerda = pos(e.dataInicio!);
            const largura = ((diferencaDias(e.dataInicio!, e.dataFim!) + 1) / dias) * 100;
            const href = `/${projeto.empresa}/projetos/${projeto.id}#etapa-${e.ordem}`;
            return (
              <li key={e.ordem} className={`${colunas} items-center border-b border-linha/70 py-2.5 last:border-0`}>
                <Link href={href} className="group min-w-0">
                  <span className="block break-words text-sm font-semibold leading-snug text-tinta group-hover:text-azul">
                    {doisDigitos(e.ordem)} {capitalizar(e.nome)}
                  </span>
                  <span className="num block text-[12px] text-tinta-2">
                    {diaMes(e.dataInicio!)} – {diaMes(e.dataFim!)} · {pct}%
                  </span>
                </Link>
                <div className="relative h-7 rounded-md bg-pedra">
                  <Link
                    href={href}
                    aria-label={`Etapa ${doisDigitos(e.ordem)}: ${statusEtapa[e.status].rotulo}, ${pct}%`}
                    title={`${statusEtapa[e.status].rotulo} · ${pct}%`}
                    className="absolute inset-y-1 overflow-hidden rounded-[5px] hover:brightness-110"
                    style={{
                      left: `${esquerda}%`,
                      width: `max(${largura}%, 6px)`,
                      background: grupoDaEtapa(e, hoje) === "nao_iniciada" ? g.cor : `${g.cor}55`,
                    }}
                  >
                    <span className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: g.cor }} />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        {posHoje !== null && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-[calc(8.5rem+0.75rem)] right-0 sm:left-[calc(13rem+1rem)]">
            <span className="absolute inset-y-0 w-[2px] rounded-full bg-vermelho-vivo/80" style={{ left: `${posHoje}%` }} />
          </span>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-tinta-2">
        {(["andamento", "atrasada", "devolvida", "a_enviar", "concluida", "nao_iniciada"] as const).map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: grupos[k].cor }} />
            {grupos[k].rotulo}
          </li>
        ))}
        {posHoje !== null && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-[2px] bg-vermelho-vivo" />
            Hoje
          </li>
        )}
      </ul>
    </Cartao>
  );
}
