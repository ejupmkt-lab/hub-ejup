"use client";

import Link from "next/link";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { useFinanceiro } from "@/lib/dados/financeiro";
import { dataDeEnvio, dataFinalizacao, diaDoPagamento, entradasDeRecebimento, moeda, proximoCorte, recebimento, type Entrada } from "@/lib/financeiro";
import { etapasTodasEnviadas, faseDoProjeto } from "@/lib/fase";
import { diferencaDias, formatarData, hojeIso, mesPorExtenso } from "@/lib/datas";
import { nomeDoCliente } from "@/lib/campos-cliente";

const pct = (n: number) => `${String(n).replace(".", ",")}%`;
const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const soma = (l: Entrada[], f: (e: Entrada) => number) => l.reduce((a, e) => a + f(e), 0);

// Financeiro (só para quem vê o financeiro): o que cai em cada mês e dia 5, na ordem em que o dinheiro entra,
// com o imposto do mês, e o que dá para garantir até o próximo dia 20
export function AReceber({ projetos }: { projetos: Projeto[] }) {
  const fin = useFinanceiro();
  const { estado } = useEstado();
  if (!fin || !fin.carregado) return null;
  const hoje = hojeIso();
  const corte = proximoCorte(hoje);
  const pagamentoDoCorte = diaDoPagamento(corte);
  const nome = (p: Projeto) => nomeDoCliente(estado.clientes.find((x) => x.id === p.clienteId));

  const entradas = entradasDeRecebimento(projetos, fin.servicos, fin.projetos, fin.empresas);
  const pendentes = entradas.filter((e) => !e.parcela.recebidaEm);
  const recebidas = entradas.filter((e) => e.parcela.recebidaEm);
  const comData = pendentes.filter((e) => e.mes);
  const semData = pendentes.filter((e) => !e.mes);
  const meses = [...new Set(comData.map((e) => e.mes!))].sort();

  // O que ainda dá para garantir no pagamento do próximo dia 5
  const oportunidades = projetos.flatMap((p) => {
    if (p.status === "encerrado" || faseDoProjeto(p) === "solicitacao" || faseDoProjeto(p) === "diagnostico" || faseDoProjeto(p) === "proposta") return [];
    const r = recebimento(p, fin.servicos[p.modeloId], fin.projetos[p.id]);
    if (dataFinalizacao(p)) return [];
    const lista: { texto: string; valor: number; projeto: Projeto }[] = [];
    const tem30 = r.parcelas.find((x) => x.chave === "30");
    if (p.etapas[0] && !dataDeEnvio(p, p.etapas[0]) && tem30)
      lista.push({ projeto: p, texto: "envie o Relatório 1 no HUB", valor: tem30.valor });
    else if (etapasTodasEnviadas(p))
      lista.push({ projeto: p, texto: "falta o cliente avaliar a consultoria no HUB", valor: r.parcelas.find((x) => x.chave !== "30")?.valor ?? 0 });
    return lista;
  });

  const linha = (x: Entrada) => (
    <li key={`${x.projeto.id}-${x.parcela.chave}`} className="num flex justify-between gap-3">
      <Link href={`/${x.projeto.empresa}/projetos/${x.projeto.id}#ficha`} className="min-w-0 hover:text-azul">
        {nome(x.projeto)} · {x.parcela.percentual}%
        {x.parcela.origem === "plano" && <span className="text-tinta-2"> · estimado pelo plano</span>}
        {x.parcela.origem === "manual" && <span className="text-tinta-2"> · combinado</span>}
      </Link>
      <span>{moeda(x.parcela.valor)}</span>
    </li>
  );

  return (
    <div className="space-y-4">
      {meses.length === 0 && semData.length === 0 ? (
        <p className="text-sm text-tinta-2">Nada a receber por enquanto.</p>
      ) : (
        <ul className="space-y-4">
          {meses.map((mes) => {
            const doMes = comData.filter((e) => e.mes === mes);
            const dias = [...new Set(doMes.map((e) => e.parcela.previsao!))].sort();
            const aliquota = doMes[0]?.aliquota;
            return (
              <li key={mes} aria-label={mesPorExtenso(mes)} className="rounded-[var(--radius-campo)] border border-linha p-3">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-[15px] font-bold text-tinta">
                  <span>{maiuscula(mesPorExtenso(mes))}</span>
                  <span className="num text-verde">{moeda(soma(doMes, (e) => e.parcela.valor))}</span>
                </p>
                {aliquota !== null && aliquota !== undefined && (
                  <p className="num text-[13px] text-tinta-2">
                    Imposto de {pct(aliquota)}: {moeda(soma(doMes, (e) => e.imposto))} · fica {moeda(soma(doMes, (e) => e.aposImposto))}
                  </p>
                )}
                <ul className="mt-2 divide-y divide-linha">
                  {dias.map((d) => {
                    const itens = doMes.filter((e) => e.parcela.previsao === d);
                    return (
                      <li key={d} className="py-2 first:pt-0 last:pb-0">
                        <p className="num flex justify-between gap-3 text-[14px] font-semibold text-tinta">
                          <span>Até {formatarData(d)}</span>
                          <span className={d < hoje ? "text-laranja" : "text-tinta"}>{moeda(soma(itens, (e) => e.parcela.valor))}</span>
                        </p>
                        <ul className="mt-0.5 space-y-0.5 text-[13px] text-tinta-2">{itens.map(linha)}</ul>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
          {semData.length > 0 && (
            <li className="num flex justify-between gap-3 text-[13px] text-tinta-2">
              <span>Ainda sem data (o projeto não tem plano de trabalho)</span>
              <span>{moeda(soma(semData, (e) => e.parcela.valor))}</span>
            </li>
          )}
        </ul>
      )}
      {recebidas.length > 0 && (
        <details className="rounded-[var(--radius-campo)] border border-linha p-3 text-[13px]">
          <summary className="num cursor-pointer font-semibold text-tinta">
            Já recebido: {moeda(soma(recebidas, (e) => e.parcela.valor))}
          </summary>
          <ul className="mt-2 space-y-0.5 text-tinta-2">
            {recebidas.map((x) => (
              <li key={`${x.projeto.id}-${x.parcela.chave}`} className="num flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {nome(x.projeto)} · {x.parcela.percentual}% · em {formatarData(x.parcela.recebidaEm)}
                </span>
                <span>{moeda(x.parcela.valor)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {oportunidades.length > 0 && (
        <div className="rounded-[var(--radius-campo)] border border-laranja/30 bg-laranja-claro/70 p-3">
          <p className="text-[13px] font-semibold text-laranja">
            Até {formatarData(corte)} ({diferencaDias(hoje, corte) === 0 ? "hoje" : `faltam ${diferencaDias(hoje, corte)} dias`}) para entrar no pagamento de{" "}
            {formatarData(pagamentoDoCorte)}:
          </p>
          <ul className="mt-1 space-y-0.5 text-[13px] text-tinta">
            {oportunidades.map((o) => (
              <li key={o.projeto.id} className="num flex justify-between gap-3">
                <Link href={`/${o.projeto.empresa}/projetos/${o.projeto.id}`} className="min-w-0 hover:text-azul">
                  {nome(o.projeto)}: {o.texto}
                </Link>
                <span className="shrink-0">{moeda(o.valor)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
