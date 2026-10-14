"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEstado } from "@/lib/dados/store";
import { etapaAtual, situacaoPrazo } from "@/lib/projeto";
import { formatarData } from "@/lib/datas";
import { doisDigitos, statusProjeto } from "@/lib/rotulos";
import { BotaoLink, Cabecalho, Cartao, Chip, ChipEtapa, Vazio } from "@/components/ui";

export default function ModuloEmpresa() {
  const { empresa: slug } = useParams<{ empresa: string }>();
  const { estado } = useEstado();
  const empresa = estado.empresas.find((e) => e.slug === slug)!;
  const projetos = estado.projetos.filter((p) => p.empresa === slug);

  return (
    <>
      <Cabecalho sobre="Módulo" titulo={empresa.nome}>
        <BotaoLink href={`/${slug}/clientes`} variante="secundario">Clientes</BotaoLink>
        <BotaoLink href={`/${slug}/projetos/novo`}>Novo projeto</BotaoLink>
      </Cabecalho>

      <h2 className="mb-3 text-sm font-medium text-tinta-2">Projetos · Adequação à LGPD · HUB SEBRAE</h2>
      {projetos.length === 0 ? (
        <Vazio>Nenhum projeto ainda.</Vazio>
      ) : (
        <div className="space-y-3">
          {projetos.map((p) => {
            const cliente = estado.clientes.find((c) => c.id === p.clienteId);
            const consultor = estado.usuarios.find((u) => u.id === p.consultorId);
            const et = etapaAtual(p);
            const sit = et && p.status === "em_andamento" ? situacaoPrazo(et) : null;
            return (
              <Link key={p.id} href={`/${slug}/projetos/${p.id}`} className="block">
                <Cartao className="flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-marinho/40 hover:shadow-sm">
                  <div>
                    <div className="font-semibold">{cliente?.razaoSocial}</div>
                    <div className="mt-1 text-xs text-tinta-2">
                      Projeto HUB {p.numeroProjetoHub || "—"} · Consultor: {consultor?.nome} · Etapas {p.etapas.filter((e) => ["enviada", "aprovada"].includes(e.status)).length}/{p.etapas.length} concluídas
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {p.status === "aguardando_plano" ? (
                      <Chip cor="ambar">{statusProjeto.aguardando_plano}</Chip>
                    ) : et ? (
                      <>
                        <span className="text-tinta-2">Etapa {doisDigitos(et.ordem)} até {formatarData(et.dataFim)}</span>
                        <ChipEtapa status={et.status} />
                        {sit && <Chip cor={sit.cor}>{sit.texto}</Chip>}
                      </>
                    ) : (
                      <Chip cor="verde">Etapas concluídas</Chip>
                    )}
                  </div>
                </Cartao>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
