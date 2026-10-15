"use client";

import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { tiposRegistro } from "@/lib/registros";
import { etapaAtual } from "@/lib/projeto";
import { novoId } from "@/lib/dados/store";
import { normasPadrao } from "@/lib/relatorio/padroes";
import { Botao, Cartao } from "@/components/ui";
import { useProjeto } from "./use-projeto";

// Tabelas que atravessam as etapas. Entram no relatório com [[tabela:tipo]].
export function Registros({ projeto }: { projeto: Projeto }) {
  const { alterar } = useProjeto();
  const [tipo, setTipo] = useState(tiposRegistro[0].tipo);
  const def = tiposRegistro.find((t) => t.tipo === tipo)!;
  const linhas = projeto.registros.filter((r) => r.tipo === tipo);

  const adicionar = () =>
    alterar((p) => {
      const usados = p.registros.filter((r) => r.tipo === tipo).map((r) => Number(r.codigo.replace(def.prefixo, "")) || 0);
      p.registros.push({
        id: novoId("reg"),
        tipo,
        codigo: `${def.prefixo}${Math.max(0, ...usados) + 1}`,
        dados: {},
        etapaOrigem: etapaAtual(p)?.ordem ?? 1,
      });
    });

  const editar = (id: string, chave: string, valor: string) =>
    alterar((p) => {
      const r = p.registros.find((x) => x.id === id)!;
      r.dados[chave] = valor;
    });

  const remover = (id: string) => alterar((p) => void (p.registros = p.registros.filter((r) => r.id !== id)));

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-1 overflow-x-auto lg:flex-col">
        {tiposRegistro.map((t) => {
          const n = projeto.registros.filter((r) => r.tipo === t.tipo).length;
          return (
            <button
              key={t.tipo}
              onClick={() => setTipo(t.tipo)}
              className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-[var(--radius-campo)] px-3 py-2 text-left text-sm ${
                t.tipo === tipo ? "bg-folha text-tinta" : "text-tinta-2 hover:text-tinta"
              }`}
            >
              {t.nome}
              <span className="text-[13px]">{n || ""}</span>
            </button>
          );
        })}
      </nav>
      <Cartao className="min-w-0 p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl">{def.nome}</h2>
            <p className="text-[13px] text-tinta-2">
              No relatório: escreva <code className="rounded bg-pedra px-1">[[tabela:{def.tipo}]]</code> em qualquer seção ou entregável.
            </p>
          </div>
          <span className="flex flex-wrap gap-2">
            {tipo === "normas" && linhas.length === 0 && (
              <Botao
                variante="secundario"
                onClick={() => alterar((p) => void p.registros.push(...normasPadrao().map((r) => ({ ...r, id: novoId("reg") }))), { acao: "Inventário normativo-padrão carregado" })}
              >
                Carregar o inventário-padrão
              </Botao>
            )}
            <Botao variante="secundario" onClick={adicionar}>Adicionar linha</Botao>
          </span>
        </div>
        {linhas.length === 0 ? (
          <p className="py-6 text-center text-sm text-tinta-2">Nenhuma linha ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 140 * def.colunas.length + 120 }}>
              <thead className="border-b border-linha text-left text-[13px] text-tinta-2">
                <tr>
                  <th className="w-14 py-2 pr-2 font-medium">ID</th>
                  {def.colunas.map((c) => <th key={c.chave} className="py-2 pr-2 font-medium">{c.titulo}</th>)}
                  <th className="w-16 py-2 font-medium">Etapa</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {linhas.map((r) => (
                  <tr key={r.id} className="border-b border-linha align-top last:border-0">
                    <td className="py-2 pr-2 font-medium">{r.codigo}</td>
                    {def.colunas.map((c) => (
                      <td key={c.chave} className="py-1.5 pr-2">
                        <textarea rows={2} className="campo !font-sans !text-sm" value={r.dados[c.chave] ?? ""} onChange={(e) => editar(r.id, c.chave, e.target.value)} />
                      </td>
                    ))}
                    <td className="py-2 text-[13px] text-tinta-2">{String(r.etapaOrigem).padStart(2, "0")}</td>
                    <td className="py-2">
                      <button title="Remover" onClick={() => confirm("Remover esta linha do registro?") && remover(r.id)} aria-label="Remover linha" className="text-tinta-2 hover:text-vinho">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>
    </div>
  );
}
