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
import { indicadores } from "@/lib/painel";
import { Cronograma } from "@/components/painel/cronograma";
import { Calendario } from "@/components/painel/calendario";
import { Pendencias } from "@/components/painel/pendencias";
import { GraficoCarga, GraficoChecklist, GraficoSituacao } from "@/components/painel/graficos";
import type { Tom } from "@/lib/rotulos";

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
  const ind = indicadores(estado.projetos);
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
          Projetos novos aparecem aqui com o cronograma, o calendário de prazos, os gráficos e o próximo passo de cada um.
        </Vazio>
      ) : (
        <div className="space-y-6">
          <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador rotulo="Projetos em andamento" valor={ind.projetos} detalhe={ind.semPlano ? `${ind.semPlano} sem plano de trabalho` : "Todos com plano de trabalho"} />
            <Indicador
              rotulo="Atrasadas ou devolvidas"
              valor={ind.acao}
              detalhe={ind.acao ? "Etapas que pedem ação agora" : "Nenhuma etapa atrasada"}
              tom={ind.acao ? "critico" : "ok"}
            />
            <Indicador rotulo="Prazos nos próximos 7 dias" valor={ind.proximos7} detalhe={ind.proximos7 === 1 ? "Etapa a entregar" : "Etapas a entregar"} />
            <Indicador rotulo="Horas previstas nesta semana" valor={`${ind.horasSemana} h`} detalhe="Somando todos os projetos" />
          </section>

          <Secao titulo="Cronograma" descricao="Cada linha é um projeto; cada barra, uma etapa no período do plano de trabalho. Clique numa barra para abrir a etapa.">
            <Cronograma projetos={estado.projetos} />
          </Secao>

          <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
            <Secao titulo="Calendário de prazos">
              <Calendario projetos={estado.projetos} />
            </Secao>
            <Secao titulo="Pendências" descricao="Atrasos, devoluções, envios e prazos da semana.">
              <Pendencias projetos={estado.projetos} />
            </Secao>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Secao titulo="Situação das etapas">
              <GraficoSituacao projetos={estado.projetos} />
            </Secao>
            <Secao titulo="Carga de trabalho por semana">
              <GraficoCarga projetos={estado.projetos} />
            </Secao>
            <Secao titulo="Checklist da etapa em curso">
              <GraficoChecklist projetos={estado.projetos} />
            </Secao>
          </div>

          <section>
            <h2 className="mb-3 mt-4 font-serif text-[1.35rem]">Projetos e próximos passos</h2>
            <Cartao>
              <ul className="divide-y divide-linha">
                {ativos.map((p) => (
                  <LinhaProjeto key={p.id} projeto={p} mostrarEmpresa={empresasVisiveis.filter((e) => e.status === "ativo").length > 1} />
                ))}
              </ul>
            </Cartao>
          </section>
        </div>
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

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <Cartao className="p-6">
      <h2 className="font-serif text-[1.35rem] leading-snug">{titulo}</h2>
      {descricao && <p className="mt-1 text-sm text-tinta-2">{descricao}</p>}
      <div className="mt-5">{children}</div>
    </Cartao>
  );
}

function Indicador({ rotulo, valor, detalhe, tom }: { rotulo: string; valor: number | string; detalhe: string; tom?: Tom }) {
  const cor = tom === "critico" ? "text-vinho" : "text-tinta";
  return (
    <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha px-5 py-4">
      <p className="text-[13px] text-tinta-2">{rotulo}</p>
      <p className={`mt-1 text-[2.1rem] font-semibold leading-tight ${cor}`}>{valor}</p>
      <p className={`mt-0.5 text-[13px] ${tom === "critico" ? "text-vinho" : "text-tinta-2"}`}>{detalhe}</p>
    </div>
  );
}
