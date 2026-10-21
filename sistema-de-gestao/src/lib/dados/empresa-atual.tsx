"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { Empresa } from "./tipos";
import { useAcesso } from "./store";

// Empresa em que a pessoa está trabalhando. Todo o sistema (painel, projetos,
// tarefas, clientes, serviços e equipe) mostra só os dados dela. Vem do
// endereço (/pivotto/...) quando há; senão, da última escolhida, guardada no
// navegador; senão, a primeira empresa ativa a que a pessoa tem acesso.

const CHAVE = "blimp:empresa";
const ler = () => {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
};
const gravar = (slug: string) => {
  try {
    localStorage.setItem(CHAVE, slug);
  } catch {
    // sem armazenamento (navegação privada): vale só nesta visita
  }
};

type Ctx = { empresa: Empresa | null; empresas: Empresa[]; trocar: (slug: string) => void };
const Contexto = createContext<Ctx | null>(null);

// Páginas que existem em toda empresa: ao trocar, a pessoa continua na mesma
const secoes = ["clientes", "servicos", "equipe"];

export function ProvedorEmpresaAtual({ children }: { children: React.ReactNode }) {
  const { empresasVisiveis } = useAcesso();
  const { empresa: daUrl } = useParams<{ empresa?: string }>();
  const caminho = usePathname();
  const router = useRouter();
  const [escolhida, setEscolhida] = useState<string | null>(ler);
  const existe = (s: string | null | undefined): s is string => !!s && empresasVisiveis.some((e) => e.slug === s);

  // Abrir uma página de outra empresa passa a valer como a escolha
  if (existe(daUrl) && daUrl !== escolhida) setEscolhida(daUrl);
  useEffect(() => {
    if (escolhida) gravar(escolhida);
  }, [escolhida]);

  const slug = existe(daUrl) ? daUrl : existe(escolhida) ? escolhida : (empresasVisiveis.find((e) => e.status === "ativo") ?? empresasVisiveis[0])?.slug;
  const empresa = empresasVisiveis.find((e) => e.slug === slug) ?? null;

  const trocar = useCallback(
    (novo: string) => {
      setEscolhida(novo);
      gravar(novo);
      const partes = caminho.split("/").filter(Boolean);
      if (!daUrl) return; // painel e tarefas: a mesma página, com os dados da outra empresa
      router.push(partes[1] && secoes.includes(partes[1]) ? `/${novo}/${partes[1]}` : `/${novo}`);
    },
    [caminho, daUrl, router],
  );

  return <Contexto.Provider value={{ empresa, empresas: empresasVisiveis, trocar }}>{children}</Contexto.Provider>;
}

export function useEmpresaAtual() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useEmpresaAtual fora do ProvedorEmpresaAtual");
  return c;
}
