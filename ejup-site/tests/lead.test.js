import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, cleanLead } from '../api/lead.js';
import { _reset } from '../api/_lib/ratelimit.js';

beforeEach(_reset);
const env = { SUPABASE_URL: 'https://x.supabase.co/', SUPABASE_SERVICE_ROLE_KEY: 'chave' };

function call(handler, { method = 'POST', body, headers = {} } = {}) {
  const req = { method, body, headers: { host: 'ejup.test', 'x-forwarded-for': '5.6.7.8', ...headers } };
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; }, json(p) { this.payload = p; return this; } };
  return handler(req, res).then(() => res);
}

test('grava a inscrição na newsletter no Supabase', async () => {
  const seen = {};
  const h = createHandler({ env, fetchImpl: async (url, init) => { Object.assign(seen, { url, init }); return { ok: true, status: 201 }; } });
  const res = await call(h, { body: { tipo: 'newsletter', email: ' Ana@Exemplo.com ', nome: 'ignorado' } });
  assert.equal(res.statusCode, 200);
  assert.equal(seen.url, 'https://x.supabase.co/rest/v1/leads');
  assert.equal(seen.init.headers.Authorization, 'Bearer chave');
  assert.deepEqual(JSON.parse(seen.init.body), { tipo: 'newsletter', email: 'ana@exemplo.com' });
});

test('e-mail já inscrito conta como sucesso', async () => {
  const h = createHandler({ env, fetchImpl: async () => ({ ok: false, status: 409, text: async () => '' }) });
  assert.equal((await call(h, { body: { tipo: 'newsletter', email: 'a@b.com' } })).statusCode, 200);
});

test('sem Supabase configurado responde 503', async () => {
  const h = createHandler({ env: {}, fetchImpl: async () => { throw new Error('não deveria chamar'); } });
  const orig = console.error; console.error = () => {};
  const res = await call(h, { body: { tipo: 'newsletter', email: 'a@b.com' } });
  console.error = orig;
  assert.equal(res.statusCode, 503);
});

test('valida tipo, e-mail e campos do in company', () => {
  assert.equal(cleanLead({ tipo: 'outro', email: 'a@b.com' }), null);
  assert.equal(cleanLead({ tipo: 'newsletter', email: 'invalido' }), null);
  assert.equal(cleanLead({ tipo: 'incompany', email: 'a@b.com', nome: 'Ana' }), null);
  const r = cleanLead({ tipo: 'incompany', email: 'a@b.com', nome: 'Ana', organizacao: 'Org', mensagem: 'x'.repeat(5000) });
  assert.equal(r.mensagem.length, 3000);
});

test('limita a 5 envios por minuto e recusa outra origem', async () => {
  const h = createHandler({ env, fetchImpl: async () => ({ ok: true, status: 201 }) });
  const body = { tipo: 'newsletter', email: 'a@b.com' };
  for (let i = 0; i < 5; i++) assert.equal((await call(h, { body })).statusCode, 200);
  assert.equal((await call(h, { body })).statusCode, 429);
  assert.equal((await call(h, { body, headers: { origin: 'https://outro.site', 'x-forwarded-for': '9.9.9.9' } })).statusCode, 403);
});
