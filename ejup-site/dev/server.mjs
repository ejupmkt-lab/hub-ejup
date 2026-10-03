// Servidor local que imita a Vercel: estáticos de site/, / -> /minerva e POST /api/minerva.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from '../api/minerva.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT || 3000);
const types = { '.webp': 'image/webp', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const api = handler;
const { default: leadHandler } = await import('../api/lead.js');
let paginaHandler = (await import('../api/pagina.js')).default;
// FAKE_SB=1: Portal com Supabase em memória (dev/fake-supabase.mjs), com aluno e professor de exemplo
let portalHandler = (await import('../api/portal.js')).default;
if (process.env.FAKE_SB) {
  const { createFakeSupabase, seed } = await import('./fake-supabase.mjs');
  const { createPortalHandler } = await import('../api/_lib/portal.js');
  const fake = createFakeSupabase();
  seed(fake);
  const { createPaginaHandler } = await import('../api/pagina.js');
  paginaHandler = createPaginaHandler({ fetchImpl: fake.fetchImpl, env: { SUPABASE_URL: fake.url, SUPABASE_SERVICE_ROLE_KEY: 'dev' } });
  portalHandler = createPortalHandler({ fetchImpl: fake.fetchImpl, env: { SUPABASE_URL: fake.url, SUPABASE_SERVICE_ROLE_KEY: 'dev', PORTAL_GOOGLE: process.env.PORTAL_GOOGLE } });
  console.log('Portal com dados de exemplo: aluno@ejup.com.br / senha-aluno-1 · professor@ejup.com.br / senha-prof-1');
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/minerva' || url.pathname === '/api/lead' || url.pathname === '/api/portal') {
    let raw = ''; for await (const c of req) raw += c;
    try { req.body = JSON.parse(raw); } catch { req.body = raw; }
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (p) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(p)); return res; };
    if (url.pathname === '/api/portal') return portalHandler(req, res);
    return url.pathname === '/api/lead' ? leadHandler(req, res) : api(req, res);
  }
  // páginas do site (sem extensão), /sitemap.xml e /robots.txt: como na Vercel, passam pelo api/pagina.js
  if (!extname(url.pathname) || url.pathname === '/sitemap.xml' || url.pathname === '/robots.txt') {
    const isMinerva = url.pathname.replace(/\/$/, '') === '/minerva';
    if (!isMinerva) {
      req.query = url.pathname === '/sitemap.xml' ? { sitemap: '1' } : url.pathname === '/robots.txt' ? { robots: '1' } : { p: url.pathname };
      res.status = (c) => { res.statusCode = c; return res; };
      res.send = (b) => { res.end(b); return res; };
      return paginaHandler(req, res);
    }
  }
  let file = normalize(join(root, decodeURIComponent(url.pathname)));
  if (!file.startsWith(root) || /\/(api|dev|tests|node_modules)\//.test(file.slice(root.length - 1))) { res.writeHead(404); return res.end(); }
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = extname(file) ? file : join(root, 'index.html'); }
  try {
    const data = await readFile(file);
    const type = types[extname(file)] || 'application/octet-stream';
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const start = Number(range[1] || 0), end = range[2] ? Number(range[2]) : data.length - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      return res.end(data.subarray(start, end + 1));
    }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': data.length });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
}).listen(port, () => console.log(`Site em http://localhost:${port}/ · Minerva em /minerva`));
