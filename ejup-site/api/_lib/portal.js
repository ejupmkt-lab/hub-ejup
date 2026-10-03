import crypto from 'node:crypto';
import { createSb, inList, SbError } from './sb.js';
import { createMailer } from './email.js';
import { buscar } from './busca.js';
import RESPOSTAS_LOCAIS from './respostas.js';
import { clientIp, rateLimit } from './ratelimit.js';
import { parseVideo } from './video.js';

// Portal do Aluno e Área do Professor. Uma só função na Vercel (api/portal.js), rota em ?r=.
// A sessão fica em cookie HttpOnly; o navegador nunca vê a chave do Supabase nem o token.

export const PLANOS = ['essencial', 'acompanhado', 'mentoria'];
const nivel = (p) => Math.max(0, PLANOS.indexOf(p));
const okMail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const enc = encodeURIComponent;
// só http(s): link de sala, gravação e material nunca viram javascript: na tela do aluno
const link = (v) => { const x = str(v, 500); return /^https?:\/\/[^\s"'<>]+$/i.test(x) ? x : null; };
const DAY = 86400000;

export class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}
const fail = (status, message, extra) => { throw new HttpError(status, message, extra); };

/* ---------- cookies e sessão ---------- */
export function parseCookies(h = '') {
  const out = {};
  String(h).split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) { try { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } catch { /* ignora */ } }
  });
  return out;
}
const AT = 'ejup_at', RT = 'ejup_rt', ON = 'ejup_on';
function cookie(name, value, { maxAge, secure, path = '/api/portal', http = true }) {
  return `${name}=${enc(value)}; Path=${path}; Max-Age=${maxAge}; SameSite=Lax${http ? '; HttpOnly' : ''}${secure ? '; Secure' : ''}`;
}
function setSession(ctx, t) {
  const secure = ctx.secure;
  ctx.cookies.push(
    cookie(AT, t.access_token, { maxAge: Math.max(60, Number(t.expires_in) || 3600), secure }),
    cookie(RT, t.refresh_token, { maxAge: 60 * DAY / 1000, secure }),
    // aviso visível ao site (sem token): o botão "Entrar" vira "Meu portal"
    cookie(ON, '1', { maxAge: 60 * DAY / 1000, secure, path: '/', http: false }),
  );
}
function clearSession(ctx) {
  const secure = ctx.secure;
  ctx.cookies.push(cookie(AT, '', { maxAge: 0, secure }), cookie(RT, '', { maxAge: 0, secure }), cookie(ON, '', { maxAge: 0, secure, path: '/', http: false }));
}

const tokenCache = new Map();
async function userOf(ctx, token) {
  const hit = tokenCache.get(token);
  if (hit && hit.until > ctx.now()) return hit.user;
  try {
    const user = await ctx.sb.auth.user(token);
    if (!user?.id) return null;
    if (tokenCache.size > 500) tokenCache.clear();
    tokenCache.set(token, { user, until: ctx.now() + 60_000 });
    return user;
  } catch { return null; }
}
export const _resetCache = () => tokenCache.clear();

async function session(ctx) {
  const c = parseCookies(ctx.req.headers.cookie);
  if (c[AT]) {
    const user = await userOf(ctx, c[AT]);
    if (user) return { user, token: c[AT] };
  }
  if (c[RT]) {
    try {
      const t = await ctx.sb.auth.refresh(c[RT]);
      setSession(ctx, t);
      return { user: t.user, token: t.access_token };
    } catch { clearSession(ctx); }
  }
  return null;
}

async function requireUser(ctx) {
  // sessão já resolvida nesta requisição: não renova o token duas vezes
  const s = ctx.user ? { user: ctx.user, token: ctx.token } : await session(ctx);
  if (!s) fail(401, 'Entre na sua conta para continuar.');
  ctx.user = s.user; ctx.token = s.token;
  let [p] = await ctx.sb.rest.get('perfis', `id=eq.${s.user.id}&select=*`);
  if (!p) {
    [p] = await ctx.sb.rest.insert('perfis', { id: s.user.id, email: String(s.user.email).toLowerCase(), nome: s.user.user_metadata?.nome || '' }, { upsert: true, onConflict: 'id' });
  }
  ctx.perfil = p;
  return p;
}

/* ---------- acesso ---------- */
async function cursosDoProfessor(ctx) {
  if (ctx._profCursos) return ctx._profCursos;
  const p = ctx.perfil;
  const q = p.papel === 'equipe' ? 'select=*&order=ordem.asc' : `professor_emails=cs.${enc(`{"${p.email}"}`)}&select=*&order=ordem.asc`;
  ctx._profCursos = await ctx.sb.rest.get('cursos', q);
  return ctx._profCursos;
}
async function ehProfessorDe(ctx, cursoId) {
  return (await cursosDoProfessor(ctx)).some((c) => c.id === cursoId);
}
async function matriculaDe(ctx, cursoId) {
  const [m] = await ctx.sb.rest.get('matriculas', `email=eq.${enc(ctx.perfil.email)}&curso_id=eq.${enc(cursoId)}&ativa=is.true&select=*`);
  return m || null;
}
// o professor vê o portal da própria formação como aluno do plano mais completo
async function acessoCurso(ctx, cursoId) {
  if (!cursoId) fail(400, 'Formação não informada.');
  const m = await matriculaDe(ctx, cursoId);
  if (m) return { ...m, prof: await ehProfessorDe(ctx, cursoId) };
  if (await ehProfessorDe(ctx, cursoId)) return { curso_id: cursoId, plano: 'mentoria', prof: true, email: ctx.perfil.email };
  fail(403, 'Você não tem acesso a esta formação.');
}
async function aulaComCurso(ctx, aulaId) {
  const [a] = await ctx.sb.rest.get('aulas', `id=eq.${enc(aulaId)}&select=*`);
  if (!a) fail(404, 'Aula não encontrada.');
  const [m] = await ctx.sb.rest.get('modulos', `id=eq.${enc(a.modulo_id)}&select=curso_id`);
  return { aula: a, cursoId: m?.curso_id };
}

const publicPerfil = (p) => ({
  id: p.id, email: p.email, nome: p.nome, papel: p.papel, tel: p.tel || '', area: p.area || '', oab: p.oab || '',
  nome_certificado: p.nome_certificado || '', areas: p.areas || '', bio: p.bio || '', prefs: p.prefs || {},
});
const semEmails = ({ professor_emails, ...c }) => c;
const aulaPublica = (a) => ({
  id: a.id, modulo_id: a.modulo_id, ordem: a.ordem, titulo: a.titulo, duracao_min: a.duracao_min,
  sobre: a.sobre || '', topicos: a.topicos || [], video: Boolean(a.video), materiais: (a.materiais || []).length,
});

async function estrutura(ctx, cursoIds) {
  if (!cursoIds.length) return { cursos: [], modulos: [], aulas: [] };
  const [cursos, modulos] = await Promise.all([
    ctx.sb.rest.get('cursos', `id=${inList(cursoIds)}&select=*&order=ordem.asc`),
    ctx.sb.rest.get('modulos', `curso_id=${inList(cursoIds)}&select=*&order=ordem.asc`),
  ]);
  const aulas = modulos.length
    ? await ctx.sb.rest.get('aulas', `modulo_id=${inList(modulos.map((m) => m.id))}&publicada=is.true&select=*&order=ordem.asc`)
    : [];
  return { cursos, modulos, aulas };
}
const aulasDoCurso = (est, cursoId) => {
  const mods = new Set(est.modulos.filter((m) => m.curso_id === cursoId).map((m) => m.id));
  return est.aulas.filter((a) => mods.has(a.modulo_id));
};

