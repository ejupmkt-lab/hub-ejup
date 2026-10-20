"use client";

import Link from "next/link";
import type { Etapa, Projeto } from "@/lib/dados/tipos";
import { periodoCurto } from "@/lib/datas";
import { doisDigitos } from "@/lib/rotulos";
import { avancoEtapa, etapaAtrasada, etapaAtual, progressoAtividades, situacaoPrazo } from "@/lib/projeto";
import { todasSecoes, verificarCompletude } from "@/lib/relatorio/secoes";
import { Barra, BotaoLink, Cartao, Selo, StatusEtapa } from "@/components/ui";
import { IconeRelatorio, IconeSeta } from "@/components/icones";

const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

function contagens(e: Etapa) {
  const secoes = todasSecoes.filter((s) => s.obrigatoria(e));
  const secoesFeitas = secoes.filter((s) => (e.secoes[s.chave] ?? "").trim()).length;
  const entregaveis = e.entregaveis.filter((x) => x.tipo === "entregavel");
  const entregaveisFeitos = entregaveis.filter((x) => x.conteudo.trim()).length;
  return {
    checklist: progressoAtividades(e),
    secoes: { feitas: secoesFeitas, total: secoes.length },
    entregaveis: { feitas: entregaveisFeitos, total: entregaveis.length },
  };
}

// Diagnósticos e relatórios do projeto, um por etapa, sempre no modelo do
// Relatório Técnico de Nª Entrega da ficha técnica do projeto. A etapa em curso fica em destaque.
export function Relatorios({ projeto }: { projeto: Projeto }) {
  const base = `/${projeto.empresa}/projetos/${projeto.id}`;
  const destaque = projeto.etapas.find((e) => e.status === "devolvida") ?? etapaAtual(projeto);

  return (
    <div className="space-y-4">
      <p className="text-sm text-tinta-2">
        Cada etapa tem o seu relatório técnico, no modelo da ficha {projeto.codigoFichaTecnica}: as seções do relatório, os entregáveis da etapa e as evidências. O relatório é
        baixado em Word, assinado no gov.br e enviado no HUB.
      </p>

      {destaque && <EtapaEmDestaque projeto={projeto} etapa={destaque} />}

      <Cartao className="overflow-hidden">
        <h2 className="border-b border-linha px-4 py-3 text-[17px] font-bold sm:px-5">Relatórios das etapas</h2>
        <ol className="divide-y divide-linha">
          {projeto.etapas.map((e) => {
            const pct = Math.round(avancoEtapa(e) * 100);
            const sit = projeto.status === "em_andamento" && projeto.planoFechadoEm ? situacaoPrazo(e) : null;
            const atual = destaque?.ordem === e.ordem;
            return (
              <li key={e.ordem} className="relative">
                <div className={`flex items-start gap-3 px-4 py-4 hover:bg-pedra/50 sm:gap-4 sm:px-5 ${atual ? "bg-azul-claro/40" : ""}`}>
                  <span
                    className={`num grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      e.status === "enviada" || e.status === "aprovada"
                        ? "bg-verde-claro text-verde"
                        : e.status === "devolvida"
                          ? "bg-vermelho-claro text-vermelho"
                          : etapaAtrasada(e)
                            ? "bg-laranja-claro text-laranja"
                            : atual
                              ? "bg-azul text-folha"
                              : "bg-pedra text-tinta-2"
                    }`}
                  >
                    {doisDigitos(e.ordem)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
                      <div className="min-w-0">
                        <Link
                          href={`${base}/etapas/${e.ordem}`}
                          className="break-words text-[15px] font-bold text-tinta after:absolute after:inset-0 after:content-[''] hover:text-azul"
                        >
                          Relatório da {e.ordem}ª entrega · {capitalizar(e.nome)}
                        </Link>
                        <p className="num text-[13px] text-tinta-2">
                          {periodoCurto(e.dataInicio, e.dataFim)} · {e.horasPrevistas} h
                        </p>
                      </div>
                      <span className="flex flex-wrap items-center gap-2">
                        {sit && (sit.tom === "critico" || sit.tom === "atencao") && <Selo tom={sit.tom === "critico" ? "atencao" : sit.tom}>{sit.texto}</Selo>}
                        <StatusEtapa status={e.status} />
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <span className="flex-1">
                        <Barra valor={pct} total={100} tom={pct === 100 ? "ok" : "andamento"} />
                      </span>
                      <span className="num w-10 shrink-0 text-right text-[13px] font-semibold">{pct}%</span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Cartao>
    </div>
  );
}

function EtapaEmDestaque({ projeto, etapa: e }: { projeto: Projeto; etapa: Etapa }) {
  const base = `/${projeto.empresa}/projetos/${projeto.id}/etapas/${e.ordem}`;
  const c = contagens(e);
  const pendencias = verificarCompletude(projeto, e).length;
  const item = (rotulo: string, x: { feitas: number; total: number }, href: string) => (
    <Link href={href} className="block rounded-[var(--radius-campo)] border border-linha bg-folha px-3 py-2.5 hover:border-azul/40">
      <span className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-medium text-tinta-2">{rotulo}</span>
        <span className="num font-semibold text-tinta">
          {x.feitas}/{x.total}
        </span>
      </span>
      <span className="mt-2 block">
        <Barra valor={x.feitas} total={x.total} tom={x.total && x.feitas === x.total ? "ok" : "andamento"} />
      </span>
    </Link>
  );
  return (
    <Cartao
      className={`border-l-4 p-4 sm:p-5 ${e.status === "devolvida" ? "border-l-vermelho-vivo" : etapaAtrasada(e) ? "border-l-laranja-vivo" : "border-l-azul"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-campo)] bg-azul-claro text-azul">
            <IconeRelatorio className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className={`text-[12px] font-bold uppercase tracking-wide ${e.status === "devolvida" ? "text-vermelho" : "text-azul"}`}>
              {e.status === "devolvida" ? "Relatório devolvido" : "Relatório da etapa em curso"}
            </p>
            <h2 className="break-words text-lg font-bold leading-snug text-tinta">Relatório Técnico de {e.ordem}ª Entrega</h2>
            <p className="num text-sm text-tinta-2">
              Etapa {doisDigitos(e.ordem)} {capitalizar(e.nome)} · {periodoCurto(e.dataInicio, e.dataFim)}
            </p>
          </div>
        </div>
        <StatusEtapa status={e.status} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {item("Checklist", c.checklist, `${base}#checklist`)}
        {item("Seções do relatório", c.secoes, `${base}#redacao`)}
        {item("Entregáveis", c.entregaveis, `${base}#entregaveis`)}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <BotaoLink href={`${base}#redacao`} className="w-full sm:w-auto">
          {c.secoes.feitas ? "Continuar o relatório" : "Começar o relatório"}
          <IconeSeta className="h-4 w-4" />
        </BotaoLink>
        <BotaoLink href={`${base}#fechamento`} variante="secundario" className="w-full sm:w-auto">
          Fechamento e envio
          {pendencias > 0 && <span className="num rounded-full bg-vermelho-claro px-1.5 text-[12px] text-vermelho">{pendencias}</span>}
        </BotaoLink>
      </div>
    </Cartao>
  );
}
