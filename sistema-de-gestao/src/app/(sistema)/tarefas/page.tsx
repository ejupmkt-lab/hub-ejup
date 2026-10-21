"use client";

import Link from "next/link";
import { useState } from "react";
import { useEstado } from "@/lib/dados/store";
import type { Etapa, Projeto } from "@/lib/dados/tipos";
import { formatarData } from "@/lib/datas";
import { contarTarefas, tarefasDoProjeto, type TarefasDoProjeto } from "@/lib/tarefas";
import { automatizarEtapa, marcarAtividade } from "@/lib/regras-etapa";
import { pendenciasDoGrupo } from "@/lib/painel";
import { doisDigitos } from "@/lib/rotulos";
import { servicoDoProjeto } from "@/lib/projeto";
import { comQuem, comQuemTexto, diasNoPasso, fases, faseDoProjeto, tempoNoPasso } from "@/lib/fase";
import { mensagemCobranca } from "@/lib/cobranca";
import { useEmpresaAtual } from "@/lib/dados/empresa-atual";
import { Botao, BotaoLink, Cabecalho, Cartao, Chip, Indicador, Segmentos, Vazio } from "@/components/ui";
import { Pendencias } from "@/components/painel/pendencias";
import { IconeSeta } from "@/components/icones";

type Filtro = "comigo" | "atrasadas" | "aguardando";
const capitalizar = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

