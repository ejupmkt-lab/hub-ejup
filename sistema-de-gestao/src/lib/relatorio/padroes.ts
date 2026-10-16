import type { Cliente, Etapa, Projeto, Referencia, Registro } from "../dados/tipos";
import { dataPorExtenso, hojeIso } from "../datas";
import { doisDigitos, ordinalFeminino } from "../rotulos";
import { encontrosDaEtapa } from "../horas";

// Textos-padrão no estilo dos relatórios já entregues. Montados com os dados do
// projeto; o que só o consultor sabe fica como [completar: …], e a checagem de
// completude acusa enquanto o trecho não for substituído.

export const MARCA_COMPLETAR = /\[completar[^\]]*\]/i;

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const semPonto = (s: string) => s.replace(/[.;\s]+$/, "");
const nomeEtapa = (e: Etapa) => `ETAPA ${doisDigitos(e.ordem)} | ${e.nome}`;

function nomeCliente(c: Cliente) {
  return c.nomeFantasia ? `${c.razaoSocial} - ${c.nomeFantasia}` : c.razaoSocial;
}

// Alíneas a), b), c)… com "; e" na penúltima e ponto final na última
export function alineas(itens: string[]) {
  return itens
    .map((t, i) => {
      const fim = i === itens.length - 1 ? "." : i === itens.length - 2 ? "; e" : ";";
      return `${String.fromCharCode(97 + i)}) ${semPonto(t)}${fim}`;
    })
    .join("\n");
}

const natureza: Record<number, string> = {
  1: "Este relatório consolida o diagnóstico técnico-jurídico e entrega os instrumentos iniciais de governança previstos para a Etapa 01. O mapeamento exaustivo das operações, a configuração do Registro das Operações de Tratamento (RoPA), a revisão integral de contratos, a inspeção das configurações técnicas e a implementação dos controles serão aprofundados nas etapas subsequentes.",
  2: "Esta entrega organiza o programa e prepara a implementação. O RoPA apresentado é preliminar e deverá ser validado e ampliado na Etapa 03. As políticas e procedimentos são consolidados em arquitetura mínima e controles aprovados para implantação, sem substituir a análise de contratos, configurações técnicas e bases de dados específicas.",
  3: "Esta entrega registra a execução do plano de ação: o mapeamento dos dados, o Registro das Operações de Tratamento (RoPA), o atendimento aos titulares, a integridade dos backups e a central de registro de incidentes. Os controles que dependem de terceiros permanecem acompanhados no plano de ação.",
  4: "Esta entrega reúne as informações sobre as atividades realizadas, com os relatórios de treinamento e conscientização, de riscos, de impacto à proteção de dados e de lições aprendidas, para subsidiar a estratégia de conformidade.",
  5: "Esta entrega avalia o Programa de Conformidade em LGPD: registra o monitoramento normativo, a Avaliação Interna de Riscos à Privacidade e a autoavaliação, e propõe as mudanças para o próximo ciclo de execução.",
};

