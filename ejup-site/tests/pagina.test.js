import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPaginaHandler } from '../api/pagina.js';
import { metaPara, conteudo } from '../api/_lib/seo.js';
import { createFakeSupabase } from '../dev/fake-supabase.mjs';

const HTML = '<head><!--seo-->\n<title>x</title>\n<!--/seo--></head><body></body>';
function call(h, query) {
  const req = { url: '/api/pagina', query, headers: { host: 'ejup.com.br', 'x-forwarded-proto': 'https' } };
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, status(c) { this.statusCode = c; return this; }, send(b) { this.body = b; return this; } };
  return h(req, res).then(() => res);
}

test('cada página sai com título, descrição, imagem de prévia e endereço próprios', async () => {
  const h = createPaginaHandler({ env: {}, html: HTML });
  const f = await call(h, { p: '/formacao/licenciamento' });
  assert.equal(f.statusCode, 200);
  assert.match(f.body, /<title>Marco Legal do Licenciamento Ambiental · EJUP<\/title>/);
  assert.match(f.body, /og:image" content="https:\/\/ejup\.com\.br\/img\/curso1\.jpg"/);
  assert.match(f.body, /rel="canonical" href="https:\/\/ejup\.com\.br\/formacao\/licenciamento"/);
  const ld = JSON.parse(f.body.match(/application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(ld['@type'], 'Course');
  assert.equal(ld.offers[0].price, '649.90');
  assert.equal(ld.offers[0].priceCurrency, 'BRL');
  assert.equal(f.headers['vercel-cdn-cache-control'], 'max-age=300, stale-while-revalidate=86400');
  const a = await call(h, { p: '/artigo/sistema-multiportas-setor-eletrico' });
  assert.match(a.body, /og:type" content="article"/);
  const home = await call(h, { p: '/' });
  assert.match(home.body, /EducationalOrganization/);
  assert.match((await call(h, { p: '/escola' })).body, /<title>A escola · EJUP<\/title>/);
});

test('portal sem indexação; endereço desconhecido dá 404', async () => {
  const h = createPaginaHandler({ env: {}, html: HTML });
  assert.match((await call(h, { p: '/portal/plano' })).body, /noindex/);
  assert.match((await call(h, { p: '/formacao/nao-existe' })).body, /noindex/);
  assert.equal((await call(h, { p: '/qualquer-coisa' })).statusCode, 404);
});

test('usa o conteúdo publicado na Área da Equipe e escapa o texto', async () => {
  const fake = createFakeSupabase();
  fake.insert('site_itens', { tipo: 'formacao', id: 'nova', ordem: 1, publicado: true, dados: { t: 'Nova "formação" <b>', d: 'Descrição', img: 'https://cdn.x.com/capa.jpg', preco: 'R$ 1.200,00' } });
  const h = createPaginaHandler({ env: { SUPABASE_URL: fake.url, SUPABASE_SERVICE_ROLE_KEY: 'k' }, fetchImpl: fake.fetchImpl, html: HTML });
  const r = await call(h, { p: '/formacao/nova' });
  assert.match(r.body, /<title>Nova &quot;formação&quot; &lt;b&gt; · EJUP<\/title>/);
  assert.match(r.body, /og:image" content="https:\/\/cdn\.x\.com\/capa\.jpg"/);
  assert.match(r.body, /"price":"1200.00"/);
  assert.match((await call(h, { p: '/formacao/licenciamento' })).body, /noindex/, 'tipo publicado substitui o padrão');
});

test('sitemap e robots', async () => {
  const h = createPaginaHandler({ env: { SITE_URL: 'https://ejup.com.br' }, html: HTML });
  const s = await call(h, { sitemap: '1' });
  assert.match(s.headers['content-type'], /xml/);
  assert.match(s.body, /<loc>https:\/\/ejup\.com\.br\/formacao\/licenciamento<\/loc>/);
  assert.doesNotMatch(s.body, /portal/);
  const r = await call(h, { robots: '1' });
  assert.match(r.body, /Disallow: \/prof\$/);
  assert.doesNotMatch(r.body, /Disallow: \/professores/);
  assert.match(r.body, /Sitemap: https:\/\/ejup\.com\.br\/sitemap\.xml/);
  assert.equal(metaPara('/', conteudo([]), 'https://x').status, 200);
  const cert = metaPara('/certificado', conteudo([]), 'https://x');
  assert.equal(cert.noindex, false);
  assert.match(cert.title, /Conferir certificado/);
  assert.equal(metaPara('/certificado/EJUP-AAAA-BBBB', conteudo([]), 'https://x').noindex, true);
});

test('endereços do site anterior redirecionam para os novos', async () => {
  const h = createPaginaHandler({ env: {}, html: HTML });
  const ir = async (p) => { const r = await call(h, { p }); return [r.statusCode, r.headers.location]; };
  assert.deepEqual(await ir('/coluna/sistema-multiportas-setor-eletrico'), [301, 'https://ejup.com.br/artigo/sistema-multiportas-setor-eletrico']);
  assert.deepEqual(await ir('/coluna/artigos'), [301, 'https://ejup.com.br/coluna']);
  assert.deepEqual(await ir('/podcast'), [301, 'https://ejup.com.br/ejupcast']);
  assert.deepEqual(await ir('/podcast/episodios'), [301, 'https://ejup.com.br/ejupcast']);
  assert.deepEqual(await ir('/podcast/bastidores-defesa-criminal'), [301, 'https://ejup.com.br/ejupcast/bastidores-defesa-criminal']);
  assert.deepEqual(await ir('/compartilhar/ejupcast/bastidores-defesa-criminal'), [301, 'https://ejup.com.br/ejupcast/bastidores-defesa-criminal']);
  assert.deepEqual(await ir('/formacoes/marco-legal-licenciamento-ambiental'), [301, 'https://ejup.com.br/formacao/licenciamento']);
  assert.deepEqual(await ir('/formacoes/corporativo-marco-legal-licenciamento-ambiental-v2'), [301, 'https://ejup.com.br/formacao/equipes']);
  assert.deepEqual(await ir('/politica-de-privacidade'), [301, 'https://ejup.com.br/privacidade']);
  assert.deepEqual(await ir('/artigo/multiportas'), [301, 'https://ejup.com.br/artigo/sistema-multiportas-setor-eletrico']);
  // a âncora da newsletter na Coluna continua sendo página do site novo
  assert.equal((await call(h, { p: '/coluna/newsletter' })).statusCode, 200);
});

test('cada episódio do EJUPcast tem página própria; /linkbio existe; sitemap traz episódios', async () => {
  const h = createPaginaHandler({ env: {}, html: HTML });
  const e = await call(h, { p: '/ejupcast/bastidores-defesa-criminal' });
  assert.equal(e.statusCode, 200);
  assert.match(e.body, /<title>Os Bastidores da Defesa Criminal · EJUPcast<\/title>/);
  const ld = JSON.parse(e.body.match(/application\/ld\+json">(.*?)<\/script>/)[1]);
  assert.equal(ld['@type'], 'PodcastEpisode');
  assert.match(ld.associatedMedia.embedUrl, /youtube-nocookie\.com\/embed\//);
  assert.match((await call(h, { p: '/ejupcast/nao-existe' })).body, /noindex/);
  assert.match((await call(h, { p: '/linkbio' })).body, /<title>Links da EJUP · EJUP<\/title>/);
  const sm = (await call(h, { sitemap: '1' })).body;
  assert.match(sm, /\/ejupcast\/o-juiz-que-levou-a-inovacao-para-dentro-da-justica-federal</);
  assert.match(sm, /\/artigo\/justica-militar-no-brasil-competencia-limites</);
  assert.match(sm, /\/linkbio</);
});
