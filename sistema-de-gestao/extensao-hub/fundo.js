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
  // A que etapa do serviço o link pertence: o cartão mais próximo que cita só uma "ETAPA 0N"
  const etapaDoElemento = (el) => {
    let atual = el;
    for (let i = 0; i < 10 && atual; i++, atual = atual.parentElement) {
      const numeros = new Set([...(atual.innerText ?? "").matchAll(/ETAPA\s*0?(\d{1,2})\b/gi)].map((m) => Number(m[1])));
      if (numeros.size === 1) return [...numeros][0];
      if (numeros.size > 1) return 0;
    }
    return 0;
  };
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
    links.push({ url: url.href, rotulo, nomeNoLink: a.getAttribute("download") || "", etapa: etapaDoElemento(a) });
  }
  // Botões de download que não têm endereço: o navegador só baixa clicando, e a extensão não clica
  const botoesSemEndereco = [...document.querySelectorAll("button, [role=button]")].filter((b) =>
    /download|baixar/i.test(`${b.getAttribute("title") ?? ""} ${b.getAttribute("aria-label") ?? ""} ${b.className ?? ""} ${b.innerText ?? ""}`),
  ).length;

  // ── Balões: o texto de title/tooltip e o que aparece ao passar o mouse sobre ícones e iniciais
  const passeios = [];
  const diag = { linksIgnorados, botoesSemEndereco, candidatosAoPassarMouse: 0, amostras: [] };
  // Amostra da estrutura dos botões de download e links sem texto (sem conteúdo da página), para entender o que não deu para baixar
  const descrever = (el) => {
    const cadeia = [];
    for (let p = el, i = 0; p && i < 4; p = p.parentElement, i++) cadeia.push(`${p.tagName.toLowerCase()}${p.className && typeof p.className === "string" ? "." + p.className.trim().split(/\s+/).slice(0, 3).join(".") : ""}`);
    let href = "";
    try {
      const u = new URL(el.getAttribute("href") ?? "", location.href);
      href = el.getAttribute("href") ? `${u.origin}${u.pathname}${u.search ? "?…" : ""}` : "";
    } catch {
      href = "";
    }
    return {
      tag: el.tagName.toLowerCase(),
      href,
      classe: String(el.className ?? "").slice(0, 80),
      title: normalizar(el.getAttribute("title")).slice(0, 40),
      ariaLabel: normalizar(el.getAttribute("aria-label")).slice(0, 40),
      temOnclick: el.hasAttribute("onclick") || [...el.attributes].some((a) => /^(\(click\)|@click|v-on:click|ng-click|data-action)/.test(a.name)),
      atributosData: [...el.attributes].map((a) => a.name).filter((n) => /^(data-|\(|@|ng-|v-)/.test(n)).slice(0, 6),
      temIcone: !!el.querySelector("svg, img, i, mat-icon"),
      cadeia,
    };
  };
  for (const el of document.querySelectorAll("a, button, [role=button]")) {
    if (diag.amostras.length >= 8) break;
    const texto = normalizar(el.innerText);
    const dica = `${el.getAttribute("title") ?? ""} ${el.getAttribute("aria-label") ?? ""} ${el.className ?? ""}`;
    if (/download|baixar|file_download|arrow_downward/i.test(dica) || (!texto && el.querySelector("svg, img, i, mat-icon") && el.closest("li, tr, [class*=item], [class*=doc]")))
      diag.amostras.push(descrever(el));
  }
  if (passarMouse) {
    const atributos = ["title", "data-tooltip", "data-original-title", "data-bs-original-title", "mattooltip", "ngbtooltip", "data-tippy-content"];
    for (const el of document.querySelectorAll(atributos.map((a) => `[${a}]`).join(","))) {
      const valor = atributos.map((a) => normalizar(el.getAttribute(a))).find((v) => v.length > 2);
      if (valor && passeios.length < 40) passeios.push({ rotulo: normalizar(el.innerText).slice(0, 30), linhas: [valor.slice(0, 200)] });
    }
    // Quem aparece em círculo (a foto e as iniciais dos "Envolvidos": cliente, gestor do SEBRAE, consultor) e os gatilhos
    // de balão: passa o mouse e vê o que apareceu. As fotos e iniciais vêm primeiro, para não ficarem fora do limite.
    const candidatos = [];
    const circulo = (e) => {
      const r = e.getBoundingClientRect();
      if (r.width < 20 || r.height < 20 || r.width > 96 || r.height > 96) return false;
      if (Math.abs(r.width - r.height) > Math.max(6, r.width * 0.18)) return false;
      const cs = getComputedStyle(e);
      const raio = parseFloat(cs.borderTopLeftRadius) || 0;
      return raio >= Math.min(r.width, r.height) * 0.4 || /50%|9999|999px/.test(cs.borderTopLeftRadius);
    };
    const eAvatar = (e) => {
      if (!(e instanceof HTMLElement) || !circulo(e)) return false;
      // O texto que se vê (o balão escondido dentro do círculo não conta)
      const t = normalizar(e.innerText);
      if (e instanceof HTMLImageElement) return true;
      if (e.querySelector("img") && !t) return true;
      return /^\p{L}{1,3}$/u.test(t) && e.children.length <= 2;
    };
    const eixos = [];
    for (const e of document.querySelectorAll("img, div, span, a, button, li, figure")) if (eAvatar(e)) eixos.push(e);
    // Fica o elemento mais externo de cada círculo (o balão costuma ser ligado nele)
    for (const e of eixos) if (!eixos.some((o) => o !== e && o.contains(e) && circulo(o))) candidatos.push(e);
    const gatilhos = "[data-toggle=tooltip],[data-bs-toggle=tooltip],[data-bs-toggle=popover],[data-toggle=popover],[mattooltip],[ngbtooltip],[ngbPopover],[data-tippy-content],[aria-haspopup=true],[aria-describedby]";
    for (const e of document.querySelectorAll(gatilhos)) {
      if (!(e instanceof HTMLElement) || candidatos.includes(e) || candidatos.length >= 60) continue;
      const r = e.getBoundingClientRect();
      if (r.width >= 14 && r.height >= 14 && r.width <= 120 && r.height <= 120) candidatos.push(e);
    }
    // Botões só com ícone (informações, enviar, baixar): o balão aparece ao passar o mouse
    for (const e of document.querySelectorAll("button, a, [role=button]")) {
      if (!(e instanceof HTMLElement) || candidatos.includes(e) || candidatos.length >= 60) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 14 || r.height < 14 || r.width > 64 || r.height > 64 || normalizar(e.innerText)) continue;
      if (e.querySelector("svg, img, i, mat-icon")) candidatos.push(e);
    }
    diag.candidatosAoPassarMouse = candidatos.length;
    diag.avatares = candidatos.filter(eAvatar).length;
    const rotuloDe = (el) =>
      normalizar(el.innerText) || normalizar(el.getAttribute("alt") || el.getAttribute("title") || el.querySelector("img")?.getAttribute("alt") || "") || (eAvatar(el) ? "foto" : "");
    // Só marcar: quem passa o mouse é a extensão, com o mouse de verdade (depurador do navegador)
    if (passarMouse === "coletar") {
      const coletados = candidatos.map((el, i) => {
        el.setAttribute("data-blimp-mouse", String(i));
        return { i, rotulo: rotuloDe(el).slice(0, 30), longo: eAvatar(el) || el.matches(gatilhos) };
      });
      return { texto, links, passeios, diag, coletados };
    }
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    // Balões desenhados pela página (Bootstrap, Material, tippy…): o texto deles, mesmo quando já havia outro texto igual na página
    const seletorBalao = "[role=tooltip],.tooltip,.popover,.mat-tooltip,.mat-mdc-tooltip,.mdc-tooltip__surface,.cdk-overlay-pane,.tippy-box,.ngb-tooltip,[class*=tooltip],[class*=popover],[class*=Tooltip],[class*=Popover]";
    const balaosVisiveis = () => {
      const lista = [];
      for (const b of document.querySelectorAll(seletorBalao)) {
        if (!(b instanceof HTMLElement)) continue;
        const r = b.getBoundingClientRect();
        const cs = getComputedStyle(b);
        if (r.width < 8 || r.height < 8 || cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
        for (const l of (b.innerText ?? "").split("\n").map(normalizar).filter(Boolean)) if (l.length < 300 && !lista.includes(l)) lista.push(l);
      }
      return lista;
    };
    const disparar = (el, tipos, x, y) => {
      // Do mais externo ao elemento: o balão pode estar ligado a um pai, e "mouseenter" não sobe sozinho
      const cadeia = [];
      for (let a = el, i = 0; a && i < 3 && a !== document.body; a = a.parentElement, i++) cadeia.unshift(a);
      for (const alvo of cadeia)
        for (const t of tipos) {
          if (t === "focus" || t === "focusin" || t === "blur" || t === "focusout") {
            if (alvo === el) alvo.dispatchEvent(new FocusEvent(t, { bubbles: t === "focusin" || t === "focusout", cancelable: false, view: window }));
            continue;
          }
          const base = { bubbles: !/enter|leave/.test(t), cancelable: true, view: window, clientX: x, clientY: y };
          alvo.dispatchEvent(t.startsWith("pointer") ? new PointerEvent(t, { ...base, pointerType: "mouse" }) : new MouseEvent(t, base));
        }
    };
    for (const el of candidatos) {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
      const antes = new Set(linhasDaPagina());
      const antesBalao = new Set(balaosVisiveis());
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      disparar(el, ["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove", "focus", "focusin"], x, y);
      await esperar(eAvatar(el) || el.matches(gatilhos) ? 750 : 420);
      const novas = [...new Set([...balaosVisiveis().filter((l) => !antesBalao.has(l)), ...linhasDaPagina().filter((l) => !antes.has(l) && l.length < 300)])].slice(0, 14);
      disparar(el, ["mousemove", "pointerout", "pointerleave", "mouseout", "mouseleave", "blur", "focusout"], x + 400, y + 400);
      await esperar(150);
      if (novas.length) passeios.push({ rotulo: rotuloDe(el).slice(0, 30), linhas: novas });
    }
  }
  return { texto, links, passeios, diag };
}

