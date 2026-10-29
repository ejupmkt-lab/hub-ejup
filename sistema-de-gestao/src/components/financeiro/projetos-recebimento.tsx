"use client";

import Link from "next/link";
import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import type { Financeiro } from "@/lib/dados/financeiro";
import { moeda, type ChaveDeParcela, type Entrada } from "@/lib/financeiro";
import { formatarData } from "@/lib/datas";
import { avancoProjeto, codigoHub, entregaFinal, etapaAtual, etapasAtrasadas, previstoProjeto, servicoDoProjeto, situacaoProjeto } from "@/lib/projeto";
import { faseDoProjeto, fases } from "@/lib/fase";
import { doisDigitos } from "@/lib/rotulos";
import { Barra, Cartao, Status, corTom } from "@/components/ui";
import { BalaoDeParcela, EditorDeParcela, SeloDaNota, rotuloAcessivel, situacaoDaParcela, tituloDaParcela, useAjusteDeParcela } from "./balao-parcela";

const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const colunas = "grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_8.5rem_minmax(0,1.1fr)_minmax(0,1.1fr)] items-start gap-5";

export type LinhaDeProjeto = { projeto: Projeto; entradas: Entrada[]; nomeCliente: string };

// Etapa em curso (ou a fase do HUB, antes da execução), como na lista de projetos
function etapaDoProjeto(p: Projeto) {
  const et = etapaAtual(p);
  const fase = faseDoProjeto(p);
  const atrasada = !!et && (et.status === "devolvida" || etapasAtrasadas(p).some((x) => x.ordem === et.ordem));
  if (fase !== "execucao" && fase !== "concluido") return { texto: `${fases[fase].numero} ${fases[fase].rotulo}`, ponto: "bg-azul" };
  return { texto: et ? `${doisDigitos(et.ordem)} ${capitalizar(et.nome)}` : "Todas enviadas", ponto: atrasada ? corTom[situacaoProjeto(p).tom].ponto : et ? "bg-azul" : "bg-verde-vivo" };
}

// A parcela como célula da tabela: valor, data prevista (ou quando entrou), situação e os dois botões
function CelulaDeParcela({ fin, entrada: e, nome, aberta, aoEditar }: { fin: Financeiro; entrada: Entrada; nome: string; aberta: boolean; aoEditar: () => void }) {
  const { parcela: x } = e;
  const sit = situacaoDaParcela(e);
  const { recebi, desfazer } = useAjusteDeParcela(fin, e);
  return (
    <div role="group" aria-label={rotuloAcessivel(nome, x)} className="min-w-0">
      <p className="num text-[15px] font-bold text-tinta">{moeda(x.valor)}</p>
      <p className={`num text-[13px] ${x.recebidaEm ? "font-semibold text-verde" : sit.atrasada ? "font-semibold text-laranja" : "text-tinta-2"}`}>
        {x.recebidaEm ? `Recebida em ${formatarData(x.recebidaEm)}` : x.previsao ? `Previsto até ${formatarData(x.previsao)}` : "Sem data prevista"}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <Status tom={sit.tom}>{sit.texto}</Status>
        <SeloDaNota entrada={e} />
      </div>
      <div className="relative z-10 mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={x.recebidaEm ? desfazer : recebi}
          className="rounded-md border border-linha-forte bg-folha px-2.5 py-1 text-[13px] font-semibold text-tinta hover:bg-pedra"
        >
          {x.recebidaEm ? "Desfazer" : "Recebi"}
        </button>
        <button
          type="button"
          aria-expanded={aberta}
          onClick={aoEditar}
          className="rounded-md border border-linha-forte bg-folha px-2.5 py-1 text-[13px] font-semibold text-tinta hover:bg-pedra"
        >
          {aberta ? "Fechar" : "Editar"}
        </button>
      </div>
    </div>
  );
}

