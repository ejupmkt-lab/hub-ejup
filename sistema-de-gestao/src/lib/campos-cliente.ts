import type { Cliente } from "./prototipo/tipos";

// Campos do Modelo de Diagnóstico — HUB SEBRAE (dados da empresa demandante)
export const camposCliente: { chave: keyof Cliente; rotulo: string; obrigatorio?: boolean; largo?: boolean }[] = [
  { chave: "razaoSocial", rotulo: "Empresa cliente (razão social)", obrigatorio: true, largo: true },
  { chave: "nomeFantasia", rotulo: "Nome fantasia" },
  { chave: "cnpj", rotulo: "CNPJ/Inscrição", obrigatorio: true },
  { chave: "endereco", rotulo: "Endereço", largo: true },
  { chave: "cep", rotulo: "CEP" },
  { chave: "cidadeUf", rotulo: "Cidade/Estado" },
  { chave: "email", rotulo: "E-mail" },
  { chave: "telefone", rotulo: "Telefone/WhatsApp" },
  { chave: "site", rotulo: "Site" },
  { chave: "responsavel", rotulo: "Responsável", obrigatorio: true },
  { chave: "cargoResponsavel", rotulo: "Cargo" },
  { chave: "porte", rotulo: "Porte" },
  { chave: "tempoAtividade", rotulo: "Tempo de atividade" },
  { chave: "ramo", rotulo: "Ramo" },
  { chave: "produtosServicos", rotulo: "Produtos/Serviços", largo: true },
  { chave: "empregadosGestao", rotulo: "Nº empregados administração/gestão" },
  { chave: "empregadosOperacionais", rotulo: "Nº empregados operacionais" },
];
