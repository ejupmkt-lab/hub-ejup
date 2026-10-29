"use client";

import { useRef, useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { traduzirErro } from "@/lib/erros";
import { formatarData, hojeIso } from "@/lib/datas";
import { hubDoProjeto, passoHubDoProjeto } from "@/lib/fase";
import { gerarDocxDiagnostico, MARCADOR_NO_WORD } from "@/lib/relatorio/docx";
import { Botao, Cartao, Status } from "@/components/ui";
import { useProjeto } from "./use-projeto";

const BUCKET = "evidencias";
const TIPOS = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "application/pdf"];
const tamanho = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const contarMarcadores = (t: string) => (t.match(MARCADOR_NO_WORD) ?? []).length;

async function abrirArquivo(caminho: string, nome: string) {
  const { data, error } = await supabaseNavegador().storage.from(BUCKET).createSignedUrl(caminho, 300, { download: nome });
  if (error || !data) return alert("Não foi possível abrir o arquivo.");
  window.location.href = data.signedUrl;
}

// Diagnóstico do projeto (fase 2 do HUB), nas Entregas, antes dos relatórios: o texto escrito com a IA, o Word gerado dele e o
// arquivo final (a versão enviada no HUB), para o fluxo de entregas do projeto ficar registrado do começo ao fim.
export function DiagnosticoDoProjeto({ projeto, aoDesenvolver }: { projeto: Projeto; aoDesenvolver: () => void }) {
  const { alterar, cliente, consultor, usuario } = useProjeto();
  const entrada = useRef<HTMLInputElement>(null);
  const [gerando, setGerando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [verTexto, setVerTexto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const d = projeto.diagnostico;
  const texto = (d?.texto ?? "").trim();
  const arquivo = d?.arquivo ?? null;
  const marcadores = contarMarcadores(texto);
  const enviadoNoHub = hubDoProjeto(projeto).datas.diagnostico_enviado ?? null;
  const naFaseDoDiagnostico = passoHubDoProjeto(projeto) === "diagnostico";
  const doHub = (projeto.materiaisHub ?? []).filter((m) => /diagn/i.test(m.nome));

  const situacao = enviadoNoHub
    ? { tom: "ok" as const, texto: `Enviado no HUB em ${formatarData(enviadoNoHub)}` }
    : arquivo
      ? { tom: "andamento" as const, texto: "Arquivo anexado" }
      : texto
        ? { tom: "andamento" as const, texto: "Em elaboração" }
        : { tom: naFaseDoDiagnostico ? ("atencao" as const) : ("neutro" as const), texto: naFaseDoDiagnostico ? "A elaborar" : "Ainda não escrito" };

  const baixarWord = async () => {
    if (!cliente) return;
    if (marcadores && !confirm(`O diagnóstico tem ${marcadores} ${marcadores === 1 ? "marcador" : "marcadores"} a completar ou confirmar. No Word, eles saem destacados em amarelo, com uma caixa "Pendências antes do envio" logo depois da capa.\n\nBaixar mesmo assim?`)) return;
    setGerando(true);
    setErro(null);
    try {
      const blob = await gerarDocxDiagnostico({ projeto, cliente, consultor }, hojeIso());
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
    setEnviando(true);
    try {
      const sb = supabaseNavegador();
      const seguro = f.name.replace(/[^\w.\-]+/g, "_").slice(-80) || "diagnostico";
      const caminho = `${projeto.empresa}/${projeto.id}/diagnostico/${crypto.randomUUID()}-${seguro}`;
      const tipo = f.type || (/\.pdf$/i.test(f.name) ? "application/pdf" : TIPOS[0]);
      const { error } = await sb.storage.from(BUCKET).upload(caminho, f, { contentType: tipo });
      if (error) throw error;
      const antigo = arquivo?.caminho;
      alterar(
        (p) => {
          p.diagnostico = { texto: p.diagnostico?.texto ?? "", atualizadoEm: p.diagnostico?.atualizadoEm ?? null, arquivo: { caminho, nome: f.name, tipo, tamanho: f.size, enviadoEm: new Date().toISOString(), por: usuario.nome } };
        },
        { acao: "Diagnóstico: arquivo anexado", detalhe: f.name },
      );
      if (antigo) await sb.storage.from(BUCKET).remove([antigo]);
    } catch (e) {
      setErro(traduzirErro(e, "Não foi possível enviar o arquivo."));
    } finally {
      setEnviando(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  const remover = async () => {
    if (!arquivo || !confirm(`Remover o arquivo “${arquivo.nome}” do diagnóstico?`)) return;
    await supabaseNavegador().storage.from(BUCKET).remove([arquivo.caminho]);
    alterar(
      (p) => void (p.diagnostico && (p.diagnostico.arquivo = null)),
      { acao: "Diagnóstico: arquivo removido", detalhe: arquivo.nome },
    );
  };

  const salvarTexto = () => {
    const novo = (editando ?? "").trim();
    if (novo !== texto)
      alterar(
        (p) => {
          p.diagnostico = { arquivo: p.diagnostico?.arquivo ?? null, texto: novo, atualizadoEm: hojeIso() };
        },
        { acao: "Diagnóstico: texto editado à mão" },
      );
    setEditando(null);
  };

  return (
    <Cartao className="scroll-mt-4 p-3 sm:p-5">
      <section id="diagnostico" aria-label="Diagnóstico" className="scroll-mt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 pb-1">
          <h2 className="text-[17px] font-bold">Diagnóstico</h2>
          <Status tom={situacao.tom}>{situacao.texto}</Status>
        </div>
        <p className="px-1 pb-4 text-[13px] text-tinta-2">
          Primeira entrega do projeto, antes dos relatórios das etapas. A IA escreve o diagnóstico conforme você conta o que o cliente pediu e o que mapeou; daqui
          você baixa o Word e guarda a versão final enviada no HUB.
        </p>

        <div className="space-y-4">
          <div className="rounded-[var(--radius-campo)] border border-linha p-3.5">
            <p className="text-[13px] font-bold uppercase tracking-wide text-tinta-2">Texto e arquivo em Word</p>
            {texto ? (
              <>
                <p className="num mt-1 text-[14px] text-tinta">
                  Texto atualizado em {d?.atualizadoEm ? formatarData(d.atualizadoEm) : "data não registrada"} · {texto.split(/\s+/).length} palavras
                  {marcadores > 0 && <span className="text-laranja"> · {marcadores} {marcadores === 1 ? "marcador" : "marcadores"} a completar</span>}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Botao tamanho="pequeno" onClick={() => void baixarWord()} disabled={gerando}>
                    {gerando ? "Gerando…" : "Baixar diagnóstico em Word"}
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" aria-expanded={verTexto} onClick={() => setVerTexto(!verTexto)}>
                    {verTexto ? "Ocultar o texto" : "Ver o texto"}
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => setEditando(texto)}>
                    Editar o texto
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={aoDesenvolver}>
                    Pedir ajustes à IA
                  </Botao>
                </div>
                {verTexto && !editando && (
                  <div className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-line rounded-[var(--radius-campo)] bg-pedra/60 p-3 text-[14px] leading-relaxed text-tinta" aria-label="Texto do diagnóstico">
                    {texto}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="mt-1 text-[14px] text-tinta-2">
                  Ainda não há texto. No Desenvolvimento, conte à IA o que o cliente pediu e o que você mapeou: ela escreve o diagnóstico e o Word aparece aqui.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Botao tamanho="pequeno" onClick={aoDesenvolver}>
                    Escrever o diagnóstico com a IA
                  </Botao>
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => setEditando("")}>
                    Escrever à mão
                  </Botao>
                </div>
              </>
            )}
            {editando !== null && (
              <div className="mt-3 space-y-2">
                <label className="block text-[13px] font-semibold text-tinta">
                  Texto do diagnóstico
                  <textarea className="campo mt-1.5 min-h-64" value={editando} onChange={(e) => setEditando(e.target.value)} />
                </label>
                <p className="text-[12px] text-tinta-2">Parágrafos separados por uma linha em branco; subtítulos em linha própria começando com “## ”.</p>
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
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => entrada.current?.click()} disabled={enviando}>
                    {enviando ? "Enviando…" : "Trocar o arquivo"}
                  </Botao>
                  <Botao tamanho="pequeno" variante="fantasma" onClick={() => void remover()} className="hover:!text-vermelho">
                    Remover
                  </Botao>
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-[14px] text-tinta-2">Nenhum arquivo anexado. Anexe aqui a versão final, em Word ou PDF, a mesma que foi enviada no HUB.</p>
                <div className="mt-3">
                  <Botao tamanho="pequeno" variante="secundario" onClick={() => entrada.current?.click()} disabled={enviando}>
                    {enviando ? "Enviando…" : "Anexar o arquivo do diagnóstico"}
                  </Botao>
                </div>
              </>
            )}
            <input ref={entrada} type="file" aria-label="Arquivo do diagnóstico" accept=".docx,.doc,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => void anexar(e.target.files?.[0])} />
            {doHub.length > 0 && (
              <p className="mt-3 text-[13px] text-tinta-2">
                Do HUB: {doHub.map((m) => m.nome).join("; ")} (em Dados do projeto, Materiais do HUB).
              </p>
            )}
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
