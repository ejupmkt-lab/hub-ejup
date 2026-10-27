"use client";

import Link from "next/link";
import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { useFinanceiro, type Financeiro } from "@/lib/dados/financeiro";
import { dataDeEnvio, dataFinalizacao, diaDoPagamento, entradasDeRecebimento, moeda, proximoCorte, recebimento, type Entrada } from "@/lib/financeiro";
import { etapasTodasEnviadas, faseDoProjeto } from "@/lib/fase";
import { diferencaDias, formatarData, hojeIso, mesPorExtenso } from "@/lib/datas";
import { nomeDoCliente } from "@/lib/campos-cliente";
import { LinhaDeParcela } from "./parcela-linha";

const pct = (n: number) => `${String(n).replace(".", ",")}%`;
const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const soma = (l: Entrada[], f: (e: Entrada) => number) => l.reduce((a, e) => a + f(e), 0);
const valorDe = (e: Entrada) => e.parcela.valor;

type Visao = "mes" | "projeto" | "recebidos";
const visoes: { chave: Visao; rotulo: string }[] = [
  { chave: "mes", rotulo: "Por mês" },
  { chave: "projeto", rotulo: "Por projeto" },
  { chave: "recebidos", rotulo: "Recebidos" },
];

function Numero({ rotulo, valor, detalhe, tom = "" }: { rotulo: string; valor: string; detalhe?: string; tom?: string }) {
  return (
    <div className="rounded-[var(--radius-campo)] bg-pedra/70 p-3">
      <dt className="text-[12px] text-tinta-2">{rotulo}</dt>
      <dd className={`num text-[19px] font-bold leading-tight ${tom}`}>{valor}</dd>
      {detalhe && <dd className="text-[12px] text-tinta-2">{detalhe}</dd>}
    </div>
  );
}

// Um mês de recebimentos: total, imposto e as parcelas, cada uma editável
function Mes({ fin, mes, lista, nome }: { fin: Financeiro; mes: string; lista: Entrada[]; nome: (p: Projeto) => string }) {
  const aliquota = lista[0]?.aliquota;
  return (
    <section aria-label={maiuscula(mesPorExtenso(mes))} className="space-y-2">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-[16px] font-bold text-tinta">{maiuscula(mesPorExtenso(mes))}</h3>
        <p className="num text-[16px] font-bold text-verde">{moeda(soma(lista, valorDe))}</p>
      </header>
      {aliquota !== null && aliquota !== undefined && (
        <p className="num -mt-1 text-[13px] text-tinta-2">
          Imposto de {pct(aliquota)}: {moeda(soma(lista, (e) => e.imposto))} · fica {moeda(soma(lista, (e) => e.aposImposto))}
        </p>
      )}
      <ul className="space-y-2">
        {lista.map((e) => (
          <LinhaDeParcela key={`${e.projeto.id}-${e.parcela.chave}`} fin={fin} entrada={e} nome={nome(e.projeto)} />
        ))}
      </ul>
    </section>
  );
}

