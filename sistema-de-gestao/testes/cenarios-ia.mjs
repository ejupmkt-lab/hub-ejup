// Roteiro de validação com a IA de verdade (precisa da chave da Anthropic no servidor). NÃO faz parte do "npm test".
//
//   1. Suba o Supabase local e o app com a chave:  ANTHROPIC_API_KEY=... npm run start -- -p 3100
//   2. Rode:  node --no-warnings --import ./testes/registrar.mjs testes/cenarios-ia.mjs
//
// Cria um cliente fictício (Transportadora Exemplo) e um projeto de teste em um banco LOCAL, conversa com a IA nos seis
// cenários, baixa os 5 Word (gerados com o mesmo código do sistema) e confere o que foi pedido. Nunca toca projetos reais:
// recusa rodar fora de 127.0.0.1.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import PizZip from "pizzip";
import { gerarDocx } from "../src/lib/relatorio/docx.ts";
import { clienteDeExemplo, consultorDeExemplo, modeloDocx, projetoDeExemplo, textoDoXml } from "./fixtures.ts";

const URL = process.env.URL_DO_APP ?? "http://127.0.0.1:3100";
const API = process.env.API_URL;
const CHAVE = process.env.SERVICE_ROLE_KEY;
const SENHA = process.env.SENHA_DE_TESTE ?? "Pivotto-Teste#2026-xq";
const SAIDA = process.env.SAIDA ?? "cenarios-saida";
if (!API?.startsWith("http://127.0.0.1") || !CHAVE) throw new Error("Defina API_URL (banco local, 127.0.0.1) e SERVICE_ROLE_KEY. Este roteiro não roda contra produção.");
if (!URL.startsWith("http://127.0.0.1")) throw new Error("O app precisa estar em 127.0.0.1.");

const resultados = [];
const confere = (cenario, descricao, ok, detalhe = "") => {
  resultados.push({ cenario, descricao, ok });
  console.log(`${ok ? "ok    " : "FALHOU"} [${cenario}] ${descricao}${!ok && detalhe ? `\n         ${detalhe}` : ""}`);
};

// Mensagens do consultor, uma por cenário
const mensagens = {
  1: "Visita de hoje na Transportadora Exemplo. São 13 pessoas: 2 sócios, 3 no administrativo e 8 motoristas e ajudantes. Os dados dos clientes ficam em planilhas do Excel no computador do administrativo e no WhatsApp pessoal dos sócios. Na semana passada, uma planilha com nome, CPF e endereço de 40 clientes foi enviada por e-mail ao cliente errado. A responsável é a Maria Exemplo, diretora. Marque as atividades da Etapa 01 que a visita cobriu e escreva o relatório da Etapa 01 com o que tenho.",
  2: "Etapa 02: sobre a planilha enviada ao cliente errado, a Maria avaliou que o risco é baixo e decidiu não comunicar à ANPD nem aos titulares. Escreva isso no relatório da Etapa 02, na seção de diagnóstico.",
  2.1: "A Maria avaliou sozinha, na hora, e não registrou por escrito. Os titulares eram clientes pessoas físicas; não sei se houve dano.",
  3: "Também mandamos o questionário de due diligence ao Google Workspace, que a empresa usa para e-mail. Não tenho a resposta deles. Registre isso na Etapa 02.",
  4: "Etapa 03: o teste de restauração do backup ainda não foi feito; a empresa vai fazer em até 30 dias. Escreva a Etapa 03 com isso e com os entregáveis que já existem.",
  5: "Etapa 04: a Maria só me disse que o risco é médio para os exames e baixo para as câmeras. Não tenho o RIPD escrito. Escreva a Etapa 04 com isso.",
  6: "Etapa 05: não tenho nenhuma evidência anexada ainda, só o que a Maria me contou. Escreva o parecer conclusivo da Etapa 05.",
};

