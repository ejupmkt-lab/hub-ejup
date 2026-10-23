// Blimp: importar do HUB SEBRAE.
// O Blimp (e só ele, ver "externally_connectable" no manifesto) pede o conteúdo da página
// do pedido que está aberta no HUB. A extensão só lê sites que a pessoa permitiu na tela de
// opções, só quando o Blimp pede, e nunca guarda nem envia nada por conta própria.

const VERSAO = chrome.runtime.getManifest().version;
const LIMITE = 40000; // o Blimp aceita até 40.000 caracteres

const somenteDigitos = (t) => String(t ?? "").replace(/\D/g, "");

// Texto visível da página, sem as linhas em branco repetidas
function textoDaPagina() {
  return (document.body?.innerText ?? "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l, i, a) => l || (a[i - 1] ?? "") !== "")
    .join("\n")
    .trim();
}

async function origensPermitidas() {
  const { origins = [] } = await chrome.permissions.getAll();
  return origins.filter((o) => o.startsWith("http"));
}

async function lerAbas(origens, codigo) {
  const abas = (await chrome.tabs.query({})).filter((a) => a.id !== undefined && a.url && origens.some((o) => padraoCasa(o, a.url)));
  if (!abas.length) return { ok: false, motivo: "sem-aba" };
  // A aba usada há menos tempo primeiro
  abas.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
  const candidatas = [];
  for (const aba of abas.slice(0, 8)) {
    try {
      const partes = await chrome.scripting.executeScript({ target: { tabId: aba.id, allFrames: true }, func: textoDaPagina });
      const texto = partes.map((p) => p.result).filter(Boolean).join("\n\n").trim();
      if (texto) candidatas.push({ aba, texto });
    } catch {
      // aba que não deixa ser lida (página interna, ainda carregando): segue para a próxima
    }
  }
  if (!candidatas.length) return { ok: false, motivo: "vazia" };
  const alvo = (codigo && candidatas.find((c) => somenteDigitos(c.texto).includes(somenteDigitos(codigo)))) || candidatas[0];
  return { ok: true, texto: alvo.texto.slice(0, LIMITE), cortado: alvo.texto.length > LIMITE, titulo: alvo.aba.title ?? "", endereco: new URL(alvo.aba.url).origin, achouCodigo: !!codigo && somenteDigitos(alvo.texto).includes(somenteDigitos(codigo)) };
}

// "https://hub.exemplo.com/*" casa com o endereço da aba
function padraoCasa(padrao, url) {
  try {
    const base = padrao.replace(/\/\*$/, "");
    return new URL(url).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

chrome.runtime.onMessageExternal.addListener((pedido, _remetente, responder) => {
  (async () => {
    if (pedido?.tipo === "ping") return responder({ ok: true, versao: VERSAO, configurada: (await origensPermitidas()).length > 0 });
    if (pedido?.tipo === "ler-hub") {
      const origens = await origensPermitidas();
      if (!origens.length) return responder({ ok: false, motivo: "configurar" });
      return responder(await lerAbas(origens, pedido.codigo));
    }
    responder({ ok: false, motivo: "pedido-desconhecido" });
  })().catch((e) => responder({ ok: false, motivo: "erro", detalhe: String(e?.message ?? e) }));
  return true; // resposta assíncrona
});