// Tarefas de cada projeto, só da fase em que ele está: o checklist pendente da
// etapa em curso (marcável aqui mesmo) ou o próximo passo. "Continuar" leva ao
// Desenvolvimento do projeto, onde a IA ajuda a produzir o relatório.
export default function Tarefas() {
  const { estado, atualizar } = useEstado();
  const { empresa } = useEmpresaAtual();
  const [filtro, setFiltro] = useState<Filtro>("comigo");
  const [copiado, setCopiado] = useState<string | null>(null);
  // Marcadas nesta visita continuam à vista (riscadas) para dar para desfazer
  const [recentes, setRecentes] = useState<Set<string>>(new Set());

  const projetos = estado.projetos.filter((p) => !empresa || p.empresa === empresa.slug);
  const conta = contarTarefas(projetos);
  const entregas = pendenciasDoGrupo(projetos).filter((x) => x.grupo !== "andamento" && x.grupo !== "nao_iniciada").length;
  const chave = (p: Projeto, e: Etapa, codigo: string) => `${p.id}:${e.ordem}:${codigo}`;

  const todos = projetos.map((p) => tarefasDoProjeto(p)).filter((t): t is TarefasDoProjeto => !!t);
  const nAguardando = todos.filter((t) => t.aguardando).length;
  const grupos = todos
    .filter((t) => (filtro === "aguardando" ? t.aguardando : filtro === "atrasadas" ? t.atrasada : !t.aguardando))
    .sort(
      (a, b) =>
        Number(b.atrasada) - Number(a.atrasada) ||
        Number(a.aguardando) - Number(b.aguardando) ||
        (a.etapa?.dataFim ?? "9").localeCompare(b.etapa?.dataFim ?? "9"),
    );

  const clienteDe = (p: Projeto) => estado.clientes.find((x) => x.id === p.clienteId);
  const nome = (p: Projeto) => clienteDe(p)?.nomeFantasia || clienteDe(p)?.razaoSocial || "Cliente";

  // Cobrar quem está com a bola: a mensagem vai para a área de transferência
  const cobrar = async (p: Projeto) => {
    const texto = mensagemCobranca(p, clienteDe(p));
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(p.id);
      setTimeout(() => setCopiado(null), 2500);
    } catch {
      prompt("Copie a mensagem:", texto);
    }
  };

  // Marcar a mãe marca as filhas pendentes; todas continuam à vista, riscadas
  const marcar = (p: Projeto, e: Etapa, codigo: string, feito: boolean) => {
    const status = feito ? "feito" : "pendente";
    const mudaram = marcarAtividade(structuredClone(e), codigo, status);
    setRecentes((rs) => new Set([...rs, ...mudaram.map((c) => chave(p, e, c))]));
    atualizar((r) => {
      const proj = r.projetos.find((x) => x.id === p.id);
      const et = proj?.etapas.find((x) => x.ordem === e.ordem);
      if (!proj || !et) return;
      marcarAtividade(et, codigo, status);
      automatizarEtapa(proj, et);
    });
  };

  return (
    <>
      <Cabecalho titulo="Tarefas" subtitulo={`O que fazer agora em cada projeto${empresa ? ` da ${empresa.nome}` : ""}, na fase em que ele está`} />

      <section aria-label="Resumo" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Indicador rotulo="Tarefas pendentes" valor={conta.total} detalhe="da fase atual de cada projeto" />
        <Indicador
          rotulo="Atrasadas"
          valor={conta.atrasadas}
          detalhe={conta.atrasadas ? "de etapas com o prazo vencido" : "nenhuma fora do prazo"}
          tom={conta.atrasadas ? "atencao" : undefined}
        />
        <div className="col-span-2 lg:col-span-1">
          <Indicador
            rotulo="Entregas pedindo ação"
            valor={entregas}
            detalhe="devoluções, atrasos e relatórios prontos para enviar"
            tom={entregas ? "atencao" : undefined}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          <Segmentos
            rotulo="Filtrar tarefas"
            atual={filtro}
            aoTrocar={setFiltro}
            opcoes={[
              { valor: "comigo", rotulo: `Com você (${conta.total})` },
              { valor: "atrasadas", rotulo: `Atrasadas (${conta.atrasadas})` },
              { valor: "aguardando", rotulo: `Aguardando outros (${nAguardando})` },
            ]}
          />

          {grupos.length === 0 ? (
            <Vazio
              titulo={filtro === "atrasadas" ? "Nenhuma tarefa atrasada" : filtro === "aguardando" ? "Nenhum projeto aguardando outros" : "Nenhuma tarefa com você"}
            >
              {filtro === "atrasadas"
                ? "Todas as tarefas estão dentro do prazo das etapas."
                : filtro === "aguardando"
                  ? "Nada parado com o gestor do SEBRAE, a FUNCERN ou o cliente."
                  : "Nenhum projeto depende de você agora nesta empresa."}
            </Vazio>
          ) : (
            grupos.map((t) => {
              const { projeto: p, etapa: e } = t;
              const fase = faseDoProjeto(p);
              const itens = e ? e.atividades.filter((a) => a.status === "pendente" || recentes.has(chave(p, e, a.codigo))) : [];
              const feitas = e ? e.atividades.filter((a) => a.status !== "pendente").length : 0;
              const com = comQuem(p);
              const dias = diasNoPasso(p);
              const resumo =
                fase !== "execucao" || t.aguardando
                  ? `${fases[fase].numero} ${fases[fase].rotulo}${com && com !== "consultor" ? ` · ${comQuemTexto(com)}` : ""}${dias !== null ? ` · ${tempoNoPasso(dias)}` : ""}`
                  : !p.planoFechadoEm
                    ? "Contratado · sem plano de trabalho"
                    : e
                      ? `Etapa ${doisDigitos(e.ordem)} de ${doisDigitos(p.etapas.length)} · ${capitalizar(e.nome)} · ${feitas} de ${e.atividades.length} feitas${e.dataFim ? ` · prazo ${formatarData(e.dataFim)}` : ""}`
                      : "Todas as etapas enviadas";
              return (
                <Cartao
                  key={p.id}
                  className={`overflow-hidden border-l-4 ${t.atrasada ? "border-l-laranja-vivo" : t.aguardando ? "border-l-linha-forte" : "border-l-azul"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-linha px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="break-words text-[15px] font-bold text-tinta">{nome(p)}</p>
                      <p className="break-words text-[13px] text-tinta-2">{servicoDoProjeto(p)}</p>
                      <p className="num mt-0.5 break-words text-[13px] text-tinta-2">{resumo}</p>
                    </div>
                    {t.atrasada ? <Chip tom="atencao">Atrasada</Chip> : t.aguardando ? <Chip tom="neutro">Aguardando</Chip> : null}
                  </div>
                  {e && itens.length > 0 ? (
                    <ul className="divide-y divide-linha">
                      {itens.map((a) => {
                        const feito = a.status !== "pendente";
                        return (
                          <li key={a.codigo} className={a.nivel > 1 ? "pl-6 sm:pl-8" : ""}>
                            <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-pedra/60 sm:px-5">
                              <input
                                type="checkbox"
                                checked={feito}
                                onChange={(ev) => marcar(p, e, a.codigo, ev.target.checked)}
                                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--color-azul)]"
                              />
                              <span className={`min-w-0 text-[15px] leading-snug ${feito ? "text-tinta-2 line-through" : "text-tinta"}`}>
                                <span className="num mr-1.5 font-semibold">{a.codigo}</span>
                                {a.texto}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  ) : t.passo ? (
                    <div className="px-4 py-3 sm:px-5">
                      <p className="text-[15px] font-semibold text-tinta">{t.passo.texto}</p>
                      {t.passo.detalhe && <p className="mt-0.5 text-sm text-tinta-2">{t.passo.detalhe}</p>}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linha px-4 py-3 sm:px-5">
                    {t.aguardando && mensagemCobranca(p, clienteDe(p)) ? (
                      <span className="flex w-full flex-wrap gap-2 sm:w-auto">
                        <Botao tamanho="pequeno" onClick={() => void cobrar(p)} className="flex-1 sm:flex-none">
                          {copiado === p.id ? "Mensagem copiada" : `Cobrar ${com === "cliente" ? "o cliente" : com === "funcern" ? "a FUNCERN" : "o gestor"}`}
                        </Botao>
                        <BotaoLink href={`/${p.empresa}/projetos/${p.id}`} variante="secundario" tamanho="pequeno" className="flex-1 sm:flex-none">
                          Abrir o projeto
                        </BotaoLink>
                      </span>
                    ) : (
                      <BotaoLink href={`/${p.empresa}/projetos/${p.id}#registrar`} tamanho="pequeno" className="w-full sm:w-auto">
                        Continuar no Desenvolvimento
                        <IconeSeta className="h-4 w-4" />
                      </BotaoLink>
                    )}
                    {e && itens.length > 0 && (
                      <Link href={`/${p.empresa}/projetos/${p.id}#etapa-${e.ordem}`} className="text-[13px] font-semibold text-azul hover:underline">
                        Ver a entrega da etapa
                      </Link>
                    )}
                  </div>
                </Cartao>
              );
            })
          )}
        </div>

        <aside className="min-w-0">
          <Cartao className="p-4 sm:p-5 lg:sticky lg:top-6">
            <h2 className="text-[17px] font-bold">Entregas</h2>
            <p className="mt-0.5 text-sm text-tinta-2">Devoluções, atrasos, envios e prazos da semana.</p>
            <div className="mt-4">
              <Pendencias projetos={projetos} />
            </div>
          </Cartao>
        </aside>
      </div>
    </>
  );
}
