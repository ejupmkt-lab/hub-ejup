"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { alertasDoProjeto } from "@/lib/projeto";
import { dataPorExtenso, hojeIso } from "@/lib/datas";
import { statusEmpresa } from "@/lib/rotulos";
import { BotaoLink, Cabecalho, Cartao, Status, Vazio } from "@/components/ui";
import { LinhaProjeto } from "@/components/linha-projeto";

export default function Painel() {
  const { estado } = useEstado();
  const { usuario, empresasVisiveis } = useAcesso();
  const router = useRouter();

  useEffect(() => {
    if (!usuario.adminGrupo) router.replace("/pivotto");
  }, [usuario, router]);
  if (!usuario.adminGrupo) return null;

  // Em andamento e sem plano; os que pedem ação urgente primeiro
  const urgencia = (p: (typeof estado.projetos)[number]) => Math.min(9, ...alertasDoProjeto(p).map((a) => a.ordem));
  const ativos = estado.projetos.filter((p) => p.status !== "encerrado").sort((a, b) => urgencia(a) - urgencia(b));
  const inativas = empresasVisiveis.filter((e) => e.status !== "ativo");
  const atrasados = ativos.filter((p) => alertasDoProjeto(p).some((a) => a.tom === "critico")).length;

  return (
    <>
      <Cabecalho
        titulo="Painel"
        subtitulo={
          <span className="num">
            {dataPorExtenso(hojeIso()).replace(/^0/, "")}.{" "}
            {ativos.length === 0
              ? "Nenhum projeto em andamento."
              : `${ativos.length} ${ativos.length === 1 ? "projeto em andamento" : "projetos em andamento"}${
                  atrasados ? `, ${atrasados} ${atrasados === 1 ? "pede" : "pedem"} atenção` : ""
                }.`}
          </span>
        }
      >
        <BotaoLink href="/pivotto/projetos/novo">Novo projeto</BotaoLink>
      </Cabecalho>

      {ativos.length === 0 ? (
        <Vazio titulo="Nenhum projeto em andamento" acao={<BotaoLink href="/pivotto/projetos/novo">Novo projeto</BotaoLink>}>
          Projetos novos aparecem aqui com o andamento de cada etapa no calendário e o próximo passo de cada um.
        </Vazio>
      ) : (
        <Cartao>
          <ul className="divide-y divide-linha">
            {ativos.map((p) => (
              <LinhaProjeto key={p.id} projeto={p} mostrarEmpresa={empresasVisiveis.filter((e) => e.status === "ativo").length > 1} />
            ))}
          </ul>
        </Cartao>
      )}

      {inativas.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-[13px] font-medium text-tinta-2">Outras empresas</h2>
          <ul className="flex flex-wrap gap-3">
            {inativas.map((e) => (
              <li key={e.slug}>
                <Link href={`/${e.slug}`} className="flex items-center gap-3 rounded-[var(--radius-bloco)] border border-linha bg-folha px-4 py-3 hover:border-linha-forte">
                  <span className="text-[15px]">{e.nome}</span>
                  <Status tom="neutro">{statusEmpresa[e.status]}</Status>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
