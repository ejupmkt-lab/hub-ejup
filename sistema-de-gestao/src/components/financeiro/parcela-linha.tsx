"use client";

import Link from "next/link";
import { useState } from "react";
import type { Financeiro } from "@/lib/dados/financeiro";
import type { AjusteDeParcela } from "@/lib/dados/financeiro";
import { moeda, type Entrada } from "@/lib/financeiro";
import { formatarData, hojeIso } from "@/lib/datas";
import { Botao, Campo, Chip } from "@/components/ui";

const origemTexto = { hub: "data do HUB", plano: "estimada pelo plano", manual: "combinada" } as const;
const pct = (n: number) => `${String(n).replace(".", ",")}%`;

// Uma parcela do pagamento do SEBRAE: o que é, quanto, quando cai e se já entrou. Tudo se corrige aqui mesmo:
// "Recebi" marca na hora; "Editar" muda a data, o valor e o dia em que entrou.
export function LinhaDeParcela({ fin, entrada: e, nome, comProjeto = true }: { fin: Financeiro; entrada: Entrada; nome: string; comProjeto?: boolean }) {
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

  return (
    <li aria-label={`${nome}, ${x.percentual}%`} className={`rounded-[var(--radius-campo)] border bg-folha p-3 ${x.recebidaEm ? "border-verde/25" : atrasada ? "border-laranja/40" : "border-linha"}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          {comProjeto && (
            <Link href={`/${p.empresa}/projetos/${p.id}#ficha`} className="block font-semibold text-tinta hover:text-azul">
              {nome}
            </Link>
          )}
          <p className="text-[13px] text-tinta-2">
            {x.ordem}º recebimento · {pct(x.percentual)} · {x.condicao}
          </p>
        </div>
        <p className="num text-[17px] font-bold text-tinta">{moeda(x.valor)}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        {x.recebidaEm ? (
          <Chip tom="ok">Recebido em {formatarData(x.recebidaEm)}</Chip>
        ) : atrasada ? (
          <Chip tom="atencao">Atrasado</Chip>
        ) : x.previsao ? (
          <Chip tom={x.origem === "manual" ? "andamento" : "neutro"}>{x.origem ? origemTexto[x.origem][0].toUpperCase() + origemTexto[x.origem].slice(1) : "Previsto"}</Chip>
        ) : (
          <Chip tom="neutro">Sem data</Chip>
        )}
        {!x.recebidaEm && <span className="num text-[13px] text-tinta-2">{x.previsao ? `pagamento até ${formatarData(x.previsao)}` : "depende do plano ou da data que você combinar"}</span>}
        <span className="ml-auto flex gap-2">
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
        </span>
      </div>

      {e.aliquota !== null && (
        <p className="num mt-1.5 text-[13px] text-tinta-2">
          Imposto de {pct(e.aliquota)} ({moeda(e.imposto)}) · fica {moeda(e.aposImposto)}
        </p>
      )}

      {aberto && (
        <div className="mt-3 border-t border-linha pt-3">
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
          {ajustada && (
            <Botao tamanho="pequeno" variante="secundario" className="mt-3" onClick={() => salvar({ previsao: null, valor: null })}>
              Voltar à estimativa
            </Botao>
          )}
        </div>
      )}
    </li>
  );
}
