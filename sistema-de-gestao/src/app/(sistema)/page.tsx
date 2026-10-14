"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { etapaAtual, situacaoPrazo } from "@/lib/projeto";
import { formatarData } from "@/lib/datas";
import { doisDigitos, statusEmpresa, statusProjeto } from "@/lib/rotulos";
import { Cabecalho, Cartao, Chip, ChipEtapa } from "@/components/ui";

export default function PainelGrupo() {
  const { estado } = useEstado();
  const { usuario, empresasVisiveis } = useAcesso();
  const router = useRouter();

  useEffect(() => {
    if (!usuario.adminGrupo) router.replace("/pivotto");
  }, [usuario, router]);
  if (!usuario.adminGrupo) return null;

  const ativos = estado.projetos.filter((p) => p.status !== "encerrado");

  return (
    <>
      <Cabecalho sobre="Visível só para o administrador do grupo" titulo="Painel do grupo" />

      <div className="grid gap-4 md:grid-cols-3">
        {empresasVisiveis.map((e) => {
          const n = estado.projetos.filter((p) => p.empresa === e.slug && p.status !== "encerrado").length;
          return (
            <Link key={e.slug} href={`/${e.slug}`}>
              <Cartao className="h-full p-5 transition hover:border-marinho/40 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{e.nome}</h2>
                  <Chip cor={e.status === "ativo" ? "verde" : e.status === "standby" ? "cinza" : "ambar"}>{statusEmpresa[e.status]}</Chip>
                </div>
                <p className="mt-2 text-sm text-tinta-2">{e.descricao}</p>
                <div className="mt-4 flex justify-between text-xs text-tinta-2">
                  <span>Sócios: {e.socios}</span>
                  {e.status === "ativo" && <span className="font-medium text-tinta">{n} projeto(s) ativo(s)</span>}
                </div>
              </Cartao>
            </Link>
          );
        })}
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold">Próximos prazos</h2>
      <Cartao className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-linha text-left text-xs text-tinta-2">
            <tr>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Etapa atual</th>
              <th className="px-4 py-3 font-medium">Fim previsto</th>
              <th className="px-4 py-3 font-medium">Prazo</th>
            </tr>
          </thead>
          <tbody>
            {ativos.map((p) => {
              const cliente = estado.clientes.find((c) => c.id === p.clienteId);
              const empresa = estado.empresas.find((e) => e.slug === p.empresa);
              const et = etapaAtual(p);
              const sit = et && p.status === "em_andamento" ? situacaoPrazo(et) : null;
              return (
                <tr key={p.id} className="border-b border-linha last:border-0 hover:bg-papel">
                  <td className="px-4 py-3 text-tinta-2">{empresa?.nome}</td>
                  <td className="px-4 py-3">
                    <Link href={`/${p.empresa}/projetos/${p.id}`} className="font-medium hover:text-marinho">
                      {cliente?.nomeFantasia || cliente?.razaoSocial}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "aguardando_plano" ? (
                      <Chip cor="ambar">{statusProjeto.aguardando_plano}</Chip>
                    ) : et ? (
                      <span className="flex items-center gap-2">
                        Etapa {doisDigitos(et.ordem)} <ChipEtapa status={et.status} />
                      </span>
                    ) : (
                      "Todas concluídas"
                    )}
                  </td>
                  <td className="px-4 py-3">{et && p.status === "em_andamento" ? formatarData(et.dataFim) : "—"}</td>
                  <td className="px-4 py-3">{sit ? <Chip cor={sit.cor}>{sit.texto}</Chip> : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Cartao>
    </>
  );
}