export function textoPadraoSecao(chave: string, projeto: Projeto, etapa: Etapa, cliente: Cliente): string {
  const ord = ordinalFeminino[etapa.ordem].toLowerCase();
  const proxima = projeto.etapas.find((e) => e.ordem === etapa.ordem + 1);
  const responsavel = cliente.responsavel || "o responsável interno";
  const entregaveis = etapa.entregaveis.filter((e) => e.tipo === "entregavel").map((e) => minuscula(e.titulo));
  switch (chave) {
    case "objeto":
      return `O presente Relatório Técnico registra a ${ord} entrega da consultoria de Adequação à Lei Geral de Proteção de Dados Pessoais (LGPD) da ${nomeCliente(cliente)}, correspondente à ${nomeEtapa(etapa)} da ficha técnica Sebraetec nº ${projeto.codigoFichaTecnica}. A etapa tem por finalidade ${minuscula(semPonto(etapa.descricao))}.`;
    case "natureza":
      return natureza[etapa.ordem] ?? "";
    case "escopo": {
      const fontes = [
        "o diagnóstico de qualificação da demanda",
        ...(etapa.ordem > 1 ? [`o Relatório Técnico da Etapa ${doisDigitos(etapa.ordem - 1)}`] : []),
        `as informações fornecidas por ${responsavel}`,
        "os processos operacionais descritos",
        `os requisitos da ficha técnica ${projeto.codigoFichaTecnica}`,
        `as normas e orientações oficiais vigentes até ${dataPorExtenso(etapa.dataFim ?? hojeIso())}`,
      ];
      const lista = fontes.map((f, i) => `(${["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"][i]}) ${f}`);
      return [
        `A elaboração considerou: ${lista.slice(0, -1).join("; ")}; e ${lista[lista.length - 1]}.`,
        alineas(etapa.atividades.filter((a) => a.nivel === 1).map((a) => a.texto)),
        "[completar: o que não foi verificado nesta etapa, como testes técnicos, inspeção de sistemas ou análise de contratos, e por isso ficou classificado como “informado” ou “pendente de verificação”.]",
      ].join("\n\n");
    }
    case "atividades_realizadas": {
      const feitas = etapa.atividades.filter((a) => a.status === "feito");
      const base = feitas.some((a) => a.nivel > 1) ? feitas.filter((a) => a.nivel > 1) : feitas;
      return base.length ? alineas(base.map((a) => a.texto)) : "[completar: marque as atividades feitas no checklist e use o texto-padrão de novo, ou descreva aqui.]";
    }
    case "caracterizacao":
      return [
        `A ${cliente.razaoSocial} atua em ${cliente.ramo ? minuscula(cliente.ramo) : "[completar: ramo de atividade]"}${cliente.cidadeUf ? `, em ${cliente.cidadeUf}` : ""}. [completar: estrutura da empresa, pessoas envolvidas e contexto de tratamento de dados pessoais.]`,
        "[[tabela:pessoas]]",
      ].join("\n\n");
    case "diagnostico":
      return etapa.ordem === 2 ? "[[tabela:riscos]]" : "";
    case "medidas":
      return "[[tabela:acoes]]";
    case "encaminhamentos":
      if (!proxima) return "";
      return [
        `A etapa seguinte deverá dar continuidade ao programa a partir dos instrumentos desta entrega. Prioritariamente, deverão ser realizadas as seguintes atividades:`,
        alineas(proxima.atividades.filter((a) => a.nivel === 1).map((a) => a.texto)),
      ].join("\n\n");
    case "conclusao":
      return `Com esta entrega, considera-se cumprida a ${nomeEtapa(etapa).toLowerCase().replace(/^etapa \d+ \| /, "")} prevista na ficha técnica ${projeto.codigoFichaTecnica}: ${entregaveis.join("; ")}. Os instrumentos deverão permanecer vivos e ser atualizados à medida que novos processos, clientes, fornecedores ou riscos forem identificados.`;
    case "evidencias":
      return [
        `As evidências abaixo registram a interação consultiva, a coleta de informações e a validação junto a ${responsavel}, responsável pela empresa demandante.`,
        encontrosDaEtapa(projeto, etapa.ordem),
      ]
        .filter(Boolean)
        .join(" ");
    default:
      return "";
  }
}

// Conteúdo inicial dos entregáveis: o registro que cada um apresenta
const tabelaDoEntregavel: Record<string, string> = {
  "1:Relação de Encarregados de eventuais fornecedores e parceiros": "[[tabela:fornecedores]]",
  "1:Inventário de normas e guias pertinentes sobre o tema de PD&P": "[[tabela:normas]]",
  "1:Calendário de reuniões periódicas": "[[tabela:reunioes]]",
  "1:Plano de Treinamento para colaboradores": "[[tabela:treinamentos]]",
  "1:Marcos críticos do programa": "[[tabela:marcos]]",
  "2:Aprovação das medidas de prevenção e mitigação de riscos identificados junto às áreas de negócio": "[[tabela:riscos]]",
  "2:Plano de ação para implementação das medidas de mitigação de riscos": "[[tabela:acoes]]",
  "2:Registro das Operações de Tratamento - RoPA preliminar": "[[tabela:ropa]]",
  "2:Due diligence de fornecedores e parceiros": "[[tabela:fornecedores]]",
  "3:Registros das atividades de tratamento (RoPA)": "[[tabela:ropa]]",
  "3:Configurar central de registro de incidentes": "[[tabela:incidentes]]",
  "4:Relatório a respeito de riscos relacionados a dados pessoais para subsidiar a estratégia de compliance": "[[tabela:riscos]]",
  "4:Relatório sobre treinamentos institucionais e campanhas de conscientização executadas": "[[tabela:treinamentos]]",
};

export function textoPadraoEntregavel(etapa: Etapa, titulo: string): string {
  const tabela = tabelaDoEntregavel[`${etapa.ordem}:${titulo}`];
  if (tabela) return `[completar: introdução de um parágrafo sobre ${minuscula(titulo)}.]\n\n${tabela}`;
  return `[completar: ${minuscula(titulo)}.]`;
}

// Preenche só o que está em branco
export function preencherVazios(projeto: Projeto, etapa: Etapa, cliente: Cliente, chaves: string[]) {
  let n = 0;
  for (const k of chaves) {
    if ((etapa.secoes[k] ?? "").trim()) continue;
    const t = textoPadraoSecao(k, projeto, etapa, cliente);
    if (t) {
      etapa.secoes[k] = t;
      n++;
    }
  }
  for (const ent of etapa.entregaveis) {
    if (ent.conteudo.trim() || ent.tipo === "instrumento") continue;
    ent.conteudo = textoPadraoEntregavel(etapa, ent.titulo);
    n++;
  }
  return n;
}

