// Erros do provedor da IA (Anthropic) explicados ao usuário. O servidor registra o status e o corpo da resposta; quem usa o
// sistema vê o tipo do problema (chave, saldo ou limite, modelo, requisição inválida, tempo esgotado…) e não um código solto.
//
// O erro do SDK nem sempre traz "status": erros que chegam no meio de uma resposta em fluxo (SSE) vêm sem ele e com o tipo
// dentro do corpo ("overloaded_error", "rate_limit_error"…). Por isso o tipo é lido do status e, se faltar, do corpo.

export type TipoDeErroDaIA = "chave" | "saldo" | "limite" | "modelo" | "requisicao" | "tempo" | "conexao" | "provedor" | "recusa" | "desconhecido";

export type ErroDaIA = {
  tipo: TipoDeErroDaIA;
  status: number | null; // código HTTP do provedor, se houver
  mensagem: string; // para o usuário
  http: number; // código devolvido pela rota
  detalhe: string | null; // mensagem do provedor (curta), para registro e suporte
  requestId: string | null;
};

type Corpo = { type?: string; message?: string; error?: { type?: string; message?: string } };
type ErroDoSdk = { status?: number; type?: string | null; name?: string; message?: string; error?: unknown; requestID?: string | null; headers?: { get?: (n: string) => string | null } };

const curto = (t: string | undefined | null, n = 240) => (t ? t.replace(/\s+/g, " ").trim().slice(0, n) : null);

export function descreverErroDaIA(e: unknown): ErroDaIA {
  const erro = (e ?? {}) as ErroDoSdk;
  const corpo = (typeof erro.error === "object" && erro.error ? erro.error : {}) as Corpo;
  const tipoDoProvedor = corpo.error?.type ?? corpo.type ?? (typeof erro.type === "string" ? erro.type : "");
  const detalhe = curto(corpo.error?.message ?? corpo.message ?? erro.message);
  const status = typeof erro.status === "number" ? erro.status : null;
  const requestId = erro.requestID ?? erro.headers?.get?.("request-id") ?? null;
  const nome = erro.name ?? "";
  const base = { status, detalhe, requestId };
  const sufixo = status ? ` (código ${status})` : tipoDoProvedor ? ` (${tipoDoProvedor})` : "";

  if (status === 401 || tipoDoProvedor === "authentication_error" || /AuthenticationError/.test(nome))
    return { ...base, tipo: "chave", http: 503, mensagem: "A chave da API da Anthropic cadastrada na Vercel não é válida ou foi revogada. Cadastre uma chave nova." };
  if (status === 403 || tipoDoProvedor === "permission_error" || /PermissionDenied/.test(nome))
    return { ...base, tipo: "chave", http: 503, mensagem: "A chave da API da Anthropic não tem permissão para usar este modelo ou recurso. Confira a chave e o plano da conta." };
  if (status === 402 || tipoDoProvedor === "billing_error" || /credit balance|billing|saldo/i.test(detalhe ?? ""))
    return { ...base, tipo: "saldo", http: 503, mensagem: "O saldo ou o limite de uso da conta da Anthropic acabou. Recarregue o saldo e tente de novo." };
  if (status === 429 || tipoDoProvedor === "rate_limit_error" || /RateLimit/.test(nome))
    return { ...base, tipo: "limite", http: 429, mensagem: "O limite de pedidos por minuto da conta da Anthropic foi atingido. Aguarde um minuto e tente de novo." };
  if (status === 404 || tipoDoProvedor === "not_found_error" || /NotFound/.test(nome))
    return { ...base, tipo: "modelo", http: 502, mensagem: `O modelo de IA configurado não existe ou a conta não tem acesso a ele${detalhe ? `: ${detalhe}` : ""}.` };
  if (status === 400 || status === 422 || tipoDoProvedor === "invalid_request_error" || /BadRequest|UnprocessableEntity/.test(nome))
    return { ...base, tipo: "requisicao", http: 502, mensagem: `O provedor da IA recusou a requisição por ser inválida${detalhe ? `: ${detalhe}` : sufixo}. A mensagem pode ser longa demais ou ter um anexo que ele não aceita.` };
  if (status === 408 || tipoDoProvedor === "timeout_error" || /Timeout/.test(nome))
    return { ...base, tipo: "tempo", http: 504, mensagem: "A IA demorou demais para responder (tempo esgotado). Mande o conteúdo em partes menores e tente de novo." };
  if (/APIConnectionError/.test(nome) || /connection|ECONN|ENOTFOUND|fetch failed/i.test(erro.message ?? ""))
    return { ...base, tipo: "conexao", http: 502, mensagem: "Não foi possível se conectar ao provedor da IA. Tente de novo em instantes." };
  if ((status !== null && status >= 500) || tipoDoProvedor === "overloaded_error" || tipoDoProvedor === "api_error" || /InternalServer/.test(nome))
    return { ...base, tipo: "provedor", http: 502, mensagem: `O provedor da IA está sobrecarregado ou fora do ar${sufixo}. Tente de novo em instantes.` };
  return { ...base, tipo: "desconhecido", http: 500, mensagem: `Não foi possível falar com a IA agora${detalhe ? ` (${detalhe})` : ""}. Tente de novo.` };
}
