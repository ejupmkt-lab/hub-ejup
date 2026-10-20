"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useProjeto } from "@/components/projeto/use-projeto";
import { PlanoTrabalho } from "@/components/projeto/plano-trabalho";
import { Visitas } from "@/components/projeto/visitas";
import { Registros } from "@/components/projeto/registros";
import { Referencias } from "@/components/projeto/referencias";
import { DadosProjeto } from "@/components/projeto/dados";
import { CronogramaProjeto } from "@/components/projeto/cronograma-projeto";
import { Relatorios } from "@/components/projeto/relatorios";
import { formatarData, diferencaDias, hojeIso } from "@/lib/datas";
import { horasDoProjeto, horasFmt } from "@/lib/horas";
import { avancoEtapa, avancoProjeto, entregaFinal, etapaAtrasada, etapaAtual, previstoProjeto } from "@/lib/projeto";
import { doisDigitos, statusEtapa, statusProjeto } from "@/lib/rotulos";
import { ancoraAbaProjeto, passoDoProjeto } from "@/lib/proximo-passo";
import { Abas, Botao, BotaoLink, Cabecalho, Cartao, Indicador, ProximoPasso, Vazio } from "@/components/ui";
import { IconeClientes, IconeRegistrar, IconeRelatorio } from "@/components/icones";

