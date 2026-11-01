import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

// Quem usa as rotas do servidor (IA, CNPJ, assinatura) precisa estar logado E ter perfil no Blimp, ou seja, ter sido
// autorizado pelo administrador do grupo. Uma conta sem perfil não acessa nada (e não gasta a cota da IA nem das consultas).
export async function exigirPerfil(sb: SupabaseClient, user: User | null) {
  if (!user) return NextResponse.json({ erro: "Sessão expirada. Entre de novo." }, { status: 401 });
  const { data } = await sb.from("perfis").select("id").eq("id", user.id).maybeSingle();
  if (!data) return NextResponse.json({ erro: "Este usuário não tem acesso ao Blimp. Peça ao administrador do grupo para liberar." }, { status: 403 });
  return null;
}
