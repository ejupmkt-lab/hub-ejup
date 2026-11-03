"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { traduzirErro } from "@/lib/erros";
import { hojeIso } from "@/lib/datas";
import { somarMeses } from "@/lib/periodo";
import { ROTAS_DA_IA, custoUsd, semUso, type TokensDeUso } from "@/lib/ia/uso";
import { Campo, Cartao } from "@/components/ui";

type Linha = { em: string; rota: string; modelo: string; entrada: number; saida: number; cache_leitura: number; cache_escrita: number };

const usd = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: v < 1 ? 4 : 2 });
const milhares = (n: number) => n.toLocaleString("pt-BR");
const diaLocal = (iso: string) => new Date(iso).toLocaleDateString("sv-SE"); // AAAA-MM-DD no fuso de quem olha
const tokens = (l: Linha): TokensDeUso => ({ entrada: l.entrada, saida: l.saida, cacheLeitura: l.cache_leitura, cacheEscrita: l.cache_escrita });

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-3.5 shadow-[var(--shadow-cartao)]">
      <dt className="text-[12px] text-tinta-2">{rotulo}</dt>
      <dd className="num text-[19px] font-bold leading-tight">{valor}</dd>
      {detalhe && <dd className="text-[12px] text-tinta-2">{detalhe}</dd>}
    </div>
  );
}

