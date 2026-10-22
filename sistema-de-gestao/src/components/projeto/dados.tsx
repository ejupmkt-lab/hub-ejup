"use client";

import { traduzirErro } from "@/lib/erros";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PassoHub, Projeto } from "@/lib/dados/tipos";
import { mudarHub, ordemPassos, passoHubDoProjeto, rotuloPassoHub } from "@/lib/fase";
import { hojeIso } from "@/lib/datas";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { Botao, Campo, Cartao } from "@/components/ui";
import { useProjeto } from "./use-projeto";
import { EscolherGestorSebrae } from "./gestor-sebrae";
import { ValoresProjeto } from "@/components/financeiro/valores-projeto";

// Só o que é deste projeto; a ficha técnica, os textos e as referências vêm do serviço
const campos: { k: keyof Projeto; r: string; largo?: boolean }[] = [{ k: "localAssinatura", r: "Local (fechamento do relatório)" }];

export function DadosProjeto({ projeto, aoFechar }: { projeto: Projeto; aoFechar: () => void }) {
  const { alterar, cliente } = useProjeto();
  const { estado, excluir } = useEstado();
  const { gerencia } = useAcesso();
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);
  const consultores = estado.usuarios.filter((u) => u.acessos[projeto.empresa]);
  const consultorAtual = consultores.find((u) => u.id === projeto.consultorId);

  const excluirProjeto = async () => {
    const nome = cliente?.nomeFantasia || cliente?.razaoSocial || "este cliente";
    const resposta = prompt(
      `Excluir o projeto de ${nome}? Etapas, relatórios, imagens e o PDF assinado serão apagados e não há como desfazer.\n\nPara confirmar, digite EXCLUIR.`,
    );
    if (resposta?.trim().toUpperCase() !== "EXCLUIR") return;
    setExcluindo(true);
    try {
      await excluir("projeto", projeto.id);
      router.replace(`/${projeto.empresa}`);
    } catch (e) {
      alert(traduzirErro(e, "Não foi possível excluir."));
      setExcluindo(false);
    }
  };

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
          <Botao variante="secundario" tamanho="pequeno" onClick={aoFechar}>
            Voltar ao Desenvolvimento
          </Botao>
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
            <span className="mb-1.5 block text-[13px] font-semibold text-tinta">Número de visitas</span>
            <p className="flex min-h-10 items-center rounded-[var(--radius-campo)] bg-pedra px-3 text-[15px] text-tinta">
              <span>
                <span className="num font-semibold">{projeto.etapas.length}</span>, uma por etapa do serviço
              </span>
            </p>
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
        <ValoresProjeto projeto={projeto} />
      </Cartao>
      {gerencia(projeto.empresa) && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-linha pt-6">
          <p className="text-[13px] text-tinta-2">Projeto criado por engano ou cancelado pelo SEBRAE? A exclusão é definitiva.</p>
          <Botao variante="perigo" onClick={excluirProjeto} disabled={excluindo}>
            {excluindo ? "Excluindo…" : "Excluir projeto"}
          </Botao>
        </div>
      )}
    </>
  );
}
