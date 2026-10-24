"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import {
  AVISO_DO_LOTE,
  consumirItemDoLote,
  descartarLote,
  pegarItemDoLote,
  pegarLote,
  type ItemDoLote,
  type LoteDoHub as Lote,
  type PendenteDoHub,
} from "@/lib/hub-extensao";
import { Botao, Chip } from "@/components/ui";
import { ImportarHubNovo } from "./importar-hub-novo";

const digitos = (t: string) => (t ?? "").replace(/\D/g, "");
type Resultado = { estado: "criado" | "pulado"; projetoId?: string };

// "Ler todos os projetos da lista": a extensão leu cada pedido da lista do HUB e guardou. Aqui cada um vira um projeto
// (com o cliente), um depois do outro: automaticamente, ou um a um para conferir. O que já existe no Blimp fica de fora.
export function LoteDoHub({ slug, aoFechar }: { slug: EmpresaSlug; aoFechar: () => void }) {
  const { estado } = useEstado();
  const [lote, setLote] = useState<Lote | null | undefined>(undefined);
  const [resultados, setResultados] = useState<Record<string, Resultado>>({});
  const [atual, setAtual] = useState<{ item: ItemDoLote; pendente: PendenteDoHub; automatico: boolean } | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fila = useRef<string[]>([]);
  const itensRef = useRef<ItemDoLote[]>([]);

  useEffect(() => {
    const carregar = () =>
      void pegarLote().then((l) => {
        setLote(l);
        itensRef.current = l?.itens ?? [];
      });
    carregar();
    const ouvir = (ev: MessageEvent) => {
      if (ev.source === window && ev.origin === window.location.origin && ev.data?.tipo === AVISO_DO_LOTE) carregar();
    };
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, []);

  const existente = (item: ItemDoLote) => estado.projetos.find((p) => p.empresa === slug && digitos(p.codigoSolicitacaoHub || p.numeroProjetoHub) === digitos(item.codigo));

  const abrir = async (item: ItemDoLote, automatico: boolean) => {
    setAbrindo(true);
    setErro(null);
    const pendente = await pegarItemDoLote(item.id);
    setAbrindo(false);
    if (!pendente) {
      setErro(`Não consegui pegar o pedido ${item.codigo} com a extensão. Confira se ela continua instalada e leia a lista de novo.`);
      fila.current = [];
      return;
    }
    setAtual({ item, pendente, automatico });
  };
  const proximo = () => {
    setAtual(null);
    const id = fila.current.shift();
    const item = id ? itensRef.current.find((x) => x.id === id) : undefined;
    if (item) void abrir(item, true);
  };
  const terminou = (item: ItemDoLote, r: Resultado) => {
    setResultados((x) => ({ ...x, [item.id]: r }));
    if (r.estado === "criado") void consumirItemDoLote(item.id);
    proximo();
  };
  const criarTodos = () => {
    fila.current = (lote?.itens ?? []).filter((i) => !existente(i) && !resultados[i.id]).map((i) => i.id);
    proximo();
  };
  const descartar = async () => {
    await descartarLote();
    aoFechar();
  };

  if (lote === undefined) return <p className="mb-6 text-[13px] text-tinta-2">Procurando pedidos lidos pela extensão…</p>;
  if (lote === null)
    return (
      <div className="mb-8 space-y-3 rounded-[var(--radius-bloco)] border border-linha bg-pedra/60 p-3 sm:p-5">
        <h2 className="text-lg font-bold">Pedidos lidos do HUB</h2>
        <p className="text-[14px] text-tinta-2">Não há pedidos esperando. Na lista de projetos do HUB, clique no ícone da extensão e em “Ler todos os projetos da lista”.</p>
        <Botao variante="fantasma" tamanho="pequeno" onClick={aoFechar}>
          Fechar
        </Botao>
      </div>
    );

  const itens = lote.itens;
  const aCriar = itens.filter((i) => !existente(i) && !resultados[i.id]);
  const criados = Object.values(resultados).filter((r) => r.estado === "criado").length;
  const ocupado = !!atual || abrindo;

  return (
    <div className="mb-8 space-y-4 rounded-[var(--radius-bloco)] border border-linha bg-pedra/60 p-3 sm:p-5" aria-label="Pedidos lidos do HUB">
      <div>
        <h2 className="text-lg font-bold">
          Pedidos lidos do HUB <span className="num text-tinta-2">({itens.length})</span>
        </h2>
        <p className="text-[13px] text-tinta-2">
          A extensão abriu cada pedido da lista, leu a página, o botão de situação e os anexos. Cada pedido vira um projeto, com o cliente cadastrado pelo CNPJ. Os que já existem aqui ficam de fora.
          {lote.interrompido ? " A leitura foi interrompida antes do fim da lista." : ""}
        </p>
      </div>

      {lote.problemas.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-laranja">
          {lote.problemas.map((p, k) => (
            <li key={k}>
              {p.codigo ? `Pedido ${p.codigo}: ` : ""}
              {p.motivo}
            </li>
          ))}
        </ul>
      )}
      {erro && (
        <p role="alert" className="text-[13px] text-vermelho">
          {erro}
        </p>
      )}

      {atual && (
        <div className="space-y-2">
          <h3 className="text-[14px] font-bold">
            Pedido {atual.item.codigo}
            {atual.automatico ? " (criando automaticamente)" : ""}
          </h3>
          <ImportarHubNovo
            key={atual.item.id}
            slug={slug}
            inicial={atual.pendente}
            automatico={atual.automatico}
            rotuloFechar={atual.automatico ? "Pular este pedido" : "Voltar à lista"}
            aoFechar={() => terminou(atual.item, { estado: "pulado" })}
            aoCriado={(projetoId) => terminou(atual.item, { estado: "criado", projetoId })}
          />
        </div>
      )}

      <ul className="divide-y divide-linha rounded-[var(--radius-campo)] bg-folha ring-1 ring-linha">
        {itens.map((i) => {
          const r = resultados[i.id];
          const ja = existente(i);
          const agora = atual?.item.id === i.id;
          return (
            <li key={i.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 text-[14px]">
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold">
                  <span className="num">{i.codigo}</span> · {i.titulo || "Pedido do HUB"}
                </p>
                <p className="text-[12px] text-tinta-2">
                  {i.status ? `${i.status} · ` : ""}
                  {i.arquivos} {i.arquivos === 1 ? "arquivo baixado" : "arquivos baixados"}
                  {i.falhas ? ` · ${i.falhas} sem baixar` : ""}
                </p>
              </div>
              {agora ? (
                <Chip tom="atencao">lendo agora</Chip>
              ) : r?.estado === "criado" ? (
                <Link className="font-semibold text-azul hover:underline" href={`/${slug}/projetos/${r.projetoId}`}>
                  Criado: abrir
                </Link>
              ) : r?.estado === "pulado" ? (
                <Chip tom="neutro">pulado</Chip>
              ) : ja ? (
                <Link className="font-semibold text-azul hover:underline" href={`/${slug}/projetos/${ja.id}`}>
                  Já existe: abrir
                </Link>
              ) : (
                <Botao variante="secundario" tamanho="pequeno" disabled={ocupado} onClick={() => void abrir(i, false)}>
                  Revisar e criar
                </Botao>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <Botao tamanho="pequeno" onClick={criarTodos} disabled={ocupado || aCriar.length === 0}>
          {aCriar.length ? `Criar todos automaticamente (${aCriar.length})` : "Nada mais a criar"}
        </Botao>
        <Botao variante="fantasma" tamanho="pequeno" onClick={() => void descartar()} disabled={ocupado}>
          Descartar o que a extensão guardou
        </Botao>
        <Botao variante="fantasma" tamanho="pequeno" onClick={aoFechar} disabled={ocupado}>
          Fechar
        </Botao>
        {criados > 0 && <span className="text-[13px] font-semibold text-verde">{criados} {criados === 1 ? "projeto criado" : "projetos criados"}</span>}
      </div>
      <p className="text-[12px] text-tinta-2">
        Criar automaticamente cria o projeto sozinho quando o CNPJ e o serviço foram reconhecidos; quando falta algo, o pedido espera por você (resolva e ele é criado em seguida, ou pule). Datas que o HUB não mostra entram como estimativa, marcada no histórico.
      </p>
    </div>
  );
}