const abas = ["Cronograma", "Relatórios", "Plano de trabalho", "Visitas e horas", "Registros", "Referências", "Ficha", "Histórico"] as const;
type Aba = (typeof abas)[number];
const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function PaginaProjeto() {
  const { projeto, cliente, consultor, alterar } = useProjeto();
  const { empresa: slug } = useParams<{ empresa: string }>();
  const semPlano = projeto?.status === "aguardando_plano";
  const [aba, setAba] = useState<Aba>(semPlano ? "Plano de trabalho" : "Cronograma");
  // Cada clique em "Registrar" abre o formulário de novo (a contagem remonta o componente)
  const [registrar, setRegistrar] = useState(0);

  // #plano, #registrar, #referencias… no endereço abrem a aba certa. Lido
  // depois da navegação, porque o Next atualiza o hash depois de montar.
  useEffect(() => {
    const ler = () => {
      const ancora = window.location.hash.slice(1) as keyof typeof ancoraAbaProjeto;
      const a = ancoraAbaProjeto[ancora];
      if (a) setAba(a);
      if (ancora === "registrar") setRegistrar((n) => n + 1);
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

  const passo = passoDoProjeto(projeto);
  const et = etapaAtual(projeto);
  const avanco = avancoProjeto(projeto);
  const previsto = previstoProjeto(projeto);
  const horas = horasDoProjeto(projeto);
  const entrega = entregaFinal(projeto);
  const hoje = hojeIso();
  const base = `/${projeto.empresa}/projetos/${projeto.id}`;

  // Encerrar só depois que o SEBRAE aprovar todas as entregas
  const encerravel = projeto.status === "em_andamento" && projeto.etapas.every((e) => e.status === "aprovada");
  const encerrar = () => {
    if (confirm("Encerrar o projeto? Ele sai da lista de projetos em andamento; dá para reabrir depois."))
      alterar((p) => void (p.status = "encerrado"), { acao: "Projeto encerrado" });
  };
  const abrirRegistro = () => {
    setAba("Visitas e horas");
    setRegistrar((n) => n + 1);
  };

  const situacaoEtapa = et ? (et.status === "devolvida" ? "Devolvida" : etapaAtrasada(et) ? "Atrasada" : statusEtapa[et.status].rotulo) : null;
  const tomAvanco = previsto === null ? undefined : avanco >= previsto ? "ok" : previsto - avanco >= 10 ? "atencao" : undefined;
  const diasEntrega = entrega ? diferencaDias(hoje, entrega) : null;
  const proximoPasso = passo && (
    <ProximoPasso passo={passo} aoAgir={passo.href.endsWith("#plano") ? () => setAba("Plano de trabalho") : passo.encerrar ? encerrar : undefined} />
  );

  return (
    <>
      <Cabecalho
        migalhas={[{ rotulo: "Projetos", href: `/${projeto.empresa}` }, { rotulo: cliente.nomeFantasia || cliente.razaoSocial }]}
        titulo={cliente.nomeFantasia || cliente.razaoSocial}
        subtitulo={
          <>
            <p className="num break-words">
              {cliente.nomeFantasia ? `${cliente.razaoSocial} · ` : ""}Projeto HUB {projeto.numeroProjetoHub || "sem número"} · ficha{" "}
              {projeto.codigoFichaTecnica}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:flex sm:flex-wrap sm:gap-x-8">
              <div className="min-w-0">
                <dt className="text-[12px] text-tinta-2">Consultor</dt>
                <dd className="break-words font-semibold text-tinta">{consultor?.nome ?? "A definir"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-tinta-2">Início</dt>
                <dd className="num font-semibold text-tinta">{formatarData(projeto.etapas[0]?.dataInicio)}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-tinta-2">Fim previsto</dt>
                <dd className="num font-semibold text-tinta">{formatarData(entrega)}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-tinta-2">Situação</dt>
                <dd className="font-semibold text-azul">{statusProjeto[projeto.status]}</dd>
              </div>
            </dl>
          </>
        }
        abas={<Abas abas={abas} atual={aba} aoTrocar={setAba} naFaixa />}
      >
        <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
          {projeto.status !== "encerrado" && (
            <Botao onClick={abrirRegistro} className="px-2 sm:px-4">
              <IconeRegistrar className="h-5 w-5 shrink-0" />
              Registrar
            </Botao>
          )}
          <BotaoLink href={et ? `${base}/etapas/${et.ordem}#redacao` : `${base}#relatorios`} variante="secundario" className="px-2 sm:px-4">
            <IconeRelatorio className="h-5 w-5 shrink-0" />
            Relatório
          </BotaoLink>
          <BotaoLink href={`/${projeto.empresa}/clientes?editar=${cliente.id}&voltar=${projeto.id}`} variante="secundario" className="px-2 sm:px-4">
            <IconeClientes className="h-5 w-5 shrink-0" />
            Cliente
          </BotaoLink>
          {encerravel && (
            <Botao onClick={encerrar} className="col-span-3">
              Encerrar projeto
            </Botao>
          )}
          {projeto.status === "encerrado" && (
            <Botao variante="secundario" className="col-span-2" onClick={() => alterar((p) => void (p.status = "em_andamento"), { acao: "Projeto reaberto" })}>
              Reabrir projeto
            </Botao>
          )}
        </div>
      </Cabecalho>

      {aba === "Cronograma" && (
        <div className="space-y-4">
          <section aria-label="Resumo do projeto" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador
              rotulo="Avanço geral"
              valor={`${avanco}%`}
              detalhe={previsto === null ? "Sem plano de trabalho" : `Previsto hoje: ${previsto}%`}
              tom={tomAvanco}
            />
            <Indicador
              rotulo="Etapa atual"
              valor={<span className="block break-words text-[1.2rem] leading-tight sm:text-[1.35rem]">{et ? capitalizar(et.nome) : "Concluídas"}</span>}
              detalhe={et ? `Etapa ${doisDigitos(et.ordem)} · ${Math.round(avancoEtapa(et) * 100)}% · ${situacaoEtapa}` : "Todas as etapas enviadas"}
              tom={et?.status === "devolvida" ? "critico" : et && etapaAtrasada(et) ? "atencao" : undefined}
            />
            <Indicador rotulo="Horas registradas" valor={horasFmt(horas.realizadas)} detalhe={`de ${horas.previstas} h previstas`} />
            <Indicador
              rotulo={horas.visitasPrevistas ? "Visitas" : "Entrega final"}
              valor={horas.visitasPrevistas ? `${horas.visitas} de ${horas.visitasPrevistas}` : entrega ? formatarData(entrega).slice(0, 5) : "—"}
              detalhe={
                horas.visitasPrevistas
                  ? "visitas presenciais registradas"
                  : diasEntrega === null
                    ? "sem plano de trabalho"
                    : diasEntrega >= 0
                      ? `faltam ${diasEntrega} ${diasEntrega === 1 ? "dia" : "dias"}`
                      : `${-diasEntrega} dias depois do fim previsto`
              }
            />
          </section>
          {proximoPasso}
          <CronogramaProjeto projeto={projeto} aoEditar={() => setAba("Plano de trabalho")} />
        </div>
      )}
      {aba === "Relatórios" && (
        <div className="space-y-4">
          {proximoPasso}
          <Relatorios projeto={projeto} />
        </div>
      )}
      {aba === "Plano de trabalho" && <PlanoTrabalho projeto={projeto} />}
      {aba === "Visitas e horas" && <Visitas key={registrar} projeto={projeto} abrirNovo={registrar > 0} />}
      {aba === "Registros" && <Registros projeto={projeto} />}
      {aba === "Referências" && <Referencias projeto={projeto} />}
      {aba === "Ficha" && <DadosProjeto projeto={projeto} />}
      {aba === "Histórico" && (
        <Cartao className="px-4 py-1 sm:px-6">
          <ol className="max-w-3xl">
            {projeto.historico.map((h, i) => (
              <li
                key={i}
                className="grid grid-cols-[5.5rem_1fr] gap-x-4 border-b border-linha py-3.5 text-[15px] last:border-0 sm:grid-cols-[7.5rem_1fr] sm:gap-x-6"
              >
                <span className="num text-sm text-tinta-2">
                  {h.em.slice(0, 10).split("-").reverse().join("/")}
                  <span className="block">{h.em.slice(11, 16)}</span>
                </span>
                <span className="min-w-0 break-words">
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
