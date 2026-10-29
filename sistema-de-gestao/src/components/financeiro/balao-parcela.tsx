"use client";

import { useState } from "react";
import type { AjusteDeParcela, Financeiro } from "@/lib/dados/financeiro";
import { moeda, notaEmitida, type Entrada, type NotaFiscal, type Parcela } from "@/lib/financeiro";
import { formatarData, hojeIso } from "@/lib/datas";
import type { Tom } from "@/lib/rotulos";
import { Botao, Campo, Chip, Status } from "@/components/ui";

const origemTexto = { hub: "Data do HUB", plano: "Projetada", manual: "Combinada" } as const;
export const pct = (n: number) => `${String(n).replace(".", ",")}%`;
export const tituloDaParcela = (x: Parcela) => `${x.ordem}ª parcela · ${pct(x.percentual)}`;
// Nome acessível da parcela (leitor de tela e testes)
export const rotuloAcessivel = (nome: string, x: Parcela) => `${nome}, ${x.percentual}%`;

// Em que pé está a parcela: recebida, atrasada, com a data de onde vem (projetada, do HUB, combinada) ou sem data
export function situacaoDaParcela(e: Entrada, hoje = hojeIso()): { texto: string; tom: Tom; atrasada: boolean } {
  const x = e.parcela;
  const atrasada = !x.recebidaEm && !!x.previsao && x.previsao < hoje;
  if (x.recebidaEm) return { texto: "Recebida", tom: "ok", atrasada };
  if (atrasada) return { texto: "Atrasada", tom: "atencao", atrasada };
  if (x.origem) return { texto: origemTexto[x.origem], tom: x.origem === "manual" ? "andamento" : "neutro", atrasada };
  return { texto: "Sem data", tom: "neutro", atrasada };
}

// Marcar como recebida e corrigir data, valor e dia do recebimento de uma parcela
export function useAjusteDeParcela(fin: Financeiro, e: Entrada) {
  const { parcela: x, projeto: p } = e;
  const salvar = (a: AjusteDeParcela) => void fin.ajustarParcela(p, x.chave, a).catch((err) => alert(err instanceof Error ? err.message : "Não foi possível salvar."));
  return { salvar, recebi: () => salvar({ recebidaEm: hojeIso() }), desfazer: () => salvar({ recebidaEm: null }) };
}

// "NF emitida" ou "NF pendente", com o número quando houver
export function SeloDaNota({ entrada: e }: { entrada: Entrada }) {
  const nota = e.nota;
  return notaEmitida(nota) ? <Status tom="ok">NF emitida{nota?.numero.trim() ? ` · nº ${nota.numero.trim()}` : ""}</Status> : <Status tom="atencao">NF pendente</Status>;
}

