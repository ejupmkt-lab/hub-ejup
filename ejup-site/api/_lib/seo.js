import PADRAO from '../../assets/padrao.js';

// Títulos, descrições, imagens de prévia (WhatsApp, LinkedIn) e dados estruturados (Google) por página.
// O site é montado no navegador; quem compartilha ou indexa lê só o HTML que sai daqui.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const corta = (s, n = 180) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };

// mesma regra do site: um tipo publicado na Área da Equipe substitui o padrão inteiro daquele tipo
export function conteudo(rows = []) {
  const de = (tipo) => rows.filter((r) => r.tipo === tipo).map((r) => ({ ...r.dados, id: r.id }));
  const pick = (tipo, padrao) => { const x = de(tipo); return x.length ? x : padrao; };
  return {
    F: pick('formacao', PADRAO.F), AR: pick('artigo', PADRAO.AR), PROF: pick('professor', PADRAO.PROF),
    E: pick('episodio', PADRAO.E), LINKS: { ...PADRAO.LINKS, ...(de('config')[0] || {}) },
  };
}

export const imagem = (u, origin) => {
  if (!u) return `${origin}/img/ep18.jpg`;
  if (/^https:\/\//.test(u)) return u;
  return u.startsWith('/') ? origin + u : `${origin}/img/${u}.jpg`;
};

const PRIVADAS = new Set(['portal', 'prof', 'equipe', 'entrar', 'criar', 'recuperar', 'certificado', 'descadastro']);
const ESTATICAS = new Set(['escola', 'formacoes', 'professores', 'ejupcast', 'coluna', 'incompany', 'privacidade', 'termos', 'linkbio']);
const preco = (s) => { const m = String(s || '').replace(/\./g, '').match(/(\d+)(?:,(\d{2}))?/); return m ? Number(`${m[1]}.${m[2] || '00'}`) : null; };

function organizacao(origin, C) {
  return {
    '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: 'EJUP — Educação Jurídica', url: origin + '/',
    logo: `${origin}/favicon.svg`, email: 'contato@ejup.com.br', telephone: '+55-85-99271-4050',
    address: { '@type': 'PostalAddress', streetAddress: 'Rua da Saudade, 1028 — Lagoa Nova', addressLocality: 'Natal', addressRegion: 'RN', addressCountry: 'BR' },
    sameAs: [C.LINKS.instagram, C.LINKS.youtube, C.LINKS.spotify].filter((u) => /^https:\/\//.test(u || '')),
  };
}

export function metaPara(path, C, origin) {
  const segs = String(path || '/').replace(/^[/#]+|\/+$/g, '').split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
  const [p = 'home', id = ''] = segs;
  const url = origin + (p === 'home' ? '/' : '/' + segs.join('/'));
  const base = { url, image: imagem('ep18', origin), type: 'website', status: 200, noindex: false, jsonld: [] };
  const seo = (k) => PADRAO.SEO[k];
  if (p === 'home') return { ...base, title: seo('home')[0], desc: seo('home')[1], jsonld: [organizacao(origin, C)] };
  if (p === 'ejupcast' && id) {
    const e = C.E.find((x) => x.id === id);
    if (!e) return { ...base, title: 'EJUPcast · EJUP', desc: seo('ejupcast')[1], noindex: true };
    const ep = {
      '@context': 'https://schema.org', '@type': 'PodcastEpisode', name: e.t, description: corta(e.txt || e.d, 300), url,
      image: imagem(e.img, origin), inLanguage: 'pt-BR', ...(e.n ? { episodeNumber: e.n } : {}), ...(e.pub ? { datePublished: e.pub } : {}),
      partOfSeries: { '@type': 'PodcastSeries', name: 'EJUPcast', url: origin + '/ejupcast' },
      ...(e.yt ? { associatedMedia: { '@type': 'VideoObject', name: e.t, embedUrl: `https://www.youtube-nocookie.com/embed/${e.yt}`, thumbnailUrl: imagem(e.img, origin), ...(e.pub ? { uploadDate: e.pub } : {}) } } : {}),
    };
    return { ...base, title: `${e.t} · EJUPcast`, desc: corta(e.d || e.txt), image: imagem(e.img, origin), jsonld: [ep] };
  }
  if (ESTATICAS.has(p)) return { ...base, title: `${seo(p)[0]} · EJUP`, desc: seo(p)[1] };
  if (p === 'certificado' && !id) return { ...base, title: 'Conferir certificado · EJUP', desc: 'Confira a autenticidade de um certificado da EJUP pelo código que aparece no rodapé.' };
  if (PRIVADAS.has(p)) return { ...base, title: p === 'certificado' ? 'Certificado · EJUP' : { portal: 'Portal do Aluno · EJUP', prof: 'Área do Professor · EJUP', equipe: 'Área da Equipe · EJUP', descadastro: 'Newsletter · EJUP', criar: 'Criar conta · EJUP', recuperar: 'Recuperar senha · EJUP' }[p] || 'Entrar · EJUP', desc: 'Acesso às formações, aulas e materiais da EJUP.', noindex: true };
  if (p === 'formacao') {
    const f = C.F.find((x) => x.id === id);
    // item recém-criado pode ainda não estar no cache: a página abre, só não é indexada
    if (!f) return { ...base, title: 'Formações · EJUP', desc: seo('formacoes')[1], noindex: true };
    const valor = preco(f.preco), facts = (f.fd && f.fd.length ? f.fd : f.f) || [];
    const curso = {
      '@context': 'https://schema.org', '@type': 'Course', name: f.t, description: corta(f.d, 300), url,
      image: imagem(f.img, origin), provider: { '@type': 'Organization', name: 'EJUP — Educação Jurídica', sameAs: origin + '/' },
      inLanguage: 'pt-BR',
      hasCourseInstance: [{ '@type': 'CourseInstance', courseMode: facts.some((x) => /presencial/i.test(x)) ? 'Onsite' : 'Online', ...(facts.find((x) => /hora/i.test(x)) ? { courseWorkload: `PT${parseInt(facts.find((x) => /hora/i.test(x)), 10) || 0}H` } : {}) }],
      ...(valor ? { offers: [{ '@type': 'Offer', category: 'Paid', price: valor.toFixed(2), priceCurrency: 'BRL', url }] } : {}),
    };
    return { ...base, title: `${f.t} · EJUP`, desc: corta(f.d), image: imagem(f.img, origin), jsonld: [curso] };
  }
  if (p === 'artigo') {
    const a = C.AR.find((x) => x.id === id);
    if (!a) return { ...base, title: 'Coluna Jurídica · EJUP', desc: seo('coluna')[1], noindex: true };
    const art = {
      '@context': 'https://schema.org', '@type': 'Article', headline: corta(a.t, 110), description: corta(a.d || a.t, 300), url,
      image: imagem(a.img, origin), inLanguage: 'pt-BR', ...(a.pub ? { datePublished: a.pub } : {}), author: { '@type': a.by && a.by !== 'Equipe EJUP' ? 'Person' : 'Organization', name: a.by || 'Equipe EJUP' },
      publisher: { '@type': 'Organization', name: 'EJUP — Educação Jurídica', logo: { '@type': 'ImageObject', url: `${origin}/favicon.svg` } },
    };
    return { ...base, title: `${a.t} · EJUP`, desc: corta(a.d || a.t), image: imagem(a.img, origin), type: 'article', jsonld: [art] };
  }
  return { ...base, title: 'Página não encontrada · EJUP', desc: seo('home')[1], status: 404, noindex: true };
}

export function cabecalho(m) {
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.desc)}">`,
    m.noindex ? '<meta name="robots" content="noindex, nofollow">' : `<link rel="canonical" href="${esc(m.url)}">`,
    `<meta property="og:site_name" content="EJUP · Educação Jurídica">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta property="og:type" content="${m.type}">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.desc)}">`,
    `<meta property="og:url" content="${esc(m.url)}">`,
    `<meta property="og:image" content="${esc(m.image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    ...m.jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].join('\n');
}

// o modelo (app.html) traz o bloco entre <!--seo--> e <!--/seo-->; ele é trocado pelo da página
export const render = (html, m) => html.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, `<!--seo-->\n${cabecalho(m)}\n<!--/seo-->`);

export function sitemap(C, origin) {
  const urls = ['/', ...[...ESTATICAS].filter((p) => !['privacidade', 'termos', 'linkbio'].includes(p)).map((p) => '/' + p),
    ...C.F.map((f) => `/formacao/${f.id}`), ...C.AR.map((a) => `/artigo/${a.id}`), ...C.E.filter((e) => e.id).map((e) => `/ejupcast/${e.id}`),
    '/minerva', '/linkbio', '/certificado', '/privacidade', '/termos'];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(origin + u)}</loc></url>`).join('\n')}\n</urlset>\n`;
}

export const robots = (origin) => `User-agent: *\nAllow: /\nDisallow: /portal\nDisallow: /prof$\nDisallow: /prof/\nDisallow: /equipe\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;

// endereços do site anterior (ejup.com.br até 2026): continuam funcionando, com redirecionamento permanente
const FORMACAO_ANTIGA = {
  'marco-legal-licenciamento-ambiental': 'licenciamento', 'pareceres-tecnicos-ambientais': 'pareceres',
  'corporativo-marco-legal-licenciamento-ambiental': 'equipes', 'corporativo-marco-legal-licenciamento-ambiental-v2': 'equipes',
};
const ARTIGO_CURTO = {
  multiportas: 'sistema-multiportas-setor-eletrico', stf: 'eventual-responsabilizacao-ministros-stf',
  policia: 'poder-policia-ambiental-municipal-licenciamento-simplificado', investigacao: 'legitimidade-investigacao-defensiva-processo-penal',
};
export function antigo(path) {
  const segs = String(path || '/').replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  const [a = '', b = '', c = ''] = segs;
  if (a === 'politica-de-privacidade') return '/privacidade';
  if (a === 'auth') return '/entrar';
  if (a === 'podcast') return b && b !== 'episodios' ? `/ejupcast/${b}` : '/ejupcast';
  if (a === 'compartilhar' && b === 'ejupcast' && c) return `/ejupcast/${c}`;
  if (a === 'coluna' && b === 'artigos') return '/coluna';
  if (a === 'coluna' && b && b !== 'newsletter') return `/artigo/${b}`;
  if (a === 'formacoes' && b) return FORMACAO_ANTIGA[b] ? `/formacao/${FORMACAO_ANTIGA[b]}` : '/formacoes';
  if (a === 'artigo' && ARTIGO_CURTO[b]) return `/artigo/${ARTIGO_CURTO[b]}`;
  return null;
}
