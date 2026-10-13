import PizZip from "pizzip";
import type { Cliente, Etapa, Projeto, Usuario } from "../prototipo/tipos";
import { tipoRegistro } from "../registros";
import { dataPorExtenso, formatarData } from "../datas";
import { doisDigitos, ordinalFeminino } from "../rotulos";
import { secoesAntes, secoesDepois, type DefSecao } from "./secoes";

// O corpo do modelo Word é substituído; cabeçalho (papel timbrado), rodapé com
// número de página, margens e estilos do modelo são mantidos como estão.

const AZUL_FAIXA = "1F5C8A";
const AZUL_TITULO = "2E6A9E";
const ZEBRA = "F2F4F7";
const BORDA = "BFC8D6";
const LARGURA = 9498; // largura útil da página do modelo, em twips
const FONTE = "Times New Roman";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Run = { t: string; b?: boolean; i?: boolean; cor?: string; tam?: number };

function run({ t, b, i, cor, tam = 24 }: Run) {
  const rpr =
    `<w:rFonts w:ascii="${FONTE}" w:hAnsi="${FONTE}" w:cs="${FONTE}"/>` +
    (b ? "<w:b/><w:bCs/>" : "") +
    (i ? "<w:i/><w:iCs/>" : "") +
    (cor ? `<w:color w:val="${cor}"/>` : "") +
    `<w:sz w:val="${tam}"/><w:szCs w:val="${tam}"/>`;
  return `<w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;
}

type OpP = {
  alinhar?: "both" | "center" | "left";
  recuoPrimeira?: number;
  recuoEsq?: number;
  depois?: number;
  antes?: number;
  linha?: number;
  manterProximo?: boolean;
};

function par(runs: Run[] | string, o: OpP = {}) {
  const rs = typeof runs === "string" ? [{ t: runs }] : runs;
  const ppr =
    (o.manterProximo ? "<w:keepNext/>" : "") +
    `<w:spacing w:before="${o.antes ?? 0}" w:after="${o.depois ?? 120}" w:line="${o.linha ?? 360}" w:lineRule="auto"/>` +
    (o.recuoPrimeira || o.recuoEsq
      ? `<w:ind w:left="${o.recuoEsq ?? 0}" w:firstLine="${o.recuoPrimeira ?? 0}"/>`
      : "") +
    `<w:jc w:val="${o.alinhar ?? "both"}"/>`;
  return `<w:p><w:pPr>${ppr}</w:pPr>${rs.map(run).join("")}</w:p>`;
}

function celula(conteudo: string, largura: number, o: { fundo?: string; vAlign?: string } = {}) {
  return (
    `<w:tc><w:tcPr><w:tcW w:w="${largura}" w:type="dxa"/>` +
    (o.fundo ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fundo}"/>` : "") +
    `<w:vAlign w:val="${o.vAlign ?? "center"}"/></w:tcPr>${conteudo}</w:tc>`
  );
}

