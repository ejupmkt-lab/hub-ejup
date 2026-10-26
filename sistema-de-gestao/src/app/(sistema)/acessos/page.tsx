"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmpresaAtual } from "@/lib/dados/empresa-atual";

// Os acessos agora ficam na Equipe de cada empresa
export default function Acessos() {
  const { empresa } = useEmpresaAtual();
  const router = useRouter();
  useEffect(() => {
    router.replace(empresa ? `/${empresa.slug}/equipe` : "/");
  }, [empresa, router]);
  return null;
}
