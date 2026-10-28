"use client";

import { useMemo, useState } from "react";
import type { MaterialHub, Projeto } from "@/lib/dados/tipos";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useEstado } from "@/lib/dados/store";
import { aplicarAcoes } from "@/lib/conversa";
import { completarVazio, conferirIdentificacao, efetivosDoHub, montarAcoes, pendenciasDoHub, type Completar, type RespostaImportacao } from "@/lib/hub-importar";
import { traduzirErro } from "@/lib/erros";
import { Botao } from "@/components/ui";
import { useProjeto } from "./use-projeto";
import { registrarDocumentosNoHistorico } from "@/lib/hub-documentos";
import { registrarLinhaDoTempoDoHub } from "@/lib/hub-historico";
import { CompletarDados, DatasDosRelatorios, DocumentosDoHub, EntradaDoHub, LidoDaPagina, relatoriosDasEtapas, useLeituraHub } from "./hub-leitura";

const BUCKET = "evidencias";

// Importar do HUB: cola o texto da página do pedido (ou manda print e PDF), a IA lê,
// o sistema mostra o que vai mudar e só aplica quando o consultor confirma.
// O que for aplicado aparece na conversa do projeto e pode ser desfeito lá.
export function ImportarHub({ projeto, aoFechar }: { projeto: Projeto; aoFechar: () => void }) {
  const { alterar, cliente, usuario } = useProjeto();
  const { salvarAgora } = useEstado();
  const [lido, setLido] = useState<RespostaImportacao | null>(null);
  const [c, setC] = useState<Completar>(completarVazio);
  const [insistir, setInsistir] = useState(false);
  const [aplicado, setAplicado] = useState<string[] | null>(null);
  const [aplicando, setAplicando] = useState(false);
  const h = useLeituraHub({
    campos: () => ({ projetoId: projeto.id }),
    // A IA lê o projeto no banco: o que está pendente precisa estar salvo
    antesDeLer: salvarAgora,
    codigoParaPuxar: projeto.codigoSolicitacaoHub || projeto.numeroProjetoHub,
    aoLer: (r) => {
      setLido(r);
      setC(completarVazio);
      setInsistir(false);
    },
    aoReceber: () => {
      setLido(null);
      setAplicado(null);
    },
    consumirAoLer: true,
  });
  const { materiais, entrega, erro, setErro, leituras } = h;

  const conferencia = useMemo(() => (lido ? conferirIdentificacao(projeto, cliente, lido.identificacao) : null), [lido, projeto, cliente]);
  const bloqueado = !!conferencia?.bloqueios.length && !insistir;
  // O primeiro PDF de cada etapa, baixado do cartão dela no HUB, vira o relatório da etapa em Entregas
  const relFiles = useMemo(() => relatoriosDasEtapas(materiais), [materiais]);
  const relPrevia = useMemo(() => Object.fromEntries(Object.entries(relFiles).map(([e, f]) => [Number(e), { caminho: "previa", nome: f.name }])), [relFiles]);
  const pend = useMemo(() => (lido ? pendenciasDoHub(lido, projeto, leituras, undefined, Object.keys(relFiles).map(Number)) : null), [lido, projeto, leituras, relFiles]);
  const ef = useMemo(() => (lido ? efetivosDoHub(lido, projeto, c, leituras, undefined, Object.keys(relFiles).map(Number)) : null), [lido, projeto, c, leituras, relFiles]);
  const acoes = useMemo(() => (lido ? montarAcoes(lido, !bloqueado, c, projeto, relPrevia, true, leituras) : []), [lido, bloqueado, c, projeto, relPrevia, leituras]);
  const etapasComRelatorio = useMemo(() => new Set(acoes.flatMap((a) => (a.tipo === "registrar_envio_etapa" && a.relatorio ? [a.etapa] : []))), [acoes]);
  // Os demais arquivos ficam em "Materiais do HUB"
  const paraMateriais = materiais.filter((m) => !(m.etapa > 0 && relFiles[m.etapa] === m.arquivo && etapasComRelatorio.has(m.etapa)));
  // O que vai mudar, calculado numa cópia do projeto
  const previa = useMemo(() => (acoes.length ? aplicarAcoes(structuredClone(projeto), acoes, [], "previa", usuario.nome).itens : []), [acoes, projeto, usuario.nome]);
  const feitos = previa.filter((i) => !i.aviso);
  const avisos = previa.filter((i) => i.aviso);
  const nadaParaAplicar = !feitos.length && !paraMateriais.length && !lido?.documentos?.length;

  const aplicar = async () => {
    if (!lido || nadaParaAplicar) return;
    setAplicando(true);
    setErro(null);
    try {
      const sb = supabaseNavegador();
      // Os arquivos baixados do HUB ficam guardados no projeto
      const guardados: MaterialHub[] = [];
      const naoSubiu: string[] = [];
      // Relatórios das etapas, direto em Entregas
      const relatorios: Record<number, { caminho: string; nome: string }> = {};
      for (const etapa of etapasComRelatorio) {
        const arquivo = relFiles[etapa];
        const caminho = `${projeto.empresa}/${projeto.id}/${etapa}/assinado-${crypto.randomUUID()}.pdf`;
        const { error } = await sb.storage.from(BUCKET).upload(caminho, arquivo, { contentType: "application/pdf" });
        if (error) naoSubiu.push(arquivo.name);
        else relatorios[etapa] = { caminho, nome: arquivo.name };
      }
      const acoesFinais = montarAcoes(lido, !bloqueado, c, projeto, relatorios, true, leituras);
      for (const m of paraMateriais) {
        const ext = m.arquivo.name.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() ?? "bin";
        const caminho = `${projeto.empresa}/${projeto.id}/hub/${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(caminho, m.arquivo, { contentType: m.arquivo.type });
        if (error) naoSubiu.push(m.arquivo.name);
        else guardados.push({ id: crypto.randomUUID(), nome: m.arquivo.name, tipo: m.arquivo.type, tamanho: m.arquivo.size, caminho, origem: entrega?.origem ?? "", baixadoEm: new Date().toISOString(), por: usuario.nome });
      }
      const id = crypto.randomUUID();
      const { itens, desfazer } = aplicarAcoes(structuredClone(projeto), acoesFinais, [], id, usuario.nome);
      const efetivos = itens.filter((x) => !x.aviso);
      const dosMateriais = guardados.length ? [{ descricao: `Materiais do HUB guardados no projeto: ${guardados.map((g) => g.nome).join(", ")}` }] : [];
      alterar(
        (p) => {
          void aplicarAcoes(p, acoesFinais, [], id, usuario.nome);
          if (guardados.length) p.materiaisHub = [...(p.materiaisHub ?? []), ...guardados];
          // O que o HUB lista e não deu para baixar fica ao menos no histórico
          registrarDocumentosNoHistorico(p, usuario.nome, lido.documentos, [...guardados.map((g) => g.nome), ...Object.values(relatorios).map((r) => r.nome)]);
          // A linha do tempo como realmente foi: cada passo e cada envio com a data de verdade
          registrarLinhaDoTempoDoHub(p, usuario.nome, acoesFinais, leituras);
        },
        { acao: "HUB: dados importados da página do pedido", detalhe: [...efetivos, ...dosMateriais].map((x) => x.descricao).join("\n") },
      );
      // Fica na conversa do projeto, com o botão de desfazer
      const base = { projeto_id: projeto.id, empresa: projeto.empresa };
      const { error } = await sb.from("mensagens_projeto").insert({ ...base, autor_nome: usuario.nome, papel: "usuario", texto: "Importei os dados da página do pedido no HUB." });
      if (error) throw error;
      const { error: erroIA } = await sb.from("mensagens_projeto").insert({ ...base, autor_nome: "Assistente", papel: "ia", texto: lido.resumo, acoes: [...itens, ...dosMateriais], desfazer });
      if (erroIA) throw erroIA;
      window.dispatchEvent(new Event("mensagens-do-projeto"));
      setAplicado([...efetivos, ...dosMateriais].map((x) => x.descricao));
      if (naoSubiu.length) setErro(`Não consegui guardar: ${naoSubiu.join(", ")}.`);
    } catch (e) {
      setErro(`As alterações foram aplicadas, mas o registro na conversa falhou. ${traduzirErro(e, "")}`.trim());
      setAplicado([]);
    } finally {
      setAplicando(false);
    }
  };

  const ident = lido?.identificacao;
  return (
    <div className="mt-4 space-y-4 rounded-[var(--radius-campo)] border border-linha bg-pedra/60 p-3 sm:p-4" aria-label="Importar do HUB">
      {aplicado ? (
        <div className="space-y-3">
          <p className="text-[15px] font-semibold text-verde">Importado.</p>
          <ul className="list-disc space-y-1 pl-5 text-[14px]">
            {aplicado.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
          <p className="text-[13px] text-tinta-2">Está registrado na conversa do projeto, onde dá para desfazer.</p>
          {erro && <p className="text-[13px] text-vermelho">{erro}</p>}
          <Botao tamanho="pequeno" onClick={aoFechar}>
            Fechar
          </Botao>
        </div>
      ) : !lido ? (
        <EntradaDoHub h={h} aoCancelar={aoFechar} />
      ) : (
        <div className="space-y-4">
          <p className="text-[15px]">{lido.resumo}</p>

          {ident && (ident.codigo_hub || ident.empresa || ident.cnpj || ident.gestor) && (
            <p className="text-[13px] text-tinta-2">
              Li no HUB:{" "}
              {[ident.codigo_hub && `pedido ${ident.codigo_hub}`, ident.empresa, ident.cnpj, ident.gestor && `gestor ${ident.gestor}`, ident.servico].filter(Boolean).join(" · ")}
            </p>
          )}

          {conferencia?.bloqueios.map((b) => (
            <p key={b} role="alert" className="rounded-[var(--radius-campo)] border border-vermelho/25 bg-vermelho-claro px-3 py-2 text-[13px] text-vermelho">
              {b}
            </p>
          ))}
          {conferencia?.bloqueios.length ? (
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={insistir} onChange={(e) => setInsistir(e.target.checked)} />É deste projeto mesmo, quero ver o que mudaria
            </label>
          ) : (
            conferencia?.avisos.map((a) => (
              <p key={a} className="rounded-[var(--radius-campo)] bg-laranja-claro px-3 py-2 text-[13px] text-laranja">
                {a}
              </p>
            ))
          )}

          {!bloqueado && <DatasDosRelatorios h={h} />}
          {!bloqueado && pend && ef && <CompletarDados pend={pend} ef={ef} c={c} setC={setC} relatorios={relFiles} />}

          {!bloqueado && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold">O que vai mudar no projeto</h3>
              {feitos.length ? (
                <ul className="list-disc space-y-1 pl-5 text-[14px]">
                  {feitos.map((i, k) => (
                    <li key={k}>{i.descricao}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-tinta-2">Nada para registrar nas datas: o projeto já está como o HUB mostra, ou o conteúdo não trouxe datas.</p>
              )}
            </div>
          )}
          {!bloqueado && avisos.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold">O sistema não aplicaria</h3>
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-laranja">
                {avisos.map((i, k) => (
                  <li key={k}>{i.descricao}</li>
                ))}
              </ul>
            </div>
          )}
          {lido.nao_importado.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold">Está no HUB, mas fica com você</h3>
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-tinta-2">
                {lido.nao_importado.map((t, k) => (
                  <li key={k}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {!bloqueado && entrega && <LidoDaPagina h={h} destino="no projeto" totalEtapas={projeto.etapas.length} emEntregas={(m) => (m.etapa > 0 && relFiles[m.etapa] === m.arquivo && etapasComRelatorio.has(m.etapa) ? m.etapa : 0)} />}
          {!bloqueado && <DocumentosDoHub documentos={lido.documentos} nomesBaixados={materiais.map((m) => m.arquivo.name)} />}
          {erro && <p className="text-[13px] text-vermelho">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="pequeno" onClick={() => void aplicar()} disabled={aplicando || bloqueado || nadaParaAplicar}>
              {aplicando ? "Aplicando…" : "Aplicar no projeto"}
            </Botao>
            <Botao variante="secundario" tamanho="pequeno" onClick={() => setLido(null)} disabled={aplicando}>
              Voltar
            </Botao>
            <Botao variante="fantasma" tamanho="pequeno" onClick={aoFechar} disabled={aplicando}>
              Cancelar
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
