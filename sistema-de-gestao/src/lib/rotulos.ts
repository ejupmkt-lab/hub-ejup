export const statusEtapa = {
  nao_iniciada: { rotulo: "Não iniciada", cor: "cinza" },
  em_levantamento: { rotulo: "Em levantamento", cor: "azul" },
  em_redacao: { rotulo: "Em redação", cor: "azul" },
  em_revisao: { rotulo: "Em revisão", cor: "azul" },
  aguardando_assinaturas: { rotulo: "Aguardando assinaturas", cor: "azul" },
  a_enviar: { rotulo: "A enviar", cor: "ambar" },
  enviada: { rotulo: "Enviada no HUB", cor: "verde" },
  aprovada: { rotulo: "Aprovada", cor: "verde" },
  devolvida: { rotulo: "Devolvida para ajuste", cor: "vermelho" },
} as const;

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
