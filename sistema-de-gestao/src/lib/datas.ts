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

// Plano a partir do início e do fim do projeto: os dias corridos são divididos
// entre as etapas na proporção das horas de cada uma (pelo menos 1 dia cada),
// em sequência, sem sobreposição.
export function distribuirPorHoras(inicioIso: string, fimIso: string, horas: number[]) {
  const total = diferencaDias(inicioIso, fimIso) + 1;
  const n = horas.length;
  if (total < n) return null;
  const somaHoras = horas.reduce((a, h) => a + h, 0) || n;
  const exatos = horas.map((h) => (h / somaHoras) * total);
  const dias = exatos.map((x) => Math.max(1, Math.floor(x)));
  // Sobras de dias vão para as etapas com a maior fração (método do maior resto)
  let falta = total - dias.reduce((a, d) => a + d, 0);
  const ordem = exatos.map((x, i) => ({ i, resto: x - Math.floor(x) })).sort((a, b) => b.resto - a.resto);
  for (let k = 0; falta > 0; k = (k + 1) % n, falta--) dias[ordem[k].i]++;
  for (let k = n - 1; falta < 0; k = (k - 1 + n) % n) {
    if (dias[ordem[k].i] > 1) {
      dias[ordem[k].i]--;
      falta++;
    }
  }
  let inicio = inicioIso;
  return dias.map((d) => {
    const fim = somarDias(inicio, d - 1);
    const par = { inicio, fim };
    inicio = somarDias(fim, 1);
    return par;
  });
}

const mesesCurtos = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// "5 out"
export function dataCurta(iso?: string | null) {
  if (!iso) return "—";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${mesesCurtos[m - 1]}`;
}

// "5–8 out" ou "29 out – 2 nov"
export function periodoCurto(inicio?: string | null, fim?: string | null) {
  if (!inicio || !fim) return "Sem datas";
  const [, mi, di] = inicio.split("-").map(Number);
  const [, mf, df] = fim.split("-").map(Number);
  return mi === mf ? `${di}–${df} ${mesesCurtos[mf - 1]}` : `${di} ${mesesCurtos[mi - 1]} – ${df} ${mesesCurtos[mf - 1]}`;
}