// Uso da IA integrada (só para quem vê o financeiro): tokens de cada chamada e o custo estimado, pelo preço de tabela do modelo.
export function UsoDaIA() {
  const [mes, setMes] = useState(() => hojeIso().slice(0, 7));
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLinhas(null);
    setErro(null);
    const inicio = new Date(`${mes}-01T00:00:00`);
    const fim = new Date(`${somarMeses(mes, 1)}-01T00:00:00`);
    const { data, error } = await supabaseNavegador()
      .from("uso_ia")
      .select("em, rota, modelo, entrada, saida, cache_leitura, cache_escrita")
      .gte("em", inicio.toISOString())
      .lt("em", fim.toISOString())
      .order("em", { ascending: false })
      .limit(5000);
    if (error) return setErro(traduzirErro(error));
    setLinhas((data ?? []) as Linha[]);
  }, [mes]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const resumo = useMemo(() => {
    const ls = linhas ?? [];
    const soma = (lista: Linha[]) => {
      const t = lista.reduce<TokensDeUso>((a, l) => ({ entrada: a.entrada + l.entrada, saida: a.saida + l.saida, cacheLeitura: a.cacheLeitura + l.cache_leitura, cacheEscrita: a.cacheEscrita + l.cache_escrita }), semUso);
      return { chamadas: lista.length, tokens: t, custo: lista.reduce((a, l) => a + custoUsd(l.modelo, tokens(l)), 0) };
    };
    const hoje = hojeIso();
    const porDia = new Map<string, Linha[]>();
    for (const l of ls) porDia.set(diaLocal(l.em), [...(porDia.get(diaLocal(l.em)) ?? []), l]);
    const porRota = new Map<string, Linha[]>();
    for (const l of ls) porRota.set(l.rota, [...(porRota.get(l.rota) ?? []), l]);
    return {
      total: soma(ls),
      hoje: soma(porDia.get(hoje) ?? []),
      dias: [...porDia.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([dia, l]) => ({ dia, ...soma(l) })),
      rotas: Object.keys(ROTAS_DA_IA).map((r) => ({ rota: r, ...soma(porRota.get(r) ?? []) })).filter((r) => r.chamadas > 0),
    };
  }, [linhas]);

  const cabeca = "px-4 py-2.5 text-right text-[13px] font-semibold text-tinta-2";
  const celula = "num whitespace-nowrap px-4 py-2.5 text-right";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-2">
        <button type="button" aria-label="Mês anterior" onClick={() => setMes(somarMeses(mes, -1))} className="min-h-11 rounded-[var(--radius-campo)] border border-linha-forte bg-folha px-3.5 text-lg font-semibold hover:bg-pedra">
          ‹
        </button>
        <Campo rotulo="Mês">
          <input type="month" className="campo num" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} />
        </Campo>
        <button type="button" aria-label="Próximo mês" onClick={() => setMes(somarMeses(mes, 1))} className="min-h-11 rounded-[var(--radius-campo)] border border-linha-forte bg-folha px-3.5 text-lg font-semibold hover:bg-pedra">
          ›
        </button>
      </div>

      {erro && (
        <p role="alert" className="text-sm text-vermelho">
          {erro}
        </p>
      )}
      {linhas === null && !erro && <p className="text-sm text-tinta-2">Carregando…</p>}

      {linhas !== null && (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Numero rotulo="Custo estimado no mês" valor={usd(resumo.total.custo)} detalhe={`${resumo.total.chamadas} ${resumo.total.chamadas === 1 ? "chamada" : "chamadas"}`} />
            <Numero rotulo="Custo estimado hoje" valor={usd(resumo.hoje.custo)} detalhe={`${resumo.hoje.chamadas} ${resumo.hoje.chamadas === 1 ? "chamada" : "chamadas"}`} />
            <Numero rotulo="Tokens de entrada" valor={milhares(resumo.total.tokens.entrada)} />
            <Numero rotulo="Tokens de saída" valor={milhares(resumo.total.tokens.saida)} />
          </dl>

          {resumo.total.chamadas === 0 ? (
            <p className="text-sm text-tinta-2">Nenhuma chamada da IA registrada neste mês.</p>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <Cartao className="overflow-x-auto">
                <table className="w-full min-w-[26rem] border-collapse text-[14px]" aria-label="Uso da IA por tipo">
                  <thead className="bg-pedra/60">
                    <tr className="border-b border-linha">
                      <th scope="col" className="px-4 py-2.5 text-left text-[13px] font-semibold text-tinta-2">Tipo de uso</th>
                      <th scope="col" className={cabeca}>Chamadas</th>
                      <th scope="col" className={cabeca}>Entrada</th>
                      <th scope="col" className={cabeca}>Saída</th>
                      <th scope="col" className={cabeca}>Custo (US$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linha">
                    {resumo.rotas.map((r) => (
                      <tr key={r.rota}>
                        <th scope="row" className="px-4 py-2.5 text-left font-semibold">{ROTAS_DA_IA[r.rota as keyof typeof ROTAS_DA_IA]}</th>
                        <td className={celula}>{r.chamadas}</td>
                        <td className={celula}>{milhares(r.tokens.entrada)}</td>
                        <td className={celula}>{milhares(r.tokens.saida)}</td>
                        <td className={`${celula} font-semibold`}>{usd(r.custo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Cartao>

              <Cartao className="overflow-x-auto">
                <table className="w-full min-w-[26rem] border-collapse text-[14px]" aria-label="Uso da IA por dia">
                  <thead className="bg-pedra/60">
                    <tr className="border-b border-linha">
                      <th scope="col" className="px-4 py-2.5 text-left text-[13px] font-semibold text-tinta-2">Dia</th>
                      <th scope="col" className={cabeca}>Chamadas</th>
                      <th scope="col" className={cabeca}>Entrada</th>
                      <th scope="col" className={cabeca}>Saída</th>
                      <th scope="col" className={cabeca}>Custo (US$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linha">
                    {resumo.dias.map((d) => (
                      <tr key={d.dia}>
                        <th scope="row" className="num px-4 py-2.5 text-left font-semibold">{d.dia.split("-").reverse().join("/")}</th>
                        <td className={celula}>{d.chamadas}</td>
                        <td className={celula}>{milhares(d.tokens.entrada)}</td>
                        <td className={celula}>{milhares(d.tokens.saida)}</td>
                        <td className={`${celula} font-semibold`}>{usd(d.custo)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-linha-forte bg-pedra/40 font-bold">
                      <th scope="row" className="px-4 py-2.5 text-left">Total do mês</th>
                      <td className={celula}>{resumo.total.chamadas}</td>
                      <td className={celula}>{milhares(resumo.total.tokens.entrada)}</td>
                      <td className={celula}>{milhares(resumo.total.tokens.saida)}</td>
                      <td className={celula}>{usd(resumo.total.custo)}</td>
                    </tr>
                  </tfoot>
                </table>
              </Cartao>
            </div>
          )}
        </>
      )}
    </div>
  );
}
