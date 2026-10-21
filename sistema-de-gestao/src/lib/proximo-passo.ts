import type { Etapa, Projeto } from "./dados/tipos";
import { dataCurta } from "./datas";
import { doisDigitos, type StatusEtapa, type Tom } from "./rotulos";
import { etapaAtual, progressoAtividades } from "./projeto";
import { assinada } from "./regras-etapa";
import { avisoFinalizarAntecipado, passoHubDoProjeto } from "./fase";
import type { PassoHub } from "./dados/tipos";
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
  hub?: PassoHub; // no projeto: registra o próximo passo do HUB (com a data de hoje)
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
      texto: "Enviada no Plano de Entrega do HUB",
      detalhe: "O gestor analisa as entregas depois que o projeto é finalizado e o cliente avalia. Se ele devolver, registre aqui.",
      rotulo: "Abrir o projeto",
      tom: "ok",
      href: base,
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
  // A régua do HUB: antes e depois da execução, o passo é o do HUB
  const hub = passoHubDoProjeto(p);
  const desenvolvimento = `${base}#desenvolvimento`;
  if (hub === "solicitacao")
    return {
      texto: "Aguardando o gestor do SEBRAE enviar a demanda",
      detalhe: "O cliente pediu no HUB e o gestor analisa se é viável.",
      rotulo: "O gestor me enviou",
      tom: "neutro",
      href: desenvolvimento,
      hub: "diagnostico",
    };
  if (hub === "diagnostico")
    return {
      texto: "Elabore o diagnóstico e envie no HUB",
      detalhe: "O diagnóstico segue o modelo do SEBRAE e é assinado só pelo consultor.",
      rotulo: "Abrir o diagnóstico",
      tom: "atencao",
      href: desenvolvimento,
    };
  if (hub === "diagnostico_enviado")
    return {
      texto: "Aguardando o gestor analisar a viabilidade do diagnóstico",
      detalhe: "Quando ele pedir a proposta, registre aqui e monte o plano de trabalho.",
      rotulo: "O gestor pediu a proposta",
      tom: "neutro",
      href: desenvolvimento,
      hub: "proposta",
    };
  if (hub === "proposta")
    return p.planoFechadoEm
      ? {
          texto: "Envie o plano de trabalho à FUNCERN",
          detalhe: "A FUNCERN é quem lança a proposta no HUB.",
          rotulo: "Enviei à FUNCERN",
          tom: "atencao",
          href: desenvolvimento,
          hub: "proposta_funcern",
        }
      : {
          texto: "Monte o plano de trabalho da proposta",
          detalhe: "As horas e as datas de cada etapa. Essas datas são as oficiais: o gestor confere as entregas com elas.",
          rotulo: "Montar o plano de trabalho",
          tom: "atencao",
          href: `${base}#plano`,
        };
  if (hub === "proposta_funcern")
    return {
      texto: "Aguardando a FUNCERN lançar a proposta no HUB",
      detalhe: "Depois, o cliente analisa o valor e paga.",
      rotulo: "A FUNCERN lançou",
      tom: "neutro",
      href: desenvolvimento,
      hub: "proposta_cliente",
    };
  if (hub === "proposta_cliente")
    return {
      texto: "Aguardando o cliente analisar a proposta e pagar no HUB",
      detalhe: "Com o pagamento, a execução começa. As datas do plano de trabalho não mudam.",
      rotulo: "O cliente pagou",
      tom: "neutro",
      href: desenvolvimento,
      hub: "execucao",
    };
  if (p.status === "aguardando_plano" || !p.planoFechadoEm) return passoDaEtapa(p, p.etapas[0]);
  // Devolução tem prioridade sobre a etapa em curso
  const devolvida = p.etapas.find((e) => e.status === "devolvida");
  const et = devolvida ?? etapaAtual(p);
  if (!et) {
    if (hub === "finalizado")
      return {
        texto: "Aguardando o cliente avaliar a consultoria no HUB",
        detalhe: "Só depois da avaliação o gestor analisa as entregas e conclui o projeto.",
        rotulo: "O cliente avaliou",
        tom: "neutro",
        href: base,
        hub: "avaliado",
      };
    if (hub === "avaliado")
      return {
        texto: "Aguardando o gestor analisar as entregas e concluir",
        detalhe: "Projetos concluídos até o dia 20 entram no recebimento do mês seguinte.",
        rotulo: "O gestor concluiu",
        tom: "neutro",
        href: base,
        hub: "concluido",
      };
    const cedo = avisoFinalizarAntecipado(p);
    return {
      texto: "Todas as etapas foram enviadas: finalize o projeto no HUB",
      detalhe: cedo ?? "Depois de finalizar, o cliente avalia a consultoria.",
      rotulo: "Finalizei no HUB",
      tom: cedo ? "atencao" : "ok",
      href: base,
      hub: "finalizado",
    };
  }
  const passo = passoDaEtapa(p, et);
  if (!passo) return null;
  return { ...passo, texto: `Etapa ${doisDigitos(et.ordem)}: ${passo.texto.charAt(0).toLowerCase()}${passo.texto.slice(1)}`, etapa: et };
}
