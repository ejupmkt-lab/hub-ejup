"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useProjeto } from "@/components/projeto/use-projeto";
import { AjudaFormatacao } from "@/components/projeto/ajuda-formatacao";
import { secoesAntes, secoesDepois, verificarCompletude, type DefSecao } from "@/lib/relatorio/secoes";
import { gerarDocx } from "@/lib/relatorio/docx";
import { formatarData } from "@/lib/datas";
import { doisDigitos, ordemStatusEtapa, statusEtapa, type StatusEtapa } from "@/lib/rotulos";
import { situacaoPrazo } from "@/lib/projeto";
import type { Etapa } from "@/lib/dados/tipos";
import { Botao, Cabecalho, Campo, Cartao, Chip, ChipEtapa } from "@/components/ui";

const abas = ["Checklist da ficha", "Redação do relatório", "Entregáveis", "Fechamento e envio"] as const;
const exigeCompletude: StatusEtapa[] = ["a_enviar", "enviada", "aprovada"];

export default function PaginaEtapa() {
  const { ordem } = useParams<{ ordem: string }>();
  const { projeto, cliente, consultor, alterar } = useProjeto();
  const [aba, setAba] = useState<(typeof abas)[number]>("Checklist da ficha");
  const [gerando, setGerando] = useState(false);
  if (!projeto || !cliente) return <p>Projeto não encontrado.</p>;
  const etapa = projeto.etapas.find((e) => e.ordem === Number(ordem));
  if (!etapa) return <p>Etapa não encontrada.</p>;

  const titulo = `ETAPA ${doisDigitos(etapa.ordem)} | ${etapa.nome}`;
  const pendencias = verificarCompletude(projeto, etapa);
  const semPlano = !projeto.planoFechadoEm;
  const sit = projeto.status === "em_andamento" ? situacaoPrazo(etapa) : null;

  const mudarEtapa = (fn: (e: Etapa) => void, evento?: { acao: string; detalhe?: string }) =>
    alterar((p) => fn(p.etapas.find((e) => e.ordem === etapa.ordem)!), evento);

  const bloqueioStatus = (s: StatusEtapa): string | null => {
    if (semPlano && s !== "nao_iniciada") return "feche o plano de trabalho primeiro";
    if (exigeCompletude.includes(s) && pendencias.length) return `${pendencias.length} pendência(s)`;
    if ((s === "enviada" || s === "aprovada") && !(etapa.assinaturaConsultor && etapa.assinaturaCliente)) return "faltam assinaturas";
    return null;
  };

  const baixar = async () => {
    setGerando(true);
    try {
      const blob = await gerarDocx({ projeto, etapa, cliente, consultor });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const nome = (cliente.nomeFantasia || cliente.razaoSocial).replace(/[^\p{L}\p{N}]+/gu, "_");
      a.download = `Relatorio_Tecnico_${etapa.ordem}a_Entrega_Etapa_${doisDigitos(etapa.ordem)}_${nome}.docx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setGerando(false);
    }
  };

  return (
    <>
      <Cabecalho
        sobre={<Link href={`/${projeto.empresa}/projetos/${projeto.id}`} className="hover:text-marinho">← {cliente.razaoSocial}</Link>}
        titulo={titulo}
      >
        {sit && sit.cor !== "cinza" && <Chip cor={sit.cor}>{sit.texto}</Chip>}
        <ChipEtapa status={etapa.status} />
      </Cabecalho>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Cartao className="p-5 text-sm">
          <p>{etapa.descricao}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-tinta-2">
            <span>Previsão: {etapa.dataInicio ? `${formatarData(etapa.dataInicio)} a ${formatarData(etapa.dataFim)}` : "sem plano de trabalho"}</span>
            <span>Horas previstas: {etapa.horasPrevistas} h</span>
          </div>
        </Cartao>
        <Cartao className="p-5">
          <Campo rotulo="Status da etapa">
            <select
              className="campo"
              value={etapa.status}
              onChange={(e) => {
                const s = e.target.value as StatusEtapa;
                mudarEtapa((x) => void (x.status = s), { acao: `Etapa ${doisDigitos(etapa.ordem)}: status alterado para ${statusEtapa[s].rotulo}` });
              }}
            >
              {ordemStatusEtapa.map((s) => {
                const b = bloqueioStatus(s);
                return (
                  <option key={s} value={s} disabled={!!b && s !== etapa.status}>
                    {statusEtapa[s].rotulo}{b && s !== etapa.status ? ` — ${b}` : ""}
                  </option>
                );
              })}
            </select>
          </Campo>
          <p className="mt-2 text-xs text-tinta-2">
            {pendencias.length ? `${pendencias.length} pendência(s) impedem marcar "A enviar".` : "Relatório completo: pode ir para \"A enviar\"."}
          </p>
        </Cartao>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-linha">
        {abas.map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${a === aba ? "border-marinho font-medium text-marinho" : "border-transparent text-tinta-2 hover:text-tinta"}`}
          >
            {a}
            {a === "Fechamento e envio" && pendencias.length > 0 && <span className="ml-1.5 rounded-full bg-vermelho-claro px-1.5 text-xs text-vermelho">{pendencias.length}</span>}
          </button>
        ))}
      </div>

      {aba === "Checklist da ficha" && (
        <Cartao className="divide-y divide-linha">
          {etapa.atividades.map((a, i) => (
            <div key={a.codigo} className={`flex flex-wrap items-start gap-3 px-5 py-3 ${a.nivel > 1 ? "pl-10" : ""}`}>
              <div className="min-w-0 flex-1 text-sm">
                <span className={a.nivel === 1 ? "font-medium" : ""}>{a.codigo}. {a.texto}</span>
                {a.status === "nao_aplicavel" && (
                  <input
                    placeholder="Justificativa (obrigatória)"
                    className="campo mt-2"
                    value={a.justificativa}
                    onChange={(e) => mudarEtapa((x) => void (x.atividades[i].justificativa = e.target.value))}
                  />
                )}
              </div>
              <div className="flex overflow-hidden rounded-md border border-linha text-xs">
                {(["pendente", "feito", "nao_aplicavel"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => mudarEtapa((x) => void (x.atividades[i].status = s))}
                    className={`px-2.5 py-1.5 ${a.status === s ? (s === "feito" ? "bg-verde text-white" : s === "pendente" ? "bg-tinta-2 text-white" : "bg-ambar text-white") : "bg-superficie text-tinta-2 hover:bg-papel"}`}
                  >
                    {s === "pendente" ? "Pendente" : s === "feito" ? "Feito" : "Não se aplica"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Cartao>
      )}

      {aba === "Redação do relatório" && (
        <div className="space-y-4">
          <AjudaFormatacao />
          {secoesAntes.map((s) => <EditorSecao key={s.chave} def={s} etapa={etapa} onChange={(v) => mudarEtapa((x) => void (x.secoes[s.chave] = v))} />)}
          <div className="rounded-md border border-dashed border-marinho/30 bg-marinho-claro/50 px-4 py-3 text-sm text-marinho-escuro">
            Aqui entram os entregáveis da ficha, na ordem da ficha técnica, cada um com sua faixa “ENTREGÁVEL N”.{" "}
            <button className="font-medium underline" onClick={() => setAba("Entregáveis")}>Editar entregáveis</button>
          </div>
          {secoesDepois.map((s) => <EditorSecao key={s.chave} def={s} etapa={etapa} onChange={(v) => mudarEtapa((x) => void (x.secoes[s.chave] = v))} />)}
        </div>
      )}

      {aba === "Entregáveis" && (
        <div className="space-y-4">
          <AjudaFormatacao />
          {etapa.entregaveis.map((ent, i) => {
            const n = etapa.entregaveis.slice(0, i + 1).filter((x) => x.tipo === "entregavel").length;
            return (
              <Cartao key={ent.titulo} className="overflow-hidden">
                <div className="bg-marinho px-5 py-2.5 text-center text-sm font-semibold uppercase tracking-wide text-white">
                  {ent.tipo === "entregavel" ? `Entregável ${n}` : etapa.ordem === 1 ? "Instrumento complementar" : "Instrumento operacional"}
                  <div className="text-xs font-medium opacity-90">{ent.titulo}</div>
                </div>
                <div className="p-5">
                  <textarea
                    rows={6}
                    className="campo"
                    placeholder={ent.tipo === "instrumento" ? "Opcional. Se ficar vazio, não entra no relatório." : "Conteúdo do entregável"}
                    value={ent.conteudo}
                    onChange={(e) => mudarEtapa((x) => void (x.entregaveis[i].conteudo = e.target.value))}
                  />
                </div>
              </Cartao>
            );
          })}
        </div>
      )}

      {aba === "Fechamento e envio" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Cartao className="space-y-4 p-5">
            <h2 className="font-semibold">Fechamento do relatório</h2>
            <Campo rotulo={`Data do relatório (${projeto.localAssinatura}, …)`}>
              <input type="date" className="campo" value={etapa.dataRelatorio ?? ""} onChange={(e) => mudarEtapa((x) => void (x.dataRelatorio = e.target.value || null))} />
            </Campo>
            <div>
              <div className="mb-1 text-xs font-medium text-tinta-2">Assinaturas gov.br</div>
              {([
                ["assinaturaConsultor", `${consultor?.nomeCompleto} — Consultor Responsável`],
                ["assinaturaCliente", `${cliente.responsavel} — Responsável pela Empresa Demandante`],
              ] as const).map(([k, rot]) => (
                <label key={k} className="flex items-center justify-between gap-3 border-b border-linha py-2 text-sm last:border-0">
                  <span>{rot}</span>
                  <input type="date" className="campo !w-40" value={etapa[k] ?? ""} onChange={(e) => mudarEtapa((x) => void (x[k] = e.target.value || null), { acao: `Etapa ${doisDigitos(etapa.ordem)}: assinatura registrada`, detalhe: rot })} />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Botao onClick={baixar} disabled={gerando}>{gerando ? "Gerando…" : "Baixar relatório (.docx)"}</Botao>
            </div>
            <p className="text-xs text-tinta-2">
              O arquivo sai no papel timbrado FUNCERN + Sebraetec do modelo, com a ficha de identificação, as faixas, os quadros e as tabelas dos registros. Pode ser baixado como rascunho mesmo com pendências. Para o envio, assine pelo gov.br e suba o PDF no HUB SEBRAE.
            </p>
          </Cartao>
          <Cartao className="p-5">
            <h2 className="mb-3 font-semibold">Checagem de completude</h2>
            {pendencias.length === 0 ? (
              <p className="rounded-md bg-verde-claro p-3 text-sm text-verde">Tudo certo. A etapa pode ser marcada como “A enviar”.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {pendencias.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 rounded bg-vermelho-claro px-1.5 text-xs text-vermelho">{p.onde}</span>
                    <span>{p.texto}</span>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      )}
    </>
  );
}

function EditorSecao({ def, etapa, onChange }: { def: DefSecao; etapa: Etapa; onChange: (v: string) => void }) {
  return (
    <Cartao className={`p-5 ${def.quadro ? "border-marinho/40 bg-marinho-claro/30" : ""}`}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-marinho">{def.titulo(etapa)}</h3>
        <span className="text-xs text-tinta-2">{def.obrigatoria(etapa) ? "Obrigatória" : "Opcional"}</span>
      </div>
      <p className="mb-2 text-xs text-tinta-2">{def.ajuda}</p>
      <textarea rows={6} className="campo" value={etapa.secoes[def.chave] ?? ""} onChange={(e) => onChange(e.target.value)} />
    </Cartao>
  );
}