async function comMensagens(ctx, duvidas) {
  if (!duvidas.length) return [];
  const msgs = await ctx.sb.rest.get('mensagens', `duvida_id=${inList(duvidas.map((d) => d.id))}&select=*&order=criado_em.asc`);
  return duvidas.map((d) => ({ ...d, mensagens: msgs.filter((m) => m.duvida_id === d.id).map(({ autor_id, ...m }) => m) }));
}

async function emailsProfessores(ctx, cursoId, pref) {
  const [c] = await ctx.sb.rest.get('cursos', `id=eq.${enc(cursoId)}&select=titulo,professor_emails`);
  const emails = c?.professor_emails || [];
  if (!emails.length) return { titulo: c?.titulo || '', emails: [] };
  const perfis = await ctx.sb.rest.get('perfis', `email=${inList(emails.map((e) => e.toLowerCase()))}&select=email,prefs`);
  const off = new Set(perfis.filter((p) => p.prefs?.[pref] === false).map((p) => p.email));
  return { titulo: c.titulo, emails: emails.filter((e) => !off.has(e.toLowerCase())) };
}

function codigoCertificado() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = crypto.randomBytes(8);
  const s = [...b].map((x) => abc[x % abc.length]).join('');
  return `EJUP-${s.slice(0, 4)}-${s.slice(4)}`;
}

/* ---------- rotas ---------- */
const R = {};

R.config = {
  method: 'GET',
  run: (ctx) => ({
    // login com Google: ligar o provedor no Supabase (Authentication → Providers) e PORTAL_GOOGLE=1 na Vercel
    google: ctx.env.PORTAL_GOOGLE === '1' ? `${ctx.sb.base}/auth/v1/authorize?provider=google&redirect_to=${enc(ctx.origin + '/entrar')}` : null,
    email: ctx.mail.enabled,
  }),
};

R.estado = {
  method: 'GET',
  run: async (ctx) => {
    const s = await session(ctx);
    if (!s) return { logado: false };
    ctx.user = s.user; ctx.token = s.token;
    const p = await requireUser(ctx);
    return { logado: true, nome: p.nome, professor: p.papel !== 'aluno' || (await cursosDoProfessor(ctx)).length > 0 };
  },
};

R.entrar = {
  method: 'POST', limit: 10,
  run: async (ctx, b) => {
    const email = str(b.email, 254).toLowerCase(), senha = typeof b.senha === 'string' ? b.senha : '';
    if (!okMail(email) || !senha) fail(400, 'Digite e-mail e senha.');
    let t;
    try { t = await ctx.sb.auth.login(email, senha); } catch (err) {
      const msg = JSON.stringify(err?.body || '');
      if (/not.confirmed/i.test(msg)) fail(403, 'Confirme o seu e-mail pelo link que enviamos antes de entrar.');
      fail(401, 'E-mail ou senha incorretos. Confira os dados e tente de novo.');
    }
    setSession(ctx, t);
    ctx.user = t.user; ctx.token = t.access_token;
    const p = await requireUser(ctx);
    return { ok: true, equipe: p.papel === 'equipe', professor: p.papel !== 'aluno' || (await cursosDoProfessor(ctx)).length > 0 };
  },
};

R.criar = {
  method: 'POST', limit: 5,
  run: async (ctx, b) => {
    const nome = str(b.nome, 120), email = str(b.email, 254).toLowerCase(), senha = typeof b.senha === 'string' ? b.senha : '';
    if (nome.length < 2) fail(400, 'Digite seu nome completo.');
    if (!okMail(email)) fail(400, 'Digite um e-mail válido, como voce@exemplo.com.');
    if (senha.length < 8) fail(400, 'A senha precisa ter pelo menos 8 caracteres.');
    let r;
    try { r = await ctx.sb.auth.signup(email, senha, { nome }, `${ctx.origin}/entrar`); } catch (err) {
      const msg = JSON.stringify(err?.body || '');
      if (/already|registered|exists/i.test(msg)) fail(409, 'Já existe uma conta com este e-mail. Entre ou recupere a senha.');
      if (/password/i.test(msg)) fail(400, 'Escolha uma senha mais forte, com letras e números.');
      throw err;
    }
    if (r?.access_token) {
      setSession(ctx, r);
      return { ok: true, sessao: true };
    }
    return { ok: true, confirmar: true };
  },
};

// tokens que chegam no endereço depois do link do e-mail (confirmação, nova senha) ou do Google
R.sessao = {
  method: 'POST', limit: 10,
  run: async (ctx, b) => {
    const at = str(b.access_token, 4000), rt = str(b.refresh_token, 400);
    if (!at || !rt) fail(400, 'Link inválido ou expirado.');
    const user = await userOf(ctx, at);
    if (!user) fail(401, 'Link inválido ou expirado. Peça um novo.');
    setSession(ctx, { access_token: at, refresh_token: rt, expires_in: Number(b.expires_in) || 3600 });
    return { ok: true };
  },
};

R.recuperar = {
  method: 'POST', limit: 3,
  run: async (ctx, b) => {
    const email = str(b.email, 254).toLowerCase();
    if (!okMail(email)) fail(400, 'Digite um e-mail válido, como voce@exemplo.com.');
    // a resposta é sempre a mesma: não revela se o e-mail tem conta
    try { await ctx.sb.auth.recover(email, `${ctx.origin}/recuperar`); } catch (err) { console.error('recuperar:', err?.status, JSON.stringify(err?.body || '')); }
    return { ok: true };
  },
};

R['nova-senha'] = {
  method: 'POST', limit: 5,
  run: async (ctx, b) => {
    await requireUser(ctx);
    const senha = typeof b.senha === 'string' ? b.senha : '';
    if (senha.length < 8) fail(400, 'A senha precisa ter pelo menos 8 caracteres.');
    try { await ctx.sb.auth.update(ctx.token, { password: senha }); } catch (err) {
      const msg = JSON.stringify(err?.body || '');
      if (/different|same/i.test(msg)) fail(400, 'Escolha uma senha diferente da atual.');
      if (/reauth|nonce/i.test(msg)) fail(403, 'Por segurança, peça um link de recuperação e crie a nova senha por ele.');
      fail(400, 'Não foi possível alterar a senha. Tente uma senha mais forte.');
    }
    return { ok: true };
  },
};

R.sair = {
  method: 'POST',
  run: async (ctx, b) => {
    const s = await session(ctx);
    if (s) { try { await ctx.sb.auth.logout(s.token, b.todos ? 'global' : 'local'); } catch { /* sessão já encerrada */ } }
    clearSession(ctx);
    return { ok: true };
  },
};

// página pública de conferência do certificado
R.certificado = {
  method: 'GET', limit: 30, publico: true,
  run: async (ctx) => {
    const codigo = str(ctx.query.codigo, 20).toUpperCase();
    if (!/^EJUP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(codigo)) fail(404, 'Certificado não encontrado.');
    const [m] = await ctx.sb.rest.get('matriculas', `certificado=eq.${enc(codigo)}&select=email,curso_id,concluida_em`);
    if (!m) fail(404, 'Certificado não encontrado.');
    const [[p], [c]] = await Promise.all([
      ctx.sb.rest.get('perfis', `email=eq.${enc(m.email)}&select=nome,nome_certificado`),
      ctx.sb.rest.get('cursos', `id=eq.${enc(m.curso_id)}&select=titulo,horas,professores`),
    ]);
    return { codigo, nome: p?.nome_certificado || p?.nome || '', curso: c?.titulo || '', horas: c?.horas || 0, professores: c?.professores || '', concluida_em: m.concluida_em };
  },
};

