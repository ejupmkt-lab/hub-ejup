"use client";

import { useState } from "react";
import { useFinanceiro } from "@/lib/dados/financeiro";
import { entradasDeRecebimento, moeda } from "@/lib/financeiro";
import { aliquotaEfetiva, aliquotaNoMes, configImpostoPadrao, FAIXAS_SIMPLES_ANEXO_III, indiceDaFaixa, proximaFaixa, type MudancaDeAliquota } from "@/lib/imposto";
import { hojeIso, mesPorExtenso } from "@/lib/datas";
import { useEstado } from "@/lib/dados/store";
import { Botao, Campo, Chip } from "@/components/ui";

const pct = (n: number) => `${String(Math.round(n * 100) / 100).replace(".", ",")}%`;

// Imposto da empresa: a alíquota do Simples cresce com o faturamento dos últimos 12 meses. A pessoa informa o
// faturamento (e, se quiser, uma alíquota fixa ou mudanças já sabidas); o sistema calcula a faixa, avisa quando a
// próxima está perto e desconta o imposto em cada recebimento.
export function ImpostoEmpresa({ empresa, nome }: { empresa: string; nome: string }) {
  const fin = useFinanceiro();
  const { estado } = useEstado();
  const atual = fin?.empresas[empresa] ?? { empresa, ...configImpostoPadrao };
  const [form, setForm] = useState<{ faturamento: string; fixa: string; mudancas: { desde: string; aliquota: string }[] } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  if (!fin || !fin.carregado) return null;

  const valores = form ?? {
    faturamento: String(atual.faturamento12m || ""),
    fixa: atual.aliquotaFixa === null ? "" : String(atual.aliquotaFixa),
    mudancas: atual.mudancas.map((m) => ({ desde: m.desde, aliquota: String(m.aliquota) })),
  };
  const faturamento = Number(valores.faturamento) || 0;
  const mudancas: MudancaDeAliquota[] = valores.mudancas
    .filter((m) => /^\d{4}-\d{2}$/.test(m.desde) && m.aliquota !== "" && Number.isFinite(Number(m.aliquota)))
    .map((m) => ({ desde: m.desde, aliquota: Number(m.aliquota) }));
  const config = { faturamento12m: faturamento, aliquotaFixa: valores.fixa === "" ? null : Number(valores.fixa), mudancas };
  const faixa = proximaFaixa(faturamento);
  const efetiva = aliquotaEfetiva(faturamento);
  const hoje = hojeIso();
  const mesAtual = hoje.slice(0, 7);
  const aplicada = aliquotaNoMes(config, mesAtual);

  // Quanto está previsto entrar (depois da FUNCERN) dos pagamentos ainda não recebidos
  const previsto = entradasDeRecebimento(
    estado.projetos.filter((p) => p.empresa === empresa),
    fin.servicos,
    fin.projetos,
    fin.empresas,
  )
    .filter((e) => !e.parcela.recebidaEm && e.mes)
    .reduce((a, e) => a + e.parcela.valor, 0);
  const passaDaFaixa = faixa.proxima && faturamento > 0 && previsto >= faixa.falta;
  const perto = faixa.proxima && faturamento > 0 && faixa.falta <= faixa.atual.ate * 0.15;

  const mudar = (parcial: Partial<NonNullable<typeof form>>) => setForm({ ...valores, ...parcial });
  const salvar = async () => {
    setAviso(null);
    try {
      await fin.salvarEmpresa({ empresa, ...config });
      setForm(null);
      setAviso("Imposto salvo.");
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };

  return (
    <section aria-label="Imposto" className="space-y-3">
      <div>
        <h2 className="text-[17px] font-bold">Imposto · {nome}</h2>
        <p className="mt-0.5 text-sm text-tinta-2">
          No Simples Nacional (serviços, Anexo III) a alíquota cresce conforme o faturamento dos últimos 12 meses. Confirme a faixa e o anexo com o contador.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Faturamento dos últimos 12 meses (R$)">
          <input type="number" min={0} step={0.01} className="campo num" value={valores.faturamento} onChange={(e) => mudar({ faturamento: e.target.value })} />
        </Campo>
        <Campo rotulo="Alíquota fixa (%), se quiser usar a sua">
          <input type="number" min={0} max={100} step={0.01} className="campo num" placeholder="vazio: calcula pela faixa" value={valores.fixa} onChange={(e) => mudar({ fixa: e.target.value })} />
        </Campo>
      </div>

      <dl className="num grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-campo)] bg-pedra/70 p-3">
          <dt className="text-[12px] text-tinta-2">Faixa do Simples</dt>
          <dd className="font-semibold">
            {faixa.faixa}ª · até {moeda(faixa.atual.ate)}
          </dd>
          <dd className="text-[12px] text-tinta-2">alíquota da faixa {pct(faixa.atual.nominal)}</dd>
        </div>
        <div className="rounded-[var(--radius-campo)] bg-pedra/70 p-3">
          <dt className="text-[12px] text-tinta-2">Alíquota efetiva</dt>
          <dd className="font-semibold">{pct(efetiva)}</dd>
          <dd className="text-[12px] text-tinta-2">pela fórmula do Simples</dd>
        </div>
        <div className="rounded-[var(--radius-campo)] bg-azul-claro/60 p-3">
          <dt className="text-[12px] text-tinta-2">Aplicada nos recebimentos de {mesPorExtenso(mesAtual)}</dt>
          <dd className="font-semibold">{pct(aplicada)}</dd>
        </div>
      </dl>

      {faixa.proxima && faturamento > 0 && (
        <p className={`rounded-[var(--radius-campo)] p-3 text-[13px] ${perto || passaDaFaixa ? "border border-laranja/30 bg-laranja-claro/70 text-tinta" : "bg-pedra/70 text-tinta-2"}`}>
          Faltam <strong className="num">{moeda(faixa.falta)}</strong> para a {faixa.faixa + 1}ª faixa (alíquota {pct(faixa.proxima.nominal)}).
          {passaDaFaixa && (
            <>
              {" "}
              O que está previsto receber ({moeda(previsto)}) já passa disso: se o faturamento contar esses valores, a alíquota sobe. Se souber o mês, registre abaixo.
            </>
          )}
        </p>
      )}
      {indiceDaFaixa(faturamento) === FAIXAS_SIMPLES_ANEXO_III.length - 1 && faturamento > FAIXAS_SIMPLES_ANEXO_III.at(-1)!.ate && (
        <p className="rounded-[var(--radius-campo)] border border-vermelho/30 bg-vermelho-claro/70 p-3 text-[13px] text-tinta">Acima do limite do Simples. Fale com o contador.</p>
      )}

      <div>
        <p className="text-[13px] font-semibold text-tinta">Mudanças de alíquota já sabidas</p>
        <p className="text-[13px] text-tinta-2">Ex.: a partir de 2026-12 a alíquota é 11,2%. Vale para os recebimentos daquele mês em diante.</p>
        <ul className="mt-2 space-y-2">
          {valores.mudancas.map((m, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="month"
                aria-label={`Mês da mudança ${i + 1}`}
                className="campo num"
                style={{ width: "auto" }}
                value={m.desde}
                onChange={(e) => mudar({ mudancas: valores.mudancas.map((x, j) => (j === i ? { ...x, desde: e.target.value } : x)) })}
              />
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                aria-label={`Alíquota da mudança ${i + 1} (%)`}
                className="campo num"
                style={{ width: "6.5rem" }}
                value={m.aliquota}
                onChange={(e) => mudar({ mudancas: valores.mudancas.map((x, j) => (j === i ? { ...x, aliquota: e.target.value } : x)) })}
              />
              <span className="text-[13px] text-tinta-2">%</span>
              <Botao tamanho="pequeno" variante="secundario" onClick={() => mudar({ mudancas: valores.mudancas.filter((_, j) => j !== i) })}>
                Remover
              </Botao>
            </li>
          ))}
        </ul>
        <Botao tamanho="pequeno" variante="secundario" className="mt-2" onClick={() => mudar({ mudancas: [...valores.mudancas, { desde: mesAtual, aliquota: "" }] })}>
          Adicionar mudança
        </Botao>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {form && (
          <Botao tamanho="pequeno" onClick={() => void salvar()}>
            Salvar imposto
          </Botao>
        )}
        {aviso && <Chip tom="ok">{aviso}</Chip>}
      </div>
    </section>
  );
}
