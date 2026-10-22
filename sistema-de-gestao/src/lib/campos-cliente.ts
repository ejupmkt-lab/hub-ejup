import type { Cliente } from "./dados/tipos";

type CampoCliente = { chave: keyof Cliente; rotulo: string; obrigatorio?: boolean; largo?: boolean; tipo?: string };

// Campos do Modelo de Diagnóstico do HUB SEBRAE, agrupados como no formulário
export const gruposCliente: { titulo: string; campos: CampoCliente[] }[] = [
  {
    titulo: "Empresa",
    campos: [
      { chave: "cnpj", rotulo: "CNPJ", obrigatorio: true },
      { chave: "nomeFantasia", rotulo: "Nome fantasia" },
      { chave: "razaoSocial", rotulo: "Razão social", obrigatorio: true, largo: true },
      { chave: "ramo", rotulo: "Ramo" },
      { chave: "porte", rotulo: "Porte" },
      { chave: "tempoAtividade", rotulo: "Tempo de atividade" },
      { chave: "produtosServicos", rotulo: "Produtos e serviços", largo: true },
    ],
  },
  {
    titulo: "Responsável e contato",
    campos: [
      { chave: "responsavel", rotulo: "Responsável", obrigatorio: true },
      { chave: "cargoResponsavel", rotulo: "Cargo" },
      { chave: "email", rotulo: "E-mail", tipo: "email" },
      { chave: "telefone", rotulo: "Telefone ou WhatsApp", tipo: "tel" },
      { chave: "site", rotulo: "Site" },
    ],
  },
  {
    titulo: "Endereço e equipe",
    campos: [
      { chave: "endereco", rotulo: "Endereço", largo: true },
      { chave: "cidadeUf", rotulo: "Cidade e estado" },
      { chave: "cep", rotulo: "CEP" },
      { chave: "empregadosGestao", rotulo: "Empregados na gestão", tipo: "number" },
      { chave: "empregadosOperacionais", rotulo: "Empregados na operação", tipo: "number" },
    ],
  },
];

export const camposCliente = gruposCliente.flatMap((g) => g.campos);

// Nome do cliente para a tela. Nome todo em maiúsculas (como vem da Receita)
// aparece com só as iniciais maiúsculas; siglas com números (NOV4) e "LTDA" ficam
const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o", "para", "com"]);
const SIGLAS = new Set(["ltda", "me", "epp", "eireli", "s/a", "sa"]);
export function nomeDoCliente(c: Partial<Pick<Cliente, "nomeFantasia" | "razaoSocial">> | null | undefined, padrao = "Cliente") {
  const nome = (c?.nomeFantasia || c?.razaoSocial || "").trim();
  if (!nome) return padrao;
  if (nome !== nome.toUpperCase() || !/\p{Lu}{3}/u.test(nome)) return nome;
  return nome
    .toLowerCase()
    .split(/(\s+)/)
    .map((p, i) => {
      if (/\d/.test(p) || SIGLAS.has(p)) return p.toUpperCase();
      if (i > 0 && MINUSCULAS.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join("");
}
