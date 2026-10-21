"use client";

import Link from "next/link";
import { comQuem, comQuemTexto, faseDoProjeto, fases } from "@/lib/fase";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { formatarData } from "@/lib/datas";
import {
  codigoHub,
  avancoProjeto,
  diasSemRegistro,
  entregaFinal,
  etapaAtrasada,
  etapaAtual,
  previstoProjeto,
  servicoDoProjeto,
  situacaoProjeto,
} from "@/lib/projeto";
import { passoDoProjeto } from "@/lib/proximo-passo";
import { doisDigitos, statusEtapa, type Tom } from "@/lib/rotulos";
import { Barra, Chip, corTom } from "@/components/ui";
import { IconeCalendarioPequeno, IconeSeta } from "@/components/icones";

const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

// Um projeto no painel: cliente, avanço contra o previsto, etapa, entrega e
// alertas. A borda da esquerda tem a cor da situação. O cartão inteiro abre o
// projeto; a linha de baixo leva direto ao próximo passo.
export function CartaoProjeto({
  projeto: p,
  mostrarEmpresa = false,
  titulo = "cliente",
}: {
  projeto: Projeto;
  mostrarEmpresa?: boolean;
  titulo?: "cliente" | "servico"; // na página do cliente, o título é o serviço
}) {
  const { estado } = useEstado();
  const c = estado.clientes.find((x) => x.id === p.clienteId);
  const empresa = estado.empresas.find((e) => e.slug === p.empresa);
  const sit = situacaoProjeto(p);
  const fase = faseDoProjeto(p);
  const avanco = avancoProjeto(p);
  const previsto = previstoProjeto(p);
  const et = etapaAtual(p);
  const atrasadas = p.etapas.filter((e) => etapaAtrasada(e) && e.status !== "devolvida").length;
  const devolvidas = p.etapas.filter((e) => e.status === "devolvida").length;
  const semRegistro = diasSemRegistro(p);
  const entrega = entregaFinal(p);
  const passo = passoDoProjeto(p);
  const href = `/${p.empresa}/projetos/${p.id}`;
  const servico = servicoDoProjeto(p);
  const nomeCliente = c?.nomeFantasia || c?.razaoSocial || "Cliente";
  const subtitulo = [mostrarEmpresa && empresa?.nome, titulo === "cliente" ? servico : null, `Projeto HUB ${codigoHub(p) || "sem número"}`]
    .filter(Boolean)
    .join(" · ");

  // Situação da etapa em curso, ao lado do nome
  const situacaoEtapa: { texto: string; tom: Tom } | null = !et
    ? null
    : et.status === "devolvida"
      ? { texto: "Devolvida", tom: "critico" }
      : etapaAtrasada(et)
        ? { texto: "Atrasada", tom: "atencao" }
        : { texto: statusEtapa[et.status].rotulo, tom: "neutro" };

  return (
    <article
      className={`relative flex h-full flex-col rounded-[var(--radius-bloco)] border border-l-4 border-linha bg-folha p-4 shadow-[var(--shadow-cartao)] transition-shadow hover:shadow-md sm:p-5 ${corTom[sit.tom].borda}`}
    >
      <h3 className="break-words text-[17px] font-bold leading-snug text-tinta">
        <Link
          href={href}
          className="after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] hover:text-azul focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-azul"
        >
          {titulo === "cliente" ? nomeCliente : servico}
        </Link>
      </h3>
      <p className="num mt-0.5 break-words text-sm text-tinta-2">{subtitulo}</p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="num text-[2rem] font-bold leading-none tracking-tight text-tinta">{avanco}%</span>
        {previsto !== null && <span className="num pb-0.5 text-[13px] text-tinta-2">previsto {previsto}%</span>}
      </div>
      <div className="mt-2.5">
        <Barra valor={avanco} total={100} marca={previsto} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-tinta-2">
        <p>
          {fase !== "execucao" && fase !== "concluido" ? (
            <>
              No HUB: <span className="font-semibold text-tinta">{fases[fase].numero} {fases[fase].rotulo}</span>
              {comQuem(p) && <span> · {comQuemTexto(comQuem(p)!)}</span>}
            </>
          ) : (
            <>
              Etapa{et ? ` ${et.ordem} de ${p.etapas.length}` : ""}:{" "}
              {et ? (
                <>
                  <span className="font-semibold text-tinta">
                    {doisDigitos(et.ordem)} {capitalizar(et.nome)}
                  </span>
                  {situacaoEtapa && (
                    <span className={`font-medium ${situacaoEtapa.tom === "neutro" ? "text-tinta-2" : corTom[situacaoEtapa.tom].texto}`}>
                      {" "}
                      · {situacaoEtapa.texto}
                    </span>
                  )}
                </>
              ) : (
                <span className="font-semibold text-tinta">todas enviadas</span>
              )}
            </>
          )}
        </p>
        <p className="num">
          Entrega: <span className="text-tinta">{entrega ? formatarData(entrega) : "sem data"}</span>
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {devolvidas > 0 && <Chip tom="critico">{devolvidas === 1 ? "1 etapa devolvida" : `${devolvidas} etapas devolvidas`}</Chip>}
        {atrasadas > 0 && <Chip tom="atencao">{atrasadas === 1 ? "1 etapa atrasada" : `${atrasadas} etapas atrasadas`}</Chip>}
        {!p.planoFechadoEm && fase === "execucao" && <Chip tom="atencao">Sem plano de trabalho</Chip>}
        {p.status !== "encerrado" && (
          <Chip tom={semRegistro === null || semRegistro > 7 ? "atencao" : "neutro"} icone={<IconeCalendarioPequeno className="h-3.5 w-3.5" />}>
            {semRegistro === null
              ? "sem registros"
              : semRegistro === 0
                ? "registro hoje"
                : semRegistro === 1
                  ? "1 dia sem registro"
                  : `${semRegistro} dias sem registro`}
          </Chip>
        )}
        {sit.tom === "ok" && <Chip tom="ok">{sit.rotulo}</Chip>}
      </div>

      {passo && (
        <div className="relative z-10 mt-auto pt-4">
          <Link
            href={passo.href}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-campo)] bg-pedra px-3 py-2.5 text-[13px] leading-snug transition-colors hover:bg-azul-claro"
          >
            <span className="min-w-0">
              <span className="font-semibold text-tinta">Próximo passo: </span>
              <span className="text-tinta-2">{passo.texto}</span>
            </span>
            <IconeSeta className="h-4 w-4 shrink-0 text-azul" />
          </Link>
        </div>
      )}
    </article>
  );
}
