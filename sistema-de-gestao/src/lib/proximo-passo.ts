import type { Etapa, Projeto } from "./dados/tipos";
import { dataCurta } from "./datas";
import { doisDigitos, type StatusEtapa, type Tom } from "./rotulos";
import { etapaAtual, progressoAtividades } from "./projeto";
import { assinada } from "./regras-etapa";
import { avisoFinalizarAntecipado, passoHubDoProjeto } from "./fase";
import type { PassoHub } from "./dados/tipos";
import { faltaDoRelatorio, relatorioFeitoFora, verificarCompletude } from "./relatorio/secoes";
import { marcadoresEmAberto } from "./regras-etapa";
import { lerDiagnostico, temTextoNoDiagnostico } from "./diagnostico";

// O que fazer agora, em uma frase e um botão. Usado no painel, na lista de
// projetos, no projeto e na etapa, para ninguém precisar adivinhar o caminho.

// Abas do projeto que podem ser abertas pelo endereço (#plano, #desenvolvimento…).
// #ficha e #dados abrem os Dados do projeto; #etapa-2 abre a entrega da etapa 2.
export const ancoraAbaProjeto = {
  desenvolvimento: "Desenvolvimento",
  conversa: "Desenvolvimento",
  registrar: "Desenvolvimento",
  ficha: "Dados",
  dados: "Dados",
  cronograma: "Plano de trabalho",
  plano: "Plano de trabalho",
  entregas: "Entregas",
  diagnostico: "Entregas",
  relatorios: "Entregas",
  historico: "Histórico",
  financeiro: "Financeiro",
} as const;

export type Passo = {
  texto: string;
  detalhe?: string;
  rotulo: string;
  tom: Tom;
  href: string;
  acao?: StatusEtapa; // muda o status da etapa direto (com as regras e avisos)
  hub?: PassoHub; // no projeto: registra o próximo passo do HUB (com a data de hoje)
};

export function passoDaEtapa(p: Projeto, e: Etapa): Passo | null {
  const base = `/${p.empresa}/projetos/${p.id}`;
  // A etapa é escrita no Desenvolvimento e enviada pelas Entregas
  const desenvolvimento = `${base}#desenvolvimento`;
  const entrega = `${base}#etapa-${e.ordem}`;
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
      texto: "O gestor do SEBRAE devolveu esta entrega para ajuste",
      detalhe: "Ajuste o relatório no Desenvolvimento, assine de novo e reenvie no HUB.",
      rotulo: "Voltar a ajustar",
      tom: "critico",
      href: entrega,
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
      href: `${base}#etapa-${atual.ordem}`,
    };

  // Relatório feito fora do sistema: o checklist foi cumprido nele e é dado por feito no envio
  const prog = progressoAtividades(e);
  if (prog.feitas < prog.total && !relatorioFeitoFora(e))
    return {
      texto: "Marque as atividades do checklist",
      detalhe: `${prog.feitas} de ${prog.total} já marcadas. Conte no Desenvolvimento o que foi feito, ou marque em Tarefas.`,
      rotulo: "Contar no Desenvolvimento",
      tom: "andamento",
      href: desenvolvimento,
    };

  const pendencias = verificarCompletude(p, e);
  if (pendencias.length) {
    const primeira = pendencias[0].onde;
    const qtd = pendencias.length === 1 ? "Falta 1 item para o relatório ficar completo." : `Faltam ${pendencias.length} itens para o relatório ficar completo.`;
    if (primeira === "Referências")
      return {
        texto: "Complete as referências do relatório",
        detalhe: `${pendencias[0].texto}. ${qtd}`,
        rotulo: "Abrir a entrega",
        tom: "andamento",
        href: entrega,
      };
    // O passo depende do que falta: escrever, resolver marcadores ou anexar evidências (não é sempre "escreva o relatório")
    const falta = faltaDoRelatorio(p, e);
    if (primeira !== "Registros" && primeira !== "Fechamento" && !falta.emBranco) {
      if (falta.marcadores) {
        const m = marcadoresEmAberto(e);
        return {
          texto: `Resolva os marcadores em aberto do relatório (${m})`,
          detalhe: `O texto está escrito, mas tem [completar] ou [a confirmar]. ${qtd}`,
          rotulo: "Resolver no Desenvolvimento",
          tom: "andamento",
          href: desenvolvimento,
        };
      }
      if (falta.semEvidencia)
        return {
          texto: "Anexe as evidências do relatório",
          detalhe: `Prints e fotos de reunião comprovam o que foi relatado. ${qtd}`,
          rotulo: "Abrir a entrega",
          tom: "andamento",
          href: entrega,
        };
    }
    return {
      texto: primeira === "Registros" ? "Conte os dados das tabelas do relatório" : primeira === "Fechamento" ? "Resolva as pendências do relatório" : "Escreva o relatório da etapa",
      detalhe: `${pendencias[0].texto}. ${qtd}`,
      rotulo: "Escrever no Desenvolvimento",
      tom: "andamento",
      href: desenvolvimento,
    };
  }

  if (!assinada(e))
    return {
      texto: "Baixe o relatório, assine no gov.br e anexe o PDF",
      detalhe: "O relatório está completo. Ao anexar o PDF assinado, as datas de assinatura são preenchidas.",
      rotulo: "Abrir a entrega",
      tom: "atencao",
      href: entrega,
    };

  if (e.status !== "a_enviar")
    return {
      texto: "Relatório completo e assinado",
      detalhe: "Marque a etapa como pronta para enviar no HUB.",
      rotulo: "Marcar como pronta",
      tom: "atencao",
      href: entrega,
      acao: "a_enviar",
    };

  return {
    texto: "Envie o relatório assinado no Plano de Entrega do HUB",
    detalhe: "Depois de enviar, registre aqui para a próxima etapa começar.",
    rotulo: "Enviei no HUB",
    tom: "atencao",
    href: entrega,
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
      texto: temTextoNoDiagnostico(lerDiagnostico(p)) ? "Revise o diagnóstico, baixe o Word e envie no HUB" : "Elabore o diagnóstico e envie no HUB",
      detalhe: "O diagnóstico segue o modelo do SEBRAE e é assinado só pelo consultor. O arquivo fica em Entregas, antes dos relatórios.",
      rotulo: "Abrir o diagnóstico",
      tom: "atencao",
      href: `${base}#diagnostico`,
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
          detalhe: "As horas e a duração de cada etapa. Quando o cliente pagar, o plano passa a começar na data do pagamento.",
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
      detalhe: "Com o pagamento, a execução começa e o plano de trabalho passa a contar dessa data.",
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
