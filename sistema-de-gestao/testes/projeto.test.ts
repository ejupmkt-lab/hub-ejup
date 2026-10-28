import test from "node:test";
import assert from "node:assert/strict";
import { passoDoProjeto } from "../src/lib/proximo-passo";
import { sugestoesConversa } from "../src/lib/conversa";
import { dadosDaEmpresa, sugestoesDeContato, type DadosCnpj } from "../src/lib/cnpj";
import { confirmouExclusao } from "../src/lib/exclusao";
import { projetoDeExemplo } from "./fixtures";
import type { Projeto } from "../src/lib/dados/tipos";

// Projeto em execução, com a etapa 1 toda escrita, o checklist cumprido e evidência anexada, mas com marcador aberto
function projetoEmExecucao(): Projeto {
  const p = projetoDeExemplo();
  p.hub = { passo: "execucao", datas: { execucao: "2026-10-01" } } as never;
  const e = p.etapas[0];
  e.status = "em_redacao";
  e.atividades.forEach((a) => (a.status = "feito"));
  for (const k of ["objeto", "natureza", "escopo", "atividades_realizadas", "caracterizacao", "medidas", "encaminhamentos", "conclusao", "evidencias"]) e.secoes[k] = `Texto de ${k}.`;
  e.entregaveis.forEach((x) => (x.conteudo = x.tipo === "entregavel" ? "Texto do entregável." : ""));
  e.evidencias = [{ id: "ev1", caminho: "x", nome: "x.png", legenda: "Print", tipo: "image/png" } as never];
  p.referencias = [{ id: "r1", texto: "Lei", url: "", consultadoEm: "" }];
  return p;
}

test("o próximo passo não manda 'escrever o relatório' quando tudo já está escrito", () => {
  const p = projetoEmExecucao();
  p.etapas[0].secoes.objeto = "Texto do objeto com [completar: nome do sistema].";
  const passo = passoDoProjeto(p)!;
  assert.ok(!/escreva o relatório/i.test(passo.texto), passo.texto);
  assert.match(passo.texto, /marcadores em aberto/i);
  // sem evidência: pede as evidências
  p.etapas[0].secoes.objeto = "Texto do objeto.";
  p.etapas[0].evidencias = [];
  assert.match(passoDoProjeto(p)!.texto, /evidências/i);
  // seção em branco: aí sim, escrever
  p.etapas[0].secoes.conclusao = "";
  assert.match(passoDoProjeto(p)!.texto, /escreva o relatório/i);
});

test("as sugestões do chat acompanham o estado real do relatório", () => {
  const p = projetoEmExecucao();
  p.etapas[0].secoes.objeto = "Texto com [completar: x].";
  const marcadores = sugestoesConversa(p).join(" | ");
  assert.ok(!/Escreva o relatório e os entregáveis/.test(marcadores), marcadores);
  assert.match(marcadores, /marcadores/i);
  p.etapas[0].secoes.objeto = "Texto.";
  p.etapas[0].evidencias = [];
  assert.match(sugestoesConversa(p).join(" | "), /evidências/i);
  p.etapas[0].secoes.conclusao = "";
  assert.match(sugestoesConversa(p).join(" | "), /Escreva o relatório e os entregáveis/);
});

const receita: DadosCnpj = {
  razaoSocial: "EMPRESA EXEMPLO LTDA",
  nomeFantasia: "Exemplo",
  endereco: "Rua A, 1",
  cep: "59.000-000",
  cidadeUf: "Natal/RN",
  porte: "Micro",
  ramo: "Transporte",
  dataAbertura: "2020-03-10",
  email: "contador@exemplo.test",
  telefone: "(84) 3000-0000",
  socios: [{ nome: "Fulano de Tal", qualificacao: "Sócio-Administrador" }],
};

test("CNPJ: só dados da empresa preenchem o cadastro; responsável, e-mail e telefone da Receita viram sugestão a conferir", () => {
  const empresa = dadosDaEmpresa(receita);
  assert.equal(empresa.razaoSocial, "EMPRESA EXEMPLO LTDA");
  for (const k of ["responsavel", "cargoResponsavel", "email", "telefone"]) assert.ok(!(k in empresa), `${k} não deve ser preenchido sozinho`);
  const sugestoes = sugestoesDeContato(receita);
  assert.deepEqual(sugestoes.map((s) => s.chave), ["responsavel", "email", "telefone"]);
  assert.ok(sugestoes[0].valor.includes("Fulano de Tal"));
});

test("a exclusão só é liberada com a palavra EXCLUIR digitada por inteiro", () => {
  assert.equal(confirmouExclusao("EXCLUIR"), true);
  assert.equal(confirmouExclusao("  excluir "), true);
  for (const v of ["", "EXCLU", "EXCLUIR TUDO", "apagar", "EXCLUIRR"]) assert.equal(confirmouExclusao(v), false, v);
});
