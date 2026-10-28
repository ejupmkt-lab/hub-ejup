import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function tentar(base) {
  for (const candidato of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (existsSync(candidato) && statSync(candidato).isFile()) return candidato;
  }
  return null;
}

export async function resolve(specifier, contexto, proximo) {
  let alvo = null;
  if (specifier.startsWith("@/")) alvo = tentar(path.join(raiz, "src", specifier.slice(2)));
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && contexto.parentURL?.startsWith("file:")) {
    alvo = tentar(path.resolve(path.dirname(fileURLToPath(contexto.parentURL)), specifier));
  }
  if (alvo) return { url: pathToFileURL(alvo).href, shortCircuit: true };
  return proximo(specifier, contexto);
}
