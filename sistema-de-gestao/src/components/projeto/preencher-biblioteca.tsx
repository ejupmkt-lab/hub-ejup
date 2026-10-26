"use client";

import type { Etapa, Projeto } from "@/lib/dados/tipos";
import { chaveEntregavel, ordenarSugestoes, preencherMarcadores } from "@/lib/biblioteca";
import { preencherVazios } from "@/lib/relatorio/padroes";
import { todasSecoes } from "@/lib/relatorio/secoes";
import { doisDigitos } from "@/lib/rotulos";
import { useBiblioteca } from "./sugestoes-biblioteca";
import { useAcoesEtapa } from "./acoes-etapa";
import { useProjeto } from "./use-projeto";

// Preenche o que está em branco no relatório da etapa: primeiro o texto
// aprovado mais parecido da biblioteca do serviço; no resto, o texto-padrão.
// Funciona sem a IA; depois, a conversa ajusta os textos ao cliente.
export function PreencherComBiblioteca({ projeto, etapa }: { projeto: Projeto; etapa: Etapa }) {
  const { cliente } = useProjeto();
  const { alterarEtapa } = useAcoesEtapa();
  const biblioteca = useBiblioteca(projeto.empresa, projeto.modeloId, etapa.ordem);
  if (!cliente) return null;
  const vazias =
    todasSecoes.filter((d) => d.obrigatoria(etapa) && !(etapa.secoes[d.chave] ?? "").trim()).length +
    etapa.entregaveis.filter((x) => x.tipo === "entregavel" && !x.conteudo.trim()).length;
  if (!vazias) return null;
  const melhor = (chave: string) => ordenarSugestoes(biblioteca.lista.filter((t) => t.chave === chave), cliente, projeto.id)[0];

  const preencher = () =>
    alterarEtapa(etapa.ordem)(
      (x) => {
        for (const d of todasSecoes) {
          const m = melhor(d.chave);
          if (m && !(x.secoes[d.chave] ?? "").trim()) x.secoes[d.chave] = preencherMarcadores(m.texto, cliente);
        }
        for (const ent of x.entregaveis) {
          const m = melhor(chaveEntregavel(ent.titulo));
          if (m && !ent.conteudo.trim()) ent.conteudo = preencherMarcadores(m.texto, cliente);
        }
        preencherVazios(projeto, x, cliente, todasSecoes.map((d) => d.chave));
      },
      { acao: `Etapa ${doisDigitos(etapa.ordem)}: textos da biblioteca e padrão aplicados` },
    );

  return (
    <button type="button" onClick={preencher} disabled={!biblioteca.carregado} className="mt-2 text-left text-[13px] font-semibold text-azul hover:underline disabled:opacity-50">
      Preencher o relatório {etapa.ordem} com a biblioteca ({vazias} {vazias === 1 ? "item em branco" : "itens em branco"})
    </button>
  );
}
