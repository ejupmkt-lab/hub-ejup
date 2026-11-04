import test from "node:test";
import assert from "node:assert/strict";
import { lerPlanilhaDoConsole, totalPorDia } from "../src/lib/ia/console";

const CAB = "usage_date_utc,model,workspace,api_key,usage_type,context_window,token_type,cost_usd,list_price_usd,cost_type,inference_geo,speed,api_key_id,api_key_status";

test("a planilha do console vira custo por dia, modelo e tipo (só o que custou)", () => {
  const csv = [
    CAB,
    "2026-10-22,--,Default,blimp-key,--,--,--,0.00,0.00,code_execution,--,--,apikey_x,",
    "2026-10-22,Claude Opus 5.5,Default,blimp-key,message,≤ 200k,input_no_cache,0.17,0.17,token,global,standard,apikey_x,",
    "2026-10-22,Claude Opus 5.5,Default,blimp-key,message,≤ 200k,output,0.20,0.20,token,global,standard,apikey_x,",
    "2026-10-22,Claude Opus 5.5,Default,blimp-key,message,≤ 200k,input_cache_read,0.00,0.00,token,global,standard,apikey_x,",
    "2026-10-23,Claude Opus 5.5,Default,blimp-key,message,≤ 200k,output,0.05,0.05,token,global,standard,apikey_x,",
    "",
  ].join("\n");
  const linhas = lerPlanilhaDoConsole(csv);
  assert.deepEqual(linhas, [
    { dia: "2026-10-22", modelo: "Claude Opus 5.5", tipo: "input_no_cache", custo: 0.17 },
    { dia: "2026-10-22", modelo: "Claude Opus 5.5", tipo: "output", custo: 0.2 },
    { dia: "2026-10-23", modelo: "Claude Opus 5.5", tipo: "output", custo: 0.05 },
  ]);
  const dias = totalPorDia(linhas);
  assert.equal(Math.round((dias.get("2026-10-22") ?? 0) * 100) / 100, 0.37);
});

test("linhas repetidas somam; aceita CRLF, BOM e aspas; custo que não é código da coluna vira o tipo de custo", () => {
  const csv = "﻿" + [CAB, '2026-11-01,"Claude Opus 5.5",Default,k,message,x,output,0.10,0.10,token,g,s,i,', '2026-11-01,"Claude Opus 5.5",Default,k,message,x,output,0.05,0.05,token,g,s,i,', "2026-11-01,--,Default,k,--,--,--,0.30,0.30,web_search,--,--,i,"].join("\r\n");
  const linhas = lerPlanilhaDoConsole(csv);
  assert.deepEqual(linhas, [
    { dia: "2026-11-01", modelo: "Claude Opus 5.5", tipo: "output", custo: 0.15 },
    { dia: "2026-11-01", modelo: "--", tipo: "web_search", custo: 0.3 },
  ]);
});

test("um arquivo que não é a planilha de custos é recusado com uma mensagem clara", () => {
  assert.throws(() => lerPlanilhaDoConsole("nome,valor\nA,1"), /não parece ser o relatório de custos/);
});
