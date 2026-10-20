"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { alertasDoProjeto } from "@/lib/projeto";
import { dataPorExtenso, hojeIso } from "@/lib/datas";
import { horasDoProjeto, horasFmt } from "@/lib/horas";
import { tarefasPendentes } from "@/lib/tarefas";
import { indicadores } from "@/lib/painel";
import { BotaoLink, Cartao, Cabecalho, Indicador, Vazio } from "@/components/ui";
import { CartaoProjeto } from "@/components/cartao-projeto";
import { Pendencias } from "@/components/painel/pendencias";
import { GraficoCarga, GraficoSituacao } from "@/components/painel/graficos";
import { IconeMaisSinal } from "@/components/icones";

export default function Painel() {
  const { estado } = useEstado();
  const { empresasVisiveis, inicio, novoProjeto } = useAcesso();
  const router = useRouter();

  // Sem empresa ativa liberada, não há painel a mostrar
  useEffect(() => {
    if (inicio !== "/") router.replace(inicio);
  }, [router, inicio]);
  if (inicio !== "/") return null;

  // Em andamento e sem plano; os que pedem ação urgente primeiro
  const urgencia = (p: (typeof estado.projetos)[number]) => Math.min(9, ...alertasDoProjeto(p).map((a) => a.ordem));
  const ativos = estado.projetos.filter((p) => p.status !== "encerrado").sort((a, b) => urgencia(a) - urgencia(b));
  const ind = indicadores(estado.projetos);
  const tarefas = tarefasPendentes(estado.projetos);
  const tarefasAtrasadas = tarefas.filter((t) => t.atrasada).length;
  const horas = ativos
    .map(horasDoProjeto)
    .reduce((a, h) => ({ previstas: a.previstas + h.previstas, realizadas: a.realizadas + h.realizadas }), { previstas: 0, realizadas: 0 });
  const ativa = empresasVisiveis.find((e) => e.status === "ativo");
  const variasEmpresas = empresasVisiveis.filter((e) => e.status === "ativo").length > 1;
  const hoje = dataPorExtenso(hojeIso()).replace(/^0/, "");

  return (
    <>
      <Cabecalho titulo="Painel" subtitulo={`Todos os projetos em andamento · ${hoje}`}>
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
              detalhe={ind.semPlano ? `${ind.semPlano} sem plano de trabalho` : "Todos com plano de trabalho"}
              href={ativa ? `/${ativa.slug}` : undefined}
            />
            <Indicador
              rotulo="Tarefas pendentes"
              valor={tarefas.length}
              detalhe={tarefasAtrasadas ? `${tarefasAtrasadas} ${tarefasAtrasadas === 1 ? "atrasada" : "atrasadas"}` : "Nenhuma atrasada"}
              tom={tarefasAtrasadas ? "atencao" : undefined}
              href="/tarefas"
            />
            <Indicador rotulo="Horas registradas" valor={horasFmt(horas.realizadas)} detalhe={`de ${horas.previstas.toLocaleString("pt-BR")} h previstas`} />
            <Indicador
              rotulo="Etapas atrasadas"
              valor={ind.atrasadas}
              detalhe={ind.devolvidas ? `e ${ind.devolvidas} ${ind.devolvidas === 1 ? "devolvida" : "devolvidas"} pelo SEBRAE` : "fora do plano de trabalho"}
              tom={ind.devolvidas ? "critico" : ind.atrasadas ? "atencao" : undefined}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Secao titulo="Pendências" descricao="Devoluções, atrasos, envios e prazos da semana.">
              <Pendencias projetos={estado.projetos} />
            </Secao>
            <Secao titulo="Situação das etapas">
              <GraficoSituacao projetos={estado.projetos} />
            </Secao>
            <Secao titulo="Carga de trabalho por semana">
              <GraficoCarga projetos={estado.projetos} />
            </Secao>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-2">
            <h2 className="text-lg font-bold">Projetos</h2>
            <ul aria-label="Legenda das cores" className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-tinta-2">
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-vermelho-vivo" />
                Ponto crítico (devolução)
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-laranja-vivo" />
                Atraso (etapa ou tarefa)
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-verde-vivo" />
                Em dia
              </li>
            </ul>
          </div>

          <section aria-label="Projetos" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ativos.map((p) => (
              <CartaoProjeto key={p.id} projeto={p} mostrarEmpresa={variasEmpresas} />
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
