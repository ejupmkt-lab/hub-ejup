import test from "node:test";
import assert from "node:assert/strict";
import { contarAConfirmar, contarMarcadores, statusDoEntregavel, textoPadraoSecao } from "../src/lib/relatorio/padroes";
import { ehUltimaEtapa, secoesDepois, verificarCompletude } from "../src/lib/relatorio/secoes";
import { clienteDeExemplo, projetoDeExemplo } from "./fixtures";

const encaminhamentos = secoesDepois.find((d) => d.chave === "encaminhamentos")!;

test("título da seção final: dinâmico, e na última etapa é 'Continuidade do programa após a consultoria'", () => {
  const projeto = projetoDeExemplo();
  for (const e of projeto.etapas) {
    const ultima = ehUltimaEtapa(projeto.etapas, e);
    assert.equal(ultima, e.ordem === 5);
    const titulo = encaminhamentos.titulo(e, ultima);
    if (ultima) assert.equal(titulo, "Continuidade do programa após a consultoria");
    else assert.equal(titulo, `Encaminhamentos para a Etapa 0${e.ordem + 1}`);
    assert.ok(!/Etapa 06/.test(titulo));
  }
  const ultimo = textoPadraoSecao("encaminhamentos", projeto, projeto.etapas[4], clienteDeExemplo);
  assert.ok(ultimo.includes("A consultoria se encerra com esta entrega"));
  assert.ok(!/Etapa 06|não há Etapa/i.test(ultimo));
});

test("status da matriz de entregas: Atendido, Atendido parcialmente e Pendente de evidência", () => {
  const projeto = projetoDeExemplo();
  const e = projeto.etapas[2]; // Etapa 03
  e.atividades.forEach((a) => (a.status = "feito"));
  e.evidencias = [{ id: "ev1", caminho: "x", nome: "x.png", legenda: "Print", tipo: "image/png" } as never];
  assert.equal(statusDoEntregavel(e, "Texto completo do entregável."), "Atendido");
  assert.equal(statusDoEntregavel(e, "Texto com [completar: resultado do teste]."), "Atendido parcialmente");
  assert.equal(statusDoEntregavel(e, "Teste [a confirmar: se o backup foi restaurado]."), "Atendido parcialmente");
  assert.equal(statusDoEntregavel(e, ""), "Pendente de evidência");
  e.atividades[0].status = "pendente";
  assert.equal(statusDoEntregavel(e, "Texto completo do entregável."), "Atendido parcialmente", "atividade aberta");
  e.atividades.forEach((a) => (a.status = "feito"));
  e.evidencias = [];
  assert.equal(statusDoEntregavel(e, "Texto completo do entregável."), "Pendente de evidência", "sem evidência anexada");
});

test("a conclusão traz a matriz e só diz 'cumprida nos termos da matriz' quando tudo está Atendido", () => {
  const projeto = projetoDeExemplo();
  const e = projeto.etapas[2];
  e.atividades.forEach((a) => (a.status = "feito"));
  e.evidencias = [{ id: "ev1", caminho: "x", nome: "x.png", legenda: "Print", tipo: "image/png" } as never];
  e.entregaveis.forEach((x) => x.tipo === "entregavel" && (x.conteudo = "Conteúdo apresentado."));
  const completa = textoPadraoSecao("conclusao", projeto, e, clienteDeExemplo);
  assert.ok(completa.includes("Matriz de entregas da Etapa 03"));
  assert.ok(completa.includes("| Entrega esperada | Resultado obtido | Status |"));
  assert.ok(completa.includes("A Etapa 03 é considerada cumprida nos termos da matriz acima."));
  assert.ok(!/Considera-se cumprida/i.test(completa));
  // um entregável pendente muda o fechamento e aparece como pendência
  const integridade = e.entregaveis.find((x) => x.titulo === "Integridade dos backups")!;
  integridade.conteudo = "";
  const parcial = textoPadraoSecao("conclusao", projeto, e, clienteDeExemplo);
  assert.ok(parcial.includes("A Etapa 03 é considerada cumprida em relação aos entregáveis com status Atendido; os demais constam da matriz com a respectiva pendência."));
  assert.ok(!parcial.includes("nos termos da matriz acima"));
  const linha = parcial.split("\n").find((l) => l.includes("Integridade dos backups"))!;
  assert.ok(linha.endsWith("| Pendente de evidência |"), linha);
  assert.ok(!/Resultado obtido[^|]*Integridade/.test(linha));
});

