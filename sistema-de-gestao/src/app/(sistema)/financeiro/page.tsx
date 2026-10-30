"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { useEmpresaAtual } from "@/lib/dados/empresa-atual";
import { Cabecalho, Cartao, Chip } from "@/components/ui";
import { AReceber } from "@/components/financeiro/a-receber";
import { ImpostoEmpresa } from "@/components/financeiro/imposto";

// Financeiro (só o gestor master): em desenvolvimento. Recebimentos do período (abre no mês corrente), por cliente e
// projeto; em Configurações, o imposto da empresa pela faixa do faturamento. O valor, as parcelas, a contrapartida e as
// notas fiscais de cada projeto ficam na aba Financeiro do próprio projeto; o teto e o valor da hora, na ficha do serviço.
const abas = ["Recebimentos", "Configurações"] as const;

export default function Financeiro() {
  const { usuario } = useAcesso();
  const { estado } = useEstado();
  const { empresa } = useEmpresaAtual();
  const router = useRouter();
  const [aba, setAba] = useState<(typeof abas)[number]>("Recebimentos");
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
        <div role="tablist" aria-label="Seções do financeiro" className="inline-flex gap-1 rounded-[var(--radius-bloco)] bg-pedra/70 p-1">
          {abas.map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={aba === a}
              onClick={() => setAba(a)}
              className={`min-h-10 rounded-[var(--radius-campo)] px-4 py-2 text-[14px] font-semibold transition-colors ${aba === a ? "bg-folha text-tinta shadow-[var(--shadow-cartao)]" : "text-tinta-2 hover:text-tinta"}`}
            >
              {a}
            </button>
          ))}
        </div>

        {aba === "Recebimentos" && (
          <section className="space-y-4" aria-label="Recebimentos">
            <AReceber projetos={projetos} />
          </section>
        )}

        {aba === "Configurações" &&
          (empresa ? (
            <Cartao className="p-4 sm:p-5">
              <ImpostoEmpresa empresa={empresa.slug} nome={empresa.nome} />
            </Cartao>
          ) : (
            <p className="text-sm text-tinta-2">Escolha uma empresa no menu para configurar o imposto.</p>
          ))}
      </div>
    </>
  );
}
