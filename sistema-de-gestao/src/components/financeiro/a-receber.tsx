"use client";

import Link from "next/link";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { useFinanceiro } from "@/lib/dados/financeiro";
import { dataDeEnvio, dataFinalizacao, diaDoPagamento, moeda, proximoCorte, recebimento } from "@/lib/financeiro";
import { etapasTodasEnviadas, faseDoProjeto } from "@/lib/fase";
import { diferencaDias, formatarData, hojeIso } from "@/lib/datas";
import { nomeDoCliente } from "@/lib/campos-cliente";

// Painel (só para quem vê o financeiro): o que cai em cada dia 5 e o que dá
// para garantir até o próximo dia 20
export function AReceber({ projetos }: { projetos: Projeto[] }) {
  const fin = useFinanceiro();
  const { estado } = useEstado();
  if (!fin || !fin.carregado) return null;
  const hoje = hojeIso();
  const corte = proximoCorte(hoje);
  const pagamentoDoCorte = diaDoPagamento(corte);
  const nome = (p: Projeto) => {
    const c = estado.clientes.find((x) => x.id === p.clienteId);
    return nomeDoCliente(c);
  };

  const parcelas = projetos.flatMap((p) =>
    recebimento(p, fin.servicos[p.modeloId], fin.projetos[p.id])
      .parcelas.filter((x) => !x.recebidaEm)
      .map((x) => ({ ...x, projeto: p })),
  );
  const porDia = new Map<string, typeof parcelas>();
  for (const x of parcelas.filter((x) => x.previsao)) porDia.set(x.previsao!, [...(porDia.get(x.previsao!) ?? []), x]);
  const dias = [...porDia.keys()].sort();
  const semData = parcelas.filter((x) => !x.previsao).reduce((a, x) => a + x.valor, 0);

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

  return (
    <div className="space-y-4">
      {dias.length === 0 && !semData ? (
        <p className="text-sm text-tinta-2">Nada a receber por enquanto.</p>
      ) : (
        <ul className="divide-y divide-linha">
          {dias.map((d) => {
            const itens = porDia.get(d)!;
            return (
              <li key={d} className="py-2.5 first:pt-0">
                <p className="num flex justify-between gap-3 text-[15px] font-semibold text-tinta">
                  <span>Até {formatarData(d)}</span>
                  <span className={d < hoje ? "text-laranja" : "text-verde"}>{moeda(itens.reduce((a, x) => a + x.valor, 0))}</span>
                </p>
                <ul className="mt-0.5 space-y-0.5 text-[13px] text-tinta-2">
                  {itens.map((x) => (
                    <li key={`${x.projeto.id}-${x.chave}`} className="num flex justify-between gap-3">
                      <Link href={`/${x.projeto.empresa}/projetos/${x.projeto.id}#ficha`} className="min-w-0 truncate hover:text-azul">
                        {nome(x.projeto)} · {x.percentual}%
                      </Link>
                      <span>{moeda(x.valor)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
          {semData > 0 && (
            <li className="num flex justify-between gap-3 py-2.5 text-[13px] text-tinta-2">
              <span>Ainda sem data (depende de relatório ou finalização)</span>
              <span>{moeda(semData)}</span>
            </li>
          )}
        </ul>
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
