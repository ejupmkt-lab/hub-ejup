"use client";

import type { Projeto } from "@/lib/dados/tipos";
import { useFinanceiro } from "@/lib/dados/financeiro";
import { entradasDeRecebimento, moeda, notaEmitida, recebimento } from "@/lib/financeiro";
import { Cartao, Campo } from "@/components/ui";
import { BalaoDeParcela } from "./balao-parcela";

// Aba "Financeiro" do projeto (só para quem vê o financeiro): o valor, o que o consultor recebe, a contrapartida do
// cliente (quando houver) e cada parcela com a data, o recebimento e a nota fiscal.
export function FinanceiroDoProjeto({ projeto: p, nomeCliente }: { projeto: Projeto; nomeCliente: string }) {
  const fin = useFinanceiro();
  if (!fin || !fin.carregado) return <p className="text-sm text-tinta-2">Carregando o financeiro…</p>;
  const r = recebimento(p, fin.servicos[p.modeloId], fin.projetos[p.id]);
  const entradas = entradasDeRecebimento([p], fin.servicos, fin.projetos, fin.empresas).sort((a, b) => a.parcela.ordem - b.parcela.ordem);
  const contrapartida = fin.projetos[p.id]?.valores?.contrapartida ?? 0;
  const emitidas = entradas.filter((e) => notaEmitida(e.nota)).length;
  const recebido = entradas.filter((e) => e.parcela.recebidaEm).reduce((a, e) => a + e.parcela.valor, 0);
  const total = entradas.reduce((a, e) => a + e.parcela.valor, 0);

  return (
    <section className="space-y-5" aria-label="Financeiro do projeto">
      <p className="text-[13px] text-tinta-2">Só quem tem acesso ao financeiro vê esta aba. A visão geral, por período, está em Financeiro, no menu.</p>
      <dl className="num grid gap-3 sm:grid-cols-4">
        <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-3.5 shadow-[var(--shadow-cartao)]">
          <dt className="text-[12px] text-tinta-2">Valor do projeto</dt>
          <dd className="text-[19px] font-bold">{moeda(r.bruto)}</dd>
          <dd className="text-[12px] text-tinta-2">
            {r.horas} h × {moeda(r.valorHora)}
          </dd>
        </div>
        <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-3.5 shadow-[var(--shadow-cartao)]">
          <dt className="text-[12px] text-tinta-2">FUNCERN ({r.percFuncern}%)</dt>
          <dd className="text-[19px] font-bold">{moeda(r.funcern)}</dd>
        </div>
        <div className="rounded-[var(--radius-bloco)] border border-verde/25 bg-verde-claro p-3.5">
          <dt className="text-[12px] text-tinta-2">Você recebe do SEBRAE</dt>
          <dd className="text-[19px] font-bold text-verde">{moeda(r.liquido)}</dd>
        </div>
        <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-3.5 shadow-[var(--shadow-cartao)]">
          <dt className="text-[12px] text-tinta-2">Recebido até agora</dt>
          <dd className="text-[19px] font-bold text-verde">{moeda(recebido)}</dd>
          <dd className="text-[12px] text-tinta-2">de {moeda(total)}</dd>
        </div>
      </dl>

      <Cartao className="p-4 sm:p-5">
        <h3 className="text-[16px] font-bold">Contrapartida do cliente</h3>
        <p className="mt-0.5 text-[13px] text-tinta-2">
          Quando o cliente paga uma parte direto, informe o valor. Ele vira uma terceira entrada, com data, recebimento e nota fiscal. Deixe vazio se não houver.
        </p>
        <div className="mt-3 max-w-xs">
          <Campo rotulo="Valor da contrapartida (R$)">
            <input
              key={contrapartida}
              type="number"
              min={0}
              step={0.01}
              className="campo num"
              defaultValue={contrapartida || ""}
              onBlur={(ev) => {
                const v = ev.target.value === "" ? 0 : Number(ev.target.value.replace(",", "."));
                if (!Number.isFinite(v) || v < 0 || v === contrapartida) return;
                void fin.ajustarParcela(p, "contrapartida", { valor: v > 0 ? v : null, ...(v > 0 ? {} : { previsao: null, recebidaEm: null }) }).catch((e) => alert(e instanceof Error ? e.message : "Não foi possível salvar."));
              }}
            />
          </Campo>
        </div>
      </Cartao>

      <section aria-label="Parcelas e notas fiscais" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className="text-[16px] font-bold">Parcelas e notas fiscais</h3>
          <p className="num text-[13px] text-tinta-2">
            Notas emitidas: <strong className="text-tinta">{emitidas}</strong> de {entradas.length}
          </p>
        </div>
        <ul className="grid gap-3 lg:grid-cols-2">
          {entradas.map((e) => (
            <BalaoDeParcela key={e.parcela.chave} fin={fin} entrada={e} nome={nomeCliente} />
          ))}
        </ul>
      </section>
    </section>
  );
}
