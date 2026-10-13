// Datas no formato ISO (AAAA-MM-DD), sem fuso, para não deslocar o dia.

export function somarDias(iso: string, dias: number) {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

export function diferencaDias(deIso: string, ateIso: string) {
  const de = Date.parse(deIso + "T00:00:00Z");
  const ate = Date.parse(ateIso + "T00:00:00Z");
  return Math.round((ate - de) / 86_400_000);
}

export function hojeIso() {
  // Horário de Brasília
  return new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);
}

export function formatarData(iso?: string | null) {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function dataPorExtenso(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} de ${meses[m - 1]} de ${a}`;
}

// Sugestão do plano de trabalho: etapas em sequência, em dias corridos,
// cada uma começando no dia seguinte ao fim da anterior.
export function sugerirDatas(inicioIso: string, duracoes: number[]) {
  let inicio = inicioIso;
  return duracoes.map((dur) => {
    const fim = somarDias(inicio, Math.max(dur, 1) - 1);
    const par = { inicio, fim };
    inicio = somarDias(fim, 1);
    return par;
  });
}
