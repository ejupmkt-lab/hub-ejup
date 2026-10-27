"use client";

import { useState } from "react";
import type { AjusteDeParcela, Financeiro } from "@/lib/dados/financeiro";
import { moeda, type Entrada } from "@/lib/financeiro";
import { formatarData, hojeIso } from "@/lib/datas";
import { Botao, Campo, Chip } from "@/components/ui";

const origemTexto = { hub: "Data do HUB", plano: "Projetada", manual: "Combinada" } as const;
const pct = (n: number) => `${String(n).replace(".", ",")}%`;

// Uma parcela do pagamento do SEBRAE, em forma de balão: qual é (1ª, 30%), quanto, até quando está previsto e de onde
// vem a data (projetada pelo andamento do projeto, vinda do HUB ou combinada). "Recebi" marca na hora; "Editar" muda a
// data, o valor e o dia em que entrou.
export function BalaoDeParcela({ fin, entrada: e, nome, destaque = false }: { fin: Financeiro; entrada: Entrada; nome: string; destaque?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const { parcela: x, projeto: p } = e;
  const hoje = hojeIso();
  const atrasada = !x.recebidaEm && !!x.previsao && x.previsao < hoje;
  const ajustada = x.origem === "manual" || x.valor !== x.valorCalculado;

  const salvar = (a: AjusteDeParcela) => void fin.ajustarParcela(p, x.chave, a).catch((err) => alert(err instanceof Error ? err.message : "Não foi possível salvar."));
  const data = (campo: "previsao" | "recebidaEm") => (ev: React.FocusEvent<HTMLInputElement>) => {
    const atual = (campo === "previsao" ? x.previsao : x.recebidaEm) ?? "";
    if (ev.target.value !== atual) salvar({ [campo]: ev.target.value || null });
  };
  const valor = (ev: React.FocusEvent<HTMLInputElement>) => {
    const v = Number(ev.target.value.replace(",", "."));
    if (!Number.isFinite(v) || v < 0 || ev.target.value === "") return;
    if (Math.round(v * 100) !== Math.round(x.valor * 100)) salvar({ valor: Math.round(v * 100) === Math.round(x.valorCalculado * 100) ? null : v });
  };

  const borda = x.recebidaEm ? "border-verde/30 bg-verde-claro/40" : atrasada ? "border-laranja/50 bg-laranja-claro/40" : "border-linha bg-folha";
  return (
    <li aria-label={`${nome}, ${x.percentual}%`} className={`flex flex-col rounded-[var(--radius-bloco)] border p-3.5 ${borda} ${destaque ? "ring-2 ring-azul/40" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-bold uppercase tracking-wide text-tinta-2">
          {x.ordem}ª parcela · {pct(x.percentual)}
        </p>
        {x.recebidaEm ? (
          <Chip tom="ok">Recebida</Chip>
        ) : atrasada ? (
          <Chip tom="atencao">Atrasada</Chip>
        ) : x.origem ? (
          <Chip tom={x.origem === "manual" ? "andamento" : "neutro"}>{origemTexto[x.origem]}</Chip>
        ) : (
          <Chip tom="neutro">Sem data</Chip>
        )}
      </div>

      <p className="num mt-1 text-[22px] font-bold leading-tight text-tinta">{moeda(x.valor)}</p>
      <p className={`num mt-0.5 text-[14px] font-semibold ${x.recebidaEm ? "text-verde" : atrasada ? "text-laranja" : "text-tinta"}`}>
        {x.recebidaEm ? `Recebida em ${formatarData(x.recebidaEm)}` : x.previsao ? `Previsto até ${formatarData(x.previsao)}` : "Sem data prevista"}
      </p>
      <p className="mt-1 text-[13px] leading-snug text-tinta-2">{x.recebidaEm ? x.condicao : (x.explicacao ?? x.condicao)}</p>
      {e.aliquota !== null && (
        <p className="num mt-1 text-[13px] text-tinta-2">
          Imposto de {pct(e.aliquota)} ({moeda(e.imposto)}) · fica {moeda(e.aposImposto)}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        {x.recebidaEm ? (
          <Botao tamanho="pequeno" variante="secundario" onClick={() => salvar({ recebidaEm: null })}>
            Desfazer
          </Botao>
        ) : (
          <Botao tamanho="pequeno" variante="secundario" onClick={() => salvar({ recebidaEm: hoje })}>
            Recebi
          </Botao>
        )}
        <Botao tamanho="pequeno" variante="secundario" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
          {aberto ? "Fechar" : "Editar"}
        </Botao>
      </div>

      {aberto && (
        <div className="mt-3 space-y-3 border-t border-linha pt-3">
          <Campo rotulo="Pagamento previsto">
            <input key={x.previsao ?? ""} type="date" className="campo num" defaultValue={x.previsao ?? ""} onBlur={data("previsao")} />
          </Campo>
          <Campo rotulo="Valor (R$)" dica={x.valor !== x.valorCalculado ? `Calculado: ${moeda(x.valorCalculado)}` : undefined}>
            <input key={x.valor} type="number" min={0} step={0.01} className="campo num" defaultValue={String(Math.round(x.valor * 100) / 100)} onBlur={valor} />
          </Campo>
          <Campo rotulo="Recebido em" dica="Deixe vazio se ainda não entrou.">
            <input key={x.recebidaEm ?? ""} type="date" className="campo num" defaultValue={x.recebidaEm ?? ""} onBlur={data("recebidaEm")} />
          </Campo>
          {ajustada && (
            <Botao tamanho="pequeno" variante="secundario" onClick={() => salvar({ previsao: null, valor: null })}>
              Voltar à projeção
            </Botao>
          )}
        </div>
      )}
    </li>
  );
}
