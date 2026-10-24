"use client";

import { useState } from "react";
import type { Etapa, Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { novoId } from "@/lib/dados/store";
import { formatarData, hojeIso, periodoCurto } from "@/lib/datas";
import { antesDaContratacao } from "@/lib/fase";
import { etapaAtrasada, etapaConcluida, progressoAtividades, textoDoPrazo } from "@/lib/projeto";
import { bloqueioStatus } from "@/lib/regras-etapa";
import { relatorioFeitoFora, verificarCompletude } from "@/lib/relatorio/secoes";
import { doisDigitos } from "@/lib/rotulos";
import { Botao, Cartao } from "@/components/ui";
import { RelatorioAssinado } from "./assinado";
import { ImportarRelatorio } from "./importar-relatorio";
import { AssinaturaOnline } from "./assinatura-online";
import { useAcoesEtapa } from "./acoes-etapa";
import { useProjeto } from "./use-projeto";

// Situação de cada entrega, nas cores do Plano de Entrega do HUB
function situacao(p: Projeto, e: Etapa): { rotulo: string; texto: string; faixa: string } {
  if (antesDaContratacao(p)) return { rotulo: "Depois do pagamento", texto: "text-tinta-2", faixa: "bg-linha" };
  if (etapaConcluida(e)) return { rotulo: e.status === "aprovada" ? "Aprovada" : "Enviada", texto: "text-verde", faixa: "bg-verde-vivo" };
  if (e.status === "devolvida") return { rotulo: "Devolvida", texto: "text-vermelho", faixa: "bg-vermelho-vivo" };
  if (etapaAtrasada(e)) return { rotulo: "A enviar · atrasada", texto: "text-laranja", faixa: "bg-laranja-vivo" };
  return { rotulo: "A enviar", texto: "text-[#a16207]", faixa: "bg-[#d4a106]" };
}

// Entregas: os relatórios de cada etapa, como no Plano de Entrega do HUB. A
// elaboração é feita no Desenvolvimento; aqui ficam o relatório em Word, o PDF
// assinado e o registro do envio (ou da devolução pelo gestor).
export function Relatorios({ projeto, aoDesenvolver }: { projeto: Projeto; aoDesenvolver: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-tinta-2">
        Os relatórios de cada etapa, no modelo da ficha {projeto.codigoFichaTecnica}. Eles são escritos no{" "}
        <button type="button" onClick={aoDesenvolver} className="font-semibold text-azul hover:underline">
          Desenvolvimento
        </button>
        ; aqui você baixa o relatório em Word, anexa o PDF assinado no gov.br e registra o envio no Plano de Entrega do HUB.
      </p>
      <Cartao className="p-3 sm:p-4">
        <h2 className="px-1 pb-3 text-[17px] font-bold">Plano de Entrega</h2>
        <ol className="space-y-3">
          {projeto.etapas.map((e) => (
            <Entrega key={e.ordem} projeto={projeto} etapa={e} aoDesenvolver={aoDesenvolver} />
          ))}
        </ol>
      </Cartao>
    </div>
  );
}

function Entrega({ projeto, etapa: e, aoDesenvolver }: { projeto: Projeto; etapa: Etapa; aoDesenvolver: () => void }) {
  const { mudarStatus, baixar, gerando, alterarEtapa } = useAcoesEtapa();
  const { alterar } = useProjeto();
  const { estado } = useEstado();
  const [verPendencias, setVerPendencias] = useState(false);
  const [importando, setImportando] = useState(false);
  const sit = situacao(projeto, e);
  const antes = antesDaContratacao(projeto);
  const concluida = etapaConcluida(e);
  const prog = progressoAtividades(e);
  const pendencias = verificarCompletude(projeto, e);
  const feitoFora = relatorioFeitoFora(e);
  const bloqueioEnvio = bloqueioStatus(projeto, e, "enviada");
  const refsServico = estado.servicos.find((s) => s.id === projeto.modeloId)?.referencias ?? [];
  const semReferencias = pendencias.some((x) => x.onde === "Referências") && projeto.referencias.length === 0 && refsServico.length > 0;

  const usarReferenciasDoServico = () =>
    alterar((p) => void (p.referencias = refsServico.map((r) => ({ ...r, id: novoId("ref"), consultadoEm: r.url ? hojeIso() : "" }))), {
      acao: "Referências do serviço aplicadas ao projeto",
    });

  return (
    <li id={`entrega-${e.ordem}`} className="flex scroll-mt-6 overflow-hidden rounded-[var(--radius-campo)] border border-linha bg-folha">
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <h3 className="min-w-0 break-words text-[15px] font-bold uppercase tracking-wide text-tinta">
            Etapa {doisDigitos(e.ordem)} | {e.nome}
          </h3>
          <span className={`text-[14px] font-semibold ${sit.texto}`}>{sit.rotulo}</span>
        </div>
        {e.descricao && <p className="mt-1 line-clamp-3 text-sm text-tinta-2">{e.descricao}</p>}
        <p className="num mt-2 text-[13px] text-tinta-2">
          {periodoCurto(e.dataInicio, e.dataFim)} · {e.horasPrevistas} h · checklist {prog.feitas}/{prog.total}
          {!antes && textoDoPrazo(e) && <span className="font-semibold text-laranja"> · {textoDoPrazo(e)}</span>}
          {!concluida && !antes && (
            <>
              {" · "}
              {pendencias.length === 0 ? (
                <span className="text-verde">relatório completo</span>
              ) : (
                <button type="button" onClick={() => setVerPendencias(!verPendencias)} className="text-laranja underline-offset-4 hover:underline" aria-expanded={verPendencias}>
                  {pendencias.length === 1 ? "1 pendência no relatório" : `${pendencias.length} pendências no relatório`}
                </button>
              )}
            </>
          )}
        </p>

        {verPendencias && pendencias.length > 0 && (
          <div className="mt-2 rounded-[var(--radius-campo)] bg-pedra/70 px-3 py-2.5 text-[13px]">
            <ul className="space-y-1 text-tinta">
              {pendencias.slice(0, 8).map((x, i) => (
                <li key={i}>
                  <span className="text-tinta-2">{x.onde}:</span> {x.texto}
                </li>
              ))}
              {pendencias.length > 8 && <li className="text-tinta-2">e mais {pendencias.length - 8}</li>}
            </ul>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <button type="button" onClick={aoDesenvolver} className="font-semibold text-azul hover:underline">
                Resolver no Desenvolvimento
              </button>
              {!concluida && (
                <button type="button" onClick={() => (setVerPendencias(false), setImportando(true))} className="font-semibold text-azul hover:underline">
                  Fiz o relatório fora do sistema
                </button>
              )}
              {semReferencias && (
                <button type="button" onClick={usarReferenciasDoServico} className="font-semibold text-azul hover:underline">
                  Usar as referências do serviço
                </button>
              )}
            </p>
          </div>
        )}

        {!antes && (
          <div className="mt-3">
            <RelatorioAssinado projeto={projeto} etapa={e} alterarEtapa={alterarEtapa(e.ordem)} compacto />
            {!concluida && !feitoFora && <AssinaturaOnline projeto={projeto} etapa={e} alterarEtapa={alterarEtapa(e.ordem)} />}
          </div>
        )}

        {!antes && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!feitoFora && (
              <Botao variante="secundario" tamanho="pequeno" onClick={() => void baixar(e.ordem)} disabled={gerando === e.ordem}>
                {gerando === e.ordem ? "Gerando…" : "Baixar relatório em Word"}
              </Botao>
            )}
            {e.status === "devolvida" ? (
              <Botao tamanho="pequeno" onClick={() => mudarStatus(e.ordem, "em_redacao")}>
                Voltar a ajustar
              </Botao>
            ) : concluida ? (
              <Botao variante="fantasma" tamanho="pequeno" onClick={() => mudarStatus(e.ordem, "devolvida")} className="hover:!text-vermelho">
                O gestor devolveu
              </Botao>
            ) : (
              <Botao tamanho="pequeno" onClick={() => mudarStatus(e.ordem, "enviada")} disabled={!!bloqueioEnvio} title={bloqueioEnvio ?? undefined}>
                Enviei no HUB
              </Botao>
            )}
            {!concluida && e.status !== "devolvida" && bloqueioEnvio && <span className="text-[13px] text-tinta-2">{bloqueioEnvio}.</span>}
            {concluida && (
              <label className="flex items-center gap-2 text-[13px] text-tinta-2">
                Enviada em
                <input
                  type="date"
                  className="campo num !w-auto !py-1 !text-[13px]"
                  value={e.enviadaEm ?? ""}
                  max={hojeIso()}
                  onChange={(ev) => alterarEtapa(e.ordem)((x) => void (x.enviadaEm = ev.target.value || null), { acao: `Etapa ${doisDigitos(e.ordem)}: data do envio` })}
                />
              </label>
            )}
            {concluida && e.dataFim && <span className="num text-[13px] text-tinta-2">fim previsto {formatarData(e.dataFim)}</span>}
            {!concluida && !importando && (
              <button type="button" onClick={() => setImportando(true)} className="text-[13px] font-semibold text-azul hover:underline">
                Importar relatório pronto
              </button>
            )}
          </div>
        )}
        {importando && !concluida && (
          <ImportarRelatorio projeto={projeto} etapa={e} alterarEtapa={alterarEtapa(e.ordem)} aoFechar={() => setImportando(false)} />
        )}
        {feitoFora && <p className="mt-2 text-[13px] text-tinta-2">Relatório feito fora do sistema: o PDF assinado é o relatório desta etapa.</p>}
      </div>
      <span aria-hidden className={`w-2 shrink-0 ${sit.faixa}`} />
    </li>
  );
}
