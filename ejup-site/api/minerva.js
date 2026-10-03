import Anthropic from '@anthropic-ai/sdk';
import { MINERVA_PROMPT } from './_lib/prompt.js';
import { clientIp, rateLimit } from './_lib/ratelimit.js';

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 12;
const MAX_CHARS = 1500;

const FALLBACK = {
  refusal: 'Prefiro não seguir por esse caminho. Posso ajudar com outra pergunta sobre o Direito ou sobre a EJUP.',
  error: 'Não consegui responder agora. Tente de novo em instantes.',
};

let client;
const getClient = () => (client ??= new Anthropic());

// Mantém só pares válidos (user/assistant alternados, começando e terminando em user).
export function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  const msgs = input
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .filter((m) => m.content);
  const out = [];
  for (const m of msgs) {
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1] = m;
    else out.push(m);
  }
  while (out.length && out[0].role !== 'user') out.shift();
  if (!out.length || out[out.length - 1].role !== 'user') return null;
  let recent = out.slice(-MAX_TURNS);
  if (recent[0].role !== 'user') recent = recent.slice(1);
  return recent;
}

// Rede de segurança: o prompt já pede texto corrido; isto remove markdown que escape.
export function plainText(text) {
  return text
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*/g, ''))
    .replace(/\*\*(.+?)\*\*|__(.+?)__/g, '$1$2')
    .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,;:!?]|$)/g, '$1$2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

export function createHandler({ getModel = getClient } = {}) {
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
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = null; }
    }
    const messages = cleanMessages(body?.messages);
    if (!messages) return res.status(400).json({ error: 'Envie a pergunta no campo messages.' });

    try {
      const response = await getModel().beta.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: MINERVA_PROMPT,
        output_config: { effort: 'low' },
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        messages,
      });
      if (response.stop_reason === 'refusal') return res.status(200).json({ reply: FALLBACK.refusal });
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');
      return res.status(200).json({ reply: plainText(text) || FALLBACK.error });
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) {
        return res.status(503).json({ error: 'A Minerva está com muitas conversas agora. Tente de novo em instantes.' });
      }
      console.error('minerva', err?.status, err?.message);
      return res.status(502).json({ error: FALLBACK.error });
    }
  };
}

export default createHandler();
