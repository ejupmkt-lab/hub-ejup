"use client";

import { useState } from "react";
import type { Etapa, PassoHub, Projeto } from "@/lib/dados/tipos";
import { registrarEvento, useEstado } from "@/lib/dados/store";
import {
  antesDaContratacao,
  avisoFinalizarAntecipado,
  bloqueioHub,
  diasNoPasso,
  fases,
  hubDoProjeto,
  mudarHub,
  ordemFases,
  ordemPassos,
  passosDaFase,
  passosHub,
  proximoPassoHub,
  registroHub,
  responsaveis,
  tempoNoPasso,
  textoPlanoAjustado,
  type Fase,
} from "@/lib/fase";
import { entregaFinal, etapaAtrasada, etapaAtual, etapaConcluida, periodoEfetivo, statusDaEtapa } from "@/lib/projeto";
import { dataCurta, formatarData, hojeIso, periodoCurto } from "@/lib/datas";
import { statusEtapa } from "@/lib/rotulos";
import { Botao, Cartao, Chip } from "@/components/ui";
import { IconeCheck } from "@/components/icones";
import { useProjeto } from "./use-projeto";
import { PreencherComBiblioteca } from "./preencher-biblioteca";
import { guardarProjetoNaBiblioteca } from "./acoes-etapa";

type Estado = "feito" | "agora" | "pendente" | "alerta";
type Item = { chave: string; numero: number; rotulo: string; detalhe?: string; datas?: string[]; extra?: React.ReactNode; estado: Estado };

const corBarra: Record<Estado, string> = { feito: "bg-verde", agora: "bg-azul", alerta: "bg-laranja-vivo", pendente: "bg-linha" };
const corBola: Record<Estado, string> = {
  feito: "bg-verde text-folha",
  agora: "bg-azul text-folha",
  alerta: "bg-laranja-vivo text-folha",
  pendente: "bg-linha text-tinta-2",
};
const corTexto: Record<Estado, string> = { feito: "font-semibold text-tinta", agora: "font-bold text-azul", alerta: "font-bold text-laranja", pendente: "text-tinta-2" };

