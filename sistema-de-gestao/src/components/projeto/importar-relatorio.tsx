"use client";

import { useState } from "react";
import type { Etapa, Evidencia, Projeto } from "@/lib/dados/tipos";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useUsuario } from "@/lib/dados/store";
import { formatarData, hojeIso } from "@/lib/datas";
import { traduzirErro } from "@/lib/erros";
import { doisDigitos } from "@/lib/rotulos";
import { Botao } from "@/components/ui";
import { subirEvidencia } from "./evidencias";

// Relatório feito fora do sistema e já assinado: o PDF passa a ser o relatório
// da etapa. Anexa o PDF e as fotos de evidência, registra as assinaturas, dá o
// checklist por feito e, se já foi enviado no HUB, a data do envio.
export function ImportarRelatorio({
  projeto,
  etapa,
  alterarEtapa,
  aoFechar,
}: {
  projeto: Projeto;
  etapa: Etapa;
  alterarEtapa: (fn: (e: Etapa) => void, evento?: { acao: string; detalhe?: string }) => void;
  aoFechar: () => void;
}) {
  const usuario = useUsuario();
  const [pdf, setPdf] = useState<File | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [legenda, setLegenda] = useState("Registro fotográfico de atendimento e levantamento");
  const [enviadoEm, setEnviadoEm] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const rotulo = `Etapa ${doisDigitos(etapa.ordem)}`;

  const importar = async () => {
    setErro(null);
    if (!pdf) return setErro("Escolha o PDF assinado.");
    if (pdf.type !== "application/pdf") return setErro("O relatório precisa estar em PDF.");
    if (pdf.size > 20 * 1024 * 1024) return setErro("O PDF passa de 20 MB.");
    setEnviando(true);
    try {
      const sb = supabaseNavegador();
      const caminho = `${projeto.empresa}/${projeto.id}/${etapa.ordem}/assinado-${crypto.randomUUID()}.pdf`;
      const { error } = await sb.storage.from("evidencias").upload(caminho, pdf, { contentType: "application/pdf" });
      if (error) throw error;
      const novas: Evidencia[] = [];
      for (const [i, f] of fotos.entries()) {
        novas.push(await subirEvidencia(projeto, etapa.ordem, f, fotos.length > 1 ? `${legenda} (${i + 1})` : legenda));
      }
      const anterior = etapa.relatorioAssinado?.caminho;
      // Sem datas de assinatura na tela: vale a do envio no HUB (ou a de hoje)
      const dataAssinaturas = enviadoEm || hojeIso();
      alterarEtapa(
        (e) => {
          e.relatorioExterno = true;
          e.relatorioAssinado = { caminho, nome: pdf.name, enviadoEm: new Date().toISOString(), por: usuario.nome };
          e.evidencias = [...(e.evidencias ?? []), ...novas];
          e.assinaturaConsultor = dataAssinaturas;
          e.assinaturaCliente = dataAssinaturas;
          e.dataRelatorio = dataAssinaturas;
          e.atividades.forEach((a) => a.status === "pendente" && (a.status = "feito"));
          e.status = enviadoEm ? "enviada" : "a_enviar";
          e.enviadaEm = enviadoEm || null;
        },
        {
          acao: `${rotulo}: relatório pronto importado`,
          detalhe: `${pdf.name}${enviadoEm ? `, enviado no HUB em ${formatarData(enviadoEm)}` : ""}${novas.length ? `, ${novas.length} foto(s)` : ""}`,
        },
      );
      if (anterior) void sb.storage.from("evidencias").remove([anterior]);
      aoFechar();
    } catch (e) {
      setErro(`Não foi possível importar. ${traduzirErro(e, "Tente de novo.")}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-[var(--radius-campo)] border border-linha bg-pedra/60 p-3 sm:p-4">
      <p className="text-[13px] text-tinta-2">
        Para o relatório que já foi feito e assinado fora do sistema. O PDF passa a ser o relatório desta etapa e o checklist fica como feito.
      </p>
      <label className="block text-[13px] font-semibold">
        PDF assinado
        <input type="file" accept="application/pdf" className="campo mt-1 !py-1.5" onChange={(ev) => setPdf(ev.target.files?.[0] ?? null)} />
      </label>
      <label className="block text-[13px] font-semibold">
        Fotos de evidência <span className="font-normal text-tinta-2">(opcional, PNG, JPG ou WEBP)</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="campo mt-1 !py-1.5"
          onChange={(ev) => setFotos(Array.from(ev.target.files ?? []))}
        />
      </label>
      {fotos.length > 0 && (
        <label className="block text-[13px] font-semibold">
          Legenda das fotos
          <input className="campo mt-1" value={legenda} onChange={(ev) => setLegenda(ev.target.value)} />
        </label>
      )}
      <div className="flex flex-wrap gap-3">
        <label className="text-[13px] font-semibold">
          Enviado no HUB em <span className="font-normal text-tinta-2">(em branco se ainda não foi)</span>
          <input type="date" className="campo num mt-1 !w-auto" value={enviadoEm} max={hojeIso()} onChange={(ev) => setEnviadoEm(ev.target.value)} />
        </label>
      </div>
      {erro && <p className="text-[13px] text-vermelho">{erro}</p>}
      <div className="flex gap-2">
        <Botao tamanho="pequeno" onClick={() => void importar()} disabled={enviando}>
          {enviando ? "Importando…" : "Importar relatório"}
        </Botao>
        <Botao variante="fantasma" tamanho="pequeno" onClick={aoFechar} disabled={enviando}>
          Cancelar
        </Botao>
      </div>
    </div>
  );
}
