"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// A etapa é escrita no Desenvolvimento e enviada pelas Entregas: os links
// antigos para a página da etapa levam à entrega dela, no projeto
export default function PaginaEtapa() {
  const { empresa, id, ordem } = useParams<{ empresa: string; id: string; ordem: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/${empresa}/projetos/${id}#etapa-${ordem}`);
  }, [empresa, id, ordem, router]);
  return null;
}
