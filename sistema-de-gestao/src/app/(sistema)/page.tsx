"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { alertasDoProjeto, etapaAtual } from "@/lib/projeto";
import { dataPorExtenso, hojeIso } from "@/lib/datas";
import { doisDigitos, statusEmpresa } from "@/lib/rotulos";
import { Cabecalho, Selo, Status, StatusEtapa, Vazio, BotaoLink } from "@/components/ui";
import { Trilho } from "@/components/trilho";

export default function Painel() {
  const { estado } = useEstado();
  const { usuario, empresasVisiveis } = useAcesso();
  const router = useRouter();

  useEffect(() => {
    if (!usuario.adminGrupo) router.replace("/pivotto");
  }, [usuario, router]);
  if (!usuario.adminGrupo) return null;

  const ativos = estado.projetos.filter((p) => p.status !== "encerrado");
  const alertas = ativos.flatMap(alertasDoProjeto).sort((a, b) => a.ordem - b.ordem);
  const nomeCliente = (id: string) => {
    const c = estado.clientes.find((x) => x.id === id);
    return c?.nomeFantasia || c?.razaoSocial || "Cliente";
  };
  const nomeEmpresa = (slug: string) => estado.empresas.find((e) => e.slug === slug)?.nome ?? slug;
  const inativas = empresasVisiveis.filter((e) => e.status !== "ativo");

  return (
    <>
      <Cabecalho titulo="Painel" subtitulo={<span className="num">{dataPorExtenso(hojeIso()).replace(/^0/, "")}</span>} />

      <section className="mb-12">
        <h2 className="mb-4 font-serif text-xl">Precisa de atenção</h2>
        {alertas.length === 0 ? (
          <p className="text-[15px] text-tinta-2">Nenhum prazo vencendo e nenhuma etapa parada. Bom momento para adiantar a próxima entrega.</p>
        ) : (
          <ul className="divide-y divide-linha border-y border-linha">
            {alertas.map((a, i) => (
              <li key={i}>
                <Link
                  href={`/${a.projeto.empresa}/projetos/${a.projeto.id}${a.etapa ? `/etapas/${a.etapa.ordem}` : ""}`}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3.5 transition-colors hover:bg-folha/60"
                >
                  <span className="min-w-0">
                    <span className="font-serif text-[17px] text-tinta">{nomeCliente(a.projeto.clienteId)}</span>
                    <span className="ml-3 text-sm text-tinta-2">
                      {a.etapa ? `Etapa ${doisDigitos(a.etapa.ordem)}, ${a.etapa.nome.toLowerCase()}` : nomeEmpresa(a.projeto.empresa)}
                    </span>
                  </span>
                  <Selo tom={a.tom}>{a.texto}</Selo>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl">Projetos em andamento</h2>
          <span className="num text-sm text-tinta-2">{ativos.length}</span>
        </div>
        {ativos.length === 0 ? (
          <Vazio titulo="Nenhum projeto em andamento" acao={<BotaoLink href="/pivotto/projetos/novo">Novo projeto</BotaoLink>}>
            Projetos novos aparecem aqui com o andamento de cada etapa no calendário.
          </Vazio>
        ) : (
          <ul className="space-y-8">
            {ativos.map((p) => {
              const et = etapaAtual(p);
              return (
                <li key={p.id}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <Link href={`/${p.empresa}/projetos/${p.id}`} className="font-serif text-[19px] text-tinta hover:text-garrafa">
                      {nomeCliente(p.clienteId)}
                    </Link>
                    <span className="flex items-center gap-4 text-sm text-tinta-2">
                      <span>{nomeEmpresa(p.empresa)}</span>
                      {p.status === "aguardando_plano" ? (
                        <Status tom="atencao">Sem plano de trabalho</Status>
                      ) : et ? (
                        <StatusEtapa status={et.status} />
                      ) : (
                        <Status tom="ok">Etapas concluídas</Status>
                      )}
                    </span>
                  </div>
                  <Trilho projeto={p} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {inativas.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-xl">Outras empresas</h2>
          <ul className="space-y-2 text-[15px]">
            {inativas.map((e) => (
              <li key={e.slug}>
                <Link href={`/${e.slug}`} className="hover:text-garrafa">
                  {e.nome}
                </Link>
                <span className="ml-3 text-sm italic text-tinta-2">{statusEmpresa[e.status].toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
