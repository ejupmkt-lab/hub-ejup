import type { Cliente, PassoHub, Projeto } from "./dados/tipos";
import type { AcaoIA } from "./conversa";
import { antesDaContratacao, ordemPassos, passoHubDoProjeto } from "./fase";

// Importar do HUB: o consultor cola o texto (ou manda print/PDF) da página do
// pedido no HUB e a IA lê o que está lá. Aqui ficam as conferências que o
// sistema faz antes de aceitar: o conteúdo é mesmo deste pedido e deste cliente?

export type IdentificacaoHub = {
  codigo_hub: string;
  cnpj: string;
  empresa: string;
  gestor: string;
  servico: string;
  // Só na criação de um projeto novo: o serviço escolhido na lista e o contato da empresa
  servico_id?: string;
  contato_nome?: string;
  contato_email?: string;
  contato_telefone?: string;
};

// Só o que a importação pode fazer: dados do pedido, plano, passos do HUB e a resposta do gestor a uma entrega
export type AcaoImportacao = Extract<AcaoIA, { tipo: "dados_hub" | "definir_cronograma" | "alterar_plano_hub" | "avancar_hub" | "mudar_situacao_etapa" }>;
export const tiposDaImportacao = ["definir_cronograma", "alterar_plano_hub", "avancar_hub", "mudar_situacao_etapa"] as const;

export type DocumentoDoHub = { nome: string; data: string; por: string };
// Situação de cada etapa do serviço (a "ETAPA 01 | PREPARAÇÃO"…) como a página do HUB mostra
export type EtapaNoHub = { etapa: number; situacao: "enviada" | "aprovada" | "devolvida" | "em_andamento" | "nao_iniciada"; data: string };
export type RespostaImportacao = {
  resumo: string;
  identificacao: IdentificacaoHub;
  acoes: unknown[];
  nao_importado: string[];
  documentos?: DocumentoDoHub[];
  // Passos do HUB que a página mostra como já cumpridos, mas sem data
  passos_sem_data?: string[];
  etapas?: EtapaNoHub[];
};

const digitos = (t: string) => (t ?? "").replace(/\D/g, "");

export type Conferencia = {
  // O conteúdo contradiz o projeto: não deve ser aplicado sem o consultor insistir
  bloqueios: string[];
  avisos: string[];
  // O código do pedido ou o CNPJ lido bate com o projeto
  confere: boolean;
};

export function conferirIdentificacao(p: Projeto, c: Partial<Cliente> | undefined, id: IdentificacaoHub): Conferencia {
  const bloqueios: string[] = [];
  const avisos: string[] = [];
  let bateu = false;

  const codigoLido = digitos(id.codigo_hub);
  const codigoProjeto = digitos(p.codigoSolicitacaoHub || p.numeroProjetoHub);
  if (codigoLido && codigoProjeto) {
    if (codigoLido === codigoProjeto) bateu = true;
    else bloqueios.push(`O código do pedido no HUB é ${id.codigo_hub}, mas este projeto está com o código ${p.codigoSolicitacaoHub || p.numeroProjetoHub}. Parece ser de outro pedido.`);
  }

  const cnpjLido = digitos(id.cnpj);
  const cnpjCliente = digitos(c?.cnpj ?? "");
  if (cnpjLido.length === 14 && cnpjCliente.length === 14) {
    if (cnpjLido === cnpjCliente) bateu = true;
    else bloqueios.push(`O CNPJ no HUB (${id.cnpj}) não é o do cliente deste projeto (${c?.cnpj}).`);
  }

  if (!bateu && !bloqueios.length) {
    if (codigoLido && !codigoProjeto) avisos.push(`Este projeto ainda não tem o código do pedido; o HUB mostra ${id.codigo_hub}. Confira se é deste cliente antes de aplicar.`);
    else avisos.push("Não encontrei o código do pedido nem o CNPJ no conteúdo para confirmar que é deste projeto. Confira antes de aplicar.");
  }
  return { bloqueios, avisos, confere: bateu };
}

const tipoPermitido = (t: unknown): t is (typeof tiposDaImportacao)[number] => (tiposDaImportacao as readonly string[]).includes(String(t));

