"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { traduzirErro } from "@/lib/erros";
import { hojeIso } from "@/lib/datas";
import { somarMeses } from "@/lib/periodo";
import { ROTAS_DA_IA, custoUsd, semUso, type TokensDeUso } from "@/lib/ia/uso";
import { lerPlanilhaDoConsole, totalPorDia } from "@/lib/ia/console";
import { Botao, Campo, Cartao } from "@/components/ui";

type Linha = { em: string; rota: string; modelo: string; entrada: number; saida: number; cache_leitura: number; cache_escrita: number };
type DoConsole = { dia: string; modelo: string; tipo: string; custo_usd: number };

const usd = (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: v < 1 && v > 0 ? 4 : 2 });
const milhares = (n: number) => n.toLocaleString("pt-BR");
const dataBr = (d: string) => d.split("-").reverse().join("/");
const dia = (iso: string) => iso.slice(0, 10); // dia em UTC, como o console da Anthropic conta
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

// Uso da IA (só para quem vê o financeiro). Cada dia vale o custo real do console da Anthropic quando a planilha dele já foi
// importada; sem ela, o custo estimado pelos tokens que o Blimp registrou (preço de tabela do modelo).
export function UsoDaIA() {
  const [mes, setMes] = useState(() => hojeIso().slice(0, 7));
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [console_, setConsole] = useState<DoConsole[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    setLinhas(null);
    setErro(null);
    const inicio = `${mes}-01`;
    const proximo = `${somarMeses(mes, 1)}-01`;
    const sb = supabaseNavegador();
    const [u, c] = await Promise.all([
      sb.from("uso_ia").select("em, rota, modelo, entrada, saida, cache_leitura, cache_escrita").gte("em", `${inicio}T00:00:00Z`).lt("em", `${proximo}T00:00:00Z`).order("em", { ascending: false }).limit(5000),
      sb.from("custo_ia_console").select("dia, modelo, tipo, custo_usd").gte("dia", inicio).lt("dia", proximo).limit(5000),
    ]);
    const falha = u.error ?? c.error;
    if (falha) return setErro(traduzirErro(falha));
    setConsole(((c.data ?? []) as DoConsole[]).map((x) => ({ ...x, custo_usd: Number(x.custo_usd) })));
    setLinhas((u.data ?? []) as Linha[]);
  }, [mes]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const importar = async (f: File | undefined) => {
    if (!f) return;
    setErro(null);
    setAviso(null);
    setImportando(true);
    try {
      const itens = lerPlanilhaDoConsole(await f.text());
      if (!itens.length) throw new Error("A planilha não tem nenhum dia com custo.");
      const { error } = await supabaseNavegador()
        .from("custo_ia_console")
        .upsert(itens.map((i) => ({ dia: i.dia, modelo: i.modelo, tipo: i.tipo, custo_usd: i.custo, atualizado_em: new Date().toISOString() })), { onConflict: "dia,modelo,tipo" });
      if (error) throw error;
      const dias = [...new Set(itens.map((i) => i.dia))].sort();
      setAviso(`${dias.length} ${dias.length === 1 ? "dia importado" : "dias importados"}, de ${dataBr(dias[0])} a ${dataBr(dias[dias.length - 1])}.`);
      await carregar();
    } catch (e) {
      setErro(traduzirErro(e, "Não foi possível importar a planilha."));
    } finally {
      setImportando(false);
      if (arquivo.current) arquivo.current.value = "";
    }
  };

  const resumo = useMemo(() => {
    const ls = linhas ?? [];
    const soma = (lista: Linha[]) => {
      const t = lista.reduce<TokensDeUso>((a, l) => ({ entrada: a.entrada + l.entrada, saida: a.saida + l.saida, cacheLeitura: a.cacheLeitura + l.cache_leitura, cacheEscrita: a.cacheEscrita + l.cache_escrita }), semUso);
      return { chamadas: lista.length, tokens: t, estimado: lista.reduce((a, l) => a + custoUsd(l.modelo, tokens(l)), 0) };
    };
    const doBlimp = new Map<string, Linha[]>();
    for (const l of ls) doBlimp.set(dia(l.em), [...(doBlimp.get(dia(l.em)) ?? []), l]);
    const real = totalPorDia(console_.map((c) => ({ dia: c.dia, custo: c.custo_usd })));
    const dias = [...new Set([...doBlimp.keys(), ...real.keys()])].sort((a, b) => b.localeCompare(a)).map((d) => {
      const b = soma(doBlimp.get(d) ?? []);
      const c = real.get(d) ?? null;
      return { dia: d, ...b, console: c, gasto: c ?? b.estimado };
    });
    const porRota = new Map<string, Linha[]>();
    for (const l of ls) porRota.set(l.rota, [...(porRota.get(l.rota) ?? []), l]);
    const totalBlimp = soma(ls);
    return {
      dias,
      gasto: dias.reduce((a, d) => a + d.gasto, 0),
      console: dias.reduce((a, d) => a + (d.console ?? 0), 0),
      diasConsole: dias.filter((d) => d.console !== null).length,
      estimado: totalBlimp.estimado,
      chamadas: totalBlimp.chamadas,
      tokens: totalBlimp.tokens,
      rotas: Object.keys(ROTAS_DA_IA).map((r) => ({ rota: r, ...soma(porRota.get(r) ?? []) })).filter((r) => r.chamadas > 0),
    };
  }, [linhas, console_]);

  const cabeca = "px-4 py-2.5 text-right text-[13px] font-semibold text-tinta-2";
  const celula = "num whitespace-nowrap px-4 py-2.5 text-right";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-2">
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
        <div>
          <Botao variante="secundario" onClick={() => arquivo.current?.click()} disabled={importando}>
            {importando ? "Importando…" : "Importar planilha do console"}
          </Botao>
          <input ref={arquivo} type="file" aria-label="Planilha de custos do console" accept=".csv,text/csv" className="sr-only" onChange={(e) => void importar(e.target.files?.[0])} />
        </div>
      </div>

      {aviso && (
        <p role="status" className="rounded-[var(--radius-campo)] bg-verde-claro px-4 py-3 text-sm text-verde">
          {aviso}
        </p>
      )}
      {erro && (
        <p role="alert" className="text-sm text-vermelho">
          {erro}
        </p>
      )}
      {linhas === null && !erro && <p className="text-sm text-tinta-2">Carregando…</p>}

      {linhas !== null && (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Numero rotulo="Gasto no mês" valor={usd(resumo.gasto)} detalhe={resumo.dias.length ? `${resumo.diasConsole} ${resumo.diasConsole === 1 ? "dia" : "dias"} pelo console` : undefined} />
            <Numero rotulo="Pelo console (real)" valor={usd(resumo.console)} />
            <Numero rotulo="Estimado pelo Blimp" valor={usd(resumo.estimado)} detalhe={`${resumo.chamadas} ${resumo.chamadas === 1 ? "chamada" : "chamadas"}`} />
            <Numero rotulo="Tokens registrados" valor={`${milhares(resumo.tokens.entrada)} · ${milhares(resumo.tokens.saida)}`} detalhe="entrada · saída" />
          </dl>

          {resumo.dias.length === 0 ? (
            <p className="text-sm text-tinta-2">Nada registrado neste mês.</p>
          ) : (
            <div className="grid gap-5">
              <Cartao className="overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-[14px]" aria-label="Uso da IA por dia">
                  <thead className="bg-pedra/60">
                    <tr className="border-b border-linha">
                      <th scope="col" className="px-4 py-2.5 text-left text-[13px] font-semibold text-tinta-2">Dia (UTC)</th>
                      <th scope="col" className={cabeca}>Chamadas</th>
                      <th scope="col" className={cabeca}>Entrada</th>
                      <th scope="col" className={cabeca}>Saída</th>
                      <th scope="col" className={cabeca}>Estimado</th>
                      <th scope="col" className={cabeca}>Console</th>
                      <th scope="col" className={cabeca}>Gasto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linha">
                    {resumo.dias.map((d) => (
                      <tr key={d.dia}>
                        <th scope="row" className="num px-4 py-2.5 text-left font-semibold">{dataBr(d.dia)}</th>
                        <td className={celula}>{d.chamadas || "—"}</td>
                        <td className={celula}>{d.chamadas ? milhares(d.tokens.entrada) : "—"}</td>
                        <td className={celula}>{d.chamadas ? milhares(d.tokens.saida) : "—"}</td>
                        <td className={celula}>{d.chamadas ? usd(d.estimado) : "—"}</td>
                        <td className={celula}>{d.console === null ? "—" : usd(d.console)}</td>
                        <td className={`${celula} font-semibold`}>{usd(d.gasto)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-linha-forte bg-pedra/40 font-bold">
                      <th scope="row" className="px-4 py-2.5 text-left">Total do mês</th>
                      <td className={celula}>{resumo.chamadas}</td>
                      <td className={celula}>{milhares(resumo.tokens.entrada)}</td>
                      <td className={celula}>{milhares(resumo.tokens.saida)}</td>
                      <td className={celula}>{usd(resumo.estimado)}</td>
                      <td className={celula}>{usd(resumo.console)}</td>
                      <td className={celula}>{usd(resumo.gasto)}</td>
                    </tr>
                  </tfoot>
                </table>
              </Cartao>

              {resumo.rotas.length > 0 && (
                <Cartao className="overflow-x-auto">
                  <table className="w-full min-w-[26rem] border-collapse text-[14px]" aria-label="Uso da IA por tipo">
                    <thead className="bg-pedra/60">
                      <tr className="border-b border-linha">
                        <th scope="col" className="px-4 py-2.5 text-left text-[13px] font-semibold text-tinta-2">Tipo de uso</th>
                        <th scope="col" className={cabeca}>Chamadas</th>
                        <th scope="col" className={cabeca}>Entrada</th>
                        <th scope="col" className={cabeca}>Saída</th>
                        <th scope="col" className={cabeca}>Estimado (US$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-linha">
                      {resumo.rotas.map((r) => (
                        <tr key={r.rota}>
                          <th scope="row" className="px-4 py-2.5 text-left font-semibold">{ROTAS_DA_IA[r.rota as keyof typeof ROTAS_DA_IA]}</th>
                          <td className={celula}>{r.chamadas}</td>
                          <td className={celula}>{milhares(r.tokens.entrada)}</td>
                          <td className={celula}>{milhares(r.tokens.saida)}</td>
                          <td className={`${celula} font-semibold`}>{usd(r.estimado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Cartao>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
