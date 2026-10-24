import type { Projeto } from "./dados/tipos";
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

// "10/09/2026 21:52:53" ou "10/09/2026" → "2026-09-10T21:52:53" (Brasília), como o histórico guarda
export function dataHoraDoHub(texto: string): string | null {
  const m = /(\d{2})\/(\d{2})\/(\d{4})(?:\D+(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(texto ?? "");
  if (!m) return null;
  const [, d, mes, a, h = "00", mi = "00", se = "00"] = m;
  return `${a}-${mes}-${d}T${h}:${mi}:${se}`;
}

// Cada documento que o HUB lista entra no histórico com a data em que foi gerado ou enviado lá;
// os que não deu para baixar dizem isso (uma vez só, mesmo que a mesma lista seja importada de novo)
export function registrarDocumentosNoHistorico(p: Projeto, usuario: string, docs: DocumentoDoHub[] | undefined, nomesBaixados: string[]) {
  for (const i of itensDosDocumentos(docs, nomesBaixados)) {
    const em = dataHoraDoHub(i.doc.data) ?? new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 19);
    const acao = `Documento no HUB: ${i.doc.nome.trim()}`;
    const detalhe = `${i.baixado ? "Baixado e guardado no projeto" : "Só registrado: não deu para baixar"}; importado por ${usuario}`;
    if (p.historico.some((e) => e.em === em && e.acao === acao)) continue;
    p.historico.push({ em, usuario: i.doc.por?.trim() || "HUB SEBRAE", acao, detalhe });
  }
  ordenarHistorico(p);
}

// O histórico fica do mais novo para o mais antigo, pela data de verdade
export function ordenarHistorico(p: Projeto) {
  p.historico = p.historico.map((e, i) => ({ e, i })).sort((x, y) => (y.e.em < x.e.em ? -1 : y.e.em > x.e.em ? 1 : x.i - y.i)).map((x) => x.e);
}
