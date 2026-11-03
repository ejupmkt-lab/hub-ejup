import test from "node:test";
import assert from "node:assert/strict";
import { MODELO_PADRAO, PRECOS_POR_MODELO, custoUsd, registrarUso, semUso } from "../src/lib/ia/uso";

test("o custo estimado usa o preço de tabela do modelo (US$ por milhão de tokens)", () => {
  assert.equal(custoUsd("claude-opus-5-5", { ...semUso, entrada: 1_000_000, saida: 1_000_000 }), 24);
  assert.equal(custoUsd("claude-opus-5-5", { ...semUso, entrada: 12_345, saida: 2_000 }), (12_345 * 4 + 2_000 * 20) / 1_000_000);
  assert.equal(custoUsd("claude-sonnet-5-5", { ...semUso, entrada: 1_000_000, saida: 1_000_000 }), 12);
  assert.equal(custoUsd("claude-opus-5-5", semUso), 0);
});

test("o cache custa 5% da entrada na leitura e 125% na escrita; modelo desconhecido usa o preço do modelo padrão", () => {
  assert.equal(custoUsd("claude-opus-5-5", { ...semUso, cacheLeitura: 1_000_000 }), 0.2);
  assert.equal(custoUsd("claude-opus-5-5", { ...semUso, cacheEscrita: 1_000_000 }), 5);
  assert.equal(custoUsd("modelo-que-nao-existe", { ...semUso, entrada: 1_000_000 }), PRECOS_POR_MODELO[MODELO_PADRAO].entrada);
});

test("registrar o uso manda os tokens da resposta ao banco e nunca estoura se o banco falhar", async () => {
  const chamadas: { fn: string; args: Record<string, unknown> }[] = [];
  const sb = { rpc: async (fn: string, args: Record<string, unknown>) => (chamadas.push({ fn, args }), { error: null }) };
  await registrarUso(sb as never, "conversa", { model: "claude-opus-5-5", usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 5, cache_creation_input_tokens: null } }, "prj-1");
  assert.deepEqual(chamadas[0], { fn: "registrar_uso_ia", args: { p_rota: "conversa", p_modelo: "claude-opus-5-5", p_entrada: 100, p_saida: 20, p_cache_leitura: 5, p_cache_escrita: 0, p_projeto_id: "prj-1" } });
  await registrarUso(sb as never, "ficha-servico", {}); // sem uso na resposta: não grava
  assert.equal(chamadas.length, 1);
  const quebrado = { rpc: async () => { throw new Error("banco fora do ar"); } };
  await assert.doesNotReject(registrarUso(quebrado as never, "importar-hub", { usage: { input_tokens: 1, output_tokens: 1 } }));
  const recusado = { rpc: async () => ({ error: { message: "Sem acesso." } }) };
  await assert.doesNotReject(registrarUso(recusado as never, "importar-hub", { usage: { input_tokens: 1, output_tokens: 1 } }));
});
