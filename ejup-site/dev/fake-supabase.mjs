// Supabase em memória para testes e para o servidor local (FAKE_SB=1).
// Imita só o que o Portal usa do PostgREST, do Auth e do Storage.
import crypto from 'node:crypto';

const clone = (x) => JSON.parse(JSON.stringify(x));
const KEYS = { perfis: ['id'], cursos: ['id'], modulos: ['id'], aulas: ['id'], matriculas: ['id'], progresso: ['user_id', 'aula_id'], notas: ['user_id', 'aula_id'], duvidas: ['id'], mensagens: ['id'], plantoes: ['id'], mentorias: ['id'], minerva_log: ['id'], minerva_respostas: ['id'], leads: ['id'] };
const SERIAL = new Set(['matriculas', 'duvidas', 'mensagens', 'plantoes', 'mentorias', 'minerva_log', 'leads']);

function splitTop(s) {
  const out = []; let depth = 0, cur = '', quote = false;
  for (const ch of s) {
    if (ch === '"') quote = !quote;
    if (!quote && ch === '(') depth += 1;
    if (!quote && ch === ')') depth -= 1;
    if (ch === ',' && depth === 0 && !quote) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}
const unq = (v) => v.replace(/^"|"$/g, '');
const val = (row, col) => {
  const m = col.match(/^(\w+)->>(\w+)$/);
  if (m) { const o = row[m[1]]; return o && o[m[2]] !== undefined ? String(o[m[2]]) : null; }
  return row[col];
};
function test(row, col, expr) {
  const i = expr.indexOf('.');
  const op = expr.slice(0, i), arg = expr.slice(i + 1);
  const v = val(row, col);
  const cmp = (x) => (typeof v === 'number' ? Number(x) : x);
  switch (op) {
    case 'eq': return String(v) === unq(arg);
    case 'neq': return String(v) !== unq(arg);
    case 'is': return arg === 'null' ? v == null : arg === 'true' ? v === true : arg === 'false' ? v === false || v == null && false : false;
    case 'gte': return v != null && v >= cmp(arg);
    case 'lte': return v != null && v <= cmp(arg);
    case 'gt': return v != null && v > cmp(arg);
    case 'lt': return v != null && v < cmp(arg);
    case 'in': return splitTop(arg.slice(1, -1)).map(unq).includes(String(v));
    case 'cs': { const want = splitTop(arg.slice(1, -1)).map(unq); return Array.isArray(v) && want.every((w) => v.includes(w)); }
    default: throw new Error('op ' + op);
  }
}
function filterRows(rows, params) {
  let out = rows;
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'on_conflict'].includes(k)) continue;
    if (k === 'or') {
      const conds = splitTop(v.slice(1, -1)).map((c) => { const i = c.indexOf('.'); return [c.slice(0, i), c.slice(i + 1)]; });
      out = out.filter((r) => conds.some(([c, e]) => test(r, c, e)));
    } else out = out.filter((r) => test(r, k, v));
  }
  return out;
}

