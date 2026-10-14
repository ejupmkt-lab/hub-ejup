"use client";

import Link from "next/link";
import { useState } from "react";
import { useProjeto } from "@/components/projeto/use-projeto";
import { EtapasHub } from "@/components/projeto/etapas-hub";
import { PlanoTrabalho } from "@/components/projeto/plano-trabalho";
import { Registros } from "@/components/projeto/registros";
import { Referencias } from "@/components/projeto/referencias";
import { DadosProjeto } from "@/components/projeto/dados";
import { statusProjeto } from "@/lib/rotulos";
import { Cabecalho, Cartao, Chip } from "@/components/ui";

const abas = ["Etapas", "Plano de trabalho", "Registros do programa", "Referências", "Ficha de identificação", "Histórico"] as const;

export default function PaginaProjeto() {
  const { projeto, cliente, consultor } = useProjeto();
  const [aba, setAba] = useState<(typeof abas)[number]>(projeto?.status === "aguardando_plano" ? "Plano de trabalho" : "Etapas");
  if (!projeto || !cliente) return <p>Projeto não encontrado.</p>;

  const horas = projeto.etapas.reduce((a, e) => a + e.horasPrevistas, 0);

  return (
    <>
      <Cabecalho sobre={<Link href={`/${projeto.empresa}`} className="hover:text-marinho">← Projetos</Link>} titulo={cliente.razaoSocial}>
        <Chip cor={projeto.status === "aguardando_plano" ? "ambar" : projeto.status === "encerrado" ? "verde" : "azul"}>{statusProjeto[projeto.status]}</Chip>
      </Cabecalho>

      <div className="mb-6 grid gap-x-8 gap-y-1 text-sm text-tinta-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>Projeto HUB <span className="text-tinta">{projeto.numeroProjetoHub || "—"}</span></div>
        <div>Ficha <span className="text-tinta">{projeto.codigoFichaTecnica}</span> · {horas} h</div>
        <div>Consultor <span className="text-tinta">{consultor?.nome}</span></div>
        <div>Gestor(a) SEBRAE <span className="text-tinta">{projeto.gestorSebrae || "—"}</span></div>
      </div>

      {projeto.status === "aguardando_plano" && aba !== "Plano de trabalho" && (
        <Cartao className="mb-4 border-ambar/40 bg-ambar-claro p-4 text-sm">
          As etapas ainda não têm datas e não geram avisos de prazo.{" "}
          <button className="font-medium text-marinho underline" onClick={() => setAba("Plano de trabalho")}>Definir o plano de trabalho</button>
        </Cartao>
      )}

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-linha">
        {abas.map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${a === aba ? "border-marinho font-medium text-marinho" : "border-transparent text-tinta-2 hover:text-tinta"}`}
          >
            {a}
          </button>
        ))}
      </div>

      {aba === "Etapas" && <EtapasHub projeto={projeto} />}
      {aba === "Plano de trabalho" && <PlanoTrabalho projeto={projeto} />}
      {aba === "Registros do programa" && <Registros projeto={projeto} />}
      {aba === "Referências" && <Referencias projeto={projeto} />}
      {aba === "Ficha de identificação" && <DadosProjeto projeto={projeto} />}
      {aba === "Histórico" && (
        <Cartao className="divide-y divide-linha">
          {projeto.historico.map((h, i) => (
            <div key={i} className="flex flex-wrap gap-x-4 px-5 py-3 text-sm">
              <span className="w-36 text-tinta-2">{h.em.slice(0, 10).split("-").reverse().join("/")} {h.em.slice(11, 16)}</span>
              <span className="w-24 font-medium">{h.usuario}</span>
              <span className="flex-1">
                {h.acao}
                {h.detalhe && <span className="block text-xs text-tinta-2">{h.detalhe}</span>}
              </span>
            </div>
          ))}
        </Cartao>
      )}
    </>
  );
}
