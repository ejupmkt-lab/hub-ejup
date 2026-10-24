"use client";

import { useEffect, useRef, useState } from "react";
import { rotuloDoPasso, type Completar, type DocumentoDoHub, type LeituraRelatorio, type LeiturasDosRelatorios, type Pendencias, type RespostaImportacao } from "@/lib/hub-importar";
import { formatarData } from "@/lib/datas";
import { itensDosDocumentos } from "@/lib/hub-documentos";
import {
  ARQUIVO_DA_EXTENSAO,
  arquivoDoPendente,
  AVISO_DA_EXTENSAO,
  consumirPendente,
  explicarFalhaDaLeitura,
  extensaoInstalada,
  lerAbaDoHub,
  pegarPendente,
  type PendenteDoHub,
} from "@/lib/hub-extensao";
import { Botao, Campo } from "@/components/ui";

// A leitura do HUB, comum à importação num projeto e à criação de um projeto novo:
// texto colado, prints e PDFs, o que a extensão do navegador traz ao clicar em "Ler agora",
// o pedido à IA e as caixas de entrada e de "lido da página".

export const MAX_ARQUIVOS = 3;
const MAX_BYTES = 4 * 1024 * 1024;

export type Material = { arquivo: File; lidoPelaIA: boolean; etapa: number }; // etapa 0: anexo geral do pedido
export type Entrega = { origem: string; titulo: string; falhas: PendenteDoHub["falhas"]; naoGuardados: PendenteDoHub["naoGuardados"]; textoCortado: boolean };

export const tamanhoFmt = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// Dos arquivos baixados do HUB, a IA lê os menores (PDFs e imagens) que cabem no limite do pedido
function escolherParaIA(arquivos: File[]) {
  const escolhidos: File[] = [];
  let soma = 0;
  for (const a of [...arquivos].sort((x, y) => x.size - y.size)) {
    if (escolhidos.length >= MAX_ARQUIVOS || soma + a.size > MAX_BYTES - 300 * 1024) continue;
    escolhidos.push(a);
    soma += a.size;
  }
  return escolhidos;
}

// Prints de celular passam de 4 MB com facilidade: reduz antes de enviar
async function reduzir(arquivo: File): Promise<File> {
  if (!arquivo.type.startsWith("image/") || arquivo.size < 700 * 1024) return arquivo;
  try {
    const img = await createImageBitmap(arquivo);
    const escala = Math.min(1, 2000 / Math.max(img.width, img.height));
    const tela = document.createElement("canvas");
    tela.width = Math.round(img.width * escala);
    tela.height = Math.round(img.height * escala);
    tela.getContext("2d")!.drawImage(img, 0, 0, tela.width, tela.height);
    const blob = await new Promise<Blob | null>((r) => tela.toBlob(r, "image/jpeg", 0.85));
    return blob && blob.size < arquivo.size ? new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : arquivo;
  } catch {
    return arquivo;
  }
}

type Opcoes = {
  // Campos extras do pedido à IA (o projeto, ou o modo "novo" e a empresa)
  campos: () => Record<string, string>;
  // Antes de perguntar à IA (ex.: gravar o que está pendente, porque o servidor lê o banco)
  antesDeLer?: () => Promise<void>;
  codigoParaPuxar: string;
  aoLer: (r: RespostaImportacao) => void;
  // Uma leitura nova da extensão chegou: limpa o que estava na tela
  aoReceber?: () => void;
  // Projeto novo só consome o que a extensão guardou quando o projeto é criado
  consumirAoLer: boolean;
};

