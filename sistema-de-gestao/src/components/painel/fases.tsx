"use client";

import Link from "next/link";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { fases, faseDoProjeto, fasesAntesDaContratacao, ondeEsta, type Fase } from "@/lib/fase";
import { grupoDaEtapa, grupos, ordemGrupos, type Grupo } from "@/lib/painel";
import { etapaAtrasada, etapaAtual, servicoDoProjeto } from "@/lib/projeto";
import { statusEtapa } from "@/lib/rotulos";

// Quantos projetos em cada fase: antes da contratação (diagnóstico, gestor,
// pagamento) e em execução. Cada serviço tem as suas etapas; a fase vale para todos.
export function FasesDosProjetos({ projetos }: { projetos: Projeto[] }) {
  const ativos = projetos.filter((p) => p.status !== "encerrado");
  const conta = (f: Fase) => projetos.filter((p) => faseDoProjeto(p) === f).length;
  const antes = ativos.filter((p) => fasesAntesDaContratacao.includes(faseDoProjeto(p))).length;
  const maior = Math.max(1, ...(["diagnostico", "aguardando_aprovacao", "aguardando_pagamento", "execucao"] as Fase[]).map(conta));
  const linha = (f: Fase) => (
    <li key={f} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
      <span className="flex min-w-0 items-center gap-2 text-sm text-tinta">
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: fases[f].cor }} />
        {fases[f].rotulo}
      </span>
      <span className="num text-sm font-semibold text-tinta">{conta(f)}</span>
      <span className="col-span-2 block h-1.5 rounded-full bg-pedra">
        <span className="block h-full rounded-full" style={{ width: `${(conta(f) / maior) * 100}%`, background: fases[f].cor }} />
      </span>
    </li>
  );
  if (!ativos.length) return <p className="text-sm text-tinta-2">Nenhum projeto em andamento.</p>;
  return (
    <div>
      <p className="num mb-4 text-[2rem] font-semibold leading-none text-tinta">
        {conta("execucao")} <span className="text-base font-normal text-tinta-2">em execução{antes ? `, ${antes} antes da contratação` : ""}</span>
      </p>
      <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-tinta-2">Antes da contratação</p>
      <ul className="space-y-2.5">{(["diagnostico", "aguardando_aprovacao", "aguardando_pagamento"] as Fase[]).map(linha)}</ul>
      <p className="mb-2 mt-4 text-[12px] font-bold uppercase tracking-wide text-tinta-2">Consultoria</p>
      <ul className="space-y-2.5">{linha("execucao")}</ul>
    </div>
  );
}

// Cada projeto numa linha: o diagnóstico e as etapas do serviço dele, com a cor
// da situação de cada uma. Serviços com 2, 5 ou 8 etapas aparecem lado a lado.
export function EtapasDosProjetos({ projetos }: { projetos: Projeto[] }) {
  const { estado } = useEstado();
  const ativos = projetos.filter((p) => p.status !== "encerrado").sort((a, b) => ordemFase(a) - ordemFase(b) || nome(estado, a).localeCompare(nome(estado, b)));
  if (!ativos.length) return <p className="text-sm text-tinta-2">Nenhum projeto em andamento.</p>;
  const usados = new Set<Grupo>(ativos.flatMap((p) => (faseDoProjeto(p) === "execucao" ? p.etapas.map((e) => grupoDaEtapa(e)) : ["nao_iniciada" as Grupo])));

  return (
    <div>
      <ul className="divide-y divide-linha">
        {ativos.map((p) => {
          const fase = faseDoProjeto(p);
          const contratado = fase === "execucao";
          const et = etapaAtual(p);
          const detalhe = !contratado
            ? "antes da contratação"
            : et
              ? et.status === "devolvida"
                ? "devolvida pelo SEBRAE"
                : etapaAtrasada(et)
                  ? "atrasada"
                  : statusEtapa[et.status].rotulo.toLowerCase()
              : "aguardando o SEBRAE";
          return (
            <li key={p.id} className="grid gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,15rem)_1fr_minmax(0,12rem)] md:items-center">
              <div className="min-w-0">
                <Link href={`/${p.empresa}/projetos/${p.id}`} className="block break-words font-semibold leading-snug text-tinta hover:text-azul">
                  {nome(estado, p)}
                </Link>
                <span className="block break-words text-[13px] text-tinta-2">
                  {servicoDoProjeto(p)} · {p.etapas.length} {p.etapas.length === 1 ? "etapa" : "etapas"}
                </span>
              </div>
              <ol className="flex gap-1" aria-label={`Etapas de ${nome(estado, p)}`}>
                <li
                  title={`Diagnóstico: ${contratado ? "aprovado e pago" : fases[fase].rotulo.toLowerCase()}`}
                  className="num grid h-7 min-w-9 place-items-center rounded-[6px] px-1.5 text-[12px] font-bold"
                  style={contratado ? { background: grupos.concluida.cor, color: grupos.concluida.texto } : { background: fases[fase].cor, color: "#fff" }}
                >
                  D
                </li>
                {p.etapas.map((e) => {
                  const g: Grupo = contratado ? grupoDaEtapa(e) : "nao_iniciada";
                  const atual = contratado && et?.ordem === e.ordem;
                  return (
                    <li
                      key={e.ordem}
                      title={`Etapa ${e.ordem}: ${e.nome.charAt(0)}${e.nome.slice(1).toLowerCase()} · ${grupos[g].rotulo}`}
                      className={`num grid h-7 min-w-0 flex-1 place-items-center rounded-[6px] text-[12px] font-bold ${atual ? "ring-2 ring-tinta ring-offset-1" : ""}`}
                      style={{ background: grupos[g].cor, color: grupos[g].texto }}
                    >
                      {e.ordem}
                    </li>
                  );
                })}
              </ol>
              <p className="min-w-0 text-sm md:text-right">
                <span className="font-semibold text-tinta">{ondeEsta(p)}</span>
                <span className="block text-[13px] text-tinta-2">{detalhe}</span>
              </p>
            </li>
          );
        })}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-linha pt-3 text-[13px] text-tinta-2" aria-label="Legenda">
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="num grid h-4 w-5 place-items-center rounded-[4px] text-[10px] font-bold text-folha"
            style={{ background: fases.diagnostico.cor }}
          >
            D
          </span>
          Diagnóstico (antes da contratação)
        </li>
        {ordemGrupos
          .filter((g) => usados.has(g))
          .map((g) => (
            <li key={g} className="flex items-center gap-1.5">
              <span aria-hidden className="h-3 w-3 rounded-[3px]" style={{ background: grupos[g].cor }} />
              {grupos[g].rotulo}
            </li>
          ))}
      </ul>
    </div>
  );
}

const ordemFase = (p: Projeto) => ["diagnostico", "aguardando_aprovacao", "aguardando_pagamento", "execucao"].indexOf(faseDoProjeto(p));
function nome(estado: ReturnType<typeof useEstado>["estado"], p: Projeto) {
  const c = estado.clientes.find((x) => x.id === p.clienteId);
  return c?.nomeFantasia || c?.razaoSocial || "Cliente";
}