// Acha, em cada cartão (ETAPA 01…) e em cada linha de documento, o botão de download que só tem ícone.
// Passa o mouse em cada botão do cartão e lê o balão ("Baixar", "Enviar", "Informações"): é o jeito mais seguro de saber qual é qual,
// porque as classes dos três botões costumam ser iguais. Só marca o de baixar; enviar, excluir ou detalhes nunca entram.
// (roda dentro da página: autossuficiente)
async function descobrirBotoesDeDownload(ignorarEtapas, ignorarRotulos) {
  const normalizar = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const positivo = /download|baixar|file_download|cloud_download|arrow_downward|fa-download|bi-download|save_alt|get_app|tray-arrow-down|arrow-down-tray|exportar|\bdl\b/i;
  const negativo = /upload|enviar|anexar|attach|publish|cloud_upload|arrow_upward|fa-upload|bi-upload|excluir|remover|delete|trash|lixeira|apagar|cancel|fechar|close|editar|edit|salvar|info|help|ajuda|detalh|visualiz|view|olho|\beye\b|\bver\b|add|plus|novo|nova|substituir|inserir/i;
  // Tudo o que descreve o botão: atributos (título, rótulo, balão, alt), classes dos ícones e o texto
  const palavrasDe = (el) => {
    const partes = [el.innerText];
    for (const n of [el, ...el.querySelectorAll("*")]) {
      for (const a of n.attributes) if (/title|label|tooltip|alt|class|ng-reflect|^data-|href/.test(a.name) && a.value.length < 120) partes.push(a.value);
      if (n.tagName.toLowerCase() === "title") partes.push(n.textContent);
      if (n.tagName.toLowerCase() === "img") partes.push((n.getAttribute("src") ?? "").split("/").pop());
    }
    return new Set(normalizar(partes.filter(Boolean).join(" ")).toLowerCase().split(/[^a-zà-ú0-9_]+/).filter((w) => w.length > 1));
  };
  const desabilitado = (el) => {
    const cs = getComputedStyle(el);
    return !!el.disabled || el.getAttribute("aria-disabled") === "true" || /(^|\s)(disabled|is-disabled|mat-mdc-button-disabled)(\s|$)/.test(String(el.className)) || cs.pointerEvents === "none";
  };
  const soIcone = (el) => {
    if (!(el instanceof HTMLElement)) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 14 || r.height < 14 || r.width > 72 || r.height > 72) return false;
    const t = normalizar(el.innerText);
    return (!t || /^[a-z_]{3,30}$/.test(t)) && !!el.querySelector("svg, img, i, mat-icon, span[class*=icon]") || /^[a-z_]{3,30}$/.test(t);
  };
  const etapaDoElemento = (el) => {
    let atual = el;
    for (let i = 0; i < 10 && atual; i++, atual = atual.parentElement) {
      const numeros = new Set([...(atual.innerText ?? "").matchAll(/ETAPA\s*0?(\d{1,2})\b/gi)].map((m) => Number(m[1])));
      if (numeros.size === 1) return { etapa: [...numeros][0], cartao: atual };
      if (numeros.size > 1) return { etapa: 0, cartao: null };
    }
    return { etapa: 0, cartao: null };
  };
  // O balão que aparece ao passar o mouse no botão (texto novo na página ou balão visível)
  const seletorBalao = "[role=tooltip],.tooltip,.popover,.mat-tooltip,.mat-mdc-tooltip,.mdc-tooltip__surface,.cdk-overlay-pane,.tippy-box,[class*=tooltip],[class*=Tooltip]";
  const linhas = () => (document.body?.innerText ?? "").split("\n").map(normalizar).filter(Boolean);
  const balaos = () => {
    const l = [];
    for (const b of document.querySelectorAll(seletorBalao)) {
      if (!(b instanceof HTMLElement)) continue;
      const r = b.getBoundingClientRect();
      const cs = getComputedStyle(b);
      if (r.width < 8 || r.height < 8 || cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
      for (const x of (b.innerText ?? "").split("\n").map(normalizar).filter(Boolean)) if (x.length < 100) l.push(x);
    }
    return l;
  };
  const disparar = (el, tipos) => {
    const r = el.getBoundingClientRect();
    const cadeia = [];
    for (let a = el, i = 0; a && i < 3 && a !== document.body; a = a.parentElement, i++) cadeia.unshift(a);
    for (const alvo of cadeia)
      for (const t of tipos) {
        if (/focus|blur/.test(t)) {
          if (alvo === el) alvo.dispatchEvent(new FocusEvent(t, { bubbles: t === "focusin" || t === "focusout", view: window }));
          continue;
        }
        const base = { bubbles: !/enter|leave/.test(t), cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
        alvo.dispatchEvent(t.startsWith("pointer") ? new PointerEvent(t, { ...base, pointerType: "mouse" }) : new MouseEvent(t, base));
      }
  };
  const balaoDe = async (el) => {
    const antes = new Set([...linhas(), ...balaos()]);
    const antesB = new Set(balaos());
    disparar(el, ["pointerover", "pointerenter", "mouseover", "mouseenter", "mousemove", "focus", "focusin"]);
    await esperar(450);
    const novas = [...balaos().filter((l) => !antesB.has(l)), ...linhas().filter((l) => !antes.has(l) && l.length < 100)];
    disparar(el, ["mousemove", "pointerout", "pointerleave", "mouseout", "mouseleave", "blur", "focusout"]);
    await esperar(80);
    return normalizar([...new Set(novas)].join(" ")).toLowerCase();
  };
  const grupos = new Map();
  for (const el of document.querySelectorAll("button, a, [role=button]")) {
    if (!soIcone(el)) continue;
    const { etapa, cartao } = etapaDoElemento(el);
    const chave = cartao ?? el.closest("li, tr, [class*=item], [class*=row], [class*=linha], [class*=doc]");
    if (!chave) continue;
    if (!grupos.has(chave)) grupos.set(chave, { etapa, botoes: [] });
    grupos.get(chave).botoes.push(el);
  }
  const achados = [];
  for (const [chave, g] of grupos) {
    if (achados.length >= 14) break;
    const rotulo = normalizar((chave.innerText ?? "").split("\n").map((l) => l.trim()).find(Boolean) ?? "").slice(0, 60);
    if ((g.etapa && ignorarEtapas.includes(g.etapa)) || (rotulo && ignorarRotulos.some((r) => r && rotulo.toLowerCase().includes(r.toLowerCase())))) continue;
    // O que só um botão tem (as classes iguais nos três não dizem nada)
    const todas = g.botoes.map(palavrasDe);
    const comuns = g.botoes.length > 1 ? [...todas[0]].filter((w) => todas.every((t) => t.has(w))) : [];
    const itens = g.botoes.map((b, k) => ({ b, d: [...todas[k]].filter((w) => !comuns.includes(w)).join(" "), desab: desabilitado(b), tip: "", nota: 0 }));
    const claro = itens.some((x) => !x.desab && positivo.test(x.d) && !negativo.test(x.d));
    if (!claro && itens.length > 1) for (const x of itens) if (!x.desab) x.tip = await balaoDe(x.b);
    for (const x of itens) {
      if (/baixar|download|exportar/.test(x.tip)) x.nota += 100;
      else if (/enviar|anexar|upload|inserir|substituir|informa|detalh|excluir|remover|editar|ver /.test(x.tip)) x.nota -= 100;
      if (positivo.test(x.d)) x.nota += 50;
      if (negativo.test(x.d)) x.nota -= 50;
    }
    const livres = itens.filter((x) => !x.desab);
    let alvo = livres.filter((x) => x.nota >= 50).sort((a, b) => b.nota - a.nota)[0];
    let motivo = alvo?.tip && /baixar|download|exportar/.test(alvo.tip) ? `balão “${alvo.tip.slice(0, 20)}”` : "ícone de download";
    // Cartão com vários botões só de ícone (informações, enviar, baixar): o de baixar é o último que não parece outra coisa
    if (!alvo && itens.length >= 2) {
      const ultimo = livres[livres.length - 1];
      if (ultimo && ultimo === itens[itens.length - 1] && ultimo.nota >= 0) {
        alvo = ultimo;
        motivo = "último botão do cartão";
      }
    }
    if (!alvo) {
      // Todos desligados: a etapa ainda não foi enviada, não há relatório para baixar
      if (itens.length && (itens.every((x) => x.desab) || (itens.length >= 2 && itens[itens.length - 1].desab)))
        achados.push({ i: -1, etapa: g.etapa, rotulo, motivo: "botão de baixar desligado no HUB (sem relatório para baixar)" });
      continue;
    }
    const i = achados.filter((x) => x.i >= 0).length;
    alvo.b.setAttribute("data-blimp-dl", String(i));
    achados.push({ i, etapa: g.etapa, rotulo, motivo, balao: alvo.tip.slice(0, 30) });
  }
  return achados;
}

// Clica no botão marcado e captura o arquivo que a página gera: o Blob que ela monta, ou o endereço que ela abriria.
// Durante o clique, a página não consegue baixar sozinha nem sair dela. (roda no mundo da própria página)
async function clicarECapturar(i, espera, limite) {
  const el = document.querySelector(`[data-blimp-dl="${i}"]`);
  if (!el) return { ok: false, motivo: "o botão não está mais na página" };
  const capturas = [];
  const tinhaCliqueProprio = Object.prototype.hasOwnProperty.call(HTMLAnchorElement.prototype, "click");
  const orig = {
    objeto: URL.createObjectURL,
    clique: HTMLAnchorElement.prototype.click,
    envio: EventTarget.prototype.dispatchEvent,
    abrir: window.open,
  };
  const guardarLink = (a) => capturas.push({ tipo: "href", href: a.href, nome: a.getAttribute("download") || "" });
  URL.createObjectURL = function (obj) {
    if (obj instanceof Blob) capturas.push({ tipo: "blob", blob: obj });
    return orig.objeto.call(URL, obj);
  };
  HTMLAnchorElement.prototype.click = function () {
    if (this.href) guardarLink(this);
  };
  EventTarget.prototype.dispatchEvent = function (ev) {
    if (this instanceof HTMLAnchorElement && ev?.type === "click" && this.href) {
      guardarLink(this);
      return true;
    }
    return orig.envio.call(this, ev);
  };
  window.open = function (url) {
    if (url) capturas.push({ tipo: "href", href: new URL(String(url), location.href).href, nome: "" });
    return null;
  };
  const lerBlob = (blob) =>
    new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(String(leitor.result).split(",")[1] ?? "");
      leitor.onerror = () => reject(new Error("leitura"));
      leitor.readAsDataURL(blob);
    });
  try {
    el.click();
    const inicio = Date.now();
    let primeiro = 0;
    while (Date.now() - inicio < espera) {
      await new Promise((r) => setTimeout(r, 150));
      if (capturas.length && !primeiro) primeiro = Date.now();
      if (primeiro && Date.now() - primeiro > 450) break;
    }
    const itens = [];
    // O nome que a página deu ao arquivo (atributo download do link que ela clicou)
    const nomeSugerido = capturas.find((c) => c.tipo === "href" && c.nome)?.nome ?? "";
    for (const c of capturas.slice(0, 3)) {
      if (c.tipo === "blob") {
        if (c.blob.size > limite) itens.push({ tipo: "grande", tamanho: c.blob.size });
        else itens.push({ tipo: "blob", nome: nomeSugerido, mime: c.blob.type || "", tamanho: c.blob.size, base64: await lerBlob(c.blob) });
      } else if (!/^(blob:|javascript:)/i.test(c.href) && !itens.some((x) => x.href === c.href)) itens.push({ tipo: "href", href: c.href, nome: c.nome });
    }
    return itens.length ? { ok: true, itens } : { ok: false, motivo: "o botão não gerou nenhum arquivo" };
  } catch (e) {
    return { ok: false, motivo: String(e?.message ?? e).slice(0, 80) };
  } finally {
    URL.createObjectURL = orig.objeto;
    if (tinhaCliqueProprio) HTMLAnchorElement.prototype.click = orig.clique;
    else delete HTMLAnchorElement.prototype.click;
    EventTarget.prototype.dispatchEvent = orig.envio;
    window.open = orig.abrir;
    el.removeAttribute("data-blimp-dl");
  }
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

