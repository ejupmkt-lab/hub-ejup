"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useProjeto } from "@/components/projeto/use-projeto";
import { AjudaFormatacao } from "@/components/projeto/ajuda-formatacao";
import { Evidencias, baixarImagens } from "@/components/projeto/evidencias";
import { RelatorioAssinado, abrirAssinado } from "@/components/projeto/assinado";
import { Visitas } from "@/components/projeto/visitas";
import { horasFmt, registrosDaEtapa } from "@/lib/horas";
import { secoesAntes, secoesDepois, todasSecoes, verificarCompletude, type DefSecao } from "@/lib/relatorio/secoes";
import { MARCA_COMPLETAR, preencherVazios, textoPadraoSecao } from "@/lib/relatorio/padroes";
import { gerarDocx } from "@/lib/relatorio/docx";
import { periodoCurto } from "@/lib/datas";
import { doisDigitos, statusEtapa, type StatusEtapa } from "@/lib/rotulos";
import { progressoAtividades, situacaoPrazo } from "@/lib/projeto";
import { useEstado } from "@/lib/dados/store";
import type { Etapa } from "@/lib/dados/tipos";
import { Abas, Barra, Botao, BotaoLink, Cabecalho, Campo, ProximoPasso, Selo, Status, Vazio } from "@/components/ui";
import { abaDaPendencia, ancoraAba, ancoraProjetoDaPendencia, passoDaEtapa } from "@/lib/proximo-passo";
import { automatizarEtapa, bloqueioStatus, fluxoEtapa } from "@/lib/regras-etapa";
import { supabaseNavegador } from "@/lib/supabase/navegador";

const abas = ["Checklist", "Visitas e horas", "Redação do relatório", "Entregáveis", "Fechamento"] as const;
type Aba = (typeof abas)[number];

// Caminho normal de uma etapa; "devolvida" fica fora da sequência
const fluxo = fluxoEtapa;

