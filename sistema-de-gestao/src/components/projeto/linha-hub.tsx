"use client";

import { useState } from "react";
import type { PassoHub, Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import {
  avisoFinalizarAntecipado,
  avisoPagamentoTardio,
  bloqueioHub,
  diasNoPasso,
  fases,
  hubDoProjeto,
  mudarHub,
  ondeEsta,
  ordemFases,
  ordemPassos,
  passosDaFase,
  passosHub,
  proximoPassoHub,
  registroHub,
  responsaveis,
  tempoNoPasso,
  type Fase,
} from "@/lib/fase";
import { entregaFinal } from "@/lib/projeto";
import { formatarData, hojeIso } from "@/lib/datas";
import { Botao, Cartao, Chip } from "@/components/ui";
import { IconeCheck } from "@/components/icones";
import { useProjeto } from "./use-projeto";
import { guardarProjetoNaBiblioteca } from "./sugestoes-biblioteca";

// Linha do tempo do projeto no HUB SEBRAE: as 6 etapas do HUB, o passo em que
// o projeto está, com quem está a bola e há quantos dias. Cada passo é
// registrado com a data; dá para voltar um passo.
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
  const preDiagnostico = estado.servicos.find((s) => s.id === projeto.modeloId)?.preDiagnostico ?? [];
  const avisos = [passo === "execucao" ? avisoPagamentoTardio(projeto) : null, passo === "execucao" && !bloqueio ? avisoFinalizarAntecipado(projeto, data) : null].filter(
    (a): a is string => !!a,
  );
  // Durante as etapas, o botão só aparece quando todas foram enviadas
  const mostrarAcao = !!proximo && !!info.acao && !(passo === "execucao" && bloqueio);

  const ir = (para: PassoHub, acao: string) => {
    if (para === "finalizado") {
      const cedo = avisoFinalizarAntecipado(projeto, data);
      if (cedo && !confirm(`${cedo}\n\nRegistrar a finalização mesmo assim?`)) return;
    }
    alterar((p) => mudarHub(p, para, data), { acao: `HUB: ${acao}`, detalhe: registroHub[para](data) });
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

  return (
    <Cartao className="mb-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-bold">No HUB SEBRAE</h2>
        <span className="text-sm text-tinta-2">
          Etapa {fases[faseAtual].numero} de 6 · {fases[faseAtual].rotulo}
        </span>
      </div>

      {/* As 6 etapas do HUB: em coluna no celular, em linha nas telas maiores */}
      <ol className="mt-4 grid gap-2 sm:grid-cols-6 sm:gap-1.5" aria-label="Etapas no HUB">
        {ordemFases.map((f, i) => {
          const feita = i < iFase || passo === "concluido";
          const agora = i === iFase && passo !== "concluido";
          return (
            <li key={f} aria-current={agora ? "step" : undefined} className="flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-1.5">
              <span
                className={`h-1.5 rounded-full max-sm:hidden ${feita ? "bg-verde" : agora ? "bg-azul" : "bg-linha"}`}
                aria-hidden
              />
              <span className="flex items-center gap-2.5 sm:items-start">
                <span
                  className={`num grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold sm:hidden ${
                    feita ? "bg-verde text-folha" : agora ? "bg-azul text-folha" : "bg-linha text-tinta-2"
                  }`}
                >
                  {feita ? <IconeCheck className="h-3.5 w-3.5" /> : fases[f].numero}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[14px] leading-snug ${agora ? "font-bold text-azul" : feita ? "font-semibold text-tinta" : "text-tinta-2"}`}>
                    <span className="num max-sm:hidden">{fases[f].numero} </span>
                    {fases[f].rotulo}
                  </span>
                  {(feita || agora) && chegada(f) && <span className="num block text-[12px] text-tinta-2">desde {formatarData(chegada(f))}</span>}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* O passo em que o projeto está */}
      {passo !== "concluido" && (
        <div className="mt-4 rounded-[var(--radius-campo)] border border-azul/25 bg-azul-claro/50 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-[15px] font-semibold text-tinta">{passo === "execucao" ? ondeEsta(projeto) : info.rotulo}</p>
            {info.com && <Chip tom={info.com === "consultor" ? "andamento" : "neutro"}>{responsaveis[info.com]}</Chip>}
            {dias !== null && (
              <span className={`num text-[13px] ${dias >= 10 && info.com !== "consultor" ? "font-semibold text-laranja" : "text-tinta-2"}`}>
                {tempoNoPasso(dias)}
              </span>
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

          {passo === "execucao" && entregaFinal(projeto) && (
            <p className="num mt-2 text-[13px] text-tinta-2">
              Fim previsto no plano de trabalho: <span className="font-semibold text-tinta">{formatarData(entregaFinal(projeto))}</span>. As datas do plano são as
              oficiais: não envie a última etapa antes disso.
            </p>
          )}

          {avisos.map((a) => (
            <p key={a} className="mt-2 rounded-[var(--radius-campo)] bg-laranja-claro px-3 py-2 text-[13px] text-laranja">
              {a}
            </p>
          ))}

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
