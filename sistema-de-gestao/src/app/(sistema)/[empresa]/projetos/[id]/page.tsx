"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useProjeto } from "@/components/projeto/use-projeto";
import { useExcluirProjeto } from "@/components/projeto/excluir-projeto";
import { MoverProjeto } from "@/components/projeto/mover-projeto";
import { ModalExclusao } from "@/components/projeto/modal-exclusao";
import { PlanoTrabalho } from "@/components/projeto/plano-trabalho";
import { DadosProjeto } from "@/components/projeto/dados";
import { CronogramaProjeto } from "@/components/projeto/cronograma-projeto";
import { Relatorios } from "@/components/projeto/relatorios";
import { Conversa } from "@/components/projeto/conversa";
import { LinhaDoHub } from "@/components/projeto/linha-hub";
import { guardarProjetoNaBiblioteca, useAcoesEtapa } from "@/components/projeto/acoes-etapa";
import { antesDaContratacao, avisoFinalizarAntecipado, faseDoProjeto, fases, mudarHub, passoHubDoProjeto, passosHub, registroHub, textoPlanoAjustado } from "@/lib/fase";
import type { PassoHub } from "@/lib/dados/tipos";
import { registrarEvento, useAcesso } from "@/lib/dados/store";
import { FinanceiroDoProjeto } from "@/components/financeiro/financeiro-projeto";
import { formatarData, diferencaDias, hojeIso } from "@/lib/datas";
import {
  codigoHub,
  avancoEtapa,
  avancoProjeto,
  entregaFinal,
  etapaAtual,
  previstoProjeto,
  desvioDoPlano,
  entregueAlemDoPlano,
  servicoDoProjeto,
  horasDoProjeto,
  horasFmt,
  situacaoProjeto,
  situacaoDaEtapa,
  textoDiasAlemDoPlano,
} from "@/lib/projeto";
import { doisDigitos, } from "@/lib/rotulos";
import { ancoraAbaProjeto, passoDoProjeto } from "@/lib/proximo-passo";
import { AVISO_DA_EXTENSAO } from "@/lib/hub-extensao";
import { Abas, Barra, Botao, BotaoLink, Cabecalho, Cartao, Chip, ProximoPasso, Vazio } from "@/components/ui";
import { nomeDoCliente } from "@/lib/campos-cliente";

