import test from "node:test";
import assert from "node:assert/strict";
import { ESTILO_RELATORIO, REGRAS_DE_ESTILO } from "../src/lib/ia/estilo";
import { SISTEMA } from "../src/lib/ia/conversa-prompt";

// A IA recebe SISTEMA (que inclui ESTILO_RELATORIO). Aqui se confere que cada regra pedida está no texto enviado.
const linhaDe = (texto: string, trecho: string) => texto.split("\n").filter((l) => l.includes(trecho));

test("RIPD: elementos exigidos, fundamento factual, 'Síntese do RIPD' e status só com o RIPD completo", () => {
  for (const t of ["tipos de dados e finalidade", "metodologia", "ameaças", "probabilidade e severidade", "nível de risco resultante", "medidas e salvaguardas existentes", "risco residual e responsável", "art. 38, parágrafo único, da LGPD"])
    assert.ok(SISTEMA.includes(t), t);
  assert.ok(SISTEMA.includes("Síntese do RIPD"));
  assert.ok(SISTEMA.includes("[completar: anexar o RIPD completo com metodologia, ameaças, probabilidade e severidade]"));
  assert.ok(SISTEMA.includes('só é "Atendido" se o RIPD completo estiver anexado'));
  // "conforme a conclusão do RIPD" só aparece proibido
  for (const l of linhaDe(SISTEMA, "conforme a conclusão do RIPD")) assert.ok(l.startsWith("- Nunca use"), l);
});

test("Parecer conclusivo: contagem, formulação cautelosa e termos proibidos sem evidência", () => {
  assert.ok(SISTEMA.includes("medidas com evidência anexada, medidas apenas relatadas pelo cliente e marcadores [completar] abertos"));
  assert.ok(SISTEMA.includes("a empresa passou a contar com um núcleo mínimo de conformidade, compatível com seu porte, que lhe permite responder com maior segurança às demandas de clientes e parceiros, sujeito à apresentação das evidências indicadas e à execução do plano pós-consultoria"));
  for (const proibido of ["aptas a demonstrar", "comprova", "plenamente", "totalmente", "em pleno funcionamento"]) assert.ok(SISTEMA.includes(`"${proibido}"`), proibido);
  for (const l of linhaDe(SISTEMA, "aptas a demonstrar")) assert.ok(l.startsWith("- Proibido"), l);
  assert.ok(SISTEMA.includes("quantas medidas estão só relatadas e quais evidências faltam"));
  assert.ok(SISTEMA.includes("não é auditoria nem certificação"));
});

test("Conclusão: matriz, status, frases de fechamento e proibição da frase antiga", () => {
  assert.ok(SISTEMA.includes('"Matriz de entregas da Etapa 0X"'));
  assert.ok(SISTEMA.includes('"| Entrega esperada | Resultado obtido | Status |"'));
  for (const s of ["Atendido", "Atendido parcialmente", "Pendente de evidência"]) assert.ok(SISTEMA.includes(`"${s}"`), s);
  assert.ok(SISTEMA.includes("A Etapa 0X é considerada cumprida nos termos da matriz acima"));
  assert.ok(SISTEMA.includes("A Etapa 0X é considerada cumprida em relação aos entregáveis com status Atendido; os demais constam da matriz com a respectiva pendência"));
  for (const l of linhaDe(SISTEMA, "Considera-se cumprida")) assert.ok(l.includes("Nunca escreva"), l);
  assert.ok(SISTEMA.includes("Não liste como produto entregue um item com status Pendente de evidência"));
});

test("Fidelidade: ausência não é informação, decisão que reduz proteção e pergunta de verificação", () => {
  assert.ok(SISTEMA.includes("Ausência de informação não é informação"));
  assert.ok(SISTEMA.includes("[a confirmar: se o fornecedor respondeu]"));
  for (const l of linhaDe(SISTEMA, '"não respondeu"')) assert.ok(l.includes("Nunca escreva"), l);
  assert.ok(SISTEMA.includes("a decisão pode ser compatível com <norma>, desde que a fundamentação esteja documentada; a consultoria não verificou os documentos que a sustentam"));
  assert.ok(SISTEMA.includes("critérios de risco usados; quem avaliou; data da avaliação; evidência do registro"));
  assert.ok(SISTEMA.includes("faça na \"resposta\" ao menos uma pergunta de verificação"));
  assert.ok(SISTEMA.includes("quem avaliou o risco, onde a avaliação está registrada e se os titulares podem sofrer dano relevante"));
  assert.ok(SISTEMA.includes('nunca escreva "é compatível" nem "é adequada"'));
});

test("Estilo: construções de rebate proibidas, sem exemplos que as imitem, e siglas definidas", () => {
  const proibidas = ["Não procede caracterizar", "Não se trata de", "Longe de ser", "Ao contrário do que se pode pensar"];
  for (const p of proibidas) {
    const linhas = linhaDe(ESTILO_RELATORIO, p);
    assert.equal(linhas.length, 1, `${p}: deve aparecer só na regra de proibição`);
    assert.ok(linhas[0].startsWith("- Proibido rebater"), linhas[0]);
  }
  assert.ok(REGRAS_DE_ESTILO.includes("A empresa dispõe de sistemas definidos por atividade, fornecedores identificados e suporte técnico contratado; a lacuna principal é a formalização, a evidência e a revisão periódica."));
  for (const sigla of ["RoPA", "RIPD", "AIRP", "DPMS", "PD&P", "ANPD", "LGPD"]) assert.ok(REGRAS_DE_ESTILO.includes(`(${sigla})`), sigla);
  // nenhum outro trecho do prompt do chat imita a construção
  assert.ok(!/não procede caracterizar/i.test(SISTEMA.replace(linhaDe(SISTEMA, "Proibido rebater")[0] ?? "", "")));
});

test("Última seção, datas, prazos e evidências", () => {
  assert.ok(SISTEMA.includes('"Continuidade do programa após a consultoria"'));
  assert.ok(SISTEMA.includes('Nunca cite "Etapa 06"'));
  assert.ok(SISTEMA.includes("data-limite das informações"));
  assert.ok(SISTEMA.includes("anterior à data de fechamento, diga isso em uma frase em \"Escopo, metodologia e limitações\""));
  assert.ok(SISTEMA.includes("Nunca deixe \"A confirmar\" se um relatório posterior já traz o prazo"));
  assert.ok(SISTEMA.includes("| Evidência | Status (anexada ou a anexar) | Onde está |"));
});

test("Tamanho da resposta: no máximo três seções por vez e pedido de 'continue'", () => {
  assert.ok(SISTEMA.includes("no máximo três seções ou entregáveis completos por resposta"));
  assert.ok(SISTEMA.includes('mande "continue"'));
});
