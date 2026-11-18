import test from "node:test";
import assert from "node:assert/strict";
import { aliquotaDoProjeto, entradasDeRecebimento, recebimento, type FinProjeto } from "../src/lib/financeiro";
import { projetoDeExemplo } from "./fixtures";
import type { Projeto } from "../src/lib/dados/tipos";

const fp = (valores: Record<string, number> = {}, previsoes: Record<string, string> = {}): FinProjeto => ({ projetoId: "prj-teste", empresa: "pivotto", valorHora: null, percFuncern: null, recebidos: {}, previsoes, valores, notas: {}, fonteContrapartida: null });

// Projeto em execução (pagamento feito), com plano de trabalho
function emExecucao(): Projeto {
  const p = projetoDeExemplo();
  p.hub = { passo: "execucao", datas: { execucao: "2026-10-01" } } as never;
  return p;
}

test("a Contrapartida é um desconto sobre o total a receber, tirado antes de repartir em 30% e 70%", () => {
  const p = emExecucao();
  const base = recebimento(p, undefined, fp(), "2026-10-05");
  const com = recebimento(p, undefined, fp({ contrapartida: 1000 }), "2026-10-05");
  assert.equal(base.parcelas.length, 2, "continuam duas parcelas");
  assert.equal(com.parcelas.length, 2, "a contrapartida não vira parcela");
  assert.equal(com.contrapartida, 1000);
  assert.equal(com.liquido, base.liquido - 1000);
  assert.ok(Math.abs(com.parcelas[0].valor - com.liquido * 0.3) < 0.005 && Math.abs(com.parcelas[1].valor - com.liquido * 0.7) < 0.005);
  assert.ok(Math.abs(com.parcelas[0].valor + com.parcelas[1].valor - com.liquido) < 0.005, "as parcelas somam o que fica");
  // nunca passa do que há para receber
  assert.equal(recebimento(p, undefined, fp({ contrapartida: 9_999_999 }), "2026-10-05").liquido, 0);
});

test("sem a data do primeiro relatório não há perspectiva de datas a receber", () => {
  // Sem plano de trabalho
  const semPlano = projetoDeExemplo({ comPlano: false });
  semPlano.hub = { passo: "execucao", datas: { execucao: "2026-10-01" } } as never;
  for (const x of recebimento(semPlano, undefined, fp(), "2026-10-05").parcelas) {
    assert.equal(x.previsao, null);
    assert.match(x.explicacao ?? "", /Sem a data do Relatório 1 definida/);
  }
  // Antes do pagamento (proposta): o plano ainda é só proposta
  const proposta = projetoDeExemplo();
  proposta.hub = { passo: "proposta_cliente", datas: {} } as never;
  assert.ok(recebimento(proposta, undefined, fp(), "2026-10-05").parcelas.every((x) => x.previsao === null));
  // Plano de trabalho sem a data do fim da etapa 1
  const semFim = emExecucao();
  semFim.etapas[0].dataFim = null;
  assert.ok(recebimento(semFim, undefined, fp(), "2026-10-05").parcelas.every((x) => x.previsao === null));
  // Em execução, com a data do Relatório 1: há projeção
  const com = recebimento(emExecucao(), undefined, fp(), "2026-10-05");
  assert.ok(com.parcelas.every((x) => !!x.previsao && x.origem === "plano"));
  // Data combinada à mão vale mesmo sem plano
  const manual = recebimento(semPlano, undefined, fp({}, { "30": "2026-11-05" }), "2026-10-05");
  assert.equal(manual.parcelas[0].previsao, "2026-11-05");
  assert.equal(manual.parcelas[0].origem, "manual");
  assert.equal(manual.parcelas[1].previsao, null, "os 70% seguem sem perspectiva");
});

test("com o Relatório 1 enviado, os 30% têm data real mesmo sem projeção, e os 70% são projetados", () => {
  const p = emExecucao();
  p.etapas[0].status = "enviada";
  p.etapas[0].enviadaEm = "2026-10-15";
  const r = recebimento(p, undefined, fp(), "2026-10-20");
  assert.equal(r.parcelas[0].previsao, "2026-11-05");
  assert.equal(r.parcelas[0].origem, "hub");
  assert.ok(r.parcelas[1].previsao && r.parcelas[1].previsao > "2026-11-05");
});

test("o percentual de imposto do projeto vale no lugar da faixa do faturamento (vazio: automático; zero: sem imposto)", () => {
  const p = emExecucao();
  p.etapas[0].status = "enviada";
  p.etapas[0].enviadaEm = "2026-10-15";
  const empresas = { pivotto: { empresa: "pivotto", faturamento12m: 100_000, aliquotaFixa: null, mudancas: [] } };
  const valorDa = (valores: Record<string, number>) => {
    const f = fp(valores);
    const [e1] = entradasDeRecebimento([p], {}, { [p.id]: f }, empresas, "2026-10-20");
    return { aliquota: e1.aliquota, imposto: e1.imposto, valor: e1.parcela.valor };
  };
  const auto = valorDa({});
  assert.equal(auto.aliquota, 6, "pela faixa do faturamento");
  const fixo = valorDa({ aliquota: 11.2 });
  assert.equal(fixo.aliquota, 11.2);
  assert.ok(Math.abs(fixo.imposto - (fixo.valor * 11.2) / 100) < 0.01);
  assert.equal(valorDa({ aliquota: 0 }).imposto, 0, "zero é um percentual válido");
  assert.equal(aliquotaDoProjeto(fp({ aliquota: 11.2 })), 11.2);
  assert.equal(aliquotaDoProjeto(fp({})), null);
  assert.equal(aliquotaDoProjeto(fp({ aliquota: -1 })), null);
});

test("projeto sem horas no plano de trabalho: o valor é estimado pelo teto do serviço; com horas, vale o plano", () => {
  const semHoras = emExecucao();
  for (const e of semHoras.etapas) e.horasPrevistas = 0;
  const pet = { servicoId: "pet", empresa: "pivotto", teto: 25000, valorHora: 90, percFuncern: 10 };
  const r = recebimento(semHoras, pet, undefined, "2026-10-05");
  assert.equal(r.horas, 277);
  assert.equal(r.horasEstimadas, true);
  assert.equal(r.bruto, 277 * 90);
  assert.equal(r.funcern, 277 * 90 * 0.1);
  assert.ok(Math.abs(r.parcelas[0].valor + r.parcelas[1].valor - r.liquido) < 0.005 && r.liquido > 22000 && r.liquido < 22500, "cerca de R$ 22,4 mil depois da FUNCERN");
  // LGPD: 30 mil / 90 = 333 horas
  assert.equal(recebimento(semHoras, { ...pet, teto: 30000 }, undefined, "2026-10-05").horas, 333);
  // sem a ficha financeira do serviço (sem teto), continua zero
  assert.equal(recebimento(semHoras, undefined, undefined, "2026-10-05").bruto, 0);
  // com horas no plano, o plano manda
  const comHoras = emExecucao();
  const plano = recebimento(comHoras, pet, undefined, "2026-10-05");
  assert.equal(plano.horasEstimadas, false);
  assert.equal(plano.horas, comHoras.etapas.reduce((a, e) => a + (e.horasPrevistas || 0), 0));
});
