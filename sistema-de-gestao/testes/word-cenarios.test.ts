import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import PizZip from "pizzip";
import { gerarDocx } from "../src/lib/relatorio/docx";
import { preencherVazios } from "../src/lib/relatorio/padroes";
import { clienteDeExemplo, consultorDeExemplo, modeloDocx, projetoDeExemplo, textoDoXml } from "./fixtures";

// Os 5 relatórios de um projeto de teste (transportadora fictícia de 13 pessoas) com os textos de cada cenário escritos à mão
// nas regras novas: não é a IA escrevendo, é o que o sistema (textos-padrão, matriz, Word) faz com um conteúdo assim.
// Com SAIDA=<pasta>, os 5 Word ficam salvos nela para abrir e conferir.
const SECOES = ["objeto", "natureza", "escopo", "atividades_realizadas", "caracterizacao", "medidas", "encaminhamentos", "conclusao", "evidencias"];

function projetoDosCenarios() {
  const p = projetoDeExemplo();
  p.etapas.forEach((e, i) => {
    e.dataLimiteInformacoes = i === 1 ? "2026-10-12" : null;
    e.status = i < 4 ? "enviada" : "em_redacao";
    e.atividades.forEach((a) => (a.status = "feito"));
  });
  for (const e of p.etapas) preencherVazios(p, e, clienteDeExemplo, SECOES);
  // Etapa 01: planilha enviada ao cliente errado; sem nenhuma evidência anexada em todo o projeto
  p.etapas[0].secoes.diagnostico = "A empresa tem 13 pessoas. Na semana anterior à visita, uma planilha com nome, CPF e endereço de 40 clientes foi enviada por e-mail ao cliente errado, conforme relato da diretora.";
  // Etapa 02: decisão que reduz proteção; o fornecedor de e-mail ficou sem desfecho informado
  p.etapas[1].secoes.diagnostico = [
    "A diretora informou que avaliou o risco do incidente como baixo e decidiu não comunicá-lo à ANPD nem aos titulares. A decisão pode ser compatível com a Resolução CD/ANPD nº 15/2024, desde que a fundamentação esteja documentada; a consultoria não verificou os documentos que a sustentam [a confirmar: critérios de risco usados; quem avaliou; data da avaliação; evidência do registro].",
    "O questionário de due diligence foi enviado ao fornecedor de e-mail corporativo [a confirmar: se o fornecedor respondeu].",
  ].join("\n\n");
  // Etapa 03: o teste de restauração do backup não foi feito (entregável sem conteúdo = Pendente de evidência)
  p.etapas[2].entregaveis.forEach((x) => x.tipo === "entregavel" && x.titulo !== "Integridade dos backups" && (x.conteudo = "Conteúdo apresentado."));
  p.etapas[2].entregaveis.find((x) => x.titulo === "Integridade dos backups")!.conteudo = "";
  p.etapas[2].secoes.conclusao = ""; // regenera com a matriz do estado final
  p.etapas[2].evidencias = [{ id: "ev1", caminho: "x", nome: "x.png", legenda: "Print", tipo: "image/png" } as never];
  delete p.etapas[2].secoes.conclusao;
  preencherVazios(p, p.etapas[2], clienteDeExemplo, ["conclusao"]);
  // Etapa 04: só a síntese (risco médio para exames e baixo para câmeras)
  p.etapas[3].entregaveis.find((x) => x.titulo === "Relatórios de impacto à proteção de dados (RIPDs)")!.conteudo = [
    "## Síntese do RIPD",
    "A diretora informou que o risco é médio para o tratamento de exames e baixo para o das câmeras.",
    "[completar: anexar o RIPD completo com metodologia, ameaças, probabilidade e severidade]",
  ].join("\n\n");
  // Etapa 05: parecer com a formulação cautelosa (nenhuma evidência anexada)
  p.etapas[4].secoes.conclusao = [
    "Das medidas do plano de ação, 6 estão apenas relatadas pelo cliente, e faltam as evidências do teste de restauração do backup, do RIPD completo e dos registros de treinamento.",
    "A empresa passou a contar com um núcleo mínimo de conformidade, compatível com seu porte, que lhe permite responder com maior segurança às demandas de clientes e parceiros, sujeito à apresentação das evidências indicadas e à execução do plano pós-consultoria. Este parecer não constitui auditoria nem certificação.",
  ].join("\n\n");
  return p;
}

