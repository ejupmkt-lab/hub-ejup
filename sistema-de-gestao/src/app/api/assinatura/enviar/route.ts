import { NextResponse } from "next/server";
import { acessarEtapa } from "@/lib/assinatura/acesso";
import { criarDocumento, ErroAutentique } from "@/lib/assinatura/autentique";
import { doisDigitos } from "@/lib/rotulos";

// Manda o PDF do relatório para a Autentique e convida os signatários. O
// navegador guarda o resultado na etapa.
// A Vercel aceita até 4,5 MB por pedido.
const LIMITE = 4 * 1024 * 1024;
const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const ordem = Number(form?.get("ordem"));
  const acesso = await acessarEtapa(String(form?.get("projetoId") ?? ""), ordem);
  if (acesso.erro) return acesso.erro;
  const { projeto, etapa } = acesso;

  const pdf = form?.get("pdf");
  if (!(pdf instanceof Blob) || pdf.type !== "application/pdf") return NextResponse.json({ erro: "Envie o relatório em PDF." }, { status: 400 });
  if (pdf.size > LIMITE) return NextResponse.json({ erro: "O PDF passa de 4 MB. Reduza as imagens e tente de novo." }, { status: 400 });

  // Já enviado e ainda em andamento: um segundo pedido criaria outro documento (e gastaria outra cota)
  if (etapa.assinaturaDigital && etapa.assinaturaDigital.estado !== "recusado")
    return NextResponse.json({ erro: "Esta etapa já foi enviada para assinatura. Confira as assinaturas ou retire o pedido antes de enviar de novo." }, { status: 409 });

  type Pessoa = { nome: string; email: string; papel: "consultor" | "cliente" };
  let signatarios: Pessoa[] = [];
  try {
    const lido: unknown = JSON.parse(String(form?.get("signatarios") ?? "[]"));
    if (Array.isArray(lido)) signatarios = lido.filter((s): s is Pessoa => !!s && typeof s === "object" && typeof (s as Pessoa).nome === "string" && typeof (s as Pessoa).email === "string");
  } catch {
    // cai na validação abaixo
  }
  const validos = signatarios.length > 0 && signatarios.length <= 5 && signatarios.every((s) => s.nome.trim() && email.test(s.email.trim()) && (s.papel === "consultor" || s.papel === "cliente"));
  const emails = signatarios.map((s) => s.email.trim().toLowerCase());
  if (!validos || new Set(emails).size !== emails.length)
    return NextResponse.json({ erro: "Informe nome e e-mail de cada signatário, sem repetir o e-mail." }, { status: 400 });

  try {
    const nome = `Relatório Técnico da ${etapa.ordem}ª Entrega - Etapa ${doisDigitos(etapa.ordem)} - ${projeto.codigoSolicitacaoHub || projeto.numeroProjetoHub || projeto.id}`;
    const doc = await criarDocumento(nome, pdf, signatarios.map((s) => ({ nome: s.nome.trim(), email: s.email.trim() })));
    // Devolve os signatários com o papel de cada um (pelo e-mail)
    const papel = new Map(signatarios.map((s) => [s.email.trim().toLowerCase(), s.papel]));
    return NextResponse.json({
      documentoId: doc.documentoId,
      signatarios: doc.signatarios.map((s) => ({ ...s, papel: papel.get(s.email.toLowerCase()) ?? "cliente" })),
    });
  } catch (e) {
    return NextResponse.json({ erro: e instanceof ErroAutentique ? e.message : "Não foi possível falar com a Autentique." }, { status: 502 });
  }
}
