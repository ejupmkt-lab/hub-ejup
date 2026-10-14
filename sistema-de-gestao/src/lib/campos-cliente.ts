import type { Cliente } from "./dados/tipos";

type CampoCliente = { chave: keyof Cliente; rotulo: string; obrigatorio?: boolean; largo?: boolean; tipo?: string };

// Campos do Modelo de Diagnóstico do HUB SEBRAE, agrupados como no formulário
export const gruposCliente: { titulo: string; campos: CampoCliente[] }[] = [
  {
    titulo: "Empresa",
    campos: [
      { chave: "razaoSocial", rotulo: "Razão social", obrigatorio: true, largo: true },
      { chave: "nomeFantasia", rotulo: "Nome fantasia" },
      { chave: "cnpj", rotulo: "CNPJ", obrigatorio: true },
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
