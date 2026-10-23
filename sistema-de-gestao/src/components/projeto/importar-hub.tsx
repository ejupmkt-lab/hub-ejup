"use client";

import { useMemo, useState } from "react";
import type { MaterialHub, Projeto } from "@/lib/dados/tipos";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useEstado } from "@/lib/dados/store";
import { aplicarAcoes } from "@/lib/conversa";
import { acoesDaImportacao, conferirIdentificacao, type RespostaImportacao } from "@/lib/hub-importar";
import { traduzirErro } from "@/lib/erros";
import { Botao } from "@/components/ui";
import { useProjeto } from "./use-projeto";
import { EntradaDoHub, LidoDaPagina, useLeituraHub } from "./hub-leitura";

const BUCKET = "evidencias";

// Importar do HUB: cola o texto da página do pedido (ou manda print e PDF), a IA lê,
// o sistema mostra o que vai mudar e só aplica quando o consultor confirma.
// O que for aplicado aparece na conversa do projeto e pode ser desfeito lá.
export function ImportarHub({ projeto, aoFechar }: { projeto: Projeto; aoFechar: () => void }) {
  const { alterar, cliente, usuario } = useProjeto();
  const { salvarAgora } = useEstado();
  const [lido, setLido] = useState<RespostaImportacao | null>(null);
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
      setInsistir(false);
    },
    aoReceber: () => {
      setLido(null);
      setAplicado(null);
    },
    consumirAoLer: true,
  });
  const { materiais, entrega, erro, setErro } = h;

  const conferencia = useMemo(() => (lido ? conferirIdentificacao(projeto, cliente, lido.identificacao) : null), [lido, projeto, cliente]);
  const bloqueado = !!conferencia?.bloqueios.length && !insistir;
  const acoes = useMemo(() => (lido ? acoesDaImportacao(lido.acoes, lido.identificacao, !bloqueado) : []), [lido, bloqueado]);
  // O que vai mudar, calculado numa cópia do projeto
  const previa = useMemo(() => (acoes.length ? aplicarAcoes(structuredClone(projeto), acoes, [], "previa", usuario.nome).itens : []), [acoes, projeto, usuario.nome]);
  const feitos = previa.filter((i) => !i.aviso);
  const avisos = previa.filter((i) => i.aviso);

  const aplicar = async () => {
    if (!lido || (!feitos.length && !materiais.length)) return;
    setAplicando(true);
    setErro(null);
    try {
      const sb = supabaseNavegador();
      // Os arquivos baixados do HUB ficam guardados no projeto
      const guardados: MaterialHub[] = [];
      const naoSubiu: string[] = [];
      for (const m of materiais) {
        const ext = m.arquivo.name.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() ?? "bin";
        const caminho = `${projeto.empresa}/${projeto.id}/hub/${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(caminho, m.arquivo, { contentType: m.arquivo.type });
        if (error) naoSubiu.push(m.arquivo.name);
        else guardados.push({ id: crypto.randomUUID(), nome: m.arquivo.name, tipo: m.arquivo.type, tamanho: m.arquivo.size, caminho, origem: entrega?.origem ?? "", baixadoEm: new Date().toISOString(), por: usuario.nome });
      }
      const id = crypto.randomUUID();
      const { itens, desfazer } = aplicarAcoes(structuredClone(projeto), acoes, [], id, usuario.nome);
      const efetivos = itens.filter((x) => !x.aviso);
      const dosMateriais = guardados.length ? [{ descricao: `Materiais do HUB guardados no projeto: ${guardados.map((g) => g.nome).join(", ")}` }] : [];
      alterar(
        (p) => {
          void aplicarAcoes(p, acoes, [], id, usuario.nome);
          if (guardados.length) p.materiaisHub = [...(p.materiaisHub ?? []), ...guardados];
        },
        { acao: "HUB: dados importados da página do pedido", detalhe: [...efetivos, ...dosMateriais].map((x) => x.descricao).join("; ") },
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
          {!bloqueado && entrega && <LidoDaPagina h={h} destino="no projeto" />}
          {erro && <p className="text-[13px] text-vermelho">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="pequeno" onClick={() => void aplicar()} disabled={aplicando || bloqueado || (!feitos.length && !materiais.length)}>
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
