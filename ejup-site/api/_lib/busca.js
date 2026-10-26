// Busca da Minerva: encontra a pergunta cadastrada mais parecida com a do visitante.
// Sem IA: compara palavras (sem acentos, sem palavras vazias, com plural simplificado).

const STOP = new Set(('a o os as um uma uns umas de da do das dos em na no nas nos por para pra pro com sem e ou que qual quais ' +
  'como onde quando se me te lhe eu voce voces vc vcs ele ela eles elas meu minha seu sua isso isto esse essa este esta ' +
  'ao aos ser sao esta estao tem ter tenho ha ja nao sim mais muito muita tambem so sobre ai la aqui ate entre pelo pela ' +
  'gostaria queria quero saber poderia pode posso favor obrigado obrigada').split(' '));

export function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function stem(w) {
  if (w.length <= 3) return w;
  return w.replace(/coes$/, 'cao').replace(/oes$/, 'ao').replace(/ais$/, 'al').replace(/eis$/, 'el').replace(/(?<=..)s$/, '');
}

export function tokens(s) {
  return [...new Set(normalize(s).split(' ').filter((w) => w && !STOP.has(w)).map(stem))];
}

// iguais, ou com o mesmo começo (pega variações como matrícula/matriculo, inscrever/inscrição)
function same(a, b) {
  if (a === b) return true;
  const min = Math.min(a.length, b.length);
  if (min < 5) return false;
  let i = 0;
  while (i < min && a[i] === b[i]) i++;
  return i >= Math.max(5, min - 2);
}

function overlap(q, t) {
  if (!q.length || !t.length) return 0;
  let hit = 0;
  for (const w of q) if (t.some((x) => same(w, x))) hit++;
  return hit / Math.sqrt(q.length * t.length);
}

export function score(question, item) {
  const q = tokens(question);
  const nq = normalize(question);
  let best = 0;
  for (const text of [item.pergunta, ...(item.variacoes || [])]) {
    if (normalize(text) === nq) return 2;
    best = Math.max(best, overlap(q, tokens(text)));
  }
  const keys = (item.palavras || []).map((k) => stem(normalize(k)));
  const keyHits = keys.filter((k) => q.some((w) => same(w, k))).length;
  return best + Math.min(0.7, keyHits * 0.35);
}

export const LIMIAR = 0.5;

export function buscar(question, items) {
  const ranked = items
    .map((item) => ({ item, s: score(question, item) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);
  const top = ranked[0];
  if (top && top.s >= LIMIAR) return { item: top.item, score: top.s, sugestoes: [] };
  // nada parecido: sugere as perguntas mais próximas ou, sem nenhuma, as principais
  const perto = ranked.slice(0, 3).map((r) => r.item);
  const base = perto.length ? perto : ['ejup', 'formacoes', 'contato'].map((id) => items.find((i) => i.id === id)).filter(Boolean);
  return { item: null, score: top ? top.s : 0, sugestoes: (base.length ? base : items.slice(0, 3)).map((i) => i.pergunta) };
}
