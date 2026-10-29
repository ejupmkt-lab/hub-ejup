import PizZip from "pizzip";
import type { Cliente, Projeto, Usuario } from "../dados/tipos";
import { dataPorExtenso } from "../datas";
import { lerDiagnostico, secoesDoModelo, totalDeEmpregados } from "../diagnostico";
import { esc, incluirImagens, MARCADOR_NO_WORD, quadro, tirarMiniatura, type ArquivoImagem, type ImagemRelatorio } from "./docx";

// Diagnóstico no modelo do SEBRAE (public/modelos/diagnostico-base.docx, o arquivo oficial): a capa, as tabelas e os cabeçalhos
// do modelo ficam como estão; aqui só se preenchem os dados da empresa, os quatro quadros do diagnóstico (com as imagens de
// evidência) e o quadro de assinatura. Não usa o modelo dos relatórios.

export type DadosDoDiagnosticoWord = { projeto: Projeto; cliente: Cliente; consultor: Usuario | undefined };

const AZUL_VALOR = "1F3A8A"; // valores digitados nos campos do modelo, em azul e negrito
const COR_TEXTO = "231F20";

// Ordem dos elementos de w:rPr exigida pelo Word
const ORDEM_RPR = ["rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "smallCaps", "strike", "dstrike", "outline", "shadow", "emboss", "imprint", "noProof", "snapToGrid", "vanish", "webHidden", "color", "spacing", "w", "kern", "position", "sz", "szCs", "highlight", "u", "effect", "bdr", "shd", "fitText", "vertAlign", "rtl", "cs", "em", "lang", "eastAsianLayout", "specVanish", "oMath"];

// rPr novo a partir de um modelo (o do rótulo do campo): troca ou acrescenta os elementos pedidos, na ordem certa
function rPr(modelo: string, mudar: Record<string, string | null>) {
  const itens = new Map<string, string>();
  for (const m of modelo.matchAll(/<w:(\w+)\b[^>]*\/>/g)) itens.set(m[1], m[0]);
  for (const [tag, xml] of Object.entries(mudar)) {
    if (xml === null) itens.delete(tag);
    else itens.set(tag, xml);
  }
  const ordenados = [...itens.entries()].sort((a, b) => (ORDEM_RPR.indexOf(a[0]) + 1 || 99) - (ORDEM_RPR.indexOf(b[0]) + 1 || 99));
  return `<w:rPr>${ordenados.map(([, x]) => x).join("")}</w:rPr>`;
}

type Estilo = { modelo: string; negrito?: boolean; cor?: string };

// Trecho de texto como uma ou mais runs: o que for [completar…] ou [a confirmar…] sai com realce amarelo
function runs(texto: string, { modelo, negrito, cor }: Estilo) {
  const mudar: Record<string, string | null> = {};
  if (negrito) Object.assign(mudar, { b: "<w:b/>", bCs: "<w:bCs/>" });
  if (cor) mudar.color = `<w:color w:val="${cor}"/>`;
  const um = (t: string, realce: boolean) =>
    t ? `<w:r>${rPr(modelo, { ...mudar, ...(realce ? { highlight: '<w:highlight w:val="yellow"/>' } : {}) })}<w:t xml:space="preserve">${esc(t)}</w:t></w:r>` : "";
  let saida = "";
  let fim = 0;
  for (const m of texto.matchAll(MARCADOR_NO_WORD)) {
    saida += um(texto.slice(fim, m.index), false) + um(m[0], true);
    fim = m.index + m[0].length;
  }
  return saida + um(texto.slice(fim), false);
}

// Os blocos do tipo <w:tbl>…</w:tbl> do corpo, em ordem (o modelo não tem tabelas dentro de tabelas)
function tabelas(xml: string) {
  const lista: { inicio: number; fim: number }[] = [];
  let i = 0;
  while ((i = xml.indexOf("<w:tbl>", i)) >= 0) {
    const fim = xml.indexOf("</w:tbl>", i) + "</w:tbl>".length;
    lista.push({ inicio: i, fim });
    i = fim;
  }
  return lista;
}

const linhasDe = (tbl: string) => tbl.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) ?? [];
const celulasDe = (tr: string) => tr.match(/<w:tc>[\s\S]*?<\/w:tc>/g) ?? [];
const paragrafosDe = (tc: string) => tc.match(/<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g) ?? [];
const textoDe = (xml: string) => [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// Acrescenta o valor logo depois do rótulo, no último parágrafo da célula, no estilo do último trecho do rótulo
function preencherCelula(tc: string, valor: string) {
  const ultimoP = tc.lastIndexOf("</w:p>");
  const p = tc.slice(0, ultimoP);
  const modelo = [...p.matchAll(/<w:r[ >][\s\S]*?<\/w:r>/g)].map((m) => m[0].match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] ?? "").filter(Boolean).pop() ?? "";
  return `${p}${runs(` ${valor}`, { modelo, negrito: true, cor: AZUL_VALOR })}${tc.slice(ultimoP)}`;
}

