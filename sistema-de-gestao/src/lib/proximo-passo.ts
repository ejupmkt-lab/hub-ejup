import type { Etapa, Projeto } from "./dados/tipos";
import { dataCurta } from "./datas";
import { doisDigitos, type StatusEtapa, type Tom } from "./rotulos";
import { etapaAtual, progressoAtividades } from "./projeto";
import { assinada } from "./regras-etapa";
import { faseDoProjeto } from "./fase";
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

// Abas do projeto que podem ser abertas pelo endereço (#plano, #desenvolvimento…)
export const ancoraAbaProjeto = {
  desenvolvimento: "Desenvolvimento",
  conversa: "Desenvolvimento",
  registrar: "Desenvolvimento",
  cronograma: "Plano de trabalho",
  plano: "Plano de trabalho",
  entregas: "Entregas",
  relatorios: "Entregas",
  ficha: "Ficha do projeto",
  registros: "Tabelas do relatório",
  referencias: "Referências",
  visitas: "Horas e visitas",
  historico: "Histórico",
} as const;

export type Passo = {
  texto: string;
  detalhe?: string;
  rotulo: string;
  tom: Tom;
  href: string;
  aba?: AbaEtapa; // na própria etapa: aba a abrir
  acao?: StatusEtapa; // na própria etapa: muda o status direto
  encerrar?: boolean; // no projeto: encerra (com confirmação)
};

// Onde cada tipo de pendência se resolve: aba da etapa ou aba do projeto
export const abaDaPendencia: Record<string, AbaEtapa> = {
  Relatório: "Redação do relatório",
  Evidências: "Redação do relatório",
  Entregáveis: "Entregáveis",
  Checklist: "Checklist",
};
export const ancoraProjetoDaPendencia: Record<string, keyof typeof ancoraAbaProjeto> = {
  Referências: "referencias",
  Registros: "registros",
};

export function passoDaEtapa(p: Projeto, e: Etapa): Passo | null {
  const base = `/${p.empresa}/projetos/${p.id}`;
  const daEtapa = (aba: AbaEtapa) => `${base}/etapas/${e.ordem}#${ancoraAba[aba]}`;
  if (p.status === "encerrado") return null;
  if (!p.planoFechadoEm)
    return {
      texto: "Defina o plano de trabalho do projeto",
      detalhe: "Diga à IA quando o projeto começa e termina; sem ele, as etapas não têm prazo nem avisos.",
      rotulo: "Definir o plano de trabalho",
      tom: "atencao",
      href: `${base}#desenvolvimento`,
    };
  if (e.status === "aprovada") return null;
  if (e.status === "devolvida")
    return {
      texto: "O SEBRAE devolveu esta entrega para ajuste",
      detalhe: "Volte para a redação, ajuste o relatório, assine de novo e reenvie no HUB.",
      rotulo: "Voltar para redação",
      tom: "critico",
      href: daEtapa("Redação do relatório"),
      aba: "Redação do relatório",
      acao: "em_redacao",
    };
  if (e.status === "enviada")
    return {
      texto: "Enviada no HUB, aguardando o SEBRAE",
      detalhe: "Quando o SEBRAE aprovar, registre aqui. Se devolver, use o aviso abaixo da sequência.",
      rotulo: "Marcar como aprovada",
      tom: "ok",
      href: daEtapa("Fechamento"),
      acao: "aprovada",
    };

  // Etapa futura, ainda não começada, enquanto outra está em curso
  const atual = etapaAtual(p);
  if (atual && atual.ordem < e.ordem && e.status === "nao_iniciada" && progressoAtividades(e).feitas === 0)
    return {
      texto: `Esta etapa começa em ${dataCurta(e.dataInicio)}`,
      detalhe: `A etapa em curso é a ${doisDigitos(atual.ordem)}. Dá para adiantar o checklist e a redação desta, se quiser.`,
      rotulo: `Ir para a etapa ${doisDigitos(atual.ordem)}`,
      tom: "neutro",
      href: `${base}/etapas/${atual.ordem}`,
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
    const primeira = pendencias[0].onde;
    const qtd = pendencias.length === 1 ? "Falta 1 item para o relatório ficar completo." : `Faltam ${pendencias.length} itens para o relatório ficar completo.`;
    const ancoraProjeto = ancoraProjetoDaPendencia[primeira];
    if (ancoraProjeto)
      return {
        texto: primeira === "Referências" ? "Complete as referências do projeto" : "Preencha os registros do programa",
        detalhe: `${pendencias[0].texto}. ${qtd}`,
        rotulo: primeira === "Referências" ? "Abrir as referências" : "Abrir os registros",
        tom: "andamento",
        href: `${base}#${ancoraProjeto}`,
      };
    const aba = abaDaPendencia[primeira] ?? "Fechamento";
    return {
      texto: aba === "Entregáveis" ? "Escreva os entregáveis da etapa" : aba === "Fechamento" ? "Resolva as pendências do relatório" : "Escreva o relatório da etapa",
      detalhe: qtd,
      rotulo: aba === "Entregáveis" ? "Abrir os entregáveis" : aba === "Fechamento" ? "Ver as pendências" : "Abrir a redação",
      tom: "andamento",
      href: daEtapa(aba),
      aba,
    };
  }

  if (!assinada(e))
    return {
      texto: "Baixe o relatório, assine no gov.br e anexe o PDF",
      detalhe: "O relatório está completo. Ao anexar o PDF assinado, as datas de assinatura são preenchidas.",
      rotulo: "Ir para o fechamento",
      tom: "atencao",
      href: daEtapa("Fechamento"),
      aba: "Fechamento",
    };

  if (e.status !== "a_enviar")
    return {
      texto: "Relatório completo e assinado",
      detalhe: "Marque a etapa como pronta para enviar no HUB.",
      rotulo: "Marcar como pronta",
      tom: "atencao",
      href: daEtapa("Fechamento"),
      acao: "a_enviar",
    };

  return {
    texto: "Envie o relatório assinado no HUB SEBRAE",
    detalhe: "Depois de enviar, marque aqui para a próxima etapa começar.",
    rotulo: "Marcar como enviada",
    tom: "atencao",
    href: daEtapa("Fechamento"),
    acao: "enviada",
  };
}

