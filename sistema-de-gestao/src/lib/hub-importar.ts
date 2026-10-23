import type { Cliente, Projeto } from "./dados/tipos";
import type { AcaoIA } from "./conversa";

// Importar do HUB: o consultor cola o texto (ou manda print/PDF) da página do
// pedido no HUB e a IA lê o que está lá. Aqui ficam as conferências que o
// sistema faz antes de aceitar: o conteúdo é mesmo deste pedido e deste cliente?

export type IdentificacaoHub = { codigo_hub: string; cnpj: string; empresa: string; gestor: string; servico: string };

// Só o que a importação pode fazer: dados do pedido, plano, passos do HUB e a resposta do gestor a uma entrega
export type AcaoImportacao = Extract<AcaoIA, { tipo: "dados_hub" | "definir_cronograma" | "alterar_plano_hub" | "avancar_hub" | "mudar_situacao_etapa" }>;
export const tiposDaImportacao = ["definir_cronograma", "alterar_plano_hub", "avancar_hub", "mudar_situacao_etapa"] as const;

export type RespostaImportacao = { resumo: string; identificacao: IdentificacaoHub; acoes: unknown[]; nao_importado: string[] };

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
