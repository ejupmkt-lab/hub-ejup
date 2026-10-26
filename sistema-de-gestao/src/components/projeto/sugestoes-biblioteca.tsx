"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import type { TextoBiblioteca } from "@/lib/biblioteca";

// Textos aprovados de um serviço da empresa (de uma etapa, ou todos)
export function useBiblioteca(empresa: string, servico: string, etapa?: number) {
  const [lista, setLista] = useState<TextoBiblioteca[]>([]);
  const [carregado, setCarregado] = useState(false);
  const carregar = useCallback(async () => {
    let q = supabaseNavegador()
      .from("biblioteca_textos")
      .select("*")
      .eq("empresa", empresa)
      .eq("servico_id", servico)
      .order("created_at", { ascending: false });
    if (etapa !== undefined) q = q.eq("etapa", etapa);
    const { data } = await q;
    setLista((data ?? []) as TextoBiblioteca[]);
    setCarregado(true);
  }, [empresa, servico, etapa]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);
  return { lista, carregado, recarregar: carregar };
}
