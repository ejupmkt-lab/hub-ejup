// Servidor local que imita a Vercel: estáticos de site/, / -> /minerva e POST /api/minerva.
// MINERVA_MOCK=1 responde sem chamar a API da Anthropic (para testar a interface).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import handler, { createHandler } from '../api/minerva.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const mock = createHandler({ getModel: () => ({ beta: { messages: { create: async ({ messages }) => {
  await new Promise((r) => setTimeout(r, 900));
  return { stop_reason: 'end_turn', content: [{ type: 'text', text: `Resposta de teste para: ${messages.at(-1).content}` }] };
} } } }) });
const api = process.env.MINERVA_MOCK ? mock : handler;
const { default: leadHandler } = await import('../api/lead.js');

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/minerva' || url.pathname === '/api/lead') {
    let raw = ''; for await (const c of req) raw += c;
    try { req.body = JSON.parse(raw); } catch { req.body = raw; }
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (p) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(p)); return res; };
    return url.pathname === '/api/lead' ? leadHandler(req, res) : api(req, res);
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
}).listen(port, () => console.log(`Site em http://localhost:${port}/ · Minerva em /minerva${process.env.MINERVA_MOCK ? ' (mock)' : ''}`));
