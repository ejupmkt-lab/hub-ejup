"use client";

import Link from "next/link";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { aguardandoOutros, antesDaContratacao, comQuem, fases, faseDoProjeto, ondeEsta, ordemFases, comQuemTexto, type Fase } from "@/lib/fase";
import { grupoDaEtapa, grupos, ordemGrupos, type Grupo } from "@/lib/painel";
import { etapaAtrasada, etapaAtual, servicoDoProjeto, statusDaEtapa } from "@/lib/projeto";
import { statusEtapa } from "@/lib/rotulos";
import { nomeDoCliente } from "@/lib/campos-cliente";

// Quantos projetos em cada etapa do HUB, e quantos dependem de você ou de
// outros (gestor, FUNCERN, cliente). Cada serviço tem as suas etapas; a régua do HUB vale para todos.
export function FasesDosProjetos({ projetos }: { projetos: Projeto[] }) {
  const ativos = projetos.filter((p) => p.status !== "encerrado");
  const conta = (f: Fase) => ativos.filter((p) => faseDoProjeto(p) === f).length;
  const comVoce = (f: Fase) => ativos.filter((p) => faseDoProjeto(p) === f && comQuem(p) === "consultor").length;
  const etapas = ordemFases.filter((f) => f !== "concluido");
  const maior = Math.max(1, ...etapas.map(conta));
  const aguardando = ativos.filter(aguardandoOutros).length;
  if (!ativos.length) return <p className="text-sm text-tinta-2">Nenhum projeto em andamento.</p>;
  return (
    <div>
      <p className="num mb-4 text-[2rem] font-semibold leading-none text-tinta">
        {ativos.length - aguardando}{" "}
        <span className="text-base font-normal text-tinta-2">
          com você{aguardando ? `, ${aguardando} aguardando outros` : ""}
        </span>
      </p>
      <ul className="space-y-2.5">
        {etapas.map((f) => (
          <li key={f} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <span className="flex min-w-0 items-center gap-2 text-sm text-tinta">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: fases[f].cor }} />
              <span className="num">{fases[f].numero}</span> {fases[f].rotulo}
            </span>
            <span className="num text-sm font-semibold text-tinta">
              {conta(f)}
              {conta(f) > 0 && conta(f) !== comVoce(f) && <span className="font-normal text-tinta-2"> ({comVoce(f)} com você)</span>}
            </span>
            <span className="col-span-2 block h-1.5 rounded-full bg-pedra">
              <span className="block h-full rounded-full" style={{ width: `${(conta(f) / maior) * 100}%`, background: fases[f].cor }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Cada projeto numa linha: antes da execução (D ou P), as etapas do serviço,
// com a cor da situação de cada uma, e a finalização (F). Serviços com 2, 5 ou
// 8 etapas aparecem lado a lado.
export function EtapasDosProjetos({ projetos }: { projetos: Projeto[] }) {
  const { estado } = useEstado();
  const ativos = projetos.filter((p) => p.status !== "encerrado").sort((a, b) => ordemFase(a) - ordemFase(b) || nome(estado, a).localeCompare(nome(estado, b)));
  if (!ativos.length) return <p className="text-sm text-tinta-2">Nenhum projeto em andamento.</p>;
  const usados = new Set<Grupo>(ativos.flatMap((p) => (!antesDaContratacao(p) ? p.etapas.map((e) => grupoDaEtapa(e)) : ["nao_iniciada" as Grupo])));

  return (
    <div>
      <ul className="divide-y divide-linha">
        {ativos.map((p) => {
          const fase = faseDoProjeto(p);
          const antes = antesDaContratacao(p);
          const contratado = !antes;
          const et = etapaAtual(p);
          const detalhe = antes || fase === "finalizado"
            ? (comQuem(p) ? comQuemTexto(comQuem(p)!) : "")
            : et
              ? et.status === "devolvida"
                ? "devolvida pelo SEBRAE"
                : etapaAtrasada(et)
                  ? "atrasada"
                  : statusEtapa[statusDaEtapa(et)].rotulo.toLowerCase()
              : "finalize no HUB";
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
                  title={antes ? `${fases[fase].rotulo}: ${ondeEsta(p).toLowerCase()}` : "Diagnóstico e proposta: cliente pagou"}
                  className="num grid h-7 min-w-9 place-items-center rounded-[6px] px-1.5 text-[12px] font-bold"
                  style={contratado ? { background: grupos.concluida.cor, color: grupos.concluida.texto } : { background: fases[fase].cor, color: "#fff" }}
                >
                  {fase === "proposta" ? "P" : "D"}
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
                <li
                  title={fase === "finalizado" ? `Finalização: ${ondeEsta(p).toLowerCase()}` : "Finalização: avaliação do cliente e conclusão do gestor"}
                  className="num grid h-7 min-w-9 place-items-center rounded-[6px] px-1.5 text-[12px] font-bold"
                  style={fase === "finalizado" ? { background: fases.finalizado.cor, color: "#fff" } : { background: grupos.nao_iniciada.cor, color: grupos.nao_iniciada.texto }}
                >
                  F
                </li>
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
          <span
            aria-hidden
            className="num grid h-4 w-5 place-items-center rounded-[4px] text-[10px] font-bold text-folha"
            style={{ background: fases.proposta.cor }}
          >
            P
          </span>
          Diagnóstico e proposta
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="num grid h-4 w-5 place-items-center rounded-[4px] text-[10px] font-bold text-folha"
            style={{ background: fases.finalizado.cor }}
          >
            F
          </span>
          Finalização (avaliação e conclusão)
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

const ordemFase = (p: Projeto) => ordemFases.indexOf(faseDoProjeto(p));
function nome(estado: ReturnType<typeof useEstado>["estado"], p: Projeto) {
  const c = estado.clientes.find((x) => x.id === p.clienteId);
  return nomeDoCliente(c);
}