/* ----- aluno ----- */
R.me = {
  method: 'GET', auth: true,
  run: async (ctx) => {
    const p = ctx.perfil;
    const [mats, profCursos] = await Promise.all([
      ctx.sb.rest.get('matriculas', `email=eq.${enc(p.email)}&ativa=is.true&select=*&order=criado_em.asc`),
      cursosDoProfessor(ctx),
    ]);
    const matriculas = mats.map(({ email, ...m }) => m);
    profCursos.forEach((c) => {
      if (!matriculas.some((m) => m.curso_id === c.id)) matriculas.push({ curso_id: c.id, plano: 'mentoria', prof: true });
    });
    const ids = matriculas.map((m) => m.curso_id);
    const est = await estrutura(ctx, ids);
    const aulaIds = est.aulas.map((a) => a.id);
    const uid = ctx.user.id;
    const desde = new Date(ctx.now() - 120 * DAY).toISOString();
    const [progresso, notas, duvidas, plantoes, mentorias, historico] = await Promise.all([
      aulaIds.length ? ctx.sb.rest.get('progresso', `user_id=eq.${uid}&select=aula_id,concluida,segundo,atualizado_em`) : [],
      ctx.sb.rest.get('notas', `user_id=eq.${uid}&select=aula_id,texto,segundo,atualizado_em`),
      ctx.sb.rest.get('duvidas', `user_id=eq.${uid}&select=*&order=atualizado_em.desc&limit=100`),
      ids.length ? ctx.sb.rest.get('plantoes', `curso_id=${inList(ids)}&inicio=gte.${enc(desde)}&select=*&order=inicio.asc`) : [],
      ctx.sb.rest.get('mentorias', `aluno_id=eq.${uid}&select=*&order=inicio.asc`),
      ctx.sb.rest.get('minerva_log', `user_id=eq.${uid}&select=id,curso_id,pergunta,resposta_id,ajudou,criado_em&order=criado_em.desc&limit=30`),
    ]);
    // horários livres dos professores para quem tem mentoria
    const disponibilidade = {};
    const comMentoria = est.cursos.filter((c) => matriculas.some((m) => m.curso_id === c.id && m.plano === 'mentoria'));
    const emailsProf = [...new Set(comMentoria.flatMap((c) => c.professor_emails || []).map((e) => e.toLowerCase()))];
    if (emailsProf.length) {
      const profs = await ctx.sb.rest.get('perfis', `email=${inList(emailsProf)}&select=email,nome,prefs`);
      comMentoria.forEach((c) => {
        disponibilidade[c.id] = profs.filter((x) => (c.professor_emails || []).map((e) => e.toLowerCase()).includes(x.email))
          .flatMap((x) => (Array.isArray(x.prefs?.disp) ? x.prefs.disp : []).filter((d) => d.on !== false).map((d) => ({ ...d, professor: x.nome })));
      });
    }
    return {
      perfil: publicPerfil(p),
      professor: p.papel !== 'aluno' || profCursos.length > 0,
      matriculas,
      cursos: est.cursos.map(semEmails), modulos: est.modulos, aulas: est.aulas.map(aulaPublica),
      progresso: progresso.filter((x) => aulaIds.includes(x.aula_id)),
      notas, duvidas: await comMensagens(ctx, duvidas), plantoes, mentorias, historico, disponibilidade,
      email: ctx.mail.enabled,
    };
  },
};

R.aula = {
  method: 'GET', auth: true,
  run: async (ctx) => {
    const { aula, cursoId } = await aulaComCurso(ctx, str(ctx.query.id, 80));
    await acessoCurso(ctx, cursoId);
    let video = parseVideo(aula.video);
    if (video?.tipo === 'storage') {
      const url = await ctx.sb.signed('aulas', video.path).catch(() => null);
      video = url ? { tipo: 'arquivo', url } : null;
    }
    const materiais = await Promise.all((aula.materiais || []).map(async (m) => {
      const url = String(m.url || '');
      const final = /^https?:\/\//i.test(url) ? link(url) : url ? await ctx.sb.signed('materiais', url).catch(() => null) : null;
      return { nome: m.nome || 'Material', tipo: m.tipo || '', url: final };
    }));
    return { id: aula.id, video, materiais: materiais.filter((m) => m.url) };
  },
};

R.progresso = {
  method: 'POST', auth: true, limit: 120,
  run: async (ctx, b) => {
    const { aula, cursoId } = await aulaComCurso(ctx, str(b.aula, 80));
    const acc = await acessoCurso(ctx, cursoId);
    const row = { user_id: ctx.user.id, aula_id: aula.id, atualizado_em: new Date(ctx.now()).toISOString() };
    if (typeof b.concluida === 'boolean') row.concluida = b.concluida;
    if (Number.isFinite(b.segundo)) row.segundo = Math.max(0, Math.min(86400, Math.round(b.segundo)));
    await ctx.sb.rest.insert('progresso', row, { upsert: true, onConflict: 'user_id,aula_id', returning: false });
    if (!b.concluida || acc.prof || !acc.id) return { ok: true };
    // última aula concluída: libera o certificado
    const est = await estrutura(ctx, [cursoId]);
    const ids = aulasDoCurso(est, cursoId).map((a) => a.id);
    const feitas = await ctx.sb.rest.get('progresso', `user_id=eq.${ctx.user.id}&concluida=is.true&aula_id=${inList(ids)}&select=aula_id`);
    if (!ids.length || feitas.length < ids.length) return { ok: true };
    if (acc.certificado) return { ok: true, certificado: acc.certificado };
    const codigo = codigoCertificado();
    await ctx.sb.rest.update('matriculas', `id=eq.${acc.id}&certificado=is.null`, { certificado: codigo, concluida_em: new Date(ctx.now()).toISOString() });
    const [m] = await ctx.sb.rest.get('matriculas', `id=eq.${acc.id}&select=certificado,concluida_em`);
    return { ok: true, certificado: m?.certificado || codigo, concluida_em: m?.concluida_em };
  },
};

R.nota = {
  method: 'POST', auth: true, limit: 60,
  run: async (ctx, b) => {
    const { aula, cursoId } = await aulaComCurso(ctx, str(b.aula, 80));
    await acessoCurso(ctx, cursoId);
    const row = { user_id: ctx.user.id, aula_id: aula.id, texto: str(b.texto, 8000), segundo: Math.max(0, Math.round(Number(b.segundo) || 0)), atualizado_em: new Date(ctx.now()).toISOString() };
    await ctx.sb.rest.insert('notas', row, { upsert: true, onConflict: 'user_id,aula_id', returning: false });
    return { ok: true, nota: row };
  },
};

const AREAS = ['Advocacia', 'Setor público', 'Departamento jurídico de empresa', 'Consultoria', 'Docência e pesquisa', 'Estudante', 'Outra'];
R.perfil = {
  method: 'POST', auth: true, limit: 20,
  run: async (ctx, b) => {
    const patch = {};
    if ('nome' in b) { const n = str(b.nome, 120); if (n.length < 2) fail(400, 'Digite o seu nome completo.'); patch.nome = n; }
    if ('tel' in b) patch.tel = str(b.tel, 40);
    if ('area' in b) patch.area = AREAS.includes(b.area) ? b.area : '';
    if ('oab' in b) patch.oab = str(b.oab, 30);
    if ('nome_certificado' in b) patch.nome_certificado = str(b.nome_certificado, 120);
    if ('areas' in b) patch.areas = str(b.areas, 200);
    if ('bio' in b) patch.bio = str(b.bio, 600);
    if (!Object.keys(patch).length) fail(400, 'Nada para salvar.');
    const [p] = await ctx.sb.rest.update('perfis', `id=eq.${ctx.user.id}`, patch);
    return { ok: true, perfil: publicPerfil(p) };
  },
};

