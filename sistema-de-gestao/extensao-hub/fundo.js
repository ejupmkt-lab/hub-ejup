// Blimp: importar do HUB SEBRAE (extensão do navegador).
//
// Dois jeitos de trazer o que está no HUB, os dois sempre por ação da pessoa:
//  1. "Ler agora" no ícone da extensão: lê a página do HUB que está na tela (texto, quadros internos e
//     anexos), baixa os anexos com a sessão da própria pessoa e entrega tudo ao projeto aberto no Blimp.
//     Usa só a permissão "activeTab": o navegador libera a aba no clique, sem ficar com acesso ao HUB.
//  2. Pedido do Blimp (botão "Puxar da aba aberta do HUB"): só funciona nos sites que a pessoa permitiu
//     nas opções, e só o Blimp consegue pedir (ver "externally_connectable" no manifesto).
// Nada roda sozinho, nada é enviado fora do navegador pela extensão, e senha nenhuma é lida ou guardada.

const VERSAO = chrome.runtime.getManifest().version;
const ORIGEM_BLIMP = "https://sistema-de-gestao-alpha.vercel.app";
const LIMITE_TEXTO = 40000; // o Blimp aceita até 40.000 caracteres
const MAX_ARQUIVO = 10 * 1024 * 1024;
const MAX_TOTAL = 24 * 1024 * 1024;
const MAX_CANDIDATOS = 12;

const somenteDigitos = (t) => String(t ?? "").replace(/\D/g, "");

// ─── Funções que rodam DENTRO da página do HUB ─────────────────────────────────

// Texto + links de arquivos anexados da página
// (roda dentro da página: precisa ser autossuficiente, sem chamar outras funções deste arquivo)
function lerPagina() {
  // Texto visível, sem as linhas em branco repetidas
  const texto = (document.body?.innerText ?? "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l, i, a) => l || (a[i - 1] ?? "") !== "")
    .join("\n")
    .trim();
  const ehArquivo = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|csv|txt|png|jpe?g|webp|gif|zip)(?:[?#]|$)/i;
  const palavras = /(anexo|download|baixar|arquivo|documento|comprovante|proposta|diagn[oó]stico|relat[oó]rio|contrato|plano)/i;
  const vistos = new Set();
  const links = [];
  for (const a of document.querySelectorAll("a[href]")) {
    let url;
    try {
      url = new URL(a.getAttribute("href"), location.href);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol) || url.href === location.href || vistos.has(url.href)) continue;
    const rotulo = (a.innerText || a.getAttribute("title") || a.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
    const baixavel = a.hasAttribute("download") || ehArquivo.test(url.pathname + url.search) || (palavras.test(rotulo) && /download|arquivo|anexo|file|document/i.test(url.pathname + url.search));
    if (!baixavel) continue;
    vistos.add(url.href);
    links.push({ url: url.href, rotulo, nomeNoLink: a.getAttribute("download") || "" });
  }
  return { texto, links };
}

// Baixa um arquivo com a sessão da própria página (mesmo endereço, com cookies)
async function baixarNaPagina(url, limite) {
  try {
    const r = await fetch(url, { credentials: "include" });
    if (!r.ok) return { ok: false, motivo: `o HUB respondeu ${r.status}` };
    const tipo = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    // Sessão vencida ou página de login no lugar do arquivo
    if (tipo === "text/html") return { ok: false, motivo: "veio uma página no lugar do arquivo (sessão vencida?)" };
    const disposicao = r.headers.get("content-disposition") || "";
    const blob = await r.blob();
    if (blob.size > limite) return { ok: false, motivo: "passa de 10 MB" };
    const base64 = await new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(String(leitor.result).split(",")[1] ?? "");
      leitor.onerror = () => reject(new Error("leitura"));
      leitor.readAsDataURL(blob);
    });
    return { ok: true, tipo, tamanho: blob.size, disposicao, base64 };
  } catch {
    return { ok: false, motivo: "bloqueado", bloqueado: true };
  }
}

// ─── Lado da extensão ──────────────────────────────────────────────────────────

async function origensPermitidas() {
  const { origins = [] } = await chrome.permissions.getAll();
  return origins.filter((o) => o.startsWith("http"));
}

function padraoCasa(padrao, url) {
  try {
    return new URL(padrao.replace(/\/\*$/, "")).origin === new URL(url).origin;
  } catch {
    return false;
  }
}

const baseDe = (url) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() || "");
  } catch {
    return "";
  }
};

// Nome do arquivo: o do Content-Disposition, o do link ou o da última parte do endereço
function nomeDoArquivo(link, disposicao, tipo) {
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposicao || "");
  let nome = (m && decodeURIComponent(m[1])) || link.nomeNoLink || baseDe(link.url) || link.rotulo || "arquivo-do-hub";
  if (!/\.[a-z0-9]{2,5}$/i.test(nome)) nome += { "application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" }[tipo] ?? "";
  return nome.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120);
}

