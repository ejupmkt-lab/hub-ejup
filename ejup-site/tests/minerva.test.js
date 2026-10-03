import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, SEM_RESPOSTA } from '../api/minerva.js';
import { buscar, tokens } from '../api/_lib/busca.js';
import RESPOSTAS from '../api/_lib/respostas.js';
import { _reset } from '../api/_lib/ratelimit.js';

beforeEach(_reset);

function call(handler, { method = 'POST', body, headers = {} } = {}) {
  const req = { method, body, headers: { host: 'ejup.test', 'x-forwarded-for': '1.2.3.4', ...headers } };
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; }, json(p) { this.payload = p; return this; } };
  return handler(req, res).then(() => res);
}
const pergunta = (q) => ({ messages: [{ role: 'user', content: q }] });

test('responde com a resposta cadastrada mais parecida', async () => {
  const h = createHandler({ env: {} });
  const casos = {
    'O que é a EJUP?': 'ejup', 'oi': 'saudacao', 'quanto custa o curso de licenciamento?': 'preco',
    'tem curso para minha empresa': 'incompany', 'como me matriculo': 'estudar', 'qual o whatsapp de vocês': 'contato',
    'quem é leonardo pivotto': 'professores', 'tem certificado?': 'certificado', 'onde fica a escola': 'endereco',
    'tenho um processo trabalhista': 'juridica',
  };
  for (const [q, id] of Object.entries(casos)) {
    const res = await call(h, { body: pergunta(q) });
    assert.equal(res.payload.id, id, q);
    assert.equal(res.payload.reply, RESPOSTAS.find((r) => r.id === id).resposta);
  }
});

test('sem resposta cadastrada, encaminha para a equipe', async () => {
  const res = await call(createHandler({ env: {} }), { body: pergunta('qual a capital da França?') });
  assert.equal(res.payload.reply, SEM_RESPOSTA);
  assert.ok(Array.isArray(res.payload.sugestoes));
});

test('aceita { pergunta } e usa a última pergunta da conversa', async () => {
  const h = createHandler({ env: {} });
  assert.equal((await call(h, { body: { pergunta: 'tem newsletter?' } })).payload.id, 'newsletter');
  const conversa = { messages: [{ role: 'user', content: 'oi' }, { role: 'assistant', content: '...' }, { role: 'user', content: 'o que é o ejupcast' }] };
  assert.equal((await call(h, { body: conversa })).payload.id, 'ejupcast');
});

test('lê o banco do Supabase e cai no local se ele falhar', async () => {
  const env = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k' };
  let calls = 0;
  const banco = [{ id: 'teste', pergunta: 'Qual a cor da marca?', variacoes: [], palavras: ['cor'], resposta: 'Navy e ouro.' }];
  const h = createHandler({ env, fetchImpl: async (url) => { calls++; assert.match(url, /minerva_respostas/); return { ok: true, json: async () => banco }; } });
  assert.equal((await call(h, { body: pergunta('qual a cor da marca') })).payload.reply, 'Navy e ouro.');
  await call(h, { body: pergunta('qual a cor da marca') });
  assert.equal(calls, 1, 'usa cache por 60 s');
  const orig = console.error; console.error = () => {};
  const falha = createHandler({ env, fetchImpl: async () => ({ ok: false, status: 500 }) });
  assert.equal((await call(falha, { body: pergunta('O que é a EJUP?') })).payload.id, 'ejup');
  console.error = orig;
});

test('rejeita GET, origem externa e pergunta vazia; limita 20 por minuto', async () => {
  const h = createHandler({ env: {} });
  assert.equal((await call(h, { method: 'GET' })).statusCode, 405);
  assert.equal((await call(h, { headers: { origin: 'https://outro.site' }, body: pergunta('oi') })).statusCode, 403);
  assert.equal((await call(h, { body: { messages: [] } })).statusCode, 400);
  for (let i = 0; i < 19; i++) await call(h, { body: pergunta('oi') }); // + a pergunta vazia acima = 20
  assert.equal((await call(h, { body: pergunta('oi') })).statusCode, 429);
});

test('normalização ignora acentos, maiúsculas e palavras vazias', () => {
  assert.deepEqual(tokens('Quais são as FORMAÇÕES?'), ['formacao']);
  assert.equal(buscar('', RESPOSTAS).item, null);
});
