"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { traduzirErro } from "@/lib/erros";
import { aplicarAcoes, desfazerAcoes, type AcaoIA, type Anexo, type Desfazer } from "@/lib/conversa";
import { Botao, Cartao } from "@/components/ui";
import { IconeAnexo, IconeCheck, IconeEnviar, IconeFechar, IconeIA, IconeMicrofone, IconeRelatorio } from "@/components/icones";
import { useProjeto } from "./use-projeto";

type Mensagem = {
  id: string;
  papel: "usuario" | "ia";
  autor_nome: string;
  texto: string;
  anexos: Anexo[];
  acoes: { descricao: string }[];
  desfazer: Desfazer[];
  desfeita: boolean;
  created_at: string;
};
type Pendente = { id: string; arquivo: File; url: string | null };

const BUCKET = "evidencias";
const exemplos = [
  "Hoje fiz a visita de 2 horas com o responsável. Levantamos os sistemas que a empresa usa e quem acessa os dados dos clientes.",
  "O que falta para fechar a etapa em curso?",
  "Reunião remota de 1 hora ontem para validar o mapeamento dos processos.",
];

// Conversa do projeto: o consultor conta o que aconteceu (texto, ditado, fotos,
// PDFs) e a IA organiza o projeto: marca o checklist, guarda as fotos na etapa
// certa, registra visitas e escreve o relatório. Cada resposta pode ser desfeita.
export function Conversa({ projeto, focar = 0 }: { projeto: Projeto; focar?: number }) {
  const { alterar, usuario } = useProjeto();
  const { salvarAgora } = useEstado();
  const [mensagens, setMensagens] = useState<Mensagem[] | null>(null);
  const [texto, setTexto] = useState("");
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [ocupado, setOcupado] = useState<null | "enviando" | "pensando">(null);
  const [falha, setFalha] = useState<{ mensagem: Mensagem; erro: string } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const caixa = useRef<HTMLTextAreaElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  // O projeto mais recente, para aplicar a resposta da IA que chega depois
  const projetoAtual = useRef(projeto);
  useEffect(() => {
    projetoAtual.current = projeto;
  }, [projeto]);

  const ditado = useDitado((t) => setTexto((v) => (v.trim() ? `${v.trimEnd()} ${t}` : t)));

  const carregar = useCallback(async () => {
    const { data } = await supabaseNavegador().from("mensagens_projeto").select("*").eq("projeto_id", projeto.id).order("created_at");
    setMensagens((data ?? []) as unknown as Mensagem[]);
  }, [projeto.id]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  // Endereços temporários das fotos já enviadas
  const caminhos = (mensagens ?? []).flatMap((m) => m.anexos.filter((a) => a.tipo.startsWith("image/")).map((a) => a.caminho));
  const chaveCaminhos = caminhos.join("|");
  useEffect(() => {
    const faltam = caminhos.filter((c) => !urls[c]);
    if (!faltam.length) return;
    let ativo = true;
    void supabaseNavegador()
      .storage.from(BUCKET)
      .createSignedUrls(faltam, 3600)
      .then(({ data }) => {
        if (!ativo || !data) return;
        setUrls((u) => ({ ...u, ...Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path!, d.signedUrl as string])) }));
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveCaminhos]);

  // Mensagem nova ou resposta: rola até o fim
  const total = mensagens?.length ?? 0;
  useEffect(() => {
    if (total) fim.current?.scrollIntoView({ block: "end" });
  }, [total, ocupado]);

  // "Registrar" (no cabeçalho ou no menu) traz a caixa de mensagem à vista
  useEffect(() => {
    if (!focar) return;
    caixa.current?.focus();
    caixa.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focar]);

  const pedirIA = async (m: Mensagem) => {
    setOcupado("pensando");
    setFalha(null);
    try {
      const r = await fetch("/api/conversa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projetoId: projeto.id, mensagemId: m.id }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erro ?? "Não foi possível falar com a IA agora.");
      const acoes = ((d.acoes ?? []) as AcaoIA[]).filter((a) => a && typeof a === "object" && "tipo" in a);
      // Calcula sobre uma cópia o que vai mudar (e como desfazer), depois aplica de verdade
      const { descricoes, desfazer } = aplicarAcoes(structuredClone(projetoAtual.current), acoes, m.anexos, m.id, usuario.nome);
      if (descricoes.length)
        alterar((p) => void aplicarAcoes(p, acoes, m.anexos, m.id, usuario.nome), {
          acao: "Conversa: projeto organizado pela IA",
          detalhe: descricoes.join("; "),
        });
      const { data, error } = await supabaseNavegador()
        .from("mensagens_projeto")
        .insert({
          projeto_id: projeto.id,
          empresa: projeto.empresa,
          autor_nome: "Assistente",
          papel: "ia",
          texto: String(d.resposta ?? ""),
          acoes: descricoes.map((descricao) => ({ descricao })),
          desfazer,
        })
        .select()
        .single();
      if (error) throw new Error(traduzirErro(error, "A resposta chegou, mas não foi guardada na conversa."));
      setMensagens((l) => [...(l ?? []), data as unknown as Mensagem]);
    } catch (e) {
      setFalha({ mensagem: m, erro: e instanceof Error ? e.message : "Não foi possível falar com a IA agora." });
    } finally {
      setOcupado(null);
    }
  };

  const enviar = async () => {
    if (ocupado || (!texto.trim() && !pendentes.length)) return;
    ditado.parar();
    setOcupado("enviando");
    setAviso(null);
    try {
      const anexos: Anexo[] = [];
      for (const p of pendentes) anexos.push(await subirAnexo(projeto, p.arquivo));
      // A IA lê o projeto no banco: o que está pendente precisa estar salvo
      await salvarAgora();
      const { data, error } = await supabaseNavegador()
        .from("mensagens_projeto")
        .insert({ projeto_id: projeto.id, empresa: projeto.empresa, autor_nome: usuario.nome, papel: "usuario", texto: texto.trim(), anexos })
        .select()
        .single();
      if (error) throw new Error(traduzirErro(error, "Não foi possível enviar a mensagem."));
      const m = data as unknown as Mensagem;
      setMensagens((l) => [...(l ?? []), m]);
      setTexto("");
      pendentes.forEach((p) => p.url && URL.revokeObjectURL(p.url));
      setPendentes([]);
      await pedirIA(m);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Não foi possível enviar.");
      setOcupado(null);
    }
  };

  const desfazer = async (m: Mensagem) => {
    if (!confirm("Desfazer as alterações que a IA fez nesta resposta?")) return;
    alterar((p) => desfazerAcoes(p, m.desfazer), { acao: "Conversa: alterações da IA desfeitas", detalhe: m.acoes.map((a) => a.descricao).join("; ") });
    setMensagens((l) => (l ?? []).map((x) => (x.id === m.id ? { ...x, desfeita: true } : x)));
    await supabaseNavegador().from("mensagens_projeto").update({ desfeita: true }).eq("id", m.id);
  };

  const escolher = (lista: FileList | null) => {
    const novos = Array.from(lista ?? []).map((arquivo) => ({
      id: crypto.randomUUID(),
      arquivo,
      url: arquivo.type.startsWith("image/") ? URL.createObjectURL(arquivo) : null,
    }));
    setPendentes((p) => [...p, ...novos].slice(0, 6));
  };

  return (
    <div className="space-y-4">
      {mensagens === null ? (
        <p className="py-10 text-center text-sm text-tinta-2">Carregando a conversa…</p>
      ) : mensagens.length === 0 ? (
        <Cartao className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-azul-claro text-azul">
              <IconeIA className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold">Conte o que aconteceu no projeto</h2>
              <p className="mt-1 text-[15px] text-tinta-2">
                Escreva ou dite como foi a visita, mande as fotos e os documentos. A IA descobre a etapa, marca o checklist, guarda as fotos como
                evidência, registra as horas e escreve o relatório no modelo. Tudo aparece aqui e pode ser desfeito.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {exemplos.map((e) => (
              <button
                key={e}
                onClick={() => {
                  setTexto(e);
                  caixa.current?.focus();
                }}
                className="rounded-[var(--radius-campo)] border border-linha bg-pedra/60 px-3 py-2.5 text-left text-sm text-tinta hover:border-azul/40 hover:bg-azul-claro/50"
              >
                “{e}”
              </button>
            ))}
          </div>
        </Cartao>
      ) : (
        <ol className="space-y-4" aria-label="Conversa">
          {mensagens.map((m) => (
            <li key={m.id}>
              {m.papel === "usuario" ? (
                <BolhaUsuario m={m} urls={urls} />
              ) : (
                <BolhaIA m={m} aoDesfazer={() => void desfazer(m)} />
              )}
            </li>
          ))}
        </ol>
      )}

      {ocupado === "pensando" && (
        <div className="mr-auto flex max-w-[90%] items-center gap-3 rounded-2xl rounded-bl-md border border-linha bg-folha px-4 py-3 text-sm text-tinta-2 shadow-[var(--shadow-cartao)]">
          <IconeIA className="h-5 w-5 shrink-0 animate-pulse text-azul" />A IA está lendo e organizando o projeto…
        </div>
      )}
      {falha && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-bloco)] border border-vermelho/25 bg-vermelho-claro px-4 py-3">
          <p className="min-w-0 flex-1 basis-60 text-sm text-vermelho">{falha.erro}</p>
          <Botao variante="secundario" tamanho="pequeno" onClick={() => void pedirIA(falha.mensagem)}>
            Tentar de novo
          </Botao>
        </div>
      )}
      <div ref={fim} />

      {/* Caixa de mensagem, sempre à mão (acima do menu inferior no celular) */}
      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 lg:bottom-4">
        <Cartao className="p-2 focus-within:border-azul/50 focus-within:ring-2 focus-within:ring-azul/15 sm:p-3">
          {pendentes.length > 0 && (
            <ul className="mb-2 flex flex-wrap gap-2 px-1 pt-1">
              {pendentes.map((p) => (
                <li key={p.id} className="relative">
                  {p.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt={p.arquivo.name} className="h-16 w-16 rounded-[var(--radius-campo)] border border-linha object-cover" />
                  ) : (
                    <span className="flex h-16 w-28 flex-col justify-center gap-1 rounded-[var(--radius-campo)] border border-linha bg-pedra px-2 text-[11px] text-tinta-2">
                      <IconeRelatorio className="h-5 w-5 text-azul" />
                      <span className="line-clamp-2 break-all">{p.arquivo.name}</span>
                    </span>
                  )}
                  <button
                    onClick={() => setPendentes((l) => l.filter((x) => x.id !== p.id))}
                    aria-label={`Tirar ${p.arquivo.name}`}
                    className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-tinta text-folha"
                  >
                    <IconeFechar className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label className="sr-only" htmlFor="mensagem-projeto">
            Mensagem para a IA
          </label>
          <textarea
            id="mensagem-projeto"
            ref={caixa}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void enviar();
            }}
            rows={Math.min(8, Math.max(2, texto.split("\n").length + Math.floor(texto.length / 70)))}
            placeholder={ditado.ouvindo ? "Pode falar…" : "Conte o que aconteceu, peça um texto ou pergunte o que falta"}
            className="block w-full resize-none bg-transparent px-2 py-1.5 focus-visible:outline-none text-[15px] leading-relaxed text-tinta outline-none placeholder:text-tinta-2/70"
            disabled={ocupado === "enviando"}
          />
          <div className="mt-1 flex items-center gap-1.5">
            <input
              ref={entrada}
              type="file"
              accept="image/*,application/pdf"
              multiple
              hidden
              onChange={(e) => {
                escolher(e.target.files);
                e.target.value = "";
              }}
            />
            <Botao variante="fantasma" tamanho="pequeno" onClick={() => entrada.current?.click()} aria-label="Anexar foto ou PDF" className="!px-2.5">
              <IconeAnexo className="h-5 w-5" />
              <span className="hidden sm:inline">Foto ou PDF</span>
            </Botao>
            {ditado.disponivel && (
              <Botao
                variante={ditado.ouvindo ? "perigo" : "fantasma"}
                tamanho="pequeno"
                onClick={ditado.ouvindo ? ditado.parar : ditado.comecar}
                aria-pressed={ditado.ouvindo}
                className="!px-2.5"
              >
                <IconeMicrofone className={`h-5 w-5 ${ditado.ouvindo ? "animate-pulse" : ""}`} />
                {ditado.ouvindo ? "Parar" : <span className="hidden sm:inline">Ditar</span>}
              </Botao>
            )}
            <Botao onClick={() => void enviar()} disabled={!!ocupado || (!texto.trim() && !pendentes.length)} className="ml-auto">
              {ocupado === "enviando" ? "Enviando…" : "Enviar"}
              <IconeEnviar className="h-4 w-4" />
            </Botao>
          </div>
          {(aviso || ditado.erro) && <p className="px-2 pt-2 text-sm text-vermelho">{aviso ?? ditado.erro}</p>}
        </Cartao>
      </div>
    </div>
  );
}