test("o escopo diz quando a data-limite das informações é anterior ao fechamento do relatório", () => {
  const projeto = projetoDeExemplo();
  const e = projeto.etapas[1];
  e.dataRelatorio = "2026-10-20";
  e.dataLimiteInformacoes = "2026-10-12";
  const texto = textoPadraoSecao("escopo", projeto, e, clienteDeExemplo);
  assert.ok(texto.includes("refletem a situação até 12 de outubro de 2026"), texto);
  assert.ok(texto.includes("fatos posteriores à data-limite não foram examinados"));
  e.dataLimiteInformacoes = "2026-10-20";
  assert.ok(!textoPadraoSecao("escopo", projeto, e, clienteDeExemplo).includes("refletem a situação até"));
});

test("os marcadores [completar] e [a confirmar] são contados e bloqueiam o envio", () => {
  const projeto = projetoDeExemplo();
  const e = projeto.etapas[0];
  e.secoes.objeto = "A [completar: x] e B [completar: y] e C [a confirmar: z]";
  e.entregaveis[0].conteudo = "[completar: w]";
  assert.equal(contarMarcadores(e), 3);
  assert.equal(contarAConfirmar(e), 1);
  const pendencias = verificarCompletude(projeto, e).map((p) => p.texto);
  assert.ok(pendencias.some((t) => t.startsWith("Trecho a confirmar em:")));
  assert.ok(pendencias.some((t) => t.startsWith("Trecho a completar em:")));
});

test("o texto-padrão do relatório define as siglas na primeira ocorrência", () => {
  const projeto = projetoDeExemplo();
  const natureza2 = textoPadraoSecao("natureza", projeto, projeto.etapas[1], clienteDeExemplo);
  assert.ok(natureza2.includes("Registro das Operações de Tratamento (RoPA)"));
  assert.ok(!/(^|[^(])\bRoPA\b/.test(natureza2.replace("(RoPA)", "")), "só usa a sigla depois de defini-la");
});

test("ficha 13070-5, Etapa 04: entregáveis do Relatório 4 aprovado e a atividade de cada um no checklist", async () => {
  const { modeloLgpdSebrae } = await import("../src/lib/modelos/lgpd-sebrae");
  const { problemasDoServico } = await import("../src/lib/servicos");
  const etapa4 = modeloLgpdSebrae.etapas.find((e) => e.ordem === 4)!;
  for (const titulo of ["Listagem de documentos relevantes do programa", "Fortalecimento da governança"]) assert.ok(etapa4.entregaveis.includes(titulo), titulo);
  assert.equal(etapa4.entregaveis.length, 6, "os 4 anteriores continuam");
  const codigos = etapa4.atividades.map(([c]) => c);
  assert.equal(new Set(codigos).size, codigos.length, "sem código repetido no checklist");
  assert.ok(etapa4.atividades.some(([, t]) => /listagem de documentos relevantes/i.test(t)));
  assert.ok(etapa4.atividades.some(([, t]) => /papéis, os responsáveis, as evidências e as rotinas/i.test(t)));
  assert.equal(modeloLgpdSebrae.versao, 2);
  assert.deepEqual(problemasDoServico({ ...(modeloLgpdSebrae as object), area: "", descricao: "", credenciado: true, areaAtuacao: "" } as never), []);
  // os textos-padrão dos dois novos entregáveis trazem a tabela a completar
  const { textoPadraoEntregavel } = await import("../src/lib/relatorio/padroes");
  const projeto = projetoDeExemplo();
  const e4 = projeto.etapas[3];
  assert.ok(textoPadraoEntregavel(e4, "Listagem de documentos relevantes do programa").includes("| Documento | Finalidade | Situação | Evidência |"));
  assert.ok(textoPadraoEntregavel(e4, "Fortalecimento da governança").includes("| Papel | Responsável | Evidência | Rotina |"));
});
