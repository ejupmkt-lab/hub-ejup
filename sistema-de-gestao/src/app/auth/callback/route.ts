import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";

// Destino dos links enviados por e-mail (confirmação de conta e recuperação de senha)
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const codigo = url.searchParams.get("code");
  const proximo = url.searchParams.get("next") ?? "/";
  // Só caminhos internos ("//site" e "/\\site" levariam para fora)
  const destino = proximo.startsWith("/") && !proximo.startsWith("//") && !proximo.startsWith("/\\") ? proximo : "/";

  if (codigo) {
    const supabase = await supabaseServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(destino, url.origin));
  }
  return NextResponse.redirect(new URL("/login?erro=link", url.origin));
}
