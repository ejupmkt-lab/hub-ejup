import test from "node:test";
import assert from "node:assert/strict";
import { descreverErroDaIA } from "../src/lib/ia/erros";
import { lerFluxoDaIA } from "../src/lib/ia/fluxo";

// Erros do provedor: o usuário vê o tipo do problema, nunca "erro undefined"
test("erro da IA: cada tipo de problema vira uma mensagem clara, sem 'undefined'", () => {
  const casos: [string, Record<string, unknown>, string, number][] = [
    ["chave inválida (401)", { status: 401, name: "AuthenticationError", error: { type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } } }, "chave", 503],
    ["sem permissão (403)", { status: 403, name: "PermissionDeniedError" }, "chave", 503],
    ["saldo (400 com mensagem de crédito)", { status: 400, error: { error: { type: "invalid_request_error", message: "Your credit balance is too low to access the Anthropic API." } } }, "saldo", 503],
    ["limite (429)", { status: 429, name: "RateLimitError" }, "limite", 429],
    ["modelo (404)", { status: 404, error: { error: { type: "not_found_error", message: "model: claude-x" } } }, "modelo", 502],
    ["requisição inválida (400)", { status: 400, error: { error: { type: "invalid_request_error", message: "messages.0.content: too long" } } }, "requisicao", 502],
    ["tempo esgotado", { status: undefined, name: "APIConnectionTimeoutError", message: "Request timed out." }, "tempo", 504],
    ["sem conexão", { status: undefined, name: "APIConnectionError", message: "Connection error." }, "conexao", 502],
    ["sobrecarga em fluxo (sem status)", { status: undefined, error: { type: "error", error: { type: "overloaded_error", message: "Overloaded" } } }, "provedor", 502],
    ["erro 500", { status: 500, name: "InternalServerError" }, "provedor", 502],
  ];
  for (const [rotulo, erro, tipo, http] of casos) {
    const r = descreverErroDaIA(erro);
    assert.equal(r.tipo, tipo, rotulo);
    assert.equal(r.http, http, rotulo);
    assert.ok(!/undefined|null/.test(r.mensagem), `${rotulo}: ${r.mensagem}`);
  }
  assert.ok(descreverErroDaIA({ status: 400, error: { error: { type: "invalid_request_error", message: "messages.0.content: too long" } } }).mensagem.includes("messages.0.content: too long"), "mostra o motivo do provedor");
  assert.equal(descreverErroDaIA({ status: 401 }).status, 401);
  assert.equal(descreverErroDaIA({ status: undefined, name: "Error", message: "algo" }).status, null);
  assert.ok(!/undefined/.test(descreverErroDaIA(undefined).mensagem));
  assert.ok(!/undefined/.test(descreverErroDaIA(new Error("falhou")).mensagem));
});

const fluxo = (...partes: string[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      for (const p of partes) c.enqueue(new TextEncoder().encode(p));
      c.close();
    },
  });

test("fluxo da IA: progresso, resultado em partes quebradas no meio da linha e erro explicado", async () => {
  const visto: number[] = [];
  const r = await lerFluxoDaIA(
    fluxo('{"tipo":"vivo"}\n{"tipo":"progresso","caracteres":2500}\n{"tipo":"fi', 'm","resposta":"Feito.","acoes":[{"tipo":"marcar_atividades"}]}\n'),
    (n) => visto.push(n),
  );
  assert.equal(r.resposta, "Feito.");
  assert.equal(r.acoes.length, 1);
  assert.deepEqual(visto, [2500]);
  await assert.rejects(lerFluxoDaIA(fluxo('{"tipo":"erro","erro":"O saldo da conta acabou."}\n')), /O saldo da conta acabou\./);
  // A conexão cai sem "fim": tempo limite do servidor
  await assert.rejects(lerFluxoDaIA(fluxo('{"tipo":"progresso","caracteres":10}\n')), /antes da resposta terminar/);
});
