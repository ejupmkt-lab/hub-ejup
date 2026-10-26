import { NextResponse } from "next/server";
import { acessarEtapa } from "@/lib/assinatura/acesso";
import { consultarDocumento, ErroAutentique, estadoDoDocumento } from "@/lib/assinatura/autentique";

// Situação das assinaturas de uma etapa, lida na Autentique
export async function POST(req: Request) {
  const pedido = (await req.json().catch(() => null)) as { projetoId?: string; ordem?: number } | null;
  const acesso = await acessarEtapa(pedido?.projetoId, Number(pedido?.ordem));
  if (acesso.erro) return acesso.erro;
  const doc = acesso.etapa.assinaturaDigital;
  if (!doc) return NextResponse.json({ erro: "Esta etapa não foi enviada para assinatura online." }, { status: 404 });
  try {
    const d = await consultarDocumento(doc.documentoId);
    return NextResponse.json({ estado: estadoDoDocumento(d.signatarios), signatarios: d.signatarios, arquivoPronto: !!d.arquivoAssinado });
  } catch (e) {
    return NextResponse.json({ erro: e instanceof ErroAutentique ? e.message : "Não foi possível falar com a Autentique." }, { status: 502 });
  }
}