// Clica UMA vez no botão de situação do pedido (o de cima, à direita, que muda conforme o status:
// "Em andamento", "Aguardando Envio das notas fiscais"…) e lê o que a página mostra por causa do clique.
// Se o clique só abre e fecha a trilha, clica de novo para deixar a página como estava.
// Nunca clica em link, botão de enviar do formulário ou nada fora do cartão da trilha. (roda dentro da página)
async function lerStatus() {
  const normalizar = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
  const linhas = () => (document.body?.innerText ?? "").split("\n").map(normalizar).filter(Boolean);
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const diag = { achou: false, rotulo: "", novas: 0, sumiram: 0, motivo: "" };
  const tem = (el, re) => re.test(el.innerText ?? "");
  // A trilha: o menor elemento que mostra os passos do HUB (Solicitação aberta … Projeto concluído)
  let trilha = null;
  for (const el of document.querySelectorAll("div, ul, ol, section, aside, nav")) {
    if (!(el instanceof HTMLElement) || !tem(el, /solicita[cç][aã]o aberta/i) || !tem(el, /projeto conclu[ií]do/i)) continue;
    if ([...el.children].some((f) => f instanceof HTMLElement && tem(f, /solicita[cç][aã]o aberta/i) && tem(f, /projeto conclu[ií]do/i))) continue;
    trilha = el;
    break;
  }
  if (!trilha) return { novas: [], diag: { ...diag, motivo: "não achei a trilha de passos do HUB" } };
  const rt = trilha.getBoundingClientRect();
  // O botão: logo acima da trilha, largo, com texto e um ícone (a setinha), no mesmo cartão. Entre os elementos aninhados
  // que servem, o mais interno: o clique sobe até quem escuta, e o contrário não vale.
  const candidatos = [];
  const cartao = trilha.parentElement?.parentElement?.parentElement ?? trilha.parentElement ?? document.body;
  for (const el of cartao.querySelectorAll("button, [role=button], div, span, a")) {
    if (!(el instanceof HTMLElement) || trilha.contains(el) || el.contains(trilha)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 140 || r.height < 28 || r.height > 130) continue;
    if (r.bottom > rt.top + 14 || rt.top - r.bottom > 220) continue;
    if (r.right < rt.left || r.left > rt.right) continue;
    const t = normalizar(el.innerText);
    if (!t || t.length > 80 || !el.querySelector("svg, img, i, mat-icon, span[class*=icon]")) continue;
    const eLink = el.closest("a[href]");
    if (eLink && !/^(#|javascript:)/.test(eLink.getAttribute("href") ?? "#")) continue;
    if (el.closest("form") && el.getAttribute("type") === "submit") continue;
    candidatos.push({ el, r, t });
  }
  let melhor = null;
  for (const c of candidatos) {
    if (candidatos.some((o) => o !== c && c.el.contains(o.el))) continue;
    const clicavel = c.el.matches("button, [role=button]") || getComputedStyle(c.el).cursor === "pointer" || !!c.el.closest("button, [role=button]");
    const nota = (clicavel ? 100 : 0) + c.r.bottom - (c.r.width > 700 ? 200 : 0);
    if (!melhor || nota > melhor.nota) melhor = { el: c.el, nota, t: c.t };
  }
  if (!melhor) return { novas: [], diag: { ...diag, motivo: "não achei o botão de situação acima da trilha" } };
  const antes = linhas();
  const antesSet = new Set(antes);
  diag.achou = true;
  diag.rotulo = melhor.t.slice(0, 60);
  melhor.el.click();
  await esperar(900);
  const depois = linhas();
  const depoisSet = new Set(depois);
  const novas = depois.filter((l) => !antesSet.has(l) && l.length < 300).slice(0, 60);
  const sumiram = antes.filter((l) => !depoisSet.has(l));
  diag.novas = novas.length;
  diag.sumiram = sumiram.length;
  // Abriu ou fechou algo: volta ao estado em que estava
  if (novas.length || sumiram.length) {
    melhor.el.click();
    await esperar(500);
  }
  return { novas, diag };
}

// Acha, na lista de pedidos do HUB, o botão de abrir de cada linha (o código do pedido, de 4 a 7 números, identifica a linha).
// Marca cada botão com data-blimp-linha para o clique. (roda dentro da página)
function descobrirLinhas() {
  const normalizar = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
  const codigos = [];
  for (const el of document.querySelectorAll("a, span, div, p, td, strong, b")) {
    if (!(el instanceof HTMLElement) || el.children.length > 1) continue;
    const t = normalizar(el.textContent);
    if (!/^\d{4,7}$/.test(t) || codigos.some((c) => c.codigo === t)) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    codigos.push({ el, codigo: t });
  }
  const todos = new Set(codigos.map((c) => c.codigo));
  const achadas = [];
  for (const { el, codigo } of codigos) {
    // A linha: o maior elemento em volta do código que ainda não traz o código de outro pedido
    let linha = el;
    for (let i = 0, atual = el.parentElement; i < 10 && atual && atual !== document.body; i++, atual = atual.parentElement) {
      const nessa = new Set((atual.innerText ?? "").match(/\b\d{4,7}\b/g)?.filter((n) => todos.has(n)) ?? []);
      if (nessa.size > 1 || atual.getBoundingClientRect().height > 420) break;
      linha = atual;
    }
    if (linha === el) continue;
    const rl = linha.getBoundingClientRect();
    const textoLinha = (linha.innerText ?? "").split("\n").map(normalizar).filter(Boolean);
    // 1) link de verdade para outra página do mesmo site (menos o ícone de abrir em outra aba, ao lado do código)
    let controle = null;
    let tipo = "";
    let href = "";
    for (const a of linha.querySelectorAll("a[href]")) {
      const h = a.getAttribute("href") ?? "";
      if (!h || /^(#|javascript:|mailto:|tel:)/i.test(h) || a.getAttribute("target") === "_blank") continue;
      try {
        if (new URL(h, location.href).origin !== location.origin) continue;
      } catch {
        continue;
      }
      controle = a;
      tipo = "link";
      href = h.slice(0, 80);
      break;
    }
    // 2) o botão da lateral direita (a faixa colorida com a setinha), alto como a linha
    if (!controle) {
      let melhor = null;
      for (const f of linha.querySelectorAll("button, a, [role=button], div, span")) {
        if (!(f instanceof HTMLElement) || f === linha) continue;
        const r = f.getBoundingClientRect();
        if (r.width < 18 || r.width > 100 || r.height < rl.height * 0.45 || r.left < rl.right - 140) continue;
        if (!melhor || r.right > melhor.r.right || (r.right === melhor.r.right && r.height > melhor.r.height)) melhor = { f, r };
      }
      if (melhor) {
        controle = melhor.f;
        tipo = "lateral";
      }
    }
    // 3) a própria linha
    if (!controle) {
      controle = linha;
      tipo = "linha";
    }
    controle.setAttribute("data-blimp-linha", codigo);
    achadas.push({
      codigo,
      titulo: textoLinha.filter((l) => l !== codigo && !/^(cliente|gestor|prestador|aberta em)$/i.test(l))[0] ?? "",
      resumo: textoLinha.join(" | ").slice(0, 400),
      tipo,
      href,
      topo: Math.round(rl.top + scrollY),
    });
  }
  return achadas.sort((a, b) => a.topo - b.topo);
}

// Clica no botão marcado da linha do pedido (a página pode abrir o pedido na mesma aba ou numa nova)
function clicarLinha(codigo) {
  const el = document.querySelector(`[data-blimp-linha="${codigo}"]`);
  if (!el) return false;
  el.scrollIntoView({ block: "center" });
  el.click();
  return true;
}

// A página do pedido já abriu? (mostra o código e os cartões, e não é mais a lista) (roda dentro da página)
function paginaDoPedido(codigo) {
  const t = document.body?.innerText ?? "";
  const abriu = new RegExp(`solicita[cç][aã]o\\s+${codigo}\\b`, "i").test(t) || (t.includes(codigo) && /plano de entrega|documenta[cç][aã]o/i.test(t) && !/busque pela empresa/i.test(t));
  return { abriu, tamanho: t.length };
}

// Leva o elemento marcado à vista e devolve o centro dele na tela (para o mouse de verdade). (roda dentro da página)
function posicionarMarcado(atributo, i) {
  const el = document.querySelector(`[${atributo}="${i}"]`);
  if (!el) return null;
  el.scrollIntoView({ block: "center", inline: "nearest" });
  const r = el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return null;
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
}

// O texto da tela e os balões visíveis agora, para ver o que apareceu depois de passar o mouse. (roda dentro da página)
function fotografarTela() {
  const normalizar = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
  const linhas = (document.body?.innerText ?? "").split("\n").map(normalizar).filter(Boolean);
  const balaos = [];
  for (const b of document.querySelectorAll("[role=tooltip],.tooltip,.popover,.mat-tooltip,.mat-mdc-tooltip,.mdc-tooltip__surface,.cdk-overlay-pane,.tippy-box,[class*=tooltip],[class*=popover],[class*=Tooltip],[class*=Popover]")) {
    if (!(b instanceof HTMLElement)) continue;
    const r = b.getBoundingClientRect();
    const cs = getComputedStyle(b);
    if (r.width < 8 || r.height < 8 || cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
    for (const l of (b.innerText ?? "").split("\n").map(normalizar).filter(Boolean)) if (l.length < 300) balaos.push(l);
  }
  return { linhas, balaos };
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

async function textoDeTodosOsQuadros(tabId, passarMouse = false, sessao = null) {
  const partes = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: lerPagina, args: [passarMouse && !sessao] });
  const resultados = partes.map((p) => p.result).filter(Boolean);
  // Mouse de verdade: os balões vêm do passeio feito pelo depurador, só na página principal
  if (sessao && passarMouse && resultados[0]) {
    const real = await passeioReal(tabId, sessao);
    resultados[0].passeios.push(...real.passeios);
    resultados[0].diag.candidatosAoPassarMouse = real.candidatos;
    resultados[0].diag.mouseReal = true;
  }
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
    (d, r) => ({
      linksIgnorados: d.linksIgnorados + r.diag.linksIgnorados,
      botoesSemEndereco: d.botoesSemEndereco + r.diag.botoesSemEndereco,
      candidatosAoPassarMouse: d.candidatosAoPassarMouse + r.diag.candidatosAoPassarMouse,
      amostras: [...d.amostras, ...r.diag.amostras].slice(0, 8),
    }),
    { linksIgnorados: 0, botoesSemEndereco: 0, candidatosAoPassarMouse: 0, amostras: [] },
  );
  return { texto: textoPagina + secaoBalao, textoPagina, secaoBalao, balaos: balao.length, links, quadros: partes.length, diag };
}

// ─── Mouse de verdade (depurador do navegador) ────────────────────────────────
// Opcional (permissão "debugger", pedida na janelinha): passa o mouse e clica como uma pessoa, o que acende balões feitos só com
// CSS e deixa o navegador dizer quais arquivos a página baixou. Enquanto lê, o navegador mostra o aviso de "depuração".

async function modoReal() {
  const { opcoes } = await chrome.storage.local.get("opcoes");
  return !!opcoes?.real && (await chrome.permissions.contains({ permissions: ["debugger"] }));
}

async function abrirSessao(tabId) {
  const alvo = { tabId };
  await chrome.debugger.attach(alvo, "1.3");
  const enviar = (metodo, params = {}) => chrome.debugger.sendCommand(alvo, metodo, params);
  const eventos = [];
  const ouvinte = (origem, metodo, params) => {
    if (origem.tabId === tabId) eventos.push({ metodo, params });
  };
  chrome.debugger.onEvent.addListener(ouvinte);
  try {
    await enviar("Page.enable");
    // Buffers grandes: sem eles o navegador não guarda o corpo das respostas e o arquivo vem vazio
    await enviar("Network.enable", { maxTotalBufferSize: 100 * 1024 * 1024, maxResourceBufferSize: 30 * 1024 * 1024 });
    // O arquivo não é salvo na pasta de downloads: a extensão pega o conteúdo e leva ao Blimp
    await enviar("Page.setDownloadBehavior", { behavior: "deny" }).catch(() => {});
  } catch (e) {
    chrome.debugger.onEvent.removeListener(ouvinte);
    await chrome.debugger.detach(alvo).catch(() => {});
    throw e;
  }
  return {
    enviar,
    eventos,
    fechar: async () => {
      chrome.debugger.onEvent.removeListener(ouvinte);
      await chrome.debugger.detach(alvo).catch(() => {});
    },
  };
}

const moverMouse = (sessao, x, y) => sessao.enviar("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, pointerType: "mouse" });

// Passa o mouse de verdade em cada foto, iniciais e ícone da página e anota o que apareceu
async function passeioReal(tabId, sessao) {
  const [col] = await chrome.scripting.executeScript({ target: { tabId }, func: lerPagina, args: ["coletar"] });
  const itens = col?.result?.coletados ?? [];
  const passeios = [];
  for (const it of itens) {
    const [pos] = await chrome.scripting.executeScript({ target: { tabId }, func: posicionarMarcado, args: ["data-blimp-mouse", it.i] });
    const ponto = pos?.result;
    if (!ponto) continue;
    const [antes] = await chrome.scripting.executeScript({ target: { tabId }, func: fotografarTela });
    await moverMouse(sessao, ponto.x, ponto.y);
    await esperar(it.longo ? 800 : 500);
    const [depois] = await chrome.scripting.executeScript({ target: { tabId }, func: fotografarTela });
    await moverMouse(sessao, 2, 2);
    await esperar(120);
    const a = antes?.result ?? { linhas: [], balaos: [] };
    const d = depois?.result ?? { linhas: [], balaos: [] };
    const vistas = new Set([...a.linhas, ...a.balaos]);
    const balaosAntes = new Set(a.balaos);
    const novas = [...new Set([...d.balaos.filter((l) => !balaosAntes.has(l)), ...d.linhas.filter((l) => !vistas.has(l) && l.length < 300)])].slice(0, 14);
    if (novas.length) passeios.push({ rotulo: it.rotulo, linhas: novas });
  }
  return { passeios, candidatos: itens.length, coletados: col?.result ?? null };
}

const cabecalho = (headers, nome) => {
  for (const k of Object.keys(headers ?? {})) if (k.toLowerCase() === nome) return String(headers[k]);
  return "";
};
const nomeDaDisposicao = (disp) => {
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disp || "");
  try {
    return m ? decodeURIComponent(m[1]) : "";
  } catch {
    return m ? m[1] : "";
  }
};

// Clica de verdade no botão marcado e junta o que o navegador viu a página baixar (resposta de rede com arquivo, ou download)
async function cliqueReal(tabId, sessao, i, limite) {
  const [pos] = await chrome.scripting.executeScript({ target: { tabId }, func: posicionarMarcado, args: ["data-blimp-dl", i] });
  const ponto = pos?.result;
  if (!ponto) return { ok: false, motivo: "o botão não está mais na página" };
  sessao.eventos.length = 0;
  await moverMouse(sessao, ponto.x, ponto.y);
  await esperar(250);
  await sessao.enviar("Input.dispatchMouseEvent", { type: "mousePressed", x: ponto.x, y: ponto.y, button: "left", clickCount: 1 });
  await sessao.enviar("Input.dispatchMouseEvent", { type: "mouseReleased", x: ponto.x, y: ponto.y, button: "left", clickCount: 1 });
  const ehArquivo = (r) =>
    r.status < 400 &&
    (/pdf|octet-stream|msword|officedocument|spreadsheet|ms-excel|zip|image\/(png|jpe?g|webp)|csv/i.test(r.mimeType ?? "") ||
      /attachment/i.test(cabecalho(r.headers, "content-disposition")) ||
      /\.(pdf|docx?|xlsx?|png|jpe?g|webp|zip)(\?|#|$)/i.test(r.url ?? ""));
  const inicio = Date.now();
  let achouEm = 0;
  while (Date.now() - inicio < 7000) {
    await esperar(200);
    const tem = sessao.eventos.some((e) => (e.metodo === "Network.responseReceived" && ehArquivo(e.params.response)) || e.metodo === "Page.downloadWillBegin");
    if (tem && !achouEm) achouEm = Date.now();
    // Dá um tempo para o arquivo terminar de chegar
    if (achouEm && Date.now() - achouEm > 1200) break;
  }
  const itens = [];
  const vistos = new Set();
  const respostas = sessao.eventos.filter((e) => e.metodo === "Network.responseReceived" && ehArquivo(e.params.response));
  for (const e of respostas.slice(0, 3)) {
    const r = e.params.response;
    if (vistos.has(r.url)) continue;
    vistos.add(r.url);
    const nome = nomeDaDisposicao(cabecalho(r.headers, "content-disposition"));
    try {
      // Só pede o corpo quando a resposta terminou de chegar
      for (let k = 0; k < 20 && !sessao.eventos.some((f) => f.metodo === "Network.loadingFinished" && f.params.requestId === e.params.requestId); k++) await esperar(150);
      const corpo = await sessao.enviar("Network.getResponseBody", { requestId: e.params.requestId });
      if (!corpo.base64Encoded && !corpo.body) throw new Error("corpo vazio");
      const base64 = corpo.base64Encoded ? corpo.body : btoa(unescape(encodeURIComponent(corpo.body)));
      const tamanho = Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
      if (tamanho > limite) itens.push({ tipo: "grande", tamanho });
      else itens.push({ tipo: "blob", nome, mime: String(r.mimeType ?? "").split(";")[0], tamanho, base64 });
    } catch {
      // Download que o navegador conduziu sozinho: o conteúdo não passa pela rede da página; baixa-se pelo endereço
      if (!/^(blob:|data:)/i.test(r.url)) itens.push({ tipo: "href", href: r.url, nome });
    }
  }
  for (const e of sessao.eventos.filter((x) => x.metodo === "Page.downloadWillBegin")) {
    const u = e.params.url;
    if (!u || vistos.has(u) || /^(blob:|data:)/i.test(u)) continue;
    vistos.add(u);
    itens.push({ tipo: "href", href: u, nome: e.params.suggestedFilename ?? "" });
  }
  return itens.length ? { ok: true, itens } : { ok: false, motivo: "o botão não gerou nenhum arquivo (mouse de verdade)" };
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
  // No ícone da extensão, para quem fechou a janelinha: "2/7" enquanto lê a lista
  if (passo.etapa === "lote") await chrome.action.setBadgeText({ text: `${passo.atual}/${passo.de}` }).catch(() => {});
  else if (passo.etapa === "pronto") await chrome.action.setBadgeText({ text: "" }).catch(() => {});
}

// Lê uma página de pedido do HUB: o texto, os balões, o que o botão de situação mostra, e os anexos (por link e
// clicando nos botões de download). Devolve o que a extensão guarda para o Blimp pedir.
async function lerDetalhe(tabId, prefixo = "") {
  let sessao = null;
  const mouseReal = { pedido: false, usado: false, motivo: "" };
  if (await modoReal()) {
    mouseReal.pedido = true;
    try {
      sessao = await abrirSessao(tabId);
      mouseReal.usado = true;
    } catch (e) {
      mouseReal.motivo = String(e?.message ?? e).slice(0, 100);
    }
  }
  try {
    const r = await lerDetalheCom(tabId, prefixo, sessao);
    if (r.pendente) {
      r.pendente.diag = { ...r.pendente.diag, mouseReal };
      if (r.resumo) r.resumo.diag = { ...r.resumo.diag, mouseReal };
    }
    return r;
  } finally {
    await sessao?.fechar();
  }
}

async function lerDetalheCom(tabId, prefixo, sessao) {
  {
    const aba = await chrome.tabs.get(tabId);
    const hub = new URL(aba.url);
    await progresso({ etapa: "lendo", texto: `${prefixo}Lendo a página do HUB e passando o mouse nos ícones…` });
    const { texto, textoPagina, secaoBalao, balaos, links, quadros, diag } = await textoDeTodosOsQuadros(tabId, true, sessao);
    if (!texto && !links.length) return { vazia: true };
    // O botão de situação do pedido (a que passo está): um clique, e lê o que a página mostra
    await progresso({ etapa: "lendo", texto: `${prefixo}Clicando no botão de situação do pedido…` });
    let secaoStatus = "";
    const status = { achou: false, rotulo: "", novas: 0, sumiram: 0, motivo: "" };
    try {
      const [st] = await chrome.scripting.executeScript({ target: { tabId }, func: lerStatus });
      Object.assign(status, st?.result?.diag ?? { motivo: "sem resposta" });
      const novas = st?.result?.novas ?? [];
      if (novas.length) secaoStatus = `\n\n[Ao clicar no botão de situação do projeto${status.rotulo ? ` (“${status.rotulo}”)` : ""}, a página mostrou]\n${novas.join("\n")}`;
    } catch (e) {
      status.motivo = String(e?.message ?? e).slice(0, 80);
    }

    const arquivos = [];
    const falhas = [];
    const naoGuardados = [];
    let total = 0;
    const candidatos = links.slice(0, MAX_CANDIDATOS);
    if (links.length > MAX_CANDIDATOS) falhas.push({ nome: `${links.length - MAX_CANDIDATOS} outros links`, url: "", motivo: `passou do limite de ${MAX_CANDIDATOS} arquivos por leitura` });
    const permitidas = await origensPermitidas();

    for (const [i, link] of candidatos.entries()) {
      const rotulo = link.rotulo || baseDe(link.url) || link.url;
      await progresso({ etapa: "baixando", texto: `${prefixo}Baixando ${i + 1} de ${candidatos.length}: ${rotulo.slice(0, 60)}`, atual: i + 1, de: candidatos.length });
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
      arquivos.push({ nome, tipo, tamanho: r.tamanho, base64: r.base64, url: link.url, etapa: link.etapa || 0 });
    }

    // Botões de download sem endereço (como os do cartão de cada etapa): a extensão clica neles e captura o arquivo
    const cliques = [];
    const { opcoes } = await chrome.storage.local.get("opcoes");
    if (opcoes?.clicar !== false) {
      const etapasBaixadas = [...new Set(arquivos.map((a) => a.etapa).filter(Boolean))];
      const rotulosBaixados = candidatos.map((l) => l.rotulo).filter(Boolean);
      const [achou] = await chrome.scripting.executeScript({ target: { tabId }, func: descobrirBotoesDeDownload, args: [etapasBaixadas, rotulosBaixados] });
      const botoes = achou?.result ?? [];
      for (const [n, b] of botoes.entries()) {
        if (b.i < 0) {
          cliques.push({ etapa: b.etapa, rotulo: b.rotulo, motivo: b.motivo, gerou: 0, erro: b.motivo });
          continue;
        }
        await progresso({ etapa: "clicando", texto: `${prefixo}Baixando ${n + 1} de ${botoes.length}: ${b.etapa ? `etapa ${String(b.etapa).padStart(2, "0")}` : b.rotulo.slice(0, 50)}`, atual: n + 1, de: botoes.length });
        let r = sessao ? await cliqueReal(tabId, sessao, b.i, MAX_ARQUIVO).catch((e) => ({ ok: false, motivo: String(e?.message ?? e).slice(0, 80) })) : { ok: false };
        // Sem mouse de verdade (ou ele não pegou nada): o clique da página, com a captura do arquivo que ela gera
        if (!r.ok) {
          const [exec] = await chrome.scripting.executeScript({ target: { tabId }, world: "MAIN", func: clicarECapturar, args: [b.i, 7000, MAX_ARQUIVO] });
          r = exec?.result ?? { ok: false, motivo: "sem resposta" };
        }
        const registro = { etapa: b.etapa, rotulo: b.rotulo, motivo: b.motivo, gerou: 0, erro: "" };
        if (!r.ok) {
          registro.erro = r.motivo;
          cliques.push(registro);
          continue;
        }
        for (const item of r.itens) {
          let dados = null;
          if (item.tipo === "grande") {
            falhas.push({ nome: b.rotulo || `etapa ${b.etapa}`, url: "", motivo: "passa de 10 MB" });
            continue;
          }
          if (item.tipo === "blob") dados = { tipo: item.mime, tamanho: item.tamanho, base64: item.base64, disposicao: "" };
          else {
            const [ex2] = await chrome.scripting.executeScript({ target: { tabId }, func: baixarNaPagina, args: [item.href, MAX_ARQUIVO] });
            const x = ex2?.result;
            if (!x?.ok) {
              falhas.push({ nome: b.rotulo || `etapa ${b.etapa}`, url: item.href, motivo: x?.motivo ?? "sem resposta" });
              continue;
            }
            dados = x;
          }
          const nomeBase = item.nome || (b.etapa ? `Relatorio-etapa-${String(b.etapa).padStart(2, "0")}` : b.rotulo || "arquivo-do-hub");
          const nome = nomeDoArquivo({ nomeNoLink: item.nome || "", url: item.href ?? "", rotulo: nomeBase }, dados.disposicao, dados.tipo);
          const tipo = TIPOS_GUARDADOS.includes(dados.tipo) ? dados.tipo : tipoPeloNome(nome);
          if (!tipo) {
            naoGuardados.push({ nome, tipo: (/\.([a-z0-9]{2,5})$/i.exec(nome)?.[1] ?? dados.tipo ?? "desconhecido").toUpperCase() });
            continue;
          }
          if (total + dados.tamanho > MAX_TOTAL) {
            falhas.push({ nome, url: "", motivo: "passou do limite total de 24 MB por leitura" });
            continue;
          }
          total += dados.tamanho;
          arquivos.push({ nome, tipo, tamanho: dados.tamanho, base64: dados.base64, url: item.href ?? "", etapa: b.etapa || 0 });
          registro.gerou++;
        }
        cliques.push(registro);
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    const textoFinal = textoPagina.slice(0, Math.max(2000, LIMITE_TEXTO - secaoBalao.length - secaoStatus.length)) + secaoBalao + secaoStatus;
    const pendente = {
      id: crypto.randomUUID(),
      criadoEm: new Date().toISOString(),
      origem: { endereco: hub.origin, titulo: aba.title ?? "", url: `${hub.origin}${hub.pathname}` },
      // Os balões e o que o botão de situação mostrou vão inteiros; o corte, se houver, é no texto da página
      texto: textoFinal,
      textoCortado: textoPagina.length + secaoBalao.length + secaoStatus.length > LIMITE_TEXTO,
      quadros,
      balaos,
      diag: { ...diag, linksAchados: links.length, cliques, status },
      arquivos,
      falhas,
      naoGuardados,
    };
    return {
      pendente,
      resumo: { arquivos: arquivos.length, falhas: falhas.length, naoGuardados: naoGuardados.length, quadros, caracteres: textoFinal.length, balaos, cliques: cliques.length, status, diag: { ...diag, linksAchados: links.length, cliques, status } },
    };
  }
}

// "Ler agora": a página que está na tela, entregue ao projeto aberto no Blimp
async function lerAgora({ tabId, blimpTabId }) {
  // Mantém a extensão acordada durante downloads demorados
  const batida = setInterval(() => void chrome.runtime.getPlatformInfo(), 20000);
  try {
    const r = await lerDetalhe(tabId);
    if (r.vazia) return { ok: false, motivo: "vazia" };
    await chrome.storage.local.set({ pendente: r.pendente });

    // Avisa a aba do projeto no Blimp (só um aviso; os dados vão quando o Blimp pede)
    await avisarBlimp(blimpTabId, "blimp-hub-pendente", "Levando para o Blimp…", "Pronto. A prévia está no Blimp.");
    return { ok: true, resumo: r.resumo };
  } catch (e) {
    return { ok: false, motivo: "erro", detalhe: String(e?.message ?? e) };
  } finally {
    clearInterval(batida);
  }
}

async function avisarBlimp(blimpTabId, tipo, textoEntregando, textoPronto) {
  await progresso({ etapa: "entregando", texto: textoEntregando });
  await chrome.scripting.executeScript({ target: { tabId: blimpTabId }, func: (t, o) => window.postMessage({ tipo: t }, o), args: [tipo, new URL((await chrome.tabs.get(blimpTabId)).url).origin] });
  await chrome.tabs.update(blimpTabId, { active: true });
  const jan = await chrome.tabs.get(blimpTabId);
  await chrome.windows.update(jan.windowId, { focused: true }).catch(() => {});
  await progresso({ etapa: "pronto", texto: textoPronto });
}

// ─── "Ler todos": a lista de pedidos do HUB, um por um ─────────────────────────

const MAX_LOTE = 40;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const cancelado = async () => !!(await chrome.storage.session.get("cancelar")).cancelar;

// Espera a página do pedido abrir (e os cartões terminarem de carregar)
async function esperarPedido(tabId, codigo, limite = 20000) {
  const inicio = Date.now();
  let ultimo = -1;
  let estavel = 0;
  while (Date.now() - inicio < limite) {
    await esperar(500);
    let r;
    try {
      [r] = await chrome.scripting.executeScript({ target: { tabId }, func: paginaDoPedido, args: [codigo] });
    } catch {
      continue; // a página está trocando
    }
    const v = r?.result;
    if (!v?.abriu) continue;
    estavel = v.tamanho === ultimo ? estavel + 1 : 0;
    ultimo = v.tamanho;
    if (estavel >= 2) return true;
  }
  return false;
}

async function linhasDaLista(tabId) {
  try {
    const [r] = await chrome.scripting.executeScript({ target: { tabId }, func: descobrirLinhas });
    return r?.result ?? [];
  } catch {
    return [];
  }
}

async function esperarLista(tabId, limite = 20000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limite) {
    await esperar(600);
    if ((await linhasDaLista(tabId)).length) return true;
  }
  return false;
}

// Percorre a lista de pedidos da aba: abre cada um (clicando na linha), lê, volta para a lista
async function lerLote({ tabId, blimpTabId }) {
  const batida = setInterval(() => void chrome.runtime.getPlatformInfo(), 20000);
  await chrome.storage.session.remove("cancelar");
  try {
    const aba = await chrome.tabs.get(tabId);
    const hub = new URL(aba.url);
    const linhas = (await linhasDaLista(tabId)).slice(0, MAX_LOTE);
    if (!linhas.length) return { ok: false, motivo: "sem-lista" };
    const lote = { id: crypto.randomUUID(), criadoEm: new Date().toISOString(), origem: { endereco: hub.origin, url: `${hub.origin}${hub.pathname}` }, itens: [], problemas: [], total: linhas.length, trilha: [] };
    // Registro curto do caminho (endereços sem a parte depois do ?), para entender o que houve se algo falhar
    const marca = async (t, id = tabId) => lote.trilha.push(`${t}: ${(await chrome.tabs.get(id).catch(() => null))?.url?.split("?")[0] ?? "?"}`);
    // Volta à lista carregando o endereço dela de novo. O botão "voltar" do navegador não serve: o Chrome pula as
    // telas que a página abriu sem que a pessoa tenha clicado, e a lista não seria a tela de antes.
    const listaUrl = aba.url;
    const voltar = async (id) => {
      await chrome.tabs.update(id, { url: listaUrl }).catch((e) => lote.trilha.push(`voltar falhou: ${String(e?.message ?? e).slice(0, 60)}`));
    };
    await chrome.storage.local.set({ lote });
    for (const [i, linha] of linhas.entries()) {
      if (await cancelado()) {
        lote.interrompido = true;
        break;
      }
      const prefixo = `Pedido ${i + 1} de ${linhas.length} (${linha.codigo}): `;
      await progresso({ etapa: "lote", texto: `${prefixo}abrindo…`, atual: i + 1, de: linhas.length });
      // As linhas se redesenham ao voltar: marca de novo e acha a do código
      const agora = (await linhasDaLista(tabId)).find((l) => l.codigo === linha.codigo);
      if (!agora) {
        lote.problemas.push({ codigo: linha.codigo, motivo: "a linha não estava mais na lista (a página mudou ao voltar)" });
        continue;
      }
      const abasAntes = new Set((await chrome.tabs.query({})).map((a) => a.id));
      const clicou = (await chrome.scripting.executeScript({ target: { tabId }, func: clicarLinha, args: [linha.codigo] }))[0]?.result;
      if (!clicou) {
        lote.problemas.push({ codigo: linha.codigo, motivo: "não consegui clicar na linha" });
        continue;
      }
      // O pedido pode abrir na mesma aba ou numa nova
      await esperar(600);
      const novas = (await chrome.tabs.query({})).filter((a) => !abasAntes.has(a.id) && a.url !== "chrome://newtab/");
      const alvo = novas[0]?.id ?? tabId;
      const abriu = await esperarPedido(alvo, linha.codigo);
      await marca(`${linha.codigo} aberto=${abriu}${novas[0] ? " (aba nova)" : ""}`, alvo);
      if (!abriu) {
        lote.problemas.push({ codigo: linha.codigo, motivo: "a página do pedido não abriu" });
        if (novas[0]) await chrome.tabs.remove(novas[0].id).catch(() => {});
        // Se a aba ainda mostra outra coisa que não a lista, volta
        if (!(await linhasDaLista(tabId)).length) await voltar(tabId);
        continue;
      }
      let r;
      try {
        r = await lerDetalhe(alvo, prefixo);
      } catch (e) {
        r = { erro: String(e?.message ?? e).slice(0, 100) };
      }
      if (r.pendente) {
        lote.itens.push({ id: r.pendente.id, codigo: linha.codigo, titulo: linha.titulo, linha: linha.resumo, pendente: r.pendente, resumo: r.resumo });
        await chrome.storage.local.set({ lote });
      } else lote.problemas.push({ codigo: linha.codigo, motivo: r.vazia ? "a página do pedido veio vazia" : (r.erro ?? "erro ao ler") });
      // Volta para a lista
      if (novas[0]) await chrome.tabs.remove(novas[0].id).catch(() => {});
      else await voltar(tabId);
      const voltou = await esperarLista(tabId);
      await marca(`${linha.codigo} voltou=${voltou}`);
      if (!voltou) {
        lote.problemas.push({ codigo: "", motivo: "não consegui voltar à lista de pedidos; parei por aqui" });
        break;
      }
    }
    await chrome.storage.local.set({ lote });
    await chrome.storage.session.remove("cancelar");
    if (!lote.itens.length) return { ok: false, motivo: "nenhum", problemas: lote.problemas, trilha: lote.trilha, linhas: linhas.map((l) => ({ codigo: l.codigo, tipo: l.tipo, href: l.href })) };
    await avisarBlimp(blimpTabId, "blimp-hub-lote", "Levando para o Blimp…", `Pronto. ${lote.itens.length} ${lote.itens.length === 1 ? "pedido lido" : "pedidos lidos"}: confira no Blimp.`);
    return { ok: true, lidos: lote.itens.length, total: lote.total, problemas: lote.problemas, interrompido: !!lote.interrompido, trilha: lote.trilha, linhas: linhas.map((l) => ({ codigo: l.codigo, tipo: l.tipo, href: l.href })) };
  } catch (e) {
    return { ok: false, motivo: "erro", detalhe: String(e?.message ?? e) };
  } finally {
    clearInterval(batida);
    await chrome.action.setBadgeText({ text: "" }).catch(() => {});
  }
}

// ─── Mensagens ─────────────────────────────────────────────────────────────────

// Da própria extensão (a janelinha do ícone)
chrome.runtime.onMessage.addListener((pedido, remetente, responder) => {
  if (remetente.id !== chrome.runtime.id) return false;
  (async () => {
    if (pedido?.tipo === "ler-agora") return responder(await lerAgora(pedido));
    if (pedido?.tipo === "ler-lote") return responder(await lerLote(pedido));
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
    if (pedido?.tipo === "pegar-lote") {
      const { lote } = await chrome.storage.local.get("lote");
      if (!lote) return responder({ ok: false, motivo: "nada" });
      // Só o resumo de cada pedido; os arquivos vêm um a um (pegar-item)
      const itens = lote.itens.map((x) => ({
        id: x.id,
        codigo: x.codigo,
        titulo: x.titulo,
        linha: x.linha,
        arquivos: x.pendente.arquivos.length,
        falhas: x.pendente.falhas.length,
        caracteres: x.pendente.texto.length,
        status: x.resumo?.status?.rotulo ?? "",
      }));
      return responder({ ok: true, lote: { id: lote.id, criadoEm: lote.criadoEm, origem: lote.origem, total: lote.total, interrompido: !!lote.interrompido, problemas: lote.problemas, itens } });
    }
    if (pedido?.tipo === "pegar-item") {
      const { lote } = await chrome.storage.local.get("lote");
      const item = lote?.itens.find((x) => x.id === pedido.id);
      return responder(item ? { ok: true, pendente: item.pendente } : { ok: false, motivo: "nada" });
    }
    if (pedido?.tipo === "consumir-item") {
      const { lote } = await chrome.storage.local.get("lote");
      if (lote) {
        lote.itens = lote.itens.filter((x) => x.id !== pedido.id);
        if (lote.itens.length) await chrome.storage.local.set({ lote });
        else await chrome.storage.local.remove("lote");
      }
      return responder({ ok: true });
    }
    if (pedido?.tipo === "descartar-lote") {
      await chrome.storage.local.remove("lote");
      return responder({ ok: true });
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
