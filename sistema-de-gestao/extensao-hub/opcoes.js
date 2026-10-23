const campo = document.getElementById("endereco");
const msg = document.getElementById("msg");
const lista = document.getElementById("lista");

const dizer = (texto, classe) => {
  msg.textContent = texto;
  msg.className = classe ?? "";
};

async function desenhar() {
  const { origins = [] } = await chrome.permissions.getAll();
  lista.replaceChildren();
  const sites = origins.filter((o) => o.startsWith("http"));
  if (!sites.length) {
    const li = document.createElement("li");
    li.textContent = "Nenhum ainda.";
    lista.append(li);
  }
  for (const o of sites) {
    const li = document.createElement("li");
    li.textContent = `${o.replace(/\/\*$/, "")} `;
    const tirar = document.createElement("button");
    tirar.textContent = "Tirar";
    tirar.className = "sec";
    tirar.addEventListener("click", async () => {
      await chrome.permissions.remove({ origins: [o] });
      dizer("Permissão retirada.", "ok");
      desenhar();
    });
    li.append(tirar);
    lista.append(li);
  }
}

document.getElementById("permitir").addEventListener("click", async () => {
  let origem;
  try {
    const url = new URL(campo.value.trim());
    if (url.protocol !== "https:") throw new Error("O endereço do HUB precisa começar com https://");
    origem = `${url.origin}/*`;
  } catch (e) {
    return dizer(e instanceof Error && e.message.startsWith("O endereço") ? e.message : "Cole o endereço completo do HUB, começando com https://", "erro");
  }
  const deu = await chrome.permissions.request({ origins: [origem] });
  dizer(deu ? "Pronto. Pode voltar ao Blimp e clicar em Importar do HUB." : "A permissão não foi dada.", deu ? "ok" : "erro");
  desenhar();
});

desenhar();
