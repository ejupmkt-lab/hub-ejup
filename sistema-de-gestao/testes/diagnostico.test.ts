import test from "node:test";
import assert from "node:assert/strict";
import PizZip from "pizzip";
import { aplicarAcoes, desfazerAcoes, type Anexo } from "../src/lib/conversa";
import { faltasDoDiagnostico, lerDiagnostico, totalDeEmpregados } from "../src/lib/diagnostico";
import { gerarDocxDiagnostico } from "../src/lib/relatorio/diagnostico-docx";
import { REGRAS_DO_DIAGNOSTICO, SISTEMA } from "../src/lib/ia/conversa-prompt";
import { passoDoProjeto } from "../src/lib/proximo-passo";
import { clienteDeExemplo, consultorDeExemplo, projetoDeExemplo, textoDoXml } from "./fixtures";
import { readFileSync } from "node:fs";

const ANAMNESE = "A Transportadora Exemplo atende clientes em Natal. Segundo a titular, os dados ficam em planilhas do Excel.\n\nOs registros ficam no Drive [completar: quem acessa].";
const ANALISE = "O levantamento considerou o relato da titular e o registro da solicitação 99999 no HUB.\n\n1. Cadastro e relacionamento. Dados circulam entre planilha e sistema comercial.\n\n2. Hipóteses legais e transparência. Não foram informados instrumentos de transparência.";
const PARECER = "A necessidade relatada é compatível com a solução Sebraetec de Adequação à LGPD.\n\nO parecer é FAVORÁVEL à contratação da consultoria.";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const modelo = () => {
  const b = readFileSync(new URL("../public/modelos/diagnostico-base.docx", import.meta.url));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};

async function docx(p = projetoDeExemplo(), imagens = 0) {
  const arq = Array.from({ length: imagens }, (_, i) => ({ dados: PNG.buffer.slice(PNG.byteOffset, PNG.byteOffset + PNG.byteLength) as ArrayBuffer, tipo: "image/png", legenda: `Registro visual ${i + 1} da reunião remota com a responsável.`, largura: 600, altura: 1000 }));
  const blob = await gerarDocxDiagnostico({ projeto: p, cliente: clienteDeExemplo, consultor: consultorDeExemplo }, "2026-10-29", arq, modelo());
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const zip = new PizZip(bytes);
  const xml = zip.file("word/document.xml")!.asText();
  return { bytes, zip, xml, texto: textoDoXml(xml) };
}

test("a IA escreve o diagnóstico uma vez (as três partes do modelo) e dá para desfazer sem perder o arquivo anexado", () => {
  const p = projetoDeExemplo();
  const { itens, desfazer } = aplicarAcoes(p, [{ tipo: "escrever_diagnostico", anamnese: ANAMNESE, analise: ANALISE, parecer: PARECER }], [], "m1", "Consultor");
  const d = lerDiagnostico(p);
  assert.equal(d.anamnese, ANAMNESE.trim());
  assert.equal(d.analise, ANALISE.trim());
  assert.equal(d.parecer, PARECER.trim());
  assert.ok(itens[0].descricao.includes("três seções do modelo do SEBRAE") && itens[0].descricao.includes("Entregas"));
  p.diagnostico!.arquivo = { caminho: "pivotto/prj/diagnostico/x.docx", nome: "x.docx", tipo: "application/msword", tamanho: 10, enviadoEm: "2026-10-29T10:00:00Z", por: "Consultor" };
  const r2 = aplicarAcoes(p, [{ tipo: "escrever_diagnostico", anamnese: "Outra.", analise: ANALISE, parecer: PARECER }], [], "m2", "Consultor");
  assert.equal(lerDiagnostico(p).anamnese, "Outra.");
  desfazerAcoes(p, r2.desfazer);
  assert.equal(lerDiagnostico(p).anamnese, ANAMNESE.trim());
  desfazerAcoes(p, desfazer);
  assert.equal(lerDiagnostico(p).anamnese, "");
  assert.equal(p.diagnostico!.arquivo?.nome, "x.docx", "o arquivo anexado fica");
  // tudo vazio não vale
  const q = projetoDeExemplo();
  assert.equal(aplicarAcoes(q, [{ tipo: "escrever_diagnostico", anamnese: " ", analise: "", parecer: "" }], [], "m3", "x").itens.length, 0);
});