// Mantém só as ações que a importação pode fazer e acrescenta os dados do pedido (código e gestor),
// a não ser que o conteúdo contradiga o projeto
export function acoesDaImportacao(bruto: unknown[], id: IdentificacaoHub, semBloqueio: boolean): AcaoIA[] {
  const lista = (bruto ?? []).filter((a): a is AcaoImportacao => !!a && typeof a === "object" && tipoPermitido((a as { tipo?: unknown }).tipo));
  const dados: AcaoImportacao[] =
    semBloqueio && (id.codigo_hub?.trim() || id.gestor?.trim())
      ? [{ tipo: "dados_hub", codigo_hub: id.codigo_hub?.trim() ?? "", gestor: id.gestor?.trim() ?? "" }]
      : [];
  return [...dados, ...lista];
}

// O que a IA leu no PDF do relatório de uma etapa baixado do HUB
export type LeituraRelatorio = {
  data_do_relatorio: string;
  assinatura_consultor: string;
  assinatura_cliente: string;
  inicio_das_atividades: string;
  fim_das_atividades: string;
  datas: { data: string; o_que: string }[];
  resumo: string;
};
export type LeiturasDosRelatorios = Record<number, LeituraRelatorio | { erro: string }>;
const comLeitura = (l: LeiturasDosRelatorios | undefined, etapa: number): LeituraRelatorio | null => {
  const x = l?.[etapa];
  return x && !("erro" in x) ? x : null;
};
// Quando o relatório foi enviado, se o HUB não diz: no mínimo depois da última assinatura (ou da data do relatório)
export function envioPeloRelatorio(l: LeituraRelatorio | null): string {
  const datas = [l?.assinatura_cliente, l?.assinatura_consultor, l?.data_do_relatorio].filter((d): d is string => !!d && dataIso(d));
  return datas.sort().at(-1) ?? "";
}

// ─── O que a página do HUB não traz e o consultor completa ──────────────────────

export const rotuloDoPasso: Record<PassoHub, string> = {
  solicitacao: "Solicitação aberta",
  diagnostico: "Demanda recebida do gestor",
  diagnostico_enviado: "Diagnóstico enviado no HUB",
  proposta: "Gestor pediu a proposta",
  proposta_funcern: "Plano enviado à FUNCERN",
  proposta_cliente: "FUNCERN lançou a proposta no HUB",
  execucao: "Pagamento do cliente",
  finalizado: "Projeto finalizado no HUB",
  avaliado: "Cliente avaliou a consultoria",
  concluido: "Gestor concluiu o projeto",
};

// Datas que o consultor informa (o que ficar em branco não é registrado)
export type Completar = { passos: Record<string, string>; planoInicio: string; planoFim: string; envios: Record<number, string> };
export const completarVazio: Completar = { passos: {}, planoInicio: "", planoFim: "", envios: {} };

const dataIso = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d ?? "") && !Number.isNaN(Date.parse(d));
const ePasso = (p: string): p is PassoHub => (ordemPassos as readonly string[]).includes(p);

export type Pendencias = {
  passosSemData: PassoHub[];
  pedePlano: boolean;
  // Etapas que o HUB mostra como enviadas e ainda não estão assim no projeto (com a data que a IA achou, se achou)
  etapasEnviadas: { etapa: number; dataDaIA: string; dataDoRelatorio: boolean }[];
};

// projeto: o projeto em que se importa; null quando o projeto será criado agora (começa no diagnóstico, sem plano)
export function pendenciasDoHub(r: RespostaImportacao, projeto: Projeto | null, leituras?: LeiturasDosRelatorios): Pendencias {
  const atual = projeto ? ordemPassos.indexOf(passoHubDoProjeto(projeto)) : ordemPassos.indexOf("diagnostico");
  const comData = new Set((r.acoes as { tipo?: string; passo?: string }[]).filter((a) => a?.tipo === "avancar_hub").map((a) => a.passo));
  const passosSemData = (r.passos_sem_data ?? []).filter(ePasso).filter((p, i, l) => l.indexOf(p) === i && !comData.has(p) && ordemPassos.indexOf(p) > atual);
  const planoFechado = !!projeto?.planoFechadoEm;
  const algumDepoisDaProposta = [...passosSemData, ...[...comData].filter((p): p is PassoHub => !!p && ePasso(p))].some((p) => ordemPassos.indexOf(p) > ordemPassos.indexOf("proposta"));
  const aiDefiniu = (r.acoes as { tipo?: string }[]).some((a) => a?.tipo === "definir_cronograma");
  const pedePlano = !planoFechado && !aiDefiniu && algumDepoisDaProposta && (!projeto || antesDaContratacao(projeto));
  const etapasEnviadas = (r.etapas ?? [])
    .filter((e) => (e.situacao === "enviada" || e.situacao === "aprovada") && (!projeto || !projeto.etapas.find((x) => x.ordem === e.etapa && (x.status === "enviada" || x.status === "aprovada" ) && x.relatorioAssinado)))
    .filter((e) => !projeto || projeto.etapas.some((x) => x.ordem === e.etapa))
    .map((e) => {
      const doHub = dataIso(e.data) ? e.data : "";
      const doRelatorio = envioPeloRelatorio(comLeitura(leituras, e.etapa));
      return { etapa: e.etapa, dataDaIA: doHub || doRelatorio, dataDoRelatorio: !doHub && !!doRelatorio };
    });
  return { passosSemData, pedePlano, etapasEnviadas };
}

