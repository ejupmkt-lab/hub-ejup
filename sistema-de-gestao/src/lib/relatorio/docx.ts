import PizZip from "pizzip";
import type { Cliente, Etapa, Projeto, Usuario } from "../dados/tipos";
import { tipoRegistro } from "../registros";
import { dataPorExtenso, formatarData } from "../datas";
import { doisDigitos, ordinalFeminino } from "../rotulos";
import { ehUltimaEtapa, secoesAntes, secoesDepois, type DefSecao } from "./secoes";
import { dataLimiteInformacoes } from "./padroes";

// O corpo do modelo Word é substituído; cabeçalho (papel timbrado), rodapé com
// número de página, margens e estilos do modelo são mantidos como estão.

const AZUL_FAIXA = "1F5C8A";
const AZUL_TITULO = "2E6A9E";
const ZEBRA = "F2F4F7";
const BORDA = "BFC8D6";
const LARGURA = 9498; // largura útil da página do modelo, em twips
const FONTE = "Times New Roman";

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Run = { t: string; b?: boolean; i?: boolean; cor?: string; tam?: number; realce?: boolean };

// Marcadores que o consultor precisa resolver antes de enviar: [completar: …] e [a confirmar: …]
export const MARCADOR_NO_WORD = /\[(?:completar|a confirmar)[^\]]*\]/gi;

// Divide o trecho em partes comuns e partes de marcador (estas com realce amarelo)
function comRealce(r: Run): Run[] {
  if (r.realce !== undefined) return [r];
  const partes: Run[] = [];
  let fim = 0;
  for (const m of r.t.matchAll(MARCADOR_NO_WORD)) {
    if (m.index > fim) partes.push({ ...r, t: r.t.slice(fim, m.index), realce: false });
    partes.push({ ...r, t: m[0], realce: true });
    fim = m.index + m[0].length;
  }
  if (fim < r.t.length) partes.push({ ...r, t: r.t.slice(fim), realce: false });
  return partes.length ? partes : [{ ...r, realce: false }];
}

function run({ t, b, i, cor, tam = 24, realce }: Run) {
  const rpr =
    `<w:rFonts w:ascii="${FONTE}" w:hAnsi="${FONTE}" w:cs="${FONTE}"/>` +
    (b ? "<w:b/><w:bCs/>" : "") +
    (i ? "<w:i/><w:iCs/>" : "") +
    (cor ? `<w:color w:val="${cor}"/>` : "") +
    `<w:sz w:val="${tam}"/><w:szCs w:val="${tam}"/>` +
    (realce ? '<w:highlight w:val="yellow"/>' : "");
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
  return `<w:p><w:pPr>${ppr}</w:pPr>${rs.flatMap(comRealce).map(run).join("")}</w:p>`;
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
export function quadro(titulo: string, corpo: string, tipo: "azul" | "alerta") {
  const borda = tipo === "azul" ? AZUL_FAIXA : "E69138";
  const fundo = tipo === "azul" ? "DCE9F5" : "FFF8E5";
  const conteudo =
    par([{ t: titulo.toUpperCase(), b: true, cor: AZUL_FAIXA, tam: 24 }], { alinhar: "left", depois: 0, linha: 260 }) +
    corpo
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => par([{ t: l.trim(), tam: 23 }], { alinhar: "both", depois: 0, linha: 260, recuoPrimeira: 709 }))
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
  // Coluna vazia em todas as linhas (ex.: prazo ainda não definido) não entra
  const colunas = t.colunas.filter((c) => regs.some((r) => (r.dados[c.chave] ?? "").trim()));
  const larguras = largurasPeloConteudo([
    ["ID", ...colunas.map((c) => c.titulo)],
    ...regs.map((r) => [r.codigo, ...colunas.map((c) => r.dados[c.chave] ?? "")]),
  ]);
  const cab = linhaTabela(
    ["ID", ...colunas.map((c) => c.titulo)].map((h, i) =>
      celula(textoCelula(h, { b: true, cor: "FFFFFF", alinhar: "center" }), larguras[i], { fundo: AZUL_FAIXA }),
    ),
    true,
  );
  const linhas = regs.map((r, li) =>
    linhaTabela(
      [r.codigo, ...colunas.map((c) => r.dados[c.chave] ?? "")].map((v, i) =>
        celula(textoCelula(v, { alinhar: i === 0 ? "center" : "left" }), larguras[i], { fundo: li % 2 ? ZEBRA : undefined }),
      ),
    ),
  );
  return tabela([cab, ...linhas], larguras);
}

