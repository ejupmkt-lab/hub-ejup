"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import type { Cliente, Projeto } from "@/lib/dados/tipos";
import { preencherMarcadores, textosParaBiblioteca, type TextoBiblioteca } from "@/lib/biblioteca";
import { etapaConcluida } from "@/lib/projeto";
import { traduzirErro } from "@/lib/erros";
import { formatarData } from "@/lib/datas";
import { Botao } from "@/components/ui";

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

// Projeto concluído pelo gestor: os textos completos de cada etapa enviada vão,
// anonimizados, para a biblioteca do serviço. Devolve o erro, se houver.
export async function guardarProjetoNaBiblioteca(p: Projeto, cliente: Partial<Cliente>): Promise<string | null> {
  const linhas = p.etapas.filter(etapaConcluida).flatMap((e) => textosParaBiblioteca(p, e, cliente));
  if (!linhas.length) return null;
  const { error } = await supabaseNavegador().from("biblioteca_textos").upsert(linhas, { onConflict: "projeto_origem,etapa,chave" });
  return error ? `O projeto foi concluído, mas os textos não entraram na biblioteca. ${traduzirErro(error, "Tente de novo mais tarde.")}` : null;
}

// Botão "Da biblioteca (N)" e a lista de textos aprovados parecidos
export function SugestoesBiblioteca({
  sugestoes,
  cliente,
  aoUsar,
}: {
  sugestoes: TextoBiblioteca[];
  cliente: Partial<Cliente>;
  aoUsar: (texto: string) => void;
}) {
  const [aberta, setAberta] = useState(false);
  if (!sugestoes.length) return null;
  return (
    <>
      <Botao variante="fantasma" tamanho="pequeno" onClick={() => setAberta(!aberta)} aria-expanded={aberta}>
        Da biblioteca ({sugestoes.length})
      </Botao>
      {aberta && (
        <div className="order-last basis-full rounded-[var(--radius-campo)] border border-linha bg-pedra/40 p-3">
          <p className="mb-2 text-[13px] text-tinta-2">
            Textos de relatórios já aprovados, com os dados deste cliente no lugar. O que não se aplica volta como [completar]. Os mais parecidos primeiro.
          </p>
          <ul className="space-y-2">
            {sugestoes.slice(0, 5).map((s) => {
              const texto = preencherMarcadores(s.texto, cliente);
              return (
                <li key={s.id} className="rounded-[var(--radius-campo)] border border-linha bg-folha p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] text-tinta-2">
                      {s.ramo || "Ramo não informado"}
                      {s.porte && `, ${s.porte.toLowerCase()}`}, {s.origem === "manual" ? "incluído à mão" : "aprovado"} em {formatarData(s.created_at.slice(0, 10))}
                    </span>
                    <Botao
                      variante="secundario"
                      tamanho="pequeno"
                      onClick={() => {
                        aoUsar(texto);
                        setAberta(false);
                      }}
                    >
                      Usar este texto
                    </Botao>
                  </div>
                  <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-tinta">{texto}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
