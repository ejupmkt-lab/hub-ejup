"use client";

import Link from "next/link";
import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { dataPorExtenso, hojeIso } from "@/lib/datas";
import { diasDoMes, eventos, grupos, type Evento } from "@/lib/painel";
import { doisDigitos } from "@/lib/rotulos";
import { Botao } from "@/components/ui";

const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function mudarMes(mes: string, delta: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

// Mês com os prazos e inícios de etapa. Clicar num dia lista o que há nele.
export function Calendario({ projetos }: { projetos: Projeto[] }) {
  const { estado } = useEstado();
  const hoje = hojeIso();
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const [dia, setDia] = useState(hoje);
  const todos = eventos(projetos);
  const porDia = new Map<string, Evento[]>();
  for (const ev of todos) porDia.set(ev.data, [...(porDia.get(ev.data) ?? []), ev]);
  const nome = (p: Projeto) => {
    const c = estado.clientes.find((x) => x.id === p.clienteId);
    return c?.nomeFantasia || c?.razaoSocial || "Cliente";
  };
  const doDia = porDia.get(dia) ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-serif text-[1.15rem]">
          {nomesMeses[Number(mes.slice(5)) - 1]} de {mes.slice(0, 4)}
        </p>
        <span className="flex items-center gap-1">
          <Botao variante="secundario" tamanho="pequeno" onClick={() => setMes(mudarMes(mes, -1))} aria-label="Mês anterior">
            ‹
          </Botao>
          <Botao
            variante="secundario"
            tamanho="pequeno"
            onClick={() => {
              setMes(hoje.slice(0, 7));
              setDia(hoje);
            }}
          >
            Hoje
          </Botao>
          <Botao variante="secundario" tamanho="pequeno" onClick={() => setMes(mudarMes(mes, 1))} aria-label="Próximo mês">
            ›
          </Botao>
        </span>
      </div>

      <div className="grid grid-cols-7 border-l border-t border-linha text-[13px]">
        {diasSemana.map((d) => (
          <div key={d} className="border-b border-r border-linha bg-pedra/50 px-2 py-1.5 text-tinta-2">
            {d}
          </div>
        ))}
        {diasDoMes(mes).map((d) => {
          const evs = porDia.get(d) ?? [];
          const foraDoMes = !d.startsWith(mes);
          const selecionado = d === dia;
          return (
            <button
              key={d}
              onClick={() => setDia(d)}
              aria-pressed={selecionado}
              aria-label={`${dataPorExtenso(d)}: ${evs.length ? `${evs.length} ${evs.length === 1 ? "evento" : "eventos"}` : "sem eventos"}`}
              className={`flex min-h-[3.75rem] flex-col sm:min-h-[5.25rem] items-stretch gap-1 border-b border-r border-linha p-1.5 text-left transition-colors ${
                selecionado ? "bg-garrafa-claro/60" : "hover:bg-pedra/50"
              } ${foraDoMes ? "text-tinta-2/50" : ""}`}
            >
              <span
                className={`num grid h-6 w-6 place-items-center rounded-full text-[12px] ${
                  d === hoje ? "bg-garrafa font-medium text-folha" : foraDoMes ? "" : "text-tinta"
                }`}
              >
                {Number(d.slice(8))}
              </span>
              {evs.slice(0, 2).map((ev, i) => (
                <span key={i} className="flex min-w-0 items-center gap-1.5 text-[11px] leading-tight text-tinta">
                  <span
                    aria-hidden
                    className={`h-2 w-2 shrink-0 ${ev.tipo === "prazo" ? "rounded-[2px]" : "rounded-full border-2 bg-transparent"}`}
                    style={ev.tipo === "prazo" ? { background: grupos[ev.grupo].cor } : { borderColor: grupos[ev.grupo].cor }}
                  />
                  <span className="hidden truncate sm:inline">
                    {doisDigitos(ev.etapa.ordem)} {nome(ev.projeto)}
                  </span>
                </span>
              ))}
              {evs.length > 2 && <span className="text-[11px] text-tinta-2">+{evs.length - 2}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-tinta-2">
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-2.5 w-2.5 rounded-[2px] bg-tinta-2" />
          Prazo final da etapa
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full border-2 border-tinta-2" />
          Início da etapa
        </span>
        <span>A cor segue a situação da etapa, como no cronograma.</span>
      </div>

      <div className="mt-5 border-t border-linha pt-4">
        <p className="mb-2 text-sm font-medium text-tinta">{dia === hoje ? "Hoje" : dataPorExtenso(dia).replace(/^0/, "")}</p>
        {doDia.length === 0 ? (
          <p className="text-sm text-tinta-2">Nenhum prazo ou início de etapa neste dia.</p>
        ) : (
          <ul className="space-y-1.5">
            {doDia.map((ev, i) => (
              <li key={i}>
                <Link
                  href={`/${ev.projeto.empresa}/projetos/${ev.projeto.id}/etapas/${ev.etapa.ordem}`}
                  className="flex items-center gap-2.5 text-sm text-tinta hover:text-garrafa hover:underline"
                >
                  <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: grupos[ev.grupo].cor }} />
                  {ev.tipo === "prazo" ? "Prazo da" : "Início da"} etapa {doisDigitos(ev.etapa.ordem)}, {nome(ev.projeto)}
                  <span className="text-tinta-2">({grupos[ev.grupo].rotulo.toLowerCase()})</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
