"use client";

import { useParams } from "next/navigation";
import { useAcesso, useEstado } from "@/lib/dados/store";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import { BotaoLink, Cabecalho, Vazio } from "@/components/ui";

// Guarda de acesso por empresa e tela dos módulos ainda não estruturados.
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

  if (empresa.status !== "ativo") {
    const standby = empresa.status === "standby";
    return (
      <>
        <Cabecalho titulo={empresa.nome} subtitulo={standby ? "Módulo em standby" : "Módulo em estruturação"} />
        <div className="max-w-2xl border-l-2 border-linha-forte pl-6">
          <p className="text-lg font-semibold leading-relaxed text-tinta">{empresa.descricao}</p>
          <dl className="mt-8 grid grid-cols-[8rem_1fr] gap-y-3 text-[15px]">
            <dt className="text-tinta-2">Sócios</dt>
            <dd>{empresa.socios}</dd>
            <dt className="text-tinta-2">Próximo passo</dt>
            <dd>{standby ? "Estruturar o processo dos cursos" : "Levantar serviços, etapas e entregas"}</dd>
          </dl>
          <p className="mt-8 text-sm text-tinta-2">
            A empresa já existe no sistema, com dados separados das demais. Quando o funcionamento estiver definido, os fluxos entram aqui.
          </p>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
