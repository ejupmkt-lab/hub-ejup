"use client";

import Link from "next/link";
import { useState } from "react";
import { useEstado } from "@/lib/dados/store";
import type { Etapa, Projeto } from "@/lib/dados/tipos";
import { formatarData } from "@/lib/datas";
import { tarefasPendentes } from "@/lib/tarefas";
import { automatizarEtapa } from "@/lib/regras-etapa";
import { pendenciasDoGrupo } from "@/lib/painel";
import { doisDigitos } from "@/lib/rotulos";
import { Cabecalho, Cartao, Chip, Indicador, Segmentos, Vazio } from "@/components/ui";
import { Pendencias } from "@/components/painel/pendencias";
import { IconeSeta } from "@/components/icones";

type Filtro = "todas" | "atrasadas";
const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

// Tarefas do plano de trabalho de todos os projetos: as atividades do
// checklist ainda pendentes nas etapas em curso, marcáveis aqui mesmo.
export default function Tarefas() {
  const { estado, atualizar } = useEstado();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  // Marcadas nesta visita continuam à vista (riscadas) para dar para desfazer
  const [recentes, setRecentes] = useState<Set<string>>(new Set());

  const tarefas = tarefasPendentes(estado.projetos);
  const atrasadas = tarefas.filter((t) => t.atrasada).length;
  const entregas = pendenciasDoGrupo(estado.projetos).filter((x) => x.grupo !== "andamento" && x.grupo !== "nao_iniciada").length;
  const chave = (p: Projeto, e: Etapa, i: number) => `${p.id}:${e.ordem}:${i}`;

  // Grupos projeto + etapa, os atrasados primeiro
  const grupos = new Map<string, { projeto: Projeto; etapa: Etapa; atrasada: boolean }>();
  for (const t of tarefas) grupos.set(`${t.projeto.id}:${t.etapa.ordem}`, { projeto: t.projeto, etapa: t.etapa, atrasada: t.atrasada });
  for (const k of recentes) {
    const [id, ordem] = k.split(":");
    const projeto = estado.projetos.find((p) => p.id === id);
    const etapa = projeto?.etapas.find((e) => e.ordem === Number(ordem));
    if (projeto && etapa && !grupos.has(`${id}:${ordem}`)) grupos.set(`${id}:${ordem}`, { projeto, etapa, atrasada: false });
  }
  const lista = [...grupos.values()]
    .filter((g) => filtro === "todas" || g.atrasada)
    .sort((a, b) => Number(b.atrasada) - Number(a.atrasada) || (a.etapa.dataFim ?? "9").localeCompare(b.etapa.dataFim ?? "9"));

  const nome = (p: Projeto) => {
    const c = estado.clientes.find((x) => x.id === p.clienteId);
    return c?.nomeFantasia || c?.razaoSocial || "Cliente";
  };

  const marcar = (p: Projeto, e: Etapa, indice: number, feito: boolean) => {
    const k = chave(p, e, indice);
    setRecentes((r) => {
      const n = new Set(r);
      if (feito) n.add(k);
      else n.delete(k);
      return n;
    });
    atualizar((r) => {
      const proj = r.projetos.find((x) => x.id === p.id);
      const et = proj?.etapas.find((x) => x.ordem === e.ordem);
      if (!proj || !et) return;
      et.atividades[indice].status = feito ? "feito" : "pendente";
      automatizarEtapa(proj, et);
    });
  };

  return (
    <>
      <Cabecalho titulo="Tarefas" subtitulo="As atividades do plano de trabalho ainda pendentes nas etapas em curso" />

      <section aria-label="Resumo" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Indicador rotulo="Tarefas pendentes" valor={tarefas.length} detalhe="no checklist das etapas em curso" />
        <Indicador
          rotulo="Atrasadas"
          valor={atrasadas}
          detalhe={atrasadas ? "de etapas com o prazo vencido" : "nenhuma fora do prazo"}
          tom={atrasadas ? "atencao" : undefined}
        />
        <div className="col-span-2 lg:col-span-1">
          <Indicador
            rotulo="Entregas pedindo ação"
            valor={entregas}
            detalhe="devoluções, atrasos e relatórios prontos para enviar"
            tom={entregas ? "atencao" : undefined}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          <Segmentos
            rotulo="Filtrar tarefas"
            atual={filtro}
            aoTrocar={setFiltro}
            opcoes={[
              { valor: "todas", rotulo: `Todas (${tarefas.length})` },
              { valor: "atrasadas", rotulo: `Atrasadas (${atrasadas})` },
            ]}
          />

          {lista.length === 0 ? (
            <Vazio titulo={filtro === "atrasadas" ? "Nenhuma tarefa atrasada" : "Nenhuma tarefa pendente"}>
              {filtro === "atrasadas"
                ? "Todas as tarefas pendentes estão dentro do prazo das etapas."
                : "O checklist das etapas em curso está completo. As próximas tarefas aparecem quando cada etapa começar."}
            </Vazio>
          ) : (
            lista.map(({ projeto: p, etapa: e, atrasada }) => {
              const itens = e.atividades.map((a, i) => ({ a, i })).filter(({ a, i }) => a.status === "pendente" || recentes.has(chave(p, e, i)));
              const feitas = e.atividades.filter((a) => a.status !== "pendente").length;
              return (
                <Cartao key={`${p.id}:${e.ordem}`} className={`overflow-hidden border-l-4 ${atrasada ? "border-l-laranja-vivo" : "border-l-azul"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-linha px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="break-words text-[15px] font-bold text-tinta">{nome(p)}</p>
                      <p className="num text-[13px] text-tinta-2">
                        Etapa {doisDigitos(e.ordem)} {capitalizar(e.nome)} · {feitas} de {e.atividades.length} feitas
                        {e.dataFim && ` · prazo ${formatarData(e.dataFim)}`}
                      </p>
                    </div>
                    {atrasada && <Chip tom="atencao">Atrasada</Chip>}
                  </div>
                  <ul className="divide-y divide-linha">
                    {itens.map(({ a, i }) => {
                      const feito = a.status !== "pendente";
                      return (
                        <li key={a.codigo} className={a.nivel > 1 ? "pl-6 sm:pl-8" : ""}>
                          <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-pedra/60 sm:px-5">
                            <input
                              type="checkbox"
                              checked={feito}
                              onChange={(ev) => marcar(p, e, i, ev.target.checked)}
                              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--color-azul)]"
                            />
                            <span className={`min-w-0 text-[15px] leading-snug ${feito ? "text-tinta-2 line-through" : "text-tinta"}`}>
                              <span className="num mr-1.5 font-semibold">{a.codigo}</span>
                              {a.texto}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-linha px-4 py-2.5 sm:px-5">
                    <Link
                      href={`/${p.empresa}/projetos/${p.id}/etapas/${e.ordem}#checklist`}
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-azul hover:underline"
                    >
                      Abrir o checklist da etapa (para marcar &ldquo;não se aplica&rdquo;)
                      <IconeSeta className="h-4 w-4" />
                    </Link>
                  </div>
                </Cartao>
              );
            })
          )}
        </div>

        <aside className="min-w-0">
          <Cartao className="p-4 sm:p-5 lg:sticky lg:top-6">
            <h2 className="text-[17px] font-bold">Entregas</h2>
            <p className="mt-0.5 text-sm text-tinta-2">Devoluções, atrasos, envios e prazos da semana.</p>
            <div className="mt-4">
              <Pendencias projetos={estado.projetos} />
            </div>
          </Cartao>
        </aside>
      </div>
    </>
  );
}
