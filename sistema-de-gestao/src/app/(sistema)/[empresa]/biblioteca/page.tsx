"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useAcesso, useEstado } from "@/lib/dados/store";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import { anonimizar, chaveEntregavel, type TextoBiblioteca } from "@/lib/biblioteca";
import { modelosDaEmpresa } from "@/lib/modelos";
import { secoesAntes, secoesDepois } from "@/lib/relatorio/secoes";
import { formatarData } from "@/lib/datas";
import { doisDigitos } from "@/lib/rotulos";
import { traduzirErro } from "@/lib/erros";
import { Botao, Cabecalho, Campo, Cartao, Status, Vazio } from "@/components/ui";
import { useBiblioteca } from "@/components/projeto/sugestoes-biblioteca";

type NovoTexto = { etapa: number; chave: string; ramo: string; porte: string; texto: string; empresaOrigem: string; responsavelOrigem: string };

// Biblioteca de textos aprovados: o que o SEBRAE já aceitou, anonimizado,
// para reaproveitar em projetos parecidos. Também recebe textos de
// relatórios antigos colados à mão.
export default function Biblioteca() {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { estado } = useEstado();
  const { gerencia } = useAcesso();
  const empresa = estado.empresas.find((e) => e.slug === slug)!;
  const { lista, carregado, recarregar } = useBiblioteca(slug);
  const modelo = modelosDaEmpresa(slug)[0];
  const [filtroEtapa, setFiltroEtapa] = useState<number | 0>(0);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const [edicao, setEdicao] = useState("");
  const [novo, setNovo] = useState<NovoTexto | null>(null);
  const [ocupado, setOcupado] = useState(false);

  // Seções e entregáveis possíveis de uma etapa, para escolher onde o texto entra
  const opcoes = (etapa: number) => {
    const em = modelo?.etapas.find((e) => e.ordem === etapa);
    const etapaFake = { ordem: etapa } as never;
    return [
      ...[...secoesAntes, ...secoesDepois].map((d) => ({ chave: d.chave, titulo: d.titulo(etapaFake) })),
      ...(em?.entregaveis ?? []).map((t) => ({ chave: chaveEntregavel(t), titulo: `Entregável: ${t}` })),
      ...(em?.instrumentos ?? []).map((t) => ({ chave: chaveEntregavel(t), titulo: `Instrumento: ${t}` })),
    ];
  };

  const termo = busca.trim().toLowerCase();
  const visiveis = lista.filter(
    (t) => (!filtroEtapa || t.etapa === filtroEtapa) && (!termo || `${t.titulo} ${t.ramo} ${t.texto}`.toLowerCase().includes(termo)),
  );

  const salvarEdicao = async (t: TextoBiblioteca) => {
    setOcupado(true);
    const { error } = await supabaseNavegador().from("biblioteca_textos").update({ texto: edicao }).eq("id", t.id);
    setOcupado(false);
    if (error) return alert(traduzirErro(error));
    setAberto(null);
    await recarregar();
  };

  const excluir = async (t: TextoBiblioteca) => {
    if (!confirm(`Excluir “${t.titulo}” da biblioteca? Os relatórios já feitos não mudam.`)) return;
    const { data, error } = await supabaseNavegador().from("biblioteca_textos").delete().eq("id", t.id).select("id");
    if (error || !data?.length) return alert(error ? traduzirErro(error) : "Só gestores da empresa podem excluir.");
    await recarregar();
  };

  const incluir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novo) return;
    setOcupado(true);
    const titulo = opcoes(novo.etapa).find((o) => o.chave === novo.chave)?.titulo.replace(/^(Entregável|Instrumento): /, "") ?? novo.chave;
    const texto = anonimizar(novo.texto.trim(), { razaoSocial: novo.empresaOrigem, responsavel: novo.responsavelOrigem });
    const { error } = await supabaseNavegador().from("biblioteca_textos").insert({
      empresa: slug,
      etapa: novo.etapa,
      chave: novo.chave,
      titulo,
      texto,
      ramo: novo.ramo.trim(),
      porte: novo.porte.trim(),
      origem: "manual",
    });
    setOcupado(false);
    if (error) return alert(traduzirErro(error));
    setNovo(null);
    await recarregar();
  };

  return (
    <>
      <Cabecalho
        migalhas={[{ rotulo: empresa.nome, href: `/${slug}` }, { rotulo: "Biblioteca" }]}
        titulo="Biblioteca de textos"
        subtitulo="Textos de relatórios aprovados pelo SEBRAE, sem os dados do cliente. Entram sozinhos quando uma etapa é marcada como aprovada e aparecem como sugestão nos próximos projetos."
      >
        {!novo && (
          <Botao
            onClick={() =>
              setNovo({ etapa: 1, chave: opcoes(1)[0].chave, ramo: "", porte: "", texto: "", empresaOrigem: "", responsavelOrigem: "" })
            }
          >
            Incluir texto antigo
          </Botao>
        )}
      </Cabecalho>

      {novo && (
        <Cartao className="mb-8 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Incluir texto de um relatório antigo</h2>
          <p className="mt-1 text-[15px] text-tinta-2">
            Cole uma seção de um relatório já aprovado. O nome da empresa, do responsável e as datas são trocados por marcadores antes de salvar.
          </p>
          <form onSubmit={incluir} className="mt-6 space-y-4">
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-[10rem_1fr]">
              <Campo rotulo="Etapa">
                <select
                  className="campo"
                  value={novo.etapa}
                  onChange={(e) => {
                    const etapa = Number(e.target.value);
                    setNovo({ ...novo, etapa, chave: opcoes(etapa)[0].chave });
                  }}
                >
                  {(modelo?.etapas ?? []).map((e) => (
                    <option key={e.ordem} value={e.ordem}>
                      {doisDigitos(e.ordem)} {e.nome.charAt(0) + e.nome.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Onde o texto entra">
                <select className="campo" value={novo.chave} onChange={(e) => setNovo({ ...novo, chave: e.target.value })}>
                  {opcoes(novo.etapa).map((o) => (
                    <option key={o.chave} value={o.chave}>
                      {o.titulo}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Campo rotulo="Empresa do relatório original" dica="Para tirar o nome do texto.">
                <input className="campo" value={novo.empresaOrigem} onChange={(e) => setNovo({ ...novo, empresaOrigem: e.target.value })} />
              </Campo>
              <Campo rotulo="Responsável no relatório original" dica="Para tirar o nome do texto.">
                <input className="campo" value={novo.responsavelOrigem} onChange={(e) => setNovo({ ...novo, responsavelOrigem: e.target.value })} />
              </Campo>
              <Campo rotulo="Ramo da empresa" dica="Ex.: clínica odontológica, escola de cursos. Usado para sugerir a projetos parecidos.">
                <input className="campo" value={novo.ramo} onChange={(e) => setNovo({ ...novo, ramo: e.target.value })} />
              </Campo>
              <Campo rotulo="Porte">
                <input className="campo" placeholder="Micro Empresa" value={novo.porte} onChange={(e) => setNovo({ ...novo, porte: e.target.value })} />
              </Campo>
            </div>
            <Campo rotulo="Texto">
              <textarea rows={10} required className="campo" value={novo.texto} onChange={(e) => setNovo({ ...novo, texto: e.target.value })} />
            </Campo>
            <div className="flex flex-wrap gap-3 border-t border-linha pt-5">
              <Botao type="submit" disabled={ocupado || !novo.texto.trim()}>
                {ocupado ? "Salvando…" : "Incluir na biblioteca"}
              </Botao>
              <Botao type="button" variante="secundario" onClick={() => setNovo(null)}>
                Cancelar
              </Botao>
            </div>
          </form>
        </Cartao>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Filtrar por etapa" className="flex max-w-full gap-0.5 overflow-x-auto rounded-[var(--radius-bloco)] border border-linha bg-folha shadow-[var(--shadow-cartao)] p-1">
          {[0, ...(modelo?.etapas ?? []).map((e) => e.ordem)].map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={filtroEtapa === n}
              onClick={() => setFiltroEtapa(n)}
              className={`whitespace-nowrap rounded-[var(--radius-campo)] px-3 py-1.5 text-sm ${
                filtroEtapa === n ? "bg-azul font-medium text-folha" : "text-tinta-2 hover:bg-pedra hover:text-tinta"
              }`}
            >
              {n === 0 ? "Todas" : `Etapa ${doisDigitos(n)}`} <span className="num opacity-70">{n === 0 ? lista.length : lista.filter((t) => t.etapa === n).length}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Buscar por título, ramo ou trecho"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="campo !w-72 max-w-full"
          aria-label="Buscar na biblioteca"
        />
      </div>

      {!carregado ? (
        <p className="text-[15px] text-tinta-2">Carregando…</p>
      ) : lista.length === 0 ? (
        <Vazio titulo="A biblioteca ainda está vazia">
          Quando o SEBRAE aprovar a primeira entrega e a etapa for marcada como aprovada, os textos entram aqui. Também dá para incluir textos de relatórios
          antigos.
        </Vazio>
      ) : visiveis.length === 0 ? (
        <p className="rounded-[var(--radius-bloco)] border border-dashed border-linha-forte py-10 text-center text-[15px] text-tinta-2">Nenhum texto neste filtro.</p>
      ) : (
        <ul className="divide-y divide-linha rounded-[var(--radius-bloco)] border border-linha bg-folha shadow-[var(--shadow-cartao)]">
          {visiveis.map((t) => (
            <li key={t.id} className="px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div className="min-w-0">
                  <p className="text-[15px] text-tinta">
                    <span className="num font-semibold">{doisDigitos(t.etapa)}</span> {t.titulo}
                  </p>
                  <p className="mt-0.5 text-[13px] text-tinta-2">
                    {t.ramo || "Ramo não informado"}
                    {t.porte && `, ${t.porte.toLowerCase()}`}, {formatarData(t.created_at.slice(0, 10))}
                  </p>
                </div>
                <span className="flex items-center gap-2">
                  <Status tom={t.origem === "manual" ? "neutro" : "ok"}>{t.origem === "manual" ? "Incluído à mão" : "Aprovado"}</Status>
                  <Botao
                    variante="fantasma"
                    tamanho="pequeno"
                    onClick={() => {
                      setAberto(aberto === t.id ? null : t.id);
                      setEdicao(t.texto);
                    }}
                  >
                    {aberto === t.id ? "Fechar" : "Ver e editar"}
                  </Botao>
                  {gerencia(slug) && (
                    <Botao variante="fantasma" tamanho="pequeno" className="!text-tinta-2 hover:!text-vermelho" onClick={() => excluir(t)}>
                      Excluir
                    </Botao>
                  )}
                </span>
              </div>
              {aberto === t.id ? (
                <div className="mt-3 space-y-3">
                  <p className="text-[13px] text-tinta-2">
                    Marcadores como {"{{empresa}}"}, {"{{responsavel}}"} e {"{{data}}"} recebem os dados do novo cliente na hora de usar.
                  </p>
                  <textarea rows={10} className="campo" value={edicao} onChange={(e) => setEdicao(e.target.value)} />
                  <Botao tamanho="pequeno" onClick={() => salvarEdicao(t)} disabled={ocupado || edicao === t.texto}>
                    Salvar alteração
                  </Botao>
                </div>
              ) : (
                <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm text-tinta-2">{t.texto}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
