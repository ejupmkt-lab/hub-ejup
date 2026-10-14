"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useProjeto } from "@/components/projeto/use-projeto";
import { AjudaFormatacao } from "@/components/projeto/ajuda-formatacao";
import { Evidencias, baixarImagens } from "@/components/projeto/evidencias";
import { secoesAntes, secoesDepois, todasSecoes, verificarCompletude, type DefSecao } from "@/lib/relatorio/secoes";
import { preencherVazios, textoPadraoSecao } from "@/lib/relatorio/padroes";
import { gerarDocx } from "@/lib/relatorio/docx";
import { periodoCurto } from "@/lib/datas";
import { doisDigitos, statusEtapa, type StatusEtapa } from "@/lib/rotulos";
import { progressoAtividades, situacaoPrazo } from "@/lib/projeto";
import { useEstado } from "@/lib/dados/store";
import type { Etapa } from "@/lib/dados/tipos";
import { Abas, Barra, Botao, Cabecalho, Campo, Selo, Status } from "@/components/ui";

const abas = ["Checklist", "Redação do relatório", "Entregáveis", "Fechamento"] as const;
type Aba = (typeof abas)[number];

// Caminho normal de uma etapa; "devolvida" fica fora da sequência
const fluxo: StatusEtapa[] = ["nao_iniciada", "em_levantamento", "em_redacao", "em_revisao", "aguardando_assinaturas", "a_enviar", "enviada", "aprovada"];
const exigeCompletude: StatusEtapa[] = ["a_enviar", "enviada", "aprovada"];

