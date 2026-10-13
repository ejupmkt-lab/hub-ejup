"use client";

import type { Projeto } from "@/lib/prototipo/tipos";
import { hojeIso } from "@/lib/datas";
import { novoId } from "@/lib/prototipo/store";
import { Botao, Cartao } from "@/components/ui";
import { useProjeto } from "./use-projeto";

export function Referencias({ projeto }: { projeto: Projeto }) {
  const { alterar } = useProjeto();
  const editar = (id: string, k: "texto" | "url" | "consultadoEm", v: string) =>
    alterar((p) => void (p.referencias.find((r) => r.id === id)![k] = v));

  return (
    <Cartao className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Referências normativas e técnicas</h2>
          <p className="text-xs text-tinta-2">Numeradas [1]…[n] na ordem abaixo; cite no texto como [1][3]. Fonte externa precisa de data de consulta.</p>
        </div>
        <Botao
          variante="secundario"
          onClick={() => alterar((p) => void p.referencias.push({ id: novoId("ref"), texto: "", url: "", consultadoEm: hojeIso() }))}
        >
          Adicionar referência
        </Botao>
      </div>
      <ol className="space-y-3">
        {projeto.referencias.map((r, i) => (
          <li key={r.id} className="grid gap-2 rounded-md border border-linha p-3 sm:grid-cols-[40px_1fr_160px_24px]">
            <span className="pt-2 text-sm font-medium">[{i + 1}]</span>
            <div className="space-y-2">
              <textarea rows={2} placeholder="AUTOR. Título…" className="campo !font-sans !text-sm" value={r.texto} onChange={(e) => editar(r.id, "texto", e.target.value)} />
              <input placeholder="https://…" className="campo" value={r.url} onChange={(e) => editar(r.id, "url", e.target.value)} />
            </div>
            <label className="text-xs text-tinta-2">
              Consulta em
              <input type="date" className="campo mt-1" value={r.consultadoEm} onChange={(e) => editar(r.id, "consultadoEm", e.target.value)} />
            </label>
            <button title="Remover" onClick={() => alterar((p) => void (p.referencias = p.referencias.filter((x) => x.id !== r.id)))} className="text-tinta-2 hover:text-vermelho">✕</button>
          </li>
        ))}
      </ol>
    </Cartao>
  );
}
