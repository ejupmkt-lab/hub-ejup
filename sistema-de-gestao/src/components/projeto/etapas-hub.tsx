"use client";

import Link from "next/link";
import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { formatarData } from "@/lib/datas";
import { doisDigitos, statusEtapa } from "@/lib/rotulos";
import { progressoAtividades, situacaoPrazo } from "@/lib/projeto";
import { Chip, ChipEtapa, corBarraEtapa } from "@/components/ui";

// Lista de etapas no formato da tela do HUB SEBRAE: título, descrição,
// botões (informações / abrir / baixar) e status com barra colorida à direita.
export function EtapasHub({ projeto }: { projeto: Projeto }) {
  const [aberta, setAberta] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {projeto.etapas.map((e) => {
        const s = statusEtapa[e.status];
        const prog = progressoAtividades(e);
        const sit = projeto.status === "em_andamento" ? situacaoPrazo(e) : null;
        const href = `/${projeto.empresa}/projetos/${projeto.id}/etapas/${e.ordem}`;
        return (
          <div key={e.ordem} className="flex overflow-hidden rounded-lg border border-linha bg-superficie">
            <div className="flex-1 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={href} className="font-semibold tracking-wide hover:text-marinho">
                    ETAPA {doisDigitos(e.ordem)} | {e.nome}
                  </Link>
                  <p className={`mt-1 text-sm text-tinta-2 ${aberta === e.ordem ? "" : "line-clamp-2"}`}>{e.descricao}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-tinta-2">
                    <span>Previsão: {e.dataInicio ? `${formatarData(e.dataInicio)} a ${formatarData(e.dataFim)}` : "definir no plano de trabalho"}</span>
                    <span>Horas previstas: {e.horasPrevistas} h</span>
                    <span>Checklist: {prog.feitas}/{prog.total}</span>
                  </div>
                </div>
                <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
                  <div className="flex gap-2">
                    <button
                      title="Informações"
                      onClick={() => setAberta(aberta === e.ordem ? null : e.ordem)}
                      className="grid h-9 w-9 place-items-center rounded-md border border-linha text-marinho hover:bg-marinho-claro"
                    >
                      <span className="text-sm font-bold">i</span>
                    </button>
                    <Link href={href} className="rounded-md border border-linha px-3 py-2 text-sm text-marinho hover:bg-marinho-claro">
                      Abrir etapa
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    {sit && sit.cor !== "verde" && sit.cor !== "cinza" && <Chip cor={sit.cor}>{sit.texto}</Chip>}
                    <ChipEtapa status={e.status} />
                  </div>
                </div>
              </div>
              {aberta === e.ordem && (
                <div className="mt-4 grid gap-4 border-t border-linha pt-4 text-sm md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-tinta-2">Atividades da ficha</div>
                    <ul className="space-y-1">
                      {e.atividades.map((a) => (
                        <li key={a.codigo} className={a.nivel > 1 ? "pl-5 text-tinta-2" : "font-medium"}>
                          {a.codigo}. {a.texto}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-tinta-2">Entrega</div>
                    <ul className="list-disc space-y-1 pl-5">
                      {e.entregaveis.filter((x) => x.tipo === "entregavel").map((x) => <li key={x.titulo}>{x.titulo}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className={`w-2.5 shrink-0 ${corBarraEtapa[s.cor]}`} />
          </div>
        );
      })}
    </div>
  );
}