// Colunas mais largas conforme o texto, sem quebrar palavra no meio: cada uma
// tem ao menos a largura da palavra mais longa dela (cerca de 130 twips por
// letra no corpo 11), e o espaço que falta sai das colunas mais largas
function largurasPeloConteudo(celulas: string[][]) {
  const n = Math.max(...celulas.map((c) => c.length));
  const col = (i: number) => celulas.map((c) => c[i] ?? "");
  const minimos = Array.from({ length: n }, (_, i) => Math.min(Math.max(...col(i).flatMap((t) => t.split(/\s+/).map((w) => w.length))), 22) * 130 + 320);
  const pesos = Array.from({ length: n }, (_, i) => Math.min(Math.max(col(i).reduce((a, t) => a + t.length, 0) / celulas.length, 4), 70));
  let larguras = pesos.map((p) => (LARGURA * p) / pesos.reduce((a, c) => a + c, 0));
  for (let volta = 0; volta < n; volta++) {
    const presas = larguras.map((l, i) => l <= minimos[i]);
    const fixo = larguras.reduce((a, l, i) => a + (presas[i] ? minimos[i] : 0), 0);
    const livre = pesos.reduce((a, p, i) => a + (presas[i] ? 0 : p), 0);
    // Palavras longas demais para caber todas: divide pelos mínimos
    if (!livre || fixo >= LARGURA) {
      const soma = minimos.reduce((a, c) => a + c, 0);
      return minimos.map((m) => Math.floor((LARGURA * m) / soma));
    }
    const novas = larguras.map((_, i) => (presas[i] ? minimos[i] : ((LARGURA - fixo) * pesos[i]) / livre));
    if (novas.every((l, i) => l === larguras[i])) break;
    larguras = novas;
  }
  return larguras.map(Math.floor);
}

// Tabela escrita no próprio texto, uma linha por linha da tabela: "| A | B |".
// A primeira linha é o cabeçalho; as colunas ficam mais largas conforme o texto.
function tabelaTexto(linhas: string[]) {
  const celulas = linhas.map((l) => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim()));
  const larguras = largurasPeloConteudo(celulas);
  const [cab, ...corpo] = celulas;
  return tabela(
    [
      linhaTabela(
        larguras.map((l, i) => celula(textoCelula(cab[i] ?? "", { b: true, cor: "FFFFFF", alinhar: "center" }), l, { fundo: AZUL_FAIXA })),
        true,
      ),
      ...corpo.map((c, li) =>
        linhaTabela(larguras.map((l, i) => celula(textoCelula(c[i] ?? ""), l, { fundo: li % 2 ? ZEBRA : undefined }))),
      ),
    ],
    larguras,
  );
}

// Converte o texto redigido no sistema em parágrafos no padrão dos relatórios:
// parágrafo justificado com recuo; alíneas "a) " com recuo largo; "## " subtítulo;
// "!QUADRO Título" / "!ALERTA Título" quadro; [[tabela:x]] tabela de registro;
// "Figura: legenda" legenda de figura numerada; "| A | B |" tabela.
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
    let tabelaAberta: string[] = [];
    const fecharTabela = () => {
      if (tabelaAberta.length) saida.push(tabelaTexto(tabelaAberta));
      tabelaAberta = [];
    };
    for (const linha of linhas) {
      const l = linha.trim();
      if (l.startsWith("|")) {
        fechar();
        tabelaAberta.push(l);
        continue;
      }
      fecharTabela();
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
    fecharTabela();
    fechar();
  }
  return saida.join("");
}

