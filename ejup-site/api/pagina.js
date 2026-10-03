import { readFileSync } from 'node:fs';
import { createSb } from './_lib/sb.js';
import { conteudo, metaPara, render, sitemap, robots } from './_lib/seo.js';

// Entrega as páginas do site (todas usam o mesmo app.html) com título, descrição, imagem de prévia e
// dados estruturados de cada endereço; também gera /sitemap.xml e /robots.txt.

const CACHE_MS = 60_000;

export function createPaginaHandler({ fetchImpl = fetch, env = process.env, now = Date.now, html } = {}) {
  let modelo = html;
  let cache = { at: 0, rows: null };
  async function itens() {
    const sb = createSb({ env, fetchImpl });
    if (!sb.configured) return [];
    if (cache.rows && now() - cache.at < CACHE_MS) return cache.rows;
    try {
      const rows = await sb.rest.get('site_itens', 'publicado=is.true&select=tipo,id,dados,ordem&order=ordem.asc');
      cache = { at: now(), rows };
      return rows;
    } catch {
      return cache.rows || [];
    }
  }
  return async function handler(req, res) {
    const url = new URL(req.url || '/', 'http://x');
    const q = req.query && typeof req.query === 'object' ? req.query : Object.fromEntries(url.searchParams);
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || (/^localhost|^127\./.test(host) ? 'http' : 'https');
    const origin = String(env.SITE_URL || `${proto}://${host}`).replace(/\/$/, '');
    // navegador sempre confere; a CDN da Vercel guarda por 5 min
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('Vercel-CDN-Cache-Control', 'max-age=300, stale-while-revalidate=86400');
    const C = conteudo(await itens());
    if (q.robots) { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.status(200).send(robots(origin)); }
    if (q.sitemap) { res.setHeader('Content-Type', 'application/xml; charset=utf-8'); return res.status(200).send(sitemap(C, origin)); }
    if (!modelo) modelo = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
    const m = metaPara(String(q.p || '/'), C, origin);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(m.status).send(render(modelo, m));
  };
}

export default createPaginaHandler();
