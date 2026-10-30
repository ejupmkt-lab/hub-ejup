"use client";

import { useEffect, useRef, useState } from "react";
import type { Diagnostico, Evidencia, Projeto } from "@/lib/dados/tipos";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { traduzirErro } from "@/lib/erros";
import { formatarData, hojeIso } from "@/lib/datas";
import { hubDoProjeto, passoHubDoProjeto } from "@/lib/fase";
import { faltasDoDiagnostico, lerDiagnostico, secoesDoModelo, temTextoNoDiagnostico, type ChaveDeSecao } from "@/lib/diagnostico";
import { gerarDocxDiagnostico } from "@/lib/relatorio/diagnostico-docx";
import { MARCADOR_NO_WORD } from "@/lib/relatorio/docx";
import { Botao, Campo, Cartao, Status } from "@/components/ui";
import { baixarImagens, subirEvidencia } from "./evidencias";
import { useProjeto } from "./use-projeto";

const BUCKET = "evidencias";
const TIPOS = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "application/pdf"];
const tamanho = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const contarMarcadores = (d: Diagnostico) => secoesDoModelo.reduce((a, s) => a + (d[s.chave].match(MARCADOR_NO_WORD)?.length ?? 0), 0);
const palavras = (d: Diagnostico) => secoesDoModelo.reduce((a, s) => a + (d[s.chave].trim() ? d[s.chave].trim().split(/\s+/).length : 0), 0);

async function abrirArquivo(caminho: string, nome: string) {
  const { data, error } = await supabaseNavegador().storage.from(BUCKET).createSignedUrl(caminho, 300, { download: nome });
  if (error || !data) return alert("Não foi possível abrir o arquivo.");
  window.location.href = data.signedUrl;
}

