// Dados públicos de um CNPJ, já no formato do cadastro de cliente
export type DadosCnpj = {
  razaoSocial: string;
  nomeFantasia: string;
  endereco: string;
  cep: string;
  cidadeUf: string;
  porte: string;
  ramo: string;
  dataAbertura: string; // AAAA-MM-DD
  email: string;
  telefone: string;
  socios: { nome: string; qualificacao: string }[];
};

export function formatarCnpj(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

// "desde junho de 2022 (4 anos)"
export function tempoDeAtividade(dataAbertura: string, hoje = new Date()) {
  if (!dataAbertura) return "";
  const [a, m] = dataAbertura.split("-").map(Number);
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  let anos = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m) anos -= 1;
  const duracao = anos < 1 ? "menos de 1 ano" : anos === 1 ? "1 ano" : `${anos} anos`;
  return `${duracao}, desde ${meses[m - 1]} de ${a}`;
}

// Campos que vêm da Receita Federal (os de contato só entram se estiverem em branco)
export function dadosParaFormulario(d: DadosCnpj): Record<string, string> {
  const admin = d.socios.find((s) => /administrador/i.test(s.qualificacao)) ?? d.socios[0];
  return {
    razaoSocial: d.razaoSocial,
    nomeFantasia: d.nomeFantasia,
    endereco: d.endereco,
    cep: d.cep,
    cidadeUf: d.cidadeUf,
    porte: d.porte,
    ramo: d.ramo,
    tempoAtividade: tempoDeAtividade(d.dataAbertura),
    email: d.email,
    telefone: d.telefone,
    responsavel: admin?.nome ?? "",
    cargoResponsavel: admin?.qualificacao ?? "",
  };
}
export const soSeVazio = new Set(["email", "telefone", "responsavel", "cargoResponsavel"]);