const vazioComo = (campo: string) => `[completar: ${campo}]`;

// Quais campos da tabela "Dados da empresa demandante" recebem quais dados do cadastro
function valorDoCampo(rotulo: string, projeto: Projeto, c: Cliente): string | null {
  const v = (x: string | undefined | null, campo: string) => (x ?? "").trim() || vazioComo(campo);
  if (/^Empresa Cliente:/.test(rotulo)) return c.nomeFantasia && c.razaoSocial ? `${c.nomeFantasia} | ${c.razaoSocial}` : v(c.razaoSocial || c.nomeFantasia, "nome da empresa");
  if (/^CNPJ/.test(rotulo)) return v(c.cnpj, "CNPJ");
  if (/^Endereço:/.test(rotulo)) return v(c.endereco, "endereço");
  if (/^CEP:/.test(rotulo)) return v(c.cep, "CEP");
  if (/^Cidade\/Estado:/.test(rotulo)) return v(c.cidadeUf, "cidade e estado");
  if (/^E-mail:/.test(rotulo)) return v(c.email, "e-mail");
  if (/^Telefone\/WhatsApp:/.test(rotulo)) return v(c.telefone, "telefone");
  if (/^Site:/.test(rotulo)) return c.site?.trim() || "Não informado";
  if (/^Responsável:/.test(rotulo)) return v(c.responsavel, "responsável");
  if (/^Cargo:/.test(rotulo)) return v(c.cargoResponsavel, "cargo");
  if (/^Porte:/.test(rotulo)) return v(c.porte, "porte");
  if (/^Tempo atividade:/.test(rotulo)) return v(c.tempoAtividade, "tempo de atividade");
  if (/^Ramo:/.test(rotulo)) return v(c.ramo, "ramo");
  if (/^Produtos\/Serviços:/.test(rotulo)) return v(c.produtosServicos, "produtos e serviços");
  if (/^N\.º Empregados Adm/.test(rotulo)) return v(c.empregadosGestao, "empregados da administração/gestão");
  if (/^N\.º Empregados Operacionais:/.test(rotulo)) return v(c.empregadosOperacionais, "empregados operacionais");
  if (/^N\.º Empregados Total:/.test(rotulo)) return v(totalDeEmpregados(c), "total de empregados");
  if (/^Código da Solicitação no HUB:/.test(rotulo)) return v(projeto.codigoSolicitacaoHub || projeto.numeroProjetoHub, "código da solicitação no HUB");
  return null;
}

function tabelaDeDados(tbl: string, projeto: Projeto, c: Cliente) {
  return linhasDe(tbl).reduce((acc, tr) => {
    const nova = celulasDe(tr).reduce((trAcc, tc) => {
      const valor = valorDoCampo(textoDe(tc), projeto, c);
      return valor === null ? trAcc : trAcc.replace(tc, () => preencherCelula(tc, valor));
    }, tr);
    return acc.replace(tr, () => nova);
  }, tbl);
}

