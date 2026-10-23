// A janelinha do ícone: "Ler agora" lê a página do HUB que está na tela e leva para o projeto aberto no Blimp.
const ORIGEM_BLIMP = "https://sistema-de-gestao-alpha.vercel.app";
const el = (id) => document.getElementById(id);
const botao = el("ler");
let abaHub = null;
let abaBlimp = null;
let acompanhando = null;

const dizer = (texto, classe = "") => {
  el("estado").textContent = texto;
  el("estado").className = classe;
};

async function preparar() {
  const [ativa] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const blimps = (await chrome.tabs.query({ url: `${ORIGEM_BLIMP}/*` })).filter((a) => /\/projetos\/(prj-|novo)/.test(a.url ?? ""));
  blimps.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
  abaBlimp = blimps[0] ?? null;
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
  const { arquivos, caracteres } = r.resumo;
  dizer(`Pronto: li a página (${caracteres.toLocaleString("pt-BR")} caracteres) e baixei ${arquivos} ${arquivos === 1 ? "arquivo" : "arquivos"}. Confira a prévia no Blimp.`, "ok");
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

botao.addEventListener("click", iniciar);
el("opcoes").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
preparar();
