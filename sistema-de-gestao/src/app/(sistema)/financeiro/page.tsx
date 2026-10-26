"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { useEmpresaAtual } from "@/lib/dados/empresa-atual";
import { Cabecalho, Cartao, Chip } from "@/components/ui";
import { AReceber } from "@/components/financeiro/a-receber";

// Financeiro (só o gestor master): em desenvolvimento. Por enquanto, o que
// cai em cada dia 5; os valores de cada serviço e projeto ficam neles.
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
        <p className="rounded-[var(--radius-bloco)] border border-laranja/30 bg-laranja-claro/70 px-4 py-3 text-sm text-tinta">
          Esta área ainda está em desenvolvimento. Por enquanto: o que cai em cada dia 5 e o que dá para garantir até o próximo dia 20. O valor de cada
          projeto e as parcelas ficam em “Dados do projeto”; o teto e o valor da hora, na ficha de cada serviço.
        </p>
        <Cartao className="p-4 sm:p-5">
          <h2 className="text-[17px] font-bold">A receber</h2>
          <p className="mt-0.5 text-sm text-tinta-2">O SEBRAE paga até o dia 5 o que ficou pronto até o dia 20 do mês anterior.</p>
          <div className="mt-4">
            <AReceber projetos={projetos} />
          </div>
        </Cartao>
      </div>
    </>
  );
}
