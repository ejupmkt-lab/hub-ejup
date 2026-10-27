"use client";

import type { Projeto } from "@/lib/dados/tipos";
import { useFinanceiro } from "@/lib/dados/financeiro";
import { moeda, recebimento } from "@/lib/financeiro";
import { aliquotaNoMes, imposto } from "@/lib/imposto";
import { formatarData, hojeIso } from "@/lib/datas";
import { Chip } from "@/components/ui";

// Valor do projeto e as parcelas do recebimento (só para quem vê o financeiro)
export function ValoresProjeto({ projeto: p }: { projeto: Projeto }) {
  const fin = useFinanceiro();
  if (!fin || !fin.carregado) return null;
  const fp = fin.projetos[p.id];
  const r = recebimento(p, fin.servicos[p.modeloId], fp);
  const hoje = hojeIso();

  const salvar = (mudanca: { recebidos?: Record<string, string>; previsoes?: Record<string, string> }) =>
    void fin
      .salvarProjeto({
        projetoId: p.id,
        empresa: p.empresa,
        valorHora: fp?.valorHora ?? null,
        percFuncern: fp?.percFuncern ?? null,
        recebidos: fp?.recebidos ?? {},
        previsoes: fp?.previsoes ?? {},
        ...mudanca,
      })
      .catch((e) => alert(e instanceof Error ? e.message : "Não foi possível salvar."));
  const marcar = (chave: string, recebido: boolean) => {
    const recebidos = { ...(fp?.recebidos ?? {}) };
    if (recebido) recebidos[chave] = hoje;
    else delete recebidos[chave];
    salvar({ recebidos });
  };
  // Data combinada com o SEBRAE; vazia, volta para a estimada pelo plano
  const combinar = (chave: string, data: string) => {
    const previsoes = { ...(fp?.previsoes ?? {}) };
    if (data) previsoes[chave] = data;
    else delete previsoes[chave];
    salvar({ previsoes });
  };
  const config = fin.empresas[p.empresa];

  return (
    <section className="mt-6 border-t border-linha pt-5" aria-label="Valores e recebimento">
      <h3 className="text-lg font-semibold">Valores e recebimento</h3>
      <p className="text-[13px] text-tinta-2">Só quem tem acesso ao financeiro vê esta parte.</p>
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
      <ul className="mt-3 divide-y divide-linha rounded-[var(--radius-campo)] border border-linha">
        {r.parcelas.map((x, i) => {
          const aliquota = x.previsao ? aliquotaNoMes(config, x.previsao.slice(0, 7)) : null;
          const imp = aliquota === null ? 0 : imposto(x.valor, aliquota);
          return (
            <li key={x.chave} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-[12px] font-medium uppercase tracking-wide text-tinta-2">{i + 1}º recebimento</span>
                <span className="num block text-[15px] font-semibold text-tinta">
                  {x.percentual}% · {moeda(x.valor)}
                </span>
                <span className="block text-[13px] text-tinta-2">
                  {x.condicao}
                  {x.previsao && ` · ${x.origem === "plano" ? "previsão (pelo plano)" : x.origem === "manual" ? "combinado" : "pagamento"} até ${formatarData(x.previsao)}`}
                </span>
                {aliquota !== null && (
                  <span className="num block text-[13px] text-tinta-2">
                    Imposto {String(aliquota).replace(".", ",")}% ({moeda(imp)}) · fica {moeda(x.valor - imp)}
                  </span>
                )}
              </span>
              <span className="flex flex-wrap items-center gap-3">
                {x.recebidaEm ? (
                  <Chip tom="ok">Recebido</Chip>
                ) : x.previsao && x.previsao < hoje ? (
                  <Chip tom="atencao">Atrasado</Chip>
                ) : null}
                {!x.recebidaEm && (
                  <label className="flex items-center gap-1.5 text-[13px] text-tinta-2">
                    Data combinada
                    <input
                      type="date"
                      aria-label={`Data combinada do recebimento de ${x.percentual}%`}
                      className="campo num text-[13px]"
                      style={{ width: "auto", paddingBlock: 4 }}
                      defaultValue={fp?.previsoes?.[x.chave] ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (fp?.previsoes?.[x.chave] ?? "")) combinar(x.chave, e.target.value);
                      }}
                    />
                  </label>
                )}
                <label className="flex items-center gap-1.5 text-[13px] text-tinta">
                  <input type="checkbox" className="h-4 w-4 accent-azul" checked={!!x.recebidaEm} onChange={(e) => marcar(x.chave, e.target.checked)} />
                  Recebi
                </label>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