test("a IA registra telefone, e-mail e data do quadro de assinatura (campo vazio não muda) e dá para desfazer", () => {
  const p = projetoDeExemplo();
  const r = aplicarAcoes(p, [{ tipo: "dados_do_diagnostico", telefone: "(84) 99932-1514", email: "", data: "2026-10-30" }], [], "m1", "C");
  const d = lerDiagnostico(p);
  assert.equal(d.telefone, "(84) 99932-1514");
  assert.equal(d.dataDoDocumento, "2026-10-30");
  assert.ok(!d.email);
  assert.ok(r.itens[0].descricao.includes("telefone do prestador") && r.itens[0].descricao.includes("30/10/2026"));
  // sem novidade ou data inválida: nada muda
  assert.equal(aplicarAcoes(p, [{ tipo: "dados_do_diagnostico", telefone: "(84) 99932-1514", email: "", data: "amanhã" }], [], "m2", "C").itens.length, 0);
  desfazerAcoes(p, r.desfazer);
  assert.ok(!lerDiagnostico(p).telefone);
});

test("a imagem da reunião vira evidência do diagnóstico na hora (e não de uma etapa), com desfazer", () => {
  const p = projetoDeExemplo();
  const anexos: Anexo[] = [{ id: "a1", caminho: "pivotto/prj/conversa/reuniao.png", nome: "reuniao.png", tipo: "image/png", largura: 900, altura: 1600 }, { id: "a2", caminho: "x.pdf", nome: "x.pdf", tipo: "application/pdf" }];
  const { itens, desfazer } = aplicarAcoes(p, [{ tipo: "guardar_evidencia_diagnostico", anexo: "a1", legenda: "Registro visual de reunião remota com a responsável pela empresa" }, { tipo: "guardar_evidencia_diagnostico", anexo: "a2", legenda: "PDF não é imagem" }], anexos, "m1", "C");
  const d = lerDiagnostico(p);
  assert.equal(d.evidencias.length, 1);
  assert.equal(d.evidencias[0].caminho, "pivotto/prj/conversa/reuniao.png");
  assert.equal(d.evidencias[0].legenda, "Registro visual de reunião remota com a responsável pela empresa");
  assert.ok(itens.length === 1 && itens[0].descricao.includes("evidência 01"));
  assert.ok(p.etapas.every((e) => (e.evidencias ?? []).length === 0), "nenhuma etapa recebeu a imagem");
  // a mesma imagem não entra duas vezes
  aplicarAcoes(p, [{ tipo: "guardar_evidencia_diagnostico", anexo: "a1", legenda: "de novo" }], anexos, "m2", "C");
  assert.equal(lerDiagnostico(p).evidencias.length, 1);
  desfazerAcoes(p, desfazer);
  assert.equal(p.diagnostico, undefined);
});

