import { redirect } from "next/navigation";

// A biblioteca de textos agora fica dentro de cada serviço
export default async function Biblioteca({ params }: { params: Promise<{ empresa: string }> }) {
  const { empresa } = await params;
  redirect(`/${empresa}/servicos`);
}
