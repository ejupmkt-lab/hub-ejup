"use client";

import Link from "next/link";
import type { Entrada } from "@/lib/financeiro";
import { moeda } from "@/lib/financeiro";
import { formatarData } from "@/lib/datas";
import { codigoHub, servicoDoProjeto } from "@/lib/projeto";
import { Status } from "@/components/ui";
import { SeloDaNota, pct, situacaoDaParcela } from "./balao-parcela";
import { etapaDoProjeto } from "./projetos-recebimento";

const soma = (l: Entrada[], f: (e: Entrada) => number) => l.reduce((a, e) => a + f(e), 0);
const cabecalho = "px-3 py-2.5 text-[13px] font-semibold text-tinta-2";
const direita = "text-right";

// O período como planilha: uma linha por parcela (cliente e projeto, etapa, parcela, data, situação, nota fiscal, valor,
// imposto e o que fica) e, embaixo, os totais do período, do que falta receber e do que já entrou.
export function PlanilhaDoPeriodo({ entradas, nomeDoCliente, titulo }: { entradas: Entrada[]; nomeDoCliente: (e: Entrada) => string; titulo: string }) {
  const total = (l: Entrada[]) => ({ valor: soma(l, (e) => e.parcela.valor), imposto: soma(l, (e) => e.imposto), fica: soma(l, (e) => e.aposImposto) });
  const rodape: { rotulo: string; t: ReturnType<typeof total>; forte?: boolean }[] = [
    { rotulo: "Total do período", t: total(entradas), forte: true },
    { rotulo: "A receber", t: total(entradas.filter((e) => !e.parcela.recebidaEm)) },
    { rotulo: "Recebido", t: total(entradas.filter((e) => e.parcela.recebidaEm)) },
  ];
  return (
    <div className="overflow-x-auto rounded-[var(--radius-bloco)] border border-linha bg-folha shadow-[var(--shadow-cartao)]">
      <table className="num w-full min-w-[62rem] border-collapse text-[14px]" aria-label={`Planilha de recebimentos: ${titulo}`}>
        <caption className="border-b border-linha px-3 py-2.5 text-left text-[15px] font-bold">{titulo}</caption>
        <thead className="bg-pedra/60">
          <tr className="border-b border-linha text-left">
            <th scope="col" className={cabecalho}>Cliente / projeto</th>
            <th scope="col" className={cabecalho}>Etapa atual</th>
            <th scope="col" className={cabecalho}>Parcela</th>
            <th scope="col" className={cabecalho}>Data</th>
            <th scope="col" className={cabecalho}>Situação</th>
            <th scope="col" className={`${cabecalho} ${direita}`}>Valor</th>
            <th scope="col" className={`${cabecalho} ${direita}`}>Alíquota</th>
            <th scope="col" className={`${cabecalho} ${direita}`}>Imposto (R$)</th>
            <th scope="col" className={`${cabecalho} ${direita}`}>Fica</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-linha">
          {entradas.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-4 text-tinta-2">
                Nenhuma parcela neste período.
              </td>
            </tr>
          )}
          {entradas.map((e) => {
            const p = e.projeto;
            const sit = situacaoDaParcela(e);
            const dia = e.parcela.recebidaEm ?? e.parcela.previsao;
            return (
              <tr key={`${p.id}-${e.parcela.chave}`} className="align-top hover:bg-pedra/40">
                <td className="px-3 py-2.5">
                  <Link href={`/${p.empresa}/projetos/${p.id}#ficha`} className="font-semibold text-tinta hover:text-azul">
                    {nomeDoCliente(e)}
                  </Link>
                  <p className="text-[12px] text-tinta-2">
                    {servicoDoProjeto(p)} · HUB {codigoHub(p) || "sem número"}
                  </p>
                </td>
                <td className="px-3 py-2.5">{etapaDoProjeto(p).texto}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {e.parcela.ordem}ª · {pct(e.parcela.percentual)}
                </td>
                <td className={`whitespace-nowrap px-3 py-2.5 ${e.parcela.recebidaEm ? "font-semibold text-verde" : ""}`}>{dia ? formatarData(dia) : "Sem data"}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <Status tom={sit.tom}>{sit.texto}</Status>
                    <SeloDaNota entrada={e} />
                  </div>
                </td>
                <td className={`whitespace-nowrap px-3 py-2.5 font-semibold ${direita}`}>{moeda(e.parcela.valor)}</td>
                <td className={`whitespace-nowrap px-3 py-2.5 ${direita}`}>{e.aliquota === null ? "—" : pct(e.aliquota)}</td>
                <td className={`whitespace-nowrap px-3 py-2.5 ${direita}`}>{e.aliquota === null ? "—" : moeda(e.imposto)}</td>
                <td className={`whitespace-nowrap px-3 py-2.5 font-semibold ${direita}`}>{e.aliquota === null ? moeda(e.parcela.valor) : moeda(e.aposImposto)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {rodape.map(({ rotulo, t, forte }) => (
            <tr key={rotulo} className={`border-t ${forte ? "border-linha-forte bg-pedra/60 font-bold text-tinta" : "border-linha text-tinta-2"}`}>
              <th scope="row" colSpan={5} className="px-3 py-2 text-left font-[inherit]">
                {rotulo}
              </th>
              <td className={`whitespace-nowrap px-3 py-2 ${direita}`}>{moeda(t.valor)}</td>
              <td className="px-3 py-2" />
              <td className={`whitespace-nowrap px-3 py-2 ${direita}`}>{moeda(t.imposto)}</td>
              <td className={`whitespace-nowrap px-3 py-2 ${direita}`}>{moeda(t.fica)}</td>
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  );
}
