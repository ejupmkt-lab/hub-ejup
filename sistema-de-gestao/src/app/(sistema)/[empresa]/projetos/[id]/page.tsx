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
import { avancoEtapa, avancoProjeto, entregaFinal, etapaAtrasada, etapaAtual, previstoProjeto, servicoDoProjeto, situacaoProjeto } from "@/lib/projeto";
import { doisDigitos, statusEtapa } from "@/lib/rotulos";
import { ancoraAbaProjeto, passoDoProjeto } from "@/lib/proximo-passo";
import { Abas, Barra, Botao, BotaoLink, Cabecalho, Cartao, Chip, ProximoPasso, Vazio } from "@/components/ui";

// Três abas para o dia a dia; o resto fica no "Mais"
const principais = ["Desenvolvimento", "Cronograma", "Entregas"] as const;
const secundarias = ["Ficha do projeto", "Tabelas do relatório", "Referências", "Horas e visitas", "Histórico"] as const;
type Aba = (typeof principais)[number] | (typeof secundarias)[number];
const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function PaginaProjeto() {
  const { projeto, cliente, consultor, alterar } = useProjeto();
  const { empresa: slug } = useParams<{ empresa: string }>();
  // O projeto abre sempre no Desenvolvimento (a conversa com a IA)
  const [aba, setAba] = useState<Aba>("Desenvolvimento");
  const [menuMais, setMenuMais] = useState(false);
  // Atalho "Registrar" do menu (#registrar) traz a caixa de mensagem à vista
  const [focar, setFocar] = useState(0);

  // #plano, #desenvolvimento, #ficha… no endereço abrem a aba certa. Lido
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
  const desenvolver = () => {
    setAba("Desenvolvimento");
    setFocar((n) => n + 1);
  };

  const situacaoEtapa = et ? (et.status === "devolvida" ? "Devolvida" : etapaAtrasada(et) ? "Atrasada" : statusEtapa[et.status].rotulo) : null;
  const tomAvanco = previsto === null ? undefined : avanco >= previsto ? "ok" : previsto - avanco >= 10 ? "atencao" : undefined;
  const diasEntrega = entrega ? diferencaDias(hoje, entrega) : null;
  const proximoPasso = passo && (
    <ProximoPasso passo={passo} aoAgir={passo.href.endsWith("#desenvolvimento") ? desenvolver : passo.encerrar ? encerrar : undefined} />
  );
  const abaMais = (secundarias as readonly string[]).includes(aba) ? aba : "Mais";

  const situacao = situacaoProjeto(projeto);
  const corEtapa = et?.status === "devolvida" ? "text-vermelho" : et && etapaAtrasada(et) ? "text-laranja" : "text-tinta-2";
  const celula = "min-w-0 bg-folha px-4 py-3.5 sm:px-5";

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
          <p className="num flex flex-wrap items-center gap-x-2 gap-y-1.5 break-words">
            <span className="font-semibold text-tinta">{servico}</span>
            <span aria-hidden>·</span>
            <span>HUB {projeto.numeroProjetoHub || "sem número"}</span>
            <span aria-hidden>·</span>
            <span>ficha {projeto.codigoFichaTecnica}</span>
            <Chip tom={situacao.tom}>{situacao.rotulo}</Chip>
          </p>
        }
        abas={
          <>
            {/* Resumo do projeto, o mesmo em todas as abas */}
            <Cartao className="grid grid-cols-2 gap-px overflow-hidden bg-linha lg:grid-cols-[1.35fr_1.25fr_1fr_1fr_1fr]">
              <div className={`${celula} col-span-2 lg:col-span-1`}>
                <p className="text-[12px] font-semibold text-tinta-2">Avanço</p>
                <p className="num mt-0.5 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-2xl font-bold text-tinta">{avanco}%</span>
                  <span className={`text-[13px] ${tomAvanco === "atencao" ? "text-laranja" : "text-tinta-2"}`}>
                    {previsto === null ? "sem cronograma" : `previsto hoje ${previsto}%`}
                  </span>
                </p>
                <div className="mt-2">
                  <Barra valor={avanco} total={100} marca={previsto} tom={tomAvanco === "atencao" ? "atencao" : "andamento"} />
                </div>
              </div>
              <div className={celula}>
                <p className="text-[12px] font-semibold text-tinta-2">Etapa atual</p>
                <p className="mt-0.5 break-words font-semibold leading-snug text-tinta">
                  {et ? `${doisDigitos(et.ordem)} · ${capitalizar(et.nome)}` : projeto.status === "encerrado" ? "Encerrado" : "Todas enviadas"}
                </p>
                {et && (
                  <p className={`num text-[13px] ${corEtapa}`}>
                    {Math.round(avancoEtapa(et) * 100)}% · {situacaoEtapa}
                  </p>
                )}
              </div>
              <div className={celula}>
                <p className="text-[12px] font-semibold text-tinta-2">Período</p>
                {projeto.planoFechadoEm ? (
                  <>
                    <p className="num mt-0.5 font-semibold leading-snug text-tinta">
                      {formatarData(projeto.etapas[0]?.dataInicio)} a {formatarData(entrega)}
                    </p>
                    {diasEntrega !== null && projeto.status !== "encerrado" && (
                      <p className={`num text-[13px] ${diasEntrega < 0 ? "text-laranja" : "text-tinta-2"}`}>
                        {diasEntrega >= 0 ? `faltam ${diasEntrega} ${diasEntrega === 1 ? "dia" : "dias"}` : `${-diasEntrega} dias após o fim`}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-0.5 font-semibold leading-snug text-tinta">A definir</p>
                )}
              </div>
              <div className={celula}>
                <p className="text-[12px] font-semibold text-tinta-2">Horas</p>
                <p className="num mt-0.5 font-semibold leading-snug text-tinta">
                  {horasFmt(horas.realizadas)} de {horas.previstas} h
                </p>
                {horas.visitasPrevistas ? (
                  <p className="num text-[13px] text-tinta-2">
                    {horas.visitas} de {horas.visitasPrevistas} visitas
                  </p>
                ) : null}
              </div>
              <div className={celula}>
                <p className="text-[12px] font-semibold text-tinta-2">Consultor</p>
                <p className="mt-0.5 break-words font-semibold leading-snug text-tinta">{consultor?.nome ?? "A definir"}</p>
              </div>
            </Cartao>
            {(encerravel || projeto.status === "encerrado") && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {encerravel && <Botao onClick={encerrar}>Encerrar projeto</Botao>}
                {projeto.status === "encerrado" && (
                  <Botao variante="secundario" onClick={() => alterar((p) => void (p.status = "em_andamento"), { acao: "Projeto reaberto" })}>
                    Reabrir projeto
                  </Botao>
                )}
              </div>
            )}
            <div className="relative mt-5">
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
          </>
        }
      />

      {aba === "Desenvolvimento" && <Conversa projeto={projeto} passo={passo?.texto} focar={focar} />}

      {aba === "Cronograma" && (
        <div className="space-y-4">
          {!projeto.planoFechadoEm && projeto.status !== "encerrado" && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[var(--radius-bloco)] border border-azul/20 bg-azul-claro px-4 py-4 sm:px-5">
              <p className="min-w-0 flex-1 basis-64 text-[15px] text-tinta">
                <span className="font-semibold">O cronograma ainda não foi definido.</span> Diga à IA quando o projeto começa e termina, e ela divide as etapas
                pela carga horária. Ou preencha as datas abaixo.
              </p>
              <Botao onClick={desenvolver} className="w-full sm:w-auto">
                Definir com a IA
              </Botao>
            </div>
          )}
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
            O SEBRAE confere as horas e as visitas contra a ficha técnica. Elas entram aqui sozinhas quando você conta a visita no{" "}
            <button onClick={desenvolver} className="font-semibold text-azul hover:underline">
              Desenvolvimento
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
      {aba !== "Desenvolvimento" && (
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
