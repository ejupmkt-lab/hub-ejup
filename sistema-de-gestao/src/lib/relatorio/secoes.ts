import type { Etapa, Projeto } from "../dados/tipos";
import { tipoRegistro } from "../registros";
import { MARCA_COMPLETAR } from "./padroes";

// Seções do Relatório Técnico de Nª Entrega, na ordem em que aparecem.
// O padrão vem dos relatórios já entregues (PRD, seção 7.2).
export type DefSecao = {
  chave: string;
  titulo: (e: Etapa) => string;
  obrigatoria: (e: Etapa) => boolean;
  quadro?: "azul"; // renderizada como quadro de destaque, não como seção numerada
  ajuda: string;
};

const n = (e: Etapa) => `${e.ordem}ª`;
const sempre = () => true;

export const secoesAntes: DefSecao[] = [
  {
    chave: "objeto",
    titulo: (e) => `Objeto da ${n(e)} entrega`,
    obrigatoria: sempre,
    ajuda: "Registra a entrega, a etapa, a ficha técnica Sebraetec nº 13070-5 e a finalidade da etapa.",
  },
  {
    chave: "natureza",
    titulo: () => "NATUREZA DA ENTREGA",
    obrigatoria: sempre,
    quadro: "azul",
    ajuda: "O que esta entrega é e o que fica para as etapas seguintes.",
  },
  {
    chave: "escopo",
    titulo: () => "Escopo, metodologia e limitações",
    obrigatoria: sempre,
    ajuda: "Fontes usadas (i)…(vii), objetivos em alíneas, o que NÃO foi verificado e a data-limite das informações.",
  },
  {
    chave: "atividades_realizadas",
    titulo: () => "Atividades realizadas",
    obrigatoria: sempre,
    ajuda: "Uma alínea por atividade realizada.",
  },
  {
    chave: "caracterizacao",
    titulo: (e) =>
      e.ordem === 1 ? "Caracterização da empresa e contexto de tratamento" : "Caracterização organizacional e responsabilidades",
    obrigatoria: sempre,
    ajuda: "Contexto da empresa. Use [[tabela:pessoas]] para inserir a tabela de pessoas e responsabilidades.",
  },
  {
    chave: "diagnostico",
    titulo: () => "Diagnóstico técnico-jurídico",
    obrigatoria: () => false,
    ajuda: "Opcional. Processos, papéis de controlador/operador, riscos. Use [[tabela:processos]] ou [[tabela:riscos]].",
  },
];

export const secoesDepois: DefSecao[] = [
  {
    chave: "medidas",
    titulo: (e) => (e.ordem === 1 ? "Medidas imediatas recomendadas" : "Plano de ação"),
    obrigatoria: sempre,
    ajuda: "Medidas com responsável, evidência e prazo. Use [[tabela:acoes]].",
  },
  {
    chave: "encaminhamentos",
    titulo: (e) => `Encaminhamentos para a Etapa ${String(e.ordem + 1).padStart(2, "0")}`,
    obrigatoria: (e) => e.ordem < 5,
    ajuda: "Alíneas com o que a próxima etapa deve fazer.",
  },
  {
    chave: "conclusao",
    titulo: (e) => `Conclusão da ${n(e)} entrega`,
    obrigatoria: sempre,
    ajuda: "Fecha com \"considera-se cumprida…\" e lista o que foi entregue.",
  },
  {
    chave: "evidencias",
    titulo: () => "Evidências de levantamento e validação",
    obrigatoria: sempre,
    ajuda: "Um parágrafo de abertura. As imagens (prints, fotos de reunião) são enviadas logo abaixo e viram Figura 1, Figura 2…",
  },
];

export const todasSecoes = [...secoesAntes, ...secoesDepois];

export type Pendencia = { onde: string; texto: string };

// Relatório feito fora do sistema: importado como pronto, ou com o PDF assinado
// anexado sem nada escrito nas seções. O PDF assinado é o relatório da etapa.
export function relatorioFeitoFora(etapa: Etapa) {
  return !!etapa.relatorioExterno || (!!etapa.relatorioAssinado && !Object.values(etapa.secoes ?? {}).some((t) => t.trim()));
}

// Checagem que impede marcar a etapa como "A enviar" com algo faltando.
export function verificarCompletude(projeto: Projeto, etapa: Etapa): Pendencia[] {
  const p: Pendencia[] = [];
  if (relatorioFeitoFora(etapa)) {
    if (!etapa.relatorioAssinado) p.push({ onde: "Relatório", texto: "PDF assinado do relatório importado não anexado" });
    return p;
  }
  for (const s of todasSecoes) {
    if (s.obrigatoria(etapa) && !(etapa.secoes[s.chave] ?? "").trim()) {
      p.push({ onde: "Relatório", texto: `Seção em branco: ${s.titulo(etapa)}` });
    }
  }
  etapa.entregaveis.forEach((ent, i) => {
    if (ent.tipo === "entregavel" && !ent.conteudo.trim()) {
      p.push({ onde: "Entregáveis", texto: `Entregável ${i + 1} sem conteúdo: ${ent.titulo}` });
    }
  });
  for (const s of todasSecoes) {
    if (MARCA_COMPLETAR.test(etapa.secoes[s.chave] ?? "")) p.push({ onde: "Relatório", texto: `Trecho a completar em: ${s.titulo(etapa)}` });
  }
  etapa.entregaveis.forEach((ent) => {
    if (MARCA_COMPLETAR.test(ent.conteudo)) p.push({ onde: "Entregáveis", texto: `Trecho a completar em: ${ent.titulo}` });
  });
  const textos = [...Object.values(etapa.secoes), ...etapa.entregaveis.map((e) => e.conteudo)].join("\n");
  for (const m of textos.matchAll(/\[\[tabela:([a-z_]+)\]\]/g)) {
    const t = tipoRegistro(m[1]);
    if (!t) p.push({ onde: "Relatório", texto: `Marcador [[tabela:${m[1]}]] não corresponde a nenhum registro` });
    else if (!projeto.registros.some((r) => r.tipo === m[1]))
      p.push({ onde: "Registros", texto: `A tabela "${t.nome}" é citada mas não tem linhas` });
  }
  if (!(etapa.evidencias ?? []).length) p.push({ onde: "Evidências", texto: "Nenhuma imagem de evidência (prints, fotos de reunião)" });
  (etapa.evidencias ?? []).forEach((ev, i) => {
    if (!ev.legenda.trim()) p.push({ onde: "Evidências", texto: `Figura ${i + 1} sem legenda` });
  });
  if (projeto.referencias.length === 0) p.push({ onde: "Referências", texto: "Nenhuma referência normativa cadastrada" });
  projeto.referencias.forEach((r, i) => {
    if (r.url && !r.consultadoEm) p.push({ onde: "Referências", texto: `Referência [${i + 1}] sem data de consulta` });
  });
  if (!etapa.dataRelatorio) p.push({ onde: "Fechamento", texto: "Data do relatório (local e data) não informada" });
  const pendentes = etapa.atividades.filter((a) => a.status === "pendente").length;
  if (pendentes) p.push({ onde: "Checklist", texto: pendentes === 1 ? "1 atividade da ficha ainda pendente" : `${pendentes} atividades da ficha ainda pendentes` });
  etapa.atividades
    .filter((a) => a.status === "nao_aplicavel" && !a.justificativa.trim())
    .forEach((a) => p.push({ onde: "Checklist", texto: `Atividade ${a.codigo} marcada como não aplicável sem justificativa` }));
  return p;
}
