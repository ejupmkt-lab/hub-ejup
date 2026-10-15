import type { Etapa, Projeto } from "./dados/tipos";
import { doisDigitos, type Tom } from "./rotulos";
import { etapaAtual, progressoAtividades } from "./projeto";
import { verificarCompletude } from "./relatorio/secoes";

// O que fazer agora, em uma frase e um botão. Usado no painel, na lista de
// projetos, no projeto e na etapa, para ninguém precisar adivinhar o caminho.

export type AbaEtapa = "Checklist" | "Redação do relatório" | "Entregáveis" | "Fechamento";
export const ancoraAba: Record<AbaEtapa, string> = {
  Checklist: "checklist",
  "Redação do relatório": "redacao",
  Entregáveis: "entregaveis",
  Fechamento: "fechamento",
};

export type Passo = {
  texto: string;
  detalhe?: string;
  rotulo: string;
  tom: Tom;
  href: string;
  aba?: AbaEtapa; // na própria etapa: aba a abrir
  acao?: "enviada" | "aprovada"; // na própria etapa: muda o status direto
};

export const abaDaPendencia: Record<string, AbaEtapa> = {
  Relatório: "Redação do relatório",
  Evidências: "Redação do relatório",
  Entregáveis: "Entregáveis",
  Checklist: "Checklist",
};

export function passoDaEtapa(p: Projeto, e: Etapa): Passo | null {
  const base = `/${p.empresa}/projetos/${p.id}`;
  const daEtapa = (aba: AbaEtapa) => `${base}/etapas/${e.ordem}#${ancoraAba[aba]}`;
  if (!p.planoFechadoEm)
    return {
      texto: "Defina as datas do plano de trabalho",
      detalhe: "Sem o plano, as etapas não têm prazo nem avisos.",
      rotulo: "Abrir o plano de trabalho",
      tom: "atencao",
      href: `${base}#plano`,
    };
  if (e.status === "aprovada") return null;
  if (e.status === "devolvida")
    return {
      texto: "O SEBRAE devolveu esta entrega para ajuste",
      detalhe: "Ajuste o relatório, gere de novo e reenvie no HUB.",
      rotulo: "Revisar o relatório",
      tom: "critico",
      href: daEtapa("Redação do relatório"),
      aba: "Redação do relatório",
    };
  if (e.status === "enviada")
    return {
      texto: "Enviada no HUB, aguardando o SEBRAE",
      detalhe: "Quando o SEBRAE responder, registre aqui.",
      rotulo: "Marcar como aprovada",
      tom: "ok",
      href: daEtapa("Fechamento"),
      acao: "aprovada",
    };
  if (e.status === "a_enviar")
    return {
      texto: "Envie o relatório assinado no HUB SEBRAE",
      detalhe: "Depois de enviar, marque aqui para a próxima etapa começar.",
      rotulo: "Marcar como enviada",
      tom: "atencao",
      href: daEtapa("Fechamento"),
      acao: "enviada",
    };

  const prog = progressoAtividades(e);
  if (prog.feitas < prog.total)
    return {
      texto: "Marque as atividades do checklist",
      detalhe: `${prog.feitas} de ${prog.total} já marcadas.`,
      rotulo: "Abrir o checklist",
      tom: "andamento",
      href: daEtapa("Checklist"),
      aba: "Checklist",
    };

  const pendencias = verificarCompletude(p, e);
  if (pendencias.length) {
    const aba = abaDaPendencia[pendencias[0].onde] ?? "Fechamento";
    return {
      texto: aba === "Entregáveis" ? "Escreva os entregáveis da etapa" : aba === "Fechamento" ? "Resolva as pendências do relatório" : "Escreva o relatório da etapa",
      detalhe: pendencias.length === 1 ? "Falta 1 item para o relatório ficar completo." : `Faltam ${pendencias.length} itens para o relatório ficar completo.`,
      rotulo: aba === "Entregáveis" ? "Abrir os entregáveis" : aba === "Fechamento" ? "Ver as pendências" : "Abrir a redação",
      tom: "andamento",
      href: daEtapa(aba),
      aba,
    };
  }

  return {
    texto: "Baixe o relatório, assine no gov.br e anexe o PDF",
    detalhe: "O relatório está completo. Com o PDF assinado, a etapa fica pronta para envio.",
    rotulo: "Ir para o fechamento",
    tom: "atencao",
    href: daEtapa("Fechamento"),
    aba: "Fechamento",
  };
}

export function passoDoProjeto(p: Projeto): (Passo & { etapa?: Etapa }) | null {
  if (p.status === "encerrado") return null;
  const base = `/${p.empresa}/projetos/${p.id}`;
  if (p.status === "aguardando_plano" || !p.planoFechadoEm) return passoDaEtapa(p, p.etapas[0]);
  // Devolução tem prioridade sobre a etapa em curso
  const devolvida = p.etapas.find((e) => e.status === "devolvida");
  const et = devolvida ?? etapaAtual(p);
  if (!et)
    return {
      texto: "Todas as entregas foram enviadas",
      detalhe: "Encerre o projeto quando o SEBRAE aprovar a última.",
      rotulo: "Abrir o projeto",
      tom: "ok",
      href: base,
    };
  const passo = passoDaEtapa(p, et);
  if (!passo) return null;
  return { ...passo, texto: `Etapa ${doisDigitos(et.ordem)}: ${passo.texto.charAt(0).toLowerCase()}${passo.texto.slice(1)}`, etapa: et };
}
