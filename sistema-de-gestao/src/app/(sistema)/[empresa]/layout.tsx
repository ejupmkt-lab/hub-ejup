"use client";

import { useParams } from "next/navigation";
import { useAcesso, useEstado } from "@/lib/dados/store";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import { Cabecalho, Cartao, Chip } from "@/components/ui";
import { statusEmpresa } from "@/lib/rotulos";

// Guarda de acesso por empresa + tela dos módulos ainda inativos.
export default function LayoutEmpresa({ children }: { children: React.ReactNode }) {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { estado } = useEstado();
  const { podeVer } = useAcesso();
  const empresa = estado.empresas.find((e) => e.slug === slug);

  if (!empresa || !podeVer(slug)) {
    return (
      <Cartao className="p-8 text-center">
        <h1 className="text-lg font-semibold">Sem acesso</h1>
        <p className="mt-2 text-sm text-tinta-2">Seu usuário não tem acesso a este módulo.</p>
      </Cartao>
    );
  }

  if (empresa.status !== "ativo") {
    return (
      <>
        <Cabecalho sobre="Módulo" titulo={empresa.nome} />
        <Cartao className="p-8">
          <Chip cor={empresa.status === "standby" ? "cinza" : "ambar"}>{statusEmpresa[empresa.status]}</Chip>
          <p className="mt-4 max-w-2xl text-tinta">{empresa.descricao}</p>
          <dl className="mt-6 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-tinta-2">Sócios</dt>
            <dd>{empresa.socios}</dd>
            <dt className="text-tinta-2">Situação</dt>
            <dd>{empresa.status === "standby" ? "Aguardando a estruturação dos cursos" : "Fluxos a levantar depois do MVP"}</dd>
          </dl>
          <p className="mt-6 text-sm text-tinta-2">
            A empresa já existe no sistema com os dados separados das demais. Quando o funcionamento for definido, os serviços e fluxos entram aqui.
          </p>
        </Cartao>
      </>
    );
  }

  return <>{children}</>;
}
