"use client";

import { traduzirErro } from "@/lib/erros";
import { useEffect, useRef, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import type { Etapa, Evidencia, Projeto } from "@/lib/dados/tipos";
import { Botao } from "@/components/ui";

const BUCKET = "evidencias";
const ACEITOS = ["image/png", "image/jpeg", "image/webp"];

async function dimensoes(arquivo: File) {
  const bmp = await createImageBitmap(arquivo);
  const d = { largura: bmp.width, altura: bmp.height };
  bmp.close();
  return d;
}

// Baixa as imagens da etapa para montar o relatório
export async function baixarImagens(evidencias: Evidencia[]) {
  const sb = supabaseNavegador();
  return Promise.all(
    evidencias.map(async (ev) => {
      const { data, error } = await sb.storage.from(BUCKET).download(ev.caminho);
      if (error || !data) throw new Error(`Não foi possível baixar a imagem “${ev.legenda || ev.caminho}”.`);
      return { dados: await data.arrayBuffer(), tipo: ev.tipo, legenda: ev.legenda || "Evidência", largura: ev.largura, altura: ev.altura };
    }),
  );
}

export function Evidencias({
  projeto,
  etapa,
  alterarEtapa,
}: {
  projeto: Projeto;
  etapa: Etapa;
  alterarEtapa: (fn: (e: Etapa) => void, evento?: { acao: string; detalhe?: string }) => void;
}) {
  const lista = etapa.evidencias ?? [];
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  // Endereços temporários para as miniaturas
  const caminhos = lista.map((e) => e.caminho).join("|");
  useEffect(() => {
    const faltam = lista.filter((e) => !urls[e.caminho]).map((e) => e.caminho);
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
  }, [caminhos]);

  const enviar = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    setErro(null);
    const sb = supabaseNavegador();
    for (const arquivo of Array.from(arquivos)) {
      if (!ACEITOS.includes(arquivo.type)) {
        setErro(`“${arquivo.name}” não é PNG, JPG ou WEBP.`);
        continue;
      }
      if (arquivo.size > 10 * 1024 * 1024) {
        setErro(`“${arquivo.name}” passa de 10 MB.`);
        continue;
      }
      setEnviando((n) => n + 1);
      try {
        const { largura, altura } = await dimensoes(arquivo);
        const ext = arquivo.type === "image/png" ? "png" : arquivo.type === "image/webp" ? "webp" : "jpg";
        const caminho = `${projeto.empresa}/${projeto.id}/${etapa.ordem}/${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(caminho, arquivo, { contentType: arquivo.type });
        if (error) throw error;
        const legenda = arquivo.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
        alterarEtapa(
          (e) => void (e.evidencias ??= []).push({ id: crypto.randomUUID(), caminho, legenda, largura, altura, tipo: arquivo.type }),
          { acao: `Etapa ${String(etapa.ordem).padStart(2, "0")}: evidência adicionada` },
        );
      } catch (e) {
        setErro(`Falha ao enviar “${arquivo.name}”. ${traduzirErro(e, "Tente de novo.")}`);
      } finally {
        setEnviando((n) => n - 1);
      }
    }
    if (entrada.current) entrada.current.value = "";
  };

  const remover = async (ev: Evidencia) => {
    if (!confirm("Remover esta imagem do relatório?")) return;
    await supabaseNavegador().storage.from(BUCKET).remove([ev.caminho]);
    alterarEtapa((e) => void (e.evidencias = (e.evidencias ?? []).filter((x) => x.id !== ev.id)), {
      acao: `Etapa ${String(etapa.ordem).padStart(2, "0")}: evidência removida`,
    });
  };

  const mover = (i: number, d: -1 | 1) =>
    alterarEtapa((e) => {
      const l = e.evidencias ?? [];
      [l[i], l[i + d]] = [l[i + d], l[i]];
    });

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-serif text-xl">Imagens de evidência</h3>
        <span className="text-[13px] text-tinta-2">Entram no relatório como Figura 1, Figura 2…, depois do texto acima.</span>
      </div>

      {lista.length > 0 && (
        <ol className="mb-4 space-y-3">
          {lista.map((ev, i) => (
            <li key={ev.id} className="grid grid-cols-[6rem_1fr] gap-4 rounded-[var(--radius-bloco)] border border-linha bg-folha p-3 sm:grid-cols-[8rem_1fr_auto]">
              <div className="flex h-20 items-center justify-center overflow-hidden rounded-[var(--radius-campo)] bg-pedra">
                {urls[ev.caminho] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[ev.caminho]} alt={ev.legenda} className="max-h-20 max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-tinta-2">Carregando</span>
                )}
              </div>
              <label className="block min-w-0">
                <span className="mb-1 block text-[13px] text-tinta-2">Legenda da Figura {i + 1}</span>
                <input
                  className="campo"
                  value={ev.legenda}
                  placeholder="Ex.: Reunião de levantamento com o responsável interno"
                  onChange={(e) => alterarEtapa((x) => void ((x.evidencias ?? [])[i].legenda = e.target.value))}
                />
              </label>
              <div className="col-span-2 flex items-center gap-3 text-[13px] sm:col-span-1 sm:flex-col sm:items-end sm:justify-center">
                <span className="flex gap-1">
                  <button disabled={i === 0} onClick={() => mover(i, -1)} className="rounded px-2 py-1 text-tinta-2 hover:bg-pedra disabled:opacity-30" aria-label="Subir">
                    ↑
                  </button>
                  <button
                    disabled={i === lista.length - 1}
                    onClick={() => mover(i, 1)}
                    className="rounded px-2 py-1 text-tinta-2 hover:bg-pedra disabled:opacity-30"
                    aria-label="Descer"
                  >
                    ↓
                  </button>
                </span>
                <button onClick={() => remover(ev)} className="text-tinta-2 hover:text-vinho">
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void enviar(e.dataTransfer.files);
        }}
        className="flex flex-wrap items-center gap-4 rounded-[var(--radius-bloco)] border border-dashed border-linha-forte px-5 py-4"
      >
        <Botao variante="secundario" onClick={() => entrada.current?.click()} disabled={enviando > 0}>
          {enviando > 0 ? "Enviando…" : "Adicionar imagens"}
        </Botao>
        <span className="text-[13px] text-tinta-2">ou arraste prints e fotos para cá. PNG, JPG ou WEBP, até 10 MB.</span>
        <input ref={entrada} type="file" accept={ACEITOS.join(",")} multiple hidden onChange={(e) => enviar(e.target.files)} />
      </div>
      {erro && <p className="mt-2 text-[13px] text-vinho">{erro}</p>}
    </section>
  );
}