// Nota fiscal da parcela: número, data de emissão, valor (se sair por outro) e o arquivo (PDF, XML ou imagem)
export function EditorDeNota({ fin, entrada: e }: { fin: Financeiro; entrada: Entrada }) {
  const { parcela: x, projeto: p } = e;
  const nota: NotaFiscal = e.nota ?? { numero: "", emitidaEm: null, valor: null, arquivo: null };
  const { salvar } = useAjusteDeParcela(fin, e);
  const [enviando, setEnviando] = useState(false);
  const gravar = (mudanca: Partial<NotaFiscal>) => {
    const nova = { ...nota, ...mudanca };
    salvar({ nota: nova.numero.trim() || nova.emitidaEm || nova.valor !== null || nova.arquivo ? nova : null });
  };
  const erro = (err: unknown) => alert(err instanceof Error ? err.message : "Não foi possível concluir.");
  return (
    <fieldset className="space-y-3 rounded-[var(--radius-campo)] border border-linha p-3">
      <legend className="px-1 text-[13px] font-bold uppercase tracking-wide text-tinta-2">Nota fiscal</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo rotulo="Número da nota">
          <input key={nota.numero} className="campo num" defaultValue={nota.numero} onBlur={(ev) => ev.target.value !== nota.numero && gravar({ numero: ev.target.value.trim() })} />
        </Campo>
        <Campo rotulo="Emitida em">
          <input key={nota.emitidaEm ?? ""} type="date" className="campo num" defaultValue={nota.emitidaEm ?? ""} onBlur={(ev) => ev.target.value !== (nota.emitidaEm ?? "") && gravar({ emitidaEm: ev.target.value || null })} />
        </Campo>
        <Campo rotulo="Valor da nota (R$)" dica={`Vazio: o da parcela (${moeda(x.valor)})`}>
          <input
            key={nota.valor ?? ""}
            type="number"
            min={0}
            step={0.01}
            className="campo num"
            defaultValue={nota.valor ?? ""}
            onBlur={(ev) => {
              const v = ev.target.value === "" ? null : Number(ev.target.value.replace(",", "."));
              if (v !== nota.valor && (v === null || Number.isFinite(v))) gravar({ valor: v });
            }}
          />
        </Campo>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        {nota.arquivo ? (
          <>
            <span className="min-w-0 break-all font-medium text-tinta">{nota.arquivo.nome}</span>
            <Botao tamanho="pequeno" variante="secundario" onClick={() => void fin.abrirArquivoDaNota(nota.arquivo!.caminho).catch(erro)}>
              Abrir
            </Botao>
            <Botao tamanho="pequeno" variante="secundario" onClick={() => void fin.removerArquivoDaNota(p, x.chave).catch(erro)}>
              Remover arquivo
            </Botao>
          </>
        ) : (
          <span className="text-tinta-2">Nenhum arquivo anexado.</span>
        )}
        <label className="cursor-pointer rounded-md border border-linha-forte bg-folha px-2.5 py-1 font-semibold text-tinta hover:bg-pedra">
          {enviando ? "Enviando…" : nota.arquivo ? "Trocar arquivo" : "Anexar arquivo"}
          <input
            type="file"
            aria-label={`Arquivo da nota fiscal (${tituloDaParcela(x)})`}
            accept="application/pdf,.pdf,.xml,image/png,image/jpeg"
            className="sr-only"
            disabled={enviando}
            onChange={(ev) => {
              const arquivo = ev.target.files?.[0];
              ev.target.value = "";
              if (!arquivo) return;
              setEnviando(true);
              void fin.anexarNota(p, x.chave, arquivo).catch(erro).finally(() => setEnviando(false));
            }}
          />
        </label>
      </div>
    </fieldset>
  );
}

// Os campos de edição de uma parcela: quando o SEBRAE paga, quanto e quando entrou, e de onde vem a data
export function EditorDeParcela({ fin, entrada: e, comImposto = true }: { fin: Financeiro; entrada: Entrada; comImposto?: boolean }) {
  const { parcela: x } = e;
  const { salvar } = useAjusteDeParcela(fin, e);
  const ajustada = x.origem === "manual" || x.valor !== x.valorCalculado;
  const data = (campo: "previsao" | "recebidaEm") => (ev: React.FocusEvent<HTMLInputElement>) => {
    const atual = (campo === "previsao" ? x.previsao : x.recebidaEm) ?? "";
    if (ev.target.value !== atual) salvar({ [campo]: ev.target.value || null });
  };
  const valor = (ev: React.FocusEvent<HTMLInputElement>) => {
    const v = Number(ev.target.value.replace(",", "."));
    if (!Number.isFinite(v) || v < 0 || ev.target.value === "") return;
    if (Math.round(v * 100) !== Math.round(x.valor * 100)) salvar({ valor: Math.round(v * 100) === Math.round(x.valorCalculado * 100) ? null : v });
  };
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo rotulo="Pagamento previsto">
          <input key={x.previsao ?? ""} type="date" className="campo num" defaultValue={x.previsao ?? ""} onBlur={data("previsao")} />
        </Campo>
        <Campo rotulo="Valor (R$)" dica={x.valor !== x.valorCalculado ? `Calculado: ${moeda(x.valorCalculado)}` : undefined}>
          <input key={x.valor} type="number" min={0} step={0.01} className="campo num" defaultValue={String(Math.round(x.valor * 100) / 100)} onBlur={valor} />
        </Campo>
        <Campo rotulo="Recebido em" dica="Deixe vazio se ainda não entrou.">
          <input key={x.recebidaEm ?? ""} type="date" className="campo num" defaultValue={x.recebidaEm ?? ""} onBlur={data("recebidaEm")} />
        </Campo>
      </div>
      <EditorDeNota fin={fin} entrada={e} />
      {!x.recebidaEm && x.explicacao && <p className="text-[13px] leading-snug text-tinta-2">{x.explicacao}</p>}
      {comImposto && e.aliquota !== null && (
        <p className="num text-[13px] text-tinta-2">
          Imposto de {pct(e.aliquota)} ({moeda(e.imposto)}) · fica {moeda(e.aposImposto)}
        </p>
      )}
      {ajustada && (
        <Botao tamanho="pequeno" variante="secundario" onClick={() => salvar({ previsao: null, valor: null })}>
          Voltar à projeção
        </Botao>
      )}
    </div>
  );
}

