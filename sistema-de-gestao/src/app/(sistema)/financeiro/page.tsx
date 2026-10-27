"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { useEmpresaAtual } from "@/lib/dados/empresa-atual";
import { Cabecalho, Cartao, Chip } from "@/components/ui";
import { AReceber } from "@/components/financeiro/a-receber";
import { ImpostoEmpresa } from "@/components/financeiro/imposto";

// Financeiro (só o gestor master): em desenvolvimento. O que cai em cada mês e
// dia 5, na ordem de recebimento, e o imposto da empresa pela faixa do
// faturamento; os valores de cada serviço e projeto ficam neles.
export default function Financeiro() {
  const { usuario } = useAcesso();
  const { estado } = useEstado();
  const { empresa } = useEmpresaAtual();
  const router = useRouter();
  useEffect(() => {
    if (!usuario.veFinanceiro) router.replace("/");
  }, [usuario.veFinanceiro, router]);
  if (!usuario.veFinanceiro) return null;
  const projetos = estado.projetos.filter((p) => !empresa || p.empresa === empresa.slug);

  return (
    <>
      <Cabecalho
        titulo="Financeiro"
        subtitulo={
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span>{empresa ? `${empresa.nome} · ` : ""}só você vê esta área</span>
            <Chip tom="atencao">Em desenvolvimento</Chip>
          </p>
        }
      />
      <div className="space-y-4">
        <Cartao className="p-4 sm:p-5">
          <h2 className="text-[17px] font-bold">Recebimentos</h2>
          <p className="mt-0.5 text-sm text-tinta-2">
            O SEBRAE paga até o dia 5 o que ficou pronto até o dia 20 do mês anterior: 30% quando o Relatório 1 sai e o restante quando o projeto é finalizado.
            Antes disso a data é estimada pelo plano; corrija qualquer data, valor ou recebimento em “Editar”.
          </p>
          <div className="mt-4">
            <AReceber projetos={projetos} />
          </div>
        </Cartao>
        {empresa && (
          <Cartao className="p-4 sm:p-5">
            <ImpostoEmpresa empresa={empresa.slug} nome={empresa.nome} />
          </Cartao>
        )}
      </div>
    </>
  );
}
