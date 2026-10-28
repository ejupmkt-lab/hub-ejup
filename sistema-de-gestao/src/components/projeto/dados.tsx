"use client";

import { useEffect, useState } from "react";
import type { PassoHub, Projeto } from "@/lib/dados/tipos";
import { mudarHub, ordemPassos, passoHubDoProjeto, rotuloPassoHub } from "@/lib/fase";
import { hojeIso } from "@/lib/datas";
import { useEstado } from "@/lib/dados/store";
import { Campo, Cartao } from "@/components/ui";
import { useProjeto } from "./use-projeto";
import { EscolherGestorSebrae } from "./gestor-sebrae";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { formatarData } from "@/lib/datas";

// Só o que é deste projeto; a ficha técnica, os textos e as referências vêm do serviço
const campos: { k: keyof Projeto; r: string; largo?: boolean }[] = [{ k: "localAssinatura", r: "Local (fechamento do relatório)" }];

// Arquivos anexados no HUB que a extensão baixou e a importação guardou no projeto
function MateriaisDoHub({ projeto }: { projeto: Projeto }) {
  const { alterar } = useProjeto();
  const materiais = projeto.materiaisHub ?? [];
  const [urls, setUrls] = useState<Record<string, string>>({});
  const chave = materiais.map((m) => m.caminho).join("|");
  useEffect(() => {
    const faltam = materiais.map((m) => m.caminho).filter((c) => !urls[c]);
    if (!faltam.length) return;
    let ativo = true;
    void supabaseNavegador()
      .storage.from("evidencias")
      .createSignedUrls(faltam, 3600)
      .then(({ data }) => {
        if (ativo && data) setUrls((u) => ({ ...u, ...Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path!, d.signedUrl as string])) }));
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  if (!materiais.length) return null;

  const remover = async (id: string) => {
    const m = materiais.find((x) => x.id === id);
    if (!m || !confirm(`Remover “${m.nome}” do projeto?`)) return;
    await supabaseNavegador().storage.from("evidencias").remove([m.caminho]);
    alterar((p) => void (p.materiaisHub = (p.materiaisHub ?? []).filter((x) => x.id !== id)), { acao: "Material do HUB removido", detalhe: m.nome });
  };
  const tamanho = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

  return (
    <div className="mt-8 border-t border-linha pt-6" aria-label="Materiais do HUB">
      <h3 className="text-[15px] font-semibold">Materiais do HUB</h3>
      <p className="mb-3 mt-1 text-[13px] text-tinta-2">Arquivos anexados no HUB que foram baixados pela extensão e guardados aqui.</p>
      <ul className="divide-y divide-linha rounded-[var(--radius-campo)] ring-1 ring-linha">
        {materiais.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[14px]">
            <span className="min-w-0">
              {urls[m.caminho] ? (
                <a className="font-semibold text-azul underline-offset-4 hover:underline" href={urls[m.caminho]} target="_blank" rel="noreferrer">
                  {m.nome}
                </a>
              ) : (
                <span className="font-semibold">{m.nome}</span>
              )}
              <span className="block text-[13px] text-tinta-2">
                {tamanho(m.tamanho)} · baixado em {formatarData(m.baixadoEm.slice(0, 10))} por {m.por}
              </span>
            </span>
            <button type="button" className="text-[13px] text-tinta-2 hover:text-vermelho" onClick={() => void remover(m.id)}>
              Remover
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DadosProjeto({ projeto }: { projeto: Projeto }) {
  const { alterar, cliente } = useProjeto();
  const { estado } = useEstado();
  const consultores = estado.usuarios.filter((u) => u.acessos[projeto.empresa]);
  const consultorAtual = consultores.find((u) => u.id === projeto.consultorId);

  return (
    <>
      <Cartao className="p-4 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">Dados do projeto</h2>
            <p className="mb-6 mt-1 text-[15px] text-tinta-2">
              Estes dados, os do cliente ({cliente?.razaoSocial}) e a ficha do serviço preenchem a identificação no topo dos relatórios.
            </p>
          </div>
        </div>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Campo
            rotulo="Consultor responsável"
            dica={consultorAtual ? "Assina os relatórios como Consultor Responsável." : "Escolha quem assina os relatórios."}
            className="sm:col-span-2"
          >
            <select
              className="campo"
              value={consultorAtual ? projeto.consultorId : ""}
              onChange={(e) => {
                const novo = consultores.find((u) => u.id === e.target.value);
                alterar((p) => void (p.consultorId = e.target.value), {
                  acao: "Consultor responsável definido",
                  detalhe: novo?.nomeCompleto,
                });
              }}
            >
              {!consultorAtual && <option value="">A definir</option>}
              {consultores.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nomeCompleto}
                </option>
              ))}
            </select>
          </Campo>
          <Campo
            rotulo="Onde o projeto está no HUB"
            className="sm:col-span-2"
            dica="Para corrigir. No dia a dia, registre cada passo na linha do tempo do Desenvolvimento."
          >
            <select
              className="campo"
              value={passoHubDoProjeto(projeto)}
              onChange={(e) => {
                const para = e.target.value as PassoHub;
                alterar((p) => mudarHub(p, para, hojeIso()), { acao: "Passo no HUB corrigido", detalhe: rotuloPassoHub(para) });
              }}
            >
              {ordemPassos.map((s) => (
                <option key={s} value={s}>
                  {rotuloPassoHub(s)}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Código do pedido no HUB" dica="É o mesmo número do projeto no HUB.">
            <input
              className="campo num"
              value={projeto.codigoSolicitacaoHub || projeto.numeroProjetoHub || ""}
              onChange={(e) =>
                alterar((p) => {
                  p.codigoSolicitacaoHub = e.target.value;
                  p.numeroProjetoHub = e.target.value;
                })
              }
            />
          </Campo>
          <div>
            <label htmlFor="numero-visitas" className="mb-1.5 block text-[13px] font-semibold text-tinta">
              Número de visitas
            </label>
            <input
              id="numero-visitas"
              type="number"
              min={0}
              inputMode="numeric"
              className="campo num"
              placeholder={`${projeto.etapas.length}, uma por etapa`}
              value={projeto.numeroVisitas ?? ""}
              onChange={(e) => alterar((p) => void (p.numeroVisitas = e.target.value))}
            />
            <p className="mt-1 text-[13px] text-tinta-2">Como está no plano de trabalho do HUB. Em branco, uma por etapa.</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="gestor-sebrae" className="mb-1.5 block text-[13px] font-semibold text-tinta">
              Gestor ou gestora SEBRAE
            </label>
            <EscolherGestorSebrae
              id="gestor-sebrae"
              empresa={projeto.empresa}
              valor={projeto.gestorSebrae}
              aoMudar={(nome) => alterar((p) => void (p.gestorSebrae = nome))}
            />
          </div>
          {campos.map(({ k, r, largo }) => (
            <Campo key={k} rotulo={r} className={largo ? "sm:col-span-2" : ""}>
              <input className="campo" value={String(projeto[k] ?? "")} onChange={(e) => alterar((p) => void ((p[k] as string) = e.target.value))} />
            </Campo>
          ))}
        </div>
        <MateriaisDoHub projeto={projeto} />
      </Cartao>
    </>
  );
}