const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function PaginaEtapa() {
  const { ordem } = useParams<{ ordem: string }>();
  const { projeto, cliente, consultor, alterar } = useProjeto();
  const { estado } = useEstado();
  const [aba, setAba] = useState<Aba>("Checklist");
  const [gerando, setGerando] = useState(false);
  if (!projeto || !cliente) return <p className="text-tinta-2">Projeto não encontrado.</p>;
  const etapa = projeto.etapas.find((e) => e.ordem === Number(ordem));
  if (!etapa) return <p className="text-tinta-2">Etapa não encontrada.</p>;

  const empresa = estado.empresas.find((e) => e.slug === projeto.empresa)!;
  const pendencias = verificarCompletude(projeto, etapa);
  const semPlano = !projeto.planoFechadoEm;
  const sit = projeto.status === "em_andamento" ? situacaoPrazo(etapa) : null;
  const prog = progressoAtividades(etapa);
  const anterior = projeto.etapas.find((e) => e.ordem === etapa.ordem - 1);
  const proxima = projeto.etapas.find((e) => e.ordem === etapa.ordem + 1);
  const base = `/${projeto.empresa}/projetos/${projeto.id}`;

  // Toda alteração passa por aqui; o status avança sozinho nos pontos óbvios:
  // primeira atividade marcada → "Em levantamento"; duas assinaturas com o
  // relatório completo → "A enviar".
  const mudarEtapa = (fn: (e: Etapa) => void, evento?: { acao: string; detalhe?: string }) =>
    alterar((p) => {
      const e = p.etapas.find((x) => x.ordem === etapa.ordem)!;
      fn(e);
      if (!p.planoFechadoEm) return;
      if (e.status === "nao_iniciada" && e.atividades.some((a) => a.status !== "pendente")) e.status = "em_levantamento";
      const assinada = e.assinaturaConsultor && e.assinaturaCliente;
      const antes = ["nao_iniciada", "em_levantamento", "em_redacao", "em_revisao", "aguardando_assinaturas"];
      if (assinada && antes.includes(e.status) && verificarCompletude(p, e).length === 0) e.status = "a_enviar";
    }, evento);

  const usarPadroes = () =>
    mudarEtapa((x) => void preencherVazios(projeto, x, cliente, todasSecoes.map((d) => d.chave)), { acao: `Etapa ${doisDigitos(etapa.ordem)}: textos-padrão aplicados` });
  const vazias = todasSecoes.filter((d) => d.obrigatoria(etapa) && !(etapa.secoes[d.chave] ?? "").trim()).length + etapa.entregaveis.filter((x) => x.tipo === "entregavel" && !x.conteudo.trim()).length;

  const bloqueio = (s: StatusEtapa): string | null => {
    if (semPlano && s !== "nao_iniciada") return "Feche o plano de trabalho primeiro";
    if (exigeCompletude.includes(s) && pendencias.length)
      return pendencias.length === 1 ? "Há 1 pendência no relatório" : `Há ${pendencias.length} pendências no relatório`;
    if ((s === "enviada" || s === "aprovada") && !(etapa.assinaturaConsultor && etapa.assinaturaCliente)) return "Registre as duas assinaturas";
    return null;
  };

  // Escolha manual do status: vale o que a pessoa clicou, sem automação
  const definirStatus = (s: StatusEtapa) =>
    alterar((p) => void (p.etapas.find((x) => x.ordem === etapa.ordem)!.status = s), {
      acao: `Etapa ${doisDigitos(etapa.ordem)}: ${statusEtapa[s].rotulo.toLowerCase()}`,
    });

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

  return (
    <>
      <Cabecalho
        migalhas={[
          { rotulo: empresa.nome, href: `/${projeto.empresa}` },
          { rotulo: cliente.nomeFantasia || cliente.razaoSocial, href: base },
          { rotulo: `Etapa ${doisDigitos(etapa.ordem)}` },
        ]}
        titulo={capitalizar(etapa.nome)}
        subtitulo={
          <span className="num">
            Etapa {doisDigitos(etapa.ordem)} de {doisDigitos(projeto.etapas.length)}, {periodoCurto(etapa.dataInicio, etapa.dataFim)},{" "}
            {etapa.horasPrevistas} h previstas
          </span>
        }
      />

      {/* Sequência de status: clique para avançar ou voltar */}
      <section aria-label="Andamento da etapa" className="mb-10">
        {etapa.status === "devolvida" ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-bloco)] bg-vinho-claro px-5 py-4">
            <p className="text-[15px] text-vinho">O SEBRAE devolveu esta entrega para ajuste.</p>
            <Botao variante="secundario" onClick={() => definirStatus("em_redacao")}>
              Voltar para redação
            </Botao>
          </div>
        ) : (
          <>
            <ol className="flex overflow-x-auto pb-1">
              {fluxo.map((s, i) => {
                const motivo = s === etapa.status ? null : bloqueio(s);
                const feito = i < posicao;
                const atual = i === posicao;
                return (
                  <li key={s} className="min-w-[6.5rem] flex-1">
                    <button
                      onClick={() => !motivo && definirStatus(s)}
                      disabled={!!motivo}
                      title={motivo ?? `Marcar como ${statusEtapa[s].rotulo.toLowerCase()}`}
                      aria-current={atual ? "step" : undefined}
                      className="group w-full text-left disabled:cursor-not-allowed"
                    >
                      <span className={`block h-[3px] ${feito || atual ? "bg-garrafa" : "bg-linha"} ${i === 0 ? "rounded-l-full" : ""} ${i === fluxo.length - 1 ? "rounded-r-full" : ""}`} />
                      <span
                        className={`mt-2 block pr-2 text-[13px] leading-tight ${
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

      <div className="grid gap-10 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0">
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
            <ul className="divide-y divide-linha border-y border-linha">
              {etapa.atividades.map((a, i) => (
                <li key={a.codigo} className={`flex flex-wrap items-start gap-x-6 gap-y-3 py-3.5 ${a.nivel > 1 ? "pl-8" : ""}`}>
                  <div className="min-w-0 flex-1 text-[15px] leading-relaxed">
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
                  <div role="radiogroup" aria-label={`Situação da atividade ${a.codigo}`} className="flex shrink-0 rounded-[var(--radius-campo)] border border-linha text-[13px]">
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
            <div className="space-y-8">
              {vazias > 0 && <PreencherPadroes vazias={vazias} aoUsar={usarPadroes} />}
              <AjudaFormatacao />
              {secoesAntes.map((s) => (
                <EditorSecao key={s.chave} def={s} etapa={etapa} padrao={() => textoPadraoSecao(s.chave, projeto, etapa, cliente)} onChange={(v) => mudarEtapa((x) => void (x.secoes[s.chave] = v))} />
              ))}
              <div className="border-l-2 border-garrafa py-1 pl-5 text-[15px] text-tinta-2">
                Aqui entram os entregáveis da ficha, cada um com a sua faixa no relatório.{" "}
                <button className="text-garrafa underline-offset-4 hover:underline" onClick={() => setAba("Entregáveis")}>
                  Escrever os entregáveis
                </button>
              </div>
              {secoesDepois.map((s) => (
                <EditorSecao key={s.chave} def={s} etapa={etapa} padrao={() => textoPadraoSecao(s.chave, projeto, etapa, cliente)} onChange={(v) => mudarEtapa((x) => void (x.secoes[s.chave] = v))} />
              ))}
              <Evidencias projeto={projeto} etapa={etapa} alterarEtapa={mudarEtapa} />
            </div>
          )}

          {aba === "Entregáveis" && (
            <div className="space-y-8">
              {vazias > 0 && <PreencherPadroes vazias={vazias} aoUsar={usarPadroes} />}
              <AjudaFormatacao />
              {etapa.entregaveis.map((ent, i) => {
                const n = etapa.entregaveis.slice(0, i + 1).filter((x) => x.tipo === "entregavel").length;
                const rotulo = ent.tipo === "entregavel" ? `Entregável ${n}` : etapa.ordem === 1 ? "Instrumento complementar" : "Instrumento operacional";
                return (
                  <section key={ent.titulo}>
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
            <div className="space-y-10">
              <section>
                <h3 className="mb-4 font-serif text-xl">Local e data</h3>
                <Campo rotulo={`${projeto.localAssinatura}, em`} className="max-w-xs">
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
              <section>
                <h3 className="mb-4 font-serif text-xl">Pendências</h3>
                {pendencias.length === 0 ? (
                  <p className="text-[15px] text-musgo">Nada pendente. A etapa pode ir para “A enviar”.</p>
                ) : (
                  <ul className="space-y-2.5 text-[15px]">
                    {pendencias.map((p, i) => (
                      <li key={i} className="grid grid-cols-[6.5rem_1fr] gap-4">
                        <span className="text-[13px] text-tinta-2">{p.onde}</span>
                        <span>{p.texto}</span>
                      </li>
                    ))}
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
                <p className="mt-1 text-sm text-tinta-2">Sem plano de trabalho</p>
              )}
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
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-bloco)] border border-garrafa/25 bg-garrafa-claro/60 px-5 py-4">
      <p className="max-w-xl text-[15px] text-tinta">
        {vazias === 1 ? "1 parte do relatório está em branco." : `${vazias} partes do relatório estão em branco.`} O sistema pode escrevê-las com os textos-padrão dos
        relatórios, já com os dados deste cliente e desta etapa.
      </p>
      <Botao onClick={aoUsar}>Preencher com textos-padrão</Botao>
    </div>
  );
}

function EditorSecao({ def, etapa, padrao, onChange }: { def: DefSecao; etapa: Etapa; padrao: () => string; onChange: (v: string) => void }) {
  const valor = etapa.secoes[def.chave] ?? "";
  const gerado = padrao();
  const doChecklist = def.chave === "atividades_realizadas";
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={`font-serif text-xl leading-snug ${def.quadro ? "text-garrafa" : ""}`}>
          {def.quadro ? capitalizar(def.titulo(etapa)) : def.titulo(etapa)}
        </h3>
        <span className="flex items-baseline gap-4 text-[13px]">
          {gerado && (!valor.trim() || doChecklist) && (
            <button
              className="text-garrafa underline-offset-4 hover:underline"
              onClick={() => (!valor.trim() || confirm("Substituir o texto atual pelo gerado a partir do checklist?")) && onChange(gerado)}
            >
              {doChecklist ? "Gerar a partir do checklist" : "Usar texto-padrão"}
            </button>
          )}
          {!def.obrigatoria(etapa) && <span className="text-tinta-2">Opcional</span>}
        </span>
      </div>
      <p className="mb-3 mt-1 text-sm text-tinta-2">
        {def.quadro ? "Quadro de destaque no relatório. " : ""}
        {def.ajuda}
      </p>
      <textarea rows={Math.min(16, Math.max(5, valor.split("\n").length + 2))} className="campo" value={valor} onChange={(e) => onChange(e.target.value)} />
    </section>
  );
}