const hora = (v) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null);
R.prefs = {
  method: 'POST', auth: true, limit: 60,
  run: async (ctx, b) => {
    const prefs = { ...(ctx.perfil.prefs || {}) };
    if ([2, 4, 6, 8].includes(b.pace)) prefs.pace = b.pace;
    if (Array.isArray(b.days)) { const d = [...new Set(b.days.filter((x) => Number.isInteger(x) && x >= 0 && x <= 6))].sort(); if (d.length) prefs.days = d; }
    ['mail', 'news', 'n1', 'n2', 'n3', 'n4'].forEach((k) => { if (typeof b[k] === 'boolean') prefs[k] = b[k]; });
    if (typeof b.curso === 'string') prefs.curso = str(b.curso, 60);
    if (b.lido === true) prefs.lido = new Date(ctx.now()).toISOString();
    if (Array.isArray(b.disp)) {
      prefs.disp = b.disp.slice(0, 14).map((d) => ({ dia: Number(d?.dia), ini: hora(d?.ini), fim: hora(d?.fim), on: d?.on !== false }))
        .filter((d) => Number.isInteger(d.dia) && d.dia >= 0 && d.dia <= 6 && d.ini && d.fim && d.ini < d.fim);
    }
    await ctx.sb.rest.update('perfis', `id=eq.${ctx.user.id}`, { prefs });
    if (b.news === true) {
      await ctx.sb.rest.insert('leads', { tipo: 'newsletter', email: ctx.perfil.email, origem: 'portal' }, { returning: false }).catch(() => {});
    }
    return { ok: true, prefs };
  },
};

R.duvida = {
  method: 'POST', auth: true, limit: 10,
  run: async (ctx, b) => {
    const cursoId = str(b.curso, 60);
    const acc = await acessoCurso(ctx, cursoId);
    if (nivel(acc.plano) < 1) fail(403, 'A dúvida ao professor faz parte dos planos Acompanhado e Mentoria.');
    const texto = str(b.texto, 4000);
    if (texto.length < 8) fail(400, 'Escreva a dúvida com um pouco mais de detalhe.');
    let aulaId = null;
    if (b.aula) { const x = await aulaComCurso(ctx, str(b.aula, 80)); if (x.cursoId === cursoId) aulaId = x.aula.id; }
    const titulo = texto.length > 60 ? texto.slice(0, 58).trimEnd() + '…' : texto;
    const [d] = await ctx.sb.rest.insert('duvidas', {
      user_id: ctx.user.id, curso_id: cursoId, aula_id: aulaId, segundo: aulaId && Number.isFinite(b.segundo) ? Math.round(b.segundo) : null,
      titulo, via_minerva: Boolean(b.via_minerva),
    });
    const [m] = await ctx.sb.rest.insert('mensagens', { duvida_id: d.id, autor_id: ctx.user.id, papel: 'aluno', texto });
    const { titulo: curso, emails } = await emailsProfessores(ctx, cursoId, 'n1');
    await ctx.mail.send({
      to: emails, subject: `Nova dúvida em ${curso}`, titulo: 'Uma dúvida espera a sua resposta.',
      linhas: [`${ctx.perfil.nome || 'Um aluno'} enviou uma dúvida em ${curso}:`, texto], botao: 'Responder na Área do Professor', link: `${ctx.origin}/prof/duvidas`,
    });
    const { autor_id, ...msg } = m;
    return { ok: true, duvida: { ...d, mensagens: [msg] } };
  },
};

R.mensagem = {
  method: 'POST', auth: true, limit: 20,
  run: async (ctx, b) => {
    const [d] = await ctx.sb.rest.get('duvidas', `id=eq.${Number(b.duvida) || 0}&select=*`);
    if (!d) fail(404, 'Dúvida não encontrada.');
    const texto = str(b.texto, 6000);
    if (texto.length < 2) fail(400, 'Escreva a mensagem antes de enviar.');
    const aluno = d.user_id === ctx.user.id;
    const prof = !aluno && (await ehProfessorDe(ctx, d.curso_id));
    if (!aluno && !prof) fail(403, 'Você não participa desta dúvida.');
    const papel = aluno ? 'aluno' : 'professor';
    const [m] = await ctx.sb.rest.insert('mensagens', { duvida_id: d.id, autor_id: ctx.user.id, papel, texto });
    const status = aluno ? 'professor' : 'respondida';
    await ctx.sb.rest.update('duvidas', `id=eq.${d.id}`, { status, atualizado_em: new Date(ctx.now()).toISOString() });
    if (aluno) {
      const { titulo: curso, emails } = await emailsProfessores(ctx, d.curso_id, 'n1');
      await ctx.mail.send({ to: emails, subject: `Nova mensagem na dúvida “${d.titulo}”`, titulo: 'O aluno continuou a conversa.', linhas: [texto], botao: 'Abrir a dúvida', link: `${ctx.origin}/prof/duvidas` });
      void curso;
    } else {
      const [a] = await ctx.sb.rest.get('perfis', `id=eq.${d.user_id}&select=email`);
      await ctx.mail.send({ to: a?.email, subject: `O professor respondeu: ${d.titulo}`, titulo: 'Sua dúvida foi respondida.', linhas: [texto], botao: 'Ver no Portal do Aluno', link: `${ctx.origin}/portal/suporte` });
      if (b.ensinar) {
        const [primeira] = await ctx.sb.rest.get('mensagens', `duvida_id=eq.${d.id}&papel=eq.aluno&select=texto&order=criado_em.asc&limit=1`);
        await ctx.sb.rest.insert('minerva_respostas', {
          id: `prof-${d.id}`, pergunta: (primeira?.texto || d.titulo).slice(0, 300), variacoes: [d.titulo], palavras: [], resposta: texto,
          ativo: true, ordem: 500, curso_id: d.curso_id, fonte_aula: d.aula_id, fonte_segundo: d.segundo, origem: 'professor', portal: true,
        }, { upsert: true, onConflict: 'id', returning: false });
      }
    }
    const { autor_id, ...msg } = m;
    return { ok: true, status, mensagem: msg };
  },
};

R['duvida-status'] = {
  method: 'POST', auth: true, limit: 30,
  run: async (ctx, b) => {
    const [d] = await ctx.sb.rest.get('duvidas', `id=eq.${Number(b.duvida) || 0}&select=*`);
    if (!d) fail(404, 'Dúvida não encontrada.');
    const aluno = d.user_id === ctx.user.id, prof = !aluno && (await ehProfessorDe(ctx, d.curso_id));
    const status = b.status;
    const patch = { status, atualizado_em: new Date(ctx.now()).toISOString() };
    if (status === 'encerrada' && (aluno || prof)) { /* ok */ } else if (status === 'plantao' && prof) {
      const [pl] = await ctx.sb.rest.get('plantoes', `curso_id=eq.${enc(d.curso_id)}&inicio=gte.${enc(new Date(ctx.now()).toISOString())}&select=id&order=inicio.asc&limit=1`);
      patch.plantao_id = pl?.id || null;
    } else if (status === 'professor' && prof) { patch.plantao_id = null; } else fail(403, 'Ação não permitida.');
    await ctx.sb.rest.update('duvidas', `id=eq.${d.id}`, patch);
    return { ok: true, ...patch };
  },
};

