"use client";

import type { Projeto } from "@/lib/dados/tipos";
import { useFinanceiro } from "@/lib/dados/financeiro";
import { entradasDeRecebimento, moeda, recebimento } from "@/lib/financeiro";
import { BalaoDeParcela } from "./balao-parcela";

// Valor do projeto e as parcelas do recebimento (só para quem vê o financeiro)
export function ValoresProjeto({ projeto: p }: { projeto: Projeto }) {
  const fin = useFinanceiro();
  if (!fin || !fin.carregado) return null;
  const entradas = entradasDeRecebimento([p], fin.servicos, fin.projetos, fin.empresas);
  const r = recebimento(p, fin.servicos[p.modeloId], fin.projetos[p.id]);

  return (
    <section className="mt-6 border-t border-linha pt-5" aria-label="Valores e recebimento">
      <h3 className="text-lg font-semibold">Valores e recebimento</h3>
      <p className="text-[13px] text-tinta-2">Só quem tem acesso ao financeiro vê esta parte. A visão geral, por mês, está em Financeiro.</p>
      <dl className="num mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-campo)] bg-pedra/70 p-3">
          <dt className="text-[12px] text-tinta-2">Valor do projeto</dt>
          <dd className="font-semibold">{moeda(r.bruto)}</dd>
          <dd className="text-[12px] text-tinta-2">
            {r.horas} h × {moeda(r.valorHora)}
          </dd>
        </div>
        <div className="rounded-[var(--radius-campo)] bg-pedra/70 p-3">
          <dt className="text-[12px] text-tinta-2">FUNCERN ({r.percFuncern}%)</dt>
          <dd className="font-semibold">{moeda(r.funcern)}</dd>
        </div>
        <div className="rounded-[var(--radius-campo)] bg-verde-claro p-3">
          <dt className="text-[12px] text-tinta-2">Você recebe</dt>
          <dd className="font-semibold text-verde">{moeda(r.liquido)}</dd>
        </div>
      </dl>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {entradas.map((e) => (
          <BalaoDeParcela key={e.parcela.chave} fin={fin} entrada={e} nome="Este projeto" />
        ))}
      </ul>
    </section>
  );
}
