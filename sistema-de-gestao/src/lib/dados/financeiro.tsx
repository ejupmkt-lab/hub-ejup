"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import type { FinProjeto, FinServico } from "@/lib/financeiro";
import { traduzirErro } from "@/lib/erros";
import { useUsuario } from "./store";

// Valores e recebimentos, carregados só para quem tem a permissão (o banco
// não entrega nada aos demais). Devolve null para quem não vê o financeiro.
export function useFinanceiro() {
  const usuario = useUsuario();
  const pode = !!usuario.veFinanceiro;
  const [servicos, setServicos] = useState<Record<string, FinServico>>({});
  const [projetos, setProjetos] = useState<Record<string, FinProjeto>>({});
  const [carregado, setCarregado] = useState(false);

  const carregar = useCallback(async () => {
    if (!pode) return;
    const sb = supabaseNavegador();
    const [s, p] = await Promise.all([
      sb.from("financeiro_servicos").select("servico_id, empresa, teto, valor_hora, perc_funcern"),
      sb.from("financeiro_projetos").select("projeto_id, empresa, valor_hora, perc_funcern, recebidos"),
    ]);
    setServicos(
      Object.fromEntries(
        (s.data ?? []).map((x) => [
          x.servico_id,
          { servicoId: x.servico_id, empresa: x.empresa, teto: Number(x.teto), valorHora: Number(x.valor_hora), percFuncern: Number(x.perc_funcern) },
        ]),
      ),
    );
    setProjetos(
      Object.fromEntries(
        (p.data ?? []).map((x) => [
          x.projeto_id,
          {
            projetoId: x.projeto_id,
            empresa: x.empresa,
            valorHora: x.valor_hora === null ? null : Number(x.valor_hora),
            percFuncern: x.perc_funcern === null ? null : Number(x.perc_funcern),
            recebidos: (x.recebidos ?? {}) as Record<string, string>,
          },
        ]),
      ),
    );
    setCarregado(true);
  }, [pode]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const salvarServico = async (f: FinServico) => {
    const { error } = await supabaseNavegador()
      .from("financeiro_servicos")
      .upsert({ servico_id: f.servicoId, empresa: f.empresa, teto: f.teto, valor_hora: f.valorHora, perc_funcern: f.percFuncern, updated_at: new Date().toISOString() });
    if (error) throw new Error(traduzirErro(error));
    setServicos((x) => ({ ...x, [f.servicoId]: f }));
  };
  // Muda na tela na hora e volta atrás se o banco recusar
  const salvarProjeto = async (f: FinProjeto) => {
    const antes = projetos[f.projetoId];
    setProjetos((x) => ({ ...x, [f.projetoId]: f }));
    const { error } = await supabaseNavegador()
      .from("financeiro_projetos")
      .upsert({
        projeto_id: f.projetoId,
        empresa: f.empresa,
        valor_hora: f.valorHora,
        perc_funcern: f.percFuncern,
        recebidos: f.recebidos,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      setProjetos((x) => {
        const y = { ...x };
        if (antes) y[f.projetoId] = antes;
        else delete y[f.projetoId];
        return y;
      });
      throw new Error(traduzirErro(error));
    }
  };

  if (!pode) return null;
  return { servicos, projetos, carregado, salvarServico, salvarProjeto, recarregar: carregar };
}
