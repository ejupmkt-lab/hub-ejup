"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useAcesso } from "@/lib/dados/store";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import { traduzirErro } from "@/lib/erros";
import { Botao } from "@/components/ui";

type Gestor = { id: string; nome: string };
const OUTRO = "__outro";

// Lista de gestores do SEBRAE da empresa
function useGestores(empresa: string) {
  const [lista, setLista] = useState<Gestor[]>([]);
  const carregar = useCallback(async () => {
    const { data } = await supabaseNavegador().from("gestores_sebrae").select("id, nome").eq("empresa", empresa).order("nome");
    setLista(data ?? []);
  }, [empresa]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);
  return { lista, recarregar: carregar };
}

// Escolha do gestor ou gestora do SEBRAE: da lista, ou outro nome digitado
// (que pode entrar na lista). Gestores da empresa também removem nomes da lista.
export function EscolherGestorSebrae({ empresa, valor, aoMudar, id }: { empresa: EmpresaSlug; valor: string; aoMudar: (nome: string) => void; id?: string }) {
  const { lista, recarregar } = useGestores(empresa);
  const { gerencia } = useAcesso();
  const [digitando, setDigitando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const naLista = lista.some((g) => g.nome === valor.trim());
  const outro = digitando || (!!valor.trim() && !naLista && lista.length > 0);

  const salvarNaLista = async () => {
    const nome = valor.trim();
    if (!nome) return;
    const { error } = await supabaseNavegador().from("gestores_sebrae").insert({ empresa, nome });
    if (error && error.code !== "23505") return setAviso(traduzirErro(error, "Não foi possível salvar na lista."));
    setAviso(null);
    setDigitando(false);
    await recarregar();
  };
  const remover = async (g: Gestor) => {
    if (!confirm(`Tirar ${g.nome} da lista? Os projetos que já citam esse nome não mudam.`)) return;
    const { data, error } = await supabaseNavegador().from("gestores_sebrae").delete().eq("id", g.id).select("id");
    if (error || !data?.length) return setAviso(error ? traduzirErro(error) : "Só gestores da empresa podem tirar nomes da lista.");
    await recarregar();
  };

  return (
    <div className="space-y-2">
      {lista.length > 0 && (
        <select
          id={id}
          className="campo"
          value={outro ? OUTRO : valor.trim()}
          onChange={(e) => {
            if (e.target.value === OUTRO) {
              setDigitando(true);
              aoMudar("");
            } else {
              setDigitando(false);
              aoMudar(e.target.value);
            }
          }}
        >
          <option value="">A definir</option>
          {lista.map((g) => (
            <option key={g.id} value={g.nome}>
              {g.nome}
            </option>
          ))}
          <option value={OUTRO}>Outro nome…</option>
        </select>
      )}
      {(outro || lista.length === 0) && (
        <div className="flex flex-wrap gap-2">
          <input
            id={lista.length === 0 ? id : undefined}
            aria-label="Nome do gestor ou gestora SEBRAE"
            className="campo min-w-0 flex-1 basis-48"
            placeholder="Nome completo"
            value={valor}
            onChange={(e) => aoMudar(e.target.value)}
          />
          {valor.trim() && !naLista && (
            <Botao type="button" variante="secundario" onClick={() => void salvarNaLista()} className="w-full sm:w-auto">
              Salvar na lista
            </Botao>
          )}
        </div>
      )}
      {lista.length > 0 && (
        <button type="button" onClick={() => setEditando(!editando)} className="text-[13px] text-azul underline-offset-4 hover:underline" aria-expanded={editando}>
          {editando ? "Fechar a lista" : `Ver a lista (${lista.length})`}
        </button>
      )}
      {editando && (
        <ul className="divide-y divide-linha rounded-[var(--radius-campo)] border border-linha bg-folha">
          {lista.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 break-words">{g.nome}</span>
              {gerencia(empresa) && (
                <button type="button" onClick={() => void remover(g)} className="shrink-0 text-[13px] text-tinta-2 hover:text-vermelho">
                  Tirar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {aviso && <p className="text-[13px] text-vermelho">{aviso}</p>}
    </div>
  );
}
