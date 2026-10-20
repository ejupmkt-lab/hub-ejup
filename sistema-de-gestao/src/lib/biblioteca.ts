import type { Cliente, Etapa, Projeto } from "./dados/tipos";
import { todasSecoes } from "./relatorio/secoes";
import { MARCA_COMPLETAR } from "./relatorio/padroes";

// Biblioteca de textos aprovados: o que entra é anonimizado (dados do cliente
// viram marcadores) e, ao usar, os marcadores recebem os dados do novo cliente.

export type TextoBiblioteca = {
  id: string;
  empresa: string;
  etapa: number;
  chave: string;
  titulo: string;
  texto: string;
  ramo: string;
  porte: string;
  origem: "aprovado" | "manual";
  projeto_origem: string | null;
  servico_id: string | null; // cada serviço tem a sua biblioteca
  created_at: string;
};

export const chaveEntregavel = (titulo: string) => `entregavel:${titulo}`;

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const meses = "janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro";

// Troca por marcadores tudo o que identifica o cliente de origem
export function anonimizar(texto: string, cliente: Partial<Cliente>, participantes: string[] = []) {
  const trocas: [string | undefined, string][] = [
    [cliente.razaoSocial, "{{empresa}}"],
    [cliente.nomeFantasia, "{{nome_fantasia}}"],
    [cliente.cnpj, "{{cnpj}}"],
    [cliente.responsavel, "{{responsavel}}"],
    [cliente.email, "{{email}}"],
    [cliente.telefone, "{{telefone}}"],
    [cliente.site, "{{site}}"],
    [cliente.endereco, "{{endereco}}"],
    [cliente.cidadeUf, "{{cidade}}"],
  ];
  // Nomes de quem participou das visitas (antes do cargo entre parênteses)
  for (const p of participantes) trocas.push([p, "{{pessoa}}"]);
  // Primeiro nome do responsável sozinho também identifica
  const primeiro = cliente.responsavel?.trim().split(/\s+/)[0];
  if (primeiro && primeiro.length > 2) trocas.push([primeiro, "{{responsavel}}"]);

  let t = texto;
  // Os mais longos primeiro, para "Centro de Treinamento Ltda" sair antes de "Centro"
  for (const [valor, marca] of trocas.filter(([v]) => v && v.trim().length > 2).sort((a, b) => b[0]!.length - a[0]!.length))
    t = t.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapar(valor!.trim())}(?![\\p{L}\\p{N}])`, "giu"), marca);
  // Datas do projeto de origem não servem para outro
  t = t.replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, "{{data}}");
  t = t.replace(new RegExp(`\\b\\d{1,2}º? de (${meses}) de \\d{4}\\b`, "gi"), "{{data}}");
  return t;
}

export function nomesDosParticipantes(p: Projeto) {
  return (p.atividadesRegistradas ?? [])
    .flatMap((r) => r.participantes.split(/[,;]| e /))
    .map((x) => x.replace(/\(.*?\)/g, "").trim())
    .filter((x) => x.length > 2);
}

// Marcadores → dados do novo cliente (o que não existir vira [completar])
export function preencherMarcadores(texto: string, cliente: Partial<Cliente>) {
  const valores: Record<string, string | undefined> = {
    empresa: cliente.razaoSocial,
    nome_fantasia: cliente.nomeFantasia || cliente.razaoSocial,
    cnpj: cliente.cnpj,
    responsavel: cliente.responsavel,
    email: cliente.email,
    telefone: cliente.telefone,
    site: cliente.site,
    endereco: cliente.endereco,
    cidade: cliente.cidadeUf,
  };
  return texto.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    if (k === "data") return "[completar: data]";
    if (k === "pessoa") return "[completar: nome e cargo]";
    return valores[k]?.trim() || `[completar: ${k.replace("_", " ")}]`;
  });
}

// O que de uma etapa aprovada vai para a biblioteca: seções e entregáveis
// preenchidos e sem marcas de [completar]
export function textosParaBiblioteca(p: Projeto, e: Etapa, cliente: Partial<Cliente>) {
  const participantes = nomesDosParticipantes(p);
  const linhas: Omit<TextoBiblioteca, "id" | "created_at">[] = [];
  const base = { empresa: p.empresa, etapa: e.ordem, ramo: cliente.ramo ?? "", porte: cliente.porte ?? "", origem: "aprovado" as const, projeto_origem: p.id, servico_id: p.modeloId };
  for (const d of todasSecoes) {
    const t = (e.secoes[d.chave] ?? "").trim();
    if (t && !MARCA_COMPLETAR.test(t)) linhas.push({ ...base, chave: d.chave, titulo: d.titulo(e), texto: anonimizar(t, cliente, participantes) });
  }
  for (const ent of e.entregaveis) {
    const t = ent.conteudo.trim();
    if (t && !MARCA_COMPLETAR.test(t)) linhas.push({ ...base, chave: chaveEntregavel(ent.titulo), titulo: ent.titulo, texto: anonimizar(t, cliente, participantes) });
  }
  return linhas;
}

// Mais parecidos primeiro: mesmo ramo, mesmo porte, mais recentes
export function ordenarSugestoes(lista: TextoBiblioteca[], cliente: Partial<Cliente> | undefined, projetoAtual: string) {
  const palavras = (s: string) => new Set(s.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length > 3));
  const ramo = palavras(cliente?.ramo ?? "");
  const pontos = (t: TextoBiblioteca) => {
    const r = palavras(t.ramo);
    const comuns = [...ramo].filter((w) => r.has(w)).length;
    return comuns * 3 + (t.porte && t.porte === cliente?.porte ? 1 : 0);
  };
  return lista
    .filter((t) => t.projeto_origem !== projetoAtual)
    .sort((a, b) => pontos(b) - pontos(a) || b.created_at.localeCompare(a.created_at));
}
