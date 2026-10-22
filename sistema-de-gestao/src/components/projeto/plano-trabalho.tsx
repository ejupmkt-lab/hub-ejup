"use client";

import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { diferencaDias, distribuirPorHoras, formatarData, hojeIso, somarDias, sugerirDatas } from "@/lib/datas";
import { faltandoNoPlano, textoPlano } from "@/lib/plano-texto";
import { doisDigitos } from "@/lib/rotulos";
import { Botao, Campo, Status } from "@/components/ui";
import { useProjeto } from "./use-projeto";
import { automatizarEtapa } from "@/lib/regras-etapa";
import { ajustarPlanoAoPagamento, corrigirPagamento, datasMudadasAMao, dataDoPagamento, execucaoForaDoPagamento } from "@/lib/fase";

type Linha = { inicio: string; fim: string; horas: string; planoInicio: string; planoFim: string };

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
  const paraLinhas = () =>
    projeto.etapas.map((e) => ({
      inicio: e.dataInicio ?? "",
      fim: e.dataFim ?? "",
      horas: e.horasPrevistas ? String(e.horasPrevistas) : "",
      planoInicio: e.dataInicioPlano ?? e.dataInicio ?? "",
      planoFim: e.dataFimPlano ?? e.dataFim ?? "",
    }));
  const [linhas, setLinhas] = useState<Linha[]>(paraLinhas);
  const numero = (h: string) => Number(h.replace(",", ".")) || 0;
  const horasTotal = editando ? linhas.reduce((a, l) => a + numero(l.horas), 0) : projeto.etapas.reduce((a, e) => a + e.horasPrevistas, 0);
  const [justificativa, setJustificativa] = useState("");
  const erros = validar(linhas);

  // Com início e fim: divide os dias na proporção das horas. Só com o início: usa a duração de referência.
  const curtoDemais = !!fim && diferencaDias(inicio, fim) + 1 < projeto.etapas.length;
  const sugerir = () => {
    const porHoras = fim ? distribuirPorHoras(inicio, fim, linhas.map((l) => numero(l.horas))) : null;
    const datas = porHoras ?? sugerirDatas(inicio, projeto.etapas.map((e) => e.duracaoReferenciaDias));
    setLinhas(linhas.map((l, i) => ({ ...l, ...datas[i] })));
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
          e.horasPrevistas = numero(linhas[i].horas);
          e.dataInicio = e.dataInicioPlano = linhas[i].inicio;
          e.dataFim = e.dataFimPlano = linhas[i].fim;
          datasMudadasAMao(e);
          e.dataRelatorio ??= linhas[i].fim; // local e data do relatório: o fim da etapa, ajustável
        });
        p.planoFechadoEm = new Date().toISOString().slice(0, 19);
        p.status = "em_andamento";
        // Plano fechado depois do pagamento: a execução já começa nele
        const pago = dataDoPagamento(p);
        if (pago) ajustarPlanoAoPagamento(p, pago);
        // Checklist já marcado antes do plano: aplica os avanços automáticos
        p.etapas.forEach((e) => automatizarEtapa(p, e));
      },
      { acao: "Plano de trabalho fechado" },
    );
    setEditando(false);
  };

  const pago = dataDoPagamento(projeto);
  const foraDoPagamento = execucaoForaDoPagamento(projeto);
  const [dataPagamento, setDataPagamento] = useState("");
  const [corrigindo, setCorrigindo] = useState(false);
  // Alinha a execução ao dia do pagamento; com outra data, corrige também o dia do pagamento no HUB
  const alinharAoPagamento = (data: string) => {
    if (!data) return;
    alterar((p) => void corrigirPagamento(p, data), {
      acao: data === pago ? "Execução alinhada ao pagamento" : "Data do pagamento corrigida",
      detalhe: `Pagamento em ${formatarData(data)}: a execução começa nesse dia, com a mesma duração de cada etapa; o plano do HUB fica como foi orçado`,
    });
    setCorrigindo(false);
  };
  const seletorPagamento = (
    <input
      type="date"
      aria-label="Data do pagamento"
      className="campo num !w-auto !py-1.5 !text-sm"
      value={dataPagamento || pago || ""}
      max={hojeIso()}
      onChange={(e) => setDataPagamento(e.target.value)}
    />
  );

  // Depois do pagamento o plano do HUB (orçamento) tem as próprias datas
  const planoMudou = (i: number) =>
    !!pago && ((projeto.etapas[i].dataInicioPlano ?? projeto.etapas[i].dataInicio ?? "") !== linhas[i].planoInicio ||
        (projeto.etapas[i].dataFimPlano ?? projeto.etapas[i].dataFim ?? "") !== linhas[i].planoFim);
  const planoInvalido = !!pago && linhas.some((l) => !l.planoInicio || !l.planoFim || l.planoFim < l.planoInicio);
  const algumPlanoMudou = !!pago && projeto.etapas.some((_, i) => planoMudou(i));

  const salvarAlteracao = () => {
    const mudancas = projeto.etapas
      .flatMap((e, i) => [
        pago && planoMudou(i)
          ? `Etapa ${doisDigitos(e.ordem)} no plano do HUB: ${formatarData(e.dataInicioPlano)}–${formatarData(e.dataFimPlano)} → ${formatarData(linhas[i].planoInicio)}–${formatarData(linhas[i].planoFim)}`
          : null,
        e.dataInicio !== linhas[i].inicio || e.dataFim !== linhas[i].fim
          ? `Etapa ${doisDigitos(e.ordem)}: ${formatarData(e.dataInicio)}–${formatarData(e.dataFim)} → ${formatarData(linhas[i].inicio)}–${formatarData(linhas[i].fim)}`
          : null,
        e.horasPrevistas !== numero(linhas[i].horas) ? `Etapa ${doisDigitos(e.ordem)}: ${e.horasPrevistas} h → ${numero(linhas[i].horas)} h` : null,
      ])
      .filter(Boolean)
      .join("; ");
    alterar(
      (p) => {
        if (algumPlanoMudou) {
          // Plano do HUB corrigido: a execução é recalculada dele, a partir do pagamento
          const delta = diferencaDias(linhas[0].planoInicio, pago!);
          p.etapas.forEach((e, i) => {
            e.horasPrevistas = numero(linhas[i].horas);
            e.dataInicioPlano = linhas[i].planoInicio;
            e.dataFimPlano = linhas[i].planoFim;
            const novoInicio = somarDias(linhas[i].planoInicio, delta);
            const novoFim = somarDias(linhas[i].planoFim, delta);
            if (e.dataRelatorio === e.dataFim) e.dataRelatorio = novoFim;
            e.dataInicio = novoInicio;
            e.dataFim = novoFim;
            datasMudadasAMao(e);
          });
          return;
        }
        p.etapas.forEach((e, i) => {
          e.horasPrevistas = numero(linhas[i].horas);
          if (e.dataRelatorio === e.dataFim) e.dataRelatorio = linhas[i].fim; // acompanha o novo fim, se não foi mudada à mão
          e.dataInicio = linhas[i].inicio;
          e.dataFim = linhas[i].fim;
          datasMudadasAMao(e);
          // Antes do pagamento ainda é a proposta: o plano do HUB muda junto
          if (!pago) {
            e.dataInicioPlano = linhas[i].inicio;
            e.dataFimPlano = linhas[i].fim;
          }
        });
      },
      { acao: "Datas do plano alteradas", detalhe: `${mudancas}. Justificativa: ${justificativa}` },
    );
    setJustificativa("");
    setEditando(false);
  };

  return (
    <section className="rounded-[var(--radius-bloco)] border border-linha bg-folha shadow-[var(--shadow-cartao)] p-4 sm:p-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Datas do plano de trabalho</h2>
        </div>
        {fechado ? <Status tom="ok">Fechado em {formatarData(projeto.planoFechadoEm!.slice(0, 10))}</Status> : <Status tom="atencao">Ainda não fechado</Status>}
      </div>

      {foraDoPagamento && !editando && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-bloco)] border border-laranja/30 bg-laranja-claro px-4 py-3.5">
          <p className="max-w-2xl text-[15px] text-tinta">
            O cliente pagou em <span className="num font-semibold">{formatarData(foraDoPagamento)}</span>, mas a execução ainda está nas datas do orçamento. Com
            ela começando no pagamento, os prazos e os atrasos passam a valer a partir de quando a consultoria começou de fato.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {seletorPagamento}
            <Botao onClick={() => alinharAoPagamento(dataPagamento || pago!)}>Começar a execução no pagamento</Botao>
          </div>
        </div>
      )}
      {pago && !foraDoPagamento && fechado && !editando && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-campo)] bg-azul-claro px-4 py-3 text-[15px] text-tinta">
          <p>
            Execução a partir do pagamento, em <span className="num font-semibold">{formatarData(pago)}</span>. As datas do plano do HUB ficam na última coluna e na
            mensagem.
          </p>
          {corrigindo ? (
            <span className="flex flex-wrap items-center gap-2">
              {seletorPagamento}
              <Botao tamanho="pequeno" onClick={() => alinharAoPagamento(dataPagamento || pago)} disabled={(dataPagamento || pago) === pago}>
                Corrigir
              </Botao>
              <Botao variante="fantasma" tamanho="pequeno" onClick={() => setCorrigindo(false)}>
                Cancelar
              </Botao>
            </span>
          ) : (
            <button type="button" onClick={() => setCorrigindo(true)} className="text-sm font-semibold text-azul hover:underline">
              Corrigir a data do pagamento
            </button>
          )}
        </div>
      )}

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
              <th className="py-2.5 pr-4 font-normal">{pago ? "Início da execução" : "Início"}</th>
              <th className="py-2.5 pr-4 font-normal">{pago ? "Fim da execução" : "Fim"}</th>
              {fechado && <th className="py-2.5 font-normal">No plano do HUB</th>}
            </tr>
          </thead>
          <tbody>
            {projeto.etapas.map((e, i) => {
              const mudou = fechado && (e.dataInicio !== e.dataInicioPlano || e.dataFim !== e.dataFimPlano);
              return (
                <tr key={e.ordem} className="border-b border-linha last:border-0">
                  <td className="py-3 pr-4"><span className="num font-semibold">{doisDigitos(e.ordem)}</span> {e.nome.charAt(0) + e.nome.slice(1).toLowerCase()}</td>
                  <td className="num py-3 pr-4">
                    {editando ? (
                      <input
                        type="number"
                        min={0}
                        aria-label={`Horas da etapa ${e.ordem}`}
                        className="campo num !w-24"
                        value={linhas[i].horas}
                        onChange={(ev) => setLinha(i, "horas", ev.target.value)}
                      />
                    ) : e.horasPrevistas ? (
                      `${e.horasPrevistas} h`
                    ) : (
                      "a definir"
                    )}
                  </td>
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
                    <td className="num py-2 text-[13px] text-tinta-2">
                      {editando && pago ? (
                        <span className="flex flex-wrap items-center gap-1.5">
                          <input type="date" aria-label={`Início da etapa ${e.ordem} no plano do HUB`} className="campo !w-auto !py-1 !text-[13px]" value={linhas[i].planoInicio} onChange={(ev) => setLinha(i, "planoInicio", ev.target.value)} />
                          <input type="date" aria-label={`Fim da etapa ${e.ordem} no plano do HUB`} className="campo !w-auto !py-1 !text-[13px]" value={linhas[i].planoFim} onChange={(ev) => setLinha(i, "planoFim", ev.target.value)} />
                        </span>
                      ) : mudou ? (
                        `${formatarData(e.dataInicioPlano)} a ${formatarData(e.dataFimPlano)}`
                      ) : (
                        "as mesmas"
                      )}
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

      {editando && pago && (
        <p className="mt-3 text-[13px] text-tinta-2">
          Mudando as datas do plano do HUB, a execução é recalculada a partir do pagamento ({formatarData(pago)}). Mudando só as da execução, o plano do HUB fica como está.
        </p>
      )}
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
            <Botao onClick={salvarAlteracao} disabled={erros.length > 0 || planoInvalido || !justificativa.trim()}>Salvar alteração</Botao>
            <Botao variante="secundario" onClick={() => { setLinhas(paraLinhas()); setEditando(false); }}>Cancelar</Botao>
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
