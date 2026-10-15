"use client";

import Link from "next/link";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { dataCurta, hojeIso } from "@/lib/datas";
import { ativos, cargaSemanal, contagemPorGrupo, grupos, ordemGrupos, segunda } from "@/lib/painel";
import { progressoAtividades, etapaAtual } from "@/lib/projeto";
import { doisDigitos } from "@/lib/rotulos";
import { useDica } from "./dica";
import { Legenda } from "./legenda";

// Etapas de todos os projetos em andamento, por situação: uma barra 100%
export function GraficoSituacao({ projetos }: { projetos: Projeto[] }) {
  const { props, elemento } = useDica();
  const c = contagemPorGrupo(projetos);
  const total = ordemGrupos.reduce((a, g) => a + c[g], 0);
  if (!total) return <p className="text-sm text-tinta-2">Sem etapas em andamento.</p>;
  return (
    <div>
      <p className="num mb-3 text-[2rem] font-semibold leading-none text-tinta">
        {c.concluida} <span className="text-base font-normal text-tinta-2">de {total} etapas enviadas</span>
      </p>
      <div className="flex h-6 gap-[2px]" role="img" aria-label={ordemGrupos.map((g) => `${grupos[g].rotulo}: ${c[g]}`).join("; ")}>
        {ordemGrupos
          .filter((g) => c[g] > 0)
          .map((g, i, arr) => (
            <span
              key={g}
              tabIndex={0}
              {...props(
                <>
                  <span className="block font-medium">{grupos[g].rotulo}</span>
                  <span className="num block text-folha/80">
                    {c[g]} {c[g] === 1 ? "etapa" : "etapas"}, {Math.round((c[g] / total) * 100)}%
                  </span>
                </>,
              )}
              className={`block h-full ${i === 0 ? "rounded-l-[4px]" : ""} ${i === arr.length - 1 ? "rounded-r-[4px]" : ""}`}
              style={{ flexGrow: c[g], flexBasis: 0, background: grupos[g].cor }}
            />
          ))}
      </div>
      <div className="mt-4">
        <Legenda contagem={c} />
      </div>
      {elemento}
    </div>
  );
}

// Horas previstas por semana, somando todos os projetos
export function GraficoCarga({ projetos }: { projetos: Projeto[] }) {
  const { props, elemento } = useDica();
  const dados = cargaSemanal(projetos, -2, 12);
  const atual = segunda(hojeIso());
  const maximo = Math.max(...dados.map((d) => d.horas), 1);
  const passo = maximo > 120 ? 50 : maximo > 60 ? 25 : maximo > 24 ? 10 : 5;
  const teto = Math.ceil(maximo / passo) * passo;
  const marcas = Array.from({ length: teto / passo + 1 }, (_, i) => i * passo);
  const desta = dados.find((d) => d.semana === atual)?.horas ?? 0;

  return (
    <div>
      <p className="num mb-3 text-[2rem] font-semibold leading-none text-tinta">
        {Math.round(desta)} h <span className="text-base font-normal text-tinta-2">previstas nesta semana</span>
      </p>
      <div className="mt-6 grid grid-cols-[2rem_1fr] gap-2">
        <div className="relative h-40">
          {marcas.map((m) => (
            <span key={m} className="num absolute right-0 -translate-y-1/2 text-[11px] text-tinta-2" style={{ bottom: `${(m / teto) * 100}%` }}>
              {m}
            </span>
          ))}
        </div>
        <div>
          <div className="relative h-40">
            {marcas.map((m) => (
              <span key={m} aria-hidden className="absolute inset-x-0 h-px bg-linha" style={{ bottom: `${(m / teto) * 100}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end justify-around">
              {dados.map((d) => (
                <span
                  key={d.semana}
                  tabIndex={0}
                  {...props(
                    <>
                      <span className="block font-medium">Semana de {dataCurta(d.semana)}</span>
                      <span className="num block text-folha/80">{Math.round(d.horas)} h previstas</span>
                    </>,
                  )}
                  className="relative flex h-full w-full max-w-[2.5rem] items-end justify-center"
                >
                  <span
                    className={`block w-full max-w-6 rounded-t-[4px] ${d.semana === atual ? "bg-garrafa" : d.semana < atual ? "bg-linha-forte" : "bg-[#13805a]"}`}
                    style={{ height: `${(d.horas / teto) * 100}%`, minHeight: d.horas > 0 ? 2 : 0 }}
                  />
                </span>
              ))}
            </div>
          </div>
          <div className="mt-1.5 flex justify-around">
            {dados.map((d, i) => (
              <span key={d.semana} className={`num w-full max-w-[2.5rem] text-center text-[11px] ${d.semana === atual ? "font-medium text-tinta" : "text-tinta-2"}`}>
                {d.semana === atual ? "Esta" : i % 2 === 0 ? dataCurta(d.semana) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>Horas previstas por semana</caption>
        <tbody>
          {dados.map((d) => (
            <tr key={d.semana}>
              <th>Semana de {dataCurta(d.semana)}</th>
              <td>{Math.round(d.horas)} h</td>
            </tr>
          ))}
        </tbody>
      </table>
      {elemento}
    </div>
  );
}

// Checklist da etapa atual de cada projeto
export function GraficoChecklist({ projetos }: { projetos: Projeto[] }) {
  const { estado } = useEstado();
  const lista = ativos(projetos)
    .map((p) => ({ p, et: etapaAtual(p) }))
    .filter((x): x is { p: Projeto; et: NonNullable<ReturnType<typeof etapaAtual>> } => !!x.et);
  if (!lista.length) return <p className="text-sm text-tinta-2">Nenhuma etapa em curso.</p>;
  return (
    <ul className="space-y-4">
      {lista.map(({ p, et }) => {
        const c = estado.clientes.find((x) => x.id === p.clienteId);
        const { feitas, total } = progressoAtividades(et);
        const pct = total ? Math.round((feitas / total) * 100) : 0;
        return (
          <li key={p.id}>
            <Link href={`/${p.empresa}/projetos/${p.id}/etapas/${et.ordem}#checklist`} className="group block">
              <span className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-tinta group-hover:text-garrafa group-hover:underline">
                  {c?.nomeFantasia || c?.razaoSocial}
                  <span className="text-tinta-2">, etapa {doisDigitos(et.ordem)}</span>
                </span>
                <span className="num shrink-0 font-medium text-tinta">
                  {feitas}/{total}
                </span>
              </span>
              <span className="block h-2 overflow-hidden rounded-full bg-garrafa-claro" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <span className="block h-full rounded-full bg-[#13805a]" style={{ width: `${pct}%` }} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
