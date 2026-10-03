import { clientIp, rateLimit } from './_lib/ratelimit.js';

// Recebe inscrições na newsletter e pedidos de proposta in company e grava na tabela
// `leads` do Supabase (SQL em site/README.md). Chaves só nas variáveis de ambiente:
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.

const MAX = { email: 254, nome: 120, organizacao: 160, equipe: 40, tema: 200, mensagem: 3000, origem: 120 };
const okMail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export function cleanLead(body) {
  if (!body || typeof body !== 'object') return null;
  const tipo = body.tipo;
  if (tipo !== 'newsletter' && tipo !== 'incompany') return null;
  const row = { tipo };
  for (const [k, max] of Object.entries(MAX)) {
    const v = typeof body[k] === 'string' ? body[k].trim().slice(0, max) : '';
    if (v) row[k] = v;
  }
  if (!row.email || !okMail(row.email)) return null;
  row.email = row.email.toLowerCase();
  if (tipo === 'incompany' && (!row.nome || !row.organizacao)) return null;
  if (tipo === 'newsletter') for (const k of ['nome', 'organizacao', 'equipe', 'tema', 'mensagem']) delete row[k];
  return row;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

export function createHandler({ fetchImpl = fetch, env = process.env } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Método não permitido.' });
    }
    if (!sameOrigin(req)) return res.status(403).json({ error: 'Origem não permitida.' });
    const limit = rateLimit('lead:' + clientIp(req), Date.now(), 5);
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(limit.retryAfter));
      return res.status(429).json({ error: 'Muitos envios em sequência. Aguarde um minuto.' });
    }
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
    const row = cleanLead(body);
    if (!row) return res.status(400).json({ error: 'Dados incompletos.' });

    const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error('lead: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente');
      return res.status(503).json({ error: 'Envio indisponível no momento.' });
    }
    try {
      const r = await fetchImpl(`${url.replace(/\/$/, '')}/rest/v1/leads`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(row),
      });
      // 409: e-mail já inscrito na newsletter — para quem se inscreve, está feito.
      if (r.ok || r.status === 409) return res.status(200).json({ ok: true });
      console.error('lead: supabase', r.status, await r.text().catch(() => ''));
      return res.status(502).json({ error: 'Não foi possível enviar agora.' });
    } catch (err) {
      console.error('lead:', err?.message);
      return res.status(502).json({ error: 'Não foi possível enviar agora.' });
    }
  };
}

export default createHandler();
