// Planilha de custos exportada do console da Anthropic (Cost, por dia): colunas usage_date_utc, model, token_type, cost_usd, cost_type...
// Cada linha vira um custo por dia, modelo e tipo (input_no_cache, output, input_cache_read...), somando o que repetir.

export type CustoDoConsole = { dia: string; modelo: string; tipo: string; custo: number };

// Divide o CSV em linhas de células (aspas e vírgulas dentro de aspas valem)
function celulas(texto: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (c === '"') aspas = false;
      else atual += c;
    } else if (c === '"') aspas = true;
    else if (c === ",") {
      linha.push(atual);
      atual = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(atual);
      atual = "";
      if (linha.some((x) => x.trim())) linhas.push(linha);
      linha = [];
    } else atual += c;
  }
  linha.push(atual);
  if (linha.some((x) => x.trim())) linhas.push(linha);
  return linhas;
}

export function lerPlanilhaDoConsole(texto: string): CustoDoConsole[] {
  const linhas = celulas(texto.replace(/^﻿/, ""));
  const cab = (linhas[0] ?? []).map((x) => x.trim());
  const col = (nome: string) => cab.indexOf(nome);
  const [iDia, iModelo, iToken, iCusto, iTipoCusto] = ["usage_date_utc", "model", "token_type", "cost_usd", "cost_type"].map(col);
  if ([iDia, iModelo, iToken, iCusto, iTipoCusto].some((i) => i < 0)) throw new Error("Esta planilha não parece ser o relatório de custos do console da Anthropic (faltam colunas como usage_date_utc e cost_usd).");
  const soma = new Map<string, CustoDoConsole>();
  for (const l of linhas.slice(1)) {
    const dia = (l[iDia] ?? "").trim();
    const custo = Number((l[iCusto] ?? "").trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !Number.isFinite(custo) || custo <= 0) continue;
    const modelo = (l[iModelo] ?? "").trim() || "--";
    const tipoCusto = (l[iTipoCusto] ?? "").trim();
    const tipo = tipoCusto === "token" ? (l[iToken] ?? "").trim() || "token" : tipoCusto || "outro";
    const chave = `${dia}|${modelo}|${tipo}`;
    const atual = soma.get(chave);
    soma.set(chave, { dia, modelo, tipo, custo: Math.round(((atual?.custo ?? 0) + custo) * 10000) / 10000 });
  }
  return [...soma.values()].sort((a, b) => a.dia.localeCompare(b.dia) || a.tipo.localeCompare(b.tipo));
}

export const totalPorDia = (linhas: { dia: string; custo: number }[]) => {
  const m = new Map<string, number>();
  for (const l of linhas) m.set(l.dia, (m.get(l.dia) ?? 0) + l.custo);
  return m;
};
