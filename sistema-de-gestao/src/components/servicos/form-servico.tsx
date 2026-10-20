"use client";

import { useRef, useState } from "react";
import type { EtapaModelo, Servico } from "@/lib/modelos/tipos";
import { atividadesEmTexto, horasDoServico, linhasEmLista, problemasDoServico, textoEmAtividades } from "@/lib/servicos";
import { doisDigitos } from "@/lib/rotulos";
import { Botao, Campo, Cartao } from "@/components/ui";
import { IconeIA, IconeMaisSinal } from "@/components/icones";

// Etapa no formulário: checklist, entregáveis e instrumentos em texto, uma linha por item
type EtapaForm = Omit<EtapaModelo, "atividades" | "entregaveis" | "instrumentos"> & { atividades: string; entregaveis: string; instrumentos: string };

const paraForm = (e: EtapaModelo): EtapaForm => ({
  ...e,
  atividades: atividadesEmTexto(e.atividades),
  entregaveis: e.entregaveis.join("\n"),
  instrumentos: e.instrumentos.join("\n"),
});
const doForm = (e: EtapaForm, i: number): EtapaModelo => ({
  ...e,
  ordem: i + 1,
  nome: e.nome.trim(),
  descricao: e.descricao.trim(),
  horasPrevistas: Number(e.horasPrevistas) || 0,
  duracaoReferenciaDias: Number(e.duracaoReferenciaDias) || 0,
  atividades: textoEmAtividades(e.atividades),
  entregaveis: linhasEmLista(e.entregaveis),
  instrumentos: linhasEmLista(e.instrumentos),
});
const semEtapas = ({ etapas, ...resto }: Servico) => (void etapas, resto);
const etapaFormVazia = (): EtapaForm => ({
  ordem: 0,
  nome: "",
  descricao: "",
  horasPrevistas: 0,
  duracaoReferenciaDias: 0,
  atividades: "",
  entregaveis: "",
  instrumentos: "",
});

// O que a IA lê da ficha técnica
type FichaLida = Partial<Omit<Servico, "etapas">> & {
  etapas?: (Omit<EtapaModelo, "atividades" | "ordem"> & { atividades: { codigo: string; texto: string }[] })[];
};

