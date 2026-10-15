"use client";

import Link from "next/link";
import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { periodoCurto } from "@/lib/datas";
import { doisDigitos } from "@/lib/rotulos";
import { etapaAtual, progressoAtividades, situacaoPrazo } from "@/lib/projeto";
import { Barra, Botao, BotaoLink, Cartao, Selo, StatusEtapa } from "@/components/ui";

// As etapas na ordem da ficha, como no HUB SEBRAE: título, descrição,
// período, horas, checklist e status; o "i" abre atividades e entregas.
export function EtapasHub({ projeto }: { projeto: Projeto }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const atual = etapaAtual(projeto);

  return (
    <Cartao>
    <ol className="divide-y divide-linha">
      {projeto.etapas.map((e) => {
        const prog = progressoAtividades(e);
        const sit = projeto.status === "em_andamento" ? situacaoPrazo(e) : null;
        const href = `/${projeto.empresa}/projetos/${projeto.id}/etapas/${e.ordem}`;
        const eAtual = atual?.ordem === e.ordem;
        const nome = e.nome.charAt(0) + e.nome.slice(1).toLowerCase();
        return (
          <li key={e.ordem} className={`grid grid-cols-[3rem_1fr] gap-x-4 px-6 py-6 sm:grid-cols-[4rem_1fr] ${eAtual ? "bg-garrafa-claro/35" : ""}`}>
            <span className={`num font-serif text-3xl leading-none ${eAtual ? "text-garrafa" : "text-linha-forte"}`}>{doisDigitos(e.ordem)}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
                <div className="min-w-0 max-w-2xl">
                  <Link href={href} className="font-serif text-[21px] leading-snug text-tinta hover:text-garrafa">
                    {nome}
                  </Link>
                  <p className={`mt-1 text-[15px] leading-relaxed text-tinta-2 ${aberta === e.ordem ? "" : "line-clamp-2"}`}>{e.descricao}</p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <StatusEtapa status={e.status} />
                  {sit && sit.tom !== "neutro" && sit.tom !== "ok" && <Selo tom={sit.tom}>{sit.texto}</Selo>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-tinta-2">
                <span className="num">{periodoCurto(e.dataInicio, e.dataFim)}</span>
                <span className="num">{e.horasPrevistas} h</span>
                <span className="flex w-44 items-center gap-3">
                  <Barra valor={prog.feitas} total={prog.total} tom={prog.feitas === prog.total ? "ok" : "andamento"} />
                  <span className="num shrink-0">
                    {prog.feitas}/{prog.total}
                  </span>
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <Botao variante="fantasma" tamanho="pequeno" onClick={() => setAberta(aberta === e.ordem ? null : e.ordem)} aria-expanded={aberta === e.ordem}>
                    {aberta === e.ordem ? "Fechar detalhes" : "Atividades e entregas"}
                  </Botao>
                  <BotaoLink href={href} variante={eAtual ? "primario" : "secundario"} tamanho="pequeno">
                    Abrir etapa
                  </BotaoLink>
                </span>
              </div>

              {aberta === e.ordem && (
                <div className="mt-6 grid gap-8 text-[15px] md:grid-cols-2">
                  <div>
                    <p className="mb-2 font-medium">Atividades da ficha</p>
                    <ul className="space-y-1.5">
                      {e.atividades.map((a) => (
                        <li key={a.codigo} className={a.nivel > 1 ? "pl-5 text-tinta-2" : ""}>
                          <span className="num">{a.codigo}</span> {a.texto}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 font-medium">Entregáveis</p>
                    <ol className="list-decimal space-y-1.5 pl-5 text-tinta-2">
                      {e.entregaveis.filter((x) => x.tipo === "entregavel").map((x) => (
                        <li key={x.titulo}>{x.titulo}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
    </Cartao>
  );
}