export function passoDoProjeto(p: Projeto): (Passo & { etapa?: Etapa }) | null {
  if (p.status === "encerrado") return null;
  const base = `/${p.empresa}/projetos/${p.id}`;
  // Antes da contratação: diagnóstico, aprovação do gestor e pagamento
  const fase = faseDoProjeto(p);
  if (fase === "diagnostico")
    return {
      texto: "Elabore o diagnóstico e envie no HUB",
      detalhe: "Fase pré-contratual: o diagnóstico segue o modelo do SEBRAE e é assinado só pelo consultor.",
      rotulo: "Abrir o diagnóstico",
      tom: "atencao",
      href: `${base}#desenvolvimento`,
    };
  if (fase === "aguardando_aprovacao")
    return {
      texto: "Aguardando o gestor aprovar o diagnóstico no HUB",
      detalhe: "Quando o gestor liberar a contratação, registre aqui.",
      rotulo: "Registrar a aprovação",
      tom: "neutro",
      href: `${base}#desenvolvimento`,
    };
  if (fase === "aguardando_pagamento")
    return {
      texto: "Aguardando o cliente pagar no HUB",
      detalhe: "Com o pagamento, a consultoria começa: registre aqui e defina o plano de trabalho.",
      rotulo: "Registrar o pagamento",
      tom: "neutro",
      href: `${base}#desenvolvimento`,
    };
  if (p.status === "aguardando_plano" || !p.planoFechadoEm) return passoDaEtapa(p, p.etapas[0]);
  // Devolução tem prioridade sobre a etapa em curso
  const devolvida = p.etapas.find((e) => e.status === "devolvida");
  const et = devolvida ?? etapaAtual(p);
  if (!et) {
    const aguardando = p.etapas.find((e) => e.status === "enviada");
    if (aguardando)
      return {
        texto: "Todas as entregas foram enviadas",
        detalhe: `Falta o SEBRAE aprovar a etapa ${doisDigitos(aguardando.ordem)}. Depois, encerre o projeto.`,
        rotulo: `Abrir a etapa ${doisDigitos(aguardando.ordem)}`,
        tom: "ok",
        href: `${base}/etapas/${aguardando.ordem}`,
        etapa: aguardando,
      };
    return {
      texto: "Todas as entregas foram aprovadas",
      detalhe: "Encerre o projeto para tirá-lo da lista de projetos em andamento.",
      rotulo: "Encerrar projeto",
      tom: "ok",
      href: base,
      encerrar: true,
    };
  }
  const passo = passoDaEtapa(p, et);
  if (!passo) return null;
  return { ...passo, texto: `Etapa ${doisDigitos(et.ordem)}: ${passo.texto.charAt(0).toLowerCase()}${passo.texto.slice(1)}`, etapa: et };
}
