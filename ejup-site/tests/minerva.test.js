import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, cleanMessages, plainText } from '../api/minerva.js';
import { _reset } from '../api/_lib/ratelimit.js';

beforeEach(_reset);

function call(handler, { method = 'POST', body, headers = {} } = {}) {
  const req = { method, body, headers: { host: 'ejup.test', 'x-forwarded-for': '1.2.3.4', ...headers } };
  const res = {
    statusCode: 200, headers: {}, payload: undefined,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; },
  };
  return handler(req, res).then(() => res);
}

const fakeModel = (response, seen = {}) => () => ({
  beta: { messages: { create: async (params) => { seen.params = params; return response; } } },
});

test('responde em texto corrido e envia prompt, modelo e histórico', async () => {
  const seen = {};
  const h = createHandler({ getModel: fakeModel({ stop_reason: 'end_turn', content: [{ type: 'text', text: '**A EJUP** é uma escola.\n- Natal/RN' }] }, seen) });
  const res = await call(h, { body: { messages: [{ role: 'user', content: 'O que é a EJUP?' }] } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.reply, 'A EJUP é uma escola.\nNatal/RN');
  assert.equal(seen.params.model, 'claude-opus-5-5');
  assert.match(seen.params.system, /Minerva/);
  assert.equal(seen.params.fallbacks, 'default');
  assert.deepEqual(seen.params.messages, [{ role: 'user', content: 'O que é a EJUP?' }]);
});

test('recusa vira mensagem cordial', async () => {
  const h = createHandler({ getModel: fakeModel({ stop_reason: 'refusal', content: [] }) });
  const res = await call(h, { body: { messages: [{ role: 'user', content: 'x' }] } });
  assert.equal(res.statusCode, 200);
  assert.match(res.payload.reply, /outra pergunta/);
});

test('aceita corpo em string', async () => {
  const h = createHandler({ getModel: fakeModel({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Sim.' }] }) });
  const res = await call(h, { body: JSON.stringify({ messages: [{ role: 'user', content: 'Oi' }] }) });
  assert.equal(res.payload.reply, 'Sim.');
});

test('rejeita GET, origem externa e corpo inválido', async () => {
  const h = createHandler({ getModel: fakeModel({}) });
  assert.equal((await call(h, { method: 'GET' })).statusCode, 405);
  assert.equal((await call(h, { headers: { origin: 'https://outro.site' }, body: { messages: [{ role: 'user', content: 'a' }] } })).statusCode, 403);
  assert.equal((await call(h, { body: { messages: [] } })).statusCode, 400);
  assert.equal((await call(h, { body: { messages: [{ role: 'assistant', content: 'a' }] } })).statusCode, 400);
});

test('bloqueia a 21ª requisição do mesmo IP no minuto', async () => {
  const h = createHandler({ getModel: fakeModel({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] }) });
  const body = { messages: [{ role: 'user', content: 'a' }] };
  for (let i = 0; i < 20; i++) assert.equal((await call(h, { body })).statusCode, 200);
  const res = await call(h, { body });
  assert.equal(res.statusCode, 429);
  assert.ok(res.headers['Retry-After']);
});

test('erro da API não vaza detalhes', async () => {
  const h = createHandler({ getModel: () => ({ beta: { messages: { create: async () => { throw new Error('segredo interno'); } } } }) });
  const orig = console.error; console.error = () => {};
  const res = await call(h, { body: { messages: [{ role: 'user', content: 'a' }] } });
  console.error = orig;
  assert.equal(res.statusCode, 502);
  assert.doesNotMatch(JSON.stringify(res.payload), /segredo/);
});

test('cleanMessages corta histórico, limita tamanho e exige pergunta no fim', () => {
  const long = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm' + i }));
  long.push({ role: 'user', content: 'x'.repeat(5000) });
  const out = cleanMessages(long);
  assert.ok(out.length <= 12);
  assert.equal(out[0].role, 'user');
  assert.equal(out.at(-1).content.length, 1500);
  assert.equal(cleanMessages([{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }]), null);
  assert.equal(cleanMessages('nada'), null);
});

test('plainText remove markdown comum', () => {
  assert.equal(plainText('# Título\n*ênfase* e `código` [EJUP](https://ejup.com.br)'), 'Título\nênfase e código EJUP (https://ejup.com.br)');
});
