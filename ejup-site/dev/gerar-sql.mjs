// Gera dev/minerva_respostas.sql: cria a tabela da Minerva no Supabase e carrega as respostas de api/_lib/respostas.js.
// Uso: node dev/gerar-sql.mjs   → depois cole o conteúdo do arquivo no SQL Editor do Supabase.
import fs from 'node:fs';
import R from '../api/_lib/respostas.js';
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const arr = (a) => 'array[' + (a || []).map(q).join(', ') + ']::text[]';
const sql = `-- Banco de respostas da Minerva. Edite as linhas pelo Table Editor do Supabase.
create table if not exists public.minerva_respostas (
  id text primary key,
  pergunta text not null,
  variacoes text[] not null default '{}',
  palavras text[] not null default '{}',
  resposta text not null,
  ativo boolean not null default true,
  ordem int not null default 0,
  atualizado_em timestamptz not null default now()
);
alter table public.minerva_respostas enable row level security; -- sem políticas: só o servidor do site lê

insert into public.minerva_respostas (id, pergunta, variacoes, palavras, resposta, ordem) values
${R.map((r, i) => `  (${q(r.id)}, ${q(r.pergunta)}, ${arr(r.variacoes)}, ${arr(r.palavras)}, ${q(r.resposta)}, ${(i + 1) * 10})`).join(',\n')}
on conflict (id) do update set pergunta = excluded.pergunta, variacoes = excluded.variacoes,
  palavras = excluded.palavras, resposta = excluded.resposta, ordem = excluded.ordem, atualizado_em = now();
`;
fs.writeFileSync(new URL('./minerva_respostas.sql', import.meta.url), sql);
console.log('dev/minerva_respostas.sql:', R.length, 'respostas');
