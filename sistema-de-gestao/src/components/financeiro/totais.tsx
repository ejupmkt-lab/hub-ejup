"use client";

import type { Entrada } from "@/lib/financeiro";
import { moeda } from "@/lib/financeiro";

const soma = (l: Entrada[], f: (e: Entrada) => number) => l.reduce((a, e) => a + f(e), 0);
const total = (l: Entrada[]) => ({ valor: soma(l, (e) => e.parcela.valor), imposto: soma(l, (e) => e.imposto), fica: soma(l, (e) => e.aposImposto) });

// O que os projetos do período somam, embaixo da lista: total, o que falta receber e o que já entrou, com o imposto e o que fica
export function TotaisDoPeriodo({ entradas, contrapartidas = [] }: { entradas: Entrada[]; contrapartidas?: { rotulo: string; valor: number }[] }) {
  const linhas: { rotulo: string; t: ReturnType<typeof total>; forte?: boolean }[] = [
    { rotulo: "Total do período", t: total(entradas), forte: true },
    { rotulo: "A receber", t: total(entradas.filter((e) => !e.parcela.recebidaEm)) },
    { rotulo: "Recebido", t: total(entradas.filter((e) => e.parcela.recebidaEm)) },
  ];
  return (
    <div className="overflow-x-auto rounded-[var(--radius-bloco)] border border-linha bg-folha shadow-[var(--shadow-cartao)]">
      <table className="num w-full min-w-[30rem] border-collapse text-[14px]" aria-label="Totais do período">
        <thead className="bg-pedra/60">
          <tr className="border-b border-linha text-[13px] font-semibold text-tinta-2">
            <th scope="col" className="px-4 py-2.5 text-left">
              Consolidado
            </th>
            <th scope="col" className="px-4 py-2.5 text-right">
              Valor
            </th>
            <th scope="col" className="px-4 py-2.5 text-right">
              Imposto
            </th>
            <th scope="col" className="px-4 py-2.5 text-right">
              Fica
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-linha">
          {linhas.map(({ rotulo, t, forte }) => (
            <tr key={rotulo} className={forte ? "bg-pedra/40 font-bold text-tinta" : "text-tinta-2"}>
              <th scope="row" className="px-4 py-2.5 text-left font-[inherit]">
                {rotulo}
              </th>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">{moeda(t.valor)}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">{moeda(t.imposto)}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">{moeda(t.fica)}</td>
            </tr>
          ))}
          {contrapartidas.map((c) => (
            <tr key={c.rotulo} className="text-tinta-2">
              <th scope="row" className="px-4 py-2.5 text-left font-[inherit]">
                {c.rotulo}
              </th>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">{moeda(c.valor)}</td>
              <td />
              <td />
            </tr>
          ))}
          {contrapartidas.length > 1 && (
            <tr className="bg-pedra/40 font-bold text-tinta">
              <th scope="row" className="px-4 py-2.5 text-left font-[inherit]">
                Contrapartida · total
              </th>
              <td className="whitespace-nowrap px-4 py-2.5 text-right">{moeda(contrapartidas.reduce((a, c) => a + c.valor, 0))}</td>
              <td />
              <td />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