test("o Word do diagnóstico é o modelo do SEBRAE preenchido: capa, dados da empresa, quatro quadros e quadro de assinatura", async () => {
  const p = projetoDeExemplo();
  p.prestadoraVinculada = "FUNCERN";
  p.localAssinatura = "Natal/RN";
  p.diagnostico = { anamnese: ANAMNESE, analise: ANALISE, parecer: PARECER, evidencias: [], atualizadoEm: "2026-10-29", arquivo: null, telefone: "(84) 99932-1514", email: "consultor@exemplo.test" };
  const { bytes, texto: bruto, zip } = await docx(p, 2);
  const texto = bruto.replace(/[ \t]+/g, " ");
  assert.ok(bytes.length < 1_000_000, `${bytes.length} bytes`);
  assert.ok(texto.includes("DIAGNÓSTICO DE") && texto.includes("CONSULTORIA") && texto.includes("SERVIÇO BRASILEIRO DE APOIO ÀS MICRO E PEQUENAS EMPRESAS – SEBRAE"), "capa do modelo");
  assert.ok(texto.includes("1. Qualificação da Demanda") && texto.includes("DADOS DA EMPRESA DEMANDANTE"));
  // dados da empresa, nos campos do modelo
  for (const trecho of ["Empresa Cliente: Exemplo Transportes | Transportadora Exemplo Ltda", "CNPJ/Inscrição: 11.222.333/0001-81", "Endereço: Rua das Flores, 100, Sala 2", "CEP: 59.000-000", "Cidade/Estado: Natal/RN", "E-mail: contato@exemplo.test", "Telefone/WhatsApp: (84) 99999-0000", "Site: Não informado", "Cargo: Diretora", "Porte: Pequeno porte", "Ramo: Transporte rodoviário de cargas", "Código da Solicitação no HUB: 99999"])
    assert.ok(texto.replace(/\s+/g, " ").includes(trecho), trecho);
  assert.ok(/N\.º Empregados Total:\s*13/.test(texto), "total de empregados somado");
  // os quatro quadros, com os textos
  assert.ok(texto.includes("DIAGNÓSTICO PARA QUALIFICAÇÃO DA DEMANDA"));
  for (const t of ["Contextualização", "Investigação/Análise documental", "Parecer técnico – Diagnóstico", "Evidências"]) assert.ok(texto.includes(t), t);
  assert.ok(texto.includes("Segundo a titular, os dados ficam em planilhas do Excel."));
  assert.ok(texto.includes("1. Cadastro e relacionamento.") && texto.includes("2. Hipóteses legais e transparência."));
  assert.ok(texto.includes("O parecer é FAVORÁVEL"));
  // as orientações do modelo (texto cinza) saem
  assert.ok(!texto.includes("Escuta ativa da narrativa do cliente") && !texto.includes("É necessário evidências do atendimento"), "sem as orientações do modelo");
  // evidências: duas imagens com legenda numerada
  assert.ok(texto.includes("Evidência 01 – Registro visual 1 da reunião remota com a responsável.") && texto.includes("Evidência 02 – Registro visual 2"));
  assert.equal(Object.keys(zip.files).filter((n) => n.startsWith("word/media/evidencia")).length, 2);
  // quadro de assinatura
  assert.ok(texto.includes("Prestador de Serviços/Empresa Credenciada: FUNCERN"));
  assert.ok(texto.includes("Telefone: (84) 99932-1514") && texto.includes("E-mail: consultor@exemplo.test"));
  assert.ok(texto.includes("Local e Data: Natal/RN, 29 de outubro de 2026"));
  assert.ok(texto.includes("Consultor Responsável"));
  // um marcador a completar: realce e caixa de pendências
  assert.ok(texto.includes("PENDÊNCIAS ANTES DO ENVIO") && texto.includes("1 marcador a completar"));
  assert.ok(texto.indexOf("PENDÊNCIAS ANTES DO ENVIO") < texto.indexOf("1. Qualificação da Demanda"));
  assert.match(zip.file("word/document.xml")!.asText(), /<w:highlight w:val="yellow"\/>/);
  // não é o modelo dos relatórios
  assert.ok(!/RELATÓRIO TÉCNICO|Período da Etapa|Carga horária prevista/.test(texto));
  assert.ok(!/Não procede caracterizar|Etapa 06/.test(texto));
});

test("diagnóstico sem texto nem imagem: cada parte sai com marcador a completar", async () => {
  const { texto, xml } = await docx(projetoDeExemplo());
  assert.ok(texto.includes("[completar: contexto do cliente"));
  assert.ok(texto.includes("[completar: o que foi levantado e comprovado"));
  assert.ok(texto.includes("[completar: se a ficha técnica atende"));
  assert.ok(texto.includes("[completar: imagem da reunião de diagnóstico"));
  assert.ok(/\d+ marcadores a completar/.test(texto) && xml.includes("w:highlight"));
});

test("o diagnóstico antigo (um texto só) é lido como a contextualização", () => {
  const p = projetoDeExemplo();
  p.diagnostico = { texto: "Texto antigo.", atualizadoEm: "2026-10-28", arquivo: null } as never;
  const d = lerDiagnostico(p);
  assert.equal(d.anamnese, "Texto antigo.");
  assert.deepEqual(d.evidencias, []);
});

