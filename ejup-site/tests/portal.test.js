import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createPortalHandler, parseCookies, _resetCache } from '../api/_lib/portal.js';
import { parseVideo } from '../api/_lib/video.js';
import { _reset } from '../api/_lib/ratelimit.js';
import { createFakeSupabase, seed } from '../dev/fake-supabase.mjs';

let fake, people, h, mails;
beforeEach(() => {
  _reset(); _resetCache();
  fake = createFakeSupabase();
  people = seed(fake);
  mails = [];
  const fetchImpl = async (url, init) => {
    if (String(url).startsWith('https://api.resend.com')) { mails.push(JSON.parse(init.body)); return { ok: true, status: 200, text: async () => '{}' }; }
    return fake.fetchImpl(url, init);
  };
  h = createPortalHandler({ fetchImpl, env: { SUPABASE_URL: fake.url, SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_x', RESEND_API_KEY: 're_x', EMAIL_FROM: 'EJUP <portal@ejup.com.br>', CRON_SECRET: 'cron' } });
});

// navegador mínimo: guarda os cookies entre chamadas
function browser() {
  const jar = {};
  async function call(r, { method, body, query = '', headers = {} } = {}) {
    const m = method || (body ? 'POST' : 'GET');
    const req = { method: m, url: `/api/portal?r=${r}${query}`, body, headers: { host: 'ejup.test', 'x-forwarded-proto': 'https', cookie: Object.entries(jar).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; '), ...headers } };
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, status(c) { this.statusCode = c; return this; }, json(p) { this.payload = p; return this; } };
    await h(req, res);
    (res.headers['set-cookie'] || []).forEach((c) => {
      const [kv, ...attrs] = c.split('; ');
      const [k, v] = kv.split('=');
      if (attrs.some((a) => a === 'Max-Age=0')) delete jar[k]; else jar[k] = decodeURIComponent(v);
    });
    return res;
  }
  return { call, jar };
}
async function logged(email, senha) {
  const b = browser();
  const r = await b.call('entrar', { body: { email, senha } });
  assert.equal(r.statusCode, 200, JSON.stringify(r.payload));
  return b;
}

test('cria conta, entra com cookie HttpOnly e sai', async () => {
  const b = browser();
  const c = await b.call('criar', { body: { nome: 'Carla Melo', email: 'Carla@Exemplo.com', senha: 'umasenhaboa1' } });
  assert.equal(c.statusCode, 200);
  assert.equal(c.payload.sessao, true);
  const cookies = c.headers['set-cookie'];
  assert.ok(cookies.some((x) => x.startsWith('ejup_at=') && x.includes('HttpOnly') && x.includes('Secure') && x.includes('Path=/api/portal')));
  assert.ok(cookies.some((x) => x.startsWith('ejup_on=1') && !x.includes('HttpOnly')));
  const me = await b.call('me');
  assert.equal(me.payload.perfil.nome, 'Carla Melo');
  assert.equal(me.payload.perfil.email, 'carla@exemplo.com');
  assert.deepEqual(me.payload.matriculas, []);
  assert.equal((await b.call('sair', { body: {} })).statusCode, 200);
  assert.equal(b.jar.ejup_at, undefined);
  assert.equal((await b.call('me')).statusCode, 401);
});

test('login errado, senha curta e confirmação de e-mail', async () => {
  const b = browser();
  assert.equal((await b.call('entrar', { body: { email: 'aluno@ejup.com.br', senha: 'errada' } })).statusCode, 401);
  assert.equal((await b.call('criar', { body: { nome: 'X Y', email: 'x@y.com', senha: '123' } })).statusCode, 400);
  fake.state.confirmEmail = true;
  const c = await b.call('criar', { body: { nome: 'Dora Reis', email: 'dora@exemplo.com', senha: 'senhaforte9' } });
  assert.equal(c.payload.confirmar, true);
  assert.equal(fake.sent.at(-1).redirect, 'https://ejup.test/entrar');
  const e = await b.call('entrar', { body: { email: 'dora@exemplo.com', senha: 'senhaforte9' } });
  assert.equal(e.statusCode, 403);
  assert.match(e.payload.error, /Confirme/);
});

test('renova a sessão pelo refresh token quando o token de acesso some', async () => {
  const b = await logged('aluno@ejup.com.br', 'senha-aluno-1');
  b.jar.ejup_at = 'expirado';
  const me = await b.call('me');
  assert.equal(me.statusCode, 200);
  assert.notEqual(b.jar.ejup_at, 'expirado');
});

test('portal do aluno: matrículas, estrutura, progresso e materiais assinados', async () => {
  const b = await logged('aluno@ejup.com.br', 'senha-aluno-1');
  const me = (await b.call('me')).payload;
  assert.deepEqual(me.matriculas.map((m) => [m.curso_id, m.plano]), [['licenciamento', 'mentoria'], ['pareceres', 'essencial']]);
  assert.equal(me.aulas.length, 14);
  assert.equal(me.progresso.filter((p) => p.concluida).length, 6);
  assert.equal(me.plantoes.length, 2);
  assert.ok(me.disponibilidade.licenciamento.length === 3);
  assert.equal(me.aulas[0].video, true);
  assert.equal(JSON.stringify(me).includes('professor_emails'), false, 'não expõe e-mails dos professores');
  const a = (await b.call('aula', { query: '&id=lic-m2-a3' })).payload;
  assert.equal(a.video, null);
  assert.equal(a.materiais.length, 2);
  assert.match(a.materiais[1].url, /storage\/v1\/object\/sign\/materiais\/licenciamento\/m2-slides\.pdf/);
  const v = (await b.call('aula', { query: '&id=lic-m1-a1' })).payload;
  assert.equal(v.video.provedor, 'youtube');
  // quem não tem matrícula não abre a aula
  const c = browser();
  await c.call('criar', { body: { nome: 'Sem Acesso', email: 'sem@acesso.com', senha: 'senhaforte9' } });
  assert.equal((await c.call('aula', { query: '&id=lic-m1-a1' })).statusCode, 403);
});

test('concluir a última aula libera o certificado com código público', async () => {
  const b = await logged('aluno@ejup.com.br', 'senha-aluno-1');
  const ids = fake.db.aulas.map((a) => a.id);
  let last;
  for (const id of ids) last = (await b.call('progresso', { body: { aula: id, concluida: true } })).payload;
  assert.match(last.certificado, /^EJUP-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  const pub = (await browser().call('certificado', { query: `&codigo=${last.certificado}` })).payload;
  assert.equal(pub.nome, 'Ana Lima');
  assert.equal(pub.curso, 'Marco Legal do Licenciamento Ambiental');
  assert.equal((await browser().call('certificado', { query: '&codigo=EJUP-0000-0000' })).statusCode, 404);
});

test('dúvida ao professor: plano, resposta, e-mails e Minerva aprendendo', async () => {
  const b = await logged('aluno@ejup.com.br', 'senha-aluno-1');
  const neg = await b.call('duvida', { body: { curso: 'pareceres', texto: 'Uma dúvida sobre pareceres técnicos' } });
  assert.equal(neg.statusCode, 403, 'plano Essencial não tem professor');
  const d = (await b.call('duvida', { body: { curso: 'licenciamento', aula: 'lic-m2-a3', segundo: 712, texto: 'Como fica o prazo de renovação da licença de operação?', via_minerva: true } })).payload.duvida;
  assert.equal(d.status, 'professor');
  assert.equal(mails.at(-1).to[0], 'professor@ejup.com.br');
  const p = await logged('professor@ejup.com.br', 'senha-prof-1');
  const prof = (await p.call('prof')).payload;
  assert.equal(prof.duvidas.length, 2);
  assert.equal(prof.alunos.length, 3, 'Ana em duas formações e Bruno');
  const r = await p.call('mensagem', { body: { duvida: d.id, texto: 'A renovação deve ser pedida com antecedência mínima de 120 dias.', ensinar: true } });
  assert.equal(r.payload.status, 'respondida');
  assert.equal(mails.at(-1).to[0], 'aluno@ejup.com.br');
  const ans = (await b.call('minerva', { body: { curso: 'licenciamento', pergunta: 'qual o prazo de renovação da licença de operação?' } })).payload;
  assert.match(ans.reply, /120 dias/);
  assert.equal(ans.professor, true);
  assert.deepEqual(ans.fonte, { aula: 'lic-m2-a3', segundo: 712 });
  // aluno de outra turma não responde
  const outro = await logged('bruno@ejup.com.br', 'senha-bruno-1');
  assert.equal((await outro.call('mensagem', { body: { duvida: d.id, texto: 'intromissão' } })).statusCode, 403);
  assert.equal((await outro.call('prof')).statusCode, 403);
});

test('Minerva do Portal: resposta da formação com fonte, registro e avaliação', async () => {
  const b = await logged('aluno@ejup.com.br', 'senha-aluno-1');
  const r = (await b.call('minerva', { body: { curso: 'licenciamento', pergunta: 'quais as modalidades de licenciamento?' } })).payload;
  assert.equal(r.id, 'lic-modalidades');
  assert.deepEqual(r.fonte, { aula: 'lic-m2-a3', segundo: 710 });
  assert.ok(r.log);
  assert.equal((await b.call('minerva-fb', { body: { log: r.log, ajudou: false } })).statusCode, 200);
  assert.equal(fake.db.minerva_log.find((l) => l.id === r.log).ajudou, false);
  const s = (await b.call('minerva', { body: { curso: 'licenciamento', pergunta: 'qual a capital da França?' } })).payload;
  assert.equal(s.semResposta, true);
  assert.equal((await b.call('minerva', { body: { curso: 'equipes', pergunta: 'oi' } })).statusCode, 403);
});

test('professor revisa a Minerva, agenda plantão e mentoria', async () => {
  const p = await logged('professor@ejup.com.br', 'senha-prof-1');
  const prof = (await p.call('prof')).payload;
  const logs = prof.minerva.logs.filter((l) => l.ajudou === false).map((l) => l.id);
  assert.equal(logs.length, 2);
  assert.equal((await p.call('minerva-rev', { body: { curso: 'licenciamento', pergunta: 'prazo de renovação da licença', logs, acao: 'corrigir', texto: 'O pedido de renovação segue o prazo definido na licença.' } })).statusCode, 200);
  assert.ok(fake.db.minerva_log.filter((l) => logs.includes(l.id)).every((l) => l.revisado));
  assert.ok(fake.db.minerva_respostas.some((r) => r.origem === 'professor' && r.curso_id === 'licenciamento'));
  const quando = new Date(Date.now() + 3 * 86400000).toISOString();
  const pl = (await p.call('plantao', { body: { curso: 'licenciamento', inicio: quando, link: 'https://meet.google.com/x' } })).payload.plantao;
  const av = await p.call('avisar', { body: { plantao: pl.id } });
  assert.equal(av.payload.enviados, 2);
  assert.equal(mails.at(-1).to.length, 1, 'um e-mail por aluno');
  // aluno pede mentoria, professor propõe outro horário, aluno aceita
  const a = await logged('aluno@ejup.com.br', 'senha-aluno-1');
  const m = (await a.call('mentoria-pedir', { body: { curso: 'licenciamento', inicio: new Date(Date.now() + 2 * 86400000).toISOString() } })).payload.mentoria;
  await a.call('mentoria-pedir', { body: { curso: 'licenciamento', inicio: new Date(Date.now() + 4 * 86400000).toISOString() } });
  assert.equal((await a.call('mentoria-pedir', { body: { curso: 'licenciamento', inicio: new Date(Date.now() + 6 * 86400000).toISOString() } })).statusCode, 409);
  const pr = (await p.call('mentoria-prof', { body: { id: m.id, acao: 'propor', inicio: new Date(Date.now() + 3 * 86400000).toISOString() } })).payload.mentoria;
  assert.equal(pr.status, 'proposto');
  assert.equal((await a.call('mentoria-aluno', { body: { id: m.id, acao: 'aceitar' } })).payload.mentoria.status, 'confirmado');
  const bruno = await logged('bruno@ejup.com.br', 'senha-bruno-1');
  assert.equal((await bruno.call('mentoria-pedir', { body: { curso: 'licenciamento', inicio: new Date(Date.now() + 2 * 86400000).toISOString() } })).statusCode, 403);
});

test('perfil, preferências, exportar e excluir a conta', async () => {
  const b = await logged('aluno@ejup.com.br', 'senha-aluno-1');
  assert.equal((await b.call('perfil', { body: { nome: 'A' } })).statusCode, 400);
  const p = (await b.call('perfil', { body: { nome: 'Ana Lima Souza', area: 'Advocacia', nome_certificado: 'Ana L. Souza' } })).payload.perfil;
  assert.equal(p.area, 'Advocacia');
  const pr = (await b.call('prefs', { body: { pace: 6, days: [1, 3, 9], mail: true, news: true } })).payload.prefs;
  assert.deepEqual([pr.pace, pr.days, pr.mail], [6, [1, 3], true]);
  assert.ok(fake.db.leads.some((l) => l.email === 'aluno@ejup.com.br'));
  const d = (await b.call('dados')).payload;
  assert.equal(d.perfil.nome, 'Ana Lima Souza');
  assert.equal(d.progresso.length, 6);
  assert.equal((await b.call('excluir', { body: { confirmar: 'sim' } })).statusCode, 400);
  assert.equal((await b.call('excluir', { body: { confirmar: 'EXCLUIR' } })).statusCode, 200);
  assert.equal(fake.users.some((u) => u.email === 'aluno@ejup.com.br'), false);
  assert.equal((await b.call('me')).statusCode, 401);
});

test('recuperar senha não revela conta; link do e-mail vira sessão e troca a senha', async () => {
  const b = browser();
  assert.equal((await b.call('recuperar', { body: { email: 'ninguem@exemplo.com' } })).payload.ok, true);
  assert.equal(fake.sent.at(-1).redirect, 'https://ejup.test/recuperar');
  // simula o link do e-mail: tokens no endereço
  const t = await fake.fetchImpl(`${fake.url}/auth/v1/token?grant_type=password`, { method: 'POST', body: JSON.stringify({ email: 'aluno@ejup.com.br', password: 'senha-aluno-1' }) }).then((r) => r.json());
  assert.equal((await b.call('sessao', { body: { access_token: t.access_token, refresh_token: t.refresh_token } })).statusCode, 200);
  assert.equal((await b.call('nova-senha', { body: { senha: 'nova-senha-123' } })).statusCode, 200);
  assert.equal((await browser().call('entrar', { body: { email: 'aluno@ejup.com.br', senha: 'nova-senha-123' } })).statusCode, 200);
  assert.equal((await browser().call('sessao', { body: { access_token: 'falso', refresh_token: 'falso' } })).statusCode, 401);
});

test('segurança: origem externa, cron sem segredo, rota desconhecida, sem banco', async () => {
  const b = browser();
  assert.equal((await b.call('entrar', { body: { email: 'a@b.com', senha: 'x' }, headers: { origin: 'https://outro.site' } })).statusCode, 403);
  assert.equal((await b.call('cron')).statusCode, 401);
  const c = await b.call('cron', { headers: { authorization: 'Bearer cron' } });
  assert.equal(c.statusCode, 200);
  assert.equal((await b.call('nada')).statusCode, 404);
  const sem = createPortalHandler({ env: {} });
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c2) { this.statusCode = c2; return this; }, json(p) { this.payload = p; return this; } };
  await sem({ method: 'GET', url: '/api/portal?r=me', headers: { host: 'x' } }, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(parseCookies('a=1; b=x%20y'), { a: '1', b: 'x y' });
});

test('vídeo: YouTube, Vimeo, Panda, arquivo e Storage', () => {
  assert.equal(parseVideo('https://youtu.be/abc123').url, 'https://www.youtube-nocookie.com/embed/abc123?rel=0&modestbranding=1');
  assert.equal(parseVideo('https://www.youtube.com/watch?v=xyz&t=10').url.includes('/embed/xyz?'), true);
  assert.equal(parseVideo('https://vimeo.com/123456/abcdef').url, 'https://player.vimeo.com/video/123456?h=abcdef');
  assert.equal(parseVideo('https://player-vz-1.tv.pandavideo.com.br/embed/?v=uuid').provedor, 'panda');
  assert.equal(parseVideo('https://cdn.x.com/a.mp4').tipo, 'arquivo');
  assert.deepEqual(parseVideo('licenciamento/m1a1.mp4'), { tipo: 'storage', path: 'licenciamento/m1a1.mp4' });
  assert.equal(parseVideo(''), null);
});

test('equipe: libera alunos em lote, edita formação, aula e banco da Minerva', async () => {
  const a = await logged('aluno@ejup.com.br', 'senha-aluno-1');
  assert.equal((await a.call('equipe')).statusCode, 403);
  assert.equal((await a.call('eq-matricula', { body: { email: 'x@y.com', curso: 'licenciamento' } })).statusCode, 403);
  const e = await logged('equipe@ejup.com.br', 'senha-equipe-1');
  const d = (await e.call('equipe')).payload;
  assert.equal(d.cursos.length, 2);
  assert.ok(d.matriculas.some((m) => m.email === 'aluno@ejup.com.br' && m.nome === 'Ana Lima'));
  const r = await e.call('eq-matricula', { body: { email: 'Nova@Exemplo.com\nbruno@ejup.com.br', curso: 'pareceres', plano: 'acompanhado' } });
  assert.equal(r.statusCode, 200);
  assert.equal(r.payload.matriculas.length, 2);
  assert.ok(fake.db.matriculas.some((m) => m.email === 'nova@exemplo.com' && m.plano === 'acompanhado'));
  assert.equal((await e.call('eq-matricula', { body: { email: 'não é email', curso: 'pareceres' } })).statusCode, 400);
  const id = fake.db.matriculas.find((m) => m.email === 'nova@exemplo.com').id;
  assert.equal((await e.call('eq-matricula', { body: { id, ativa: false } })).payload.matricula.ativa, false);
  const c = (await e.call('eq-curso', { body: { id: 'Power Skills', titulo: 'Negociação para juristas', horas: 6, professor_emails: 'prof2@ejup.com.br' } })).payload.curso;
  assert.equal(c.id, 'power-skills');
  const m = (await e.call('eq-modulo', { body: { curso: 'power-skills', titulo: 'Fundamentos', ordem: 1 } })).payload.modulo;
  const au = await e.call('eq-aula', { body: { modulo: m.id, titulo: 'Abertura', duracao_min: 30, video: 'https://youtu.be/abc', topicos: 'Um\nDois', materiais: [{ nome: 'Ruim', url: 'javascript:alert(1)' }, { nome: 'Bom', url: 'https://x.com/a.pdf' }] } });
  assert.deepEqual(au.payload.aula.topicos, ['Um', 'Dois']);
  assert.deepEqual(au.payload.aula.materiais.map((x) => x.nome), ['Bom']);
  assert.equal((await e.call('eq-aula', { body: { modulo: m.id, titulo: 'X', video: 'javascript:alert(1)' } })).statusCode, 400);
  assert.equal((await e.call('eq-modulo', { body: { id: m.id, remover: true } })).statusCode, 409);
  const resp = (await e.call('eq-resposta', { body: { pergunta: 'Tem desconto para grupos?', resposta: 'Sim, fale com a equipe.', variacoes: 'desconto\npreço para grupo', curso_id: 'power-skills', portal: true } })).payload.resposta;
  assert.equal(resp.origem, 'equipe');
  assert.deepEqual(resp.variacoes, ['desconto', 'preço para grupo']);
  // plantão não aceita link javascript:
  const p = await logged('professor@ejup.com.br', 'senha-prof-1');
  const pl = (await p.call('plantao', { body: { curso: 'licenciamento', inicio: new Date(Date.now() + 86400000).toISOString(), link: 'javascript:alert(1)' } })).payload.plantao;
  assert.equal(pl.link, null);
});
