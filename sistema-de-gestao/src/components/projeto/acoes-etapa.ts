"use client";

import { useState } from "react";
import type { Cliente, Etapa, Projeto } from "@/lib/dados/tipos";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { hojeIso } from "@/lib/datas";
import { textosParaBiblioteca } from "@/lib/biblioteca";
import { traduzirErro } from "@/lib/erros";
import { avisoEnvioAntecipado } from "@/lib/fase";
import { automatizarEtapa, bloqueioStatus, marcadoresEmAberto } from "@/lib/regras-etapa";
import { gerarDocx } from "@/lib/relatorio/docx";
import { relatorioFeitoFora } from "@/lib/relatorio/secoes";
import { doisDigitos, statusEtapa, type StatusEtapa } from "@/lib/rotulos";
import { etapaConcluida } from "@/lib/projeto";
import { baixarImagens } from "./evidencias";
import { useProjeto } from "./use-projeto";

// Textos completos das etapas, anonimizados, para a biblioteca do serviço.
// Devolve o erro, se houver.
export async function guardarNaBiblioteca(p: Projeto, etapas: Etapa[], cliente: Partial<Cliente>): Promise<string | null> {
  const linhas = etapas.flatMap((e) => textosParaBiblioteca(p, e, cliente));
  if (!linhas.length) return null;
  const { error } = await supabaseNavegador().from("biblioteca_textos").upsert(linhas, { onConflict: "projeto_origem,etapa,chave" });
  return error ? `Os textos não entraram na biblioteca. ${traduzirErro(error, "Tente de novo mais tarde.")}` : null;
}

// Projeto concluído pelo gestor: os textos de cada etapa enviada vão para a biblioteca
export const guardarProjetoNaBiblioteca = (p: Projeto, cliente: Partial<Cliente>) =>
  guardarNaBiblioteca(p, p.etapas.filter(etapaConcluida), cliente);

// O que dá para fazer com o relatório de uma etapa: mudar o status (com as
// regras e avisos de sempre) e baixar em Word
export function useAcoesEtapa() {
  const { projeto, cliente, consultor, alterar } = useProjeto();
  const [gerando, setGerando] = useState<number | null>(null);

  // Toda alteração passa por aqui; o status avança sozinho nos pontos óbvios
  const alterarEtapa = (ordem: number) => (fn: (e: Etapa) => void, evento?: { acao: string; detalhe?: string }) =>
    alterar((p) => {
      const e = p.etapas.find((x) => x.ordem === ordem)!;
      fn(e);
      automatizarEtapa(p, e);
    }, evento);

  // Muda o status. Devolve false se não mudou (bloqueio ou a pessoa desistiu).
  const mudarStatus = (ordem: number, s: StatusEtapa): boolean => {
    if (!projeto || !cliente) return false;
    const etapa = projeto.etapas.find((e) => e.ordem === ordem)!;
    const motivo = bloqueioStatus(projeto, etapa, s);
    if (motivo && s !== "devolvida") {
      alert(`${motivo}.`);
      return false;
    }
    if (s === "devolvida" && !confirm("Registrar que o gestor do SEBRAE devolveu esta entrega para ajuste?")) return false;
    const cedo = s === "enviada" ? avisoEnvioAntecipado(etapa) : null;
    if (cedo && !confirm(`${cedo}\n\nMarcar como enviada mesmo assim?`)) return false;
    const retomando = etapa.status === "devolvida" && s === "em_redacao";
    if (
      retomando &&
      (etapa.assinaturaConsultor || etapa.assinaturaCliente || etapa.relatorioAssinado) &&
      !confirm("O relatório vai mudar, então as datas de assinatura e o PDF assinado anterior serão descartados. Continuar?")
    )
      return false;
    const pdfAntigo = retomando ? etapa.relatorioAssinado?.caminho : undefined;
    alterar(
      (p) => {
        const e = p.etapas.find((x) => x.ordem === ordem)!;
        e.status = s;
        if (s === "enviada") e.enviadaEm = hojeIso();
        // Relatório feito fora do sistema e enviado: o checklist da etapa foi cumprido nele
        if (s === "enviada" && relatorioFeitoFora(e)) {
          e.relatorioExterno = true;
          e.atividades.forEach((a) => a.status === "pendente" && (a.status = "feito"));
        }
        if (retomando) {
          e.assinaturaConsultor = null;
          e.assinaturaCliente = null;
          e.relatorioAssinado = null;
          e.assinaturaDigital = null;
        }
      },
      { acao: `Etapa ${doisDigitos(ordem)}: ${statusEtapa[s].rotulo.toLowerCase()}` },
    );
    if (pdfAntigo) void supabaseNavegador().storage.from("evidencias").remove([pdfAntigo]);
    if (s === "aprovada") void guardarNaBiblioteca(projeto, [etapa], cliente).then((erro) => erro && alert(erro));
    return true;
  };

  // Relatório da etapa em Word, no papel timbrado, com as imagens de evidência
  const baixar = async (ordem: number) => {
    if (!projeto || !cliente) return;
    const etapa = projeto.etapas.find((e) => e.ordem === ordem)!;
    const abertos = marcadoresEmAberto(etapa);
    if (
      abertos &&
      !confirm(
        `Este relatório tem ${abertos} ${abertos === 1 ? "marcador" : "marcadores"} a completar ou confirmar. No Word, eles saem destacados em amarelo e há uma caixa "Pendências antes do envio" logo depois da capa, que você apaga ao concluir.\n\nBaixar mesmo assim?`,
      )
    )
      return;
    setGerando(ordem);
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
      setGerando(null);
    }
  };

  return { mudarStatus, baixar, gerando, alterarEtapa };
}
