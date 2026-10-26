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

function enviar<T>(mensagem: unknown, limiteMs = 15000): Promise<T | null> {
  return new Promise((resolver) => {
    const c = (globalThis as unknown as { chrome?: Chrome }).chrome;
    if (!c?.runtime?.sendMessage) return resolver(null);
    const limite = setTimeout(() => resolver(null), limiteMs);
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

// O que a extensão leu quando a pessoa clicou em "Ler agora" no ícone dela
export type PendenteDoHub = {
  id: string;
  criadoEm: string;
  origem: { endereco: string; titulo: string; url: string };
  texto: string;
  textoCortado: boolean;
  quadros: number;
  arquivos: { nome: string; tipo: string; tamanho: number; base64: string; url: string; etapa?: number }[];
  falhas: { nome: string; url: string; motivo: string; origemBloqueada?: string }[];
  naoGuardados: { nome: string; tipo: string }[];
  // O que a extensão fez na página: cliques nos botões de download (etapa, rótulo, quantos arquivos gerou, erro)
  diag?: { linksAchados?: number; cliques?: { etapa: number; rotulo: string; motivo: string; gerou: number; erro: string }[] };
};

// A extensão avisa a aba do Blimp com esta mensagem; os dados vêm quando o Blimp pede
export const AVISO_DA_EXTENSAO = "blimp-hub-pendente";

export async function pegarPendente() {
  const r = await enviar<{ ok: boolean; pendente?: PendenteDoHub }>({ tipo: "pegar" });
  return r?.ok && r.pendente ? r.pendente : null;
}
export async function consumirPendente(id: string) {
  await enviar({ tipo: "consumir", id });
}

// "Ler todos os projetos da lista": a extensão lê os pedidos um a um e guarda o lote; o Blimp pede o resumo
// e, depois, um pedido de cada vez (com os arquivos)
export type ItemDoLote = { id: string; codigo: string; titulo: string; linha: string; arquivos: number; falhas: number; caracteres: number; status: string };
export type LoteDoHub = {
  id: string;
  criadoEm: string;
  origem: { endereco: string; url: string };
  total: number;
  interrompido: boolean;
  problemas: { codigo: string; motivo: string }[];
  itens: ItemDoLote[];
};
export const AVISO_DO_LOTE = "blimp-hub-lote";

export async function pegarLote() {
  const r = await enviar<{ ok: boolean; lote?: LoteDoHub }>({ tipo: "pegar-lote" });
  return r?.ok && r.lote ? r.lote : null;
}
export async function pegarItemDoLote(id: string) {
  const r = await enviar<{ ok: boolean; pendente?: PendenteDoHub }>({ tipo: "pegar-item", id }, 60000);
  return r?.ok && r.pendente ? r.pendente : null;
}
export async function consumirItemDoLote(id: string) {
  await enviar({ tipo: "consumir-item", id });
}
export async function descartarLote() {
  await enviar({ tipo: "descartar-lote" });
}

export function arquivoDoPendente(a: PendenteDoHub["arquivos"][number]) {
  const bin = atob(a.base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], a.nome, { type: a.tipo });
}

export const explicarFalhaDaLeitura: Record<Exclude<Extract<LeituraDoHub, { ok: false }>["motivo"], never>, string> = {
  configurar: "A extensão ainda não tem o endereço do HUB. Clique no ícone dela, informe o endereço do HUB e permita a leitura.",
  "sem-aba": "Não encontrei o HUB aberto neste navegador. Abra o pedido no HUB em outra aba e tente de novo.",
  vazia: "A página do HUB está vazia ou ainda carregando. Espere carregar e tente de novo.",
  erro: "A extensão não conseguiu ler a página do HUB. Recarregue a aba do HUB e tente de novo.",
  "sem-extensao": "Não consegui falar com a extensão. Confira se ela está instalada e ativa neste navegador.",
  "pedido-desconhecido": "A extensão instalada é antiga. Instale a versão mais recente.",
};
