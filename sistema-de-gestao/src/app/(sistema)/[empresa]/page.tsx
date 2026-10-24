"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useEstado } from "@/lib/dados/store";
import type { Projeto } from "@/lib/dados/tipos";
import { formatarData } from "@/lib/datas";
import {
  codigoHub,
  alertasDoProjeto,
  avancoProjeto,
  entregaFinal,
  etapasAtrasadas,
  etapaAtual,
  previstoProjeto,
  servicoDoProjeto,
  situacaoProjeto,
} from "@/lib/projeto";
import { doisDigitos } from "@/lib/rotulos";
import { aguardandoOutros, comQuem, diasNoPasso, faseDoProjeto, fases, ondeEsta, ordemFases, responsaveis, tempoNoPasso } from "@/lib/fase";
import { Barra, BotaoLink, Cartao, Cabecalho, Status, Segmentos, Vazio, corTom } from "@/components/ui";
import { Cronograma } from "@/components/painel/cronograma";
import { CartaoProjeto } from "@/components/cartao-projeto";
import { Calendario } from "@/components/painel/calendario";
import { IconeBusca, IconeCalendario, IconeCronograma, IconeLista, IconeMaisSinal, IconeQuadro } from "@/components/icones";
import { nomeDoCliente } from "@/lib/campos-cliente";

const situacoes = {
  andamento: "Ativos",
  comigo: "Comigo",
  aguardando: "Aguardando outros",
  atrasados: "Atrasados",
  todos: "Todos",
} as const;
// "encerrados" é a aba dos projetos finalizados (concluídos no HUB), fora da lista de situações
type Situacao = keyof typeof situacoes | "encerrados";

const ordens = { urgencia: "Por urgência", nome: "Por nome", entrega: "Por entrega", avanco: "Por avanço" } as const;
type Ordem = keyof typeof ordens;

