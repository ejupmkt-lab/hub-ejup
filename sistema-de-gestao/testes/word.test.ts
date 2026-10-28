import test from "node:test";
import assert from "node:assert/strict";
import PizZip from "pizzip";
import { gerarDocx } from "../src/lib/relatorio/docx";
import { preencherVazios } from "../src/lib/relatorio/padroes";
import { clienteDeExemplo, consultorDeExemplo, modeloDocx, projetoDeExemplo, textoDoXml } from "./fixtures";

async function docx(projeto = projetoDeExemplo(), ordem = 1) {
  const etapa = projeto.etapas.find((e) => e.ordem === ordem)!;
  const blob = await gerarDocx({ projeto, etapa, cliente: clienteDeExemplo, consultor: consultorDeExemplo }, [], modeloDocx());
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const zip = new PizZip(bytes);
  const xml = zip.file("word/document.xml")!.asText();
  return { bytes, zip, xml, texto: textoDoXml(xml) };
}

const linhasDaCapa = (ordem: number) => [
  "Prestadora vinculada",
  "Cliente",
  "CNPJ",
  "Responsável",
  "Contato",
  "Endereço",
  "Gestora Sebrae",
  "Projeto HUB",
  "Ficha técnica",
  "Código da ficha técnica",
  "Segmento",
  "Área de atuação da consultoria",
  `Período da Etapa 0${ordem}`,
  "Carga horária prevista",
];

test("a capa das 5 etapas tem as 14 linhas, inclusive Período e Carga horária da Etapa 01", async () => {
  const projeto = projetoDeExemplo();
  for (const ordem of [1, 2, 3, 4, 5]) {
    const { texto } = await docx(projeto, ordem);
    const linhas = linhasDaCapa(ordem);
    assert.equal(linhas.length, 14);
    for (const rotulo of linhas) assert.ok(texto.includes(rotulo), `Etapa ${ordem}: falta "${rotulo}" na capa`);
    const e = projeto.etapas[ordem - 1];
    assert.ok(texto.includes(`${e.horasPrevistas} horas`), `Etapa ${ordem}: carga horária`);
  }
});

test("sem plano de trabalho, Período e Carga horária mostram 'A definir' em vez de sumir", async () => {
  const projeto = projetoDeExemplo({ comPlano: false });
  projeto.etapas[0].horasPrevistas = 0;
  const { texto } = await docx(projeto, 1);
  assert.ok(texto.includes("Período da Etapa 01"));
  assert.ok(texto.includes("Carga horária prevista"));
  assert.ok((texto.match(/A definir/g) ?? []).length >= 2);
});

test("o Word sem imagens pesa bem menos de 1 MB e não leva a miniatura do modelo", async () => {
  const { bytes, zip } = await docx();
  assert.ok(bytes.length < 1_000_000, `pesou ${bytes.length} bytes`);
  assert.equal(zip.file("docProps/thumbnail.emf"), null);
  assert.ok(!/thumbnail/i.test(zip.file("_rels/.rels")!.asText()));
  const modelo = new PizZip(modeloDocx());
  assert.equal(modelo.file("docProps/thumbnail.emf"), null, "o modelo em public/modelos já não tem a miniatura");
});

test("marcadores [completar] e [a confirmar] saem com realce amarelo e a caixa de pendências vem logo após a capa", async () => {
  const projeto = projetoDeExemplo();
  const etapa = projeto.etapas[0];
  etapa.secoes.objeto = "Texto do objeto com [completar: nome do sistema] e [a confirmar: se o fornecedor respondeu].";
  etapa.entregaveis[0].conteudo = "Entregável com [completar: tabela].";
  const { xml, texto } = await docx(projeto, 1);
  assert.equal((xml.match(/<w:highlight w:val="yellow"\/>/g) ?? []).length, 3);
  assert.ok(texto.includes("PENDÊNCIAS ANTES DO ENVIO"));
  assert.ok(texto.includes("3 marcadores a completar"));
  assert.ok(texto.indexOf("PENDÊNCIAS ANTES DO ENVIO") < texto.indexOf("Objeto da 1ª entrega"), "a caixa vem antes do corpo");
  assert.ok(texto.indexOf("PENDÊNCIAS ANTES DO ENVIO") > texto.indexOf("Carga horária prevista"), "a caixa vem depois da capa");
  // o realce cobre só o marcador, não a frase inteira
  assert.ok(/<w:highlight w:val="yellow"\/><\/w:rPr><w:t xml:space="preserve">\[completar: nome do sistema\]<\/w:t>/.test(xml));
});

test("sem marcadores abertos não há caixa nem realce", async () => {
  const projeto = projetoDeExemplo();
  projeto.etapas[0].secoes.objeto = "Texto completo, sem pendências.";
  const { xml, texto } = await docx(projeto, 1);
  assert.ok(!texto.includes("PENDÊNCIAS ANTES DO ENVIO"));
  assert.ok(!xml.includes("w:highlight"));
});

test("a data de 'Consulta em' das referências é a data-limite das informações do relatório", async () => {
  const projeto = projetoDeExemplo();
  const etapa = projeto.etapas[1];
  etapa.dataLimiteInformacoes = "2026-10-12";
  const { texto } = await docx(projeto, 2);
  assert.ok(texto.includes("Consulta em 12/10/2026."), "usa a data-limite");
  assert.ok(!texto.includes("Consulta em 01/01/2026"), "não usa a data fixa do modelo");
});

test("os relatórios gerados com os textos-padrão não têm 'Não procede caracterizar' nem 'Etapa 06'", async () => {
  const projeto = projetoDeExemplo();
  for (const etapa of projeto.etapas) preencherVazios(projeto, etapa, clienteDeExemplo, ["objeto", "natureza", "escopo", "atividades_realizadas", "caracterizacao", "medidas", "encaminhamentos", "conclusao", "evidencias"]);
  for (const ordem of [1, 2, 3, 4, 5]) {
    const { texto } = await docx(projeto, ordem);
    assert.ok(!/Não procede caracterizar/i.test(texto), `Etapa ${ordem}`);
    assert.ok(!/Etapa 06/.test(texto), `Etapa ${ordem}: citou Etapa 06`);
    assert.ok(!/não há Etapa/i.test(texto));
  }
  const { texto } = await docx(projeto, 5);
  assert.ok(texto.includes("Continuidade do programa após a consultoria"), "título da última seção");
  assert.ok(!texto.includes("Encaminhamentos para a Etapa 06"));
  const e4 = (await docx(projeto, 4)).texto;
  assert.ok(e4.includes("Encaminhamentos para a Etapa 05"));
});
