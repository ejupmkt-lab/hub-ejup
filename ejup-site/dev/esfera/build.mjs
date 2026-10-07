// Gera site/minerva/esfera.js a partir de esfera.js (three.js embutido, só o que é usado, minificado)
import { build } from 'esbuild';
const here = new URL('.', import.meta.url).pathname;
await build({
  entryPoints: [here + 'esfera.js'], bundle: true, format: 'esm', minify: true, target: 'es2020',
  outfile: here + '../../minerva/esfera.js', legalComments: 'none',
  banner: { js: '/* Esfera da Minerva (EJUP). Inclui three.js (MIT, © 2010-2024 three.js authors). Fonte: dev/esfera/esfera.js */' },
});
console.log('ok: minerva/esfera.js');
