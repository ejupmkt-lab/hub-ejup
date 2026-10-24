import type { Projeto } from "./dados/tipos";
import { registrarEvento } from "./dados/store";
import type { DocumentoDoHub } from "./hub-importar";

// Documentos que a página do HUB lista (contrato, recibo, atesto…). Os que a extensão não consegue baixar
// ficam ao menos registrados no histórico do projeto, para constar que existem.

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\.[a-z0-9]{2,5}$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// O arquivo baixado corresponde ao documento da lista? (mesmo nome, ou um contido no outro)
export function foiBaixado(doc: DocumentoDoHub, nomesBaixados: string[]) {
  const d = normalizar(doc.nome);
  if (!d) return false;
  return nomesBaixados.some((n) => {
    const a = normalizar(n);
    return !!a && (a.includes(d) || d.includes(a));
  });
}

const descrever = (doc: DocumentoDoHub, baixado: boolean) => {
  const meta = [doc.data && doc.data.trim(), doc.por && `por ${doc.por.trim()}`].filter(Boolean).join(" ");
  return `${doc.nome.trim()}${meta ? ` (${meta}${baixado ? "" : "; só registrado, não baixado"})` : baixado ? "" : " (só registrado, não baixado)"}`;
};

export function itensDosDocumentos(docs: DocumentoDoHub[] | undefined, nomesBaixados: string[]) {
  return (docs ?? []).filter((d) => d.nome?.trim()).map((d) => ({ doc: d, baixado: foiBaixado(d, nomesBaixados), texto: descrever(d, foiBaixado(d, nomesBaixados)) }));
}

// Registra no histórico (uma vez só, mesmo que a mesma lista seja importada de novo)
export function registrarDocumentosNoHistorico(p: Projeto, usuario: string, docs: DocumentoDoHub[] | undefined, nomesBaixados: string[]) {
  const itens = itensDosDocumentos(docs, nomesBaixados);
  if (!itens.length) return;
  const acao = "HUB: documentos listados na página do pedido";
  const detalhe = itens.map((i) => i.texto).join("; ");
  if (p.historico.some((e) => e.acao === acao && e.detalhe === detalhe)) return;
  registrarEvento(p, usuario, acao, detalhe);
}
