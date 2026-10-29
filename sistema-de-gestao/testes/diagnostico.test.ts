import test from "node:test";
import assert from "node:assert/strict";
import PizZip from "pizzip";
import { aplicarAcoes, desfazerAcoes } from "../src/lib/conversa";
import { gerarDocxDiagnostico } from "../src/lib/relatorio/docx";
import { SISTEMA } from "../src/lib/ia/conversa-prompt";
import { passoDoProjeto } from "../src/lib/proximo-passo";
import { clienteDeExemplo, consultorDeExemplo, modeloDocx, projetoDeExemplo, textoDoXml } from "./fixtures";

const TEXTO = [
  "## Identificação da empresa e da demanda",
  "A Transportadora Exemplo solicitou a adequação à LGPD, conforme o pedido registrado no HUB.",
  "## O que foi mapeado",
  "a) dados de clientes em planilhas do Excel;",
  "b) cópias no WhatsApp pessoal dos sócios.",
  "## Justificativa da solicitação",
  "A empresa trata dados de 40 clientes [completar: base legal usada] sem registro formal.",
].join("\n\n");

async function docx(p = projetoDeExemplo()) {
  const blob = await gerarDocxDiagnostico({ projeto: p, cliente: clienteDeExemplo, consultor: consultorDeExemplo }, "2026-10-29", modeloDocx());
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const xml = new PizZip(bytes).file("word/document.xml")!.asText();
  return { bytes, xml, texto: textoDoXml(xml) };
}

test("a IA escreve o diagnóstico (texto completo) e dá para desfazer sem perder o arquivo anexado", () => {
  const p = projetoDeExemplo();
  const { itens, desfazer } = aplicarAcoes(p, [{ tipo: "escrever_diagnostico", texto: TEXTO }], [], "m1", "Consultor");
  assert.equal(p.diagnostico?.texto, TEXTO);
  assert.equal(p.diagnostico?.arquivo, null);
  assert.ok(itens[0].descricao.includes("Diagnóstico: texto escrito") && itens[0].descricao.includes("Entregas"));
  // segunda mensagem atualiza o texto inteiro
  p.diagnostico!.arquivo = { caminho: "pivotto/prj/diagnostico/x.docx", nome: "x.docx", tipo: "application/msword", tamanho: 10, enviadoEm: "2026-10-29T10:00:00Z", por: "Consultor" };
  const r2 = aplicarAcoes(p, [{ tipo: "escrever_diagnostico", texto: `${TEXTO}\n\nNovo parágrafo.` }], [], "m2", "Consultor");
  assert.ok(p.diagnostico!.texto.endsWith("Novo parágrafo.") && r2.itens[0].descricao.includes("atualizado"));
  desfazerAcoes(p, r2.desfazer);
  assert.equal(p.diagnostico!.texto, TEXTO, "desfazer volta o texto");
  assert.equal(p.diagnostico!.arquivo?.nome, "x.docx", "o arquivo anexado fica");
  desfazerAcoes(p, desfazer);
  assert.equal(p.diagnostico!.texto, "", "voltou ao começo");
  assert.ok(p.diagnostico!.arquivo, "o arquivo continua anexado");
  // texto vazio não vale
  const q = projetoDeExemplo();
  assert.equal(aplicarAcoes(q, [{ tipo: "escrever_diagnostico", texto: "   " }], [], "m3", "x").itens.length, 0);
  assert.equal(q.diagnostico, undefined);
});

test("o Word do diagnóstico: capa de identificação sem período e carga, texto numerado, marcadores realçados e só a assinatura do consultor", async () => {
  const p = projetoDeExemplo();
  p.diagnostico = { texto: TEXTO, atualizadoEm: "2026-10-29", arquivo: null };
  const { bytes, xml, texto } = await docx(p);
  assert.ok(bytes.length < 1_000_000);
  for (const rotulo of ["Prestadora vinculada", "Cliente", "CNPJ", "Responsável", "Contato", "Endereço", "Gestora Sebrae", "Projeto HUB", "Ficha técnica", "Código da ficha técnica", "Segmento", "Área de atuação da consultoria"])
    assert.ok(texto.includes(rotulo), rotulo);
  assert.ok(!texto.includes("Carga horária prevista") && !texto.includes("Período da Etapa"), "período e carga são das etapas");
  assert.ok(texto.includes("DIAGNÓSTICO DA DEMANDA"));
  assert.match(texto, /1\. Identificação da empresa e da demanda/);
  assert.match(texto, /3\. Justificativa da solicitação/);
  assert.ok(texto.includes("a) dados de clientes em planilhas do Excel;"));
  assert.ok(xml.includes('w:highlight w:val="yellow"') && texto.includes("PENDÊNCIAS ANTES DO ENVIO") && texto.includes("1 marcador a completar"));
  assert.ok(texto.includes("Consultor de Exemplo") && !texto.includes("Responsável pela Empresa Demandante"), "só o consultor assina");
  assert.ok(texto.includes("29 de outubro de 2026"));
  assert.ok(!/Não procede caracterizar|Etapa 06/.test(texto));
});

test("sem texto, o Word avisa que o diagnóstico ainda não foi escrito", async () => {
  const { texto } = await docx(projetoDeExemplo());
  assert.ok(texto.includes("o diagnóstico ainda não foi escrito"));
  assert.ok(texto.includes("PENDÊNCIAS ANTES DO ENVIO"));
});

test("a IA sabe do diagnóstico em arquivo: usa a ação e não diz que não pode enviar", () => {
  assert.ok(SISTEMA.includes('"escrever_diagnostico"'));
  assert.ok(SISTEMA.includes("texto COMPLETO e atualizado"));
  assert.ok(SISTEMA.includes('nunca diga que "não pode enviar" o diagnóstico'));
  assert.ok(SISTEMA.includes('"Baixar diagnóstico em Word"'));
  assert.ok(SISTEMA.includes("Entregas, na área Diagnóstico"));
});

test("o próximo passo da fase do diagnóstico leva à área Diagnóstico das Entregas", () => {
  const p = projetoDeExemplo();
  p.hub = { passo: "diagnostico", datas: { diagnostico: "2026-10-01" } } as never;
  const passo = passoDoProjeto(p)!;
  assert.ok(passo.href.endsWith("#diagnostico"), passo.href);
  assert.match(passo.texto, /Elabore o diagnóstico/);
  p.diagnostico = { texto: "Texto.", atualizadoEm: "2026-10-29", arquivo: null };
  assert.match(passoDoProjeto(p)!.texto, /Revise o diagnóstico, baixe o Word/);
});
