// Gera os PDFs a partir das páginas de apresentacao/.
// node design-system/roteiros/pdf.mjs videos 3A 3B 4  → fontes/Video-<id>-<slug>.pdf (um por roteiro)
// node design-system/roteiros/pdf.mjs planner          → fontes/Planner-semanal-Roberto-Pivotto.pdf e .png
// node design-system/roteiros/pdf.mjs pauta 2026-10-26 → fontes/Pauta-semana-<data>-Roberto-Pivotto.pdf
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [modo, ...args] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
async function abre(rel, viewport) {
  const p = await b.newPage(viewport ? { viewport } : {});
  await p.goto('file://' + path.join(ROOT, 'apresentacao', rel, 'index.html'), { waitUntil: 'networkidle' });
  await p.evaluate(async () => { await document.fonts.ready; });
  await p.emulateMedia({ media: 'print' });
  return p;
}
if (modo === 'videos') {
  for (const id of args) {
    const p = await abre('roteiros/videos');
    await p.addStyleTag({ content: `.roteiro:not([data-id="${id}"]){display:none} .roteiro[data-id="${id}"] .video:last-child{break-after:auto!important}` });
    const slug = await p.$eval(`.roteiro[data-id="${id}"]`, e => e.dataset.slug);
    const out = path.join(ROOT, 'fontes', `Video-${id}-${slug}.pdf`);
    await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    console.log(out); await p.close();
  }
} else if (modo === 'planner') {
  const p = await abre('planner', { width: 1920, height: 1080 });
  await p.pdf({ path: path.join(ROOT, 'fontes/Planner-semanal-Roberto-Pivotto.pdf'), width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
  await p.screenshot({ path: path.join(ROOT, 'fontes/Planner-semanal-Roberto-Pivotto.png') });
  console.log('planner');
} else if (modo === 'pauta') {
  const p = await abre(`pautas/${args[0]}`);
  const out = path.join(ROOT, 'fontes', `Pauta-semana-${args[0]}-Roberto-Pivotto.pdf`);
  await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(out);
}
await b.close();
