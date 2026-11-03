import type { SupabaseClient } from "@supabase/supabase-js";

// Uso da IA integrada: tokens de cada chamada (gravados no banco) e o custo estimado pelo preço de tabela do modelo.
// Preços em US$ por milhão de tokens (entrada e saída); leitura do cache = 5% da entrada; escrita no cache (5 min) = 125%.
export const PRECOS_POR_MODELO: Record<string, { entrada: number; saida: number }> = {
  "claude-opus-5-5": { entrada: 4, saida: 20 },
  "claude-opus-5": { entrada: 5, saida: 25 },
  "claude-opus-4-8": { entrada: 5, saida: 25 },
  "claude-opus-4-7": { entrada: 5, saida: 25 },
  "claude-opus-4-6": { entrada: 5, saida: 25 },
  "claude-sonnet-5-5": { entrada: 2, saida: 10 },
  "claude-sonnet-5": { entrada: 2, saida: 10 },
  "claude-sonnet-4-6": { entrada: 3, saida: 15 },
  "claude-haiku-5-5": { entrada: 0.1, saida: 0.5 },
  "claude-haiku-4-5": { entrada: 1, saida: 5 },
  "claude-fable-5-1": { entrada: 10, saida: 50 },
  "claude-fable-5": { entrada: 10, saida: 50 },
  "claude-mythos-5-1": { entrada: 10, saida: 50 },
};
// Modelo que o sistema pede; usado no preço quando a resposta traz um modelo que não está na tabela
export const MODELO_PADRAO = "claude-opus-5-5";

export const ROTAS_DA_IA = {
  conversa: "Conversa nos projetos",
  "importar-hub": "Importar do HUB",
  "relatorio-hub": "Relatório lido do HUB",
  "ficha-servico": "Ficha de serviço",
} as const;
export type RotaDaIA = keyof typeof ROTAS_DA_IA;

export type TokensDeUso = { entrada: number; saida: number; cacheLeitura: number; cacheEscrita: number };
export const semUso: TokensDeUso = { entrada: 0, saida: 0, cacheLeitura: 0, cacheEscrita: 0 };

export function custoUsd(modelo: string, t: TokensDeUso) {
  const p = PRECOS_POR_MODELO[modelo] ?? PRECOS_POR_MODELO[MODELO_PADRAO];
  return (t.entrada * p.entrada + t.saida * p.saida + t.cacheLeitura * p.entrada * 0.05 + t.cacheEscrita * p.entrada * 1.25) / 1_000_000;
}

type RespostaComUso = {
  model?: string;
  usage?: { input_tokens?: number | null; output_tokens?: number | null; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null } | null;
};

// Grava o uso de uma resposta da IA. Nunca atrapalha a resposta: qualquer falha ao gravar é só registrada no log.
export async function registrarUso(sb: SupabaseClient, rota: RotaDaIA, resposta: RespostaComUso, projetoId?: string) {
  try {
    const u = resposta.usage;
    if (!u) return;
    const { error } = await sb.rpc("registrar_uso_ia", {
      p_rota: rota,
      p_modelo: resposta.model ?? MODELO_PADRAO,
      p_entrada: u.input_tokens ?? 0,
      p_saida: u.output_tokens ?? 0,
      p_cache_leitura: u.cache_read_input_tokens ?? 0,
      p_cache_escrita: u.cache_creation_input_tokens ?? 0,
      p_projeto_id: projetoId ?? null,
    });
    if (error) console.error("Não foi possível registrar o uso da IA:", error.message);
  } catch (e) {
    console.error("Não foi possível registrar o uso da IA:", e);
  }
}