function hora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function BolhaUsuario({ m, urls }: { m: Mensagem; urls: Record<string, string> }) {
  return (
    <div className="ml-auto flex max-w-[88%] flex-col items-end gap-1.5 sm:max-w-[75%]">
      {m.anexos.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          {m.anexos.map((a) =>
            a.tipo.startsWith("image/") ? (
              urls[a.caminho] ? (
                <a key={a.id} href={urls[a.caminho]} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={urls[a.caminho]} alt={a.nome} className="h-28 w-28 rounded-xl border border-linha object-cover" />
                </a>
              ) : (
                <span key={a.id} className="h-28 w-28 animate-pulse rounded-xl bg-linha" />
              )
            ) : (
              <span key={a.id} className="flex items-center gap-2 rounded-xl border border-linha bg-folha px-3 py-2 text-sm text-tinta">
                <IconeRelatorio className="h-5 w-5 shrink-0 text-azul" />
                <span className="break-all">{a.nome}</span>
              </span>
            ),
          )}
        </div>
      )}
      {m.texto && <p className="whitespace-pre-line break-words rounded-2xl rounded-br-md bg-azul px-4 py-2.5 text-[15px] leading-relaxed text-folha">{m.texto}</p>}
      <span className="num text-[11px] text-tinta-2">
        {m.autor_nome}, {hora(m.created_at)}
      </span>
    </div>
  );
}

