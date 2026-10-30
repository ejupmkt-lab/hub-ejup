"use client";

import type { Projeto } from "@/lib/dados/tipos";
import { useFinanceiro } from "@/lib/dados/financeiro";
import { FONTES_DE_CUSTEIO, aliquotaDoProjeto, entradasDeRecebimento, moeda, notaEmitida, recebimento } from "@/lib/financeiro";
import { aliquotaNoMes, imposto } from "@/lib/imposto";
import { hojeIso } from "@/lib/datas";
import { Campo } from "@/components/ui";
import { BalaoDeParcela } from "./balao-parcela";

// Aba "Financeiro" do projeto (só para quem vê o financeiro): o valor, a FUNCERN, o imposto (percentual da faixa ou definido aqui), a
// contrapartida (desconto sobre o total a receber), o que o consultor recebe (já sem nada disso) e cada parcela com a data, o recebimento
// e a nota fiscal.
export function FinanceiroDoProjeto({ projeto: p, nomeCliente }: { projeto: Projeto; nomeCliente: string }) {
  const fin = useFinanceiro();
  if (!fin || !fin.carregado) return <p className="text-sm text-tinta-2">Carregando o financeiro…</p>;
  const r = recebimento(p, fin.servicos[p.modeloId], fin.projetos[p.id]);
  const entradas = entradasDeRecebimento([p], fin.servicos, fin.projetos, fin.empresas).sort((a, b) => a.parcela.ordem - b.parcela.ordem);
  const emitidas = entradas.filter((e) => notaEmitida(e.nota)).length;
  const recebido = entradas.filter((e) => e.parcela.recebidaEm).reduce((a, e) => a + e.parcela.valor, 0);
  const total = entradas.reduce((a, e) => a + e.parcela.valor, 0);
  // Imposto: o percentual definido aqui ou o da faixa do faturamento da empresa no mês de cada pagamento (sem data, o do mês atual)
  const fixa = aliquotaDoProjeto(fin.projetos[p.id]);
  const aliquotaDoMes = aliquotaNoMes(fin.empresas[p.empresa], hojeIso().slice(0, 7));
  const impostoTotal = entradas.reduce((a, e) => a + imposto(e.parcela.valor, e.aliquota ?? aliquotaDoMes), 0);
  const aliquotasUsadas = [...new Set(entradas.map((e) => e.aliquota ?? aliquotaDoMes))];
  const aReceber = r.liquido - impostoTotal;
  const pct = (n: number) => `${String(n).replace(".", ",")}%`;

  return (
    <section className="space-y-5" aria-label="Financeiro do projeto">
      <p className="text-[13px] text-tinta-2">Só quem tem acesso ao financeiro vê esta aba. A visão geral, por período, está em Financeiro, no menu.</p>
      <dl className="num grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
        <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-3.5 shadow-[var(--shadow-cartao)]">
          <Campo rotulo="Imposto (%)">
            <input
              key={fixa ?? "auto"}
              type="number"
              min={0}
              max={100}
              step={0.01}
              className="campo num"
              defaultValue={fixa ?? ""}
              placeholder={String(aliquotaDoMes).replace(".", ",")}
              onBlur={(ev) => {
                const v = ev.target.value === "" ? null : Number(ev.target.value.replace(",", "."));
                if (v !== null && (!Number.isFinite(v) || v < 0 || v > 100)) return;
                if (v === fixa) return;
                void fin.definirAliquota(p, v).catch((e) => alert(e instanceof Error ? e.message : "Não foi possível salvar."));
              }}
            />
          </Campo>
          <p className="mt-1 text-[12px] text-tinta-2">
            {moeda(impostoTotal)} · {fixa !== null ? "percentual definido por você" : aliquotasUsadas.length > 1 ? "pela faixa do faturamento, varia por mês" : `${pct(aliquotasUsadas[0])} pela faixa do faturamento`}
          </p>
        </div>
        <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-3.5 shadow-[var(--shadow-cartao)]">
          <Campo rotulo="Contrapartida (R$)">
            <input
              key={r.contrapartida}
              type="number"
              min={0}
              step={0.01}
              className="campo num"
              defaultValue={r.contrapartida || ""}
              placeholder="0,00"
              onBlur={(ev) => {
                const v = ev.target.value === "" ? 0 : Number(ev.target.value.replace(",", "."));
                if (!Number.isFinite(v) || v < 0 || v === r.contrapartida) return;
                void fin.definirContrapartida(p, v).catch((e) => alert(e instanceof Error ? e.message : "Não foi possível salvar."));
              }}
            />
          </Campo>
          <p className="mt-1 text-[12px] text-tinta-2">Desconto sobre o total a receber.</p>
          <label className="mt-2 block text-[12px] font-semibold text-tinta-2">
            Fonte de custeio
            <select
              className="campo mt-1 !text-sm"
              value={fin.projetos[p.id]?.fonteContrapartida ?? ""}
              onChange={(ev) => void fin.definirFonteDaContrapartida(p, ev.target.value || null).catch((e) => alert(e instanceof Error ? e.message : "Não foi possível salvar."))}
            >
              <option value="">Não definida</option>
              {FONTES_DE_CUSTEIO.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.rotulo}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-1 text-[12px] text-tinta-2">De quem saiu o valor da contrapartida: é para lá que ele volta.</p>
        </div>
        <div className="rounded-[var(--radius-bloco)] border border-verde/25 bg-verde-claro p-3.5">
          <dt className="text-[12px] text-tinta-2">Você recebe do SEBRAE</dt>
          <dd className="text-[19px] font-bold text-verde">{moeda(aReceber)}</dd>
        </div>
        <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-3.5 shadow-[var(--shadow-cartao)]">
          <dt className="text-[12px] text-tinta-2">Recebido até agora</dt>
          <dd className="text-[19px] font-bold text-verde">{moeda(recebido)}</dd>
          <dd className="text-[12px] text-tinta-2">de {moeda(total)}, antes do imposto</dd>
        </div>
      </dl>

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