export function createFakeSupabase({ url = 'https://fake.supabase.co', now = () => Date.now() } = {}) {
  const db = Object.fromEntries(Object.keys(KEYS).map((t) => [t, []]));
  const users = []; // {id,email,password,confirmed,meta}
  const tokens = new Map(); // access -> user id
  const refresh = new Map(); // refresh -> user id
  const sent = []; // e-mails do Auth (confirmação/recuperação)
  let seq = 1;
  const state = { confirmEmail: false };

  function insert(table, row, { upsert, onConflict } = {}) {
    const keys = onConflict ? onConflict.split(',') : KEYS[table];
    if (SERIAL.has(table) && row.id == null) row = { id: seq++, ...row };
    if (table === 'matriculas' && row.email) row.email = row.email.toLowerCase().trim();
    const defaults = {
      perfis: { papel: 'aluno', nome: '', prefs: {}, criado_em: new Date(now()).toISOString() },
      matriculas: { plano: 'essencial', ativa: true, concluida_em: null, certificado: null, criado_em: new Date(now()).toISOString() },
      duvidas: { status: 'professor', via_minerva: false, plantao_id: null, criado_em: new Date(now()).toISOString(), atualizado_em: new Date(now()).toISOString() },
      mensagens: { criado_em: new Date(now()).toISOString() },
      mentorias: { status: 'pedido', link: null, criado_em: new Date(now()).toISOString() },
      plantoes: { duracao_min: 60, link: null, gravacao: null, criado_em: new Date(now()).toISOString() },
      minerva_log: { ajudou: null, revisado: false, criado_em: new Date(now()).toISOString() },
      minerva_respostas: { ativo: true, ordem: 0, curso_id: null, fonte_aula: null, fonte_segundo: null, origem: 'equipe', portal: false, variacoes: [], palavras: [] },
      progresso: { concluida: false, segundo: 0 },
    }[table] || {};
    const found = db[table].find((r) => keys.every((k) => String(r[k]) === String(row[k])));
    if (table === 'matriculas' && !upsert && db.matriculas.some((r) => r.email === row.email && r.curso_id === row.curso_id)) return { conflict: true };
    if (found) {
      if (!upsert) return { conflict: true };
      Object.assign(found, row);
      return { row: found };
    }
    const r = { ...defaults, ...row };
    db[table].push(r);
    return { row: r };
  }

  function json(status, body) {
    return { ok: status >= 200 && status < 300, status, text: async () => (body === undefined ? '' : JSON.stringify(body)), json: async () => body };
  }
  function session(u) {
    const at = 'at-' + crypto.randomUUID(), rt = 'rt-' + crypto.randomUUID();
    tokens.set(at, u.id); refresh.set(rt, u.id);
    return { access_token: at, refresh_token: rt, expires_in: 3600, token_type: 'bearer', user: pub(u) };
  }
  const pub = (u) => ({ id: u.id, email: u.email, user_metadata: u.meta, email_confirmed_at: u.confirmed ? 'x' : null });
  function addUser(email, password, meta = {}, confirmed = true) {
    const u = { id: crypto.randomUUID(), email: email.toLowerCase(), password, confirmed, meta };
    users.push(u);
    insert('perfis', { id: u.id, email: u.email, nome: meta.nome || '' }, { upsert: true });
    return u;
  }

  async function fetchImpl(input, init = {}) {
    const u = new URL(String(input));
    if (u.origin !== new URL(url).origin) throw new Error('fake: host inesperado ' + u.origin);
    const method = (init.method || 'GET').toUpperCase();
    const headers = Object.fromEntries(Object.entries(init.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const body = init.body ? JSON.parse(init.body) : undefined;
    const bearer = (headers.authorization || '').replace(/^Bearer /, '');
    const path = u.pathname;

    if (path.startsWith('/auth/v1/')) {
      const p = path.slice(9);
      if (p === 'signup') {
        if (users.some((x) => x.email === body.email.toLowerCase())) return json(state.confirmEmail ? 200 : 422, state.confirmEmail ? { id: 'fake', identities: [] } : { msg: 'User already registered' });
        const nu = addUser(body.email, body.password, body.data || {}, !state.confirmEmail);
        if (state.confirmEmail) { sent.push({ tipo: 'confirmar', email: nu.email, redirect: u.searchParams.get('redirect_to') }); return json(200, pub(nu)); }
        return json(200, session(nu));
      }
      if (p === 'token') {
        const g = u.searchParams.get('grant_type');
        if (g === 'password') {
          const x = users.find((y) => y.email === String(body.email).toLowerCase() && y.password === body.password);
          if (!x) return json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
          if (!x.confirmed) return json(400, { error: 'invalid_grant', error_description: 'Email not confirmed' });
          return json(200, session(x));
        }
        if (g === 'refresh_token') {
          const id = refresh.get(body.refresh_token);
          if (!id) return json(400, { error: 'invalid_grant' });
          refresh.delete(body.refresh_token);
          return json(200, session(users.find((y) => y.id === id)));
        }
      }
      if (p === 'user') {
        const id = tokens.get(bearer);
        const x = users.find((y) => y.id === id);
        if (!x) return json(401, { msg: 'invalid token' });
        if (method === 'PUT') { if (body.password) { if (body.password === x.password) return json(422, { msg: 'New password should be different from the old password.' }); x.password = body.password; } return json(200, pub(x)); }
        return json(200, pub(x));
      }
      if (p === 'recover') { sent.push({ tipo: 'recuperar', email: body.email, redirect: u.searchParams.get('redirect_to') }); return json(200, {}); }
      if (p === 'logout') {
        const id = tokens.get(bearer);
        if (u.searchParams.get('scope') === 'global') { for (const [k, v] of tokens) if (v === id) tokens.delete(k); for (const [k, v] of refresh) if (v === id) refresh.delete(k); } else tokens.delete(bearer);
        return json(204);
      }
      const del = p.match(/^admin\/users\/(.+)$/);
      if (del && method === 'DELETE') {
        const id = decodeURIComponent(del[1]);
        const i = users.findIndex((y) => y.id === id);
        if (i < 0) return json(404, {});
        users.splice(i, 1);
        ['perfis'].forEach((t) => { db[t] = db[t].filter((r) => r.id !== id); });
        ['progresso', 'notas', 'duvidas'].forEach((t) => { db[t] = db[t].filter((r) => r.user_id !== id); });
        db.mentorias = db.mentorias.filter((r) => r.aluno_id !== id);
        return json(200, {});
      }
      return json(404, { msg: 'fake auth: ' + p });
    }

    if (path.startsWith('/storage/v1/object/sign/')) {
      return json(200, { signedURL: `/object/sign/${path.slice(24)}?token=fake` });
    }

    const m = path.match(/^\/rest\/v1\/(\w+)$/);
    if (!m) return json(404, { message: 'fake: ' + path });
    const table = m[1];
    if (!db[table]) return json(404, { message: 'tabela ' + table });
    const params = [...u.searchParams.entries()];
    const prefer = headers.prefer || '';
    if (method === 'GET') {
      let rows = filterRows(db[table], params);
      const order = u.searchParams.get('order');
      if (order) {
        const [col, dir] = order.split('.');
        rows = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (dir === 'desc' ? -1 : 1));
      }
      const limit = Number(u.searchParams.get('limit') || 0);
      if (limit) rows = rows.slice(0, limit);
      const sel = u.searchParams.get('select');
      if (sel && sel !== '*') { const cols = sel.split(','); rows = rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c] ?? null]))); }
      return json(200, clone(rows));
    }
    if (method === 'POST') {
      const list = Array.isArray(body) ? body : [body];
      const out = [];
      for (const row of list) {
        const r = insert(table, clone(row), { upsert: prefer.includes('merge-duplicates'), onConflict: u.searchParams.get('on_conflict') });
        if (r.conflict) return json(409, { code: '23505', message: 'duplicate key' });
        out.push(r.row);
      }
      return json(201, prefer.includes('return=representation') ? clone(out) : undefined);
    }
    if (method === 'PATCH') {
      const rows = filterRows(db[table], params);
      rows.forEach((r) => Object.assign(r, clone(body)));
      return json(200, clone(rows));
    }
    if (method === 'DELETE') {
      const rows = new Set(filterRows(db[table], params));
      db[table] = db[table].filter((r) => !rows.has(r));
      return json(204);
    }
    return json(405, {});
  }

  return { url, fetchImpl, db, users, sent, state, addUser, insert: (t, r) => insert(t, r, { upsert: true }).row };
}

