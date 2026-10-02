import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit, clientIp, _reset } from '../api/_lib/ratelimit.js';

beforeEach(_reset);

test('permite 20 por minuto e bloqueia a 21ª', () => {
  for (let i = 0; i < 20; i++) assert.equal(rateLimit('1.1.1.1', 1000).allowed, true);
  const r = rateLimit('1.1.1.1', 1000);
  assert.equal(r.allowed, false);
  assert.equal(r.retryAfter, 60);
});

test('libera de novo depois da janela', () => {
  for (let i = 0; i < 21; i++) rateLimit('1.1.1.1', 0);
  assert.equal(rateLimit('1.1.1.1', 60_000).allowed, true);
});

test('IPs diferentes têm contagens separadas', () => {
  for (let i = 0; i < 21; i++) rateLimit('1.1.1.1', 0);
  assert.equal(rateLimit('2.2.2.2', 0).allowed, true);
});

test('lê o IP do x-forwarded-for', () => {
  assert.equal(clientIp({ headers: { 'x-forwarded-for': '9.9.9.9, 10.0.0.1' } }), '9.9.9.9');
});
