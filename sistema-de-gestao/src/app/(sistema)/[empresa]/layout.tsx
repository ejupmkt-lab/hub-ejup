"use client";

import { useParams } from "next/navigation";
import { useAcesso, useEstado } from "@/lib/dados/store";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import { BotaoLink, Vazio } from "@/components/ui";

// Guarda de acesso por empresa: só entra quem tem acesso a ela.
export default function LayoutEmpresa({ children }: { children: React.ReactNode }) {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { estado } = useEstado();
  const { podeVer, inicio } = useAcesso();
  const empresa = estado.empresas.find((e) => e.slug === slug);

  if (!empresa || !podeVer(slug)) {
    return (
      <div className="pt-16">
        <Vazio titulo="Página não disponível" acao={<BotaoLink href={inicio}>Ir para o início</BotaoLink>}>
          Este endereço não existe, ou o seu usuário não tem acesso a esta empresa. Se precisar dela, fale com o administrador do grupo.
        </Vazio>
      </div>
    );
  }

  return <>{children}</>;
}