export type ImagemRelatorio = { rId: string; legenda: string; largura: number; altura: number };

export type DadosRelatorio = {
  projeto: Projeto;
  etapa: Etapa;
  cliente: Cliente;
  consultor: Usuario | undefined;
  imagens?: ImagemRelatorio[];
};

// Figura centralizada, até 15 cm de largura e 11 cm de altura, mantendo a proporção
const EMU_CM = 360000;
function figuraXml(img: ImagemRelatorio, n: number) {
  const escala = Math.min((15 * EMU_CM) / img.largura, (11 * EMU_CM) / img.altura);
  const cx = Math.round(img.largura * escala);
  const cy = Math.round(img.altura * escala);
  const id = 1000 + n;
  return (
    `<w:p><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="60"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Figura ${n}"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="figura${n}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${img.rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>` +
    par([{ t: `Figura ${n} - ${img.legenda}`, i: true, tam: 22 }], { alinhar: "center", depois: 200 })
  );
}

// Quantos marcadores [completar] e [a confirmar] o texto do corpo ainda tem
export const contarMarcadoresNoCorpo = (xml: string) => (xml.match(MARCADOR_NO_WORD) ?? []).length;

// Como nos relatórios: rótulo em faixa azul à esquerda, valor em cinza-claro à direita,
// linhas separadas por branco. Campo em branco não entra na ficha.
function tabelaDaFicha(ficha: [string, string][]) {
  const lf = [4100, LARGURA - 4100];
  const celulaFicha = (t: string, opc: Parameters<typeof textoCelula>[1]) =>
    `<w:p><w:pPr><w:spacing w:before="40" w:after="40" w:line="252" w:lineRule="auto"/><w:jc w:val="${opc?.alinhar ?? "left"}"/></w:pPr>${comRealce({ t, b: opc?.b, cor: opc?.cor, tam: 24 }).map(run).join("")}</w:p>`;
  return tabela(
    ficha
      .filter(([, v]) => v.trim())
      .map(([k, v]) =>
        linhaTabela([
          celula(celulaFicha(k, { b: true, cor: "FFFFFF" }), lf[0], { fundo: AZUL_FAIXA }),
          celula(celulaFicha(v, { alinhar: "both" }), lf[1], { fundo: "F2F2F2" }),
        ]),
      ),
    lf,
    "FFFFFF",
    12,
  );
}

// As 12 linhas de identificação da capa, comuns ao diagnóstico e aos relatórios
function fichaDeIdentificacao(projeto: Projeto, cliente: Cliente): [string, string][] {
  return [
    ["Prestadora vinculada", projeto.prestadoraVinculada],
    ["Cliente", [cliente.razaoSocial, cliente.nomeFantasia].filter(Boolean).join(" - ")],
    ["CNPJ", cliente.cnpj],
    ["Responsável", [cliente.responsavel, cliente.cargoResponsavel].filter(Boolean).join(" - ")],
    ["Contato", cliente.email],
    ["Endereço", [cliente.endereco, cliente.cidadeUf, cliente.cep && `CEP ${cliente.cep}`].filter(Boolean).join(", ")],
    ["Gestora Sebrae", projeto.gestorSebrae],
    ["Projeto HUB", projeto.codigoSolicitacaoHub || projeto.numeroProjetoHub],
    ["Ficha técnica", projeto.fichaTecnica],
    ["Código da ficha técnica", projeto.codigoFichaTecnica],
    ["Segmento", projeto.segmento],
    ["Área de atuação da consultoria", projeto.areaAtuacao],
  ];
}