const MINERVA_PROF = 'Esse tema fica com o professor da formação. Envie a sua dúvida em Suporte: ela segue com a aula e o minuto anexados.';
R.minerva = {
  method: 'POST', auth: true, limit: 30,
  run: async (ctx, b) => {
    const cursoId = str(b.curso, 60);
    await acessoCurso(ctx, cursoId);
    const pergunta = str(b.pergunta, 500);
    if (!pergunta) fail(400, 'Escreva uma pergunta.');
    let items;
    try {
      items = await ctx.sb.rest.get('minerva_respostas', `ativo=is.true&or=(curso_id.is.null,curso_id.eq.${enc(cursoId)})&select=*&order=ordem.asc`);
      if (!items.length) items = RESPOSTAS_LOCAIS;
    } catch { items = RESPOSTAS_LOCAIS; }
    // as respostas desta formação vêm primeiro: em empate, ganham das gerais
    items = [...items.filter((i) => i.curso_id), ...items.filter((i) => !i.curso_id)];
    const { item, sugestoes } = buscar(pergunta, items);
    let log = null;
    try {
      [log] = await ctx.sb.rest.insert('minerva_log', { user_id: ctx.user.id, curso_id: cursoId, pergunta, resposta_id: item?.id || null });
    } catch (err) { console.error('minerva_log:', err?.status); }
    if (!item) {
      return { reply: 'Ainda não tenho essa resposta cadastrada para esta formação. Envie a dúvida ao professor: ela segue com a aula e o minuto anexados.', sugestoes, log: log?.id || null, semResposta: true };
    }
    return { reply: item.resposta, id: item.id, log: log?.id || null, fonte: item.fonte_aula ? { aula: item.fonte_aula, segundo: item.fonte_segundo || 0 } : null, professor: item.origem === 'professor' };
  },
};

R['minerva-fb'] = {
  method: 'POST', auth: true, limit: 60,
  run: async (ctx, b) => {
    if (typeof b.ajudou !== 'boolean') fail(400, 'Resposta inválida.');
    await ctx.sb.rest.update('minerva_log', `id=eq.${Number(b.log) || 0}&user_id=eq.${ctx.user.id}`, { ajudou: b.ajudou });
    return { ok: true };
  },
};

R['mentoria-pedir'] = {
  method: 'POST', auth: true, limit: 10,
  run: async (ctx, b) => {
    const cursoId = str(b.curso, 60);
    const acc = await acessoCurso(ctx, cursoId);
    if (nivel(acc.plano) < 2) fail(403, 'A mentoria individual faz parte do plano Mentoria.');
    const inicio = new Date(b.inicio);
    if (Number.isNaN(+inicio) || +inicio < ctx.now() + 3600000 || +inicio > ctx.now() + 90 * DAY) fail(400, 'Escolha um horário a partir de amanhã.');
    const usadas = await ctx.sb.rest.get('mentorias', `aluno_id=eq.${ctx.user.id}&curso_id=eq.${enc(cursoId)}&status=neq.cancelado&select=id`);
    if (!acc.prof && usadas.length >= 2) fail(409, 'Os 2 encontros de mentoria desta formação já foram marcados.');
    const [m] = await ctx.sb.rest.insert('mentorias', { curso_id: cursoId, aluno_id: ctx.user.id, inicio: inicio.toISOString(), status: 'pedido' });
    const { titulo, emails } = await emailsProfessores(ctx, cursoId, 'n3');
    await ctx.mail.send({ to: emails, subject: `Pedido de mentoria em ${titulo}`, titulo: 'Um aluno pediu um horário de mentoria.', linhas: [`${ctx.perfil.nome || 'Aluno'} pediu um encontro individual.`], botao: 'Confirmar na Área do Professor', link: `${ctx.origin}/prof/agenda` });
    return { ok: true, mentoria: m };
  },
};

R['mentoria-aluno'] = {
  method: 'POST', auth: true, limit: 20,
  run: async (ctx, b) => {
    const [m] = await ctx.sb.rest.get('mentorias', `id=eq.${Number(b.id) || 0}&aluno_id=eq.${ctx.user.id}&select=*`);
    if (!m) fail(404, 'Mentoria não encontrada.');
    let status;
    if (b.acao === 'aceitar' && m.status === 'proposto') status = 'confirmado';
    else if (b.acao === 'cancelar' && ['pedido', 'proposto', 'confirmado'].includes(m.status)) status = 'cancelado';
    else fail(400, 'Ação não permitida.');
    const [x] = await ctx.sb.rest.update('mentorias', `id=eq.${m.id}`, { status });
    return { ok: true, mentoria: x };
  },
};

R.dados = {
  method: 'GET', auth: true,
  run: async (ctx) => {
    const uid = ctx.user.id;
    const [matriculas, progresso, notas, duvidas, mentorias, minerva] = await Promise.all([
      ctx.sb.rest.get('matriculas', `email=eq.${enc(ctx.perfil.email)}&select=*`),
      ctx.sb.rest.get('progresso', `user_id=eq.${uid}&select=*`),
      ctx.sb.rest.get('notas', `user_id=eq.${uid}&select=*`),
      ctx.sb.rest.get('duvidas', `user_id=eq.${uid}&select=*`),
      ctx.sb.rest.get('mentorias', `aluno_id=eq.${uid}&select=*`),
      ctx.sb.rest.get('minerva_log', `user_id=eq.${uid}&select=pergunta,resposta_id,ajudou,criado_em`),
    ]);
    return { gerado_em: new Date(ctx.now()).toISOString(), perfil: publicPerfil(ctx.perfil), matriculas, progresso, notas, duvidas: await comMensagens(ctx, duvidas), mentorias, minerva };
  },
};

R.excluir = {
  method: 'POST', auth: true, limit: 3,
  run: async (ctx, b) => {
    if (b.confirmar !== 'EXCLUIR') fail(400, 'Digite EXCLUIR para confirmar.');
    await ctx.sb.auth.deleteUser(ctx.user.id);
    clearSession(ctx);
    return { ok: true };
  },
};

/* ----- professor ----- */
async function requireProf(ctx, cursoId) {
  const cursos = await cursosDoProfessor(ctx);
  if (!cursos.length) fail(403, 'Esta conta não tem acesso à Área do Professor. Fale com a equipe da EJUP.');
  if (cursoId && !cursos.some((c) => c.id === cursoId)) fail(403, 'Você não é professor desta formação.');
  return cursos;
}

