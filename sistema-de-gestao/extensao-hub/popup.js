// A janelinha do ícone: "Ler agora" lê a página do HUB que está na tela e leva para o projeto aberto no Blimp.
const ORIGEM_BLIMP = "https://sistema-de-gestao-alpha.vercel.app";
const el = (id) => document.getElementById(id);
const botao = el("ler");
let abaHub = null;
let abaBlimp = null;
let abaNovo = null;
let acompanhando = null;
let ultimoDiagnostico = null;

const dizer = (texto, classe = "") => {
  el("estado").textContent = texto;
  el("estado").className = classe;
};

async function preparar() {
  const [ativa] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const blimps = (await chrome.tabs.query({ url: `${ORIGEM_BLIMP}/*` })).filter((a) => /\/projetos\/(prj-|novo)/.test(a.url ?? ""));
  blimps.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
  abaBlimp = blimps[0] ?? null;
  abaNovo = blimps.find((a) => /\/projetos\/novo/.test(a.url ?? "")) ?? null;
  const url = ativa?.url ?? "";
  if (!ativa || !/^https?:/.test(url)) {
    el("onde").textContent = "Abra a página do pedido no HUB nesta aba e clique de novo.";
    return;
  }
  if (url.startsWith(ORIGEM_BLIMP)) {
    el("onde").textContent = "Esta é a aba do Blimp. Vá para a aba do HUB (a página que você quer ler) e clique de novo.";
    return;
  }
  abaHub = ativa;
  if (!abaBlimp) {
    el("onde").textContent = "Falta abrir o Blimp. Abra o projeto (ou a tela Novo projeto, para criar um) numa aba do Blimp, volte a esta página do HUB e clique de novo.";
    return;
  }
  el("onde").textContent = `Vai ler “${(ativa.title || new URL(url).host).slice(0, 60)}” e levar para o Blimp (projeto aberto ou tela Novo projeto).`;
  botao.disabled = false;
  el("lote").disabled = !abaNovo;
  el("ondeLote").textContent = abaNovo
    ? "Na lista de projetos do HUB (a lista com todos os pedidos), leio cada pedido: abro, leio, baixo os anexos e volto. Os projetos aparecem na tela Novo projeto do Blimp."
    : "Para ler todos os pedidos da lista, abra a tela Novo projeto numa aba do Blimp e volte à lista do HUB.";
}

// Mostra o andamento enquanto a extensão trabalha em segundo plano
function acompanhar() {
  acompanhando = setInterval(async () => {
    const { progresso } = await chrome.storage.session.get("progresso");
    if (progresso) dizer(progresso.texto);
  }, 300);
}

function mostrarResultado(r) {
  el("detalhes").replaceChildren();
  el("acoes").replaceChildren();
  if (!r.ok) {
    const motivo = { vazia: "A página está vazia ou ainda carregando. Espere carregar e tente de novo." }[r.motivo] ?? `Não consegui ler: ${r.detalhe ?? r.motivo}`;
    return dizer(motivo, "erro");
  }
  const { arquivos, caracteres, balaos, diag } = r.resumo;
  dizer(`Pronto: li a página (${caracteres.toLocaleString("pt-BR")} caracteres) e baixei ${arquivos} ${arquivos === 1 ? "arquivo" : "arquivos"}. Confira a prévia no Blimp.`, "ok");
  ultimoDiagnostico = r.resumo.diag ?? null;
  if (ultimoDiagnostico) {
    const b = document.createElement("button");
    b.className = "sec";
    b.textContent = "Copiar diagnóstico da leitura";
    b.addEventListener("click", async () => {
      await navigator.clipboard.writeText(JSON.stringify({ versao: chrome.runtime.getManifest().version, ...r.resumo }, null, 1));
      b.textContent = "Copiado";
    });
    el("acoes").append(b);
  }
  const cliques = r.resumo.diag?.cliques ?? [];
  const bons = cliques.filter((c) => c.gerou);
  if (bons.length) item(`Cliquei em ${bons.length} ${bons.length === 1 ? "botão" : "botões"} de download e baixei os arquivos (${bons.map((c) => (c.etapa ? `etapa ${String(c.etapa).padStart(2, "0")}` : c.rotulo)).join(", ")}).`);
  for (const c of cliques.filter((x) => !x.gerou)) item(`O botão de download de ${c.etapa ? `etapa ${String(c.etapa).padStart(2, "0")}` : `“${c.rotulo}”`} não gerou arquivo (${c.erro || "sem arquivo"}).`);
  if (balaos) item(`Li ${balaos} ${balaos === 1 ? "balão" : "balões"} que só aparecem ao passar o mouse.`);
  if (diag?.botoesSemEndereco && !(r.resumo.diag?.cliques ?? []).some((c) => c.gerou)) item(`${diag.botoesSemEndereco} ${diag.botoesSemEndereco === 1 ? "botão de download não tem" : "botões de download não têm"} endereço para eu baixar. O que está listado vai para o histórico do projeto.`);
  for (const f of r.falhas ?? []) item(`Não baixei “${f.nome}”: ${f.motivo}.`);
  for (const n of r.naoGuardados ?? []) item(`“${n.nome}” (${n.tipo}) não é PDF nem imagem, então não foi guardado.`);
  const origens = [...new Set((r.falhas ?? []).map((f) => f.origemBloqueada).filter(Boolean))];
  for (const o of origens) {
    const b = document.createElement("button");
    b.className = "sec";
    b.textContent = `Permitir baixar de ${new URL(o).host} e ler de novo`;
    b.addEventListener("click", async () => {
      const deu = await chrome.permissions.request({ origins: [`${o}/*`] });
      if (deu) iniciar();
      else dizer("A permissão não foi dada.", "erro");
    });
    el("acoes").append(b);
  }
}