export function FormServico({
  inicial,
  novo,
  aoSalvar,
  aoCancelar,
}: {
  inicial: Servico;
  novo: boolean;
  aoSalvar: (s: Servico) => void;
  aoCancelar: () => void;
}) {
  const [dados, setDados] = useState<Omit<Servico, "etapas">>(() => semEtapas(inicial));
  const [etapas, setEtapas] = useState<EtapaForm[]>(() => inicial.etapas.map(paraForm));
  const [tentou, setTentou] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [colar, setColar] = useState<string | null>(null);
  const [avisoIA, setAvisoIA] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const servico: Servico = { ...dados, nome: dados.nome || dados.fichaTecnica, etapas: etapas.map(doForm) };
  const problemas = problemasDoServico(servico);
  const set =
    (k: "fichaTecnica" | "nomeCurto" | "area" | "descricao" | "codigoFichaTecnica" | "prestadoraVinculada" | "areaAtuacao") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDados({ ...dados, [k]: e.target.value });
  const setEtapa = (i: number, k: keyof EtapaForm, v: string) => setEtapas(etapas.map((e, j) => (j === i ? { ...e, [k]: v } : e)));
  const mover = (i: number, d: -1 | 1) => {
    const l = [...etapas];
    [l[i], l[i + d]] = [l[i + d], l[i]];
    setEtapas(l);
  };

  const salvar = (ev: React.FormEvent) => {
    ev.preventDefault();
    setTentou(true);
    if (problemas.length) return;
    aoSalvar({
      ...servico,
      fichaTecnica: servico.fichaTecnica.trim(),
      nomeCurto: servico.nomeCurto.trim(),
      nome: servico.nome.trim(),
      versao: novo ? 1 : inicial.versao + 1,
    });
  };

  // A IA lê a ficha (PDF ou texto colado) e preenche o formulário para revisar
  const lerFicha = async (pedido: { pdf: string; nome: string } | { texto: string }) => {
    setLendo(true);
    setAvisoIA(null);
    try {
      const r = await fetch("/api/servico-ficha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pedido) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erro ?? "Não foi possível ler a ficha agora.");
      const f = d.ficha as FichaLida;
      const texto = (v: unknown, atual: string) => (typeof v === "string" && v.trim() ? v.trim() : atual);
      setDados((x) => ({
        ...x,
        fichaTecnica: texto(f.fichaTecnica, x.fichaTecnica),
        nomeCurto: texto(f.nomeCurto, x.nomeCurto),
        codigoFichaTecnica: texto(f.codigoFichaTecnica, x.codigoFichaTecnica),
        area: texto(f.area, x.area),
        descricao: texto(f.descricao, x.descricao),
        prestadoraVinculada: texto(f.prestadoraVinculada, x.prestadoraVinculada),
        areaAtuacao: texto(f.areaAtuacao, x.areaAtuacao),
      }));
      if (f.etapas?.length)
        setEtapas(
          f.etapas.map((e, i) =>
            paraForm({
              ordem: i + 1,
              nome: e.nome ?? "",
              descricao: e.descricao ?? "",
              horasPrevistas: Number(e.horasPrevistas) || 0,
              duracaoReferenciaDias: Number(e.duracaoReferenciaDias) || 0,
              atividades: (e.atividades ?? []).map((a) => [a.codigo, a.texto] as [string, string]),
              entregaveis: e.entregaveis ?? [],
              instrumentos: e.instrumentos ?? [],
            }),
          ),
        );
      setColar(null);
      setAvisoIA({ tom: "ok", texto: "Formulário preenchido com a ficha. Confira cada campo antes de salvar." });
    } catch (e) {
      setAvisoIA({ tom: "erro", texto: e instanceof Error ? e.message : "Não foi possível ler a ficha agora." });
    } finally {
      setLendo(false);
    }
  };

  const escolherPdf = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    if (arquivo.type !== "application/pdf") return setAvisoIA({ tom: "erro", texto: "Envie a ficha em PDF, ou cole o texto." });
    if (arquivo.size > 3 * 1024 * 1024) return setAvisoIA({ tom: "erro", texto: "O PDF passa de 3 MB. Cole o texto da ficha." });
    const base64 = await new Promise<string>((ok, falha) => {
      const leitor = new FileReader();
      leitor.onload = () => ok(String(leitor.result).split(",")[1] ?? "");
      leitor.onerror = () => falha(new Error("Não foi possível ler o arquivo."));
      leitor.readAsDataURL(arquivo);
    });
    await lerFicha({ pdf: base64, nome: arquivo.name });
  };

  return (
    <form onSubmit={salvar} className="space-y-6">
      <Cartao className="border-azul/20 bg-azul-claro/60 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-1 basis-72 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-folha text-azul">
              <IconeIA className="h-5 w-5" />
            </span>
            <p className="min-w-0 text-[15px] text-tinta">
              <span className="font-semibold">Tem a ficha técnica?</span> A IA lê o PDF (ou o texto colado) e preenche o formulário: etapas, horas, checklist e
              entregáveis. Depois é só conferir.
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <input
              ref={entrada}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => void escolherPdf(e.target.files?.[0]).finally(() => (e.target.value = ""))}
            />
            <Botao type="button" onClick={() => entrada.current?.click()} disabled={lendo} className="flex-1 sm:flex-none">
              {lendo ? "Lendo a ficha…" : "Enviar o PDF"}
            </Botao>
            <Botao type="button" variante="secundario" onClick={() => setColar(colar === null ? "" : null)} disabled={lendo} className="flex-1 sm:flex-none">
              Colar o texto
            </Botao>
          </div>
        </div>
        {colar !== null && (
          <div className="mt-4 space-y-3">
            <Campo rotulo="Texto da ficha técnica">
              <textarea rows={8} className="campo" value={colar} onChange={(e) => setColar(e.target.value)} />
            </Campo>
            <Botao type="button" tamanho="pequeno" disabled={lendo || colar.trim().length < 40} onClick={() => void lerFicha({ texto: colar })}>
              Preencher com este texto
            </Botao>
          </div>
        )}
        {avisoIA && <p className={`mt-3 text-sm ${avisoIA.tom === "ok" ? "text-verde" : "text-vermelho"}`}>{avisoIA.texto}</p>}
      </Cartao>

      <Cartao className="p-4 sm:p-6">
        <h2 className="text-lg font-bold">Card do serviço</h2>
        <p className="mt-1 text-sm text-tinta-2">Como aparece na lista de serviços e na escolha do serviço de um projeto novo.</p>
        <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Campo rotulo="Nome do serviço (como na ficha técnica)" className="sm:col-span-2">
            <input className="campo" value={dados.fichaTecnica} onChange={set("fichaTecnica")} placeholder="Ex.: Planejamento Estratégico Tecnológico com IA" />
          </Campo>
          <Campo rotulo="Nome curto" dica="Aparece nos cartões dos projetos, para distinguir os serviços de um mesmo cliente.">
            <input className="campo" value={dados.nomeCurto} onChange={set("nomeCurto")} placeholder="Ex.: Planejamento com IA" />
          </Campo>
          <Campo rotulo="Tema" dica="Como no catálogo do Sebraetec. Ex.: Gestão da Qualidade.">
            <input className="campo" value={dados.area} onChange={set("area")} />
          </Campo>
          <Campo rotulo="Descrição" className="sm:col-span-2">
            <textarea rows={3} maxLength={400} className="campo" value={dados.descricao} onChange={set("descricao")} />
          </Campo>
          <Campo rotulo="Código da ficha técnica">
            <input className="campo num" value={dados.codigoFichaTecnica} onChange={set("codigoFichaTecnica")} placeholder="Ex.: 13070-5" />
          </Campo>
          <Campo rotulo="Prestadora vinculada">
            <input className="campo" value={dados.prestadoraVinculada} onChange={set("prestadoraVinculada")} />
          </Campo>
          <Campo
            rotulo="Área de atuação nos relatórios"
            className="sm:col-span-2"
            dica="Texto da ficha de identificação dos relatórios; o ramo do cliente é acrescentado."
          >
            <input className="campo" value={dados.areaAtuacao} onChange={set("areaAtuacao")} />
          </Campo>
          <label className="flex items-center gap-3 sm:col-span-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-azul"
              checked={dados.credenciado}
              onChange={(e) => setDados({ ...dados, credenciado: e.target.checked })}
            />
            <span className="text-[15px] text-tinta">Credenciado no Sebraetec para este serviço</span>
          </label>
        </div>
      </Cartao>

      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Etapas</h2>
          <span className="num text-sm text-tinta-2">
            {etapas.length} {etapas.length === 1 ? "etapa" : "etapas"} · {horasDoServico(servico)} h no total
          </span>
        </div>
        <ol className="space-y-4">
          {etapas.map((e, i) => (
            <li key={i}>
              <Cartao className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="num text-[17px] font-bold text-azul">Etapa {doisDigitos(i + 1)}</h3>
                  <div className="flex gap-1">
                    <Botao
                      type="button"
                      variante="fantasma"
                      tamanho="pequeno"
                      disabled={i === 0}
                      onClick={() => mover(i, -1)}
                      aria-label={`Subir a etapa ${i + 1}`}
                    >
                      ↑
                    </Botao>
                    <Botao
                      type="button"
                      variante="fantasma"
                      tamanho="pequeno"
                      disabled={i === etapas.length - 1}
                      onClick={() => mover(i, 1)}
                      aria-label={`Descer a etapa ${i + 1}`}
                    >
                      ↓
                    </Botao>
                    <Botao
                      type="button"
                      variante="fantasma"
                      tamanho="pequeno"
                      disabled={etapas.length === 1}
                      onClick={() => confirm(`Remover a etapa ${doisDigitos(i + 1)}?`) && setEtapas(etapas.filter((_, j) => j !== i))}
                      className="hover:!text-vermelho"
                    >
                      Remover
                    </Botao>
                  </div>
                </div>
                <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-[1fr_8rem_10rem]">
                  <Campo rotulo="Nome da etapa">
                    <input className="campo" value={e.nome} onChange={(ev) => setEtapa(i, "nome", ev.target.value)} placeholder="Ex.: Diagnóstico" />
                  </Campo>
                  <Campo rotulo="Horas">
                    <input
                      className="campo num"
                      type="number"
                      min={0}
                      value={e.horasPrevistas || ""}
                      onChange={(ev) => setEtapa(i, "horasPrevistas", ev.target.value)}
                    />
                  </Campo>
                  <Campo rotulo="Duração (dias)" dica="De referência, para o plano de trabalho.">
                    <input
                      className="campo num"
                      type="number"
                      min={0}
                      value={e.duracaoReferenciaDias || ""}
                      onChange={(ev) => setEtapa(i, "duracaoReferenciaDias", ev.target.value)}
                    />
                  </Campo>
                  <Campo rotulo="Descrição (objetivo da etapa)" className="sm:col-span-3">
                    <textarea rows={2} className="campo" value={e.descricao} onChange={(ev) => setEtapa(i, "descricao", ev.target.value)} />
                  </Campo>
                  <Campo
                    rotulo="Checklist de atividades"
                    className="sm:col-span-3"
                    dica='Uma atividade por linha, com o código na frente: "1 Atividade" e "1.1 Subatividade".'
                  >
                    <textarea rows={6} className="campo num" value={e.atividades} onChange={(ev) => setEtapa(i, "atividades", ev.target.value)} />
                  </Campo>
                  <Campo rotulo="Entregáveis" className="sm:col-span-3" dica="Um por linha, como na ficha técnica.">
                    <textarea rows={4} className="campo" value={e.entregaveis} onChange={(ev) => setEtapa(i, "entregaveis", ev.target.value)} />
                  </Campo>
                  <Campo rotulo="Instrumentos complementares (opcional)" className="sm:col-span-3" dica="Um por linha.">
                    <textarea rows={2} className="campo" value={e.instrumentos} onChange={(ev) => setEtapa(i, "instrumentos", ev.target.value)} />
                  </Campo>
                </div>
              </Cartao>
            </li>
          ))}
        </ol>
        <Botao type="button" variante="secundario" className="mt-4" onClick={() => setEtapas([...etapas, etapaFormVazia()])}>
          <IconeMaisSinal className="h-4 w-4" />
          Incluir etapa
        </Botao>
      </div>

      {tentou && problemas.length > 0 && (
        <ul className="list-disc space-y-1 rounded-[var(--radius-bloco)] border border-vermelho/25 bg-vermelho-claro py-3 pl-8 pr-4 text-sm text-vermelho">
          {problemas.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3 border-t border-linha pt-5">
        <Botao type="submit" className="flex-1 sm:flex-none">
          {novo ? "Cadastrar serviço" : "Salvar alterações"}
        </Botao>
        <Botao type="button" variante="secundario" onClick={aoCancelar} className="flex-1 sm:flex-none">
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