R.prof = {
  method: 'GET', auth: true,
  run: async (ctx) => {
    const cursos = await requireProf(ctx);
    const ids = cursos.map((c) => c.id);
    const est = await estrutura(ctx, ids);
    const desde = new Date(ctx.now() - 30 * DAY).toISOString();
    const [mats, duvidas, plantoes, mentorias, logs, ensinadas] = await Promise.all([
      ctx.sb.rest.get('matriculas', `curso_id=${inList(ids)}&ativa=is.true&select=id,email,curso_id,plano,concluida_em,criado_em`),
      ctx.sb.rest.get('duvidas', `curso_id=${inList(ids)}&select=*&order=criado_em.desc&limit=300`),
      ctx.sb.rest.get('plantoes', `curso_id=${inList(ids)}&select=*&order=inicio.desc&limit=40`),
      ctx.sb.rest.get('mentorias', `curso_id=${inList(ids)}&select=*&order=inicio.asc`),
      ctx.sb.rest.get('minerva_log', `curso_id=${inList(ids)}&criado_em=gte.${enc(desde)}&select=id,curso_id,pergunta,resposta_id,ajudou,revisado,criado_em&order=criado_em.desc&limit=1000`),
      ctx.sb.rest.get('minerva_respostas', `curso_id=${inList(ids)}&select=id,curso_id,origem,pergunta`),
    ]);
    const emails = [...new Set(mats.map((m) => m.email))];
    const perfis = emails.length ? await ctx.sb.rest.get('perfis', `email=${inList(emails)}&select=id,email,nome,prefs`) : [];
    const extraIds = [...new Set([...duvidas.map((d) => d.user_id), ...mentorias.map((m) => m.aluno_id)])].filter((id) => !perfis.some((p) => p.id === id));
    const extra = extraIds.length ? await ctx.sb.rest.get('perfis', `id=${inList(extraIds)}&select=id,email,nome`) : [];
    const pessoas = [...perfis, ...extra];
    const userIds = perfis.map((p) => p.id);
    const aulaIds = est.aulas.map((a) => a.id);
    const progresso = userIds.length && aulaIds.length
      ? await ctx.sb.rest.get('progresso', `user_id=${inList(userIds)}&aula_id=${inList(aulaIds)}&select=user_id,aula_id,concluida,atualizado_em`)
      : [];
    const nomeDe = (id) => pessoas.find((p) => p.id === id)?.nome || 'Aluno';
    const alunos = mats.map((m) => {
      const p = perfis.find((x) => x.email === m.email);
      return { matricula: m.id, curso_id: m.curso_id, plano: m.plano, email: m.email, nome: p?.nome || '', user_id: p?.id || null, concluida_em: m.concluida_em, desde: m.criado_em, pace: p?.prefs?.pace || 4 };
    });
    return {
      perfil: publicPerfil(ctx.perfil),
      cursos: cursos.map(semEmails), modulos: est.modulos, aulas: est.aulas.map(aulaPublica),
      alunos, progresso,
      duvidas: (await comMensagens(ctx, duvidas)).map((d) => ({ ...d, aluno: nomeDe(d.user_id), plano: (mats.find((m) => m.curso_id === d.curso_id && m.email === pessoas.find((p) => p.id === d.user_id)?.email) || {}).plano || 'acompanhado' })),
      plantoes, mentorias: mentorias.map((m) => ({ ...m, aluno: nomeDe(m.aluno_id) })),
      minerva: { logs, ensinadas },
      email: ctx.mail.enabled,
    };
  },
};

R.plantao = {
  method: 'POST', auth: true, limit: 20,
  run: async (ctx, b) => {
    if (b.id) {
      const [pl] = await ctx.sb.rest.get('plantoes', `id=eq.${Number(b.id) || 0}&select=*`);
      if (!pl) fail(404, 'Plantão não encontrado.');
      await requireProf(ctx, pl.curso_id);
      if (b.remover) { await ctx.sb.rest.remove('plantoes', `id=eq.${pl.id}`); return { ok: true, removido: pl.id }; }
      const patch = {};
      if (b.inicio) { const d = new Date(b.inicio); if (Number.isNaN(+d)) fail(400, 'Data inválida.'); patch.inicio = d.toISOString(); }
      if ('link' in b) patch.link = link(b.link);
      if ('gravacao' in b) patch.gravacao = link(b.gravacao);
      if (Number.isInteger(b.duracao_min)) patch.duracao_min = Math.min(240, Math.max(15, b.duracao_min));
      const [x] = await ctx.sb.rest.update('plantoes', `id=eq.${pl.id}`, patch);
      return { ok: true, plantao: x };
    }
    const cursoId = str(b.curso, 60);
    await requireProf(ctx, cursoId);
    const d = new Date(b.inicio);
    if (Number.isNaN(+d)) fail(400, 'Escolha data e hora do plantão.');
    const [x] = await ctx.sb.rest.insert('plantoes', { curso_id: cursoId, inicio: d.toISOString(), duracao_min: Number.isInteger(b.duracao_min) ? b.duracao_min : 60, link: link(b.link) });
    return { ok: true, plantao: x };
  },
};

const quando = (iso) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

R.avisar = {
  method: 'POST', auth: true, limit: 5,
  run: async (ctx, b) => {
    const [pl] = await ctx.sb.rest.get('plantoes', `id=eq.${Number(b.plantao) || 0}&select=*`);
    if (!pl) fail(404, 'Plantão não encontrado.');
    const cursos = await requireProf(ctx, pl.curso_id);
    if (!ctx.mail.enabled) fail(503, 'O envio de e-mails ainda não foi configurado no site.');
    const mats = await ctx.sb.rest.get('matriculas', `curso_id=eq.${enc(pl.curso_id)}&ativa=is.true&plano=neq.essencial&select=email`);
    const titulo = cursos.find((c) => c.id === pl.curso_id)?.titulo || '';
    await ctx.mail.send({
      to: mats.map((m) => m.email), subject: `Plantão ao vivo · ${titulo}`, titulo: 'Próximo plantão ao vivo da turma.',
      linhas: [`${quando(pl.inicio)}, com duração de ${pl.duracao_min} minutos.`, 'Leve as suas dúvidas. O encontro fica gravado no portal.'],
      botao: 'Ver no Portal do Aluno', link: `${ctx.origin}/portal`,
    });
    return { ok: true, enviados: mats.length };
  },
};

R['mentoria-prof'] = {
  method: 'POST', auth: true, limit: 30,
  run: async (ctx, b) => {
    const [m] = await ctx.sb.rest.get('mentorias', `id=eq.${Number(b.id) || 0}&select=*`);
    if (!m) fail(404, 'Mentoria não encontrada.');
    await requireProf(ctx, m.curso_id);
    const patch = {};
    if (b.acao === 'confirmar') { patch.status = 'confirmado'; if ('link' in b) patch.link = link(b.link); }
    else if (b.acao === 'propor') {
      const d = new Date(b.inicio);
      if (Number.isNaN(+d) || +d < ctx.now()) fail(400, 'Escolha um horário futuro.');
      Object.assign(patch, { status: 'proposto', inicio: d.toISOString() });
    } else if (b.acao === 'cancelar') patch.status = 'cancelado';
    else if (b.acao === 'realizado') patch.status = 'realizado';
    else if (b.acao === 'link') patch.link = link(b.link);
    else fail(400, 'Ação não permitida.');
    const [x] = await ctx.sb.rest.update('mentorias', `id=eq.${m.id}`, patch);
    if (patch.status && patch.status !== 'realizado') {
      const [a] = await ctx.sb.rest.get('perfis', `id=eq.${m.aluno_id}&select=email`);
      const txt = { confirmado: 'O professor confirmou o seu horário de mentoria.', proposto: 'O professor propôs outro horário para a sua mentoria.', cancelado: 'O seu horário de mentoria foi cancelado.' }[patch.status];
      await ctx.mail.send({ to: a?.email, subject: 'Mentoria individual · EJUP', titulo: txt, linhas: [quando(x.inicio)], botao: 'Ver no Portal do Aluno', link: `${ctx.origin}/portal/suporte` });
    }
    return { ok: true, mentoria: x };
  },
};

R.lembrete = {
  method: 'POST', auth: true, limit: 20,
  run: async (ctx, b) => {
    const cursoId = str(b.curso, 60);
    const cursos = await requireProf(ctx, cursoId);
    if (!ctx.mail.enabled) fail(503, 'O envio de e-mails ainda não foi configurado no site.');
    const email = str(b.email, 254).toLowerCase();
    const [m] = await ctx.sb.rest.get('matriculas', `curso_id=eq.${enc(cursoId)}&email=eq.${enc(email)}&ativa=is.true&select=id`);
    if (!m) fail(404, 'Aluno não encontrado nesta formação.');
    const titulo = cursos.find((c) => c.id === cursoId)?.titulo || '';
    await ctx.mail.send({ to: email, subject: `Seu percurso em ${titulo}`, titulo: 'A sua formação espera por você.', linhas: [`O professor de ${titulo} lembrou de você. Retome de onde parou: o plano de estudo se reorganiza com o tempo que você tem.`], botao: 'Continuar no Portal', link: `${ctx.origin}/portal` });
    return { ok: true };
  },
};

