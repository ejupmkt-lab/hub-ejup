"use client";

import { useAcesso } from "@/lib/dados/store";
import { Cabecalho, Vazio } from "@/components/ui";

// Para quem tem acesso só a empresas ainda não ativas no sistema
export default function SemEmpresa() {
  const { empresasVisiveis } = useAcesso();
  return (
    <>
      <Cabecalho titulo="Nenhuma empresa ativa" />
      <Vazio titulo="Ainda não há o que mostrar para o seu acesso">
        {empresasVisiveis.length
          ? "As empresas liberadas para você ainda estão em estruturação. Quando o módulo for ativado, ele aparece no menu."
          : "O seu usuário ainda não tem empresa liberada. Fale com o administrador do grupo."}
      </Vazio>
    </>
  );
}
