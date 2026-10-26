import { NextResponse } from "next/server";
import { acessarEtapa } from "@/lib/assinatura/acesso";
import { baixarAssinado, consultarDocumento, ErroAutentique } from "@/lib/assinatura/autentique";

// PDF assinado, quando todos assinaram. O navegador guarda no projeto.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const acesso = await acessarEtapa(u.searchParams.get("projetoId") ?? undefined, Number(u.searchParams.get("ordem")));
  if (acesso.erro) return acesso.erro;
  const doc = acesso.etapa.assinaturaDigital;
  if (!doc) return NextResponse.json({ erro: "Esta etapa não foi enviada para assinatura online." }, { status: 404 });
  try {
    const d = await consultarDocumento(doc.documentoId);
    if (!d.arquivoAssinado) return NextResponse.json({ erro: "O PDF assinado ainda não está pronto." }, { status: 409 });
    return new NextResponse(await baixarAssinado(d.arquivoAssinado), { headers: { "Content-Type": "application/pdf" } });
  } catch (e) {
    return NextResponse.json({ erro: e instanceof ErroAutentique ? e.message : "Não foi possível falar com a Autentique." }, { status: 502 });
  }
}
