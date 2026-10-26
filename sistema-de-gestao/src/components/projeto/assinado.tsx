"use client";

import { traduzirErro } from "@/lib/erros";
import { useRef, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useUsuario } from "@/lib/dados/store";
import { hojeIso } from "@/lib/datas";
import { doisDigitos } from "@/lib/rotulos";
import type { Etapa, Projeto } from "@/lib/dados/tipos";
import { Botao } from "@/components/ui";

const BUCKET = "evidencias";

export async function abrirAssinado(caminho: string, nome: string) {
  const { data, error } = await supabaseNavegador().storage.from(BUCKET).createSignedUrl(caminho, 300, { download: nome });
  if (error || !data) return alert("Não foi possível abrir o PDF assinado.");
  window.location.href = data.signedUrl;
}

// Guarda o PDF final, assinado no gov.br. Ao enviar, as datas de assinatura
// que estiverem em branco recebem a data de hoje.
export function RelatorioAssinado({
  projeto,
  etapa,
  alterarEtapa,
  compacto = false,
}: {
  projeto: Projeto;
  etapa: Etapa;
  alterarEtapa: (fn: (e: Etapa) => void, evento?: { acao: string; detalhe?: string }) => void;
  compacto?: boolean; // numa linha, sem título (nas Entregas)
}) {
  const usuario = useUsuario();
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const atual = etapa.relatorioAssinado;
  const rotuloEtapa = `Etapa ${doisDigitos(etapa.ordem)}`;

  const enviar = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setErro(null);
    if (arquivo.type !== "application/pdf") return setErro("Envie o relatório em PDF.");
    if (arquivo.size > 20 * 1024 * 1024) return setErro("O PDF passa de 20 MB.");
    setEnviando(true);
    try {
      const sb = supabaseNavegador();
      const caminho = `${projeto.empresa}/${projeto.id}/${etapa.ordem}/assinado-${crypto.randomUUID()}.pdf`;
      const { error } = await sb.storage.from(BUCKET).upload(caminho, arquivo, { contentType: "application/pdf" });
      if (error) throw error;
      if (atual) await sb.storage.from(BUCKET).remove([atual.caminho]);
      const hoje = hojeIso();
      alterarEtapa(
        (e) => {
          e.relatorioAssinado = { caminho, nome: arquivo.name, enviadoEm: new Date().toISOString(), por: usuario.nome };
          e.assinaturaConsultor ??= hoje;
          e.assinaturaCliente ??= hoje;
        },
        { acao: `${rotuloEtapa}: PDF assinado anexado`, detalhe: arquivo.name },
      );
    } catch (e) {
      setErro(`Falha ao enviar o PDF. ${traduzirErro(e, "Tente de novo.")}`);
    } finally {
      setEnviando(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  const remover = async () => {
    if (!atual || !confirm("Remover o PDF assinado desta etapa?")) return;
    await supabaseNavegador().storage.from(BUCKET).remove([atual.caminho]);
    alterarEtapa((e) => void (e.relatorioAssinado = null), { acao: `${rotuloEtapa}: PDF assinado removido` });
  };

  return (
    <section>
      {!compacto && (
        <>
          <h3 className="mb-1 text-lg font-semibold">PDF assinado</h3>
          <p className="mb-4 text-[15px] text-tinta-2">
            Depois de assinar no gov.br, guarde aqui o PDF final. Fica arquivado com o projeto e as datas de assinatura em branco são preenchidas com a de hoje.
          </p>
        </>
      )}
      {atual ? (
        <div
          className={`flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-campo)] border border-linha bg-folha ${compacto ? "px-3 py-2.5" : "px-4 py-4 shadow-[var(--shadow-cartao)] sm:px-5"}`}
        >
          <span className="min-w-0">
            <button onClick={() => abrirAssinado(atual.caminho, atual.nome)} className="block truncate text-left text-[15px] text-azul underline-offset-4 hover:underline">
              {atual.nome}
            </button>
            <span className="num block text-[13px] text-tinta-2">
              Anexado em {new Date(atual.enviadoEm).toLocaleDateString("pt-BR")} por {atual.por}
            </span>
          </span>
          <span className="flex gap-4 text-[13px]">
            <button onClick={() => entrada.current?.click()} disabled={enviando} className="text-tinta-2 hover:text-tinta">
              {enviando ? "Enviando…" : "Substituir"}
            </button>
            <button onClick={remover} className="text-tinta-2 hover:text-vermelho">
              Remover
            </button>
          </span>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void enviar(e.dataTransfer.files[0]);
          }}
          className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-campo)] border border-dashed border-linha-forte ${compacto ? "px-3 py-2.5" : "px-5 py-4"}`}
        >
          <Botao variante="secundario" tamanho={compacto ? "pequeno" : "normal"} onClick={() => entrada.current?.click()} disabled={enviando}>
            {enviando ? "Enviando…" : "Anexar PDF assinado"}
          </Botao>
          <span className="text-[13px] text-tinta-2">ou arraste o arquivo para cá. Até 20 MB.</span>
        </div>
      )}
      <input ref={entrada} type="file" accept="application/pdf" hidden onChange={(e) => enviar(e.target.files?.[0])} />
      {erro && <p className="mt-2 text-[13px] text-vermelho">{erro}</p>}
    </section>
  );
}