function BolhaIA({ m, aoDesfazer }: { m: Mensagem; aoDesfazer: () => void }) {
  return (
    <div className="mr-auto max-w-[94%] sm:max-w-[80%]">
      <div className="rounded-2xl rounded-bl-md border border-linha bg-folha px-4 py-3 shadow-[var(--shadow-cartao)]">
        <p className="mb-1 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-azul">
          <IconeIA className="h-4 w-4" />
          Assistente
        </p>
        {m.texto && <p className="whitespace-pre-line break-words text-[15px] leading-relaxed text-tinta">{m.texto}</p>}
        {m.acoes.length > 0 && (
          <div className={`mt-3 rounded-[var(--radius-campo)] px-3 py-2.5 ${m.desfeita ? "bg-pedra" : "bg-verde-claro"}`}>
            <p className={`text-[12px] font-bold uppercase tracking-wide ${m.desfeita ? "text-tinta-2" : "text-verde"}`}>
              {m.desfeita ? "Alterações desfeitas" : "O que mudou no projeto"}
            </p>
            <ul className="mt-1.5 space-y-1">
              {m.acoes.map((a, i) => (
                <li key={i} className={`flex items-start gap-2 text-sm ${m.desfeita ? "text-tinta-2 line-through" : "text-tinta"}`}>
                  <IconeCheck className={`mt-0.5 h-4 w-4 shrink-0 ${m.desfeita ? "text-tinta-2" : "text-verde"}`} />
                  <span className="min-w-0 break-words">{a.descricao}</span>
                </li>
              ))}
            </ul>
            {!m.desfeita && m.desfazer.length > 0 && (
              <button onClick={aoDesfazer} className="mt-2 text-[13px] font-semibold text-tinta-2 underline-offset-4 hover:text-vermelho hover:underline">
                Desfazer
              </button>
            )}
          </div>
        )}
      </div>
      <span className="num mt-1 block text-[11px] text-tinta-2">{hora(m.created_at)}</span>
    </div>
  );
}

