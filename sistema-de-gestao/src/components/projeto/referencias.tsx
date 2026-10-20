"use client";

import type { Projeto } from "@/lib/dados/tipos";
import { hojeIso } from "@/lib/datas";
import { novoId } from "@/lib/dados/store";
import { referenciasPadrao } from "@/lib/relatorio/padroes";
import { Botao, Cartao } from "@/components/ui";
import { useProjeto } from "./use-projeto";

export function Referencias({ projeto }: { projeto: Projeto }) {
  const { alterar } = useProjeto();
  const faltam = referenciasPadrao().filter((r) => !projeto.referencias.some((x) => x.url === r.url && x.texto === r.texto));
  const editar = (id: string, k: "texto" | "url" | "consultadoEm", v: string) =>
    alterar((p) => void (p.referencias.find((r) => r.id === id)![k] = v));

  return (
    <Cartao className="p-4 sm:p-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Referências normativas e técnicas</h2>
          <p className="text-[13px] text-tinta-2">Numeradas [1]…[n] na ordem abaixo; cite no texto como [1][3]. Fonte externa precisa de data de consulta.</p>
        </div>
        <span className="flex flex-wrap gap-2">
          {faltam.length > 0 && (
            <Botao
              variante="secundario"
              onClick={() =>
                alterar((p) => void p.referencias.push(...faltam.map((r) => ({ ...r, id: novoId("ref") }))), { acao: "Referências-padrão adicionadas" })
              }
            >
              {projeto.referencias.length ? "Completar com as referências-padrão" : "Adicionar as referências-padrão"}
            </Botao>
          )}
          <Botao
            variante="secundario"
            onClick={() => alterar((p) => void p.referencias.push({ id: novoId("ref"), texto: "", url: "", consultadoEm: hojeIso() }))}
          >
            Adicionar referência
          </Botao>
        </span>
      </div>
      <ol className="space-y-3">
        {projeto.referencias.map((r, i) => (
          <li key={r.id} className="grid gap-2 rounded-[var(--radius-campo)] border border-linha p-3 sm:grid-cols-[40px_1fr_160px_24px]">
            <span className="pt-2 text-sm font-medium">[{i + 1}]</span>
            <div className="space-y-2">
              <textarea rows={2} placeholder="AUTOR. Título…" className="campo !font-sans !text-sm" value={r.texto} onChange={(e) => editar(r.id, "texto", e.target.value)} />
              <input placeholder="https://…" className="campo" value={r.url} onChange={(e) => editar(r.id, "url", e.target.value)} />
            </div>
            <label className="text-[13px] text-tinta-2">
              Consulta em
              <input type="date" className="campo mt-1" value={r.consultadoEm} onChange={(e) => editar(r.id, "consultadoEm", e.target.value)} />
            </label>
            <button title="Remover" aria-label="Remover referência" onClick={() => confirm("Remover esta referência?") && alterar((p) => void (p.referencias = p.referencias.filter((x) => x.id !== r.id)))} className="text-tinta-2 hover:text-vermelho">✕</button>
          </li>
        ))}
      </ol>
    </Cartao>
  );
}
