"use client";

import Link from "next/link";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { diferencaDias, hojeIso, periodoCurto, somarDias } from "@/lib/datas";
import { ativos, grupoDaEtapa, grupos, janelaCronograma } from "@/lib/painel";
import { doisDigitos, statusEtapa } from "@/lib/rotulos";
import { useDica } from "./dica";
import { Legenda } from "./legenda";

const mesesCurtos = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Gantt de todos os projetos em andamento: uma linha por projeto, uma barra
// por etapa, na cor da situação; a linha de latão marca hoje.
export function Cronograma({ projetos }: { projetos: Projeto[] }) {
  const { estado } = useEstado();
  const { props, elemento } = useDica();
  const lista = ativos(projetos);
  const { inicio, dias } = janelaCronograma(projetos);
  const hoje = hojeIso();
  const pos = (d: string) => (diferencaDias(inicio, d) / dias) * 100;
  const nome = (p: Projeto) => {
    const c = estado.clientes.find((x) => x.id === p.clienteId);
    return c?.nomeFantasia || c?.razaoSocial || "Cliente";
  };

  // Marcas: início de cada semana (linha fina) e de cada mês (rótulo)
  const semanas: string[] = [];
  for (let d = inicio; diferencaDias(inicio, d) < dias; d = somarDias(d, 7)) semanas.push(d);
  const meses: string[] = [];
  for (let i = 0; i < dias; i++) {
    const d = somarDias(inicio, i);
    // O mês do começo da janela só ganha rótulo se não colar no do mês seguinte
    if (d.endsWith("-01") || (i === 0 && Number(d.slice(8)) <= 22)) meses.push(d);
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Eixo do tempo */}
        <div className="grid grid-cols-[11rem_1fr] gap-4">
          <span />
          <div className="relative h-10 border-b border-linha">
            {meses.map((m) => (
              <span key={m} className="absolute top-0 text-[13px] font-medium text-tinta" style={{ left: `${pos(m)}%` }}>
                {mesesCurtos[Number(m.slice(5, 7)) - 1]}
              </span>
            ))}
            {semanas.map((s) => (
              <span key={s} className="num absolute bottom-1.5 text-[11px] text-tinta-2" style={{ left: `calc(${pos(s)}% + 3px)` }}>
                {Number(s.slice(8))}
              </span>
            ))}
          </div>
        </div>

        <ul className="relative">
          {lista.map((p) => (
            <li key={p.id} className="grid grid-cols-[11rem_1fr] items-center gap-4 border-b border-linha/70 last:border-0">
              <Link href={`/${p.empresa}/projetos/${p.id}`} className="truncate py-3 text-sm text-tinta hover:text-garrafa hover:underline">
                {nome(p)}
              </Link>
              <div className="relative h-11">
                {semanas.map((s) => (
                  <span key={s} aria-hidden className="absolute inset-y-0 w-px bg-linha/60" style={{ left: `${pos(s)}%` }} />
                ))}
                {!p.planoFechadoEm ? (
                  <Link href={`/${p.empresa}/projetos/${p.id}#plano`} className="absolute inset-y-2 left-0 flex items-center text-[13px] text-tinta-2 hover:text-garrafa">
                    Sem plano de trabalho. Definir as datas
                  </Link>
                ) : (
                  p.etapas.map((e) => {
                    if (!e.dataInicio || !e.dataFim) return null;
                    const g = grupos[grupoDaEtapa(e, hoje)];
                    const largura = ((diferencaDias(e.dataInicio, e.dataFim) + 1) / dias) * 100;
                    return (
                      <Link
                        key={e.ordem}
                        href={`/${p.empresa}/projetos/${p.id}/etapas/${e.ordem}`}
                        aria-label={`${nome(p)}, etapa ${doisDigitos(e.ordem)}: ${statusEtapa[e.status].rotulo}, ${periodoCurto(e.dataInicio, e.dataFim)}`}
                        {...props(
                          <>
                            <span className="block font-medium">
                              {nome(p)}, etapa {doisDigitos(e.ordem)}
                            </span>
                            <span className="block text-folha/80">
                              {e.nome.charAt(0) + e.nome.slice(1).toLowerCase()}, {periodoCurto(e.dataInicio, e.dataFim)}
                            </span>
                            <span className="block text-folha/80">{statusEtapa[e.status].rotulo}</span>
                          </>,
                        )}
                        className="absolute top-2.5 flex h-6 items-center overflow-hidden rounded-[4px] px-1.5 text-[11px] font-medium outline-offset-1 hover:brightness-110"
                        style={{ left: `calc(${pos(e.dataInicio)}% + 1px)`, width: `calc(${largura}% - 2px)`, background: g.cor, color: g.texto }}
                      >
                        <span className="num">{largura > 2.4 ? doisDigitos(e.ordem) : ""}</span>
                      </Link>
                    );
                  })
                )}
              </div>
            </li>
          ))}
          {/* Hoje */}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-[calc(11rem+1rem)] right-0">
            <span className="absolute inset-y-0 w-[2px] bg-latao" style={{ left: `${((diferencaDias(inicio, hoje) + 0.5) / dias) * 100}%` }} />
          </span>
        </ul>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Legenda />
        <span className="flex items-center gap-2 text-[13px] text-tinta-2">
          <span aria-hidden className="h-3.5 w-[2px] bg-latao" />
          Hoje
        </span>
      </div>
      {elemento}
    </div>
  );
}
