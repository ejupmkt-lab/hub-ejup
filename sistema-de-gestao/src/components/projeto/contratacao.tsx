"use client";

import { useState } from "react";
import type { Projeto, SituacaoContratacao } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { faseDoProjeto, mudarContratacao, ordemContratacao } from "@/lib/fase";
import { formatarData, hojeIso } from "@/lib/datas";
import { Botao, Cartao } from "@/components/ui";
import { IconeCheck } from "@/components/icones";
import { useProjeto } from "./use-projeto";

// Antes da consultoria: diagnóstico (pré-contratual) → aprovação do gestor no
// HUB → pagamento do cliente. Cada passo registra a data; dá para voltar um passo.
export function ContratacaoProjeto({ projeto }: { projeto: Projeto }) {
  const { alterar } = useProjeto();
  const { estado } = useEstado();
  const [data, setData] = useState(hojeIso());
  const [perguntas, setPerguntas] = useState(false);
  const fase = faseDoProjeto(projeto);
  if (fase === "execucao" || fase === "encerrado") return null;
  const c = projeto.contratacao!;
  const atual = ordemContratacao.indexOf(c.situacao);
  const servico = estado.servicos.find((s) => s.id === projeto.modeloId);
  const preDiagnostico = servico?.preDiagnostico ?? [];

  const passos: { s: SituacaoContratacao; titulo: string; texto: string; acao?: string; data: string | null }[] = [
    {
      s: "diagnostico",
      titulo: "Diagnóstico",
      texto: "No modelo do SEBRAE, assinado só por você, e enviado no HUB.",
      acao: "Enviei no HUB",
      data: c.enviadoEm,
    },
    {
      s: "aguardando_aprovacao",
      titulo: "Aprovação do gestor",
      texto: "O gestor do SEBRAE analisa e libera a contratação.",
      acao: "O gestor aprovou",
      data: c.aprovadoEm,
    },
    {
      s: "aguardando_pagamento",
      titulo: "Pagamento do cliente",
      texto: "O cliente escolhe a forma de pagamento e paga no HUB.",
      acao: "O cliente pagou",
      data: c.pagoEm,
    },
    { s: "contratado", titulo: "Consultoria", texto: `As ${projeto.etapas.length} etapas do serviço, com o plano de trabalho.`, data: null },
  ];

  const ir = (para: SituacaoContratacao, acao: string) =>
    alterar((p) => void (p.contratacao = mudarContratacao(p.contratacao, para, data)), { acao, detalhe: formatarData(data) });

  return (
    <Cartao className="mb-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">Antes da consultoria</h2>
        <span className="text-sm text-tinta-2">Fase pré-contratual no HUB SEBRAE</span>
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {passos.map((x, i) => {
          const feito = i < atual;
          const agora = i === atual;
          return (
            <li
              key={x.s}
              className={`rounded-[var(--radius-campo)] border p-3 ${agora ? "border-azul/40 bg-azul-claro/60" : feito ? "border-verde/25 bg-verde-claro/60" : "border-linha bg-pedra/50"}`}
            >
              <p className="flex items-center gap-2 text-[15px] font-semibold text-tinta">
                <span
                  className={`num grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] ${feito ? "bg-verde text-folha" : agora ? "bg-azul text-folha" : "bg-linha text-tinta-2"}`}
                >
                  {feito ? <IconeCheck className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {x.titulo}
              </p>
              <p className="mt-1 text-[13px] text-tinta-2">{x.texto}</p>
              {feito && x.data && <p className="num mt-1.5 text-[13px] font-medium text-verde">Em {formatarData(x.data)}</p>}
              {agora && x.acao && (
                <div className="mt-3 space-y-2">
                  <label className="block">
                    <span className="sr-only">Data</span>
                    <input type="date" className="campo !py-1.5 !text-sm" value={data} max={hojeIso()} onChange={(e) => setData(e.target.value || hojeIso())} />
                  </label>
                  <Botao tamanho="pequeno" className="w-full" onClick={() => ir(ordemContratacao[i + 1], x.acao!)}>
                    {x.acao}
                  </Botao>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {atual > 0 ? (
          <button
            type="button"
            onClick={() => ir(ordemContratacao[atual - 1], "Contratação: voltou um passo")}
            className="text-[13px] text-tinta-2 underline-offset-4 hover:text-tinta hover:underline"
          >
            Voltar um passo
          </button>
        ) : (
          <span />
        )}
        {preDiagnostico.length > 0 && (
          <button
            type="button"
            onClick={() => setPerguntas(!perguntas)}
            className="text-[13px] font-semibold text-azul hover:underline"
            aria-expanded={perguntas}
          >
            {perguntas ? "Fechar as perguntas" : `Perguntas do pré-diagnóstico da ficha (${preDiagnostico.length})`}
          </button>
        )}
      </div>
      {perguntas && (
        <ol className="mt-3 list-decimal space-y-1.5 rounded-[var(--radius-campo)] bg-pedra/60 py-3 pl-8 pr-4 text-sm text-tinta">
          {preDiagnostico.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      )}
    </Cartao>
  );
}
