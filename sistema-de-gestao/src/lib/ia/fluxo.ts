// Lê a resposta em fluxo de /api/conversa (uma linha JSON por evento): "vivo" e "progresso" mantêm a conexão e mostram o
// andamento, "fim" traz o resultado e "erro", o problema explicado. Se a conexão acabar sem "fim", a função do servidor foi
// interrompida (tempo limite) ou a rede caiu.
export type ResultadoDaIA = { resposta: string; acoes: unknown[] };

export async function lerFluxoDaIA(corpo: ReadableStream<Uint8Array>, aoProgredir?: (caracteres: number) => void): Promise<ResultadoDaIA> {
  const leitor = corpo.getReader();
  const decodificador = new TextDecoder();
  let resto = "";
  const tratar = (linha: string): ResultadoDaIA | null => {
    if (!linha.trim()) return null;
    let evento: { tipo?: string; caracteres?: number; resposta?: string; acoes?: unknown[]; erro?: string };
    try {
      evento = JSON.parse(linha);
    } catch {
      return null;
    }
    if (evento.tipo === "progresso" && typeof evento.caracteres === "number") aoProgredir?.(evento.caracteres);
    if (evento.tipo === "erro") throw new Error(evento.erro || "Não foi possível falar com a IA agora.");
    if (evento.tipo === "fim") return { resposta: String(evento.resposta ?? ""), acoes: Array.isArray(evento.acoes) ? evento.acoes : [] };
    return null;
  };
  for (;;) {
    const { value, done } = await leitor.read();
    if (value) resto += decodificador.decode(value, { stream: !done });
    const linhas = resto.split("\n");
    resto = linhas.pop() ?? "";
    for (const linha of linhas) {
      const r = tratar(linha);
      if (r) return r;
    }
    if (done) break;
  }
  const r = tratar(resto);
  if (r) return r;
  throw new Error("A conexão com a IA acabou antes da resposta terminar. Provavelmente o tempo limite do servidor se esgotou: mande o conteúdo em partes menores e tente de novo.");
}
