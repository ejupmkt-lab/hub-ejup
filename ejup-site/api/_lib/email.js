// E-mails do Portal (dúvida nova, resposta do professor, plantão, lembretes).
// Só envia se RESEND_API_KEY e EMAIL_FROM estiverem nas variáveis da Vercel; sem elas, não faz nada.

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function layout({ titulo, linhas = [], botao, link, rodape, selo = 'EJUP · Portal do Aluno' }) {
  const p = linhas.map((l) => `<p style="margin:0 0 14px;font:300 16px/1.6 Montserrat,Arial,sans-serif;color:#414042">${esc(l)}</p>`).join('');
  const b = botao && link
    ? `<p style="margin:24px 0 0"><a href="${esc(link)}" style="display:inline-block;padding:12px 22px;background:#031c37;color:#ffffff;border-radius:4px;font:500 14px Montserrat,Arial,sans-serif;text-decoration:none">${esc(botao)}</a></p>`
    : '';
  return `<div style="background:#f4f5f6;padding:32px 16px"><div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px">
<p style="margin:0 0 20px;font:500 11px Montserrat,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#9b6b26">${esc(selo)}</p>
<h1 style="margin:0 0 18px;font:900 24px/1.15 Montserrat,Arial,sans-serif;color:#031c37">${esc(titulo)}</h1>${p}${b}
<p style="margin:28px 0 0;font:300 12px/1.6 Montserrat,Arial,sans-serif;color:#5f6062">EJUP · Rua da Saudade, 1028 — Lagoa Nova, Natal/RN · contato@ejup.com.br</p>${rodape ? `<p style="margin:10px 0 0;font:300 12px/1.6 Montserrat,Arial,sans-serif;color:#5f6062">${rodape}</p>` : ''}</div></div>`;
}

export function createMailer({ env, fetchImpl = fetch }) {
  const enabled = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
  async function send({ to, subject, titulo, linhas, botao, link }) {
    if (!enabled || !to || (Array.isArray(to) && !to.length)) return false;
    const list = Array.isArray(to) ? to : [to];
    try {
      // um envio por destinatário: ninguém vê o e-mail dos outros alunos
      for (let i = 0; i < list.length; i += 1) {
        const r = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: env.EMAIL_FROM, to: [list[i]], subject, html: layout({ titulo: titulo || subject, linhas, botao, link }), text: [titulo || subject, ...(linhas || []), link || ''].join('\n\n') }),
        });
        if (!r.ok) console.error('email:', r.status, await r.text().catch(() => ''));
      }
      return true;
    } catch (err) {
      console.error('email:', err?.message);
      return false;
    }
  }
  // newsletter: até 100 por chamada (limite do Resend), cada um com o próprio link de descadastro
  async function sendBatch(msgs) {
    if (!enabled || !msgs.length) return 0;
    let ok = 0;
    for (let i = 0; i < msgs.length; i += 100) {
      const lote = msgs.slice(i, i + 100).map((m) => ({ from: env.EMAIL_FROM, to: [m.to], subject: m.subject, html: m.html, text: m.text, headers: m.headers }));
      const r = await fetchImpl('https://api.resend.com/emails/batch', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(lote) });
      if (!r.ok) { console.error('email lote:', r.status, await r.text().catch(() => '')); break; }
      ok += lote.length;
    }
    return ok;
  }
  return { enabled, send, sendBatch };
}
