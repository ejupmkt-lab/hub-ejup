"use client";

import Link from "next/link";
import type { Projeto } from "@/lib/dados/tipos";
import { diferencaDias, hojeIso, periodoCurto } from "@/lib/datas";
import { doisDigitos, statusEtapa } from "@/lib/rotulos";
import { etapaAtual, etapaConcluida, progressoAtividades } from "@/lib/projeto";

// O trilho: as etapas do projeto como uma faixa no calendário, cada uma com a
// largura dos seus dias, preenchida conforme o andamento, e a marca de hoje.
export function Trilho({ projeto, grande = false }: { projeto: Projeto; grande?: boolean }) {
  const etapas = projeto.etapas;
  const comDatas = etapas.every((e) => e.dataInicio && e.dataFim);
  const inicio = etapas[0]?.dataInicio;
  const fim = etapas[etapas.length - 1]?.dataFim;
  const total = comDatas && inicio && fim ? diferencaDias(inicio, fim) + 1 : etapas.length;
  const atual = etapaAtual(projeto);
  const hoje = hojeIso();
  const posHoje =
    comDatas && inicio && fim && hoje >= inicio && hoje <= fim ? ((diferencaDias(inicio, hoje) + 0.5) / total) * 100 : null;

  return (
    <div className={`relative ${grande ? "pt-6" : ""}`}>
      <div className={`flex ${grande ? "gap-1" : "gap-[3px]"}`}>
        {etapas.map((e) => {
          const dias = comDatas ? diferencaDias(e.dataInicio!, e.dataFim!) + 1 : 1;
          const concluida = etapaConcluida(e);
          const eAtual = atual?.ordem === e.ordem;
          const devolvida = e.status === "devolvida";
          const { feitas, total: tot } = progressoAtividades(e);
          const preenchido = concluida ? 100 : eAtual && tot && feitas ? Math.max(6, (feitas / tot) * 100) : 0;
          const barra = (
            <span
              className={`relative block overflow-hidden rounded-[3px] ${grande ? "h-2.5" : "h-1.5"} ${
                !comDatas ? "border border-dashed border-linha-forte bg-transparent" : eAtual ? "bg-garrafa/20" : "bg-linha"
              }`}
            >
              <span
                className={`absolute inset-y-0 left-0 ${devolvida ? "bg-vinho" : concluida ? "bg-garrafa" : "bg-garrafa/80"}`}
                style={{ width: `${devolvida ? 100 : preenchido}%` }}
              />
            </span>
          );
          const titulo = `Etapa ${doisDigitos(e.ordem)} ${e.nome.toLowerCase()} · ${statusEtapa[e.status].rotulo}`;
          return (
            <Link
              key={e.ordem}
              href={`/${projeto.empresa}/projetos/${projeto.id}/etapas/${e.ordem}`}
              title={titulo}
              aria-label={titulo}
              className="group min-w-0"
              style={{ flexGrow: dias, flexBasis: 0 }}
            >
              {barra}
              {grande && (
                <span className="mt-2.5 block min-w-0 pr-2">
                  <span className={`block truncate text-[13px] ${eAtual ? "text-tinta" : "text-tinta-2"} group-hover:text-garrafa`}>
                    <span className="num font-serif text-[15px] text-tinta">{doisDigitos(e.ordem)}</span>
                    <span className="hidden sm:inline"> {e.nome.charAt(0) + e.nome.slice(1).toLowerCase()}</span>
                  </span>
                  <span className="num hidden truncate text-xs text-tinta-2 sm:block">{periodoCurto(e.dataInicio, e.dataFim)}</span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
      {posHoje !== null && (
        <span
          className={`pointer-events-none absolute top-0 w-px bg-latao ${grande ? "h-[calc(1.5rem+0.875rem)]" : "bottom-0"}`}
          style={{ left: `${posHoje}%` }}
          aria-hidden
        >
          {grande && <span className="absolute -top-0.5 left-1.5 text-[11px] font-medium text-latao">hoje</span>}
          {!grande && <span className="absolute -top-1 -left-[3px] h-[7px] w-[7px] rounded-full bg-latao" />}
        </span>
      )}
      {grande && !comDatas && (
        <p className="mt-3 text-[13px] text-tinta-2">As etapas ganham largura e datas quando o plano de trabalho for fechado.</p>
      )}
    </div>
  );
}
