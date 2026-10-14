"use client";

import Link from "next/link";
import { useState } from "react";
import { useProjeto } from "@/components/projeto/use-projeto";
import { EtapasHub } from "@/components/projeto/etapas-hub";
import { PlanoTrabalho } from "@/components/projeto/plano-trabalho";
import { Registros } from "@/components/projeto/registros";
import { Referencias } from "@/components/projeto/referencias";
import { DadosProjeto } from "@/components/projeto/dados";
import { useEstado } from "@/lib/dados/store";
import { statusProjeto } from "@/lib/rotulos";
import { etapaConcluida } from "@/lib/projeto";
import { Abas, Botao, Cabecalho, Status } from "@/components/ui";
import { Trilho } from "@/components/trilho";

const abas = ["Etapas", "Plano de trabalho", "Registros do programa", "Referências", "Ficha de identificação", "Histórico"] as const;
type Aba = (typeof abas)[number];

export default function PaginaProjeto() {
  const { projeto, cliente, consultor, alterar } = useProjeto();
  const { estado } = useEstado();
  const [aba, setAba] = useState<Aba>(projeto?.status === "aguardando_plano" ? "Plano de trabalho" : "Etapas");
  if (!projeto || !cliente) return <p className="text-tinta-2">Projeto não encontrado.</p>;

  const empresa = estado.empresas.find((e) => e.slug === projeto.empresa)!;
  const horas = projeto.etapas.reduce((a, e) => a + e.horasPrevistas, 0);
  const tomStatus = projeto.status === "aguardando_plano" ? "atencao" : projeto.status === "encerrado" ? "ok" : "andamento";

  return (
    <>
      <Cabecalho
        migalhas={[{ rotulo: empresa.nome, href: `/${projeto.empresa}` }, { rotulo: cliente.nomeFantasia || cliente.razaoSocial }]}
        titulo={cliente.razaoSocial}
        subtitulo={
          <span className="num">
            Projeto HUB {projeto.numeroProjetoHub || "sem número"}, ficha {projeto.codigoFichaTecnica}, {horas} h, consultor{" "}
            {consultor?.nome ?? "a definir"}
          </span>
        }
      >
        <Status tom={tomStatus}>{statusProjeto[projeto.status]}</Status>
        <Link href={`/${projeto.empresa}/clientes?editar=${cliente.id}`} className="text-sm text-tinta-2 underline-offset-4 hover:text-garrafa hover:underline">
          Dados do cliente
        </Link>
        {projeto.status === "em_andamento" && projeto.etapas.every(etapaConcluida) && (
          <Botao onClick={() => alterar((p) => void (p.status = "encerrado"), { acao: "Projeto encerrado" })}>Encerrar projeto</Botao>
        )}
        {projeto.status === "encerrado" && (
          <Botao variante="secundario" onClick={() => alterar((p) => void (p.status = "em_andamento"), { acao: "Projeto reaberto" })}>
            Reabrir projeto
          </Botao>
        )}
      </Cabecalho>

      {projeto.status === "em_andamento" && projeto.etapas.every(etapaConcluida) && (
        <p className="-mt-4 mb-8 text-[15px] text-musgo">Todas as etapas foram enviadas ao HUB. Encerre o projeto quando o SEBRAE aprovar a última entrega.</p>
      )}

      <div className="mb-10">
        <Trilho projeto={projeto} grande />
        {projeto.status === "aguardando_plano" && aba !== "Plano de trabalho" && (
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Botao onClick={() => setAba("Plano de trabalho")}>Definir o plano de trabalho</Botao>
            <span className="text-sm text-tinta-2">Enquanto isso, as etapas não têm datas nem avisos de prazo.</span>
          </div>
        )}
      </div>

      <Abas abas={abas} atual={aba} aoTrocar={setAba} />

      {aba === "Etapas" && <EtapasHub projeto={projeto} />}
      {aba === "Plano de trabalho" && <PlanoTrabalho projeto={projeto} />}
      {aba === "Registros do programa" && <Registros projeto={projeto} />}
      {aba === "Referências" && <Referencias projeto={projeto} />}
      {aba === "Ficha de identificação" && <DadosProjeto projeto={projeto} />}
      {aba === "Histórico" && (
        <ol className="max-w-3xl">
          {projeto.historico.map((h, i) => (
            <li key={i} className="grid grid-cols-[7.5rem_1fr] gap-x-6 border-b border-linha py-3.5 text-[15px] last:border-0">
              <span className="num text-sm text-tinta-2">
                {h.em.slice(0, 10).split("-").reverse().join("/")}
                <span className="block">{h.em.slice(11, 16)}</span>
              </span>
              <span>
                <span className="text-tinta">{h.acao}</span>
                <span className="text-tinta-2">, por {h.usuario}</span>
                {h.detalhe && <span className="mt-1 block text-sm text-tinta-2">{h.detalhe}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