// Financeiro (só para quem vê o financeiro): o que entra, mês a mês e projeto a projeto, na ordem em que o dinheiro cai,
// com o imposto do mês. Cada parcela se corrige ali mesmo (data, valor, recebido).
export function AReceber({ projetos }: { projetos: Projeto[] }) {
  const fin = useFinanceiro();
  const { estado } = useEstado();
  const [visao, setVisao] = useState<Visao>("mes");
  if (!fin || !fin.carregado) return null;
  const hoje = hojeIso();
  const corte = proximoCorte(hoje);
  const nome = (p: Projeto) => nomeDoCliente(estado.clientes.find((x) => x.id === p.clienteId));

  const entradas = entradasDeRecebimento(projetos, fin.servicos, fin.projetos, fin.empresas);
  const pendentes = entradas.filter((e) => !e.parcela.recebidaEm);
  const recebidas = entradas.filter((e) => e.parcela.recebidaEm);
  const comData = pendentes.filter((e) => e.mes);
  const semData = pendentes.filter((e) => !e.mes);
  const meses = [...new Set(comData.map((e) => e.mes!))].sort();
  const mesesRecebidos = [...new Set(recebidas.map((e) => e.mes!))].sort().reverse();
  const proximoDia = comData[0]?.parcela.previsao ?? null;
  const doProximo = comData.filter((e) => e.parcela.previsao === proximoDia);
  const mesAtual = hoje.slice(0, 7);
  const recebidoNoMes = recebidas.filter((e) => e.mes === mesAtual);

  // O que ainda dá para garantir no pagamento do próximo dia 5
  const oportunidades = projetos.flatMap((p) => {
    if (p.status === "encerrado" || ["solicitacao", "diagnostico", "proposta"].includes(faseDoProjeto(p))) return [];
    const r = recebimento(p, fin.servicos[p.modeloId], fin.projetos[p.id]);
    if (dataFinalizacao(p)) return [];
    const lista: { texto: string; valor: number; projeto: Projeto }[] = [];
    const primeira = r.parcelas.find((x) => x.chave === "30");
    if (p.etapas[0] && !dataDeEnvio(p, p.etapas[0]) && primeira && !primeira.recebidaEm) lista.push({ projeto: p, texto: "envie o Relatório 1 no HUB", valor: primeira.valor });
    else if (etapasTodasEnviadas(p)) lista.push({ projeto: p, texto: "falta o cliente avaliar a consultoria no HUB", valor: r.parcelas.find((x) => x.chave === "70")?.valor ?? 0 });
    return lista;
  });

  // Por projeto: só os que já têm alguma data ou algum recebimento
  const porProjeto = projetos
    .map((p) => ({ p, lista: entradas.filter((e) => e.projeto.id === p.id) }))
    .filter((g) => g.lista.some((e) => e.parcela.previsao || e.parcela.recebidaEm))
    .sort((a, b) => (a.lista.find((e) => !e.parcela.recebidaEm)?.parcela.previsao ?? "9999").localeCompare(b.lista.find((e) => !e.parcela.recebidaEm)?.parcela.previsao ?? "9999"));

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="A receber" valor={moeda(soma(pendentes, valorDe))} detalhe={`${pendentes.length} ${pendentes.length === 1 ? "parcela" : "parcelas"}`} />
        <Numero
          rotulo="Próximo pagamento"
          valor={proximoDia ? formatarData(proximoDia) : "—"}
          detalhe={proximoDia ? moeda(soma(doProximo, valorDe)) : "nada com data"}
          tom={proximoDia && proximoDia < hoje ? "text-laranja" : ""}
        />
        <Numero rotulo={`Recebido em ${mesPorExtenso(mesAtual)}`} valor={moeda(soma(recebidoNoMes, valorDe))} tom="text-verde" />
        <Numero rotulo="Imposto previsto" valor={moeda(soma(comData, (e) => e.imposto))} detalhe="sobre o que tem data" />
      </dl>

      {oportunidades.length > 0 && (
        <div className="rounded-[var(--radius-campo)] border border-laranja/30 bg-laranja-claro/70 p-3">
          <p className="text-[13px] font-semibold text-laranja">
            Até {formatarData(corte)} ({diferencaDias(hoje, corte) === 0 ? "hoje" : `faltam ${diferencaDias(hoje, corte)} dias`}) para entrar no pagamento de{" "}
            {formatarData(diaDoPagamento(corte))}:
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

      <div role="tablist" aria-label="Como ver os recebimentos" className="inline-flex w-full gap-1 rounded-[var(--radius-bloco)] bg-pedra/70 p-1 sm:w-auto">
        {visoes.map((v) => (
          <button
            key={v.chave}
            role="tab"
            aria-selected={visao === v.chave}
            onClick={() => setVisao(v.chave)}
            className={`min-h-10 flex-1 rounded-[var(--radius-campo)] px-4 py-2 text-[14px] font-semibold transition-colors sm:flex-none ${
              visao === v.chave ? "bg-folha text-tinta shadow-[var(--shadow-cartao)]" : "text-tinta-2 hover:text-tinta"
            }`}
          >
            {v.rotulo}
            {v.chave === "recebidos" && recebidas.length > 0 && <span className="num ml-1.5 text-[12px] font-medium text-tinta-2">{recebidas.length}</span>}
          </button>
        ))}
      </div>

      {visao === "mes" && (
        <div className="space-y-6">
          {meses.length === 0 && semData.length === 0 && <p className="text-sm text-tinta-2">Nada a receber por enquanto.</p>}
          {meses.map((m) => (
            <Mes key={m} fin={fin} mes={m} lista={comData.filter((e) => e.mes === m)} nome={nome} />
          ))}
          {semData.length > 0 && (
            <details className="rounded-[var(--radius-campo)] border border-linha p-3">
              <summary className="num flex cursor-pointer flex-wrap justify-between gap-x-3 text-[14px] font-semibold text-tinta">
                <span>Sem data ainda</span>
                <span className="text-tinta-2">
                  {semData.length} {semData.length === 1 ? "parcela" : "parcelas"} · {moeda(soma(semData, valorDe))}
                </span>
              </summary>
              <p className="mt-1 text-[13px] text-tinta-2">Projetos sem plano de trabalho. Em “Editar”, combine uma data para a parcela entrar na conta.</p>
              <ul className="mt-2 space-y-2">
                {semData.map((e) => (
                  <LinhaDeParcela key={`${e.projeto.id}-${e.parcela.chave}`} fin={fin} entrada={e} nome={nome(e.projeto)} />
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {visao === "projeto" && (
        <ul className="space-y-4">
          {porProjeto.length === 0 && <p className="text-sm text-tinta-2">Nenhum projeto com data de recebimento.</p>}
          {porProjeto.map(({ p, lista }) => {
            const total = soma(lista, valorDe);
            const entrou = soma(lista.filter((e) => e.parcela.recebidaEm), valorDe);
            return (
              <li key={p.id} aria-label={nome(p)} className="space-y-2 rounded-[var(--radius-bloco)] border border-linha p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <Link href={`/${p.empresa}/projetos/${p.id}#ficha`} className="text-[16px] font-bold text-tinta hover:text-azul">
                    {nome(p)}
                  </Link>
                  <span className="num text-[13px] text-tinta-2">
                    {moeda(entrou)} de {moeda(total)} recebidos
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-pedra" aria-hidden>
                  <div className="h-full rounded-full bg-verde-vivo" style={{ width: `${total ? Math.round((entrou / total) * 100) : 0}%` }} />
                </div>
                <ul className="space-y-2">
                  {lista.map((e) => (
                    <LinhaDeParcela key={e.parcela.chave} fin={fin} entrada={e} nome={nome(p)} comProjeto={false} />
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {visao === "recebidos" && (
        <div className="space-y-6">
          {recebidas.length === 0 && <p className="text-sm text-tinta-2">Nada marcado como recebido ainda. Use “Recebi” na parcela quando o dinheiro entrar.</p>}
          {mesesRecebidos.map((m) => (
            <Mes key={m} fin={fin} mes={m} lista={recebidas.filter((e) => e.mes === m)} nome={nome} />
          ))}
        </div>
      )}
    </div>
  );
}
