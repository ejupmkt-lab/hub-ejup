import type { Cliente, Diagnostico, Projeto } from "./dados/tipos";

// Diagnóstico do projeto (fase 2 do HUB), no modelo do SEBRAE: Contextualização / Anamnese, Investigação / Análise documental,
// Parecer técnico e Evidências. O formato antigo (um texto só, em "texto") é lido como a Contextualização.

export const secoesDoModelo = [
  { chave: "anamnese", numero: 1, titulo: "Contextualização / Anamnese" },
  { chave: "analise", numero: 2, titulo: "Investigação/Análise documental" },
  { chave: "parecer", numero: 3, titulo: "Parecer técnico – Diagnóstico" },
] as const;
export type ChaveDeSecao = (typeof secoesDoModelo)[number]["chave"];

export const diagnosticoVazio = (): Diagnostico => ({ anamnese: "", analise: "", parecer: "", evidencias: [], atualizadoEm: null, arquivo: null });

export function lerDiagnostico(p: Pick<Projeto, "diagnostico">): Diagnostico {
  const d = p.diagnostico;
  if (!d) return diagnosticoVazio();
  return { ...diagnosticoVazio(), ...d, anamnese: d.anamnese ?? d.texto ?? "", analise: d.analise ?? "", parecer: d.parecer ?? "", evidencias: d.evidencias ?? [] };
}

export const temTextoNoDiagnostico = (d: Diagnostico) => secoesDoModelo.some((s) => (d[s.chave] ?? "").trim());

// Quantos campos de texto ainda faltam (as três seções do modelo)
export const secoesEmBranco = (d: Diagnostico) => secoesDoModelo.filter((s) => !(d[s.chave] ?? "").trim());

const numero = (t: string) => {
  const m = (t ?? "").match(/\d+/);
  return m ? Number(m[0]) : null;
};

// Total de empregados: gestão + operacionais, quando os dois são números (senão, vazio)
export function totalDeEmpregados(c: Pick<Cliente, "empregadosGestao" | "empregadosOperacionais">) {
  const a = numero(c.empregadosGestao);
  const b = numero(c.empregadosOperacionais);
  return a !== null && b !== null ? String(a + b) : "";
}

// O que o diagnóstico ainda precisa, para a IA saber o que perguntar antes de escrever (e para a tela dizer o que falta)
export function faltasDoDiagnostico(p: Projeto, c: Partial<Cliente>): string[] {
  const d = lerDiagnostico(p);
  const faltas: string[] = [];
  const cadastro: [keyof Cliente, string][] = [
    ["razaoSocial", "razão social"], ["cnpj", "CNPJ"], ["endereco", "endereço"], ["cep", "CEP"], ["cidadeUf", "cidade e estado"], ["email", "e-mail"],
    ["telefone", "telefone"], ["responsavel", "responsável"], ["cargoResponsavel", "cargo do responsável"], ["porte", "porte"], ["tempoAtividade", "tempo de atividade"],
    ["ramo", "ramo"], ["produtosServicos", "produtos e serviços"], ["empregadosGestao", "empregados da gestão"], ["empregadosOperacionais", "empregados operacionais"],
  ];
  const semCadastro = cadastro.filter(([k]) => !String(c[k] ?? "").trim()).map(([, nome]) => nome);
  if (semCadastro.length) faltas.push(`dados do cliente no cadastro: ${semCadastro.join(", ")}`);
  if (!(p.codigoSolicitacaoHub || p.numeroProjetoHub).trim()) faltas.push("código da solicitação no HUB");
  for (const s of secoesEmBranco(d)) faltas.push(`texto: ${s.titulo}`);
  if (!d.evidencias.length) faltas.push("evidência da reunião de diagnóstico (foto ou print)");
  return faltas;
}