export function useLeituraHub(opcoes: Opcoes) {
  const op = useRef(opcoes);
  useEffect(() => {
    op.current = opcoes;
  });
  const [texto, setTexto] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [lendo, setLendo] = useState(false);
  const [puxando, setPuxando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [extensao, setExtensao] = useState<"verificando" | "sim" | "nao">("verificando");
  const [configurada, setConfigurada] = useState(false);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  // O que a IA leu nos PDFs dos relatórios de cada etapa (datas de assinatura, atividades…)
  const [leituras, setLeituras] = useState<LeiturasDosRelatorios>({});
  const [lendoRelatorios, setLendoRelatorios] = useState<string | null>(null);
  const pendenteId = useRef<string | null>(null);
  const tentouSozinho = useRef(false);
  const jaRecebidos = useRef(new Set<string>());

  const escolher = (lista: FileList | null) => {
    setErro(null);
    setArquivos((a) => [...a, ...Array.from(lista ?? [])].slice(0, MAX_ARQUIVOS));
  };

  const ler = async (colado: string = texto, anexos: File[] = arquivos) => {
    setErro(null);
    if (!colado.trim() && !anexos.length) return setErro("Cole o texto da página do HUB ou anexe um print ou PDF.");
    setLendo(true);
    try {
      const prontos = await Promise.all(anexos.map(reduzir));
      if (prontos.reduce((s, a) => s + a.size, 0) > MAX_BYTES) throw new Error("Os anexos passam de 4 MB. Mande menos arquivos ou prints menores.");
      await op.current.antesDeLer?.();
      const f = new FormData();
      for (const [k, v] of Object.entries(op.current.campos())) f.append(k, v);
      f.append("texto", colado);
      prontos.forEach((a) => f.append("arquivos", a));
      const r = await fetch("/api/hub/importar", { method: "POST", body: f });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erro ?? "Não foi possível ler o conteúdo agora.");
      op.current.aoLer(d as RespostaImportacao);
      return true;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler o conteúdo agora.");
      return false;
    } finally {
      setLendo(false);
    }
  };

  // A IA lê cada relatório baixado (um pedido por PDF, dois ao mesmo tempo) e devolve as datas escritas nele
  const lerRelatorios = async (porEtapa: Record<number, File>) => {
    const fila = Object.keys(porEtapa).map(Number).sort((a, b) => a - b);
    if (!fila.length) return;
    const trabalhar = async () => {
      for (let n = fila.shift(); n !== undefined; n = fila.shift()) {
        const arquivo = porEtapa[n];
        setLendoRelatorios(`Lendo o relatório da etapa ${String(n).padStart(2, "0")}…`);
        try {
          if (arquivo.size > 3.8 * 1024 * 1024) throw new Error("O PDF é grande demais para a IA ler (mais de 3,8 MB). Informe as datas à mão.");
          const f = new FormData();
          f.append("modo", "relatorio");
          f.append("etapa", String(n));
          f.append("arquivos", arquivo);
          const r = await fetch("/api/hub/importar", { method: "POST", body: f });
          const d = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(d.erro ?? "Não foi possível ler o relatório.");
          setLeituras((l) => ({ ...l, [n]: d as LeituraRelatorio }));
        } catch (e) {
          setLeituras((l) => ({ ...l, [n]: { erro: e instanceof Error ? e.message : "Não foi possível ler o relatório." } }));
        }
      }
    };
    await Promise.all([trabalhar(), trabalhar()]);
    setLendoRelatorios(null);
  };

  // A extensão leu a página (e baixou os anexos) a pedido do consultor: entra aqui e a IA já lê
  const receber = async (p: PendenteDoHub) => {
    if (jaRecebidos.current.has(p.id)) return;
    jaRecebidos.current.add(p.id);
    op.current.aoReceber?.();
    setErro(null);
    setPuxando(true);
    try {
      const todos = p.arquivos.map(arquivoDoPendente);
      const paraIA = escolherParaIA(todos);
      setMateriais(todos.map((arquivo, i) => ({ arquivo, lidoPelaIA: paraIA.includes(arquivo), etapa: p.arquivos[i].etapa ?? 0 })));
      setEntrega({ origem: p.origem.endereco, titulo: p.origem.titulo, falhas: p.falhas, naoGuardados: p.naoGuardados, textoCortado: p.textoCortado });
      setTexto(p.texto);
      setArquivos([]);
      pendenteId.current = p.id;
      setLeituras({});
      const relatorios = relatoriosDasEtapas(todos.map((arquivo, i) => ({ arquivo, lidoPelaIA: false, etapa: p.arquivos[i].etapa ?? 0 })));
      const [leu] = await Promise.all([ler(p.texto, paraIA), lerRelatorios(relatorios)]);
      if (leu && op.current.consumirAoLer) void consumirPendente(p.id);
    } finally {
      setPuxando(false);
    }
  };

  // Botão do Blimp: pede à extensão a aba do HUB que o consultor já permitiu nas opções dela
  const puxar = async (silencioso = false) => {
    setErro(null);
    setPuxando(true);
    try {
      const r = await lerAbaDoHub(op.current.codigoParaPuxar);
      if (!r.ok) return silencioso ? undefined : setErro(explicarFalhaDaLeitura[r.motivo] ?? "Não foi possível ler a aba do HUB.");
      setTexto(r.texto);
      await ler(r.texto);
    } finally {
      setPuxando(false);
    }
  };

  // Ao abrir: se a extensão já trouxe a página do HUB, usa; senão, se o HUB foi permitido, puxa a aba aberta
  useEffect(() => {
    let ativo = true;
    void extensaoInstalada().then(async (e) => {
      if (!ativo) return;
      setExtensao(e ? "sim" : "nao");
      setConfigurada(!!e?.configurada);
      if (!e || tentouSozinho.current) return;
      tentouSozinho.current = true;
      const pendente = await pegarPendente();
      if (!ativo) return;
      if (pendente) void receber(pendente);
      else if (e.configurada) void puxar(true);
    });
    // A extensão avisa quando o consultor clica em "Ler agora" com o painel já aberto
    const ouvir = (ev: MessageEvent) => {
      if (ev.source !== window || ev.origin !== window.location.origin || ev.data?.tipo !== AVISO_DA_EXTENSAO) return;
      void pegarPendente().then((p) => p && receber(p));
    };
    window.addEventListener("message", ouvir);
    return () => {
      ativo = false;
      window.removeEventListener("message", ouvir);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    texto,
    setTexto,
    arquivos,
    setArquivos,
    lendo,
    puxando,
    erro,
    setErro,
    extensao,
    configurada,
    materiais,
    entrega,
    leituras,
    lendoRelatorios,
    escolher,
    ler,
    puxar,
    // Para quem consome só depois (projeto novo)
    consumirLeitura: () => {
      if (pendenteId.current) void consumirPendente(pendenteId.current);
    },
  };
}

export type LeituraHub = ReturnType<typeof useLeituraHub>;

// Primeira tela do painel: a extensão, o texto colado, prints e PDFs
export function EntradaDoHub({ h, aoCancelar, aviso }: { h: LeituraHub; aoCancelar: () => void; aviso?: string }) {
  return (
    <>
      {h.extensao === "sim" && (
        <div className="space-y-2">
          <p className="text-[13px] text-tinta-2">
            Na página do HUB que você quer ler, clique no ícone da extensão e em <strong>Ler agora</strong>. Ela lê a página, baixa os anexos e traz tudo para cá. A IA lê,
            mostra o que vai mudar e só aplica quando você confirmar.
          </p>
          {h.puxando || h.lendo ? <p className="text-[13px] font-semibold text-azul">Lendo o que veio do HUB…</p> : null}
          {h.configurada && (
            <Botao tamanho="pequeno" variante="secundario" onClick={() => void h.puxar()} disabled={h.puxando || h.lendo}>
              Puxar o texto da aba aberta do HUB
            </Botao>
          )}
        </div>
      )}
      {h.extensao === "nao" && (
        <details className="rounded-[var(--radius-campo)] bg-folha px-3 py-2 text-[13px] ring-1 ring-linha">
          <summary className="cursor-pointer font-semibold text-azul">Importar com um clique: instalar a extensão do Chrome</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-tinta-2">
            <li>
              <a className="font-semibold text-azul underline" href={ARQUIVO_DA_EXTENSAO} download>
                Baixe a extensão
              </a>{" "}
              e descompacte a pasta.
            </li>
            <li>
              No Chrome (ou Edge), abra <span className="font-mono">chrome://extensions</span> e ligue o &quot;Modo do desenvolvedor&quot;.
            </li>
            <li>Clique em &quot;Carregar sem compactação&quot; e escolha a pasta descompactada.</li>
            <li>{aviso ?? "Deixe o projeto aberto aqui no Blimp, vá à página do HUB que quer ler e clique no ícone da extensão em “Ler agora”."}</li>
          </ol>
        </details>
      )}
      <p className="text-[13px] text-tinta-2">
        {h.extensao === "sim" ? "Ou, " : ""}
        {h.extensao === "sim" ? "se preferir, abra" : "Abra"} o pedido no HUB, selecione a página toda (Ctrl+A), copie (Ctrl+C) e cole aqui. Também dá para anexar um print ou PDF. A IA lê,
        mostra o que vai mudar e só aplica quando você confirmar.
      </p>
      <label className="block text-[13px] font-semibold">
        Texto copiado do HUB
        <textarea
          className="campo mt-1 min-h-32 text-[14px] font-normal"
          value={h.texto}
          onChange={(e) => h.setTexto(e.target.value)}
          placeholder="Cole aqui o conteúdo da página do pedido"
          maxLength={40000}
        />
      </label>
      <label className="block text-[13px] font-semibold">
        Prints ou PDF <span className="font-normal text-tinta-2">(opcional, até {MAX_ARQUIVOS} arquivos)</span>
        <input type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" className="campo mt-1 !py-1.5" onChange={(e) => h.escolher(e.target.files)} />
      </label>
      {h.arquivos.length > 0 && (
        <ul className="flex flex-wrap gap-2 text-[13px]">
          {h.arquivos.map((a, i) => (
            <li key={`${a.name}-${i}`} className="flex items-center gap-1.5 rounded-full bg-folha px-3 py-1 ring-1 ring-linha">
              {a.name}
              <button type="button" className="text-tinta-2 hover:text-vermelho" aria-label={`Tirar ${a.name}`} onClick={() => h.setArquivos((l) => l.filter((_, j) => j !== i))}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {h.erro && <p className="text-[13px] text-vermelho">{h.erro}</p>}
      <div className="flex gap-2">
        <Botao tamanho="pequeno" variante={h.extensao === "sim" ? "secundario" : "primario"} onClick={() => void h.ler()} disabled={h.lendo || h.puxando}>
          {h.lendo ? "A IA está lendo…" : "Ler com a IA"}
        </Botao>
        <Botao variante="fantasma" tamanho="pequeno" onClick={aoCancelar} disabled={h.lendo}>
          Cancelar
        </Botao>
      </div>
    </>
  );
}

// O que veio da página do HUB: arquivos baixados e o que não deu para baixar
export function LidoDaPagina({ h, destino, emEntregas }: { h: LeituraHub; destino: string; emEntregas?: (m: Material) => number }) {
  const { entrega, materiais } = h;
  if (!entrega) return null;
  return (
    <div>
      <h3 className="mb-1.5 text-[13px] font-semibold">Lido da página do HUB{entrega.titulo ? ` (${entrega.titulo.slice(0, 60)})` : ""}</h3>
      {entrega.textoCortado && <p className="mb-1.5 text-[13px] text-laranja">A página era muito longa e só o começo foi lido.</p>}
      {materiais.length > 0 ? (
        <>
          <p className="mb-1 text-[13px] text-tinta-2">Arquivos baixados, que serão guardados {destino} ao aplicar:</p>
          <ul className="list-disc space-y-1 pl-5 text-[14px]">
            {materiais.map((m, i) => (
              <li key={`${m.arquivo.name}-${i}`}>
                {m.arquivo.name}{" "}
                <span className="text-tinta-2">
                  ({tamanhoFmt(m.arquivo.size)}
                  {m.lidoPelaIA ? ", lido pela IA" : ", grande demais para a IA ler junto"}
                  {emEntregas?.(m) ? `; vai para Entregas, etapa ${String(emEntregas(m)).padStart(2, "0")}` : m.etapa > 0 ? `; é da etapa ${String(m.etapa).padStart(2, "0")}, guardado em Materiais do HUB` : "; guardado em Materiais do HUB"})
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-[14px] text-tinta-2">Nenhum arquivo anexado foi encontrado na página.</p>
      )}
      {(entrega.falhas.length > 0 || entrega.naoGuardados.length > 0) && (
        <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[14px] text-laranja">
          {entrega.falhas.map((f, k) => (
            <li key={`f${k}`}>
              Não baixei “{f.nome}”: {f.motivo}.
            </li>
          ))}
          {entrega.naoGuardados.map((n, k) => (
            <li key={`n${k}`}>
              “{n.nome}” ({n.tipo}) não é PDF nem imagem; o Blimp ainda não guarda esse tipo.
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Documentos que a página lista: os baixados ficam guardados e os demais, só registrados no histórico
export function DocumentosDoHub({ documentos, nomesBaixados }: { documentos: DocumentoDoHub[] | undefined; nomesBaixados: string[] }) {
  const itens = itensDosDocumentos(documentos, nomesBaixados);
  if (!itens.length) return null;
  return (
    <div>
      <h3 className="mb-1.5 text-[13px] font-semibold">Documentos listados no HUB</h3>
      <ul className="list-disc space-y-1 pl-5 text-[14px]">
        {itens.map((i, k) => (
          <li key={k}>
            {i.doc.nome.trim()}
            <span className="text-tinta-2">
              {[i.doc.data?.trim(), i.doc.por?.trim() && `por ${i.doc.por.trim()}`].filter(Boolean).length ? ` (${[i.doc.data?.trim(), i.doc.por?.trim() && `por ${i.doc.por.trim()}`].filter(Boolean).join(" ")})` : ""}
              {i.baixado ? " · baixado e guardado" : " · não baixei: fica registrado no histórico"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// O primeiro PDF de cada etapa vira o relatório dela em Entregas (a etapa é a do cartão onde o link está no HUB)
export function relatoriosDasEtapas(materiais: Material[]) {
  const por: Record<number, File> = {};
  for (const m of materiais) if (m.etapa > 0 && m.arquivo.type === "application/pdf" && !por[m.etapa]) por[m.etapa] = m.arquivo;
  return por;
}

// O que a página do HUB não mostra: o consultor completa as datas que souber (em branco não é registrado)
export function CompletarDados({ pend, c, setC, relatorios }: { pend: Pendencias; c: Completar; setC: (c: Completar) => void; relatorios: Record<number, File> }) {
  const [mesma, setMesma] = useState("");
  if (!pend.passosSemData.length && !pend.pedePlano && !pend.etapasEnviadas.length) return null;
  const campo = (rotulo: string, valor: string, aoMudar: (v: string) => void, dica?: string) => (
    <Campo key={rotulo} rotulo={rotulo} dica={dica}>
      <input type="date" className="campo num" value={valor} onChange={(e) => aoMudar(e.target.value)} />
    </Campo>
  );
  return (
    <div className="space-y-3 rounded-[var(--radius-campo)] border border-laranja/30 bg-laranja-claro p-3">
      <div>
        <h3 className="text-[13px] font-semibold text-laranja">O HUB não mostra estas datas</h3>
        <p className="text-[13px] text-tinta-2">Preencha as que souber. O que ficar em branco não é registrado, e dá para completar depois.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {pend.pedePlano && (
          <>
            {campo("Início do projeto (plano de trabalho)", c.planoInicio, (v) => setC({ ...c, planoInicio: v }), "Sem o plano, o sistema não registra o pagamento.")}
            {campo("Fim do projeto (plano de trabalho)", c.planoFim, (v) => setC({ ...c, planoFim: v }))}
          </>
        )}
        {pend.passosSemData.map((p) => campo(rotuloDoPasso[p], c.passos[p] ?? "", (v) => setC({ ...c, passos: { ...c.passos, [p]: v } })))}
        {pend.etapasEnviadas.length > 1 && (
          <Campo rotulo="Não sei a data de cada etapa: usar esta para as que estão em branco" dica="Por exemplo, a data em que o projeto foi finalizado no HUB.">
            <input
              type="date"
              className="campo num"
              value={mesma}
              onChange={(e) => {
                const v = e.target.value;
                setMesma(v);
                if (!v) return;
                const envios = { ...c.envios };
                for (const x of pend.etapasEnviadas) if (!(envios[x.etapa] ?? x.dataDaIA)) envios[x.etapa] = v;
                setC({ ...c, envios });
              }}
            />
          </Campo>
        )}
        {pend.etapasEnviadas.map((e) =>
          campo(
            `Etapa ${String(e.etapa).padStart(2, "0")} enviada no HUB em`,
            c.envios[e.etapa] ?? e.dataDaIA,
            (v) => setC({ ...c, envios: { ...c.envios, [e.etapa]: v } }),
            e.dataDoRelatorio
              ? `Data tirada do relatório “${relatorios[e.etapa]?.name ?? ""}” (a mais recente entre o fechamento e as assinaturas). Confira.`
              : relatorios[e.etapa]
                ? `O relatório “${relatorios[e.etapa].name}” vai para Entregas.`
                : "O HUB não tinha o relatório para baixar: anexe o PDF depois em Entregas.",
          ),
        )}
      </div>
    </div>
  );
}

// O que a IA leu nos relatórios das etapas: as datas escritas neles, que passam para as etapas e o histórico
export function DatasDosRelatorios({ h }: { h: LeituraHub }) {
  const etapas = Object.keys(h.leituras).map(Number).sort((a, b) => a - b);
  if (!etapas.length && !h.lendoRelatorios) return null;
  const f = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d ?? "") ? formatarData(d) : "");
  return (
    <div>
      <h3 className="mb-1.5 text-[13px] font-semibold">Datas lidas nos relatórios das etapas</h3>
      {h.lendoRelatorios && <p className="mb-1 text-[13px] font-semibold text-azul">{h.lendoRelatorios}</p>}
      <ul className="list-disc space-y-1 pl-5 text-[14px]">
        {etapas.map((n) => {
          const l = h.leituras[n];
          if ("erro" in l) return <li key={n} className="text-laranja">Etapa {String(n).padStart(2, "0")}: {l.erro}</li>;
          const partes = [
            f(l.data_do_relatorio) && `fechado em ${f(l.data_do_relatorio)}`,
            f(l.assinatura_consultor) && `assinado pelo consultor em ${f(l.assinatura_consultor)}`,
            f(l.assinatura_cliente) && `assinado pela empresa em ${f(l.assinatura_cliente)}`,
            f(l.inicio_das_atividades) && `atividades de ${f(l.inicio_das_atividades)}${f(l.fim_das_atividades) ? ` a ${f(l.fim_das_atividades)}` : ""}`,
          ].filter(Boolean);
          return (
            <li key={n}>
              Etapa {String(n).padStart(2, "0")}: {partes.length ? partes.join("; ") : "o relatório não traz datas"}
              {l.datas?.length ? <span className="text-tinta-2"> · {l.datas.length} {l.datas.length === 1 ? "data citada" : "datas citadas"}, que entram no histórico</span> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
