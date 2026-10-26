"use client";

import { useState } from "react";
import type { Servico } from "@/lib/dados/tipos";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { useFinanceiro } from "@/lib/dados/financeiro";
import { horasNoTeto, moeda, PERC_FUNCERN_PADRAO, VALOR_HORA_PADRAO } from "@/lib/financeiro";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import { Botao, Cartao, Campo } from "@/components/ui";

// Reparte as horas pelas etapas, proporcionalmente aos pesos, somando exatamente o total
export function distribuirHoras(total: number, pesos: number[]): number[] {
  const soma = pesos.reduce((a, b) => a + b, 0) || 1;
  const brutas = pesos.map((p) => (total * p) / soma);
  const base = brutas.map(Math.floor);
  let falta = total - base.reduce((a, b) => a + b, 0);
  const ordem = brutas.map((b, i) => [b - Math.floor(b), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of ordem) {
    if (falta <= 0) break;
    base[i] += 1;
    falta -= 1;
  }
  return base;
}

// Valores do serviço (só para quem vê o financeiro): teto, valor da hora e a
// parte da FUNCERN. As horas da proposta são as que cabem no teto.
export function ValoresServico({ servico: s }: { servico: Servico }) {
  const fin = useFinanceiro();
  const { atualizar } = useEstado();
  const { gerencia } = useAcesso();
  const atual = fin?.servicos[s.id];
  const [form, setForm] = useState<{ teto: string; valorHora: string; percFuncern: string } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  if (!fin || !fin.carregado) return null;

  const teto = Number(form?.teto ?? atual?.teto ?? 0);
  const valorHora = Number(form?.valorHora ?? atual?.valorHora ?? VALOR_HORA_PADRAO);
  const percFuncern = Number(form?.percFuncern ?? atual?.percFuncern ?? PERC_FUNCERN_PADRAO);
  const horas = horasNoTeto(teto, valorHora);
  const bruto = horas * valorHora;
  const liquido = bruto * (1 - percFuncern / 100);
  const horasAtuais = s.etapas.reduce((a, e) => a + (e.horasPrevistas || 0), 0);
  // Pesos: as horas que as etapas já têm; sem elas, o tamanho do que a ficha pede em cada etapa
  const pesos = s.etapas.map((e) => (horasAtuais ? e.horasPrevistas || 0 : Math.max(1, e.atividades.length + e.entregaveis.length)));
  const distribuicao = horas ? distribuirHoras(horas, pesos) : [];
  const mudou = !!form;

  const salvar = async () => {
    setAviso(null);
    try {
      await fin.salvarServico({ servicoId: s.id, empresa: s.empresa, teto, valorHora, percFuncern });
      setForm(null);
      setAviso("Valores salvos.");
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };
  const distribuir = () =>
    atualizar((r) => {
      const sv = r.servicos.find((x) => x.id === s.id);
      sv?.etapas.forEach((e, i) => (e.horasPrevistas = distribuicao[i]));
    });
  const campo = (k: "teto" | "valorHora" | "percFuncern", v: number) => (
    <input
      type="number"
      min={0}
      step={k === "percFuncern" ? 0.5 : 0.01}
      className="campo num"
      value={form?.[k] ?? String(v)}
      onChange={(e) => setForm({ teto: String(teto), valorHora: String(valorHora), percFuncern: String(percFuncern), [k]: e.target.value })}
    />
  );

  return (
    <Cartao className="p-4 sm:p-5">
      <h2 className="text-[17px] font-bold">Valores</h2>
      <p className="mt-0.5 text-[13px] text-tinta-2">Só quem tem acesso ao financeiro vê esta parte.</p>
      <div className="mt-3 space-y-3">
        <Campo rotulo="Teto de contratação (R$)">{campo("teto", teto)}</Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Valor da hora (R$)">{campo("valorHora", valorHora)}</Campo>
          <Campo rotulo="FUNCERN (%)">{campo("percFuncern", percFuncern)}</Campo>
        </div>
      </div>
      {teto > 0 && (
        <dl className="num mt-4 space-y-1.5 border-t border-linha pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-2">Horas no teto</dt>
            <dd className="font-semibold">{horas} h</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-2">Valor do projeto</dt>
            <dd className="font-semibold">{moeda(bruto)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-2">Você recebe ({100 - percFuncern}%)</dt>
            <dd className="font-semibold text-verde">{moeda(liquido)}</dd>
          </div>
        </dl>
      )}
      {mudou && (
        <Botao tamanho="pequeno" className="mt-3 w-full" onClick={() => void salvar()}>
          Salvar valores
        </Botao>
      )}
      {aviso && <p className="mt-2 text-[13px] text-tinta-2">{aviso}</p>}
      {!mudou && horas > 0 && horas !== horasAtuais && gerencia(s.empresa as EmpresaSlug) && (
        <div className="mt-4 rounded-[var(--radius-campo)] bg-azul-claro/60 p-3 text-[13px]">
          <p className="text-tinta">
            As etapas somam {horasAtuais} h. Distribuir as {horas} h do teto pela complexidade de cada etapa:
          </p>
          <p className="num mt-1 text-tinta-2">{distribuicao.map((h, i) => `${i + 1}: ${h} h`).join(" · ")}</p>
          <Botao tamanho="pequeno" variante="secundario" className="mt-2" onClick={distribuir}>
            Distribuir {horas} h nas etapas
          </Botao>
        </div>
      )}
    </Cartao>
  );
}
