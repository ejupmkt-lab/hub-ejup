import type { EmpresaSlug, Estado } from "./dados/tipos";
import type { EtapaModelo, Servico } from "./modelos/tipos";

// Serviços cadastrados (fichas técnicas): o que a empresa presta, com as etapas
// que cada projeto copia ao nascer. Aqui ficam as regras do cadastro.

// Serviço que veio do código, com textos-padrão e referências próprios
export const ID_SERVICO_LGPD = "lgpd-sebrae-13070-5";

export const servicosDaEmpresa = (estado: Estado, slug: string) =>
  estado.servicos
    .filter((s) => s.empresa === slug)
    .sort((a, b) => Number(b.credenciado) - Number(a.credenciado) || a.fichaTecnica.localeCompare(b.fichaTecnica));

export const horasDoServico = (s: Pick<Servico, "etapas">) => s.etapas.reduce((a, e) => a + (e.horasPrevistas || 0), 0);

export function etapaVazia(ordem: number): EtapaModelo {
  return { ordem, nome: "", descricao: "", horasPrevistas: 0, duracaoReferenciaDias: 0, atividades: [], entregaveis: [], instrumentos: [] };
}

export function servicoVazio(empresa: EmpresaSlug, id: string): Servico {
  return {
    id,
    versao: 1,
    empresa,
    nome: "",
    nomeCurto: "",
    fichaTecnica: "",
    codigoFichaTecnica: "",
    prestadoraVinculada: "",
    area: "",
    descricao: "",
    credenciado: true,
    areaAtuacao: "",
    etapas: [etapaVazia(1)],
  };
}

// Checklist em texto, uma atividade por linha: "1.1 Texto da atividade".
// Linha sem código ganha o próximo número de primeiro nível.
export const atividadesEmTexto = (atividades: [string, string][]) => atividades.map(([c, t]) => `${c} ${t}`).join("\n");

export function textoEmAtividades(texto: string): [string, string][] {
  const lista: [string, string][] = [];
  let ultimoPrimeiro = 0;
  for (const bruta of texto.split("\n")) {
    const linha = bruta.trim();
    if (!linha) continue;
    const m = linha.match(/^(\d+(?:\.\d+)*)[.)]?\s+(.+)$/);
    if (m) {
      lista.push([m[1], m[2].trim()]);
      if (!m[1].includes(".")) ultimoPrimeiro = Number(m[1]);
    } else {
      ultimoPrimeiro += 1;
      lista.push([String(ultimoPrimeiro), linha]);
    }
  }
  return lista;
}

// Uma linha por item (entregáveis e instrumentos)
export const linhasEmLista = (texto: string) =>
  texto
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);

// O que impede salvar o serviço
export function problemasDoServico(s: Servico): string[] {
  const erros: string[] = [];
  if (!s.fichaTecnica.trim()) erros.push("Informe o nome do serviço (como na ficha técnica)");
  if (!s.nomeCurto.trim()) erros.push("Informe o nome curto, que aparece nos cartões dos projetos");
  if (!s.etapas.length) erros.push("Inclua pelo menos uma etapa");
  s.etapas.forEach((e) => {
    const n = `Etapa ${String(e.ordem).padStart(2, "0")}`;
    if (!e.nome.trim()) erros.push(`${n}: informe o nome`);
    if (!(e.horasPrevistas > 0)) erros.push(`${n}: informe a carga horária`);
    if (!e.atividades.length) erros.push(`${n}: inclua as atividades do checklist`);
    const codigos = e.atividades.map(([c]) => c);
    const repetido = codigos.find((c, i) => codigos.indexOf(c) !== i);
    if (repetido) erros.push(`${n}: o código ${repetido} aparece mais de uma vez no checklist`);
  });
  return erros;
}
