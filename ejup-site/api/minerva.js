import { buscar } from './_lib/busca.js';
import RESPOSTAS_LOCAIS from './_lib/respostas.js';
import { clientIp, rateLimit } from './_lib/ratelimit.js';

// A Minerva não usa IA: responde com o banco de perguntas e respostas da EJUP.
// Fonte: tabela minerva_respostas no Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY);
// sem Supabase, ou se ele falhar, usa as respostas de api/_lib/respostas.js.

const MAX_CHARS = 500;
const CACHE_MS = 60_000;
export const SEM_RESPOSTA =
  'Ainda não tenho essa resposta cadastrada. Para essa dúvida, fale com a equipe da EJUP pelo WhatsApp 85 9 9271.4050 ou pelo e-mail contato@ejup.com.br.';

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

export function createHandler({ fetchImpl = fetch, env = process.env, now = Date.now } = {}) {
  let cache = { at: 0, items: null };

  async function respostas() {
    const url = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return RESPOSTAS_LOCAIS;
    if (cache.items && now() - cache.at < CACHE_MS) return cache.items;
    try {
      const r = await fetchImpl(`${url.replace(/\/$/, '')}/rest/v1/minerva_respostas?ativo=eq.true&select=id,pergunta,variacoes,palavras,resposta&order=ordem.asc`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!r.ok) throw new Error(String(r.status));
      const items = await r.json();
      if (!Array.isArray(items) || !items.length) throw new Error('tabela vazia');
      cache = { at: now(), items };
      return items;
    } catch (err) {
      console.error('minerva: banco indisponível, usando respostas locais', err?.message);
      return cache.items || RESPOSTAS_LOCAIS;
    }
  }

  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Método não permitido.' });
    }
    if (!sameOrigin(req)) return res.status(403).json({ error: 'Origem não permitida.' });

    const limit = rateLimit(clientIp(req));
    if (!limit.allowed) {
      res.setHeader('Retry-After', String(limit.retryAfter));
      return res.status(429).json({ error: 'Muitas perguntas em sequência. Aguarde um minuto e continue.' });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
    // aceita { pergunta } ou o formato de conversa { messages: [...] } (usa a última pergunta)
    const msgs = Array.isArray(body?.messages) ? body.messages : [];
    const last = [...msgs].reverse().find((m) => m && m.role === 'user' && typeof m.content === 'string');
    const pergunta = String(body?.pergunta ?? last?.content ?? '').trim().slice(0, MAX_CHARS);
    if (!pergunta) return res.status(400).json({ error: 'Escreva uma pergunta.' });

    const { item, sugestoes } = buscar(pergunta, await respostas());
    if (item) return res.status(200).json({ reply: item.resposta, id: item.id });
    return res.status(200).json({ reply: SEM_RESPOSTA, sugestoes });
  };
}

export default createHandler();