test("os 5 Word do projeto de teste: capa completa, sem 'Não procede caracterizar', sem 'Etapa 06', marcadores realçados e menos de 1 MB", async () => {
  const projeto = projetoDosCenarios();
  const saida = process.env.SAIDA;
  if (saida) mkdirSync(saida, { recursive: true });
  const docs: Record<number, { bytes: Uint8Array; xml: string; texto: string }> = {};
  for (const etapa of projeto.etapas) {
    const blob = await gerarDocx({ projeto, etapa, cliente: clienteDeExemplo, consultor: consultorDeExemplo }, [], modeloDocx());
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (saida) writeFileSync(`${saida}/Etapa-0${etapa.ordem}.docx`, bytes);
    const xml = new PizZip(bytes).file("word/document.xml")!.asText();
    docs[etapa.ordem] = { bytes, xml, texto: textoDoXml(xml) };
  }
  for (const o of [1, 2, 3, 4, 5]) {
    const { bytes, xml, texto } = docs[o];
    assert.ok(texto.includes(`Período da Etapa 0${o}`) && texto.includes("Carga horária prevista"), `Etapa ${o}: capa`);
    assert.ok(bytes.length < 1_000_000, `Etapa ${o}: ${bytes.length} bytes`);
    assert.ok(!/Não procede caracterizar/i.test(texto) && !/Etapa 06/.test(texto), `Etapa ${o}`);
    const marcadores = (xml.match(/\[(?:completar|a confirmar)[^\]]*\]/gi) ?? []).length;
    if (marcadores) {
      assert.ok(xml.includes('w:highlight w:val="yellow"'), `Etapa ${o}: realce`);
      assert.ok(texto.includes("PENDÊNCIAS ANTES DO ENVIO"), `Etapa ${o}: caixa`);
      assert.ok(texto.includes(`${marcadores} ${marcadores === 1 ? "marcador" : "marcadores"} a completar`), `Etapa ${o}: contagem ${marcadores}`);
    }
  }
  // Etapa 02: decisão cautelosa e o fornecedor sem desfecho informado
  assert.ok(docs[2].texto.includes("pode ser compatível") && !/\bé compatível\b/.test(docs[2].texto));
  assert.ok(docs[2].texto.includes("[a confirmar: se o fornecedor respondeu]") && !/não respondeu/i.test(docs[2].texto));
  assert.ok(docs[2].texto.includes("Consulta em 12/10/2026."), "a data-limite vira a data de consulta");
  // Etapa 03: matriz com o teste de restauração pendente e fechamento sem "cumprida" geral
  assert.ok(docs[3].texto.includes("Matriz de entregas da Etapa 03"));
  assert.match(docs[3].texto, /Integridade dos backups[\s\S]{0,200}Pendente de evidência/);
  assert.ok(docs[3].texto.includes("considerada cumprida em relação aos entregáveis com status Atendido"));
  assert.ok(!/Considera-se cumprida/i.test(docs[3].texto));
  // Etapa 04: síntese do RIPD
  assert.ok(docs[4].texto.includes("Síntese do RIPD") && docs[4].texto.includes("[completar: anexar o RIPD completo com metodologia, ameaças, probabilidade e severidade]"));
  assert.ok(!/conforme (a conclusão do|o) RIPD/i.test(docs[4].texto));
  // Etapa 05: parecer sem afirmar o que não tem evidência; última seção sem Etapa 06
  assert.ok(!/aptas a demonstrar|comprova\b|plenamente|totalmente|em pleno funcionamento/i.test(docs[5].texto));
  assert.ok(docs[5].texto.includes("núcleo mínimo de conformidade"));
  assert.ok(docs[5].texto.includes("Continuidade do programa após a consultoria"));
});
