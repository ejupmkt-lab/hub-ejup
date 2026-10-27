"use client";

import Link from "next/link";
import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { useFinanceiro } from "@/lib/dados/financeiro";
import { dataDeEnvio, dataFinalizacao, diaDoPagamento, entradasDeRecebimento, moeda, proximoCorte, recebimento, type Entrada } from "@/lib/financeiro";
import { etapasTodasEnviadas, faseDoProjeto } from "@/lib/fase";
import { codigoHub, servicoDoProjeto } from "@/lib/projeto";
import { diferencaDias, formatarData, hojeIso, mesPorExtenso } from "@/lib/datas";
import { nomeDoCliente } from "@/lib/campos-cliente";
import { BalaoDeParcela } from "./balao-parcela";

const pct = (n: number) => `${String(n).replace(".", ",")}%`;
const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const soma = (l: Entrada[], f: (e: Entrada) => number) => l.reduce((a, e) => a + f(e), 0);
const valorDe = (e: Entrada) => e.parcela.valor;
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesCurto = (ym: string) => `${MESES_CURTOS[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`;

function Numero({ rotulo, valor, detalhe, tom = "" }: { rotulo: string; valor: string; detalhe?: string; tom?: string }) {
  return (
    <div className="rounded-[var(--radius-campo)] bg-pedra/70 p-3">
      <dt className="text-[12px] text-tinta-2">{rotulo}</dt>
      <dd className={`num text-[19px] font-bold leading-tight ${tom}`}>{valor}</dd>
      {detalhe && <dd className="text-[12px] text-tinta-2">{detalhe}</dd>}
    </div>
  );
}