type Visao = "lista" | "quadro" | "cronograma" | "calendario";
const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function Projetos() {
  const { empresa: slug } = useParams<{ empresa: string }>();
  const { estado } = useEstado();
  const empresa = estado.empresas.find((e) => e.slug === slug)!;
  const [visao, setVisao] = useState<Visao>("lista");
  const [situacao, setSituacao] = useState<Situacao>("andamento");
  const [ordem, setOrdem] = useState<Ordem>("urgencia");
  const [busca, setBusca] = useState("");

  const daEmpresa = estado.projetos.filter((p) => p.empresa === slug);
  const cliente = (p: Projeto) => estado.clientes.find((c) => c.id === p.clienteId);
  const nome = (p: Projeto) => nomeDoCliente(cliente(p));
  const passa = (p: Projeto, s: Situacao) =>
    s === "todos" ||
    (s === "andamento" && p.status !== "encerrado") ||
    (s === "atrasados" && p.status !== "encerrado" && (etapasAtrasadas(p).length > 0 || p.etapas.some((e) => e.status === "devolvida"))) ||
    (s === "comigo" && p.status !== "encerrado" && comQuem(p) === "consultor") ||
    (s === "aguardando" && aguardandoOutros(p)) ||
    (s === "encerrados" && p.status === "encerrado");
  const finalizados = daEmpresa.filter((p) => p.status === "encerrado").length;
  const emAndamento = daEmpresa.length - finalizados;
  const aba: "andamento" | "finalizados" = situacao === "encerrados" ? "finalizados" : "andamento";
  const termo = busca.trim().toLowerCase();
  const urgencia = (p: Projeto) => Math.min(9, ...alertasDoProjeto(p).map((a) => a.ordem));
  const projetos = daEmpresa
    .filter((p) => passa(p, situacao))
    .filter((p) => !termo || `${cliente(p)?.razaoSocial} ${cliente(p)?.nomeFantasia} ${codigoHub(p)}`.toLowerCase().includes(termo))
    .sort((a, b) =>
      ordem === "nome"
        ? nome(a).localeCompare(nome(b))
        : ordem === "entrega"
          ? (entregaFinal(a) ?? "9").localeCompare(entregaFinal(b) ?? "9")
          : ordem === "avanco"
            ? avancoProjeto(a) - avancoProjeto(b)
            : urgencia(a) - urgencia(b),
    );

  return (
    <>
      <Cabecalho titulo="Projetos" subtitulo={`${empresa.nome} · ${emAndamento} em andamento${finalizados ? ` · ${finalizados} ${finalizados === 1 ? "finalizado" : "finalizados"}` : ""}`}>
        <BotaoLink href={`/${slug}/projetos/novo`} className="w-full sm:w-auto">
          <IconeMaisSinal className="h-4 w-4" />
          Novo projeto
        </BotaoLink>
      </Cabecalho>

      {daEmpresa.length === 0 ? (
        <Vazio titulo="Nenhum projeto ainda" acao={<BotaoLink href={`/${slug}/projetos/novo`}>Criar o primeiro projeto</BotaoLink>}>
          Cada contratação do HUB SEBRAE vira um projeto, com as cinco etapas da ficha 13070-5, o checklist e o relatório de cada entrega.
        </Vazio>
      ) : (
        <div className="space-y-4">
          <Segmentos
            rotulo="Projetos"
            atual={aba}
            aoTrocar={(v) => setSituacao(v === "finalizados" ? "encerrados" : "andamento")}
            opcoes={[
              { valor: "andamento", rotulo: `Em andamento (${emAndamento})` },
              { valor: "finalizados", rotulo: `Finalizados (${finalizados})` },
            ]}
          />

          <Segmentos
            rotulo="Visão"
            atual={visao}
            aoTrocar={setVisao}
            opcoes={[
              { valor: "lista", rotulo: "Lista", icone: <IconeLista className="h-5 w-5" /> },
              { valor: "quadro", rotulo: "Quadro", icone: <IconeQuadro className="h-5 w-5" /> },
              { valor: "cronograma", rotulo: "Plano de trabalho", icone: <IconeCronograma className="h-5 w-5" /> },
              { valor: "calendario", rotulo: "Calendário", icone: <IconeCalendario className="h-5 w-5" /> },
            ]}
          />

          <Cartao className={`grid grid-cols-2 gap-2 p-2 ${aba === "andamento" ? "sm:grid-cols-[minmax(0,13rem)_minmax(0,13rem)_1fr]" : "sm:grid-cols-[minmax(0,13rem)_1fr]"}`}>
            {aba === "andamento" && (
              <label className="min-w-0">
                <span className="sr-only">Situação</span>
                <select
                  className="campo !pl-2.5 !pr-7 !text-sm sm:!pl-3 sm:!text-[15px]"
                  value={situacao}
                  onChange={(e) => setSituacao(e.target.value as Situacao)}
                >
                  {(Object.keys(situacoes) as (keyof typeof situacoes)[]).map((s) => (
                    <option key={s} value={s}>
                      {situacoes[s]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="min-w-0">
              <span className="sr-only">Ordenar</span>
              <select className="campo !pl-2.5 !pr-7 !text-sm sm:!pl-3 sm:!text-[15px]" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)}>
                {(Object.keys(ordens) as Ordem[]).map((o) => (
                  <option key={o} value={o}>
                    {ordens[o]}
                  </option>
                ))}
              </select>
            </label>
            <label className="relative col-span-2 min-w-0 sm:col-span-1">
              <span className="sr-only">Buscar projetos</span>
              <IconeBusca className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta-2" />
              <input
                type="search"
                placeholder="Buscar cliente ou nº do projeto"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="campo !pl-10"
              />
            </label>
          </Cartao>

          {projetos.length === 0 ? (
            <p className="rounded-[var(--radius-bloco)] border border-dashed border-linha-forte py-10 text-center text-[15px] text-tinta-2">
              {aba === "finalizados" ? "Nenhum projeto finalizado ainda. Os projetos concluídos no HUB ficam aqui." : "Nenhum projeto nesta busca ou situação."}
              {aba === "andamento" && !termo && finalizados > 0 && situacao === "andamento" && (
                <button type="button" className="ml-1 font-semibold text-azul underline-offset-4 hover:underline" onClick={() => setSituacao("encerrados")}>
                  Ver os {finalizados} finalizados
                </button>
              )}
            </p>
          ) : visao === "lista" ? (
            <Lista projetos={projetos} nome={nome} />
          ) : visao === "quadro" ? (
            <Quadro projetos={projetos} nome={nome} />
          ) : visao === "cronograma" ? (
            <Cartao className="p-4 sm:p-5">
              <p className="mb-4 text-sm text-tinta-2">
                Cada linha é um projeto; cada barra, uma etapa no período do plano de trabalho. Toque numa barra para abrir a etapa.
              </p>
              <Cronograma projetos={projetos} />
            </Cartao>
          ) : (
            <Cartao className="p-4 sm:p-5">
              <Calendario projetos={projetos} />
            </Cartao>
          )}
        </div>
      )}
    </>
  );
}

// Lista: tabela nas telas largas; nas menores, os mesmos cartões do painel
function Lista({ projetos, nome }: { projetos: Projeto[]; nome: (p: Projeto) => string }) {
  const colunas = "grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_10rem_6.5rem_12rem] items-center gap-5";
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:hidden">
        {projetos.map((p) => (
          <CartaoProjeto key={p.id} projeto={p} />
        ))}
      </div>
      <Cartao className="hidden overflow-hidden xl:block">
        <div className={`border-b border-linha bg-pedra/60 px-5 py-2.5 text-[13px] font-semibold text-tinta-2 ${colunas}`}>
          <span>Cliente / projeto</span>
          <span>Etapa atual</span>
          <span>Progresso</span>
          <span>Entrega</span>
          <span>Situação</span>
        </div>
        <ul className="divide-y divide-linha">
          {projetos.map((p) => {
            const et = etapaAtual(p);
            const avanco = avancoProjeto(p);
            const previsto = previstoProjeto(p);
            const sit = situacaoProjeto(p);
            const entrega = entregaFinal(p);
            const atrasada = et && (et.status === "devolvida" || etapasAtrasadas(p).some((x) => x.ordem === et.ordem));
            return (
              <li key={p.id} className="relative">
                <div className={`px-5 py-4 hover:bg-pedra/50 ${colunas}`}>
                  <div className="min-w-0">
                    <Link
                      href={`/${p.empresa}/projetos/${p.id}`}
                      className="break-words text-[15px] font-bold text-tinta after:absolute after:inset-0 after:content-[''] hover:text-azul"
                    >
                      {nome(p)}
                    </Link>
                    <p className="num break-words text-[13px] text-tinta-2">
                      {servicoDoProjeto(p)} · HUB {codigoHub(p) || "sem número"}
                    </p>
                  </div>
                  <p className="flex min-w-0 items-start gap-2 text-sm text-tinta">
                    <span
                      aria-hidden
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${atrasada ? corTom[sit.tom].ponto : et ? "bg-azul" : "bg-verde-vivo"}`}
                    />
                    <span className="min-w-0">{et ? `${doisDigitos(et.ordem)} ${capitalizar(et.nome)}` : "Todas enviadas"}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="flex-1">
                      <Barra valor={avanco} total={100} marca={previsto} />
                    </span>
                    <span className="num w-10 shrink-0 text-right text-sm font-semibold">{avanco}%</span>
                  </div>
                  <p className="num text-sm text-tinta">{entrega ? formatarData(entrega) : "—"}</p>
                  <div>
                    <Status tom={sit.tom}>{sit.rotulo}</Status>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Cartao>
    </>
  );
}

// Quadro: uma coluna para cada etapa do HUB SEBRAE, como no próprio HUB. Cada
// cartão diz o passo (ou a etapa do serviço), com quem está e há quantos dias.
// No celular as colunas ficam empilhadas; nas telas maiores, lado a lado.
function Quadro({ projetos, nome }: { projetos: Projeto[]; nome: (p: Projeto) => string }) {
  const coluna = (p: Projeto) => faseDoProjeto(p);
  const colunas = ordemFases.map((f) => ({ id: f, titulo: `${fases[f].numero} ${fases[f].rotulo}` }));

  return (
    <div className="md:overflow-x-auto md:pb-2">
      <div className="flex flex-col gap-3 md:flex-row">
        {colunas.map((col) => {
          const lista = projetos.filter((p) => coluna(p) === col.id);
          return (
            <section key={col.id} className="rounded-[var(--radius-bloco)] bg-linha/50 p-2 md:w-[16.5rem] md:shrink-0">
              <h2 className="flex items-center justify-between gap-2 px-2 pb-2 pt-1 text-sm font-bold text-tinta">
                <span className="min-w-0 break-words">{col.titulo}</span>
                <span className="num rounded-full bg-folha px-2 py-0.5 text-[12px] font-semibold text-tinta-2">{lista.length}</span>
              </h2>
              <ul className="space-y-2">
                {lista.map((p) => {
                  const sit = situacaoProjeto(p);
                  const avanco = avancoProjeto(p);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/${p.empresa}/projetos/${p.id}`}
                        className={`block rounded-[var(--radius-campo)] border border-l-4 border-linha bg-folha p-3 shadow-[var(--shadow-cartao)] hover:border-azul/40 ${corTom[sit.tom].borda}`}
                      >
                        <span className="block break-words text-[15px] font-bold text-tinta">{nome(p)}</span>
                        <span className="block text-[13px] text-tinta-2">{servicoDoProjeto(p)}</span>
                        {faseDoProjeto(p) === "execucao" && etapaAtual(p) ? (
                          <span className="mt-1 block break-words text-[13px] text-tinta">
                            {capitalizar(etapaAtual(p)!.nome)}, {etapaAtual(p)!.ordem} de {p.etapas.length}
                          </span>
                        ) : (
                          p.status !== "encerrado" && <span className="mt-1 block break-words text-[13px] text-tinta">{ondeEsta(p)}</span>
                        )}
                        {comQuem(p) && comQuem(p) !== "consultor" && (
                          <span className="num mt-0.5 block text-[12px] text-tinta-2">
                            {responsaveis[comQuem(p)!]}
                            {diasNoPasso(p) !== null && ` · ${tempoNoPasso(diasNoPasso(p)!)}`}
                          </span>
                        )}
                        <span className="mt-2 flex items-center gap-2">
                          <span className="flex-1">
                            <Barra valor={avanco} total={100} marca={previstoProjeto(p)} />
                          </span>
                          <span className="num text-[13px] font-semibold">{avanco}%</span>
                        </span>
                        <span className="mt-2 block">
                          <Status tom={sit.tom}>{sit.rotulo}</Status>
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {lista.length === 0 && <li className="px-2 py-3 text-[13px] text-tinta-2">Nenhum projeto</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
