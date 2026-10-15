"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useEstado } from "@/lib/dados/store";
import { BotaoLink, Cabecalho, Cartao, Vazio } from "@/components/ui";
import { LinhaProjeto } from "@/components/linha-projeto";

const filtros = {
  andamento: "Ativos",
  sem_plano: "Sem plano",
  encerrados: "Encerrados",
  todos: "Todos",
} as const;
type Filtro = keyof typeof filtros;

export default function ModuloEmpresa() {
  const { empresa: slug } = useParams<{ empresa: string }>();
  const { estado } = useEstado();
  const empresa = estado.empresas.find((e) => e.slug === slug)!;
  const [filtro, setFiltro] = useState<Filtro>("andamento");
  const [busca, setBusca] = useState("");

  const daEmpresa = estado.projetos.filter((p) => p.empresa === slug);
  const cliente = (id: string) => estado.clientes.find((c) => c.id === id);
  const passaFiltro = (status: string) =>
    filtro === "todos" ||
    (filtro === "andamento" && status !== "encerrado") ||
    (filtro === "sem_plano" && status === "aguardando_plano") ||
    (filtro === "encerrados" && status === "encerrado");
  const termo = busca.trim().toLowerCase();
  const projetos = daEmpresa.filter((p) => {
    const c = cliente(p.clienteId);
    const texto = `${c?.razaoSocial} ${c?.nomeFantasia} ${p.numeroProjetoHub}`.toLowerCase();
    return passaFiltro(p.status) && (!termo || texto.includes(termo));
  });
  const contagem = (f: Filtro) =>
    daEmpresa.filter((p) =>
      f === "todos" ? true : f === "andamento" ? p.status !== "encerrado" : f === "sem_plano" ? p.status === "aguardando_plano" : p.status === "encerrado",
    ).length;

  return (
    <>
      <Cabecalho titulo={empresa.nome} subtitulo="Adequação à LGPD pelo HUB SEBRAE, ficha técnica 13070-5">
        <BotaoLink href={`/${slug}/clientes`} variante="secundario">
          Clientes
        </BotaoLink>
        <BotaoLink href={`/${slug}/projetos/novo`}>Novo projeto</BotaoLink>
      </Cabecalho>

      {daEmpresa.length === 0 ? (
        <Vazio
          titulo="Nenhum projeto ainda"
          acao={<BotaoLink href={`/${slug}/projetos/novo`}>Criar o primeiro projeto</BotaoLink>}
        >
          Cada contratação do HUB SEBRAE vira um projeto, com as cinco etapas da ficha 13070-5, o checklist e o relatório de cada entrega.
        </Vazio>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div role="radiogroup" aria-label="Filtrar projetos" className="flex max-w-full gap-0.5 overflow-x-auto rounded-[var(--radius-bloco)] border border-linha bg-folha p-1">
              {(Object.keys(filtros) as Filtro[]).map((f) => (
                <button
                  key={f}
                  role="radio"
                  aria-checked={filtro === f}
                  onClick={() => setFiltro(f)}
                  className={`whitespace-nowrap rounded-[var(--radius-campo)] px-3.5 py-1.5 text-sm transition-colors ${
                    filtro === f ? "bg-garrafa font-medium text-folha" : "text-tinta-2 hover:bg-pedra hover:text-tinta"
                  }`}
                >
                  {filtros[f]} <span className="num opacity-70">{contagem(f)}</span>
                </button>
              ))}
            </div>
            <input
              type="search"
              placeholder="Buscar cliente ou nº do projeto"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="campo !w-72 max-w-full"
              aria-label="Buscar projetos"
            />
          </div>

          {projetos.length === 0 ? (
            <p className="rounded-[var(--radius-bloco)] border border-dashed border-linha-forte py-10 text-center text-[15px] text-tinta-2">
              Nenhum projeto neste filtro.
            </p>
          ) : (
            <Cartao>
              <ul className="divide-y divide-linha">
                {projetos.map((p) => (
                  <LinhaProjeto key={p.id} projeto={p} />
                ))}
              </ul>
            </Cartao>
          )}
        </>
      )}
    </>
  );
}