function item(texto) {
  const li = document.createElement("li");
  li.textContent = texto;
  el("detalhes").append(li);
}

async function iniciar() {
  botao.disabled = true;
  el("detalhes").replaceChildren();
  el("acoes").replaceChildren();
  dizer("Lendo…");
  acompanhar();
  try {
    const r = await chrome.runtime.sendMessage({ tipo: "ler-agora", tabId: abaHub.id, blimpTabId: abaBlimp.id });
    mostrarResultado(r ?? { ok: false, motivo: "erro", detalhe: "sem resposta" });
  } finally {
    clearInterval(acompanhando);
    botao.disabled = false;
  }
}

async function iniciarLote() {
  botao.disabled = true;
  el("lote").disabled = true;
  el("parar").style.display = "block";
  el("parar").disabled = false;
  el("parar").textContent = "Parar depois do pedido atual";
  el("detalhes").replaceChildren();
  el("acoes").replaceChildren();
  try {
    // O navegador pede a permissão uma vez: com ela, a extensão abre cada pedido sem perder o acesso à página
    const origem = `${new URL(abaHub.url).origin}/*`;
    if (!(await chrome.permissions.contains({ origins: [origem] })) && !(await chrome.permissions.request({ origins: [origem] }))) {
      return dizer("Sem a permissão para este endereço do HUB não consigo abrir um pedido depois do outro.", "erro");
    }
    dizer("Procurando os pedidos da lista…");
    acompanhar();
    const r = await chrome.runtime.sendMessage({ tipo: "ler-lote", tabId: abaHub.id, blimpTabId: abaNovo.id });
    mostrarLote(r ?? { ok: false, motivo: "erro", detalhe: "sem resposta" });
  } finally {
    clearInterval(acompanhando);
    el("parar").style.display = "none";
    botao.disabled = false;
    el("lote").disabled = !abaNovo;
  }
}

function mostrarLote(r) {
  el("detalhes").replaceChildren();
  el("acoes").replaceChildren();
  // Para quem mantém o Blimp ajustar a leitura da lista: como cada linha foi achada e por onde a extensão andou
  const b = document.createElement("button");
  b.className = "sec";
  b.textContent = "Copiar diagnóstico da leitura";
  b.addEventListener("click", async () => {
    await navigator.clipboard.writeText(JSON.stringify({ versao: chrome.runtime.getManifest().version, ...r }, null, 1));
    b.textContent = "Copiado";
  });
  el("acoes").append(b);
  if (!r.ok) {
    const motivo =
      r.motivo === "sem-lista"
        ? "Não achei a lista de pedidos nesta página. Abra a lista de projetos do HUB (a que mostra todos os pedidos) e tente de novo."
        : r.motivo === "nenhum"
          ? "Não consegui ler nenhum pedido da lista."
          : `Não consegui ler: ${r.detalhe ?? r.motivo}`;
    dizer(motivo, "erro");
    for (const p of r.problemas ?? []) item(`${p.codigo ? `Pedido ${p.codigo}: ` : ""}${p.motivo}.`);
    return;
  }
  dizer(`Pronto: li ${r.lidos} de ${r.total} ${r.total === 1 ? "pedido" : "pedidos"}${r.interrompido ? " (parei a pedido seu)" : ""}. Confira no Blimp, na tela Novo projeto.`, "ok");
  for (const p of r.problemas ?? []) item(`${p.codigo ? `Pedido ${p.codigo}: ` : ""}${p.motivo}.`);
}

botao.addEventListener("click", iniciar);
el("lote").addEventListener("click", iniciarLote);
el("parar").addEventListener("click", async () => {
  await chrome.storage.session.set({ cancelar: true });
  el("parar").disabled = true;
  el("parar").textContent = "Parando…";
});
el("opcoes").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
const salvarOpcoes = async (mudanca) => {
  const { opcoes } = await chrome.storage.local.get("opcoes");
  await chrome.storage.local.set({ opcoes: { ...opcoes, ...mudanca } });
};
chrome.storage.local.get("opcoes").then(({ opcoes }) => {
  el("clicar").checked = opcoes?.clicar !== false;
  el("real").checked = !!opcoes?.real;
});
el("clicar").addEventListener("change", () => salvarOpcoes({ clicar: el("clicar").checked }));
// Mouse de verdade: só liga a opção (a permissão do depurador já vem com a extensão)
el("real").addEventListener("change", () => salvarOpcoes({ real: el("real").checked }));
preparar();