// Uma parcela do pagamento do SEBRAE, em forma de balão (celular, tablet e "Dados do projeto"): qual é (1ª, 30%), quanto,
// até quando está previsto e de onde vem a data. "Recebi" marca na hora; "Editar" abre os campos.
export function BalaoDeParcela({ fin, entrada: e, nome, destaque = false }: { fin: Financeiro; entrada: Entrada; nome: string; destaque?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const { parcela: x } = e;
  const sit = situacaoDaParcela(e);
  const { recebi, desfazer } = useAjusteDeParcela(fin, e);
  const borda = x.recebidaEm ? "border-verde/30 bg-verde-claro/40" : sit.atrasada ? "border-laranja/50 bg-laranja-claro/40" : "border-linha bg-folha";
  return (
    <li aria-label={rotuloAcessivel(nome, x)} className={`flex flex-col rounded-[var(--radius-bloco)] border p-3.5 ${borda} ${destaque ? "ring-2 ring-azul/40" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-bold uppercase tracking-wide text-tinta-2">
          {tituloDaParcela(x)}
        </p>
        <Chip tom={sit.tom}>{sit.texto}</Chip>
      </div>
      <p className="num mt-1 text-[22px] font-bold leading-tight text-tinta">{moeda(x.valor)}</p>
      <p className={`num mt-0.5 text-[14px] font-semibold ${x.recebidaEm ? "text-verde" : sit.atrasada ? "text-laranja" : "text-tinta"}`}>
        {x.recebidaEm ? `Recebida em ${formatarData(x.recebidaEm)}` : x.previsao ? `Previsto até ${formatarData(x.previsao)}` : "Sem data prevista"}
      </p>
      <p className="mt-1 text-[13px] leading-snug text-tinta-2">{x.recebidaEm ? x.condicao : (x.explicacao ?? x.condicao)}</p>
      {e.aliquota !== null && (
        <p className="num mt-1 text-[13px] text-tinta-2">
          Imposto de {pct(e.aliquota)} ({moeda(e.imposto)}) · fica {moeda(e.aposImposto)}
        </p>
      )}
      <div className="mt-2">
        <SeloDaNota entrada={e} />
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <Botao tamanho="pequeno" variante="secundario" onClick={x.recebidaEm ? desfazer : recebi}>
          {x.recebidaEm ? "Desfazer" : "Recebi"}
        </Botao>
        <Botao tamanho="pequeno" variante="secundario" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
          {aberto ? "Fechar" : "Editar"}
        </Botao>
      </div>
      {aberto && (
        <div className="mt-3 border-t border-linha pt-3">
          <EditorDeParcela fin={fin} entrada={e} comImposto={false} />
        </div>
      )}
    </li>
  );
}