export function corpoRelatorio({ projeto, etapa, cliente, consultor, imagens = [] }: DadosRelatorio) {
  const partes: string[] = [];
  const ordinal = ordinalFeminino[etapa.ordem];
  const etapaNome = `ETAPA ${doisDigitos(etapa.ordem)} | ${etapa.nome}`;

  partes.push(par([{ t: `RELATÓRIO TÉCNICO DE ${etapa.ordem}ª ENTREGA`, b: true, cor: AZUL_FAIXA }], { alinhar: "center", depois: 120 }));
  partes.push(par([{ t: "Adequação à Lei Geral de Proteção de Dados Pessoais (LGPD)", b: true }], { alinhar: "center", depois: 120 }));

  const ficha = fichaDeIdentificacao(projeto, cliente);
  // Período e carga horária entram em todas as etapas; sem plano de trabalho, "A definir"
  ficha.push([`Período da Etapa ${doisDigitos(etapa.ordem)}`, etapa.dataInicio && etapa.dataFim ? `${formatarData(etapa.dataInicio)} a ${formatarData(etapa.dataFim)}` : "A definir"]);
  ficha.push(["Carga horária prevista", etapa.horasPrevistas > 0 ? `${etapa.horasPrevistas} horas` : "A definir"]);
  partes.push(tabelaDaFicha(ficha));
  const aposACapa = partes.length;
  partes.push(faixa(["Detalhes", `${ordinal} entrega - ${etapaNome}`]));

  let num = 0;
  const figura = { n: 0 };
  const ultima = ehUltimaEtapa(projeto.etapas, etapa);
  const secao = (def: DefSecao) => {
    const texto = (etapa.secoes[def.chave] ?? "").trim();
    if (!texto && !(def.chave === "evidencias" && imagens.length)) return;
    if (def.quadro) {
      partes.push(quadro(def.titulo(etapa, ultima), texto, "azul"));
      return;
    }
    num += 1;
    partes.push(titulo(`${num}.`, def.titulo(etapa, ultima)));
    partes.push(blocos(texto, projeto, `${num}.`, { sub: 0, figura }));
    // As imagens de evidência entram logo depois do texto da seção de evidências
    if (def.chave === "evidencias") imagens.forEach((img) => partes.push(figuraXml(img, ++figura.n)));
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

  // A data de consulta das referências é a data-limite das informações do relatório (a do modelo só vale sem ela)
  const limite = dataLimiteInformacoes(etapa);
  if (projeto.referencias.length) {
    num += 1;
    partes.push(titulo(`${num}.`, "Referências normativas e técnicas"));
    projeto.referencias.forEach((r, i) => {
      const dataConsulta = limite ?? r.consultadoEm;
      const consulta = dataConsulta ? ` Consulta em ${formatarData(dataConsulta)}.` : "";
      partes.push(par([{ t: `[${i + 1}] ${r.texto}${consulta} ${r.url}`.trim(), tam: 22 }], { alinhar: "left", depois: 60, linha: 276 }));
    });
    const ultimaConsulta = limite ?? projeto.referencias.map((r) => r.consultadoEm).filter(Boolean).sort().pop();
    partes.push(
      quadro(
        "Atualização regulatória",
        `Normas, guias, políticas e contratos de fornecedores devem ser monitorados continuamente. A lista reflete a consulta realizada em ${formatarData(ultimaConsulta ?? etapa.dataRelatorio)} e deverá ser atualizada sempre que houver mudança normativa, contratual, tecnológica ou de fornecedor.`,
        "azul",
      ),
    );
  }

  // Local, data e as duas assinaturas ficam juntos na mesma página
  if (etapa.dataRelatorio) {
    partes.push(par(`${projeto.localAssinatura}, ${dataPorExtenso(etapa.dataRelatorio)}.`, { alinhar: "left", antes: 120, manterProximo: true }));
  }

  const assinatura = (nome: string, papel: string, ultima: boolean) =>
    par("", { depois: 600, manterProximo: true }) +
    par("_________________________________________________________________", { alinhar: "center", depois: 0, manterProximo: true }) +
    par([{ t: nome, b: true }], { alinhar: "center", depois: 0, manterProximo: true }) +
    par(papel, { alinhar: "center", depois: 240, manterProximo: !ultima });
  partes.push(assinatura(consultor?.nomeCompleto ?? "Consultor", "Consultor Responsável", false));
  partes.push(assinatura(cliente.responsavel || "Responsável", "Responsável pela Empresa Demandante", true));

  // Caixa logo após a capa, que o usuário apaga ao concluir; a contagem vem do próprio corpo
  const pendentes = contarMarcadoresNoCorpo(partes.join(""));
  if (pendentes > 0)
    partes.splice(
      aposACapa,
      0,
      quadro(
        "Pendências antes do envio",
        `Este documento tem ${pendentes} ${pendentes === 1 ? "marcador" : "marcadores"} a completar, destacados em amarelo. Resolva cada um, remova o realce e apague esta caixa antes de assinar e enviar.`,
        "alerta",
      ),
    );

  return partes.join("");
}

// A miniatura do modelo (docProps/thumbnail.emf, 4,6 MB) é só uma prévia do Word: sai do arquivo e da relação que a cita
export function tirarMiniatura(zip: PizZip) {
  if (!zip.file("docProps/thumbnail.emf")) return;
  zip.remove("docProps/thumbnail.emf");
  const rels = zip.file("_rels/.rels");
  if (rels) zip.file("_rels/.rels", rels.asText().replace(/<Relationship\b[^>]*thumbnail[^>]*\/>/gi, ""));
}

export type ArquivoImagem = { dados: ArrayBuffer; tipo: string; legenda: string; largura: number; altura: number };

// Imagens no pacote do Word: arquivo em word/media, relação no document.xml.rels e tipo no [Content_Types].xml
export function incluirImagens(zip: PizZip, arquivos: ArquivoImagem[]): ImagemRelatorio[] {
  const imagens: ImagemRelatorio[] = [];
  if (!arquivos.length) return imagens;
  let rels = zip.file("word/_rels/document.xml.rels")!.asText();
  let tipos = zip.file("[Content_Types].xml")!.asText();
  arquivos.forEach((a, i) => {
    const ext = a.tipo === "image/png" ? "png" : a.tipo === "image/webp" ? "webp" : "jpeg";
    const nome = `evidencia${i + 1}.${ext}`;
    const rId = `rIdEvidencia${i + 1}`;
    zip.file(`word/media/${nome}`, a.dados);
    rels = rels.replace(
      "</Relationships>",
      `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${nome}"/></Relationships>`,
    );
    if (!new RegExp(`Extension="${ext}"`, "i").test(tipos)) {
      tipos = tipos.replace("<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">", (m) => `${m}<Default Extension="${ext}" ContentType="${a.tipo === "image/jpeg" ? "image/jpeg" : a.tipo}"/>`);
    }
    imagens.push({ rId, legenda: a.legenda, largura: a.largura, altura: a.altura });
  });
  zip.file("word/_rels/document.xml.rels", rels);
  zip.file("[Content_Types].xml", tipos);
  return imagens;
}

// Corpo novo dentro do modelo Word (cabeçalho timbrado, rodapé, margens e estilos do modelo ficam)
async function empacotar(corpoDe: (imagens: ImagemRelatorio[]) => string, arquivos: ArquivoImagem[], modelo?: ArrayBuffer): Promise<Blob> {
  const base: ArrayBuffer = modelo ?? (await fetch("/modelos/relatorio-base.docx").then((r) => r.arrayBuffer()));
  const zip = new PizZip(base);
  tirarMiniatura(zip);
  const imagens = incluirImagens(zip, arquivos);
  const doc = zip.file("word/document.xml")!.asText();
  const inicio = doc.indexOf("<w:body>") + "<w:body>".length;
  const fimSect = doc.lastIndexOf("<w:sectPr");
  zip.file("word/document.xml", doc.slice(0, inicio) + corpoDe(imagens) + doc.slice(fimSect));
  return zip.generate({
    type: "blob",
    compression: "DEFLATE",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export async function gerarDocx(dados: Omit<DadosRelatorio, "imagens">, arquivos: ArquivoImagem[] = [], modelo?: ArrayBuffer): Promise<Blob> {
  return empacotar((imagens) => corpoRelatorio({ ...dados, imagens }), arquivos, modelo);
}
