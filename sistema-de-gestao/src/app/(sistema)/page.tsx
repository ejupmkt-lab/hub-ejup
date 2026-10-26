"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { alertasDoProjeto, horasDoProjeto, horasFmt } from "@/lib/projeto";
import { dataPorExtenso, hojeIso } from "@/lib/datas";
import { contarTarefas } from "@/lib/tarefas";
import { useEmpresaAtual } from "@/lib/dados/empresa-atual";
import { indicadores } from "@/lib/painel";
import { BotaoLink, Cartao, Cabecalho, Indicador, Vazio } from "@/components/ui";
import { CartaoProjeto } from "@/components/cartao-projeto";
import { Pendencias } from "@/components/painel/pendencias";
import { GraficoCarga } from "@/components/painel/graficos";
import { EtapasDosProjetos, FasesDosProjetos } from "@/components/painel/fases";
import { IconeMaisSinal } from "@/components/icones";

export default function Painel() {
  const { estado } = useEstado();
  const { inicio } = useAcesso();
  const { empresa } = useEmpresaAtual();
  const novoProjeto = empresa ? `/${empresa.slug}/projetos/novo` : null;
  const router = useRouter();

  // Sem empresa ativa liberada, não há painel a mostrar
  useEffect(() => {
    if (inicio !== "/") router.replace(inicio);
  }, [router, inicio]);
  if (inicio !== "/") return null;

  // Em andamento e sem plano; os que pedem ação urgente primeiro
  const urgencia = (p: (typeof estado.projetos)[number]) => Math.min(9, ...alertasDoProjeto(p).map((a) => a.ordem));
  // Só os projetos da empresa escolhida no menu
  const projetos = estado.projetos.filter((p) => p.empresa === empresa?.slug);
  const ativos = projetos.filter((p) => p.status !== "encerrado").sort((a, b) => urgencia(a) - urgencia(b));
  const ind = indicadores(projetos);
  const conta = contarTarefas(projetos);
  const horas = ativos
    .map(horasDoProjeto)
    .reduce((a, h) => ({ previstas: a.previstas + h.previstas, cumpridas: a.cumpridas + h.cumpridas }), { previstas: 0, cumpridas: 0 });
  const hoje = dataPorExtenso(hojeIso()).replace(/^0/, "");

  return (
    <>
      <Cabecalho titulo="Painel" subtitulo={`${empresa?.nome ?? "Projetos em andamento"} · ${hoje}`}>
        {/* No celular, o novo projeto fica na página de projetos */}
        {novoProjeto && (
          <div className="hidden sm:block">
            <BotaoLink href={novoProjeto}>
              <IconeMaisSinal className="h-4 w-4" />
              Novo projeto
            </BotaoLink>
          </div>
        )}
      </Cabecalho>

      {ativos.length === 0 ? (
        <Vazio titulo="Nenhum projeto em andamento" acao={novoProjeto && <BotaoLink href={novoProjeto}>Novo projeto</BotaoLink>}>
          Cada contratação do HUB SEBRAE vira um projeto, com o avanço, as etapas atrasadas e o próximo passo aqui no painel.
        </Vazio>
      ) : (
        <div className="space-y-6">
          <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador
              rotulo="Projetos em andamento"
              valor={ind.projetos}
              detalhe={
                ind.preContrato
                  ? `${ind.emExecucao} em execução, ${ind.preContrato} antes da contratação`
                  : ind.semPlano
                    ? `${ind.semPlano} sem plano de trabalho`
                    : "Todos com plano de trabalho"
              }
              href={empresa ? `/${empresa.slug}` : undefined}
            />
            <Indicador
              rotulo="Tarefas pendentes"
              valor={conta.total}
              detalhe={conta.atrasadas ? `${conta.atrasadas} ${conta.atrasadas === 1 ? "atrasada" : "atrasadas"}` : "Nenhuma atrasada"}
              tom={conta.atrasadas ? "atencao" : undefined}
              href="/tarefas"
            />
            <Indicador rotulo="Horas cumpridas" valor={horasFmt(horas.cumpridas)} detalhe={`de ${horas.previstas.toLocaleString("pt-BR")} h previstas`} />
            <Indicador
              rotulo="Etapas atrasadas"
              valor={ind.atrasadas}
              detalhe={ind.devolvidas ? `e ${ind.devolvidas} ${ind.devolvidas === 1 ? "devolvida" : "devolvidas"} pelo SEBRAE` : "fora do plano de trabalho"}
              tom={ind.devolvidas ? "critico" : ind.atrasadas ? "atencao" : undefined}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Secao titulo="Pendências" descricao="Devoluções, atrasos, envios e prazos da semana.">
              <Pendencias projetos={projetos} />
            </Secao>
            <Secao titulo="Situação no HUB" descricao="As etapas do HUB SEBRAE, da solicitação à conclusão.">
              <FasesDosProjetos projetos={projetos} />
            </Secao>
            <Secao titulo="Carga de trabalho por semana">
              <GraficoCarga projetos={projetos} />
            </Secao>
          </div>

          <Secao
            titulo="Etapas de cada projeto"
            descricao="D e P: diagnóstico e proposta; depois, as etapas do serviço de cada projeto (que variam de um serviço para outro); F: finalização."
          >
            <EtapasDosProjetos projetos={projetos} />
          </Secao>

          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-2">
            <h2 className="text-lg font-bold">Projetos</h2>
            <ul aria-label="Legenda das cores" className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-tinta-2">
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-vermelho-vivo" />
                Ponto crítico (devolução)
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-laranja-vivo" />
                Atraso ou além do plano do HUB
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-verde-vivo" />
                Em dia
              </li>
            </ul>
          </div>

          <section aria-label="Projetos" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ativos.map((p) => (
              <CartaoProjeto key={p.id} projeto={p} />
            ))}
          </section>
        </div>
      )}
    </>
  );
}

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <Cartao className="min-w-0 p-4 sm:p-5">
      <h2 className="text-[17px] font-bold">{titulo}</h2>
      {descricao && <p className="mt-0.5 text-sm text-tinta-2">{descricao}</p>}
      <div className="mt-4">{children}</div>
    </Cartao>
  );
}
