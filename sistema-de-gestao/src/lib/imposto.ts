// Imposto sobre o que a consultoria recebe (Simples Nacional, Anexo III: serviços). A alíquota depende do faturamento dos últimos
// 12 meses (RBT12): passa de 6% para 11,2%, 13,5% e assim por diante. Sem imports: dá para testar sozinho.
// Confirme a faixa e o anexo da empresa com o contador (o fator R pode mudar o anexo).

export type FaixaSimples = { ate: number; nominal: number; deduzir: number };
export const FAIXAS_SIMPLES_ANEXO_III: FaixaSimples[] = [
  { ate: 180_000, nominal: 6, deduzir: 0 },
  { ate: 360_000, nominal: 11.2, deduzir: 9_360 },
  { ate: 720_000, nominal: 13.5, deduzir: 17_640 },
  { ate: 1_800_000, nominal: 16, deduzir: 35_640 },
  { ate: 3_600_000, nominal: 21, deduzir: 125_640 },
  { ate: 4_800_000, nominal: 33, deduzir: 648_000 },
];

// Uma mudança já sabida: "a partir de dezembro de 2026 a alíquota é 11,2%"
export type MudancaDeAliquota = { desde: string; aliquota: number }; // desde: AAAA-MM
export type ConfigImposto = {
  faturamento12m: number; // faturamento dos últimos 12 meses, em reais
  aliquotaFixa: number | null; // % informada à mão; vazio = calcular pela faixa do Simples
  mudancas: MudancaDeAliquota[];
};
export const configImpostoPadrao: ConfigImposto = { faturamento12m: 0, aliquotaFixa: null, mudancas: [] };

const arredonda = (n: number) => Math.round(n * 100) / 100;

// Índice da faixa em que o faturamento cai (acima do limite, a última)
export function indiceDaFaixa(rbt12: number) {
  const i = FAIXAS_SIMPLES_ANEXO_III.findIndex((f) => rbt12 <= f.ate);
  return i < 0 ? FAIXAS_SIMPLES_ANEXO_III.length - 1 : i;
}

// Alíquota efetiva do Simples: (RBT12 × alíquota da faixa − parcela a deduzir) ÷ RBT12; na 1ª faixa, a própria alíquota
export function aliquotaEfetiva(rbt12: number) {
  if (!(rbt12 > 0)) return FAIXAS_SIMPLES_ANEXO_III[0].nominal;
  const f = FAIXAS_SIMPLES_ANEXO_III[indiceDaFaixa(rbt12)];
  return arredonda(((rbt12 * f.nominal) / 100 - f.deduzir) / rbt12 * 100);
}

// Quanto falta de faturamento para a próxima faixa
export function proximaFaixa(rbt12: number) {
  const i = indiceDaFaixa(rbt12);
  const f = FAIXAS_SIMPLES_ANEXO_III[i];
  const prox = FAIXAS_SIMPLES_ANEXO_III[i + 1] ?? null;
  return { faixa: i + 1, atual: f, proxima: prox, falta: prox ? Math.max(0, arredonda(f.ate - rbt12)) : 0 };
}

// A alíquota que vale para um recebimento naquele mês (AAAA-MM): a última mudança já iniciada; senão a fixa; senão a da faixa
export function aliquotaNoMes(c: ConfigImposto | undefined, mes: string) {
  const cfg = c ?? configImpostoPadrao;
  const vigente = [...(cfg.mudancas ?? [])]
    .filter((m) => /^\d{4}-\d{2}$/.test(m.desde) && m.desde <= mes && Number.isFinite(m.aliquota))
    .sort((a, b) => a.desde.localeCompare(b.desde))
    .at(-1);
  if (vigente) return vigente.aliquota;
  if (cfg.aliquotaFixa !== null && Number.isFinite(cfg.aliquotaFixa)) return cfg.aliquotaFixa;
  return aliquotaEfetiva(cfg.faturamento12m);
}

export const imposto = (valor: number, aliquota: number) => arredonda((valor * aliquota) / 100);