// Foto reduzida (até 1600 px, JPG) ou PDF, no armazenamento do projeto
async function subirAnexo(projeto: Projeto, arquivo: File): Promise<Anexo> {
  const sb = supabaseNavegador().storage.from(BUCKET);
  const id = crypto.randomUUID();
  if (arquivo.type === "application/pdf") {
    if (arquivo.size > 20 * 1024 * 1024) throw new Error(`“${arquivo.name}” passa de 20 MB.`);
    const caminho = `${projeto.empresa}/${projeto.id}/conversa/${id}.pdf`;
    const { error } = await sb.upload(caminho, arquivo, { contentType: "application/pdf" });
    if (error) throw new Error(`Falha ao enviar “${arquivo.name}”. ${traduzirErro(error, "Tente de novo.")}`);
    return { id, caminho, nome: arquivo.name, tipo: "application/pdf" };
  }
  if (!arquivo.type.startsWith("image/")) throw new Error(`“${arquivo.name}” não é foto nem PDF.`);
  const bmp = await createImageBitmap(arquivo).catch(() => {
    throw new Error(`Não foi possível abrir “${arquivo.name}”. Envie a foto em JPG ou PNG.`);
  });
  const escala = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const largura = Math.round(bmp.width * escala);
  const altura = Math.round(bmp.height * escala);
  const tela = document.createElement("canvas");
  tela.width = largura;
  tela.height = altura;
  tela.getContext("2d")!.drawImage(bmp, 0, 0, largura, altura);
  bmp.close();
  const blob = await new Promise<Blob>((ok, falha) => tela.toBlob((b) => (b ? ok(b) : falha(new Error("Não foi possível preparar a foto."))), "image/jpeg", 0.85));
  const caminho = `${projeto.empresa}/${projeto.id}/conversa/${id}.jpg`;
  const { error } = await sb.upload(caminho, blob, { contentType: "image/jpeg" });
  if (error) throw new Error(`Falha ao enviar “${arquivo.name}”. ${traduzirErro(error, "Tente de novo.")}`);
  return { id, caminho, nome: arquivo.name, tipo: "image/jpeg", largura, altura };
}

