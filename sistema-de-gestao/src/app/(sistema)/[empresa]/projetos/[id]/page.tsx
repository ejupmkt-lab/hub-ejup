"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useProjeto } from "@/components/projeto/use-projeto";
import { EtapasHub } from "@/components/projeto/etapas-hub";
import { PlanoTrabalho } from "@/components/projeto/plano-trabalho";
import { Registros } from "@/components/projeto/registros";
import { Referencias } from "@/components/projeto/referencias";
import { DadosProjeto } from "@/components/projeto/dados";
import { useEstado } from "@/lib/dados/store";
import { statusProjeto } from "@/lib/rotulos";
import { ancoraAbaProjeto, passoDoProjeto } from "@/lib/proximo-passo";
import { Abas, Botao, BotaoLink, Cabecalho, Cartao, ProximoPasso, Status, Vazio } from "@/components/ui";
import { Trilho } from "@/components/trilho";

const abas = ["Etapas", "Plano de trabalho", "Registros do programa", "Referências", "Ficha de identificação", "Histórico"] as const;
type Aba = (typeof abas)[number];

export default function PaginaProjeto() {
  const { projeto, cliente, consultor, alterar } = useProjeto();
  const { estado } = useEstado();
  const { empresa: slug } = useParams<{ empresa: string }>();
  const semPlano = projeto?.status === "aguardando_plano";
  const [aba, setAba] = useState<Aba>(semPlano ? "Plano de trabalho" : "Etapas");

  // #plano, #referencias, #registros… no endereço abrem a aba certa. Lido
  // depois da navegação, porque o Next atualiza o hash depois de montar.
  useEffect(() => {
    const ler = () => {
      const a = ancoraAbaProjeto[window.location.hash.slice(1) as keyof typeof ancoraAbaProjeto];
      if (a) setAba(a);
    };
    const t = setTimeout(ler, 0);
    window.addEventListener("hashchange", ler);
    return () => {
      clearTimeout(t);
      window.removeEventListener("hashchange", ler);
    };
  }, []);

  if (!projeto || !cliente)
    return (
      <div className="pt-10">
        <Vazio titulo="Projeto não encontrado" acao={<BotaoLink href={`/${slug}`}>Ver os projetos</BotaoLink>}>
          O link pode estar errado, ou o projeto foi excluído.
        </Vazio>
      </div>
    );

  const empresa = estado.empresas.find((e) => e.slug === projeto.empresa)!;
  const horas = projeto.etapas.reduce((a, e) => a + e.horasPrevistas, 0);
  const tomStatus = projeto.status === "aguardando_plano" ? "atencao" : projeto.status === "encerrado" ? "ok" : "andamento";

  const passo = passoDoProjeto(projeto);
  // Encerrar só depois que o SEBRAE aprovar todas as entregas
  const encerravel = projeto.status === "em_andamento" && projeto.etapas.every((e) => e.status === "aprovada");
  const encerrar = () => {
    if (confirm("Encerrar o projeto? Ele sai da lista de projetos em andamento; dá para reabrir depois."))
      alterar((p) => void (p.status = "encerrado"), { acao: "Projeto encerrado" });
  };

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
        abas={<Abas abas={abas} atual={aba} aoTrocar={setAba} naFaixa />}
      >
        <Status tom={tomStatus}>{statusProjeto[projeto.status]}</Status>
        <BotaoLink href={`/${projeto.empresa}/clientes?editar=${cliente.id}&voltar=${projeto.id}`} variante="secundario">
          Dados do cliente
        </BotaoLink>
        {encerravel && <Botao onClick={encerrar}>Encerrar projeto</Botao>}
        {projeto.status === "encerrado" && (
          <Botao variante="secundario" onClick={() => alterar((p) => void (p.status = "em_andamento"), { acao: "Projeto reaberto" })}>
            Reabrir projeto
          </Botao>
        )}
      </Cabecalho>

      {passo && !(aba === "Plano de trabalho" && !projeto.planoFechadoEm) && (
        <ProximoPasso
          passo={passo}
          className="mb-6"
          aoAgir={passo.href.endsWith("#plano") ? () => setAba("Plano de trabalho") : passo.encerrar ? encerrar : undefined}
        />
      )}

      {aba === "Etapas" && (
        <Cartao className="mb-6 px-6 pb-5 pt-2">
          <Trilho projeto={projeto} grande />
        </Cartao>
      )}

      {aba === "Etapas" && <EtapasHub projeto={projeto} />}
      {aba === "Plano de trabalho" && <PlanoTrabalho projeto={projeto} />}
      {aba === "Registros do programa" && <Registros projeto={projeto} />}
      {aba === "Referências" && <Referencias projeto={projeto} />}
      {aba === "Ficha de identificação" && <DadosProjeto projeto={projeto} />}
      {aba === "Histórico" && (
        <Cartao className="px-6 py-1">
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
        </Cartao>
      )}
    </>
  );
}