function tabela(linhas: string[], larguras: number[], borda = BORDA, tamBorda = 4, manterProximo = false) {
  const b = (lado: string) => `<w:${lado} w:val="single" w:sz="${tamBorda}" w:space="0" w:color="${borda}"/>`;
  return (
    `<w:tbl><w:tblPr><w:tblW w:w="${larguras.reduce((a, c) => a + c, 0)}" w:type="dxa"/><w:jc w:val="center"/>` +
    `<w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(b).join("")}</w:tblBorders>` +
    `<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="45" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="45" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
    `<w:tblGrid>${larguras.map((l) => `<w:gridCol w:w="${l}"/>`).join("")}</w:tblGrid>` +
    linhas.join("") +
    `</w:tbl>` +
    par("", { depois: 0, linha: 240, manterProximo })
  );
}

const linhaTabela = (cels: string[], cabecalho = false) =>
  `<w:tr>${cabecalho ? "<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>" : "<w:trPr><w:cantSplit/></w:trPr>"}${cels.join("")}</w:tr>`;

const textoCelula = (t: string, o: { b?: boolean; cor?: string; alinhar?: "center" | "left" | "both"; tam?: number; manterProximo?: boolean } = {}) =>
  par([{ t, b: o.b, cor: o.cor, tam: o.tam ?? 22 }], { alinhar: o.alinhar ?? "left", depois: 0, linha: 240, manterProximo: o.manterProximo });

// Faixa azul ("DETALHES", "ENTREGÁVEL 1 / TÍTULO"): parágrafos sombreados com a
// mesma borda (o Word agrupa num bloco só), presos ao conteúdo seguinte.
function faixa(linhas: string[]) {
  const borda = ["top", "left", "bottom", "right"]
    .map((l) => `<w:${l} w:val="single" w:sz="4" w:space="${l === "top" || l === "bottom" ? 3 : 4}" w:color="${AZUL_FAIXA}"/>`)
    .join("");
  const ultimo = linhas.length - 1;
  return linhas
    .map(
      (l, i) =>
        `<w:p><w:pPr><w:keepNext/><w:keepLines/><w:pBdr>${borda}</w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="${AZUL_FAIXA}"/>` +
        `<w:spacing w:before="${i === 0 ? 120 : 0}" w:after="${i === ultimo ? 160 : 0}" w:line="240" w:lineRule="auto"/><w:ind w:left="85" w:right="85"/><w:jc w:val="center"/></w:pPr>` +
        run({ t: l.toUpperCase(), b: true, cor: "FFFFFF", tam: 24 }) +
        `</w:p>`,
    )
    .join("");
}

// Quadro de destaque (NATUREZA DA ENTREGA, ALERTA…)
function quadro(titulo: string, corpo: string, tipo: "azul" | "alerta") {
  const borda = tipo === "azul" ? AZUL_FAIXA : "E69138";
  const fundo = tipo === "azul" ? "DCE9F5" : "FFF8E5";
  const conteudo =
    par([{ t: titulo.toUpperCase(), b: true, cor: AZUL_FAIXA, tam: 24 }], { alinhar: "left", depois: 0, linha: 260 }) +
    corpo
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => par([{ t: l.trim(), tam: 23 }], { alinhar: "both", depois: 0, linha: 260 }))
      .join("");
  return tabela([linhaTabela([celula(conteudo, LARGURA, { fundo })])], [LARGURA], borda, 12);
}

function titulo(numero: string, texto: string) {
  return par([{ t: `${numero} ${texto}`, b: true, cor: AZUL_TITULO }], { alinhar: "left", antes: 120, depois: 120, manterProximo: true });
}

function tabelaRegistro(projeto: Projeto, tipo: string) {
  const t = tipoRegistro(tipo);
  if (!t) return "";
  const regs = projeto.registros.filter((r) => r.tipo === tipo);
  const pesos = [0.6, ...t.colunas.map((c) => c.largura ?? 1)];
  const total = pesos.reduce((a, c) => a + c, 0);
  const larguras = pesos.map((p) => Math.floor((LARGURA * p) / total));
  const cab = linhaTabela(
    ["ID", ...t.colunas.map((c) => c.titulo)].map((h, i) =>
      celula(textoCelula(h, { b: true, cor: "FFFFFF", alinhar: "center" }), larguras[i], { fundo: AZUL_FAIXA }),
    ),
    true,
  );
  const linhas = regs.map((r, li) =>
    linhaTabela(
      [r.codigo, ...t.colunas.map((c) => r.dados[c.chave] ?? "")].map((v, i) =>
        celula(textoCelula(v, { alinhar: i === 0 ? "center" : "left" }), larguras[i], { fundo: li % 2 ? ZEBRA : undefined }),
      ),
    ),
  );
  return tabela([cab, ...linhas], larguras);
}

// Converte o texto redigido no sistema em parágrafos no padrão dos relatórios:
// parágrafo justificado com recuo; alíneas "a) " com recuo largo; "## " subtítulo;
// "!QUADRO Título" / "!ALERTA Título" quadro; [[tabela:x]] tabela de registro;
// "Figura: legenda" legenda de figura numerada.
function blocos(texto: string, projeto: Projeto, numeroSecao: string, contador: { sub: number; figura: { n: number } }) {
  const saida: string[] = [];
  for (const bloco of texto.replace(/\r/g, "").split(/\n\s*\n/)) {
    const linhas = bloco.split("\n").filter((l) => l.trim() !== "");
    if (!linhas.length) continue;
    const primeira = linhas[0].trim();
    const quadroM = primeira.match(/^!(QUADRO|ALERTA)\s+(.+)$/);
    if (quadroM) {
      saida.push(quadro(quadroM[2], linhas.slice(1).join("\n"), quadroM[1] === "ALERTA" ? "alerta" : "azul"));
      continue;
    }
    let corrido: string[] = [];
    const fechar = () => {
      if (corrido.length) saida.push(par(corrido.join(" "), { recuoPrimeira: 709 }));
      corrido = [];
    };
    for (const linha of linhas) {
      const l = linha.trim();
      const tab = l.match(/^\[\[tabela:([a-z_]+)\]\]$/);
      if (tab) {
        fechar();
        saida.push(tabelaRegistro(projeto, tab[1]));
      } else if (l.startsWith("## ")) {
        fechar();
        contador.sub += 1;
        saida.push(titulo(`${numeroSecao}${contador.sub}.`, l.slice(3)));
      } else if (/^figura:/i.test(l)) {
        fechar();
        contador.figura.n += 1;
        saida.push(par([{ t: `Figura ${contador.figura.n} - ${l.replace(/^figura:\s*/i, "")}`, i: true, tam: 22 }], { alinhar: "center", depois: 160 }));
      } else if (/^[a-z]\)\s/.test(l) || /^\([ivx]+\)\s/.test(l)) {
        fechar();
        saida.push(par(l, { recuoEsq: 3402 }));
      } else {
        corrido.push(l);
      }
    }
    fechar();
  }
  return saida.join("");
}

export type DadosRelatorio = {
  projeto: Projeto;
  etapa: Etapa;
  cliente: Cliente;
  consultor: Usuario | undefined;
};

export function corpoRelatorio({ projeto, etapa, cliente, consultor }: DadosRelatorio) {
  const partes: string[] = [];
  const ordinal = ordinalFeminino[etapa.ordem];
  const etapaNome = `ETAPA ${doisDigitos(etapa.ordem)} | ${etapa.nome}`;

  partes.push(par([{ t: `RELATÓRIO TÉCNICO DE ${etapa.ordem}ª ENTREGA`, b: true, cor: AZUL_FAIXA }], { alinhar: "center", depois: 120 }));
  partes.push(par([{ t: "Adequação à Lei Geral de Proteção de Dados Pessoais (LGPD)", b: true }], { alinhar: "center", depois: 120 }));

  const ficha: [string, string][] = [
    ["Prestadora vinculada", projeto.prestadoraVinculada],
    ["Cliente", [cliente.razaoSocial, cliente.nomeFantasia].filter(Boolean).join(" - ")],
    ["CNPJ", cliente.cnpj],
    ["Responsável", [cliente.responsavel, cliente.cargoResponsavel].filter(Boolean).join(" - ")],
    ["Contato", cliente.email],
    ["Endereço", [cliente.endereco, cliente.cidadeUf, cliente.cep && `CEP ${cliente.cep}`].filter(Boolean).join(", ")],
    ["Gestora Sebrae", projeto.gestorSebrae],
    ["Projeto HUB", projeto.numeroProjetoHub],
    ["Ficha técnica", projeto.fichaTecnica],
    ["Código da ficha técnica", projeto.codigoFichaTecnica],
    ["Segmento", projeto.segmento],
    ["Área de atuação da consultoria", projeto.areaAtuacao],
  ];
  if (etapa.ordem > 1) {
    ficha.push([`Período da Etapa ${doisDigitos(etapa.ordem)}`, `${formatarData(etapa.dataInicio)} a ${formatarData(etapa.dataFim)}`]);
    ficha.push(["Carga horária prevista", `${etapa.horasPrevistas} horas`]);
  }
  const lf = [3402, LARGURA - 3402];
  partes.push(
    tabela(
      ficha.map(([k, v], i) =>
        linhaTabela([
          celula(textoCelula(k, { b: true, cor: "FFFFFF", tam: 24 }), lf[0], { fundo: AZUL_FAIXA }),
          celula(textoCelula(v || "—", { alinhar: "both", tam: 24 }), lf[1], { fundo: i % 2 ? undefined : ZEBRA }),
        ]),
      ),
      lf,
      "FFFFFF",
    ),
  );
  partes.push(faixa(["Detalhes", `${ordinal} entrega - ${etapaNome}`]));

  let num = 0;
  const figura = { n: 0 };
  const secao = (def: DefSecao) => {
    const texto = (etapa.secoes[def.chave] ?? "").trim();
    if (!texto) return;
    if (def.quadro) {
      partes.push(quadro(def.titulo(etapa), texto, "azul"));
      return;
    }
    num += 1;
    partes.push(titulo(`${num}.`, def.titulo(etapa)));
    partes.push(blocos(texto, projeto, `${num}.`, { sub: 0, figura }));
  };

  secoesAntes.forEach(secao);

  let nEnt = 0;
  for (const ent of etapa.entregaveis) {
    if (!ent.conteudo.trim()) continue;
    if (ent.tipo === "entregavel") {
      nEnt += 1;
      partes.push(faixa([`Entregável ${nEnt}`, ent.titulo]));
    } else {
      // Nos relatórios, a Etapa 01 chama de "complementar"; as demais, de "operacional"
      partes.push(faixa([etapa.ordem === 1 ? "Instrumento complementar" : "Instrumento operacional", ent.titulo]));
    }
    num += 1;
    partes.push(titulo(`${num}.`, ent.titulo));
    partes.push(blocos(ent.conteudo, projeto, `${num}.`, { sub: 0, figura }));
  }

  secoesDepois.forEach(secao);

  if (projeto.referencias.length) {
    num += 1;
    partes.push(titulo(`${num}.`, "Referências normativas e técnicas"));
    projeto.referencias.forEach((r, i) => {
      const consulta = r.consultadoEm ? ` Consulta em ${formatarData(r.consultadoEm)}.` : "";
      partes.push(par([{ t: `[${i + 1}] ${r.texto}${consulta} ${r.url}`.trim(), tam: 22 }], { alinhar: "left", depois: 60, linha: 276 }));
    });
    const ultima = projeto.referencias.map((r) => r.consultadoEm).filter(Boolean).sort().pop();
    partes.push(
      quadro(
        "Atualização regulatória",
        `Normas, guias, políticas e contratos de fornecedores devem ser monitorados continuamente. A lista reflete a consulta realizada em ${formatarData(ultima ?? etapa.dataRelatorio)} e deverá ser atualizada sempre que houver mudança normativa, contratual, tecnológica ou de fornecedor.`,
        "azul",
      ),
    );
  }

  if (etapa.dataRelatorio) {
    partes.push(par(`${projeto.localAssinatura}, ${dataPorExtenso(etapa.dataRelatorio)}.`, { alinhar: "left", antes: 120 }));
  }

  const assinatura = (nome: string, papel: string) =>
    par("", { depois: 600 }) +
    par("_________________________________________________________________", { alinhar: "center", depois: 0 }) +
    par([{ t: nome, b: true }], { alinhar: "center", depois: 0 }) +
    par(papel, { alinhar: "center", depois: 240 });
  partes.push(assinatura(consultor?.nomeCompleto ?? "Consultor", "Consultor Responsável"));
  partes.push(assinatura(cliente.responsavel || "Responsável", "Responsável pela Empresa Demandante"));

  return partes.join("");
}

export async function gerarDocx(dados: DadosRelatorio): Promise<Blob> {
  const base = await fetch("/modelos/relatorio-base.docx").then((r) => r.arrayBuffer());
  const zip = new PizZip(base);
  const doc = zip.file("word/document.xml")!.asText();
  const inicio = doc.indexOf("<w:body>") + "<w:body>".length;
  const fimSect = doc.lastIndexOf("<w:sectPr");
  const novo = doc.slice(0, inicio) + corpoRelatorio(dados) + doc.slice(fimSect);
  zip.file("word/document.xml", novo);
  return zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}