// dados de exemplo: a formação Licenciamento com 14 aulas, um aluno, uma professora
export function seed(fake) {
  const now = new Date();
  fake.insert('cursos', { id: 'licenciamento', titulo: 'Marco Legal do Licenciamento Ambiental', area: 'Direito Ambiental', horas: 10, capa: '/img/curso1.jpg', professores: 'Leonardo Pivotto e Maria Helena Cortez', professor_emails: ['professor@ejup.com.br'], ativo: true, ordem: 1 });
  fake.insert('cursos', { id: 'pareceres', titulo: 'Formação em Pareceres Técnicos Ambientais', area: 'Direito Ambiental', horas: 8, capa: '/img/curso2.jpg', professores: 'Leonardo Pivotto', professor_emails: ['professor@ejup.com.br'], ativo: true, ordem: 2 });
  const mods = [['lic-m1', 'Introdução e Princípios Fundamentais', 4], ['lic-m2', 'As Modalidades de Licenciamento', 4], ['lic-m3', 'Isenções e Dispensas de Licenciamento', 3], ['lic-m4', 'Temas Transversais e Procedimentais', 3]];
  const dur = [42, 42, 42, 42, 42, 42, 40, 35, 45, 40, 38, 50, 45, 55];
  let k = 0;
  mods.forEach(([id, titulo, n], i) => {
    fake.insert('modulos', { id, curso_id: 'licenciamento', ordem: i + 1, titulo });
    for (let a = 1; a <= n; a += 1) {
      fake.insert('aulas', {
        id: `${id}-a${a}`, modulo_id: id, ordem: a, titulo: id === 'lic-m2' && a === 3 ? 'As modalidades de licenciamento na prática' : `Aula ${a}`,
        duracao_min: dur[k++], video: a === 1 && id === 'lic-m1' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
        sobre: id === 'lic-m2' && a === 3 ? 'A aula percorre as modalidades previstas na nova lei, quando cada uma se aplica e o que muda nos prazos e nas condicionantes.' : '',
        topicos: id === 'lic-m2' && a === 3 ? ['Quando cada modalidade se aplica', 'Prazos, renovações e condicionantes', 'Erros comuns de enquadramento'] : [],
        materiais: id === 'lic-m2' ? [{ nome: 'Lei nº 15.190/2025, texto integral', url: 'https://www.planalto.gov.br/', tipo: 'Link' }, { nome: 'Slides da aula', url: 'licenciamento/m2-slides.pdf', tipo: 'PDF' }] : [],
        publicada: true,
      });
    }
  });
  const aluno = fake.addUser('aluno@ejup.com.br', 'senha-aluno-1', { nome: 'Ana Lima' });
  const prof = fake.addUser('professor@ejup.com.br', 'senha-prof-1', { nome: 'Leonardo Pivotto' });
  const outro = fake.addUser('bruno@ejup.com.br', 'senha-bruno-1', { nome: 'Bruno Costa' });
  const equipe = fake.addUser('equipe@ejup.com.br', 'senha-equipe-1', { nome: 'Equipe EJUP' });
  fake.db.perfis.find((p) => p.id === equipe.id).papel = 'equipe';
  fake.db.perfis.find((p) => p.id === prof.id).prefs = { disp: [{ dia: 0, ini: '18:00', fim: '19:00', on: true }, { dia: 2, ini: '18:00', fim: '19:00', on: true }, { dia: 4, ini: '12:00', fim: '13:00', on: true }], n1: true, n3: true, n4: true };
  fake.insert('matriculas', { email: 'aluno@ejup.com.br', curso_id: 'licenciamento', plano: 'mentoria' });
  fake.insert('matriculas', { email: 'aluno@ejup.com.br', curso_id: 'pareceres', plano: 'essencial' });
  fake.insert('matriculas', { email: 'bruno@ejup.com.br', curso_id: 'licenciamento', plano: 'acompanhado' });
  ['lic-m1-a1', 'lic-m1-a2', 'lic-m1-a3', 'lic-m1-a4', 'lic-m2-a1', 'lic-m2-a2'].forEach((a, i) => fake.insert('progresso', { user_id: aluno.id, aula_id: a, concluida: true, segundo: 0, atualizado_em: new Date(+now - (10 - i) * 86400000).toISOString() }));
  fake.insert('progresso', { user_id: outro.id, aula_id: 'lic-m1-a1', concluida: true, segundo: 0, atualizado_em: new Date(+now - 20 * 86400000).toISOString() });
  fake.insert('plantoes', { curso_id: 'licenciamento', inicio: new Date(+now + 5 * 86400000).toISOString(), duracao_min: 60, link: 'https://meet.google.com/abc-defg-hij' });
  fake.insert('plantoes', { curso_id: 'licenciamento', inicio: new Date(+now - 9 * 86400000).toISOString(), duracao_min: 58, gravacao: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  const d = fake.insert('duvidas', { user_id: outro.id, curso_id: 'licenciamento', aula_id: 'lic-m1-a1', segundo: 340, titulo: 'Dispensa de licenciamento em área rural', via_minerva: true });
  fake.insert('mensagens', { duvida_id: d.id, autor_id: outro.id, papel: 'aluno', texto: 'Uma propriedade rural pequena pode ser dispensada do licenciamento pela nova lei? Em que condições?' });
  fake.insert('minerva_respostas', { id: 'lic-modalidades', pergunta: 'Quais são as modalidades de licenciamento?', variacoes: ['modalidades de licença', 'tipos de licenciamento'], palavras: ['modalidades', 'modalidade'], resposta: 'A nova lei organiza o licenciamento em modalidades conforme o porte e o potencial poluidor do empreendimento. A aula 3 do Módulo 02 percorre cada uma delas.', curso_id: 'licenciamento', fonte_aula: 'lic-m2-a3', fonte_segundo: 710, portal: true, ativo: true, ordem: 1 });
  fake.insert('minerva_log', { user_id: outro.id, curso_id: 'licenciamento', pergunta: 'qual o prazo de renovação da licença?', resposta_id: null, ajudou: false, criado_em: new Date(+now - 86400000).toISOString() });
  fake.insert('minerva_log', { user_id: aluno.id, curso_id: 'licenciamento', pergunta: 'prazo de renovação da licença', resposta_id: null, ajudou: false, criado_em: new Date(+now - 2 * 86400000).toISOString() });
  return { aluno, prof, outro, equipe };
}
