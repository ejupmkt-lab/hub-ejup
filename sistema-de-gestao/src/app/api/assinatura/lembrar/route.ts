import { NextResponse } from "next/server";
import { acessarEtapa } from "@/lib/assinatura/acesso";
import { consultarDocumento, ErroAutentique, reenviar } from "@/lib/assinatura/autentique";

// Reenvia o pedido de assinatura a quem ainda não assinou
export async function POST(req: Request) {
  const pedido = (await req.json().catch(() => null)) as { projetoId?: string; ordem?: number } | null;
  const acesso = await acessarEtapa(pedido?.projetoId, Number(pedido?.ordem));
  if (acesso.erro) return acesso.erro;
  const doc = acesso.etapa.assinaturaDigital;
  if (!doc) return NextResponse.json({ erro: "Esta etapa não foi enviada para assinatura online." }, { status: 404 });
  try {
    const faltam = (await consultarDocumento(doc.documentoId)).signatarios.filter((s) => !s.assinouEm && !s.recusouEm);
    if (!faltam.length) return NextResponse.json({ lembrados: [] });
    await reenviar(faltam.map((s) => s.publicId));
    return NextResponse.json({ lembrados: faltam.map((s) => s.nome || s.email) });
  } catch (e) {
    const msg = e instanceof ErroAutentique && /too_many_resent/.test(e.message) ? "O pedido já foi reenviado há pouco. Espere um pouco antes de lembrar de novo." : e instanceof ErroAutentique ? e.message : "Não foi possível falar com a Autentique.";
    return NextResponse.json({ erro: msg }, { status: 502 });
  }
}