// Trilha de passos: em coluna no celular, em linha nas telas maiores
function Trilha({ itens, rotulo, numerada = true }: { itens: Item[]; rotulo: string; numerada?: boolean }) {
  return (
    <ol
      className="grid gap-2 sm:gap-1.5 sm:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
      style={{ "--n": itens.length } as React.CSSProperties}
      aria-label={rotulo}
    >
      {itens.map((x) => (
        <li key={x.chave} aria-current={x.estado === "agora" ? "step" : undefined} className="flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-1.5">
          <span className={`h-1.5 rounded-full max-sm:hidden ${corBarra[x.estado]}`} aria-hidden />
          <span className="flex items-center gap-2.5 sm:items-start">
            <span className={`num grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold sm:hidden ${corBola[x.estado]}`}>
              {x.estado === "feito" ? <IconeCheck className="h-3.5 w-3.5" /> : x.numero}
            </span>
            <span className="min-w-0">
              <span className={`block text-[14px] leading-snug ${corTexto[x.estado]}`}>
                {numerada && <span className="num max-sm:hidden">{x.numero} </span>}
                {x.rotulo}
              </span>
              {x.detalhe && <span className="num block text-[12px] leading-snug text-tinta-2">{x.detalhe}</span>}
              {x.datas?.map((d) => (
                <span key={d} className="num block text-[12px] leading-snug text-tinta-2">
                  {d}
                </span>
              ))}
              {x.extra}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

// Datas de cada relatório: o previsto no plano do HUB e, conforme a etapa anda,
// quando ela foi feita de fato
function datasDoRelatorio(p: Projeto, e: Etapa): string[] {
  const datas: string[] = [];
  const inicioPlano = e.dataInicioPlano ?? e.dataInicio;
  const fimPlano = e.dataFimPlano ?? e.dataFim;
  if (inicioPlano && fimPlano) datas.push(`Previsto ${periodoCurto(inicioPlano, fimPlano)}`);
  const feito = antesDaContratacao(p) ? null : periodoEfetivo(p, e);
  if (feito) datas.push(feito.fim ? `Realizado ${periodoCurto(feito.inicio, feito.fim)}` : `Em execução desde ${dataCurta(feito.inicio)}`);
  return datas;
}

// Relatório de cada etapa do serviço: enviado, em curso (com o status) ou não começado
function itemRelatorio(p: Projeto, e: Etapa, atual: Etapa | undefined): Item {
  const base = { chave: String(e.ordem), numero: e.ordem, rotulo: `Relatório ${e.ordem}`, datas: datasDoRelatorio(p, e) };
  const nome = capitalizar(e.nome);
  if (antesDaContratacao(p)) return { ...base, detalhe: nome, estado: "pendente" };
  if (etapaConcluida(e)) return { ...base, detalhe: `${nome} · enviado`, estado: "feito" };
  if (e.status === "devolvida") return { ...base, detalhe: `${nome} · devolvido`, estado: "alerta" };
  if (atual?.ordem === e.ordem)
    return {
      ...base,
      detalhe: `${nome} · ${etapaAtrasada(e) ? "atrasado" : statusEtapa[statusDaEtapa(e)].rotulo.toLowerCase()}`,
      estado: etapaAtrasada(e) ? "alerta" : "agora",
    };
  return { ...base, detalhe: nome, estado: "pendente" };
}

// O projeto no HUB SEBRAE (as 6 etapas do HUB) e, embaixo, os relatórios do
// serviço (tantos quantas as etapas da ficha). O passo atual diz com quem está
// a bola e há quantos dias; cada passo é registrado com a data.
export function LinhaDoHub({ projeto, aoAbrirPlano }: { projeto: Projeto; aoAbrirPlano: () => void }) {
  const { alterar, cliente } = useProjeto();
  const { estado } = useEstado();
  const [data, setData] = useState(hojeIso());
  const [perguntas, setPerguntas] = useState(false);
  const hub = hubDoProjeto(projeto);
  const passo = hub.passo;
  const info = passosHub[passo];
  const faseAtual = info.fase;
  const iFase = ordemFases.indexOf(faseAtual);
  const proximo = proximoPassoHub(projeto);
  const bloqueio = bloqueioHub(projeto);
  const dias = diasNoPasso(projeto);
  const atual = projeto.etapas.find((e) => e.status === "devolvida") ?? etapaAtual(projeto);
  const enviados = projeto.etapas.filter(etapaConcluida).length;
  const preDiagnostico = estado.servicos.find((s) => s.id === projeto.modeloId)?.preDiagnostico ?? [];
  const aviso = passo === "execucao" && !bloqueio ? avisoFinalizarAntecipado(projeto, data) : null;
  // Durante as etapas, o botão só aparece quando todas foram enviadas
  const mostrarAcao = !!proximo && !!info.acao && !(passo === "execucao" && bloqueio);

  const ir = (para: PassoHub, acao: string) => {
    if (para === "finalizado") {
      const cedo = avisoFinalizarAntecipado(projeto, data);
      if (cedo && !confirm(`${cedo}\n\nRegistrar a finalização mesmo assim?`)) return;
    }
    alterar(
      (p) => {
        const inicio = p.etapas[0]?.dataInicio;
        mudarHub(p, para, data);
        if (para === "execucao" && p.etapas[0]?.dataInicio !== inicio)
          registrarEvento(p, "Sistema", textoPlanoAjustado(p));
      },
      { acao: `HUB: ${acao}`, detalhe: registroHub[para](data) },
    );
    if (para === "concluido" && cliente) void guardarProjetoNaBiblioteca(projeto, cliente).then((erro) => erro && alert(erro));
  };
  const voltar = () => {
    const anterior = ordemPassos[ordemPassos.indexOf(passo) - 1];
    if (anterior) alterar((p) => mudarHub(p, anterior, data), { acao: "HUB: voltou um passo", detalhe: passosHub[anterior].rotulo });
  };

  // Data em que o projeto chegou a uma etapa do HUB (o primeiro passo dela com data)
  const chegada = (f: Fase) =>
    passosDaFase(f)
      .map((s) => hub.datas[s])
      .find(Boolean);

  const itensHub: Item[] = ordemFases.map((f, i) => {
    const feita = i < iFase || passo === "concluido";
    const agora = i === iFase && passo !== "concluido";
    return {
      chave: f,
      numero: fases[f].numero,
      rotulo: fases[f].rotulo,
      detalhe: (feita || agora) && chegada(f) ? `desde ${formatarData(chegada(f))}` : undefined,
      estado: feita ? "feito" : agora ? "agora" : "pendente",
    };
  });
  const itensRelatorios = projeto.etapas.map((e) => itemRelatorio(projeto, e, atual));
  const tituloPasso =
    passo === "execucao" || atual?.status === "devolvida"
      ? atual
        ? `Relatório ${atual.ordem} de ${projeto.etapas.length} · ${capitalizar(atual.nome)}`
        : "Todos os relatórios enviados"
      : info.rotulo;

  return (
    <Cartao className="mb-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold">No HUB SEBRAE</h2>
        <span className="text-sm text-tinta-2">
          Etapa {fases[faseAtual].numero} de 6 · {fases[faseAtual].rotulo}
        </span>
      </div>
      <div className="mt-4">
        <Trilha itens={itensHub} rotulo="Etapas no HUB" />
      </div>

      {/* Os relatórios do serviço: um por etapa da ficha */}
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold">Relatórios do serviço</h2>
        <span className="text-sm text-tinta-2">
          {antesDaContratacao(projeto)
            ? `${projeto.etapas.length} ${projeto.etapas.length === 1 ? "relatório" : "relatórios"} · começam depois do pagamento`
            : `${enviados} de ${projeto.etapas.length} ${enviados === 1 ? "enviado" : "enviados"}${entregaFinal(projeto) ? ` · fim previsto ${formatarData(entregaFinal(projeto))}` : ""}`}
        </span>
      </div>
      <div className="mt-4">
        <Trilha itens={itensRelatorios} rotulo="Relatórios do serviço" numerada={false} />
      </div>
      {passo === "execucao" && atual && <PreencherComBiblioteca projeto={projeto} etapa={atual} />}

      {/* O passo em que o projeto está */}
      {/* O passo do HUB em que o projeto está. Durante os relatórios, só aparece
          quando todos foram enviados (para registrar a finalização) */}
      {passo !== "concluido" && (passo !== "execucao" || mostrarAcao) && (
        <div className="mt-5 rounded-[var(--radius-campo)] border border-azul/25 bg-azul-claro/50 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-[15px] font-semibold text-tinta">{tituloPasso}</p>
            {info.com && <Chip tom={info.com === "consultor" ? "andamento" : "neutro"}>{responsaveis[info.com]}</Chip>}
            {dias !== null && passo !== "execucao" && (
              <span className={`num text-[13px] ${dias >= 10 && info.com !== "consultor" ? "font-semibold text-laranja" : "text-tinta-2"}`}>{tempoNoPasso(dias)}</span>
            )}
          </div>


          {/* Passos da etapa do HUB em que o projeto está */}
          {passosDaFase(faseAtual).length > 1 && (
            <ol className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]" aria-label="Passos desta etapa">
              {passosDaFase(faseAtual).map((s) => {
                const feito = ordemPassos.indexOf(s) < ordemPassos.indexOf(passo);
                return (
                  <li key={s} className={`flex items-center gap-1.5 ${s === passo ? "font-semibold text-azul" : feito ? "text-verde" : "text-tinta-2"}`}>
                    {feito ? <IconeCheck className="h-3.5 w-3.5" /> : <span aria-hidden className={`h-2 w-2 rounded-full ${s === passo ? "bg-azul" : "bg-linha-forte"}`} />}
                    {passosHub[s].rotulo}
                    {feito && hub.datas[s] && <span className="num font-normal text-tinta-2">{formatarData(hub.datas[s])}</span>}
                  </li>
                );
              })}
            </ol>
          )}

          {passo === "proposta_cliente" && projeto.planoFechadoEm && (
            <p className="mt-2 text-[13px] text-tinta-2">Quando o cliente pagar, a execução passa a começar na data do pagamento, com a mesma duração; o plano do HUB fica como foi orçado.</p>
          )}

          {aviso && <p className="mt-2 rounded-[var(--radius-campo)] bg-laranja-claro px-3 py-2 text-[13px] text-laranja">{aviso}</p>}

          {mostrarAcao && (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              {bloqueio ? (
                <p className="text-[13px] text-tinta-2">
                  {bloqueio}.{" "}
                  {passo === "proposta" && (
                    <button type="button" onClick={aoAbrirPlano} className="font-semibold text-azul hover:underline">
                      Abrir o plano de trabalho
                    </button>
                  )}
                </p>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-tinta-2">Data</span>
                    <input type="date" className="campo num !w-auto !py-1.5 !text-sm" value={data} max={hojeIso()} onChange={(e) => setData(e.target.value || hojeIso())} />
                  </label>
                  <Botao tamanho="pequeno" onClick={() => ir(proximo!, info.acao!)}>
                    {info.acao}
                  </Botao>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {ordemPassos.indexOf(passo) > 0 ? (
          <button type="button" onClick={voltar} className="text-[13px] text-tinta-2 underline-offset-4 hover:text-tinta hover:underline">
            Voltar um passo
          </button>
        ) : (
          <span />
        )}
        {faseAtual === "diagnostico" && preDiagnostico.length > 0 && (
          <button type="button" onClick={() => setPerguntas(!perguntas)} className="text-[13px] font-semibold text-azul hover:underline" aria-expanded={perguntas}>
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