test("a lista do que falta aponta cadastro, textos e evidência", () => {
  const p = projetoDeExemplo();
  const c = { ...clienteDeExemplo, telefone: "", tempoAtividade: "" };
  const f = faltasDoDiagnostico(p, c);
  assert.ok(f.some((x) => x.startsWith("dados do cliente no cadastro") && x.includes("telefone") && x.includes("tempo de atividade")));
  assert.ok(f.includes("texto: Contextualização / Anamnese") && f.includes("texto: Parecer técnico – Diagnóstico"));
  assert.ok(f.some((x) => x.startsWith("evidência da reunião")));
  p.diagnostico = { anamnese: "a", analise: "b", parecer: "c", evidencias: [{ id: "e", caminho: "x", legenda: "l", largura: 1, altura: 1, tipo: "image/png" }], atualizadoEm: null, arquivo: null };
  // quadro de assinatura: a IA pede telefone e e-mail do prestador (o e-mail pode vir do consultor)
  assert.deepEqual(faltasDoDiagnostico(p, clienteDeExemplo), ["telefone do prestador (quadro de assinatura)", "e-mail do prestador (quadro de assinatura)"]);
  assert.deepEqual(faltasDoDiagnostico(p, clienteDeExemplo, "c@x.com"), ["telefone do prestador (quadro de assinatura)"]);
  p.diagnostico.telefone = "(84) 99932-1514";
  assert.deepEqual(faltasDoDiagnostico(p, clienteDeExemplo, "c@x.com"), []);
  assert.equal(totalDeEmpregados({ empregadosGestao: "3", empregadosOperacionais: "10" }), "13");
  assert.equal(totalDeEmpregados({ empregadosGestao: "", empregadosOperacionais: "10" }), "");
});

test("a IA segue o modelo do SEBRAE no diagnóstico, escreve só no fim, guarda a imagem da reunião e não diz que não pode enviar", () => {
  const r = REGRAS_DO_DIAGNOSTICO;
  assert.ok(r.includes("SEMPRE segue o modelo do SEBRAE, não o modelo dos relatórios"));
  for (const t of ["Contextualização / Anamnese", "Investigação / Análise documental", "Parecer técnico – Diagnóstico", "Evidências", "sintoma, problema e causa", "roteiro ou pré-diagnóstico da ficha técnica", "1. Título da necessidade. Texto…"]) assert.ok(r.includes(t), t);
  assert.ok(r.includes("Não escreva o diagnóstico a cada mensagem"));
  assert.ok(r.includes('Use "escrever_diagnostico" UMA vez'));
  assert.ok(r.includes('"dados_do_diagnostico"') && r.includes("telefone do prestador") && r.includes("quadro de assinatura do Word"));
  assert.ok(r.includes('"guardar_evidencia_diagnostico"') && r.includes("Não use \"guardar_anexo\" para isso"));
  assert.ok(r.includes('nunca diga que "não pode enviar" o diagnóstico') && r.includes('"Baixar diagnóstico em Word"'));
  assert.ok(SISTEMA.includes(r), "as regras do diagnóstico estão no prompt do chat");
  assert.ok(SISTEMA.includes("as regras abaixo valem só para os relatórios, nunca para o diagnóstico"));
  assert.ok(SISTEMA.includes("exceto as imagens da reunião de diagnóstico"));
});

test("o próximo passo da fase do diagnóstico leva à área Diagnóstico das Entregas", () => {
  const p = projetoDeExemplo();
  p.hub = { passo: "diagnostico", datas: { diagnostico: "2026-10-01" } } as never;
  const passo = passoDoProjeto(p)!;
  assert.ok(passo.href.endsWith("#diagnostico"), passo.href);
  assert.match(passo.texto, /Elabore o diagnóstico/);
  p.diagnostico = { anamnese: "Texto.", analise: "", parecer: "", evidencias: [], atualizadoEm: "2026-10-29", arquivo: null };
  assert.match(passoDoProjeto(p)!.texto, /Revise o diagnóstico, baixe o Word/);
});
