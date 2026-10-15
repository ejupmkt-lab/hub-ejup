// Tom: neutro (não começou), andamento, atencao (pronta para envio),
// ok (concluída do nosso lado) e critico (devolvida).
export type Tom = "neutro" | "andamento" | "atencao" | "ok" | "critico";

export const statusEtapa = {
  nao_iniciada: { rotulo: "Não iniciada", curto: "Não iniciada", tom: "neutro" },
  em_levantamento: { rotulo: "Em levantamento", curto: "Levantamento", tom: "andamento" },
  em_redacao: { rotulo: "Em redação", curto: "Redação", tom: "andamento" },
  em_revisao: { rotulo: "Em revisão", curto: "Revisão", tom: "andamento" },
  aguardando_assinaturas: { rotulo: "Aguardando assinaturas", curto: "Assinaturas", tom: "andamento" },
  a_enviar: { rotulo: "Pronta para enviar", curto: "Pronta", tom: "atencao" },
  enviada: { rotulo: "Enviada no HUB", curto: "Enviada", tom: "ok" },
  aprovada: { rotulo: "Aprovada", curto: "Aprovada", tom: "ok" },
  devolvida: { rotulo: "Devolvida para ajuste", curto: "Devolvida", tom: "critico" },
} as const satisfies Record<string, { rotulo: string; curto: string; tom: Tom }>;

export type StatusEtapa = keyof typeof statusEtapa;
export const ordemStatusEtapa = Object.keys(statusEtapa) as StatusEtapa[];

export const statusProjeto = {
  aguardando_plano: "Aguardando plano de trabalho",
  em_andamento: "Em andamento",
  encerrado: "Encerrado",
} as const;

export const statusEmpresa = {
  ativo: "Ativo",
  em_estruturacao: "Em estruturação",
  standby: "Standby",
} as const;

export const papelMembro = {
  gestor: "Gestor",
  consultor: "Consultor",
  equipe: "Equipe",
} as const;

export const ordinalFeminino = ["", "PRIMEIRA", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA", "SEXTA", "SÉTIMA", "OITAVA", "NONA", "DÉCIMA"];

export function doisDigitos(n: number) {
  return String(n).padStart(2, "0");
}