const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function PaginaEtapa() {
  const { ordem } = useParams<{ ordem: string }>();
  const { projeto, cliente, consultor, alterar } = useProjeto();
  const { estado, salvarAgora } = useEstado();
  const [redigindo, setRedigindo] = useState<string | null>(null); // "todas" ou a chave da seção
  const [aba, setAba] = useState<Aba>("Checklist");
  const [gerando, setGerando] = useState(false);
  const passosRef = useRef<HTMLOListElement>(null);

  // A aba vem do endereço (#checklist, #redacao…), lido depois da navegação,
  // porque o Next atualiza o hash só depois de montar a página
  useEffect(() => {
    const ler = () => {
      const ancora = window.location.hash.slice(1);
      const a = (Object.keys(ancoraAba) as Aba[]).find((x) => ancoraAba[x] === ancora);
      setAba(a ?? "Checklist");
    };
    const t = setTimeout(ler, 0);
    window.addEventListener("hashchange", ler);
    return () => {
      clearTimeout(t);
      window.removeEventListener("hashchange", ler);
    };
  }, [ordem]);

  // No celular, a sequência de status rola até o status atual
  useEffect(() => {
    passosRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [ordem, projeto?.etapas]);

  if (!projeto || !cliente) return <NaoEncontrado />;
  const etapa = projeto.etapas.find((e) => e.ordem === Number(ordem));
  if (!etapa) return <NaoEncontrado projeto={`/${projeto.empresa}/projetos/${projeto.id}`} />;

  const empresa = estado.empresas.find((e) => e.slug === projeto.empresa)!;
  const pendencias = verificarCompletude(projeto, etapa);
  const sit = projeto.planoFechadoEm && projeto.status !== "encerrado" ? situacaoPrazo(etapa) : null;
  const encerrado = projeto.status === "encerrado";
  const prog = progressoAtividades(etapa);
  const horasEtapa = registrosDaEtapa(projeto, etapa.ordem).reduce((a, r) => a + r.horas, 0);
  const anterior = projeto.etapas.find((e) => e.ordem === etapa.ordem - 1);
  const proxima = projeto.etapas.find((e) => e.ordem === etapa.ordem + 1);
  const base = `/${projeto.empresa}/projetos/${projeto.id}`;

  // Toda alteração passa por aqui; o status avança sozinho nos pontos óbvios
  // (regras em lib/regras-etapa)
  const mudarEtapa = (fn: (e: Etapa) => void, evento?: { acao: string; detalhe?: string }) =>
    alterar((p) => {
      const e = p.etapas.find((x) => x.ordem === etapa.ordem)!;
      fn(e);
      automatizarEtapa(p, e);
    }, evento);

  const usarPadroes = () =>
    mudarEtapa((x) => void preencherVazios(projeto, x, cliente, todasSecoes.map((d) => d.chave)), { acao: `Etapa ${doisDigitos(etapa.ordem)}: textos-padrão aplicados` });
  const vazias = todasSecoes.filter((d) => d.obrigatoria(etapa) && !(etapa.secoes[d.chave] ?? "").trim()).length + etapa.entregaveis.filter((x) => x.tipo === "entregavel" && !x.conteudo.trim()).length;

  const bloqueio = (s: StatusEtapa) => bloqueioStatus(projeto, etapa, s);

  // Escolha manual do status: vale o que a pessoa clicou, sem automação.
  // Voltar de uma devolução descarta as assinaturas e o PDF antigos.
  const definirStatus = (s: StatusEtapa) => {
    if (s === "devolvida" && !confirm("Registrar que o SEBRAE devolveu esta entrega para ajuste?")) return;
    const retomando = etapa.status === "devolvida" && s === "em_redacao";
    if (
      retomando &&
      (etapa.assinaturaConsultor || etapa.assinaturaCliente || etapa.relatorioAssinado) &&
      !confirm("O relatório vai mudar, então as datas de assinatura e o PDF assinado anterior serão descartados. Continuar?")
    )
      return;
    const pdfAntigo = retomando ? etapa.relatorioAssinado?.caminho : undefined;
    alterar(
      (p) => {
        const e = p.etapas.find((x) => x.ordem === etapa.ordem)!;
        e.status = s;
        if (retomando) {
          e.assinaturaConsultor = null;
          e.assinaturaCliente = null;
          e.relatorioAssinado = null;
        }
      },
      { acao: `Etapa ${doisDigitos(etapa.ordem)}: ${statusEtapa[s].rotulo.toLowerCase()}` },
    );
    if (pdfAntigo) void supabaseNavegador().storage.from("evidencias").remove([pdfAntigo]);
  };

  // Redação com IA: grava o que estiver pendente (o servidor lê do banco),
  // pede as seções e aplica o texto devolvido
  const redigir = async (chaves: string[], qual: string) => {
    setRedigindo(qual);
    try {
      await salvarAgora();
      const r = await fetch("/api/redigir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projetoId: projeto.id, etapa: etapa.ordem, secoes: chaves }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erro ?? "Não foi possível redigir agora.");
      const novas = d.secoes as { chave: string; texto: string }[];
      mudarEtapa(
        (x) => {
          for (const n of novas) x.secoes[n.chave] = n.texto;
        },
        { acao: `Etapa ${doisDigitos(etapa.ordem)}: ${novas.length === 1 ? "seção redigida" : `${novas.length} seções redigidas`} com IA` },
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não foi possível redigir agora.");
    } finally {
      setRedigindo(null);
    }
  };
  const anotacoesDaEtapa = registrosDaEtapa(projeto, etapa.ordem).filter((r) => r.anotacoes.trim()).length;
  const paraRedigir = todasSecoes
    .filter((d) => d.obrigatoria(etapa) || (etapa.secoes[d.chave] ?? "").trim())
    .filter((d) => !(etapa.secoes[d.chave] ?? "").trim() || MARCA_COMPLETAR.test(etapa.secoes[d.chave]))
    .map((d) => d.chave);

  const irPara = (a: Aba) => {
    setAba(a);
    document.getElementById("conteudo-etapa")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const baixar = async () => {
    setGerando(true);
    try {
      const imagens = await baixarImagens(etapa.evidencias ?? []);
      const blob = await gerarDocx({ projeto, etapa, cliente, consultor }, imagens);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const nome = (cliente.nomeFantasia || cliente.razaoSocial).replace(/[^\p{L}\p{N}]+/gu, "_");
      a.download = `Relatorio_Tecnico_${etapa.ordem}a_Entrega_Etapa_${doisDigitos(etapa.ordem)}_${nome}.docx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não foi possível gerar o relatório.");
    } finally {
      setGerando(false);
    }
  };

  const posicao = fluxo.indexOf(etapa.status);
  const passo = passoDaEtapa(projeto, etapa);

  return (
    <>
      <Cabecalho
        migalhas={[
          { rotulo: empresa.nome, href: `/${projeto.empresa}` },
          { rotulo: cliente.nomeFantasia || cliente.razaoSocial, href: base },
          { rotulo: `Etapa ${doisDigitos(etapa.ordem)}` },
        ]}
        titulo={`${doisDigitos(etapa.ordem)} ${capitalizar(etapa.nome)}`}
        subtitulo={
          <span className="num">
            Etapa {etapa.ordem} de {projeto.etapas.length}, {periodoCurto(etapa.dataInicio, etapa.dataFim)}, {etapa.horasPrevistas} h previstas
          </span>
        }
        abas={
          <section aria-label="Andamento da etapa" className="pb-6">
            {etapa.status === "devolvida" ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-bloco)] bg-vinho-claro px-5 py-3">
                <p className="text-[15px] text-vinho">O SEBRAE devolveu esta entrega para ajuste.</p>
                <Botao variante="secundario" tamanho="pequeno" onClick={() => definirStatus("em_redacao")}>
                  Voltar para redação
                </Botao>
              </div>
            ) : (
              <>
                <ol ref={passosRef} className="flex overflow-x-auto pb-1">
                  {fluxo.map((s, i) => {
                    const motivo = s === etapa.status ? null : bloqueio(s);
                    const feito = i < posicao;
                    const atual = i === posicao;
                    return (
                      <li key={s} className="relative min-w-[6.25rem] flex-1">
                        {i < fluxo.length - 1 && (
                          <span aria-hidden className={`absolute left-7 right-1 top-[11px] h-[2px] rounded-full ${feito ? "bg-garrafa" : "bg-linha"}`} />
                        )}
                        <button
                          onClick={() => !motivo && definirStatus(s)}
                          disabled={!!motivo}
                          title={motivo ?? `Marcar como ${statusEtapa[s].rotulo.toLowerCase()}`}
                          aria-current={atual ? "step" : undefined}
                          className="group relative block text-left disabled:cursor-not-allowed"
                        >
                          <span
                            className={`num grid h-6 w-6 place-items-center rounded-full text-[12px] font-medium ${
                              feito
                                ? "bg-garrafa text-folha"
                                : atual
                                  ? "bg-folha text-garrafa ring-2 ring-garrafa"
                                  : motivo
                                    ? "bg-folha text-tinta-2/50 ring-1 ring-linha"
                                    : "bg-folha text-tinta-2 ring-1 ring-linha-forte group-hover:ring-garrafa"
                            }`}
                          >
                            {feito ? (
                              <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                                <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              i + 1
                            )}
                          </span>
                          <span
                            className={`mt-2 block pr-3 text-[13px] leading-tight ${
                              atual ? "font-medium text-tinta" : motivo ? "text-tinta-2/50" : feito ? "text-tinta-2" : "text-tinta-2 group-hover:text-garrafa"
                            }`}
                          >
                            {statusEtapa[s].curto}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                {(etapa.status === "enviada" || etapa.status === "aprovada") && (
                  <button onClick={() => definirStatus("devolvida")} className="mt-3 text-[13px] text-tinta-2 underline-offset-4 hover:text-vinho hover:underline">
                    O SEBRAE devolveu para ajuste
                  </button>
                )}
              </>
            )}
          </section>
        }
      />

      {encerrado && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-bloco)] border border-linha bg-folha px-6 py-4">
          <p className="text-[15px] text-tinta-2">Este projeto está encerrado. O conteúdo fica disponível para consulta e para baixar os relatórios.</p>
          <BotaoLink href={base} variante="secundario" tamanho="pequeno">
            Abrir o projeto
          </BotaoLink>
        </div>
      )}

      {passo && (
        <ProximoPasso
          passo={passo}
          className="mb-8"
          aoAgir={
            passo.acao
              ? () => {
                  const motivo = bloqueio(passo.acao!);
                  if (motivo) {
                    alert(`${motivo}.`);
                    irPara("Fechamento");
                  } else {
                    definirStatus(passo.acao!);
                    if (passo.aba) irPara(passo.aba);
                  }
                }
              : passo.aba
                ? () => irPara(passo.aba!)
                : undefined
          }
        />
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_17rem]">
        <div id="conteudo-etapa" className="min-w-0 scroll-mt-6">
          <Abas
            abas={abas}
            atual={aba}
            aoTrocar={setAba}
            extra={{
              Checklist: (
                <span className="num text-[13px] text-tinta-2">
                  {prog.feitas}/{prog.total}
                </span>
              ),
              Fechamento: pendencias.length > 0 && <span className="num text-[13px] text-vinho">{pendencias.length}</span>,
            }}
          />

          {aba === "Checklist" && (
            <ul className="divide-y divide-linha rounded-[var(--radius-bloco)] border border-linha bg-folha px-5">
              {etapa.atividades.map((a, i) => (
                <li key={a.codigo} className={`flex flex-wrap items-start gap-x-6 gap-y-3 py-3.5 ${a.nivel > 1 ? "pl-8" : ""}`}>
                  <div className="min-w-0 flex-1 basis-56 text-[15px] leading-relaxed">
                    <span className={`num mr-2 ${a.nivel === 1 ? "font-serif text-tinta" : "text-tinta-2"}`}>{a.codigo}</span>
                    <span className={a.status === "feito" ? "text-tinta-2" : a.nivel === 1 ? "text-tinta" : "text-tinta"}>{a.texto}</span>
                    {a.status === "nao_aplicavel" && (
                      <input
                        placeholder="Por que não se aplica? (obrigatório)"
                        className="campo mt-2"
                        value={a.justificativa}
                        onChange={(e) => mudarEtapa((x) => void (x.atividades[i].justificativa = e.target.value))}
                      />
                    )}
                  </div>
                  <div role="radiogroup" aria-label={`Situação da atividade ${a.codigo}`} className="flex shrink-0 rounded-[var(--radius-campo)] border border-linha-forte/70 bg-folha text-[13px]">
                    {(["pendente", "feito", "nao_aplicavel"] as const).map((s) => (
                      <button
                        key={s}
                        role="radio"
                        aria-checked={a.status === s}
                        onClick={() => mudarEtapa((x) => void (x.atividades[i].status = s))}
                        className={`px-3 py-1.5 first:rounded-l-[4px] last:rounded-r-[4px] ${
                          a.status === s
                            ? s === "feito"
                              ? "bg-garrafa text-folha"
                              : s === "pendente"
                                ? "bg-pedra text-tinta"
                                : "bg-latao-claro text-latao"
                            : "text-tinta-2 hover:text-tinta"
                        }`}
                      >
                        {s === "pendente" ? "Pendente" : s === "feito" ? "Feito" : "Não se aplica"}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {aba === "Redação do relatório" && (
            <div className="space-y-3">
              <RedigirComIA
                anotacoes={anotacoesDaEtapa}
                secoes={paraRedigir.length}
                redigindo={redigindo === "todas"}
                ocupado={!!redigindo}
                aoRedigir={() => redigir(paraRedigir, "todas")}
                aoRegistrar={() => irPara("Visitas e horas")}
              />
              {vazias > 0 && <PreencherPadroes vazias={vazias} aoUsar={usarPadroes} />}
              <AjudaFormatacao />
              {secoesAntes.map((s) => (
                <EditorSecao
                  key={s.chave}
                  def={s}
                  etapa={etapa}
                  padrao={() => textoPadraoSecao(s.chave, projeto, etapa, cliente)}
                  onChange={(v) => mudarEtapa((x) => void (x.secoes[s.chave] = v))}
                  redigindo={redigindo === s.chave}
                  ocupado={!!redigindo}
                  aoRedigir={() => {
                    if ((etapa.secoes[s.chave] ?? "").trim() && !MARCA_COMPLETAR.test(etapa.secoes[s.chave]) && !confirm("Substituir o texto atual desta seção pelo redigido com IA?")) return;
                    void redigir([s.chave], s.chave);
                  }}
                />
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-bloco)] border border-dashed border-linha-forte px-5 py-3 text-[15px] text-tinta-2">
                <span>Neste ponto do relatório entram os entregáveis da ficha, cada um com a sua faixa.</span>
                <Botao variante="secundario" tamanho="pequeno" onClick={() => setAba("Entregáveis")}>
                  Escrever os entregáveis
                </Botao>
              </div>
              {secoesDepois.map((s) => (
                <EditorSecao
                  key={s.chave}
                  def={s}
                  etapa={etapa}
                  padrao={() => textoPadraoSecao(s.chave, projeto, etapa, cliente)}
                  onChange={(v) => mudarEtapa((x) => void (x.secoes[s.chave] = v))}
                  redigindo={redigindo === s.chave}
                  ocupado={!!redigindo}
                  aoRedigir={() => {
                    if ((etapa.secoes[s.chave] ?? "").trim() && !MARCA_COMPLETAR.test(etapa.secoes[s.chave]) && !confirm("Substituir o texto atual desta seção pelo redigido com IA?")) return;
                    void redigir([s.chave], s.chave);
                  }}
                />
              ))}
              <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-5">
                <Evidencias projeto={projeto} etapa={etapa} alterarEtapa={mudarEtapa} />
              </div>
            </div>
          )}

          {aba === "Visitas e horas" && <Visitas projeto={projeto} etapa={etapa.ordem} />}

          {aba === "Entregáveis" && (
            <div className="space-y-3">
              {vazias > 0 && <PreencherPadroes vazias={vazias} aoUsar={usarPadroes} />}
              <AjudaFormatacao />
              {etapa.entregaveis.map((ent, i) => {
                const n = etapa.entregaveis.slice(0, i + 1).filter((x) => x.tipo === "entregavel").length;
                const rotulo = ent.tipo === "entregavel" ? `Entregável ${n}` : etapa.ordem === 1 ? "Instrumento complementar" : "Instrumento operacional";
                return (
                  <section key={ent.titulo} className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-5">
                    <p className="text-[13px] text-tinta-2">{rotulo}</p>
                    <h3 className="mb-3 mt-0.5 font-serif text-xl leading-snug">{ent.titulo}</h3>
                    <textarea
                      rows={7}
                      className="campo"
                      placeholder={ent.tipo === "instrumento" ? "Opcional. Se ficar em branco, não entra no relatório." : "Conteúdo do entregável"}
                      value={ent.conteudo}
                      onChange={(e) => mudarEtapa((x) => void (x.entregaveis[i].conteudo = e.target.value))}
                    />
                  </section>
                );
              })}
            </div>
          )}

          {aba === "Fechamento" && (
            <div className="space-y-10 rounded-[var(--radius-bloco)] border border-linha bg-folha p-6">
              <section>
                <h3 className="mb-4 font-serif text-xl">Local e data</h3>
                <Campo rotulo={`${projeto.localAssinatura || "Local (defina na ficha de identificação)"}, em`} className="max-w-xs">
                  <input
                    type="date"
                    className="campo num"
                    value={etapa.dataRelatorio ?? ""}
                    onChange={(e) => mudarEtapa((x) => void (x.dataRelatorio = e.target.value || null))}
                  />
                </Campo>
              </section>
              <section>
                <h3 className="mb-1 font-serif text-xl">Assinaturas no gov.br</h3>
                <p className="mb-4 text-[15px] text-tinta-2">Registre a data em que cada um assinou. A etapa só pode ir para “Enviada” com as duas.</p>
                <ul className="divide-y divide-linha border-y border-linha">
                  {(
                    [
                      ["assinaturaConsultor", consultor?.nomeCompleto ?? "Consultor", "Consultor responsável"],
                      ["assinaturaCliente", cliente.responsavel || "Responsável", "Responsável pela empresa demandante"],
                    ] as const
                  ).map(([k, nome, papel]) => (
                    <li key={k} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
                      <span>
                        <span className="block text-[15px]">{nome}</span>
                        <span className="block text-[13px] text-tinta-2">{papel}</span>
                      </span>
                      <input
                        type="date"
                        aria-label={`Data da assinatura de ${nome}`}
                        className="campo num !w-44"
                        value={etapa[k] ?? ""}
                        onChange={(e) =>
                          mudarEtapa((x) => void (x[k] = e.target.value || null), { acao: `Etapa ${doisDigitos(etapa.ordem)}: assinatura registrada`, detalhe: nome })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
              <RelatorioAssinado projeto={projeto} etapa={etapa} alterarEtapa={mudarEtapa} />
              <section>
                <h3 className="mb-4 font-serif text-xl">Pendências</h3>
                {pendencias.length === 0 ? (
                  <p className={`text-[15px] ${etapa.assinaturaConsultor && etapa.assinaturaCliente ? "text-musgo" : "text-tinta"}`}>
                    {etapa.assinaturaConsultor && etapa.assinaturaCliente
                      ? "Relatório completo e assinado. A etapa pode ser marcada como pronta para enviar."
                      : "Relatório completo. Falta assinar no gov.br e registrar as datas (ou anexar o PDF assinado)."}
                  </p>
                ) : (
                  <ul className="space-y-2.5 text-[15px]">
                    {pendencias.map((p, i) => {
                      const destino = abaDaPendencia[p.onde];
                      const doProjeto = ancoraProjetoDaPendencia[p.onde];
                      return (
                        <li key={i} className="grid grid-cols-[6.5rem_1fr] gap-4">
                          <span className="text-[13px] text-tinta-2">{p.onde}</span>
                          {doProjeto ? (
                            <Link href={`${base}#${doProjeto}`} className="underline decoration-linha-forte underline-offset-4 hover:text-garrafa hover:decoration-garrafa">
                              {p.texto}
                            </Link>
                          ) : destino && destino !== aba ? (
                            <button onClick={() => setAba(destino)} className="text-left underline decoration-linha-forte underline-offset-4 hover:text-garrafa hover:decoration-garrafa">
                              {p.texto}
                            </button>
                          ) : (
                            <span>{p.texto}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Painel lateral: prazo, andamento e relatório sempre à vista */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="space-y-6 rounded-[var(--radius-bloco)] border border-linha bg-folha p-5">
            <div>
              <p className="text-[13px] text-tinta-2">Prazo</p>
              <p className="num mt-1 font-serif text-xl">{periodoCurto(etapa.dataInicio, etapa.dataFim)}</p>
              {sit && sit.tom !== "neutro" ? (
                <div className="mt-2">
                  <Selo tom={sit.tom}>{sit.texto}</Selo>
                </div>
              ) : sit ? (
                <p className="num mt-1 text-sm text-tinta-2">{sit.texto}</p>
              ) : (
                <p className="mt-1 text-sm text-tinta-2">{encerrado ? "Projeto encerrado" : "Sem plano de trabalho"}</p>
              )}
            </div>
            <div>
              <p className="text-[13px] text-tinta-2">Horas registradas</p>
              <div className="mt-2 flex items-center gap-3">
                <Barra valor={horasEtapa} total={etapa.horasPrevistas} tom={horasEtapa > etapa.horasPrevistas ? "atencao" : "andamento"} />
                <span className="num shrink-0 text-sm">
                  {horasFmt(horasEtapa)} / {etapa.horasPrevistas} h
                </span>
              </div>
              <button onClick={() => irPara("Visitas e horas")} className="mt-1.5 text-left text-[13px] text-garrafa underline-offset-4 hover:underline">
                Registrar visita ou horas
              </button>
            </div>
            <div>
              <p className="text-[13px] text-tinta-2">Checklist da ficha</p>
              <div className="mt-2 flex items-center gap-3">
                <Barra valor={prog.feitas} total={prog.total} tom={prog.feitas === prog.total ? "ok" : "andamento"} />
                <span className="num shrink-0 text-sm">
                  {prog.feitas}/{prog.total}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[13px] text-tinta-2">Relatório</p>
              {pendencias.length === 0 ? (
                <Status tom="ok" className="mt-1">
                  Completo
                </Status>
              ) : (
                <button onClick={() => setAba("Fechamento")} className="mt-1 text-left text-sm text-vinho underline-offset-4 hover:underline">
                  {pendencias.length === 1 ? "1 pendência" : `${pendencias.length} pendências`}
                </button>
              )}
              <Botao onClick={baixar} disabled={gerando} className="mt-4 w-full">
                {gerando ? "Gerando…" : "Baixar relatório em Word"}
              </Botao>
              <p className="mt-2 text-[13px] leading-snug text-tinta-2">
                No papel timbrado FUNCERN e Sebraetec; pode ser baixado como rascunho a qualquer momento. Para enviar: abra no Word, salve como PDF e
                assine no gov.br.
              </p>
              {etapa.relatorioAssinado ? (
                <button
                  onClick={() => abrirAssinado(etapa.relatorioAssinado!.caminho, etapa.relatorioAssinado!.nome)}
                  className="mt-3 block text-left text-sm text-garrafa underline-offset-4 hover:underline"
                >
                  Abrir o PDF assinado
                </button>
              ) : (
                <button onClick={() => setAba("Fechamento")} className="mt-3 block text-left text-sm text-tinta-2 underline-offset-4 hover:text-garrafa hover:underline">
                  Já assinou? Anexe o PDF
                </button>
              )}

            </div>
          </div>
          <nav className="mt-4 flex justify-between text-sm" aria-label="Outras etapas">
            {anterior ? (
              <Link href={`${base}/etapas/${anterior.ordem}`} className="text-tinta-2 hover:text-garrafa">
                Etapa {doisDigitos(anterior.ordem)}
              </Link>
            ) : (
              <span />
            )}
            {proxima && (
              <Link href={`${base}/etapas/${proxima.ordem}`} className="text-tinta-2 hover:text-garrafa">
                Etapa {doisDigitos(proxima.ordem)}
              </Link>
            )}
          </nav>
        </aside>
      </div>
    </>
  );
}

function PreencherPadroes({ vazias, aoUsar }: { vazias: number; aoUsar: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-bloco)] border border-garrafa/20 bg-garrafa-claro px-5 py-4">
      <p className="max-w-xl text-[15px] text-tinta">
        {vazias === 1 ? "1 parte do relatório está em branco." : `${vazias} partes do relatório estão em branco.`} O sistema escreve todas com os textos-padrão,
        já com os dados deste cliente e desta etapa. Depois é só revisar.
      </p>
      <Botao onClick={aoUsar}>Preencher com textos-padrão</Botao>
    </div>
  );
}

// Cada seção do relatório fechada mostra só o título, a situação e o começo
// do texto; abre para editar. Evita uma parede de caixas vazias.
function EditorSecao({
  def,
  etapa,
  padrao,
  onChange,
  redigindo,
  ocupado,
  aoRedigir,
}: {
  def: DefSecao;
  etapa: Etapa;
  padrao: () => string;
  onChange: (v: string) => void;
  redigindo: boolean;
  ocupado: boolean;
  aoRedigir: () => void;
}) {
  const valor = etapa.secoes[def.chave] ?? "";
  const [aberta, setAberta] = useState(false);
  const gerado = padrao();
  const doChecklist = def.chave === "atividades_realizadas";
  const vazio = !valor.trim();
  const titulo = def.quadro ? capitalizar(def.titulo(etapa)) : def.titulo(etapa);
  const situacao = vazio
    ? def.obrigatoria(etapa)
      ? { tom: "atencao" as const, texto: "Em branco" }
      : { tom: "neutro" as const, texto: "Opcional" }
    : MARCA_COMPLETAR.test(valor)
      ? { tom: "atencao" as const, texto: "Falta completar" }
      : { tom: "ok" as const, texto: "Escrita" };
  const usarGerado = () => {
    if (vazio || confirm("Substituir o texto atual pelo gerado a partir do checklist?")) {
      onChange(gerado);
      setAberta(true);
    }
  };

  return (
    <section className={`rounded-[var(--radius-bloco)] border bg-folha ${aberta ? "border-linha-forte" : "border-linha"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
        <button onClick={() => setAberta(!aberta)} aria-expanded={aberta} className="group flex min-w-0 flex-1 items-center gap-3 text-left">
          <svg viewBox="0 0 12 12" aria-hidden className={`h-3 w-3 shrink-0 text-tinta-2 transition-transform ${aberta ? "rotate-90" : ""}`}>
            <path d="M4 2.5 7.5 6 4 9.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="min-w-0">
            <span className={`block font-serif text-[1.1rem] leading-snug group-hover:text-garrafa ${def.quadro ? "text-garrafa" : "text-tinta"}`}>{titulo}</span>
            {!aberta && !vazio && <span className="mt-0.5 line-clamp-1 text-sm text-tinta-2">{valor.replace(/\s+/g, " ")}</span>}
          </span>
        </button>
        <span className="flex items-center gap-3">
          {gerado && (vazio || doChecklist) && (
            <Botao variante={vazio ? "secundario" : "fantasma"} tamanho="pequeno" onClick={usarGerado}>
              {doChecklist ? "Gerar do checklist" : "Usar texto-padrão"}
            </Botao>
          )}
          <Botao variante="fantasma" tamanho="pequeno" onClick={aoRedigir} disabled={ocupado}>
            {redigindo ? "Redigindo…" : "Redigir com IA"}
          </Botao>
          <Status tom={situacao.tom}>{situacao.texto}</Status>
        </span>
      </div>
      {aberta && (
        <div className="border-t border-linha px-5 pb-5 pt-4">
          <p className="mb-3 text-sm text-tinta-2">
            {def.quadro ? "Quadro de destaque no relatório. " : ""}
            {def.ajuda}
          </p>
          <textarea
            autoFocus
            rows={Math.min(18, Math.max(6, valor.split("\n").length + 2))}
            className="campo"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </section>
  );
}

function NaoEncontrado({ projeto }: { projeto?: string }) {
  const { empresa } = useParams<{ empresa: string }>();
  return (
    <div className="pt-10">
      <Vazio
        titulo={projeto ? "Etapa não encontrada" : "Projeto não encontrado"}
        acao={<BotaoLink href={projeto ?? `/${empresa}`}>{projeto ? "Abrir o projeto" : "Ver os projetos"}</BotaoLink>}
      >
        {projeto ? "O projeto tem cinco etapas, de 01 a 05." : "O link pode estar errado, ou o projeto foi excluído."}
      </Vazio>
    </div>
  );
}

function RedigirComIA({
  anotacoes,
  secoes,
  redigindo,
  ocupado,
  aoRedigir,
  aoRegistrar,
}: {
  anotacoes: number;
  secoes: number;
  redigindo: boolean;
  ocupado: boolean;
  aoRedigir: () => void;
  aoRegistrar: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <p className="text-[15px] text-tinta">
            {anotacoes === 0
              ? "Registre as visitas desta etapa com anotações para a IA redigir o relatório a partir do que foi levantado."
              : secoes === 0
                ? "Todas as seções estão escritas. Use “Redigir com IA” numa seção para reescrevê-la a partir das anotações."
                : `A IA redige ${secoes === 1 ? "a seção em branco ou incompleta" : `as ${secoes} seções em branco ou incompletas`} a partir das anotações de ${anotacoes} ${anotacoes === 1 ? "registro" : "registros"}, do checklist e dos dados do cliente. Depois é só revisar.`}
          </p>
          <p className="mt-1 text-[13px] text-tinta-2">
            Os dados são enviados à API da Anthropic (Claude), que não os usa para treinar modelos. O que faltar volta marcado como [completar].
          </p>
        </div>
        {anotacoes === 0 ? (
          <Botao variante="secundario" onClick={aoRegistrar}>
            Registrar visita
          </Botao>
        ) : (
          secoes > 0 && (
            <Botao onClick={aoRedigir} disabled={ocupado}>
              {redigindo ? "Redigindo… (até 1 minuto)" : "Redigir com IA"}
            </Botao>
          )
        )}
      </div>
    </div>
  );
}