const TIPOS_GUARDADOS = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const tipoPeloNome = (nome) => ({ pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" })[(/\.([a-z0-9]+)$/i.exec(nome)?.[1] ?? "").toLowerCase()];

async function textoDeTodosOsQuadros(tabId) {
  const partes = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: lerPagina });
  const resultados = partes.map((p) => p.result).filter(Boolean);
  const texto = resultados.map((r) => r.texto).filter(Boolean).join("\n\n").trim();
  const links = [];
  for (const r of resultados) for (const l of r.links) if (!links.some((x) => x.url === l.url)) links.push(l);
  return { texto, links, quadros: partes.length };
}

// ─── Pedido do Blimp: lê a aba do HUB que a pessoa já permitiu ─────────────────

async function lerAbasPermitidas(origens, codigo) {
  const abas = (await chrome.tabs.query({})).filter((a) => a.id !== undefined && a.url && origens.some((o) => padraoCasa(o, a.url)));
  if (!abas.length) return { ok: false, motivo: "sem-aba" };
  abas.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
  const candidatas = [];
  for (const aba of abas.slice(0, 8)) {
    try {
      const { texto } = await textoDeTodosOsQuadros(aba.id);
      if (texto) candidatas.push({ aba, texto });
    } catch {
      // aba que não deixa ser lida: segue para a próxima
    }
  }
  if (!candidatas.length) return { ok: false, motivo: "vazia" };
  const alvo = (codigo && candidatas.find((c) => somenteDigitos(c.texto).includes(somenteDigitos(codigo)))) || candidatas[0];
  return {
    ok: true,
    texto: alvo.texto.slice(0, LIMITE_TEXTO),
    cortado: alvo.texto.length > LIMITE_TEXTO,
    titulo: alvo.aba.title ?? "",
    endereco: new URL(alvo.aba.url).origin,
    achouCodigo: !!codigo && somenteDigitos(alvo.texto).includes(somenteDigitos(codigo)),
  };
}

// ─── "Ler agora": a página que está na tela, com os anexos ─────────────────────

async function progresso(passo) {
  await chrome.storage.session.set({ progresso: { ...passo, em: Date.now() } }).catch(() => {});
}

