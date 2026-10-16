"use client";

import { useRef, useState } from "react";
import type { Evidencia, Projeto, RegistroAtividade, TipoAtividade } from "@/lib/dados/tipos";
import { novoId } from "@/lib/dados/store";
import { formatarData, hojeIso } from "@/lib/datas";
import { horasDoProjeto, horasFmt, registros, tiposAtividade } from "@/lib/horas";
import { etapaAtual } from "@/lib/projeto";
import { doisDigitos } from "@/lib/rotulos";
import { Barra, Botao, Campo, Cartao, Status, Vazio } from "@/components/ui";
import { subirEvidencia } from "./evidencias";
import { useProjeto } from "./use-projeto";

type Form = Omit<RegistroAtividade, "id" | "registradoPor" | "horas"> & { horas: string };

// Visitas, reuniões e trabalho interno do projeto: somam as horas contra as
// previstas na ficha e as anotações alimentam a redação do relatório.
// Com `etapa`, mostra e registra só a daquela etapa.
export function Visitas({ projeto, etapa }: { projeto: Projeto; etapa?: number }) {
  const { alterar, usuario } = useProjeto();
  const h = horasDoProjeto(projeto);
  const lista = registros(projeto)
    .filter((r) => etapa === undefined || r.etapa === etapa)
    .sort((a, b) => b.data.localeCompare(a.data));
  const etapaPadrao = etapa ?? etapaAtual(projeto)?.ordem ?? 1;
  const vazio: Form = { data: hojeIso(), etapa: etapaPadrao, tipo: "visita", horas: "", participantes: "", anotacoes: "" };
  const [editando, setEditando] = useState<string | null>(null); // id, "novo" ou null
  const [form, setForm] = useState<Form>(vazio);
  const [fotos, setFotos] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const entradaFotos = useRef<HTMLInputElement>(null);

  const abrir = (r?: RegistroAtividade) => {
    setEditando(r ? r.id : "novo");
    setForm(r ? { ...r, horas: String(r.horas).replace(".", ",") } : vazio);
    setFotos([]);
    setErro(null);
  };

  const horas = Number(form.horas.replace(",", "."));
  const valido = form.data && horas > 0 && horas <= 24;

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    setSalvando(true);
    setErro(null);
    try {
      // Fotos viram evidências da etapa, com a data da visita na legenda
      const evidencias: Evidencia[] = [];
      for (const f of fotos) {
        evidencias.push(await subirEvidencia(projeto, form.etapa, f, `${tiposAtividade[form.tipo].rotulo} de ${formatarData(form.data)}`));
      }
      const registro: RegistroAtividade = {
        id: editando === "novo" || !editando ? novoId("atv") : editando,
        data: form.data,
        etapa: form.etapa,
        tipo: form.tipo,
        horas,
        participantes: form.tipo === "trabalho_interno" ? "" : form.participantes.trim(),
        anotacoes: form.anotacoes.trim(),
        registradoPor: usuario.nome,
      };
      alterar(
        (p) => {
          const l = (p.atividadesRegistradas ??= []);
          const i = l.findIndex((x) => x.id === registro.id);
          if (i >= 0) l[i] = registro;
          else l.push(registro);
          if (evidencias.length) (p.etapas.find((x) => x.ordem === registro.etapa)!.evidencias ??= []).push(...evidencias);
        },
        {
          acao: `${tiposAtividade[registro.tipo].rotulo} ${editando === "novo" ? "registrada" : "editada"}`,
          detalhe: `Etapa ${doisDigitos(registro.etapa)}, ${formatarData(registro.data)}, ${horasFmt(registro.horas)}${evidencias.length ? `, ${evidencias.length} foto(s)` : ""}`,
        },
      );
      setEditando(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const remover = (r: RegistroAtividade) => {
    if (!confirm(`Remover o registro de ${formatarData(r.data)} (${horasFmt(r.horas)})? As fotos enviadas continuam nas evidências da etapa.`)) return;
    alterar((p) => void (p.atividadesRegistradas = (p.atividadesRegistradas ?? []).filter((x) => x.id !== r.id)), {
      acao: `${tiposAtividade[r.tipo].rotulo} removida`,
      detalhe: `Etapa ${doisDigitos(r.etapa)}, ${formatarData(r.data)}`,
    });
  };

  const resumoEtapa = etapa !== undefined ? h.porEtapa.find((x) => x.ordem === etapa) : null;

  return (
    <div className="space-y-6">
      {/* Resumo: horas e visitas contra o previsto */}
      {resumoEtapa ? (
        <Cartao className="flex flex-wrap items-center justify-between gap-6 px-6 py-5">
          <div className="min-w-56 flex-1">
            <p className="text-[13px] text-tinta-2">Horas registradas nesta etapa</p>
            <p className="mt-1 text-2xl font-semibold">
              {horasFmt(resumoEtapa.realizadas)} <span className="text-base font-normal text-tinta-2">de {resumoEtapa.previstas} h previstas</span>
            </p>
            <div className="mt-2 max-w-sm">
              <Barra valor={resumoEtapa.realizadas} total={resumoEtapa.previstas} tom={resumoEtapa.realizadas > resumoEtapa.previstas ? "atencao" : "andamento"} />
            </div>
          </div>
          {!editando && <Botao onClick={() => abrir()}>Registrar atividade</Botao>}
        </Cartao>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Cartao className="px-5 py-4">
            <p className="text-[13px] text-tinta-2">Horas registradas</p>
            <p className="mt-1 text-2xl font-semibold">
              {horasFmt(h.realizadas)} <span className="text-base font-normal text-tinta-2">de {h.previstas} h</span>
            </p>
            <div className="mt-2">
              <Barra valor={h.realizadas} total={h.previstas} tom={h.realizadas > h.previstas ? "atencao" : "andamento"} />
            </div>
          </Cartao>
          <Cartao className="px-5 py-4">
            <p className="text-[13px] text-tinta-2">Visitas presenciais</p>
            <p className="mt-1 text-2xl font-semibold">
              {h.visitas}{" "}
              <span className="text-base font-normal text-tinta-2">
                {h.visitasPrevistas ? `de ${h.visitasPrevistas} previstas` : "(número previsto não informado na ficha)"}
              </span>
            </p>
          </Cartao>
          {!editando && (
            <div className="flex items-center">
              <Botao onClick={() => abrir()}>Registrar atividade</Botao>
            </div>
          )}
        </div>
      )}

      {editando && (
        <Cartao className="p-6">
          <h3 className="font-serif text-xl">{editando === "novo" ? "Registrar atividade" : "Editar registro"}</h3>
          <form onSubmit={salvar} className="mt-5 space-y-5">
            <div role="radiogroup" aria-label="Tipo de atividade" className="flex flex-wrap gap-2">
              {(Object.keys(tiposAtividade) as TipoAtividade[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={form.tipo === t}
                  onClick={() => setForm({ ...form, tipo: t })}
                  className={`rounded-[var(--radius-campo)] border px-3.5 py-1.5 text-sm ${
                    form.tipo === t ? "border-garrafa bg-garrafa text-folha" : "border-linha-forte bg-folha text-tinta-2 hover:text-tinta"
                  }`}
                >
                  {tiposAtividade[t].rotulo}
                </button>
              ))}
            </div>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
              <Campo rotulo="Data">
                <input type="date" required className="campo num" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </Campo>
              <Campo rotulo="Horas" dica="Ex.: 2 ou 1,5">
                <input
                  required
                  inputMode="decimal"
                  className="campo num"
                  value={form.horas}
                  onChange={(e) => setForm({ ...form, horas: e.target.value.replace(/[^\d.,]/g, "") })}
                />
              </Campo>
              <Campo rotulo="Etapa">
                <select
                  className="campo"
                  value={form.etapa}
                  disabled={etapa !== undefined}
                  onChange={(e) => setForm({ ...form, etapa: Number(e.target.value) })}
                >
                  {projeto.etapas.map((x) => (
                    <option key={x.ordem} value={x.ordem}>
                      {doisDigitos(x.ordem)} {x.nome.charAt(0) + x.nome.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            {form.tipo !== "trabalho_interno" && (
              <Campo rotulo="Participantes" dica="Quem esteve presente, com o cargo. Ex.: Artur Medeiros (diretor), Ana (RH)">
                <input className="campo" value={form.participantes} onChange={(e) => setForm({ ...form, participantes: e.target.value })} />
              </Campo>
            )}
            <Campo
              rotulo="Anotações"
              dica="O que foi feito, levantado e decidido, e o que ficou pendente. Pode colar a transcrição de um áudio. Essas anotações são usadas para redigir o relatório da etapa."
            >
              <textarea rows={8} className="campo" value={form.anotacoes} onChange={(e) => setForm({ ...form, anotacoes: e.target.value })} />
            </Campo>
            {editando === "novo" && (
              <div className="flex flex-wrap items-center gap-3">
                <Botao type="button" variante="secundario" tamanho="pequeno" onClick={() => entradaFotos.current?.click()}>
                  Adicionar fotos
                </Botao>
                <span className="text-[13px] text-tinta-2">
                  {fotos.length ? `${fotos.length} foto(s): entram como evidências da etapa` : "Opcional. As fotos entram como evidências do relatório."}
                </span>
                <input
                  ref={entradaFotos}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  hidden
                  onChange={(e) => setFotos(Array.from(e.target.files ?? []))}
                />
              </div>
            )}
            {erro && <p className="rounded-[var(--radius-campo)] bg-vinho-claro p-3 text-sm text-vinho">{erro}</p>}
            <div className="flex flex-wrap items-center gap-3 border-t border-linha pt-5">
              <Botao type="submit" disabled={!valido || salvando}>
                {salvando ? "Salvando…" : "Salvar registro"}
              </Botao>
              <Botao type="button" variante="secundario" onClick={() => setEditando(null)}>
                Cancelar
              </Botao>
              {!valido && form.horas && <span className="text-sm text-vinho">Informe as horas entre 0 e 24.</span>}
            </div>
          </form>
        </Cartao>
      )}

      {/* Horas por etapa (só na visão do projeto) */}
      {etapa === undefined && (
        <Cartao className="px-6 py-5">
          <h3 className="mb-4 font-serif text-lg">Horas por etapa</h3>
          <ul className="space-y-3">
            {h.porEtapa.map((x) => {
              const et = projeto.etapas.find((e) => e.ordem === x.ordem)!;
              return (
                <li key={x.ordem} className="grid grid-cols-[minmax(0,12rem)_1fr_7rem] items-center gap-4 text-sm">
                  <span className="truncate">
                    <span className="num font-serif">{doisDigitos(x.ordem)}</span> {et.nome.charAt(0) + et.nome.slice(1).toLowerCase()}
                  </span>
                  <Barra valor={x.realizadas} total={x.previstas} tom={x.realizadas > x.previstas ? "atencao" : "andamento"} />
                  <span className="num text-right text-tinta-2">
                    {horasFmt(x.realizadas)} / {x.previstas} h
                  </span>
                </li>
              );
            })}
          </ul>
        </Cartao>
      )}

      {lista.length === 0 ? (
        !editando && (
          <Vazio titulo="Nenhuma atividade registrada">
            Registre cada visita, reunião remota e período de trabalho interno. As horas são somadas contra as {etapa === undefined ? h.previstas : resumoEtapa?.previstas}{" "}
            h previstas e as anotações ajudam a redigir o relatório.
          </Vazio>
        )
      ) : (
        <ul className="divide-y divide-linha rounded-[var(--radius-bloco)] border border-linha bg-folha">
          {lista.map((r) => (
            <li key={r.id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div className="min-w-0">
                  <p className="text-[15px]">
                    <span className="num font-medium">{formatarData(r.data)}</span>
                    <span className="text-tinta-2">
                      , {tiposAtividade[r.tipo].rotulo.toLowerCase()}, {horasFmt(r.horas)}
                      {etapa === undefined && `, etapa ${doisDigitos(r.etapa)}`}
                    </span>
                  </p>
                  {r.participantes && <p className="mt-0.5 text-sm text-tinta-2">Com {r.participantes}</p>}
                </div>
                <span className="flex items-center gap-2">
                  {!r.anotacoes && r.tipo !== "trabalho_interno" && <Status tom="atencao">Sem anotações</Status>}
                  <Botao variante="fantasma" tamanho="pequeno" onClick={() => abrir(r)}>
                    Editar
                  </Botao>
                  <Botao variante="fantasma" tamanho="pequeno" className="!text-tinta-2 hover:!text-vinho" onClick={() => remover(r)}>
                    Remover
                  </Botao>
                </span>
              </div>
              {r.anotacoes && <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-tinta">{r.anotacoes}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
