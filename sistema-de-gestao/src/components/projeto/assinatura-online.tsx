"use client";

import { useEffect, useRef, useState } from "react";
import type { AssinaturaDigital, Etapa, Projeto } from "@/lib/dados/tipos";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useUsuario } from "@/lib/dados/store";
import { formatarData } from "@/lib/datas";
import { traduzirErro } from "@/lib/erros";
import { doisDigitos } from "@/lib/rotulos";
import { Botao } from "@/components/ui";
import { useProjeto } from "./use-projeto";

type Alterar = (fn: (e: Etapa) => void, evento?: { acao: string; detalhe?: string }) => void;
type Sinal = AssinaturaDigital["signatarios"];

// Data (Brasília) de um instante em UTC
const dia = (iso: string | null | undefined) => (iso ? new Date(Date.parse(iso) - 3 * 3_600_000).toISOString().slice(0, 10) : null);

async function resposta<T>(r: Response): Promise<T> {
  const j = (await r.json().catch(() => null)) as (T & { erro?: string }) | null;
  if (!r.ok || !j) throw new Error(j?.erro ?? "Não foi possível falar com o servidor.");
  return j;
}

const situacaoDe = (s: Sinal[number]) => (s.recusouEm ? "recusou" : s.assinouEm ? "assinou" : s.viuEm ? "abriu, falta assinar" : "ainda não abriu");

