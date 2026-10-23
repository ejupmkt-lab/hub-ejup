"use client";

import { useEffect, useRef, useState } from "react";
import type { RespostaImportacao } from "@/lib/hub-importar";
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
import { Botao } from "@/components/ui";

// A leitura do HUB, comum à importação num projeto e à criação de um projeto novo:
// texto colado, prints e PDFs, o que a extensão do navegador traz ao clicar em "Ler agora",
// o pedido à IA e as caixas de entrada e de "lido da página".

export const MAX_ARQUIVOS = 3;
const MAX_BYTES = 4 * 1024 * 1024;

export type Material = { arquivo: File; lidoPelaIA: boolean };
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
      setMateriais(todos.map((arquivo) => ({ arquivo, lidoPelaIA: paraIA.includes(arquivo) })));
      setEntrega({ origem: p.origem.endereco, titulo: p.origem.titulo, falhas: p.falhas, naoGuardados: p.naoGuardados, textoCortado: p.textoCortado });
      setTexto(p.texto);
      setArquivos([]);
      pendenteId.current = p.id;
      const leu = await ler(p.texto, paraIA);
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
export function LidoDaPagina({ h, destino }: { h: LeituraHub; destino: string }) {
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
                {m.arquivo.name} <span className="text-tinta-2">({tamanhoFmt(m.arquivo.size)}{m.lidoPelaIA ? ", lido pela IA" : ", guardado, mas grande demais para a IA ler junto"})</span>
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