// Ditado pelo microfone, com o reconhecimento de voz do próprio navegador
// (Chrome, Edge e Safari; no Firefox o botão não aparece)
type Reconhecimento = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
type ConstrutorReconhecimento = new () => Reconhecimento;

function useDitado(aoTexto: (t: string) => void) {
  const [disponivel] = useState(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window));
  const [ouvindo, setOuvindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const rec = useRef<Reconhecimento | null>(null);
  const aoTextoRef = useRef(aoTexto);
  useEffect(() => {
    aoTextoRef.current = aoTexto;
  }, [aoTexto]);

  const parar = useCallback(() => {
    rec.current?.stop();
    rec.current = null;
    setOuvindo(false);
  }, []);

  const comecar = useCallback(() => {
    const w = window as unknown as { SpeechRecognition?: ConstrutorReconhecimento; webkitSpeechRecognition?: ConstrutorReconhecimento };
    const Construtor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Construtor) return;
    const r = new Construtor();
    r.lang = "pt-BR";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) aoTextoRef.current(e.results[i][0].transcript.trim());
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setErro("Permita o uso do microfone para ditar.");
      else if (e.error !== "no-speech" && e.error !== "aborted") setErro("O ditado parou. Toque em Ditar para continuar.");
    };
    r.onend = () => setOuvindo(false);
    setErro(null);
    r.start();
    rec.current = r;
    setOuvindo(true);
  }, []);

  useEffect(() => () => rec.current?.stop(), []);
  return { disponivel, ouvindo, erro, comecar, parar };
}
