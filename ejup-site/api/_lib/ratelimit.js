// Limite simples por IP em janela fixa, guardado na memória da função.
// Na Vercel cada instância tem a própria memória: o limite é por instância,
// suficiente para conter abuso casual. Para limite global, trocar por Upstash/KV.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const hits = new Map();

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'desconhecido';
}

export function rateLimit(ip, now = Date.now(), max = MAX_REQUESTS, windowMs = WINDOW_MS) {
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v.start >= windowMs) hits.delete(k);
  }
  let entry = hits.get(ip);
  if (!entry || now - entry.start >= windowMs) {
    entry = { start: now, count: 0 };
    hits.set(ip, entry);
  }
  entry.count += 1;
  const allowed = entry.count <= max;
  const retryAfter = Math.ceil((entry.start + windowMs - now) / 1000);
  return { allowed, remaining: Math.max(0, max - entry.count), retryAfter };
}

export function _reset() {
  hits.clear();
}