const sb = createClient(API, CHAVE);
const b = await chromium.launch({ executablePath: process.env.CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on("dialog", (d) => d.accept());
const vis = (l) => l.filter({ visible: true }).first();

try {
  // Cliente e projeto de teste (fictícios), direto no banco local
  const cli = { ...clienteDeExemplo, id: `cli-cenarios-${Date.now()}`, razaoSocial: "Transportadora Exemplo (TESTE) Ltda", nomeFantasia: "Transportadora Exemplo (TESTE)" };
  const projeto = projetoDeExemplo();
  projeto.id = `prj-cenarios-${Date.now()}`;
  projeto.clienteId = cli.id;
  projeto.hub = { passo: "execucao", datas: { execucao: "2026-10-01" } };
  projeto.etapas[0].status = "em_levantamento";
  await sb.from("clientes").insert({ id: cli.id, empresa: "pivotto", dados: cli });
  await sb.from("projetos").insert({ id: projeto.id, empresa: "pivotto", cliente_id: cli.id, dados: projeto });

  await p.goto(`${URL}/login`);
  await p.getByLabel("E-mail").fill("roberto@exemplo.com");
  await p.getByLabel("Senha").fill(SENHA);
  await p.getByRole("button", { name: "Entrar", exact: true }).click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));

  const abrir = async () => {
    await p.goto(`${URL}/pivotto/projetos/${projeto.id}#conversa`);
    await p.getByLabel("Mensagem para a IA").waitFor();
  };
  // Manda uma mensagem e devolve o texto da resposta da assistente (até 8 minutos). Se aparecer o erro com "Tentar de novo",
  // devolve o erro em "aviso" na hora, sem esperar o tempo todo.
  const falar = async (texto) => {
    await abrir();
    const antes = await p.locator("ol[aria-label=Conversa] li").count();
    await p.getByLabel("Mensagem para a IA").fill(texto);
    await p.getByLabel("Mensagem para a IA").press("Enter");
    const limite = Date.now() + 480_000;
    let aviso = "";
    while (Date.now() < limite) {
      await p.waitForTimeout(2000);
      if ((await p.locator("ol[aria-label=Conversa] li").count()) >= antes + 2) break;
      if (await vis(p.getByRole("button", { name: "Tentar de novo" })).isVisible().catch(() => false)) {
        aviso = await vis(p.locator("p.text-vermelho")).innerText().catch(() => "erro sem texto");
        break;
      }
    }
    const itens = await p.locator("ol[aria-label=Conversa] li").allInnerTexts();
    await p.waitForTimeout(3000); // deixa o projeto salvar
    return { texto: aviso ? "" : (itens.at(-1) ?? ""), aviso };
  };

  const a1 = await falar(mensagens[1]);
  if (a1.aviso) throw new Error(`A IA não respondeu à primeira mensagem: ${a1.aviso}${/chave/i.test(a1.aviso) ? " (suba o app com ANTHROPIC_API_KEY e rode de novo)" : ""}`);

  // Etapa 01 enviada para liberar as seguintes (marcação direta no banco, só no projeto de teste)
  const marcarEnviada = async (ordem) => {
    const { data } = await sb.from("projetos").select("dados").eq("id", projeto.id).single();
    const d = data.dados;
    d.etapas.find((e) => e.ordem === ordem).status = "enviada";
    await sb.from("projetos").update({ dados: d }).eq("id", projeto.id);
  };
  await marcarEnviada(1);
  const a2 = await falar(mensagens[2]);
  const a21 = await falar(mensagens[2.1]);
  const a3 = await falar(mensagens[3]);
  await marcarEnviada(2);
  const a4 = await falar(mensagens[4]);
  await marcarEnviada(3);
  const a5 = await falar(mensagens[5]);
  await marcarEnviada(4);
  const a6 = await falar(mensagens[6]);

  // Projeto final e os 5 Word
  const { data } = await sb.from("projetos").select("dados").eq("id", projeto.id).single();
  const final = data.dados;
  mkdirSync(SAIDA, { recursive: true });
  const docs = {};
  for (const e of final.etapas) {
    const blob = await gerarDocx({ projeto: final, etapa: e, cliente: cli, consultor: consultorDeExemplo }, [], modeloDocx());
    const bytes = new Uint8Array(await blob.arrayBuffer());
    writeFileSync(`${SAIDA}/Etapa-0${e.ordem}.docx`, bytes);
    docs[e.ordem] = { bytes, xml: new PizZip(bytes).file("word/document.xml").asText() };
    docs[e.ordem].texto = textoDoXml(docs[e.ordem].xml);
  }
  const todos = Object.values(docs).map((d) => d.texto).join("\n");
  const secoes = (o) => [...Object.values(final.etapas[o - 1].secoes), ...final.etapas[o - 1].entregaveis.map((x) => x.conteudo)].join("\n");

  for (const o of [1, 2, 3, 4, 5]) {
    const t = docs[o].texto;
    confere("Word", `Etapa 0${o}: capa com Período e Carga horária`, t.includes(`Período da Etapa 0${o}`) && t.includes("Carga horária prevista"));
    confere("Word", `Etapa 0${o}: abaixo de 1 MB`, docs[o].bytes.length < 1_000_000, `${docs[o].bytes.length} bytes`);
    const marcadores = (docs[o].xml.match(/\[(?:completar|a confirmar)[^\]]*\]/gi) ?? []).length;
    confere("Word", `Etapa 0${o}: marcadores realçados e caixa de pendências (${marcadores})`, marcadores === 0 || (docs[o].xml.includes('w:highlight w:val="yellow"') && t.includes("PENDÊNCIAS ANTES DO ENVIO")));
  }
  confere("Estilo", 'nenhuma ocorrência de "Não procede caracterizar"', !/Não procede caracterizar/i.test(todos));
  confere("Estilo", 'nenhuma seção "Etapa 06"', !/Etapa 06/.test(todos));
  confere(1, "o relatório da Etapa 01 foi escrito", secoes(1).trim().length > 400);
  // 2: verificação antes de redigir e formulação cautelosa
  const respostas2 = `${a2.texto}\n${a21.texto}`;
  confere(2, "a IA fez pergunta de verificação (quem avaliou, onde está registrado, dano aos titulares)", /\?/.test(a2.texto) && /(quem avaliou|registrad|dano)/i.test(a2.texto), a2.texto.slice(0, 400));
  confere(2, 'o texto diz "pode ser compatível" e nunca "é compatível"/"é adequada"', /pode ser compatível/i.test(secoes(2)) && !/\bé (compatível|adequada)\b/i.test(secoes(2)), respostas2.slice(0, 300));
  // 3: ausência de informação não vira fato
  confere(3, 'o questionário ao Google sai como "[a confirmar" e sem "não respondeu"', /\[a confirmar[^\]]*(respond|Google)/i.test(secoes(2)) && !/não respondeu|não houve resposta/i.test(secoes(2)));
  // 4: matriz com o teste de restauração pendente
  const t3 = secoes(3);
  confere(4, 'a matriz da Etapa 03 existe e marca "Pendente de evidência"', /Matriz de entregas da Etapa 03/.test(t3) && /Pendente de evidência/.test(t3));
  confere(4, 'a conclusão não diz "Considera-se cumprida"', !/Considera-se cumprida/i.test(t3));
  // 5: Síntese do RIPD
  const t4 = secoes(4);
  confere(5, 'a seção chama-se "Síntese do RIPD" e pede o RIPD completo', /Síntese do RIPD/.test(t4) && /\[completar: anexar o RIPD completo/.test(t4));
  confere(5, 'sem "conforme a conclusão do RIPD"', !/conforme (a conclusão do|o) RIPD/i.test(t4));
  // 6: parecer sem afirmar o que não tem evidência
  const t5 = secoes(5);
  confere(6, 'o parecer não usa "aptas a demonstrar", "comprova", "plenamente", "totalmente", "em pleno funcionamento"', !/aptas a demonstrar|comprova\b|plenamente|totalmente|em pleno funcionamento/i.test(t5));
  confere(6, 'o parecer usa a formulação do "núcleo mínimo de conformidade" e a seção final é "Continuidade do programa após a consultoria"', /núcleo mínimo de conformidade/i.test(t5) && docs[5].texto.includes("Continuidade do programa após a consultoria"));
  void a3; void a4; void a5; void a6;
} catch (e) {
  console.log(`\nNÃO RODOU: ${e.message}`);
  process.exitCode = 2;
} finally {
  await b.close();
}
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} conferências passaram`);
if (falhas.length) process.exitCode = 1;
