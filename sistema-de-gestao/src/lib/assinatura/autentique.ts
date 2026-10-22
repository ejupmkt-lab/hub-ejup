// Cliente da API da Autentique (GraphQL), só no servidor. A chave fica na Vercel
// (AUTENTIQUE_TOKEN) e nunca vai para o navegador. Com AUTENTIQUE_SANDBOX=1 os
// documentos nascem como teste e não consomem a cota do plano.
const URL_API = () => process.env.AUTENTIQUE_URL || "https://api.autentique.com.br/v2/graphql";

export const configurada = () => !!process.env.AUTENTIQUE_TOKEN;

export class ErroAutentique extends Error {}

type Resposta<T> = { data?: T; errors?: { message: string }[] };

async function chamar<T>(corpo: BodyInit, cabecalhos: Record<string, string> = {}): Promise<T> {
  const r = await fetch(URL_API(), {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.AUTENTIQUE_TOKEN}`, ...cabecalhos },
    body: corpo,
  });
  const json = (await r.json().catch(() => null)) as Resposta<T> | null;
  if (!r.ok || !json || json.errors?.length || !json.data) {
    const motivo = json?.errors?.map((e) => e.message).join("; ") || `HTTP ${r.status}`;
    throw new ErroAutentique(r.status === 401 ? "A Autentique recusou a chave (AUTENTIQUE_TOKEN). Confira na Vercel." : `A Autentique recusou o pedido: ${motivo}`);
  }
  return json.data;
}

const consulta = <T>(query: string, variables: Record<string, unknown> = {}) =>
  chamar<T>(JSON.stringify({ query, variables }), { "Content-Type": "application/json" });

export type Signatario = { nome: string; email: string };

export type SignatarioAutentique = {
  publicId: string;
  nome: string;
  email: string;
  link: string | null;
  viuEm: string | null;
  assinouEm: string | null;
  recusouEm: string | null;
};

type Assinatura = {
  public_id: string;
  name: string | null;
  email: string | null;
  link: { short_link: string | null } | null;
  viewed: { created_at: string } | null;
  signed: { created_at: string } | null;
  rejected: { created_at: string } | null;
};

const paraSignatario = (a: Assinatura): SignatarioAutentique => ({
  publicId: a.public_id,
  nome: a.name ?? "",
  email: a.email ?? "",
  link: a.link?.short_link ?? null,
  viuEm: a.viewed?.created_at ?? null,
  assinouEm: a.signed?.created_at ?? null,
  recusouEm: a.rejected?.created_at ?? null,
});

const CAMPOS_ASSINATURA = `public_id name email link { short_link } viewed { created_at } signed { created_at } rejected { created_at }`;

// Cria o documento e já convida os signatários (cada um recebe o link por e-mail)
export async function criarDocumento(nome: string, pdf: Blob, signatarios: Signatario[]) {
  const operations = {
    query: `mutation Criar($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
      createDocument(sandbox: ${process.env.AUTENTIQUE_SANDBOX === "1" ? "true" : "false"}, document: $document, signers: $signers, file: $file) {
        id signatures { ${CAMPOS_ASSINATURA} }
      }
    }`,
    variables: {
      document: { name: nome },
      signers: signatarios.map((s) => ({ name: s.nome, email: s.email, action: "SIGN" })),
      file: null,
    },
  };
  const form = new FormData();
  form.append("operations", JSON.stringify(operations));
  form.append("map", JSON.stringify({ file: ["variables.file"] }));
  form.append("file", pdf, "relatorio.pdf");
  const d = await chamar<{ createDocument: { id: string; signatures: Assinatura[] } }>(form);
  return { documentoId: d.createDocument.id, signatarios: d.createDocument.signatures.map(paraSignatario) };
}

// Os ids vêm do próprio projeto; ainda assim só entram na consulta se forem simples
const idSeguro = (id: string) => {
  if (!/^[\w-]{6,80}$/.test(id)) throw new ErroAutentique("Identificador de documento inválido.");
  return id;
};

export async function consultarDocumento(id: string) {
  const d = await consulta<{ document: { id: string; files: { signed: string | null } | null; signatures: Assinatura[] } | null }>(
    `query { document(id: "${idSeguro(id)}") { id files { signed } signatures { ${CAMPOS_ASSINATURA} } } }`,
  );
  if (!d.document) throw new ErroAutentique("A Autentique não encontrou este documento.");
  return { arquivoAssinado: d.document.files?.signed ?? null, signatarios: d.document.signatures.map(paraSignatario) };
}

export async function reenviar(publicIds: string[]) {
  const ids = publicIds.map((i) => `"${idSeguro(i)}"`).join(", ");
  await consulta<{ resendSignatures: boolean }>(`mutation { resendSignatures(public_ids: [${ids}]) }`);
}

// O PDF assinado fica numa URL da própria Autentique
export async function baixarAssinado(url: string): Promise<ArrayBuffer> {
  const host = new globalThis.URL(url).hostname;
  const confiavel = host.endsWith("autentique.com.br") || host === "127.0.0.1" || host === "localhost";
  let r = await fetch(url);
  if ((r.status === 401 || r.status === 403) && confiavel) r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.AUTENTIQUE_TOKEN}` } });
  if (!r.ok) throw new ErroAutentique("Não foi possível baixar o PDF assinado na Autentique.");
  return r.arrayBuffer();
}

export type EstadoAssinatura = "aguardando" | "assinado" | "recusado";
export function estadoDoDocumento(s: SignatarioAutentique[]): EstadoAssinatura {
  if (s.some((x) => x.recusouEm)) return "recusado";
  return s.length > 0 && s.every((x) => x.assinouEm) ? "assinado" : "aguardando";
}
