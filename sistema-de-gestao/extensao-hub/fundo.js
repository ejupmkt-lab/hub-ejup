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

// Texto, links de arquivos anexados e o que só aparece ao passar o mouse (balões sobre ícones e iniciais)
// (roda dentro da página: precisa ser autossuficiente, sem chamar outras funções deste arquivo)
async function lerPagina(passarMouse) {
  const normalizar = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
  const linhasDaPagina = () => (document.body?.innerText ?? "").split("\n").map(normalizar).filter(Boolean);
  // Texto visível, sem as linhas em branco repetidas
  const texto = (document.body?.innerText ?? "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l, i, a) => l || (a[i - 1] ?? "") !== "")
    .join("\n")
    .trim();

  // ── Links de arquivos
  const ehArquivo = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|csv|txt|png|jpe?g|webp|gif|zip)(?:[?#]|$)/i;
  const palavras = /(anexo|download|baixar|arquivo|documento|comprovante|proposta|diagn[oó]stico|relat[oó]rio|contrato|plano|recibo|atesto|nota)/i;
  const caminhoDeArquivo = /(download|baixar|arquivo|anexo|attachment|document|file|blob|storage|upload)/i;
  const vistos = new Set();
  const links = [];
  let linksIgnorados = 0;
  for (const a of document.querySelectorAll("a[href]")) {
    let url;
    try {
      url = new URL(a.getAttribute("href"), location.href);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol) || url.href === location.href || vistos.has(url.href)) continue;
    // O nome pode estar no texto do link ou na linha ao lado (ícone de download sem texto)
    const linha = a.closest("li, tr, [class*=item], [class*=row], [class*=linha]");
    const rotuloProprio = (a.innerText || a.getAttribute("title") || a.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
    const rotuloDaLinha = (linha?.innerText ?? "").split("\n").map((l) => l.trim()).find(Boolean) ?? "";
    const rotulo = rotuloProprio || rotuloDaLinha;
    const caminho = url.pathname + url.search;
    const baixavel =
      a.hasAttribute("download") ||
      ehArquivo.test(caminho) ||
      (palavras.test(rotulo) && caminhoDeArquivo.test(caminho)) ||
      (!rotuloProprio && !!linha && caminhoDeArquivo.test(caminho));
    if (!baixavel) {
      linksIgnorados++;
      continue;
    }
    vistos.add(url.href);
    links.push({ url: url.href, rotulo, nomeNoLink: a.getAttribute("download") || "" });
  }
  // Botões de download que não têm endereço: o navegador só baixa clicando, e a extensão não clica
  const botoesSemEndereco = [...document.querySelectorAll("button, [role=button]")].filter((b) =>
    /download|baixar/i.test(`${b.getAttribute("title") ?? ""} ${b.getAttribute("aria-label") ?? ""} ${b.className ?? ""} ${b.innerText ?? ""}`),
  ).length;

  // ── Balões: o texto de title/tooltip e o que aparece ao passar o mouse sobre ícones e iniciais
  const passeios = [];
  const diag = { linksIgnorados, botoesSemEndereco, candidatosAoPassarMouse: 0 };
  if (passarMouse) {
    const atributos = ["title", "data-tooltip", "data-original-title", "data-bs-original-title", "mattooltip", "ngbtooltip", "data-tippy-content"];
    for (const el of document.querySelectorAll(atributos.map((a) => `[${a}]`).join(","))) {
      const valor = atributos.map((a) => normalizar(el.getAttribute(a))).find((v) => v.length > 2);
      if (valor && passeios.length < 40) passeios.push({ rotulo: normalizar(el.innerText).slice(0, 30), linhas: [valor.slice(0, 200)] });
    }
    // Iniciais em círculo (MN, LN, TC) e gatilhos de tooltip: passa o mouse e vê o que apareceu
    const candidatos = [];
    const gatilhos = "[data-toggle=tooltip],[data-bs-toggle=tooltip],[data-bs-toggle=popover],[data-toggle=popover],[mattooltip],[ngbtooltip],[data-tippy-content],[aria-haspopup=true],[aria-describedby]";
    for (const e of document.querySelectorAll(`*, ${gatilhos}`)) {
      if (!(e instanceof HTMLElement) || candidatos.includes(e)) continue;
      const curto = e.children.length <= 2 && (e.textContent ?? "").trim().length <= 4 && (e.textContent ?? "").trim().length > 0;
      const gatilho = e.matches(gatilhos);
      if (!curto && !gatilho) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 14 || r.height < 14 || r.width > 120 || r.height > 120) continue;
      if (curto && !gatilho) {
        const raio = parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0;
        const t = normalizar(e.textContent);
        if (!(raio >= Math.min(r.width, r.height) * 0.3) || !/^\p{L}{1,3}$/u.test(t)) continue;
      }
      candidatos.push(e);
      if (candidatos.length >= 24) break;
    }
    diag.candidatosAoPassarMouse = candidatos.length;
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    const disparar = (el, tipos, x, y) => {
      for (const t of tipos) {
        const base = { bubbles: !/enter|leave/.test(t), cancelable: true, view: window, clientX: x, clientY: y };
        el.dispatchEvent(t.startsWith("pointer") ? new PointerEvent(t, { ...base, pointerType: "mouse" }) : new MouseEvent(t, base));
      }
    };
    for (const el of candidatos) {
      const base = new Set(linhasDaPagina());
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      disparar(el, ["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove"], x, y);
      await esperar(350);
      const novas = linhasDaPagina().filter((l) => !base.has(l) && l.length < 300).slice(0, 14);
      disparar(el, ["mousemove", "pointerout", "pointerleave", "mouseout", "mouseleave"], x + 400, y + 400);
      await esperar(120);
      if (novas.length) passeios.push({ rotulo: normalizar(el.innerText).slice(0, 30), linhas: novas });
    }
  }
  return { texto, links, passeios, diag };
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

async function textoDeTodosOsQuadros(tabId, passarMouse = false) {
  const partes = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: lerPagina, args: [passarMouse] });
  const resultados = partes.map((p) => p.result).filter(Boolean);
  const links = [];
  for (const r of resultados) for (const l of r.links) if (!links.some((x) => x.url === l.url)) links.push(l);
  // Balões: "LN: Cliente: … CNPJ: …" (sem repetir o que já está na página)
  const balao = [];
  const jaNaPagina = resultados.map((r) => r.texto).join("\n");
  for (const r of resultados)
    for (const p of r.passeios) {
      const linhas = p.linhas.filter((l) => !jaNaPagina.includes(l) || p.linhas.length > 1);
      const item = `${p.rotulo ? `[${p.rotulo}] ` : ""}${linhas.join(" | ")}`;
      if (linhas.length && !balao.includes(item)) balao.push(item);
    }
  const secaoBalao = balao.length ? `\n\n[Informações que aparecem ao passar o mouse sobre ícones e iniciais da página]\n${balao.join("\n")}` : "";
  const textoPagina = resultados.map((r) => r.texto).filter(Boolean).join("\n\n").trim();
  const diag = resultados.reduce(
    (d, r) => ({ linksIgnorados: d.linksIgnorados + r.diag.linksIgnorados, botoesSemEndereco: d.botoesSemEndereco + r.diag.botoesSemEndereco, candidatosAoPassarMouse: d.candidatosAoPassarMouse + r.diag.candidatosAoPassarMouse }),
    { linksIgnorados: 0, botoesSemEndereco: 0, candidatosAoPassarMouse: 0 },
  );
  return { texto: textoPagina + secaoBalao, textoPagina, secaoBalao, balaos: balao.length, links, quadros: partes.length, diag };
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
    await progresso({ etapa: "lendo", texto: "Lendo a página do HUB e passando o mouse nos ícones…" });
    const { texto, textoPagina, secaoBalao, balaos, links, quadros, diag } = await textoDeTodosOsQuadros(tabId, true);
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
      // Os balões vão inteiros; o corte, se houver, é no texto da página
      texto: textoPagina.slice(0, Math.max(2000, LIMITE_TEXTO - secaoBalao.length)) + secaoBalao,
      textoCortado: texto.length > LIMITE_TEXTO,
      quadros,
      balaos,
      diag: { ...diag, linksAchados: links.length },
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
    return { ok: true, resumo: { arquivos: arquivos.length, falhas: falhas.length, naoGuardados: naoGuardados.length, quadros, caracteres: texto.length, balaos, diag: { ...diag, linksAchados: links.length } } };
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