R['minerva-rev'] = {
  method: 'POST', auth: true, limit: 30,
  run: async (ctx, b) => {
    const cursoId = str(b.curso, 60);
    await requireProf(ctx, cursoId);
    const pergunta = str(b.pergunta, 500);
    const logs = (Array.isArray(b.logs) ? b.logs : []).map(Number).filter(Number.isInteger).slice(0, 200);
    if (!pergunta || !logs.length) fail(400, 'Pergunta não informada.');
    let resposta = null;
    if (b.acao === 'corrigir') { resposta = str(b.texto, 4000); if (resposta.length < 8) fail(400, 'Escreva a correção antes de salvar.'); }
    else if (b.acao === 'nao') resposta = MINERVA_PROF;
    else if (b.acao !== 'ok') fail(400, 'Ação não permitida.');
    if (resposta) {
      const id = 'rev-' + crypto.createHash('sha1').update(cursoId + '|' + pergunta.toLowerCase()).digest('hex').slice(0, 12);
      await ctx.sb.rest.insert('minerva_respostas', { id, pergunta, variacoes: [], palavras: [], resposta, ativo: true, ordem: 400, curso_id: cursoId, origem: 'professor', portal: true }, { upsert: true, onConflict: 'id', returning: false });
    }
    await ctx.sb.rest.update('minerva_log', `id=${inList(logs)}&curso_id=eq.${enc(cursoId)}`, { revisado: true });
    return { ok: true };
  },
};

/* ----- equipe EJUP: liberar alunos, editar formações e aulas, banco da Minerva (perfis.papel = equipe) ----- */
function requireEquipe(ctx) {
  if (ctx.perfil.papel !== 'equipe') fail(403, 'Só a equipe da EJUP acessa esta área.');
}
const slug = (v) => str(v, 60).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const lista = (v, max = 30) => (Array.isArray(v) ? v : String(v || '').split(/\n|;/)).map((x) => str(x, 300)).filter(Boolean).slice(0, max);

R.equipe = {
  method: 'GET', auth: true,
  run: async (ctx) => {
    requireEquipe(ctx);
    const [cursos, modulos, aulas, matriculas, respostas] = await Promise.all([
      ctx.sb.rest.get('cursos', 'select=*&order=ordem.asc'),
      ctx.sb.rest.get('modulos', 'select=*&order=ordem.asc'),
      ctx.sb.rest.get('aulas', 'select=*&order=ordem.asc'),
      ctx.sb.rest.get('matriculas', 'select=*&order=criado_em.desc&limit=3000'),
      ctx.sb.rest.get('minerva_respostas', 'select=*&order=ordem.asc'),
    ]);
    const emails = [...new Set(matriculas.map((m) => m.email))];
    const perfis = emails.length ? await ctx.sb.rest.get('perfis', `email=${inList(emails)}&select=email,nome`) : [];
    return {
      perfil: publicPerfil(ctx.perfil), cursos, modulos, aulas, respostas,
      matriculas: matriculas.map((m) => ({ ...m, nome: perfis.find((p) => p.email === m.email)?.nome || null, conta: perfis.some((p) => p.email === m.email) })),
    };
  },
};

R['eq-matricula'] = {
  method: 'POST', auth: true, limit: 120,
  run: async (ctx, b) => {
    requireEquipe(ctx);
    if (b.id) {
      const id = Number(b.id) || 0;
      if (b.remover) { await ctx.sb.rest.remove('matriculas', `id=eq.${id}`); return { ok: true, removido: id }; }
      const patch = {};
      if (PLANOS.includes(b.plano)) patch.plano = b.plano;
      if (typeof b.ativa === 'boolean') patch.ativa = b.ativa;
      const [m] = await ctx.sb.rest.update('matriculas', `id=eq.${id}`, patch);
      if (!m) fail(404, 'Matrícula não encontrada.');
      return { ok: true, matricula: m };
    }
    const emails = lista(b.email, 200).map((e) => e.toLowerCase());
    if (!emails.length || !emails.every(okMail)) fail(400, 'Confira os e-mails: um por linha, no formato voce@exemplo.com.');
    const cursoId = str(b.curso, 60);
    const [c] = await ctx.sb.rest.get('cursos', `id=eq.${enc(cursoId)}&select=id`);
    if (!c) fail(400, 'Escolha a formação.');
    const plano = PLANOS.includes(b.plano) ? b.plano : 'essencial';
    const rows = emails.map((email) => ({ email, curso_id: cursoId, plano, ativa: true }));
    const out = await ctx.sb.rest.insert('matriculas', rows, { upsert: true, onConflict: 'email,curso_id' });
    return { ok: true, matriculas: out };
  },
};

R['eq-curso'] = {
  method: 'POST', auth: true, limit: 60,
  run: async (ctx, b) => {
    requireEquipe(ctx);
    const id = slug(b.id);
    if (!id) fail(400, 'Informe o endereço da formação (ex.: licenciamento).');
    const titulo = str(b.titulo, 200);
    if (titulo.length < 3) fail(400, 'Informe o nome da formação.');
    const emails = lista(b.professor_emails, 20).map((e) => e.toLowerCase());
    if (!emails.every(okMail)) fail(400, 'Confira os e-mails dos professores.');
    const row = { id, titulo, area: str(b.area, 80), horas: Math.max(0, Number(b.horas) || 0), descricao: str(b.descricao, 600), capa: str(b.capa, 300) || null, professores: str(b.professores, 200), professor_emails: emails, ativo: b.ativo !== false, ordem: Number.isInteger(b.ordem) ? b.ordem : 0 };
    const [c] = await ctx.sb.rest.insert('cursos', row, { upsert: true, onConflict: 'id' });
    return { ok: true, curso: c };
  },
};

R['eq-modulo'] = {
  method: 'POST', auth: true, limit: 60,
  run: async (ctx, b) => {
    requireEquipe(ctx);
    if (b.id && b.remover) {
      const aulas = await ctx.sb.rest.get('aulas', `modulo_id=eq.${enc(b.id)}&select=id`);
      if (aulas.length) fail(409, 'Remova ou mova as aulas deste módulo antes.');
      await ctx.sb.rest.remove('modulos', `id=eq.${enc(b.id)}`);
      return { ok: true, removido: b.id };
    }
    const titulo = str(b.titulo, 200);
    if (titulo.length < 2) fail(400, 'Informe o título do módulo.');
    const cursoId = str(b.curso, 60);
    const ordem = Math.max(0, Math.round(Number(b.ordem) || 0));
    const id = b.id ? str(b.id, 80) : `${cursoId}-m${Date.now().toString(36)}`;
    const [m] = await ctx.sb.rest.insert('modulos', { id, curso_id: cursoId, ordem, titulo }, { upsert: true, onConflict: 'id' });
    return { ok: true, modulo: m };
  },
};

