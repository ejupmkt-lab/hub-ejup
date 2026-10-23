// Ponte com a extensão do navegador "Blimp: importar do HUB" (pasta extensao-hub).
// Uma página não pode ler outro site; a extensão lê a aba do HUB que o consultor deixou
// aberta e entrega o texto ao Blimp, só quando o Blimp pede. O identificador é fixo porque
// o manifesto da extensão leva a chave pública.

export const EXTENSAO_HUB_ID = "jbjcoedchibfhamofkcjkppdainmkifn";
export const ARQUIVO_DA_EXTENSAO = "/blimp-hub-extensao.zip";

export type LeituraDoHub =
  | { ok: true; texto: string; cortado: boolean; titulo: string; endereco: string; achouCodigo: boolean }
  | { ok: false; motivo: "configurar" | "sem-aba" | "vazia" | "erro" | "sem-extensao" | "pedido-desconhecido"; detalhe?: string };

type Chrome = { runtime?: { sendMessage?: (id: string, msg: unknown, cb: (r: unknown) => void) => void; lastError?: unknown } };

function enviar<T>(mensagem: unknown): Promise<T | null> {
  return new Promise((resolver) => {
    const c = (globalThis as unknown as { chrome?: Chrome }).chrome;
    if (!c?.runtime?.sendMessage) return resolver(null);
    const limite = setTimeout(() => resolver(null), 15000);
    try {
      c.runtime.sendMessage(EXTENSAO_HUB_ID, mensagem, (r) => {
        clearTimeout(limite);
        // Sem a extensão instalada, o navegador marca erro de conexão
        void c.runtime?.lastError;
        resolver((r as T) ?? null);
      });
    } catch {
      clearTimeout(limite);
      resolver(null);
    }
  });
}

// A extensão está instalada neste navegador?
export async function extensaoInstalada() {
  const r = await enviar<{ ok: boolean; versao: string; configurada: boolean }>({ tipo: "ping" });
  return r?.ok ? { versao: r.versao, configurada: r.configurada } : null;
}

// Pede o texto da aba do HUB. Com vários pedidos abertos, o código ajuda a achar o certo
export async function lerAbaDoHub(codigo: string): Promise<LeituraDoHub> {
  const r = await enviar<LeituraDoHub>({ tipo: "ler-hub", codigo });
  return r ?? { ok: false, motivo: "sem-extensao" };
}

export const explicarFalhaDaLeitura: Record<Exclude<Extract<LeituraDoHub, { ok: false }>["motivo"], never>, string> = {
  configurar: "A extensão ainda não tem o endereço do HUB. Clique no ícone dela, informe o endereço do HUB e permita a leitura.",
  "sem-aba": "Não encontrei o HUB aberto neste navegador. Abra o pedido no HUB em outra aba e tente de novo.",
  vazia: "A página do HUB está vazia ou ainda carregando. Espere carregar e tente de novo.",
  erro: "A extensão não conseguiu ler a página do HUB. Recarregue a aba do HUB e tente de novo.",
  "sem-extensao": "Não consegui falar com a extensão. Confira se ela está instalada e ativa neste navegador.",
  "pedido-desconhecido": "A extensão instalada é antiga. Instale a versão mais recente.",
};