// Diagnóstico do projeto (fase 2 do HUB), nas Entregas, antes dos relatórios. Segue o modelo do SEBRAE (e não o dos relatórios):
// os três textos escritos com a IA quando ela tem todas as informações, as imagens da reunião, o Word gerado no modelo oficial
// e o arquivo final (a versão enviada no HUB), para o fluxo de entregas do projeto ficar registrado do começo ao fim.
export function DiagnosticoDoProjeto({ projeto, aoDesenvolver }: { projeto: Projeto; aoDesenvolver: () => void }) {
  const { alterar, cliente, consultor, usuario } = useProjeto();
  const entradaArquivo = useRef<HTMLInputElement>(null);
  const entradaImagem = useRef<HTMLInputElement>(null);
  const [gerando, setGerando] = useState(false);
  const [enviando, setEnviando] = useState<null | "arquivo" | "imagem">(null);
  const [verTexto, setVerTexto] = useState(false);
  const [editando, setEditando] = useState<Record<ChaveDeSecao, string> | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const d = lerDiagnostico(projeto);
  const arquivo = d.arquivo;
  const enviadoNoHub = hubDoProjeto(projeto).datas.diagnostico_enviado ?? null;
  // Começa recolhido quando o diagnóstico já está pronto (arquivo final anexado ou enviado no HUB); aberto enquanto ainda se elabora
  const [aberto, setAberto] = useState(!(arquivo || enviadoNoHub));
  const temTexto = temTextoNoDiagnostico(d);
  const marcadores = contarMarcadores(d);
  const faltas = cliente ? faltasDoDiagnostico(projeto, cliente) : [];
  const naFaseDoDiagnostico = passoHubDoProjeto(projeto) === "diagnostico";
  const doHub = (projeto.materiaisHub ?? []).filter((m) => /diagn/i.test(m.nome));

  // Quem chega pelo "próximo passo" (#diagnostico) encontra a área aberta
  useEffect(() => {
    const abrirPeloEndereco = () => window.location.hash === "#diagnostico" && setAberto(true);
    abrirPeloEndereco();
    window.addEventListener("hashchange", abrirPeloEndereco);
    return () => window.removeEventListener("hashchange", abrirPeloEndereco);
  }, []);

  // Miniaturas das imagens de evidência
  const caminhos = d.evidencias.map((e) => e.caminho);
  const chave = caminhos.join("|");
  useEffect(() => {
    const faltam = caminhos.filter((c) => !urls[c]);
    if (!faltam.length) return;
    let ativo = true;
    void supabaseNavegador()
      .storage.from(BUCKET)
      .createSignedUrls(faltam, 3600)
      .then(({ data }) => {
        if (ativo && data) setUrls((u) => ({ ...u, ...Object.fromEntries(data.filter((x) => x.signedUrl).map((x) => [x.path!, x.signedUrl as string])) }));
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const situacao = enviadoNoHub
    ? { tom: "ok" as const, texto: `Enviado no HUB em ${formatarData(enviadoNoHub)}` }
    : arquivo
      ? { tom: "andamento" as const, texto: "Arquivo anexado" }
      : temTexto
        ? { tom: "andamento" as const, texto: "Em elaboração" }
        : { tom: naFaseDoDiagnostico ? ("atencao" as const) : ("neutro" as const), texto: naFaseDoDiagnostico ? "A elaborar" : "Ainda não escrito" };

  const gravar = (fn: (x: Diagnostico) => void, acao: string, detalhe?: string) =>
    alterar(
      (p) => {
        const novo = lerDiagnostico(p);
        fn(novo);
        const { texto: legado, ...sem } = novo;
        void legado;
        p.diagnostico = sem;
      },
      { acao, detalhe },
    );

  const baixarWord = async () => {
    if (!cliente) return;
    if (marcadores && !confirm(`O diagnóstico tem ${marcadores} ${marcadores === 1 ? "marcador" : "marcadores"} a completar ou confirmar. No Word, eles saem destacados em amarelo, com uma caixa "Pendências antes do envio" no começo da página 2.\n\nBaixar mesmo assim?`)) return;
    setGerando(true);
    setErro(null);
    try {
      const imagens = await baixarImagens(d.evidencias);
      const blob = await gerarDocxDiagnostico({ projeto, cliente, consultor }, hojeIso(), imagens);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const nome = (cliente.nomeFantasia || cliente.razaoSocial).replace(/[^\p{L}\p{N}]+/gu, "_");
      a.download = `Diagnostico_${nome}.docx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o diagnóstico.");
    } finally {
      setGerando(false);
    }
  };

  const anexar = async (f: File | undefined) => {
    if (!f) return;
    setErro(null);
    if (!TIPOS.includes(f.type) && !/\.(docx?|pdf)$/i.test(f.name)) return setErro("Envie o diagnóstico em Word (.docx) ou PDF.");
    if (f.size > 20 * 1024 * 1024) return setErro("O arquivo passa de 20 MB.");
    setEnviando("arquivo");
    try {
      const sb = supabaseNavegador();
      const seguro = f.name.replace(/[^\w.\-]+/g, "_").slice(-80) || "diagnostico";
      const caminho = `${projeto.empresa}/${projeto.id}/diagnostico/${crypto.randomUUID()}-${seguro}`;
      const tipo = f.type || (/\.pdf$/i.test(f.name) ? "application/pdf" : TIPOS[0]);
      const { error } = await sb.storage.from(BUCKET).upload(caminho, f, { contentType: tipo });
      if (error) throw error;
      const antigo = arquivo?.caminho;
      gravar((x) => void (x.arquivo = { caminho, nome: f.name, tipo, tamanho: f.size, enviadoEm: new Date().toISOString(), por: usuario.nome }), "Diagnóstico: arquivo anexado", f.name);
      if (antigo) await sb.storage.from(BUCKET).remove([antigo]);
    } catch (e) {
      setErro(traduzirErro(e, "Não foi possível enviar o arquivo."));
    } finally {
      setEnviando(null);
      if (entradaArquivo.current) entradaArquivo.current.value = "";
    }
  };

  const removerArquivo = async () => {
    if (!arquivo || !confirm(`Remover o arquivo “${arquivo.nome}” do diagnóstico?`)) return;
    await supabaseNavegador().storage.from(BUCKET).remove([arquivo.caminho]);
    gravar((x) => void (x.arquivo = null), "Diagnóstico: arquivo removido", arquivo.nome);
  };

  const adicionarImagem = async (f: File | undefined) => {
    if (!f) return;
    setErro(null);
    setEnviando("imagem");
    try {
      const ev = await subirEvidencia(projeto, "diagnostico", f, "Registro visual de reunião de qualificação da demanda com a responsável pela empresa");
      gravar((x) => void x.evidencias.push(ev), "Diagnóstico: imagem de evidência adicionada", f.name);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar a imagem.");
    } finally {
      setEnviando(null);
      if (entradaImagem.current) entradaImagem.current.value = "";
    }
  };

  const removerImagem = async (ev: Evidencia) => {
    if (!confirm("Tirar esta imagem das evidências do diagnóstico?")) return;
    // Só apaga o arquivo se ele foi enviado aqui; as imagens da conversa continuam guardadas lá
    if (ev.caminho.includes("/diagnostico/")) await supabaseNavegador().storage.from(BUCKET).remove([ev.caminho]);
    gravar((x) => void (x.evidencias = x.evidencias.filter((e) => e.id !== ev.id)), "Diagnóstico: imagem de evidência removida");
  };

  const salvarTexto = () => {
    if (!editando) return;
    gravar(
      (x) => {
        for (const s of secoesDoModelo) x[s.chave] = editando[s.chave].trim();
        x.atualizadoEm = hojeIso();
      },
      "Diagnóstico: texto editado à mão",
    );
    setEditando(null);
  };

  return (
    <Cartao className="scroll-mt-4 p-3 sm:p-5">
      <section id="diagnostico" aria-label="Diagnóstico" className="scroll-mt-4">
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls="diagnostico-conteudo"
          onClick={() => setAberto(!aberto)}
          className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[var(--radius-campo)] px-1 py-0.5 text-left"
        >
          <span className="flex items-center gap-2">
            <svg aria-hidden viewBox="0 0 20 20" className={`size-4 shrink-0 fill-none stroke-current stroke-2 transition-transform ${aberto ? "rotate-90" : ""}`}>
              <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[17px] font-bold">Diagnóstico</span>
          </span>
          <span className="flex items-center gap-3">
            {!aberto && (
              <span className="num text-[13px] text-tinta-2">
                {d.evidencias.length} {d.evidencias.length === 1 ? "imagem" : "imagens"}
                {arquivo ? " · arquivo final anexado" : ""}
              </span>
            )}
            <Status tom={situacao.tom}>{situacao.texto}</Status>
            <span className="text-[13px] font-semibold text-tinta-2">{aberto ? "Reduzir" : "Expandir"}</span>
          </span>
        </button>

        <div id="diagnostico-conteudo" hidden={!aberto} className="mt-4 space-y-4">
          <div className="rounded-[var(--radius-campo)] border border-linha p-3.5">
            <p className="text-[13px] font-bold uppercase tracking-wide text-tinta-2">Texto e Word no modelo do SEBRAE</p>
            {temTexto ? (
              <>
                <p className="num mt-1 text-[14px] text-tinta">
                  Texto atualizado em {d.atualizadoEm ? formatarData(d.atualizadoEm) : "data não registrada"} · {palavras(d)} palavras
                  {marcadores > 0 && <span className="text-laranja"> · {marcadores} {marcadores === 1 ? "marcador" : "marcadores"} a completar</span>}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Botao tamanho="pequeno" onClick={() => void baixarWord()} disabled={gerando}>
                    {gerando ? "Gerando…" : "Baixar diagnóstico em Word"}
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" aria-expanded={verTexto} onClick={() => setVerTexto(!verTexto)}>
                    {verTexto ? "Ocultar o texto" : "Ver o texto"}
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => setEditando({ anamnese: d.anamnese, analise: d.analise, parecer: d.parecer })}>
                    Editar o texto
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={aoDesenvolver}>
                    Pedir ajustes à IA
                  </Botao>
                </div>
                {verTexto && !editando && (
                  <div className="mt-3 max-h-[28rem] space-y-3 overflow-auto rounded-[var(--radius-campo)] bg-pedra/60 p-3 text-[14px] leading-relaxed text-tinta" aria-label="Texto do diagnóstico">
                    {secoesDoModelo.map((s) => (
                      <div key={s.chave}>
                        <p className="font-semibold">
                          {s.numero}. {s.titulo}
                        </p>
                        <p className="whitespace-pre-line">{d[s.chave].trim() || "(em branco)"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="mt-1 text-[14px] text-tinta-2">
                  Ainda não há texto. A IA só escreve o diagnóstico quando tem tudo o que o modelo pede; até lá, ela vai perguntando o que falta.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Botao tamanho="pequeno" onClick={aoDesenvolver}>
                    Escrever o diagnóstico com a IA
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => setEditando({ anamnese: "", analise: "", parecer: "" })}>
                    Escrever à mão
                  </Botao>
                </div>
              </>
            )}
            {faltas.length > 0 && (
              <div className="mt-3 rounded-[var(--radius-campo)] bg-pedra/60 p-3 text-[13px] text-tinta-2">
                <p className="font-semibold text-tinta">O que ainda falta para o diagnóstico ficar completo</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {faltas.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {editando && (
              <div className="mt-3 space-y-3">
                {secoesDoModelo.map((s) => (
                  <Campo key={s.chave} rotulo={`${s.numero}. ${s.titulo}`}>
                    <textarea className="campo min-h-40" value={editando[s.chave]} onChange={(e) => setEditando({ ...editando, [s.chave]: e.target.value })} />
                  </Campo>
                ))}
                <p className="text-[12px] text-tinta-2">Parágrafos separados por uma linha em branco. Na investigação, cada necessidade começa com “1. Título da necessidade. Texto…”.</p>
                <div className="flex gap-2">
                  <Botao tamanho="pequeno" onClick={salvarTexto}>
                    Salvar o texto
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => setEditando(null)}>
                    Cancelar
                  </Botao>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[var(--radius-campo)] border border-linha p-3.5" aria-label="Evidências do diagnóstico" role="group">
            <p className="text-[13px] font-bold uppercase tracking-wide text-tinta-2">4. Evidências da reunião</p>
            {d.evidencias.length === 0 ? (
              <p className="mt-1 text-[14px] text-tinta-2">Nenhuma imagem. Mande na conversa a foto ou o print da reunião de diagnóstico, ou adicione aqui.</p>
            ) : (
              <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                {d.evidencias.map((ev, i) => (
                  <li key={ev.id} className="rounded-[var(--radius-campo)] border border-linha p-2.5">
                    {urls[ev.caminho] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urls[ev.caminho]} alt={ev.legenda} className="mx-auto h-40 w-full rounded-md bg-pedra object-contain" />
                    ) : (
                      <div className="h-40 w-full animate-pulse rounded-md bg-linha" />
                    )}
                    <label className="mt-2 block text-[12px] font-semibold text-tinta-2">
                      Evidência 0{i + 1} – legenda
                      <input
                        key={ev.legenda}
                        className="campo mt-1 text-[13px]"
                        defaultValue={ev.legenda}
                        onBlur={(e) => e.target.value.trim() !== ev.legenda && gravar((x) => void (x.evidencias.find((v) => v.id === ev.id)!.legenda = e.target.value.trim() || ev.legenda), "Diagnóstico: legenda da evidência alterada")}
                      />
                    </label>
                    <Botao tamanho="pequeno" variante="fantasma" className="mt-1 hover:!text-vermelho" onClick={() => void removerImagem(ev)}>
                      Tirar da evidência
                    </Botao>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Botao tamanho="pequeno" variante="secundario" onClick={() => entradaImagem.current?.click()} disabled={enviando === "imagem"}>
                {enviando === "imagem" ? "Enviando…" : "Adicionar imagem"}
              </Botao>
              <input ref={entradaImagem} type="file" aria-label="Imagem da evidência do diagnóstico" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => void adicionarImagem(e.target.files?.[0])} />
            </div>
          </div>

          <div className="rounded-[var(--radius-campo)] border border-linha p-3.5">
            <p className="text-[13px] font-bold uppercase tracking-wide text-tinta-2">Arquivo final do diagnóstico</p>
            {arquivo ? (
              <>
                <p className="mt-1 break-words text-[14px] font-semibold text-tinta">{arquivo.nome}</p>
                <p className="num text-[13px] text-tinta-2">
                  {tamanho(arquivo.tamanho)} · anexado em {formatarData(arquivo.enviadoEm.slice(0, 10))} por {arquivo.por}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Botao tamanho="pequeno" onClick={() => void abrirArquivo(arquivo.caminho, arquivo.nome)}>
                    Abrir o arquivo
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => entradaArquivo.current?.click()} disabled={enviando === "arquivo"}>
                    {enviando === "arquivo" ? "Enviando…" : "Trocar o arquivo"}
                  </Botao>
                  <Botao tamanho="pequeno" variante="fantasma" onClick={() => void removerArquivo()} className="hover:!text-vermelho">
                    Remover
                  </Botao>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-[14px] text-tinta-2">Nenhum arquivo anexado. Anexe aqui a versão final, em Word ou PDF, a mesma que foi enviada no HUB.</p>
                <div className="mt-3">
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => entradaArquivo.current?.click()} disabled={enviando === "arquivo"}>
                    {enviando === "arquivo" ? "Enviando…" : "Anexar o arquivo do diagnóstico"}
                  </Botao>
                </div>
              </>
            )}
            <input ref={entradaArquivo} type="file" aria-label="Arquivo do diagnóstico" accept=".docx,.doc,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => void anexar(e.target.files?.[0])} />
            {doHub.length > 0 && <p className="mt-3 text-[13px] text-tinta-2">Do HUB: {doHub.map((m) => m.nome).join("; ")} (em Dados do projeto, Materiais do HUB).</p>}
          </div>
        </div>
        {erro && (
          <p role="alert" className="mt-3 text-[13px] text-vermelho">
            {erro}
          </p>
        )}
      </section>
    </Cartao>
  );
}