// Os projetos de um período, com o mesmo desenho da lista de projetos: tabela nas telas largas (cliente e projeto, etapa,
// progresso e as duas parcelas) e cartões nas menores. A edição de uma parcela abre numa faixa embaixo da linha.
export function ProjetosDoRecebimento({ fin, linhas, mesEscolhido }: { fin: Financeiro; linhas: LinhaDeProjeto[]; mesEscolhido: string | null }) {
  const [edicao, setEdicao] = useState<{ id: string; chave: ChaveDeParcela } | null>(null);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:hidden">
        {linhas.map(({ projeto: p, entradas, nomeCliente }) => {
          const sit = situacaoProjeto(p);
          const avanco = avancoProjeto(p);
          const previsto = previstoProjeto(p);
          const etapa = etapaDoProjeto(p);
          return (
            <article key={p.id} className={`flex flex-col rounded-[var(--radius-bloco)] border border-l-4 border-linha bg-folha p-4 shadow-[var(--shadow-cartao)] ${corTom[sit.tom].borda}`}>
              <h3 className="break-words text-[17px] font-bold leading-snug text-tinta">
                <Link href={`/${p.empresa}/projetos/${p.id}#ficha`} className="hover:text-azul">
                  {nomeCliente}
                </Link>
              </h3>
              <p className="num mt-0.5 break-words text-sm text-tinta-2">
                {servicoDoProjeto(p)} · HUB {codigoHub(p) || "sem número"}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <span className="num text-[1.6rem] font-bold leading-none tracking-tight text-tinta">{avanco}%</span>
                {previsto !== null && <span className="num pb-0.5 text-[13px] text-tinta-2">previsto {previsto}%</span>}
              </div>
              <div className="mt-2">
                <Barra valor={avanco} total={100} marca={previsto} />
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm text-tinta-2">
                <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${etapa.ponto}`} />
                Etapa: <span className="font-semibold text-tinta">{etapa.texto}</span>
              </p>
              <ul className="mt-3 grid gap-3">
                {entradas.map((e) => (
                  <BalaoDeParcela key={e.parcela.chave} fin={fin} entrada={e} nome={`${nomeCliente} · ${servicoDoProjeto(p)}`} destaque={!!mesEscolhido && e.mes === mesEscolhido} />
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <Cartao className="hidden overflow-hidden xl:block">
        <div className={`border-b border-linha bg-pedra/60 px-5 py-2.5 text-[13px] font-semibold text-tinta-2 ${colunas} !items-center`}>
          <span>Cliente / projeto</span>
          <span>Etapa atual</span>
          <span>Progresso</span>
          <span>1ª parcela · 30%</span>
          <span>2ª parcela · 70%</span>
        </div>
        <ul className="divide-y divide-linha">
          {linhas.map(({ projeto: p, entradas, nomeCliente }) => {
            const etapa = etapaDoProjeto(p);
            const avanco = avancoProjeto(p);
            const previsto = previstoProjeto(p);
            const nome = `${nomeCliente} · ${servicoDoProjeto(p)}`;
            const editando = edicao?.id === p.id ? entradas.find((e) => e.parcela.chave === edicao.chave) : undefined;
            const entrega = entregaFinal(p);
            return (
              <li key={p.id} aria-label={nome} className="relative">
                <div className={`px-5 py-4 hover:bg-pedra/40 ${colunas}`}>
                  <div className="min-w-0">
                    <Link
                      href={`/${p.empresa}/projetos/${p.id}#ficha`}
                      className="break-words text-[15px] font-bold text-tinta after:absolute after:inset-0 after:content-[''] hover:text-azul"
                    >
                      {nomeCliente}
                    </Link>
                    <p className="num break-words text-[13px] text-tinta-2">
                      {servicoDoProjeto(p)} · HUB {codigoHub(p) || "sem número"}
                    </p>
                  </div>
                  <p className="flex min-w-0 items-start gap-2 text-sm text-tinta">
                    <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${etapa.ponto}`} />
                    <span className="min-w-0">{etapa.texto}</span>
                  </p>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex-1">
                        <Barra valor={avanco} total={100} marca={previsto} />
                      </span>
                      <span className="num w-10 shrink-0 text-right text-sm font-semibold">{avanco}%</span>
                    </div>
                    <p className="num mt-1 text-[12px] text-tinta-2">entrega {entrega ? formatarData(entrega) : "—"}</p>
                  </div>
                  {entradas.map((e) => (
                    <CelulaDeParcela
                      key={e.parcela.chave}
                      fin={fin}
                      entrada={e}
                      nome={nome}
                      aberta={edicao?.id === p.id && edicao.chave === e.parcela.chave}
                      aoEditar={() => setEdicao(edicao?.id === p.id && edicao.chave === e.parcela.chave ? null : { id: p.id, chave: e.parcela.chave })}
                    />
                  ))}
                </div>
                {editando && (
                  <div className="relative z-10 border-t border-linha bg-pedra/40 px-5 py-4">
                    <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-tinta-2">
                      Editando: {tituloDaParcela(editando.parcela)} · {nome}
                    </p>
                    <EditorDeParcela fin={fin} entrada={editando} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Cartao>
    </>
  );
}
