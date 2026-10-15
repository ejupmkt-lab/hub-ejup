// Recusa senhas que já apareceram em vazamentos públicos (base Have I Been
// Pwned). Só os 5 primeiros caracteres do hash SHA-1 saem do navegador; a
// senha nunca é enviada. Se o serviço não responder, não bloqueia o cadastro.
export async function senhaVazada(senha: string): Promise<boolean> {
  try {
    const bytes = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(senha));
    const hash = Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const r = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, { headers: { "Add-Padding": "true" } });
    if (!r.ok) return false;
    const resto = hash.slice(5);
    return (await r.text()).split("\n").some((l) => {
      const [sufixo, vezes] = l.trim().split(":");
      return sufixo === resto && Number(vezes) > 0;
    });
  } catch {
    return false;
  }
}

export const MSG_SENHA_VAZADA = "Essa senha já apareceu em vazamentos de dados na internet. Escolha outra.";
