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
// Dados pessoais do cadastro público (sócio administrador, e-mail e telefone, que muitas vezes são do contador): não entram
// no cadastro do cliente sozinhos. Por minimização (LGPD, art. 6º, III) e finalidade (art. 6º, I), a pessoa vê a sugestão,
// confere com o cliente e só então usa.
export const camposPessoais = ["responsavel", "cargoResponsavel", "email", "telefone"] as const;

// Só o que é da empresa: razão social, endereço, porte, ramo…
export function dadosDaEmpresa(d: DadosCnpj): Record<string, string> {
  const todos = dadosParaFormulario(d);
  return Object.fromEntries(Object.entries(todos).filter(([k]) => !(camposPessoais as readonly string[]).includes(k)));
}

export type SugestaoDeContato = { chave: "responsavel" | "email" | "telefone"; rotulo: string; valor: string; extra?: Record<string, string> };

// O que a Receita traz de pessoal, como sugestão a conferir
export function sugestoesDeContato(d: DadosCnpj): SugestaoDeContato[] {
  const todos = dadosParaFormulario(d);
  const lista: SugestaoDeContato[] = [];
  if (todos.responsavel)
    lista.push({ chave: "responsavel", rotulo: "Responsável", valor: todos.cargoResponsavel ? `${todos.responsavel} (${todos.cargoResponsavel})` : todos.responsavel, extra: { responsavel: todos.responsavel, cargoResponsavel: todos.cargoResponsavel } });
  if (todos.email) lista.push({ chave: "email", rotulo: "E-mail", valor: todos.email, extra: { email: todos.email } });
  if (todos.telefone) lista.push({ chave: "telefone", rotulo: "Telefone", valor: todos.telefone, extra: { telefone: todos.telefone } });
  return lista;
}

