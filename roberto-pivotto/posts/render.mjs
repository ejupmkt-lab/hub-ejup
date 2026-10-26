// Exporta cada <section class="s" data-out="..."> de posts/<data>/artes.html como PNG no tamanho de publicação.
// node posts/render.mjs 2026-10-26
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), process.argv[2]);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1200, height: 2000 } });
await p.goto('file://' + path.join(dir, 'artes.html'), { waitUntil: 'networkidle' });
await p.waitForSelector('body[data-pronto="1"]');
for (const el of await p.$$('section.s')) {
  const nome = await el.getAttribute('data-out');
  await el.screenshot({ path: path.join(dir, nome + '.png') });
  console.log(nome);
}
await b.close();
