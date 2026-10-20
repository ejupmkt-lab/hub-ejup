"use client";

import Link from "next/link";
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
import { Conversa } from "@/components/projeto/conversa";
import { formatarData, diferencaDias, hojeIso } from "@/lib/datas";
import { horasDoProjeto, horasFmt } from "@/lib/horas";
import { avancoEtapa, avancoProjeto, entregaFinal, etapaAtrasada, etapaAtual, previstoProjeto, servicoDoProjeto } from "@/lib/projeto";
import { doisDigitos, statusEtapa, statusProjeto } from "@/lib/rotulos";
import { ancoraAbaProjeto, passoDoProjeto } from "@/lib/proximo-passo";
import { Abas, Botao, BotaoLink, Cabecalho, Cartao, Indicador, ProximoPasso, Vazio } from "@/components/ui";
import { IconeClientes, IconeRegistrar, IconeRelatorio } from "@/components/icones";

// Três abas para o dia a dia; o resto fica no "Mais"
const principais = ["Conversa", "Cronograma", "Entregas"] as const;
const secundarias = ["Ficha do projeto", "Tabelas do relatório", "Referências", "Horas e visitas", "Histórico"] as const;
type Aba = (typeof principais)[number] | (typeof secundarias)[number];
const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function PaginaProjeto() {
  const { projeto, cliente, consultor, alterar } = useProjeto();
  const { empresa: slug } = useParams<{ empresa: string }>();
  // Sem plano de trabalho, o primeiro passo é definir as datas
  const [aba, setAba] = useState<Aba>(projeto?.status === "aguardando_plano" ? "Cronograma" : "Conversa");
  const [menuMais, setMenuMais] = useState(false);
  // Cada "Registrar" traz a caixa da conversa à vista (a contagem avisa o componente)
  const [focar, setFocar] = useState(0);

  // #plano, #registrar, #ficha… no endereço abrem a aba certa. Lido
  // depois da navegação, porque o Next atualiza o hash depois de montar.
  useEffect(() => {
    const ler = () => {
      const ancora = window.location.hash.slice(1) as keyof typeof ancoraAbaProjeto;
      const a = ancoraAbaProjeto[ancora];
      if (a) setAba(a);
      if (ancora === "registrar") setFocar((n) => n + 1);
      if (ancora === "plano") setTimeout(() => document.getElementById("plano")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
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
  const servico = servicoDoProjeto(projeto);
  const nomeCliente = cliente.nomeFantasia || cliente.razaoSocial;

  // Encerrar só depois que o SEBRAE aprovar todas as entregas
  const encerravel = projeto.status === "em_andamento" && projeto.etapas.every((e) => e.status === "aprovada");
  const encerrar = () => {
    if (confirm("Encerrar o projeto? Ele sai da lista de projetos em andamento; dá para reabrir depois."))
      alterar((p) => void (p.status = "encerrado"), { acao: "Projeto encerrado" });
  };
  const irPara = (a: Aba) => {
    setAba(a);
    setMenuMais(false);
  };
  const abrirPlano = () => {
    setAba("Cronograma");
    setTimeout(() => document.getElementById("plano")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const registrar = () => {
    setAba("Conversa");
    setFocar((n) => n + 1);
  };

  const situacaoEtapa = et ? (et.status === "devolvida" ? "Devolvida" : etapaAtrasada(et) ? "Atrasada" : statusEtapa[et.status].rotulo) : null;
  const tomAvanco = previsto === null ? undefined : avanco >= previsto ? "ok" : previsto - avanco >= 10 ? "atencao" : undefined;
  const diasEntrega = entrega ? diferencaDias(hoje, entrega) : null;
  const proximoPasso = passo && <ProximoPasso passo={passo} aoAgir={passo.href.endsWith("#plano") ? abrirPlano : passo.encerrar ? encerrar : undefined} />;
  const abaMais = (secundarias as readonly string[]).includes(aba) ? aba : "Mais";

  return (
    <>
      <Cabecalho
        migalhas={[
          { rotulo: "Projetos", href: `/${projeto.empresa}` },
          { rotulo: nomeCliente, href: `/${projeto.empresa}/clientes/${cliente.id}` },
          { rotulo: servico },
        ]}
        titulo={nomeCliente}
        subtitulo={
          <>
            <p className="num break-words">
              <span className="font-semibold text-tinta">{servico}</span> · Projeto HUB {projeto.numeroProjetoHub || "sem número"} · ficha{" "}
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
        abas={
          <div className="relative">
            <Abas
              abas={[...principais, abaMais]}
              atual={aba === abaMais ? abaMais : aba}
              aoTrocar={(a) => (a === abaMais ? setMenuMais(!menuMais) : irPara(a as Aba))}
              extra={{ [abaMais]: <span aria-hidden>▾</span> }}
              naFaixa
            />
            {menuMais && (
              <>
                <div aria-hidden className="fixed inset-0 z-30" onClick={() => setMenuMais(false)} />
                <ul className="absolute right-0 top-full z-40 mt-2 w-60 rounded-[var(--radius-bloco)] border border-linha bg-folha p-1.5 shadow-lg">
                  {secundarias.map((s) => (
                    <li key={s}>
                      <button
                        onClick={() => irPara(s)}
                        className={`w-full rounded-[var(--radius-campo)] px-3 py-2.5 text-left text-[15px] ${s === aba ? "bg-azul-claro font-semibold text-azul" : "text-tinta hover:bg-pedra"}`}
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        }
      >
        <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
          {projeto.status !== "encerrado" && (
            <Botao onClick={registrar} className="px-2 sm:px-4">
              <IconeRegistrar className="h-5 w-5 shrink-0" />
              Registrar
            </Botao>
          )}
          <Botao variante="secundario" onClick={() => irPara("Entregas")} className="px-2 sm:px-4">
            <IconeRelatorio className="h-5 w-5 shrink-0" />
            Entregas
          </Botao>
          <BotaoLink href={`/${projeto.empresa}/clientes/${cliente.id}`} variante="secundario" className="px-2 sm:px-4">
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

      {aba === "Conversa" && (
        <div className="space-y-4">
          {passo && projeto.status !== "encerrado" && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[var(--radius-campo)] bg-azul-claro/70 px-3 py-2 text-sm text-tinta">
              <span className="font-semibold text-azul">Próximo passo:</span>
              <span className="min-w-0">{passo.texto}</span>
            </p>
          )}
          <Conversa projeto={projeto} focar={focar} />
        </div>
      )}

      {aba === "Cronograma" && (
        <div className="space-y-4">
          {projeto.planoFechadoEm && (
            <section aria-label="Resumo do projeto" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Indicador rotulo="Avanço geral" valor={`${avanco}%`} detalhe={previsto === null ? "Sem plano de trabalho" : `Previsto hoje: ${previsto}%`} tom={tomAvanco} />
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
          )}
          {proximoPasso}
          {projeto.planoFechadoEm && <CronogramaProjeto projeto={projeto} aoEditar={abrirPlano} />}
          <div id="plano" className="scroll-mt-4">
            <PlanoTrabalho projeto={projeto} />
          </div>
        </div>
      )}
      {aba === "Entregas" && (
        <div className="space-y-4">
          {proximoPasso}
          <Relatorios projeto={projeto} />
        </div>
      )}
      {aba === "Ficha do projeto" && <DadosProjeto projeto={projeto} />}
      {aba === "Tabelas do relatório" && <Registros projeto={projeto} />}
      {aba === "Referências" && <Referencias projeto={projeto} />}
      {aba === "Horas e visitas" && (
        <div className="space-y-4">
          <p className="text-sm text-tinta-2">
            O SEBRAE confere as horas e as visitas contra a ficha técnica. Elas entram aqui sozinhas quando você conta a visita na{" "}
            <button onClick={registrar} className="font-semibold text-azul hover:underline">
              conversa
            </button>
            ; nesta tela dá para conferir, corrigir ou lançar à mão.
          </p>
          <Visitas projeto={projeto} />
        </div>
      )}
      {aba === "Histórico" && (
        <Cartao className="px-4 py-1 sm:px-6">
          <ol className="max-w-3xl">
            {projeto.historico.map((h, i) => (
              <li key={i} className="grid grid-cols-[5.5rem_1fr] gap-x-4 border-b border-linha py-3.5 text-[15px] last:border-0 sm:grid-cols-[7.5rem_1fr] sm:gap-x-6">
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
      {aba !== "Conversa" && (
        <p className="mt-6 text-center text-[13px] text-tinta-2">
          Outros projetos deste cliente:{" "}
          <Link href={`/${projeto.empresa}/clientes/${cliente.id}`} className="font-semibold text-azul hover:underline">
            ver a página do cliente
          </Link>
        </p>
      )}
    </>
  );
}