// Assinatura online (Autentique): o PDF do relatório vai para a plataforma, o
// consultor e o cliente assinam pelo link que recebem por e-mail e, quando os
// dois terminam, o PDF assinado entra na etapa sozinho.
export function AssinaturaOnline({ projeto, etapa, alterarEtapa }: { projeto: Projeto; etapa: Etapa; alterarEtapa: Alterar }) {
  const { cliente, consultor } = useProjeto();
  const usuario = useUsuario();
  const ad = etapa.assinaturaDigital ?? null;
  const rotulo = `Etapa ${doisDigitos(etapa.ordem)}`;
  const [aberto, setAberto] = useState(false);
  const [pdf, setPdf] = useState<File | null>(null);
  const [consNome, setConsNome] = useState(consultor?.nomeCompleto ?? "");
  const [consEmail, setConsEmail] = useState(consultor?.email ?? "");
  const [cliNome, setCliNome] = useState(cliente?.responsavel ?? "");
  const [cliEmail, setCliEmail] = useState(cliente?.email ?? "");
  const [ocupado, setOcupado] = useState<null | "enviando" | "verificando" | "lembrando">(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const jaVerificou = useRef(false);

  const enviar = async () => {
    setErro(null);
    if (!pdf) return setErro("Escolha o PDF do relatório.");
    setOcupado("enviando");
    try {
      const f = new FormData();
      f.append("projetoId", projeto.id);
      f.append("ordem", String(etapa.ordem));
      f.append("pdf", pdf);
      f.append(
        "signatarios",
        JSON.stringify([
          { nome: consNome, email: consEmail, papel: "consultor" },
          { nome: cliNome, email: cliEmail, papel: "cliente" },
        ]),
      );
      const r = await resposta<{ documentoId: string; signatarios: Sinal }>(await fetch("/api/assinatura/enviar", { method: "POST", body: f }));
      alterarEtapa(
        (e) => {
          e.assinaturaDigital = { provedor: "autentique", documentoId: r.documentoId, estado: "aguardando", enviadoEm: new Date().toISOString(), por: usuario.nome, signatarios: r.signatarios };
        },
        { acao: `${rotulo}: enviado para assinatura online`, detalhe: r.signatarios.map((s) => s.email).join(", ") },
      );
      setAberto(false);
      setPdf(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar.");
    } finally {
      setOcupado(null);
    }
  };

  // Lê a situação na Autentique; se os dois assinaram, traz o PDF assinado para a etapa
  const verificar = async (silencioso = false) => {
    if (!ad) return;
    setErro(null);
    setAviso(null);
    setOcupado("verificando");
    try {
      const r = await resposta<{ estado: AssinaturaDigital["estado"]; signatarios: (Sinal[number] extends infer S ? Omit<S & object, "papel"> : never)[]; arquivoPronto: boolean }>(
        await fetch("/api/assinatura/situacao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projetoId: projeto.id, ordem: etapa.ordem }) }),
      );
      const papel = new Map(ad.signatarios.map((s) => [s.email.toLowerCase(), s.papel]));
      const novos: Sinal = r.signatarios.map((s) => ({ ...(s as Sinal[number]), papel: papel.get(s.email.toLowerCase()) ?? "cliente" }));
      const mudou = JSON.stringify(novos) !== JSON.stringify(ad.signatarios) || r.estado !== ad.estado;

      if (r.estado === "assinado" && r.arquivoPronto && !etapa.relatorioAssinado) {
        const rf = await fetch(`/api/assinatura/arquivo?projetoId=${encodeURIComponent(projeto.id)}&ordem=${etapa.ordem}`);
        if (!rf.ok) throw new Error((await rf.json().catch(() => null))?.erro ?? "Não foi possível trazer o PDF assinado.");
        const bytes = await rf.blob();
        const nome = `Relatorio_Tecnico_${etapa.ordem}a_Entrega_assinado.pdf`;
        const caminho = `${projeto.empresa}/${projeto.id}/${etapa.ordem}/assinado-${crypto.randomUUID()}.pdf`;
        const { error } = await supabaseNavegador().storage.from("evidencias").upload(caminho, bytes, { contentType: "application/pdf" });
        if (error) throw error;
        const consultorAssinou = dia(novos.find((s) => s.papel === "consultor")?.assinouEm);
        const clienteAssinou = dia(novos.find((s) => s.papel === "cliente")?.assinouEm);
        alterarEtapa(
          (e) => {
            e.assinaturaDigital = { ...ad, estado: "assinado", signatarios: novos };
            e.relatorioAssinado = { caminho, nome, enviadoEm: new Date().toISOString(), por: "Autentique" };
            e.assinaturaConsultor = consultorAssinou ?? e.assinaturaConsultor;
            e.assinaturaCliente = clienteAssinou ?? e.assinaturaCliente;
            if (consultorAssinou) e.dataRelatorio = consultorAssinou;
          },
          { acao: `${rotulo}: assinado pelos dois na Autentique`, detalhe: `consultor ${formatarData(consultorAssinou)}, cliente ${formatarData(clienteAssinou)}` },
        );
      } else if (mudou) {
        alterarEtapa((e) => void (e.assinaturaDigital = { ...ad, estado: r.estado, signatarios: novos }), r.estado === "recusado" ? { acao: `${rotulo}: assinatura recusada na Autentique` } : undefined);
      } else if (!silencioso) {
        setAviso("Nada mudou desde a última conferência.");
      }
    } catch (e) {
      if (!silencioso) setErro(traduzirErro(e, e instanceof Error ? e.message : "Não foi possível conferir."));
    } finally {
      setOcupado(null);
    }
  };

  const lembrar = async () => {
    setErro(null);
    setAviso(null);
    setOcupado("lembrando");
    try {
      const r = await resposta<{ lembrados: string[] }>(
        await fetch("/api/assinatura/lembrar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projetoId: projeto.id, ordem: etapa.ordem }) }),
      );
      setAviso(r.lembrados.length ? `Pedido reenviado a ${r.lembrados.join(" e ")}.` : "Ninguém está pendente.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível reenviar.");
    } finally {
      setOcupado(null);
    }
  };

  const cancelar = () => {
    if (!confirm("Tirar o pedido de assinatura desta etapa? O documento na Autentique não é apagado, mas deixa de ser acompanhado aqui.")) return;
    alterarEtapa((e) => void (e.assinaturaDigital = null), { acao: `${rotulo}: pedido de assinatura online retirado` });
  };

  // Ao abrir a entrega, confere uma vez o que está pendente
  useEffect(() => {
    if (ad?.estado === "aguardando" && !jaVerificou.current) {
      jaVerificou.current = true;
      void verificar(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad?.documentoId]);

  if (ad?.estado === "assinado" && etapa.relatorioAssinado) return null;

  return (
    <div className={ad || aberto ? "mt-3 rounded-[var(--radius-campo)] border border-linha bg-pedra/50 p-3 sm:p-4" : "mt-2"}>
      {!ad && !aberto && (
        <button type="button" onClick={() => setAberto(true)} className="text-[13px] font-semibold text-azul hover:underline">
          Ou enviar para assinatura online (você e o cliente assinam pelo celular)
        </button>
      )}

      {!ad && aberto && (
        <div className="space-y-3">
          <p className="text-[13px] text-tinta-2">
            Baixe o relatório em Word, salve como PDF (Arquivo › Salvar como › PDF) e envie aqui. Cada pessoa recebe um link por e-mail para assinar.
          </p>
          <label className="block text-[13px] font-semibold">
            PDF do relatório <span className="font-normal text-tinta-2">(até 4 MB)</span>
            <input type="file" accept="application/pdf" className="campo mt-1 !py-1.5" onChange={(ev) => setPdf(ev.target.files?.[0] ?? null)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <fieldset className="space-y-2">
              <legend className="text-[13px] font-semibold">Consultor</legend>
              <input className="campo" aria-label="Nome do consultor" placeholder="Nome" value={consNome} onChange={(ev) => setConsNome(ev.target.value)} />
              <input className="campo" aria-label="E-mail do consultor" type="email" placeholder="E-mail" value={consEmail} onChange={(ev) => setConsEmail(ev.target.value)} />
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-[13px] font-semibold">Responsável da empresa</legend>
              <input className="campo" aria-label="Nome do responsável da empresa" placeholder="Nome" value={cliNome} onChange={(ev) => setCliNome(ev.target.value)} />
              <input className="campo" aria-label="E-mail do responsável da empresa" type="email" placeholder="E-mail" value={cliEmail} onChange={(ev) => setCliEmail(ev.target.value)} />
            </fieldset>
          </div>
          <div className="flex gap-2">
            <Botao tamanho="pequeno" onClick={() => void enviar()} disabled={ocupado === "enviando"}>
              {ocupado === "enviando" ? "Enviando…" : "Enviar para assinar"}
            </Botao>
            <Botao variante="fantasma" tamanho="pequeno" onClick={() => setAberto(false)} disabled={ocupado === "enviando"}>
              Cancelar
            </Botao>
          </div>
        </div>
      )}

      {ad && (
        <div className="space-y-2.5">
          <p className="text-[13px] font-semibold text-tinta">
            {ad.estado === "recusado" ? "Alguém recusou a assinatura" : "Aguardando as assinaturas na Autentique"}
            <span className="num font-normal text-tinta-2"> · enviado em {formatarData(dia(ad.enviadoEm))}</span>
          </p>
          <ul className="space-y-1 text-[13px]">
            {ad.signatarios.map((s) => (
              <li key={s.publicId} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold text-tinta">{s.nome || s.email}</span>
                <span className="text-tinta-2">({s.papel === "consultor" ? "consultor" : "empresa"})</span>
                <span className={s.assinouEm ? "text-verde" : s.recusouEm ? "text-vermelho" : "text-tinta-2"}>
                  {situacaoDe(s)}
                  {s.assinouEm && <span className="num"> em {formatarData(dia(s.assinouEm))}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <Botao variante="secundario" tamanho="pequeno" onClick={() => void verificar()} disabled={!!ocupado}>
              {ocupado === "verificando" ? "Conferindo…" : "Conferir assinaturas"}
            </Botao>
            {ad.estado === "aguardando" && (
              <Botao variante="secundario" tamanho="pequeno" onClick={() => void lembrar()} disabled={!!ocupado}>
                {ocupado === "lembrando" ? "Reenviando…" : "Lembrar quem falta"}
              </Botao>
            )}
            <button type="button" onClick={cancelar} className="text-[13px] text-tinta-2 hover:text-tinta">
              {ad.estado === "recusado" ? "Enviar de novo" : "Retirar o pedido"}
            </button>
          </div>
        </div>
      )}
      {aviso && <p className="mt-2 text-[13px] text-tinta-2">{aviso}</p>}
      {erro && <p className="mt-2 text-[13px] text-vermelho">{erro}</p>}
    </div>
  );
}
