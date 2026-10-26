import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";
import type { Etapa, Projeto } from "@/lib/dados/tipos";
import { configurada } from "./autentique";

// Quem pede precisa estar logado e enxergar o projeto (as regras de acesso do
// banco valem aqui). O documento da Autentique vem sempre do projeto, nunca do pedido.
export async function acessarEtapa(projetoId: string | undefined, ordem: number) {
  if (!configurada())
    return {
      erro: NextResponse.json(
        { erro: "A assinatura online ainda não foi ativada: falta cadastrar a chave da Autentique (AUTENTIQUE_TOKEN) na Vercel." },
        { status: 503 },
      ),
    };
  const sb = await supabaseServidor();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { erro: NextResponse.json({ erro: "Sessão expirada. Entre de novo." }, { status: 401 }) };
  if (!projetoId || !Number.isInteger(ordem)) return { erro: NextResponse.json({ erro: "Pedido inválido." }, { status: 400 }) };
  const { data } = await sb.from("projetos").select("dados").eq("id", projetoId).maybeSingle();
  const projeto = data?.dados as Projeto | undefined;
  const etapa = projeto?.etapas.find((e: Etapa) => e.ordem === ordem);
  if (!projeto || !etapa) return { erro: NextResponse.json({ erro: "Projeto ou etapa não encontrados." }, { status: 404 }) };
  return { projeto, etapa };
}
