"use client";

import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { diferencaDias, distribuirPorHoras, formatarData, hojeIso, sugerirDatas } from "@/lib/datas";
import { faltandoNoPlano, textoPlano } from "@/lib/plano-texto";
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
  const { alterar, cliente } = useProjeto();
  const fechado = !!projeto.planoFechadoEm;
  const [editando, setEditando] = useState(!fechado);
  const [inicio, setInicio] = useState(projeto.etapas[0].dataInicio ?? hojeIso());
  const [fim, setFim] = useState(projeto.etapas[projeto.etapas.length - 1].dataFim ?? "");
  const [copiado, setCopiado] = useState(false);
  const horasTotal = projeto.etapas.reduce((a, e) => a + e.horasPrevistas, 0);
  const [linhas, setLinhas] = useState<Linha[]>(projeto.etapas.map((e) => ({ inicio: e.dataInicio ?? "", fim: e.dataFim ?? "" })));
  const [justificativa, setJustificativa] = useState("");
  const erros = validar(linhas);

  // Com início e fim: divide os dias na proporção das horas. Só com o início: usa a duração de referência.
  const curtoDemais = !!fim && diferencaDias(inicio, fim) + 1 < projeto.etapas.length;
  const sugerir = () => {
    const porHoras = fim ? distribuirPorHoras(inicio, fim, projeto.etapas.map((e) => e.horasPrevistas)) : null;
    setLinhas(porHoras ?? sugerirDatas(inicio, projeto.etapas.map((e) => e.duracaoReferenciaDias)));
  };
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoPlano(projeto, cliente));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      alert("Não foi possível copiar automaticamente. Selecione o texto na tela e copie.");
    }
  };
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
    <section className="rounded-[var(--radius-bloco)] border border-linha bg-folha shadow-[var(--shadow-cartao)] p-4 sm:p-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Plano de trabalho</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-tinta-2">
            O gestor define o início e o fim depois da contratação; as etapas dividem o período na proporção da carga horária ({horasTotal} h no total). As datas
            fechadas aqui são a base dos prazos e avisos, e a mensagem abaixo sai pronta para enviar.
          </p>
        </div>
        {fechado ? <Status tom="ok">Fechado em {formatarData(projeto.planoFechadoEm!.slice(0, 10))}</Status> : <Status tom="atencao">Ainda não fechado</Status>}
      </div>

      {editando && !fechado && (
        <div className="mb-6 rounded-[var(--radius-bloco)] bg-pedra/60 p-5">
          <div className="flex flex-wrap items-end gap-4">
            <Campo rotulo="Início do projeto">
              <input type="date" className="campo" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </Campo>
            <Campo rotulo="Fim do projeto">
              <input type="date" className="campo" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} />
            </Campo>
            <Botao variante="secundario" onClick={sugerir} disabled={!inicio || curtoDemais}>
              Calcular as datas das etapas
            </Botao>
          </div>
          <p className="mt-3 text-[13px] text-tinta-2">
            {curtoDemais
              ? "O período precisa ter pelo menos um dia por etapa."
              : fim
                ? "Os dias são divididos entre as etapas na proporção da carga horária de cada uma. Depois, ajuste o que precisar na tabela."
                : "Sem a data de fim, o sistema usa a duração de referência de cada etapa. Ajuste o que precisar na tabela."}
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-[15px]">
          <thead className="border-b border-linha text-left text-[13px] text-tinta-2">
            <tr>
              <th className="py-2.5 pr-4 font-normal">Etapa</th>
              <th className="py-2.5 pr-4 font-normal">Horas</th>
              <th className="py-2.5 pr-4 font-normal">Dias</th>
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
                  <td className="py-3 pr-4"><span className="num font-semibold">{doisDigitos(e.ordem)}</span> {e.nome.charAt(0) + e.nome.slice(1).toLowerCase()}</td>
                  <td className="num py-3 pr-4">{e.horasPrevistas} h</td>
                  <td className="num py-3 pr-4 text-tinta-2">
                    {(() => {
                      const ini = editando ? linhas[i].inicio : e.dataInicio;
                      const fi = editando ? linhas[i].fim : e.dataFim;
                      return ini && fi && fi >= ini ? `${diferencaDias(ini, fi) + 1}` : "—";
                    })()}
                  </td>
                  <td className="num py-3 pr-4">
                    {editando ? <input type="date" className="campo" value={linhas[i].inicio} onChange={(ev) => setLinha(i, "inicio", ev.target.value)} /> : formatarData(e.dataInicio)}
                  </td>
                  <td className="num py-3 pr-4">
                    {editando ? <input type="date" className="campo" value={linhas[i].fim} onChange={(ev) => setLinha(i, "fim", ev.target.value)} /> : formatarData(e.dataFim)}
                  </td>
                  {fechado && (
                    <td className={`py-2 text-[13px] ${mudou ? "text-vermelho" : "text-tinta-2"}`}>
                      {mudou ? `${formatarData(e.dataInicioPlano)} a ${formatarData(e.dataFimPlano)}` : "sem alteração"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-linha-forte">
            <tr>
              <td className="py-3 pr-4 font-medium">Carga horária total</td>
              <td className="num py-3 pr-4 font-medium">{horasTotal} h</td>
              <td />
              <td className="num py-3 pr-4 text-tinta-2">{formatarData(editando ? linhas[0]?.inicio : projeto.etapas[0].dataInicio)}</td>
              <td className="num py-3 pr-4 text-tinta-2">{formatarData(editando ? linhas[linhas.length - 1]?.fim : projeto.etapas[projeto.etapas.length - 1].dataFim)}</td>
              {fechado && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {editando && erros.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-[13px] text-vermelho">{erros.map((e) => <li key={e}>{e}</li>)}</ul>
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

      {fechado && !editando && (
        <div className="mt-10 border-t border-linha pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Mensagem do plano de trabalho</h3>
            <Botao onClick={copiar}>{copiado ? "Copiada" : "Copiar mensagem"}</Botao>
          </div>
          {faltandoNoPlano(projeto).length > 0 && (
            <p className="mt-2 text-sm text-laranja">
              Falta preencher na ficha de identificação: {faltandoNoPlano(projeto).join(" e ")}. Até lá, a mensagem sai com “a definir”.
            </p>
          )}
          <pre className="mt-4 whitespace-pre-wrap rounded-[var(--radius-campo)] bg-pedra/60 p-4 font-sans text-sm leading-relaxed text-tinta">
            {textoPlano(projeto, cliente)}
          </pre>
        </div>
      )}
    </section>
  );
}
