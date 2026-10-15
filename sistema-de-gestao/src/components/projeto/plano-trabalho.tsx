"use client";

import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { formatarData, hojeIso, sugerirDatas } from "@/lib/datas";
import { doisDigitos } from "@/lib/rotulos";
import { Botao, Campo, Status } from "@/components/ui";
import { useProjeto } from "./use-projeto";
import { automatizarEtapa } from "@/lib/regras-etapa";

type Linha = { inicio: string; fim: string };

function validar(linhas: Linha[]) {
  const erros: string[] = [];
  linhas.forEach((l, i) => {
    const n = `Etapa ${doisDigitos(i + 1)}`;
    if (!l.inicio || !l.fim) erros.push(`${n}: informe início e fim`);
    else if (l.fim < l.inicio) erros.push(`${n}: fim antes do início`);
    if (i > 0 && l.inicio && linhas[i - 1].fim && l.inicio <= linhas[i - 1].fim) erros.push(`${n}: começa antes do fim da etapa anterior`);
  });
  return erros;
}

export function PlanoTrabalho({ projeto }: { projeto: Projeto }) {
  const { alterar } = useProjeto();
  const fechado = !!projeto.planoFechadoEm;
  const [editando, setEditando] = useState(!fechado);
  const [inicio, setInicio] = useState(projeto.etapas[0].dataInicio ?? hojeIso());
  const [linhas, setLinhas] = useState<Linha[]>(projeto.etapas.map((e) => ({ inicio: e.dataInicio ?? "", fim: e.dataFim ?? "" })));
  const [justificativa, setJustificativa] = useState("");
  const erros = validar(linhas);

  const sugerir = () => setLinhas(sugerirDatas(inicio, projeto.etapas.map((e) => e.duracaoReferenciaDias)));
  const setLinha = (i: number, k: keyof Linha, v: string) => setLinhas(linhas.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  const fechar = () => {
    alterar(
      (p) => {
        p.etapas.forEach((e, i) => {
          e.dataInicio = e.dataInicioPlano = linhas[i].inicio;
          e.dataFim = e.dataFimPlano = linhas[i].fim;
          e.dataRelatorio ??= linhas[i].fim; // local e data do relatório: o fim da etapa, ajustável
        });
        p.planoFechadoEm = new Date().toISOString().slice(0, 19);
        p.status = "em_andamento";
        // Checklist já marcado antes do plano: aplica os avanços automáticos
        p.etapas.forEach((e) => automatizarEtapa(p, e));
      },
      { acao: "Plano de trabalho fechado" },
    );
    setEditando(false);
  };

  const salvarAlteracao = () => {
    const mudancas = projeto.etapas
      .map((e, i) =>
        e.dataInicio !== linhas[i].inicio || e.dataFim !== linhas[i].fim
          ? `Etapa ${doisDigitos(e.ordem)}: ${formatarData(e.dataInicio)}–${formatarData(e.dataFim)} → ${formatarData(linhas[i].inicio)}–${formatarData(linhas[i].fim)}`
          : null,
      )
      .filter(Boolean)
      .join("; ");
    alterar(
      (p) =>
        p.etapas.forEach((e, i) => {
          if (e.dataRelatorio === e.dataFim) e.dataRelatorio = linhas[i].fim; // acompanha o novo fim, se não foi mudada à mão
          e.dataInicio = linhas[i].inicio;
          e.dataFim = linhas[i].fim;
        }),
      { acao: "Datas do plano alteradas", detalhe: `${mudancas}. Justificativa: ${justificativa}` },
    );
    setJustificativa("");
    setEditando(false);
  };

  return (
    <section className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-6 sm:p-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Plano de trabalho</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-tinta-2">
            Registro interno: o gestor define as datas de cada etapa depois da contratação. Não é enviado ao SEBRAE nem ao cliente. As datas fechadas aqui são a base dos prazos e avisos.
          </p>
        </div>
        {fechado ? <Status tom="ok">Fechado em {formatarData(projeto.planoFechadoEm!.slice(0, 10))}</Status> : <Status tom="atencao">Ainda não fechado</Status>}
      </div>

      {editando && !fechado && (
        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-[var(--radius-bloco)] bg-pedra/60 p-5">
          <Campo rotulo="Início da Etapa 01">
            <input type="date" className="campo" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </Campo>
          <Botao variante="secundario" onClick={sugerir}>Sugerir datas</Botao>
          <span className="text-[13px] text-tinta-2">Usa a duração de referência de cada etapa, em dias corridos. Ajuste o que precisar.</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-[15px]">
          <thead className="border-b border-linha text-left text-[13px] text-tinta-2">
            <tr>
              <th className="py-2.5 pr-4 font-normal">Etapa</th>
              <th className="py-2.5 pr-4 font-normal">Horas</th>
              <th className="py-2.5 pr-4 font-normal">Referência</th>
              <th className="py-2.5 pr-4 font-normal">Início</th>
              <th className="py-2.5 pr-4 font-normal">Fim</th>
              {fechado && <th className="py-2.5 font-normal">No plano original</th>}
            </tr>
          </thead>
          <tbody>
            {projeto.etapas.map((e, i) => {
              const mudou = fechado && (e.dataInicio !== e.dataInicioPlano || e.dataFim !== e.dataFimPlano);
              return (
                <tr key={e.ordem} className="border-b border-linha last:border-0">
                  <td className="py-3 pr-4"><span className="num font-serif">{doisDigitos(e.ordem)}</span> {e.nome.charAt(0) + e.nome.slice(1).toLowerCase()}</td>
                  <td className="num py-3 pr-4">{e.horasPrevistas} h</td>
                  <td className="num py-3 pr-4 text-tinta-2">{e.duracaoReferenciaDias} dias</td>
                  <td className="num py-3 pr-4">
                    {editando ? <input type="date" className="campo" value={linhas[i].inicio} onChange={(ev) => setLinha(i, "inicio", ev.target.value)} /> : formatarData(e.dataInicio)}
                  </td>
                  <td className="num py-3 pr-4">
                    {editando ? <input type="date" className="campo" value={linhas[i].fim} onChange={(ev) => setLinha(i, "fim", ev.target.value)} /> : formatarData(e.dataFim)}
                  </td>
                  {fechado && (
                    <td className={`py-2 text-[13px] ${mudou ? "text-vinho" : "text-tinta-2"}`}>
                      {mudou ? `${formatarData(e.dataInicioPlano)} a ${formatarData(e.dataFimPlano)}` : "sem alteração"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editando && erros.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-[13px] text-vinho">{erros.map((e) => <li key={e}>{e}</li>)}</ul>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        {!fechado && <Botao onClick={fechar} disabled={erros.length > 0}>Fechar plano de trabalho</Botao>}
        {fechado && !editando && <Botao variante="secundario" onClick={() => setEditando(true)}>Alterar datas</Botao>}
        {fechado && editando && (
          <>
            <Campo rotulo="Justificativa da alteração (obrigatória)" className="min-w-72 flex-1">
              <input className="campo" value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
            </Campo>
            <Botao onClick={salvarAlteracao} disabled={erros.length > 0 || !justificativa.trim()}>Salvar alteração</Botao>
            <Botao variante="secundario" onClick={() => { setLinhas(projeto.etapas.map((e) => ({ inicio: e.dataInicio ?? "", fim: e.dataFim ?? "" }))); setEditando(false); }}>Cancelar</Botao>
          </>
        )}
      </div>
    </section>
  );
}