// Dados (o projeto no HUB, as etapas e a ficha) abre primeiro; o Desenvolvimento é a conversa com a IA.
// O processo (ficha, textos, referências) fica no serviço; aqui, só o que é do projeto.
const abasComuns = ["Dados", "Desenvolvimento", "Plano de trabalho", "Entregas", "Histórico"] as const;
const abasComFinanceiro = ["Dados", "Desenvolvimento", "Plano de trabalho", "Entregas", "Financeiro", "Histórico"] as const;
type Aba = (typeof abasComFinanceiro)[number];
const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function PaginaProjeto() {
  const { projeto, cliente, consultor, alterar } = useProjeto();
  const { usuario } = useAcesso();
  const abas = usuario.veFinanceiro ? abasComFinanceiro : abasComuns;
  const { mudarStatus } = useAcoesEtapa();
  const { excluirProjeto, excluindo, confirmando, cancelarExclusao, confirmarExclusao, aviso: avisoExclusao, podeExcluir } = useExcluirProjeto(projeto);
  const { empresa: slug } = useParams<{ empresa: string }>();
  // O projeto abre sempre nos Dados
  const [aba, setAba] = useState<Aba>("Dados");
  const abaVista: Aba = aba === "Financeiro" && !usuario.veFinanceiro ? "Dados" : aba;
  // Entrega (etapa) que um atalho pediu para abrir: #etapa-2, "Resolver" no próximo passo…
  const [entregaAberta, setEntregaAberta] = useState<number | undefined>(undefined);
  // "Ler agora" na extensão com outra aba aberta: volta aos Dados, onde o painel de importar do HUB abre sozinho
  const [chegouDoHub, setChegouDoHub] = useState(false);
  useEffect(() => {
    const ouvir = (ev: MessageEvent) => {
      if (ev.source !== window || ev.origin !== window.location.origin || ev.data?.tipo !== AVISO_DA_EXTENSAO) return;
      setChegouDoHub(true);
      setAba("Dados");
    };
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, []);
  // Atalho "Registrar" do menu (#registrar) traz a caixa de mensagem à vista
  const [focar, setFocar] = useState(0);

  // #plano, #desenvolvimento, #ficha… no endereço abrem a aba certa. Lido
  // depois da navegação, porque o Next atualiza o hash depois de montar.
  useEffect(() => {
    const ler = () => {
      const ancora = window.location.hash.slice(1) as keyof typeof ancoraAbaProjeto;
      const a = ancoraAbaProjeto[ancora];
      if (a) setAba(a);
      // #etapa-2: a entrega da etapa 2, nas Entregas
      const etapa = /^etapa-(\d+)$/.exec(ancora)?.[1];
      if (etapa) {
        setAba("Entregas");
        setEntregaAberta(Number(etapa));
        setTimeout(() => document.getElementById(`entrega-${etapa}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
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
  const nomeCliente = nomeDoCliente(cliente);

  // Próximo passo do HUB registrado direto pelo botão do próximo passo, com a data de hoje
  const registrarHub = (para: PassoHub) => {
    const cedo = para === "finalizado" ? avisoFinalizarAntecipado(projeto) : null;
    if (cedo && !confirm(`${cedo}\n\nRegistrar a finalização mesmo assim?`)) return;
    alterar(
      (p) => {
        const inicio = p.etapas[0]?.dataInicio;
        mudarHub(p, para, hojeIso());
        if (para === "execucao" && p.etapas[0]?.dataInicio !== inicio)
          registrarEvento(p, "Sistema", textoPlanoAjustado(p));
      },
      { acao: `HUB: ${passosHub[passoHubDoProjeto(projeto)].acao ?? "passo registrado"}`, detalhe: registroHub[para](hojeIso()) },
    );
    if (para === "concluido") void guardarProjetoNaBiblioteca(projeto, cliente).then((erro) => erro && alert(erro));
  };
  const irPara = (a: Aba) => setAba(a);
  const abrirPlano = () => {
    setAba("Plano de trabalho");
    setTimeout(() => document.getElementById("plano")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const desenvolver = () => {
    setAba("Desenvolvimento");
    setFocar((n) => n + 1);
  };

  const fase = faseDoProjeto(projeto);
  const preContrato = antesDaContratacao(projeto);
  const situacaoEtapa = et ? situacaoDaEtapa(et).rotulo : null;
  const tomAvanco = previsto === null ? undefined : avanco >= previsto ? "ok" : previsto - avanco >= 10 ? "atencao" : undefined;
  const diasEntrega = entrega ? diferencaDias(hoje, entrega) : null;
  const abrirEntrega = (ordem: number) => {
    setAba("Entregas");
    setEntregaAberta(ordem);
    setTimeout(() => document.getElementById(`entrega-${ordem}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };
  const agir = (x: NonNullable<typeof passo>) => {
    if (x.hub) return () => registrarHub(x.hub!);
    if (x.acao && x.etapa) return () => mudarStatus(x.etapa!.ordem, x.acao!) || abrirEntrega(x.etapa!.ordem);
    if (x.href.endsWith("#plano")) return abrirPlano;
    if (x.href.endsWith("#desenvolvimento")) return desenvolver;
    const etapa = /#etapa-(\d+)$/.exec(x.href)?.[1];
    if (etapa) return () => abrirEntrega(Number(etapa));
    return undefined;
  };
  const proximoPasso = passo && <ProximoPasso passo={passo} aoAgir={agir(passo)} />;

  const situacao = situacaoProjeto(projeto);
  // O mesmo desvio em relação ao plano do HUB que a situação já diz (e, nos concluídos, a entrega final)
  const alemDoPlano = preContrato ? 0 : desvioDoPlano(projeto);
  const entregueAlem = entregueAlemDoPlano(projeto);
  const chaveEtapa = et ? situacaoDaEtapa(et).chave : null;
  const corEtapa = chaveEtapa === "devolvida" ? "text-vermelho" : chaveEtapa === "atrasada" ? "text-laranja" : "text-tinta-2";
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
        selo={
          <span className="flex flex-wrap items-center gap-2">
            <Chip tom={situacao.tom} icone={<span aria-hidden className="size-1.5 rounded-full bg-current" />}>
              {situacao.rotulo}
            </Chip>
            {alemDoPlano > 0 && situacao.rotulo !== textoDiasAlemDoPlano(alemDoPlano) && (
              <span title="Passou do fim previsto no plano do HUB (o orçamento). O atraso da execução conta a partir do pagamento.">
                <Chip tom="atencao">{textoDiasAlemDoPlano(alemDoPlano)}</Chip>
              </span>
            )}
            {entregueAlem > 0 && (
              <span title="A última etapa foi enviada no HUB depois do fim previsto no plano do HUB.">
                <Chip tom="atencao">{`entregue ${textoDiasAlemDoPlano(entregueAlem)}`}</Chip>
              </span>
            )}
          </span>
        }
        subtitulo={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-medium text-tinta">{servico}</span>
            <span className="flex flex-wrap gap-1.5">
              <CodigoHub codigo={codigoHub(projeto)} />
              <Etiqueta rotulo="Ficha" valor={projeto.codigoFichaTecnica} />
            </span>
          </div>
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
                    {preContrato ? "antes da contratação" : projeto.status === "encerrado" ? "projeto entregue" : previsto === null ? "sem plano de trabalho" : `previsto hoje ${previsto}%`}
                  </span>
                </p>
                <div className="mt-2">
                  <Barra valor={avanco} total={100} marca={previsto} tom={tomAvanco === "atencao" ? "atencao" : "andamento"} />
                </div>
              </div>
              <div className={celula}>
                {fase !== "execucao" ? (
                  <>
                    <p className="text-[12px] font-semibold text-tinta-2">No HUB (etapa {fases[fase].numero} de 6)</p>
                    <p className="mt-0.5 break-words font-semibold leading-snug text-tinta">{fases[fase].rotulo}</p>
                    <p className="text-[13px] text-tinta-2">{fase === "concluido" ? "projeto concluído" : passosHub[passoHubDoProjeto(projeto)].rotulo.toLowerCase()}</p>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] font-semibold text-tinta-2">
                      Etapa atual{et ? ` (${et.ordem} de ${projeto.etapas.length})` : ""}
                    </p>
                    <p className="mt-0.5 break-words font-semibold leading-snug text-tinta">
                      {et ? `${doisDigitos(et.ordem)} · ${capitalizar(et.nome)}` : "Todas enviadas"}
                    </p>
                    {et && (
                      <p className={`num text-[13px] ${corEtapa}`}>
                        {Math.round(avancoEtapa(et) * 100)}% · {situacaoEtapa}
                      </p>
                    )}
                  </>
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
                  {horasFmt(horas.cumpridas)} de {horas.previstas} h
                </p>
                <p className="num text-[13px] text-tinta-2">
                  {horas.etapasEnviadas} de {horas.etapas} {horas.etapas === 1 ? "etapa enviada" : "etapas enviadas"}
                </p>
              </div>
              <div className={celula}>
                <p className="text-[12px] font-semibold text-tinta-2">Consultor</p>
                <p className="mt-0.5 break-words font-semibold leading-snug text-tinta">{consultor?.nome ?? "A definir"}</p>
              </div>
            </Cartao>
            <div className="relative mt-5" data-faixa-abas>
              <Abas abas={abas} atual={abaVista} aoTrocar={(a) => irPara(a)} naFaixa gradeNoCelular />
            </div>
          </>
        }
      >
        <MoverProjeto projeto={projeto} />
        {podeExcluir && (
          <Botao variante="perigo" tamanho="pequeno" onClick={excluirProjeto} disabled={excluindo}>
            {excluindo ? "Excluindo…" : "Excluir projeto"}
          </Botao>
        )}
      </Cabecalho>

      {confirmando && <ModalExclusao titulo="Excluir projeto" aviso={avisoExclusao} excluindo={excluindo} aoConfirmar={() => void confirmarExclusao()} aoCancelar={cancelarExclusao} />}

      {abaVista === "Dados" && (
        <div className="space-y-6">
          <LinhaDoHub projeto={projeto} aoAbrirPlano={abrirPlano} abrirImportacao={chegouDoHub} />
          <DadosProjeto projeto={projeto} />
        </div>
      )}

      {abaVista === "Desenvolvimento" && <Conversa projeto={projeto} passo={passo?.texto} focar={focar} />}

      {abaVista === "Plano de trabalho" && (
        <div className="space-y-4">
          {!projeto.planoFechadoEm && projeto.status !== "encerrado" && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[var(--radius-bloco)] border border-azul/20 bg-azul-claro px-4 py-4 sm:px-5">
              <p className="min-w-0 flex-1 basis-64 text-[15px] text-tinta">
                <span className="font-semibold">O plano de trabalho ainda não foi definido.</span> Diga à IA quando o projeto começa e termina, e ela divide as
                etapas pela carga horária. Ou preencha as datas abaixo.
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
      {abaVista === "Entregas" && (
        <div className="space-y-4">
          {proximoPasso}
          <Relatorios projeto={projeto} aoDesenvolver={desenvolver} abrirOrdem={entregaAberta} />
        </div>
      )}
      {abaVista === "Financeiro" && usuario.veFinanceiro && <FinanceiroDoProjeto projeto={projeto} nomeCliente={nomeCliente} />}
      {abaVista === "Histórico" && (
        <Cartao className="px-4 py-1 sm:px-6">
          <ol className="max-w-3xl">
            {projeto.historico.map((h, i) => (
              <li
                key={i}
                className="grid grid-cols-[5.5rem_1fr] gap-x-4 border-b border-linha py-3.5 text-[15px] last:border-0 sm:grid-cols-[7.5rem_1fr] sm:gap-x-6"
              >
                <span className="num text-sm text-tinta-2">
                  {h.em.slice(0, 10).split("-").reverse().join("/")}
                  {h.em.slice(11, 16) !== "00:00" && <span className="block">{h.em.slice(11, 16)}</span>}
                </span>
                <span className="min-w-0 break-words">
                  <span className="text-tinta">{h.acao}</span>
                  <span className="text-tinta-2">, por {h.usuario}</span>
                  {h.detalhe && (
                    <ul className="mt-1 space-y-0.5 text-sm text-tinta-2">
                      {h.detalhe.split("\n").filter((l) => l.trim()).map((l, j) => (
                        <li key={j}>{l}</li>
                      ))}
                    </ul>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </Cartao>
      )}
      {aba !== "Desenvolvimento" && aba !== "Dados" && (
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

const etiqueta = "inline-flex items-center gap-1.5 rounded-md border border-linha bg-folha px-2 py-1 text-[13px] leading-none";

function Etiqueta({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <span className={etiqueta}>
      <span className="text-tinta-2">{rotulo}</span>
      <span className="num font-semibold text-tinta">{valor || "—"}</span>
    </span>
  );
}

// Código do pedido no HUB, que o consultor cola no HUB: um clique copia
function CodigoHub({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  if (!codigo) return <Etiqueta rotulo="HUB" valor="sem número" />;
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // sem permissão para copiar: o código continua visível
    }
  };
  return (
    <button type="button" onClick={() => void copiar()} title="Copiar o código do HUB" className={`${etiqueta} transition-colors hover:border-linha-forte hover:bg-pedra`}>
      <span className="text-tinta-2">HUB</span>
      <span className="num font-semibold text-tinta">{codigo}</span>
      <span aria-live="polite" className={`text-[12px] ${copiado ? "text-verde" : "text-tinta-2"}`}>
        {copiado ? "copiado" : (
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" />
            <path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5" />
          </svg>
        )}
      </span>
    </button>
  );
}