// Referências normativas usadas nos relatórios de LGPD
export function referenciasPadrao(consulta = hojeIso()): Omit<Referencia, "id">[] {
  const r = (texto: string, url: string, comData = true) => ({ texto, url, consultadoEm: comData ? consulta : "" });
  return [
    r("BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD), texto compilado.", "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709compilado.htm"),
    r("AGÊNCIA NACIONAL DE PROTEÇÃO DE DADOS. Resolução CD/ANPD nº 2, de 27 de janeiro de 2022. Regulamento de aplicação da LGPD para agentes de tratamento de pequeno porte.", "https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022"),
    r("AGÊNCIA NACIONAL DE PROTEÇÃO DE DADOS. Guia orientativo para definições dos agentes de tratamento e do encarregado.", "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado"),
    r("AGÊNCIA NACIONAL DE PROTEÇÃO DE DADOS. Resolução CD/ANPD nº 15/2024 e orientações sobre comunicação de incidentes de segurança.", "https://www.gov.br/anpd/pt-br/assuntos/comunicacao-de-incidentes-de-seguranca-cis"),
    r("AGÊNCIA NACIONAL DE PROTEÇÃO DE DADOS. Resolução CD/ANPD nº 18/2024 e Guia de Atuação do Encarregado pelo Tratamento de Dados Pessoais.", "https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd"),
    r("AGÊNCIA NACIONAL DE PROTEÇÃO DE DADOS. Resolução CD/ANPD nº 19/2024. Transferência internacional de dados e cláusulas-padrão contratuais.", "https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd"),
    r("AGÊNCIA NACIONAL DE PROTEÇÃO DE DADOS. Guia orientativo sobre segurança da informação para agentes de tratamento de pequeno porte e checklist.", "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte"),
  ];
}

// Inventário normativo inicial (registro "normas"), no formato do Entregável 3 da Etapa 01
export function normasPadrao(): Omit<Registro, "id">[] {
  const linhas: [string, string, string][] = [
    ["Constituição Federal, art. 5º, X e LXXIX", "Privacidade, honra, imagem e direito fundamental à proteção de dados.", "Orientar todo processo, sistema, acesso e uso de dados."],
    ["Lei nº 13.709/2018 - LGPD", "Princípios, bases legais, direitos, agentes, registros, segurança, incidentes e governança.", "Norma central do programa."],
    ["Lei nº 12.965/2014 - Marco Civil da Internet", "Princípios, direitos e deveres no uso da internet e proteção de registros e dados.", "Relevante a sites, aplicativos, mensageria e registros de acesso."],
    ["Decreto nº 8.771/2016", "Regulamenta o Marco Civil, inclusive segurança e guarda de registros.", "Referência técnica e jurídica para operações digitais."],
    ["Lei nº 10.406/2002 - Código Civil", "Boa-fé, responsabilidade, contratos e direitos da personalidade.", "Apoiar cláusulas, confidencialidade e responsabilidade por serviços."],
    ["Resolução CD/ANPD nº 1/2021", "Fiscalização e processo administrativo sancionador.", "Compreender o dever de colaboração e de prestação de contas."],
    ["Resolução CD/ANPD nº 2/2022", "Regime para agentes de tratamento de pequeno porte.", "Procedimentos simplificados, canal e análise de alto risco."],
    ["Resolução CD/ANPD nº 4/2023", "Dosimetria e aplicação de sanções administrativas.", "Incorporar prevenção, evidências e medidas corretivas."],
    ["Resolução CD/ANPD nº 15/2024", "Comunicação de incidente de segurança.", "Criar registro, avaliação e fluxo de comunicação."],
    ["Resolução CD/ANPD nº 18/2024", "Atuação do encarregado pelo tratamento.", "Referência para designação formal e canal de privacidade."],
    ["Resolução CD/ANPD nº 19/2024", "Transferência internacional e cláusulas-padrão.", "Avaliar fornecedores e serviços em nuvem no exterior."],
    ["Guia de Segurança para Agentes de Pequeno Porte", "Medidas técnicas e administrativas proporcionais.", "Base para política simplificada e checklist de segurança."],
    ["Guia sobre Agentes de Tratamento e Encarregado", "Critérios para controlador, operador e encarregado.", "Classificar o papel da empresa por processo."],
  ];
  return linhas.map(([norma, conteudo, aplicacao], i) => ({
    tipo: "normas",
    codigo: `N${i + 1}`,
    etapaOrigem: 1,
    dados: { norma, conteudo, aplicacao },
  }));
}