// Parágrafo de corpo dos quadros: Arial pequeno do modelo (TableParagraph), justificado, cor do texto do modelo
const PPR_CORPO = `<w:pPr><w:pStyle w:val="TableParagraph"/><w:spacing w:before="40"/><w:ind w:left="113" w:right="113"/><w:jc w:val="both"/><w:rPr><w:color w:val="${COR_TEXTO}"/><w:spacing w:val="-2"/><w:sz w:val="18"/></w:rPr></w:pPr>`;
const RPR_CORPO = `<w:color w:val="${COR_TEXTO}"/><w:spacing w:val="-2"/><w:sz w:val="18"/>`;

// "1. Título da necessidade. Texto…" (as necessidades da investigação): o número e o título saem em negrito, como no modelo
function paragrafoDeTexto(linha: string) {
  const m = linha.match(/^(\d{1,2}\.\s+[^.\n]{3,90}\.)\s+([\s\S]+)$/);
  const corpo = m ? runs(m[1], { modelo: RPR_CORPO, negrito: true }) + runs(` ${m[2]}`, { modelo: RPR_CORPO }) : runs(linha, { modelo: RPR_CORPO });
  return `<w:p>${PPR_CORPO}${corpo}</w:p>`;
}

const paragrafosDoTexto = (texto: string) =>
  texto
    .replace(/\r/g, "")
    .split(/\n\s*\n|\n(?=\d{1,2}\.\s)/)
    .map((l) => l.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .map(paragrafoDeTexto)
    .join("");

const paragrafoVazio = `<w:p><w:pPr><w:pStyle w:val="TableParagraph"/><w:spacing w:before="20"/><w:rPr><w:sz w:val="12"/></w:rPr></w:pPr></w:p>`;

const EMU_CM = 360000;
function imagemXml(img: ImagemRelatorio, n: number) {
  const escala = Math.min((11 * EMU_CM) / img.largura, (9.5 * EMU_CM) / img.altura);
  const cx = Math.round(img.largura * escala);
  const cy = Math.round(img.altura * escala);
  const id = 2000 + n;
  return (
    `<w:p><w:pPr><w:pStyle w:val="TableParagraph"/><w:keepNext/><w:spacing w:before="80" w:after="40"/><w:ind w:left="113" w:right="113"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Evidência ${n}"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="evidencia${n}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${img.rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
  );
}

const numeroDaEvidencia = (n: number) => String(n).padStart(2, "0");

// Os quatro quadros do diagnóstico: o parágrafo do título (numerado pelo modelo) fica; o texto de orientação (cinza e pequeno)
// sai, e entra o conteúdo
function tabelaDoDiagnostico(tbl: string, projeto: Projeto, imagens: ImagemRelatorio[]) {
  const d = lerDiagnostico(projeto);
  const guia: Record<string, string> = {
    anamnese: "contexto do cliente: o que ele relatou, o sintoma, o problema e a causa",
    analise: "o que foi levantado e comprovado, necessidade por necessidade, conforme o roteiro ou pré-diagnóstico da ficha técnica",
    parecer: "se a ficha técnica atende a necessidade do cliente e um parágrafo curto com a expectativa dele",
  };
  const linhas = linhasDe(tbl);
  let novoTbl = tbl;
  linhas.forEach((tr, i) => {
    if (i === 0) return;
    const [tc] = celulasDe(tr);
    if (!tc) return;
    const ps = paragrafosDe(tc);
    const cabecalho = ps[0];
    if (!cabecalho) return;
    const abertura = tc.slice(0, tc.indexOf(cabecalho));
    let corpo = "";
    const secao = secoesDoModelo[i - 1];
    if (secao) {
      const texto = (d[secao.chave] ?? "").trim();
      corpo = texto ? paragrafosDoTexto(texto) : paragrafoDeTexto(vazioComo(guia[secao.chave]));
    } else {
      corpo = imagens.length
        ? imagens.map((img, k) => imagemXml(img, k + 1) + `<w:p>${PPR_CORPO.replace('<w:jc w:val="both"/>', '<w:jc w:val="left"/>')}${runs(`Evidência ${numeroDaEvidencia(k + 1)} – ${img.legenda}`, { modelo: RPR_CORPO })}</w:p>`).join("")
        : paragrafoDeTexto(vazioComo("imagem da reunião de diagnóstico (foto ou print) como evidência"));
    }
    const novaCelula = `${abertura}${cabecalho}${corpo}${paragrafoVazio}</w:tc>`;
    const novaLinha = (secao ? tr : tr.replace(/<w:trPr>/, "<w:trPr><w:cantSplit/>")).replace(tc, () => novaCelula);
    novoTbl = novoTbl.replace(tr, () => novaLinha);
  });
  return novoTbl;
}

// Quadro de assinatura: prestador, telefone, e-mail, local e data
function tabelaDeAssinatura(tbl: string, projeto: Projeto, consultor: Usuario | undefined, hoje: string) {
  const d = lerDiagnostico(projeto);
  const valores: [RegExp, string][] = [
    [/^Prestador de Serviços|^Instituição Credenciada/, projeto.prestadoraVinculada.trim() || vazioComo("prestador de serviços credenciado")],
    [/^Telefone:/, (d.telefone ?? "").trim() || vazioComo("telefone do prestador")],
    [/^E-mail:/, (d.email ?? "").trim() || consultor?.email || vazioComo("e-mail do prestador")],
    [/^Local e Data:/, `${projeto.localAssinatura || vazioComo("local")}, ${dataPorExtenso(d.dataDoDocumento || hoje)}`],
  ];
  return linhasDe(tbl).reduce((acc, tr) => {
    const nova = celulasDe(tr).reduce((trAcc, tc) => {
      const rotulo = textoDe(tc);
      const achado = valores.find(([re]) => re.test(rotulo));
      return achado ? trAcc.replace(tc, () => preencherCelula(tc, achado[1])) : trAcc;
    }, tr);
    return acc.replace(tr, () => nova);
  }, tbl);
}

export const contarMarcadoresDoDiagnostico = (xml: string) => (xml.match(MARCADOR_NO_WORD) ?? []).length;

// O corpo do modelo, preenchido
export function preencherModeloDoDiagnostico(xml: string, dados: DadosDoDiagnosticoWord, hoje: string, imagens: ImagemRelatorio[]) {
  const t = tabelas(xml);
  if (t.length < 3) throw new Error("O modelo do diagnóstico não tem as três tabelas esperadas.");
  const [dados0, quadros, assinatura] = t.map((x) => xml.slice(x.inicio, x.fim));
  let saida = xml.slice(0, t[0].inicio) + tabelaDeDados(dados0, dados.projeto, dados.cliente) + xml.slice(t[0].fim, t[1].inicio);
  saida += tabelaDoDiagnostico(quadros, dados.projeto, imagens) + xml.slice(t[1].fim, t[2].inicio);
  saida += tabelaDeAssinatura(assinatura, dados.projeto, dados.consultor, hoje) + xml.slice(t[2].fim);

  // Caixa de pendências antes de "1. Qualificação da Demanda", que a pessoa apaga ao concluir
  const pendentes = contarMarcadoresDoDiagnostico(saida);
  if (pendentes > 0) {
    const alvo = saida.indexOf("Qualificação da Demanda");
    const inicioP = saida.lastIndexOf("<w:p ", alvo);
    const caixa = quadro(
      "Pendências antes do envio",
      `Este documento tem ${pendentes} ${pendentes === 1 ? "marcador" : "marcadores"} a completar, destacados em amarelo. Resolva cada um, remova o realce e apague esta caixa antes de assinar e enviar no HUB.`,
      "alerta",
    );
    if (inicioP > 0) saida = saida.slice(0, inicioP) + caixa + saida.slice(inicioP);
  }
  return saida;
}

export async function gerarDocxDiagnostico(dados: DadosDoDiagnosticoWord, hoje: string, arquivos: ArquivoImagem[] = [], modelo?: ArrayBuffer): Promise<Blob> {
  const base: ArrayBuffer = modelo ?? (await fetch("/modelos/diagnostico-base.docx").then((r) => r.arrayBuffer()));
  const zip = new PizZip(base);
  tirarMiniatura(zip);
  const imagens = incluirImagens(zip, arquivos);
  zip.file("word/document.xml", preencherModeloDoDiagnostico(zip.file("word/document.xml")!.asText(), dados, hoje, imagens));
  return zip.generate({ type: "blob", compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