async function lerAgora({ tabId, blimpTabId }) {
  // Mantém a extensão acordada durante downloads demorados
  const batida = setInterval(() => void chrome.runtime.getPlatformInfo(), 20000);
  try {
    const aba = await chrome.tabs.get(tabId);
    const hub = new URL(aba.url);
    await progresso({ etapa: "lendo", texto: "Lendo a página do HUB…" });
    const { texto, links, quadros } = await textoDeTodosOsQuadros(tabId);
    if (!texto && !links.length) return { ok: false, motivo: "vazia" };

    const arquivos = [];
    const falhas = [];
    const naoGuardados = [];
    let total = 0;
    const candidatos = links.slice(0, MAX_CANDIDATOS);
    if (links.length > MAX_CANDIDATOS) falhas.push({ nome: `${links.length - MAX_CANDIDATOS} outros links`, url: "", motivo: `passou do limite de ${MAX_CANDIDATOS} arquivos por leitura` });
    const permitidas = await origensPermitidas();

    for (const [i, link] of candidatos.entries()) {
      const rotulo = link.rotulo || baseDe(link.url) || link.url;
      await progresso({ etapa: "baixando", texto: `Baixando ${i + 1} de ${candidatos.length}: ${rotulo.slice(0, 60)}`, atual: i + 1, de: candidatos.length });
      let r;
      const mesmoSite = new URL(link.url).origin === hub.origin;
      // Outro endereço (ex.: armazenamento de arquivos): só com permissão dada antes
      if (!mesmoSite && permitidas.some((o) => padraoCasa(o, link.url))) {
        try {
          const resp = await fetch(link.url, { credentials: "include" });
          const tipo = (resp.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
          if (!resp.ok) r = { ok: false, motivo: `respondeu ${resp.status}` };
          else if (tipo === "text/html") r = { ok: false, motivo: "veio uma página no lugar do arquivo (sessão vencida?)" };
          else {
            const buf = new Uint8Array(await resp.arrayBuffer());
            if (buf.length > MAX_ARQUIVO) r = { ok: false, motivo: "passa de 10 MB" };
            else {
              let bin = "";
              for (let k = 0; k < buf.length; k += 0x8000) bin += String.fromCharCode(...buf.subarray(k, k + 0x8000));
              r = { ok: true, tipo, tamanho: buf.length, disposicao: resp.headers.get("content-disposition") || "", base64: btoa(bin) };
            }
          }
        } catch {
          r = { ok: false, motivo: "bloqueado", bloqueado: true };
        }
      } else {
        const [exec] = await chrome.scripting.executeScript({ target: { tabId }, func: baixarNaPagina, args: [link.url, MAX_ARQUIVO] });
        r = exec?.result ?? { ok: false, motivo: "sem resposta" };
      }
      if (!r.ok) {
        const outro = !mesmoSite ? new URL(link.url).origin : "";
        falhas.push({ nome: rotulo, url: link.url, motivo: r.bloqueado && outro ? "está em outro endereço, que o navegador bloqueia sem permissão" : r.motivo, origemBloqueada: r.bloqueado && outro ? outro : "" });
        continue;
      }
      const nome = nomeDoArquivo(link, r.disposicao, r.tipo);
      const tipo = TIPOS_GUARDADOS.includes(r.tipo) ? r.tipo : tipoPeloNome(nome);
      if (!tipo) {
        naoGuardados.push({ nome, tipo: (/\.([a-z0-9]{2,5})$/i.exec(nome)?.[1] ?? r.tipo ?? "desconhecido").toUpperCase() });
        continue;
      }
      if (total + r.tamanho > MAX_TOTAL) {
        falhas.push({ nome, url: link.url, motivo: "passou do limite total de 24 MB por leitura" });
        continue;
      }
      total += r.tamanho;
      arquivos.push({ nome, tipo, tamanho: r.tamanho, base64: r.base64, url: link.url });
    }

    const pendente = {
      id: crypto.randomUUID(),
      criadoEm: new Date().toISOString(),
      origem: { endereco: hub.origin, titulo: aba.title ?? "", url: `${hub.origin}${hub.pathname}` },
      texto: texto.slice(0, LIMITE_TEXTO),
      textoCortado: texto.length > LIMITE_TEXTO,
      quadros,
      arquivos,
      falhas,
      naoGuardados,
    };
    await chrome.storage.local.set({ pendente });

    // Avisa a aba do projeto no Blimp (só um aviso; os dados vão quando o Blimp pede)
    await progresso({ etapa: "entregando", texto: "Levando para o Blimp…" });
    await chrome.scripting.executeScript({ target: { tabId: blimpTabId }, func: (o) => window.postMessage({ tipo: "blimp-hub-pendente" }, o), args: [new URL((await chrome.tabs.get(blimpTabId)).url).origin] });
    await chrome.tabs.update(blimpTabId, { active: true });
    const jan = await chrome.tabs.get(blimpTabId);
    await chrome.windows.update(jan.windowId, { focused: true }).catch(() => {});
    await progresso({ etapa: "pronto", texto: "Pronto. A prévia está no Blimp." });
    return { ok: true, resumo: { arquivos: arquivos.length, falhas: falhas.length, naoGuardados: naoGuardados.length, quadros, caracteres: texto.length } };
  } catch (e) {
    return { ok: false, motivo: "erro", detalhe: String(e?.message ?? e) };
  } finally {
    clearInterval(batida);
  }
}

// ─── Mensagens ─────────────────────────────────────────────────────────────────

// Da própria extensão (a janelinha do ícone)
chrome.runtime.onMessage.addListener((pedido, remetente, responder) => {
  if (remetente.id !== chrome.runtime.id) return false;
  (async () => {
    if (pedido?.tipo === "ler-agora") return responder(await lerAgora(pedido));
    if (pedido?.tipo === "permitir-origem-feita") return responder({ ok: true });
    responder({ ok: false, motivo: "pedido-desconhecido" });
  })().catch((e) => responder({ ok: false, motivo: "erro", detalhe: String(e?.message ?? e) }));
  return true;
});

// Do Blimp (só a origem do Blimp, pelo manifesto)
chrome.runtime.onMessageExternal.addListener((pedido, _remetente, responder) => {
  (async () => {
    if (pedido?.tipo === "ping") return responder({ ok: true, versao: VERSAO, configurada: (await origensPermitidas()).some((o) => !padraoCasa(o, ORIGEM_BLIMP)) });
    if (pedido?.tipo === "ler-hub") {
      const origens = (await origensPermitidas()).filter((o) => !padraoCasa(o, ORIGEM_BLIMP));
      if (!origens.length) return responder({ ok: false, motivo: "configurar" });
      return responder(await lerAbasPermitidas(origens, pedido.codigo));
    }
    if (pedido?.tipo === "pegar") {
      const { pendente } = await chrome.storage.local.get("pendente");
      return responder(pendente ? { ok: true, pendente } : { ok: false, motivo: "nada" });
    }
    if (pedido?.tipo === "consumir") {
      const { pendente } = await chrome.storage.local.get("pendente");
      if (pendente && pendente.id === pedido.id) await chrome.storage.local.remove("pendente");
      return responder({ ok: true });
    }
    responder({ ok: false, motivo: "pedido-desconhecido" });
  })().catch((e) => responder({ ok: false, motivo: "erro", detalhe: String(e?.message ?? e) }));
  return true; // resposta assíncrona
});
