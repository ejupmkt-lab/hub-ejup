"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { estadoInicial, VERSAO_ESTADO } from "./semente";
import type { EmpresaSlug, Estado, Projeto } from "./tipos";

// Protótipo: todo o estado vive no navegador (localStorage).
// Na versão de produção isto é substituído pelo banco (docs/esquema-banco-producao.sql).

const CHAVE = "hub-pivotto:estado";

type Ctx = {
  estado: Estado;
  atualizar: (fn: (rascunho: Estado) => void) => void;
  reiniciar: () => void;
};

const Contexto = createContext<Ctx | null>(null);

function carregar(): Estado {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) {
      const e = JSON.parse(bruto) as Estado;
      if (e.versao === VERSAO_ESTADO) return e;
    }
  } catch {
    // armazenamento indisponível: segue com os dados de exemplo
  }
  return estadoInicial();
}

const semInscricao = () => () => {};

export function ProvedorEstado({ children }: { children: React.ReactNode }) {
  // Só no navegador existe localStorage: no servidor renderiza "Carregando…"
  const noNavegador = useSyncExternalStore(semInscricao, () => true, () => false);
  const salvo = useMemo(() => (noNavegador ? carregar() : null), [noNavegador]);
  const [alterado, setEstado] = useState<Estado | null>(null);
  const estado = alterado ?? salvo;

  useEffect(() => {
    if (!alterado) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(alterado));
    } catch {
      // ignora: o protótipo continua funcionando em memória
    }
  }, [alterado]);

  const atualizar = useCallback(
    (fn: (r: Estado) => void) => {
      setEstado((atual) => {
        const base = atual ?? salvo;
        if (!base) return atual;
        const copia = structuredClone(base);
        fn(copia);
        return copia;
      });
    },
    [salvo],
  );

  const reiniciar = useCallback(() => setEstado(estadoInicial()), []);

  const valor = useMemo(() => (estado ? { estado, atualizar, reiniciar } : null), [estado, atualizar, reiniciar]);

  if (!valor) return <div className="p-10 text-sm text-tinta-2">Carregando…</div>;
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useEstado() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useEstado fora do ProvedorEstado");
  return c;
}

export function useUsuario() {
  const { estado } = useEstado();
  return estado.usuarios.find((u) => u.id === estado.usuarioAtualId)!;
}

// Regras de acesso (as mesmas que o banco aplica via RLS na produção)
export function useAcesso() {
  const { estado } = useEstado();
  const usuario = useUsuario();
  const empresasVisiveis = estado.empresas.filter(
    (e) => usuario.adminGrupo || (usuario.acessos[e.slug] && e.status === "ativo"),
  );
  const podeVer = (slug: EmpresaSlug) => empresasVisiveis.some((e) => e.slug === slug);
  return { usuario, empresasVisiveis, podeVer };
}

export function registrarEvento(p: Projeto, usuario: string, acao: string, detalhe?: string) {
  p.historico.unshift({ em: new Date().toISOString().slice(0, 19), usuario, acao, detalhe });
}

export function novoId(prefixo: string) {
  return `${prefixo}-${Math.random().toString(36).slice(2, 9)}`;
}