// Financeiro (só para quem vê o financeiro): o que entra, por mês e, em cada mês, por cliente e projeto. Cada projeto tem
// dois balões (1ª parcela 30%, 2ª parcela 70%) com a data prevista, projetada pelo andamento do projeto; tudo se corrige ali.
export function AReceber({ projetos }: { projetos: Projeto[] }) {
  const fin = useFinanceiro();
  const { estado } = useEstado();
  const [escolha, setEscolha] = useState<string>("todos"); // "todos", "sem" ou AAAA-MM
  if (!fin || !fin.carregado) return null;
  const hoje = hojeIso();
  const corte = proximoCorte(hoje);
  const clienteDe = (p: Projeto) => estado.clientes.find((x) => x.id === p.clienteId);
  const nome = (p: Projeto) => nomeDoCliente(clienteDe(p));

  const entradas = entradasDeRecebimento(projetos, fin.servicos, fin.projetos, fin.empresas);
  const pendentes = entradas.filter((e) => !e.parcela.recebidaEm);
  const comData = pendentes.filter((e) => e.mes);
  const semData = pendentes.filter((e) => !e.mes);
  const meses = [...new Set(entradas.filter((e) => e.mes).map((e) => e.mes!))].sort();
  const mesAtual = hoje.slice(0, 7);
  const recebidoNoMes = entradas.filter((e) => e.parcela.recebidaEm && e.mes === mesAtual);
  const proximoDia = comData[0]?.parcela.previsao ?? null;
  const doProximo = comData.filter((e) => e.parcela.previsao === proximoDia);

  // O que a escolha mostra: um mês (as parcelas que caem nele), as sem data ou tudo o que tem data
  const noFiltro = (e: Entrada) => (escolha === "todos" ? !!e.mes : escolha === "sem" ? !e.mes : e.mes === escolha);
  const doMes = entradas.filter(noFiltro);
  const projetosDaEscolha = [...new Set(doMes.map((e) => e.projeto.id))].map((id) => projetos.find((p) => p.id === id)!);
  const clientes = [...new Set(projetosDaEscolha.map((p) => p.clienteId))]
    .map((id) => {
      const ps = projetosDaEscolha.filter((p) => p.clienteId === id);
      const todas = entradas.filter((e) => ps.some((p) => p.id === e.projeto.id));
      const proxima = todas.filter((e) => !e.parcela.recebidaEm && e.parcela.previsao).map((e) => e.parcela.previsao!).sort()[0] ?? "9999";
      return { id, ps, todas, proxima, cliente: clienteDe(ps[0]) };
    })
    .sort((a, b) => a.proxima.localeCompare(b.proxima) || nomeDoCliente(a.cliente).localeCompare(nomeDoCliente(b.cliente)));
  const mesEscolhido = /^\d{4}-\d{2}$/.test(escolha) ? escolha : null;

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

  const pilula = (chave: string, rotulo: string, valor?: string) => (
    <button
      key={chave}
      role="tab"
      aria-selected={escolha === chave}
      onClick={() => setEscolha(chave)}
      className={`shrink-0 rounded-[var(--radius-campo)] border px-3.5 py-2 text-left transition-colors ${
        escolha === chave ? "border-azul bg-azul-claro text-azul" : "border-linha bg-folha text-tinta hover:border-linha-forte"
      }`}
    >
      <span className="block text-[14px] font-semibold">{rotulo}</span>
      {valor && <span className="num block text-[12px] text-tinta-2">{valor}</span>}
    </button>
  );

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

      <div role="tablist" aria-label="Mês de recebimento" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {pilula("todos", "Todos os meses", moeda(soma(entradas.filter((e) => e.mes), valorDe)))}
        {meses.map((m) => {
          const l = entradas.filter((e) => e.mes === m);
          return pilula(m, maiuscula(mesCurto(m)), moeda(soma(l, valorDe)));
        })}
        {semData.length > 0 && pilula("sem", "Sem data", `${semData.length} ${semData.length === 1 ? "parcela" : "parcelas"}`)}
      </div>

      {mesEscolhido && doMes.length > 0 && (
        <p className="num text-[14px] text-tinta">
          <strong>{maiuscula(mesPorExtenso(mesEscolhido))}:</strong> {moeda(soma(doMes, valorDe))}
          {doMes[0].aliquota !== null && (
            <span className="text-tinta-2">
              {" "}
              · imposto de {pct(doMes[0].aliquota)}: {moeda(soma(doMes, (e) => e.imposto))} · fica {moeda(soma(doMes, (e) => e.aposImposto))}
            </span>
          )}
        </p>
      )}
      {escolha === "sem" && <p className="text-[13px] text-tinta-2">Projetos sem plano de trabalho. Em “Editar”, combine uma data para a parcela entrar na conta.</p>}

      {clientes.length === 0 ? (
        <p className="text-sm text-tinta-2">{escolha === "todos" ? "Nada a receber por enquanto." : "Nada neste período."}</p>
      ) : (
        <ul className="space-y-5">
          {clientes.map((c) => {
            const aReceber = soma(c.todas.filter((e) => !e.parcela.recebidaEm), valorDe);
            const recebido = soma(c.todas.filter((e) => e.parcela.recebidaEm), valorDe);
            const doClienteNoMes = doMes.filter((e) => c.ps.some((p) => p.id === e.projeto.id));
            return (
              <li key={c.id} aria-label={nomeDoCliente(c.cliente)} className="rounded-[var(--radius-bloco)] border border-linha p-3.5 sm:p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <h3 className="text-[17px] font-bold text-tinta">{nomeDoCliente(c.cliente)}</h3>
                  <p className="num text-[13px] text-tinta-2">
                    {mesEscolhido ? <>Neste mês: <strong className="text-tinta">{moeda(soma(doClienteNoMes, valorDe))}</strong></> : <>A receber <strong className="text-tinta">{moeda(aReceber)}</strong></>}
                    {recebido > 0 && <> · recebido <strong className="text-verde">{moeda(recebido)}</strong></>}
                  </p>
                </div>
                <ul className="mt-3 space-y-4">
                  {c.ps.map((p) => {
                    const meus = c.todas.filter((e) => e.projeto.id === p.id).sort((a, b) => a.parcela.ordem - b.parcela.ordem);
                    return (
                      <li key={p.id} aria-label={`Projeto ${servicoDoProjeto(p)}`}>
                        <p className="mb-2 text-[14px] font-semibold text-tinta-2">
                          <Link href={`/${p.empresa}/projetos/${p.id}#ficha`} className="hover:text-azul">
                            {servicoDoProjeto(p)}
                          </Link>
                          {codigoHub(p) && <span className="num font-normal"> · HUB {codigoHub(p)}</span>}
                        </p>
                        <ul className="grid gap-3 sm:grid-cols-2">
                          {meus.map((e) => (
                            <BalaoDeParcela key={e.parcela.chave} fin={fin} entrada={e} nome={`${nome(p)} · ${servicoDoProjeto(p)}`} destaque={!!mesEscolhido && e.mes === mesEscolhido} />
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
