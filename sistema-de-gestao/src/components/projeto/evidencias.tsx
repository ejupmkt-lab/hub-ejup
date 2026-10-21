"use client";

import { traduzirErro } from "@/lib/erros";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import type { Evidencia, Projeto } from "@/lib/dados/tipos";

const BUCKET = "evidencias";
const ACEITOS = ["image/png", "image/jpeg", "image/webp"];

async function dimensoes(arquivo: File) {
  const bmp = await createImageBitmap(arquivo);
  const d = { largura: bmp.width, altura: bmp.height };
  bmp.close();
  return d;
}

// Envia uma imagem para o armazenamento e devolve a evidência pronta para a etapa
export async function subirEvidencia(projeto: Projeto, ordem: number, arquivo: File, legenda?: string): Promise<Evidencia> {
  if (!ACEITOS.includes(arquivo.type)) throw new Error(`“${arquivo.name}” não é PNG, JPG ou WEBP.`);
  if (arquivo.size > 10 * 1024 * 1024) throw new Error(`“${arquivo.name}” passa de 10 MB.`);
  const { largura, altura } = await dimensoes(arquivo);
  const ext = arquivo.type === "image/png" ? "png" : arquivo.type === "image/webp" ? "webp" : "jpg";
  const caminho = `${projeto.empresa}/${projeto.id}/${ordem}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseNavegador().storage.from(BUCKET).upload(caminho, arquivo, { contentType: arquivo.type });
  if (error) throw new Error(`Falha ao enviar “${arquivo.name}”. ${traduzirErro(error, "Tente de novo.")}`);
  return {
    id: crypto.randomUUID(),
    caminho,
    legenda: legenda ?? arquivo.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
    largura,
    altura,
    tipo: arquivo.type,
  };
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
