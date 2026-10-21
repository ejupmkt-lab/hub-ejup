"use client";

import { useAcesso, useEstado } from "@/lib/dados/store";
import type { EmpresaSlug, Servico } from "@/lib/dados/tipos";
import { referenciasPadrao } from "@/lib/relatorio/padroes";
import { Botao, Cartao, Vazio } from "@/components/ui";

// Referências normativas e técnicas do serviço: as mesmas para todos os
// projetos dele. O projeto copia a lista ao nascer, como faz com as etapas.
export function ReferenciasServico({ servico: s }: { servico: Servico }) {
  const { atualizar } = useEstado();
  const { gerencia } = useAcesso();
  const pode = gerencia(s.empresa as EmpresaSlug);
  const lista = s.referencias ?? [];
  const lgpd = s.id.includes("lgpd") || s.codigoFichaTecnica === "13070-5";
  const mudar = (fn: (r: { texto: string; url: string }[]) => { texto: string; url: string }[]) =>
    atualizar((e) => {
      const sv = e.servicos.find((x) => x.id === s.id);
      if (sv) sv.referencias = fn([...(sv.referencias ?? [])]);
    });

  return (
    <Cartao className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">Referências normativas e técnicas</h2>
          <p className="mt-1 text-sm text-tinta-2">
            Numeradas [1]…[n] nos relatórios, na ordem abaixo. Os projetos novos deste serviço já nascem com elas; a data de consulta é a da criação do projeto.
          </p>
        </div>
        {pode && (
          <span className="flex flex-wrap gap-2">
            {lgpd && lista.length === 0 && (
              <Botao variante="secundario" onClick={() => mudar(() => referenciasPadrao().map(({ texto, url }) => ({ texto, url })))}>
                Usar as referências-padrão da LGPD
              </Botao>
            )}
            <Botao variante="secundario" onClick={() => mudar((r) => [...r, { texto: "", url: "" }])}>
              Adicionar referência
            </Botao>
          </span>
        )}
      </div>
      {lista.length === 0 ? (
        <Vazio titulo="Nenhuma referência cadastrada">Cadastre as leis, normas e guias que os relatórios deste serviço citam.</Vazio>
      ) : (
        <ol className="space-y-3">
          {lista.map((r, i) => (
            <li key={i} className="grid gap-2 rounded-[var(--radius-campo)] border border-linha p-3 sm:grid-cols-[2.5rem_1fr_auto]">
              <span className="num pt-2 text-sm font-semibold">[{i + 1}]</span>
              <div className="min-w-0 space-y-2">
                <label className="block">
                  <span className="sr-only">Referência {i + 1}</span>
                  <textarea
                    rows={2}
                    placeholder="AUTOR. Título…"
                    className="campo !text-sm"
                    value={r.texto}
                    disabled={!pode}
                    onChange={(e) => mudar((l) => l.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Endereço da referência {i + 1}</span>
                  <input
                    placeholder="https://…"
                    className="campo !text-sm"
                    value={r.url}
                    disabled={!pode}
                    onChange={(e) => mudar((l) => l.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                  />
                </label>
              </div>
              {pode && (
                <button
                  type="button"
                  aria-label={`Remover a referência ${i + 1}`}
                  onClick={() => confirm("Remover esta referência?") && mudar((l) => l.filter((_, j) => j !== i))}
                  className="self-start pt-2 text-tinta-2 hover:text-vermelho"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </Cartao>
  );
}