R['eq-aula'] = {
  method: 'POST', auth: true, limit: 120,
  run: async (ctx, b) => {
    requireEquipe(ctx);
    if (b.id && b.remover) { await ctx.sb.rest.remove('aulas', `id=eq.${enc(b.id)}`); return { ok: true, removido: b.id }; }
    const titulo = str(b.titulo, 200);
    if (titulo.length < 2) fail(400, 'Informe o título da aula.');
    const moduloId = str(b.modulo, 80);
    const [m] = await ctx.sb.rest.get('modulos', `id=eq.${enc(moduloId)}&select=id`);
    if (!m) fail(400, 'Módulo não encontrado.');
    const video = str(b.video, 500);
    if (video && /^[a-z]+:/i.test(video) && !/^https?:\/\//i.test(video)) fail(400, 'O vídeo precisa ser um link https:// ou um caminho no Storage.');
    const materiais = (Array.isArray(b.materiais) ? b.materiais : []).slice(0, 20).map((x) => ({ nome: str(x?.nome, 120) || 'Material', url: str(x?.url, 500), tipo: str(x?.tipo, 20) }))
      .filter((x) => x.url && (/^https?:\/\//i.test(x.url) || !/^[a-z]+:/i.test(x.url)));
    const row = {
      id: b.id ? str(b.id, 80) : `${moduloId}-a${Date.now().toString(36)}`, modulo_id: moduloId, titulo,
      ordem: Math.max(0, Math.round(Number(b.ordem) || 0)), duracao_min: Math.max(0, Math.min(600, Math.round(Number(b.duracao_min) || 0))),
      video: video || null, sobre: str(b.sobre, 3000), topicos: lista(b.topicos, 12), materiais, publicada: b.publicada !== false,
    };
    const [a] = await ctx.sb.rest.insert('aulas', row, { upsert: true, onConflict: 'id' });
    return { ok: true, aula: a };
  },
};

R['eq-resposta'] = {
  method: 'POST', auth: true, limit: 120,
  run: async (ctx, b) => {
    requireEquipe(ctx);
    if (b.id && b.remover) { await ctx.sb.rest.remove('minerva_respostas', `id=eq.${enc(b.id)}`); return { ok: true, removido: b.id }; }
    const pergunta = str(b.pergunta, 300), resposta = str(b.resposta, 4000);
    if (pergunta.length < 3 || resposta.length < 3) fail(400, 'Preencha a pergunta e a resposta.');
    const row = {
      id: b.id ? str(b.id, 80) : slug(pergunta).slice(0, 40) + '-' + Date.now().toString(36).slice(-4), pergunta, resposta,
      variacoes: lista(b.variacoes, 30), palavras: lista(b.palavras, 20).map((x) => x.toLowerCase()), ativo: b.ativo !== false,
      ordem: Math.round(Number(b.ordem) || 0), curso_id: str(b.curso_id, 60) || null, portal: Boolean(b.portal),
    };
    if (!b.id) row.origem = 'equipe';
    const [r] = await ctx.sb.rest.insert('minerva_respostas', row, { upsert: true, onConflict: 'id' });
    return { ok: true, resposta: r };
  },
};

/* ----- tarefa diária (Vercel Cron): lembretes de estudo e resumo para professores ----- */
R.cron = {
  method: 'GET', cron: true,
  run: async (ctx) => {
    if (!ctx.mail.enabled) return { ok: true, enviados: 0, motivo: 'e-mail não configurado' };
    const hoje = new Date(new Date(ctx.now()).toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
    const dia = (hoje.getDay() + 6) % 7; // 0 = segunda
    let enviados = 0;
    const alunos = await ctx.sb.rest.get('perfis', 'prefs->>mail=eq.true&select=id,email,nome,prefs&limit=500');
    for (const p of alunos) {
      const dias = Array.isArray(p.prefs?.days) ? p.prefs.days : [0, 2, 4];
      if (!dias.includes(dia)) continue;
      const mats = await ctx.sb.rest.get('matriculas', `email=eq.${enc(p.email)}&ativa=is.true&concluida_em=is.null&select=curso_id`);
      if (!mats.length) continue;
      const est = await estrutura(ctx, mats.map((m) => m.curso_id));
      const feitas = new Set((await ctx.sb.rest.get('progresso', `user_id=eq.${p.id}&concluida=is.true&select=aula_id`)).map((x) => x.aula_id));
      const prox = est.aulas.filter((a) => !feitas.has(a.id))
        .sort((a, b) => { const ma = est.modulos.find((m) => m.id === a.modulo_id), mb = est.modulos.find((m) => m.id === b.modulo_id); return (ma.ordem - mb.ordem) || (a.ordem - b.ordem); })[0];
      if (!prox) continue;
      const mod = est.modulos.find((m) => m.id === prox.modulo_id);
      const curso = est.cursos.find((c) => c.id === mod.curso_id);
      await ctx.mail.send({ to: p.email, subject: 'Hoje é dia de estudo', titulo: 'Hoje é um dos seus dias de estudo.', linhas: [`Próxima aula em ${curso.titulo}: Módulo ${String(mod.ordem).padStart(2, '0')} · ${prox.titulo} (${prox.duracao_min} min).`], botao: 'Continuar no Portal', link: `${ctx.origin}/portal` });
      enviados += 1;
    }
    const profs = await ctx.sb.rest.get('perfis', 'prefs->>n2=eq.true&select=id,email,nome,papel,prefs&limit=100');
    for (const p of profs) {
      ctx.perfil = p; ctx._profCursos = null;
      const cursos = await cursosDoProfessor(ctx);
      if (!cursos.length) continue;
      const pend = await ctx.sb.rest.get('duvidas', `curso_id=${inList(cursos.map((c) => c.id))}&status=eq.professor&select=id`);
      if (!pend.length) continue;
      await ctx.mail.send({ to: p.email, subject: `${pend.length} ${pend.length === 1 ? 'dúvida espera' : 'dúvidas esperam'} a sua resposta`, titulo: 'Resumo do dia na Área do Professor.', linhas: [`${pend.length} ${pend.length === 1 ? 'dúvida está' : 'dúvidas estão'} com você.`], botao: 'Abrir a Área do Professor', link: `${ctx.origin}/prof/duvidas` });
      enviados += 1;
    }
    return { ok: true, enviados };
  },
};

/* ---------- handler ---------- */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

export function createPortalHandler({ fetchImpl = fetch, env = process.env, now = Date.now } = {}) {
  return async function handler(req, res) {
    const url = new URL(req.url || '/', 'http://x');
    const query = req.query && typeof req.query === 'object' ? req.query : Object.fromEntries(url.searchParams);
    const route = R[String(query.r || '')];
    res.setHeader('Cache-Control', 'no-store');
    if (!route) return res.status(404).json({ error: 'Rota não encontrada.' });
    if (req.method !== route.method) { res.setHeader('Allow', route.method); return res.status(405).json({ error: 'Método não permitido.' }); }
    if (req.method !== 'GET' && !sameOrigin(req)) return res.status(403).json({ error: 'Origem não permitida.' });
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || (/^localhost|^127\./.test(host) ? 'http' : 'https');
    const ctx = {
      req, res, env, now, query, cookies: [],
      secure: proto === 'https',
      origin: String(env.SITE_URL || `${proto}://${host}`).replace(/\/$/, ''),
      sb: createSb({ env, fetchImpl }), mail: createMailer({ env, fetchImpl }),
    };
    const done = (status, payload) => {
      if (ctx.cookies.length) res.setHeader('Set-Cookie', ctx.cookies);
      return res.status(status).json(payload);
    };
    if (!ctx.sb.configured) return done(503, { error: 'O portal ainda não está ligado ao banco de dados.' });
    if (route.cron && (!env.CRON_SECRET || req.headers.authorization !== `Bearer ${env.CRON_SECRET}`)) return done(401, { error: 'Não autorizado.' });
    if (route.limit) {
      const lim = rateLimit(`p:${query.r}:${clientIp(req)}`, now(), route.limit);
      if (!lim.allowed) { res.setHeader('Retry-After', String(lim.retryAfter)); return done(429, { error: 'Muitas tentativas em sequência. Aguarde um minuto.' }); }
    }
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
    if (!body || typeof body !== 'object') body = {};
    try {
      if (route.auth) await requireUser(ctx);
      const out = await route.run(ctx, body);
      return done(200, out);
    } catch (err) {
      if (err instanceof HttpError) return done(err.status, { error: err.message, ...(err.extra || {}) });
      console.error('portal', query.r, err instanceof SbError ? `${err.status} ${JSON.stringify(err.body)}` : err);
      return done(502, { error: 'Não foi possível concluir agora. Tente de novo em instantes.' });
    }
  };
}