// As datas escritas no relatório, para a ação de envio da etapa
function datasDoRelatorio(l: LeituraRelatorio | null) {
  if (!l) return {};
  const v = (d: string) => (dataIso(d) ? d : undefined);
  return { inicio: v(l.inicio_das_atividades), data_relatorio: v(l.data_do_relatorio), assinatura_consultor: v(l.assinatura_consultor), assinatura_cliente: v(l.assinatura_cliente) };
}

// As ações na ordem em que o sistema as aceita: dados, plano, passos até o pagamento, envios das etapas, passos de depois
export function montarAcoes(
  r: RespostaImportacao,
  semBloqueio: boolean,
  c: Completar,
  projeto: Projeto | null,
  relatorios: Record<number, { caminho: string; nome: string }>,
  incluirDiagnostico = true,
  leituras?: LeiturasDosRelatorios,
): AcaoIA[] {
  const base = acoesDaImportacao(r.acoes, r.identificacao, semBloqueio);
  const dados = base.filter((a) => a.tipo === "dados_hub");
  let definir = base.filter((a) => a.tipo === "definir_cronograma");
  const plano = base.filter((a) => a.tipo === "alterar_plano_hub");
  const situacao = base.filter((a) => a.tipo === "mudar_situacao_etapa");
  const passos = base.filter((a): a is Extract<AcaoIA, { tipo: "avancar_hub" }> => a.tipo === "avancar_hub" && (incluirDiagnostico || a.passo !== "diagnostico"));
  const pend = pendenciasDoHub(r, projeto, leituras);

  // Datas informadas pelo consultor
  for (const p of pend.passosSemData) if (dataIso(c.passos[p])) passos.push({ tipo: "avancar_hub", passo: p, data: c.passos[p] });
  if (!definir.length && pend.pedePlano && dataIso(c.planoInicio)) definir = [{ tipo: "definir_cronograma", inicio: c.planoInicio, fim: dataIso(c.planoFim) ? c.planoFim : "" }];
  passos.sort((a, b) => ordemPassos.indexOf(a.passo) - ordemPassos.indexOf(b.passo));

  const execIdx = ordemPassos.indexOf("execucao");
  const antes = passos.filter((a) => ordemPassos.indexOf(a.passo) <= execIdx);
  const depois = passos.filter((a) => ordemPassos.indexOf(a.passo) > execIdx);
  const envios: AcaoIA[] = [];
  for (const e of pend.etapasEnviadas) {
    const data = dataIso(c.envios[e.etapa]) ? c.envios[e.etapa] : e.dataDaIA;
    if (dataIso(data)) envios.push({ tipo: "registrar_envio_etapa", etapa: e.etapa, data, relatorio: relatorios[e.etapa], ...datasDoRelatorio(comLeitura(leituras, e.etapa)) });
  }
  // Etapa já enviada no projeto, sem o PDF: só anexa o relatório
  if (projeto)
    for (const [ordem, rel] of Object.entries(relatorios)) {
      const e = projeto.etapas.find((x) => x.ordem === Number(ordem));
      if (e && (e.status === "enviada" || e.status === "aprovada") && !e.relatorioAssinado && e.enviadaEm) envios.push({ tipo: "registrar_envio_etapa", etapa: e.ordem, data: e.enviadaEm, relatorio: rel, ...datasDoRelatorio(comLeitura(leituras, e.ordem)) });
    }
  return [...dados, ...definir, ...plano, ...antes, ...envios, ...depois, ...situacao];
}
