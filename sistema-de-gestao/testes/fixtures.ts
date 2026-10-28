import { readFileSync } from "node:fs";
import type { Cliente, Etapa, Projeto, Usuario } from "../src/lib/dados/tipos";
import { etapasDoModelo } from "../src/lib/modelos/instanciar";
import { modeloLgpdSebrae } from "../src/lib/modelos/lgpd-sebrae";
import { somarDias } from "../src/lib/datas";

export const modeloDocx = () => {
  const b = readFileSync(new URL("../public/modelos/relatorio-base.docx", import.meta.url));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};

export const clienteDeExemplo: Cliente = {
  id: "cli-teste",
  empresa: "pivotto",
  razaoSocial: "Transportadora Exemplo Ltda",
  nomeFantasia: "Exemplo Transportes",
  cnpj: "11.222.333/0001-81",
  endereco: "Rua das Flores, 100, Sala 2",
  cep: "59.000-000",
  cidadeUf: "Natal/RN",
  email: "contato@exemplo.test",
  telefone: "(84) 99999-0000",
  site: "",
  responsavel: "Maria Exemplo",
  cargoResponsavel: "Diretora",
  porte: "Pequeno porte",
  tempoAtividade: "10 anos",
  ramo: "Transporte rodoviário de cargas",
  produtosServicos: "Transporte de cargas",
  empregadosGestao: "3",
  empregadosOperacionais: "10",
};

export const consultorDeExemplo: Usuario = { id: "u1", email: "consultor@exemplo.test", nome: "Consultor", nomeCompleto: "Consultor de Exemplo", adminGrupo: false, acessos: {} };

// Projeto de LGPD com as 5 etapas do serviço; com plano de trabalho (datas) ou sem
export function projetoDeExemplo({ comPlano = true }: { comPlano?: boolean } = {}): Projeto {
  const etapas: Etapa[] = etapasDoModelo(modeloLgpdSebrae);
  if (comPlano) {
    let inicio = "2026-10-01";
    for (const e of etapas) {
      e.dataInicio = inicio;
      e.dataFim = somarDias(inicio, e.duracaoReferenciaDias - 1);
      e.dataInicioPlano = e.dataInicio;
      e.dataFimPlano = e.dataFim;
      e.dataRelatorio = e.dataFim;
      inicio = somarDias(e.dataFim, 1);
    }
  }
  return {
    id: "prj-teste",
    empresa: "pivotto",
    clienteId: clienteDeExemplo.id,
    modeloId: modeloLgpdSebrae.id,
    modeloVersao: 1,
    consultorId: consultorDeExemplo.id,
    status: "em_andamento",
    prestadoraVinculada: "FUNCERN",
    numeroProjetoHub: "99999",
    codigoSolicitacaoHub: "99999",
    gestorSebrae: "Gestora de Exemplo",
    fichaTecnica: modeloLgpdSebrae.fichaTecnica,
    codigoFichaTecnica: modeloLgpdSebrae.codigoFichaTecnica,
    segmento: "Transporte",
    areaAtuacao: "Proteção de dados",
    localAssinatura: "Natal/RN",
    planoFechadoEm: comPlano ? "2026-09-30" : null,
    etapas,
    registros: [],
    referencias: [{ id: "r1", texto: "BRASIL. Lei nº 13.709, de 14 de agosto de 2018.", url: "https://www.planalto.gov.br", consultadoEm: "2026-01-01" }],
    historico: [],
  };
}

// Texto do corpo do Word (o que o usuário lê), sem as marcas de XML
export const textoDoXml = (xml: string) =>
  xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
