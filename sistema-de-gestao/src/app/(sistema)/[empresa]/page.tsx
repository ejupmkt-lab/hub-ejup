"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useEstado } from "@/lib/dados/store";
import { etapaAtual, etapaConcluida, situacaoPrazo } from "@/lib/projeto";
import { doisDigitos } from "@/lib/rotulos";
import { BotaoLink, Cabecalho, Selo, Status, StatusEtapa, Vazio } from "@/components/ui";
import { Trilho } from "@/components/trilho";

const filtros = {
  andamento: "Em andamento",
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
    (filtro === "andamento" && status === "em_andamento") ||
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
      f === "todos" ? true : f === "andamento" ? p.status === "em_andamento" : f === "sem_plano" ? p.status === "aguardando_plano" : p.status === "encerrado",
    ).length;

  return (
    <>
      <Cabecalho titulo={empresa.nome} subtitulo="Adequação à LGPD pelo HUB SEBRAE">
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
            <div role="radiogroup" aria-label="Filtrar projetos" className="flex flex-wrap gap-1">
              {(Object.keys(filtros) as Filtro[]).map((f) => (
                <button
                  key={f}
                  role="radio"
                  aria-checked={filtro === f}
                  onClick={() => setFiltro(f)}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    filtro === f ? "bg-garrafa text-folha" : "text-tinta-2 hover:bg-folha hover:text-tinta"
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
            <p className="py-10 text-center text-[15px] text-tinta-2">Nenhum projeto neste filtro.</p>
          ) : (
            <ul className="divide-y divide-linha border-y border-linha">
              {projetos.map((p) => {
                const c = cliente(p.clienteId);
                const consultor = estado.usuarios.find((u) => u.id === p.consultorId);
                const et = etapaAtual(p);
                const sit = et && p.status === "em_andamento" ? situacaoPrazo(et) : null;
                const feitas = p.etapas.filter(etapaConcluida).length;
                return (
                  <li key={p.id}>
                    <div className="py-6">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-8 gap-y-2">
                        <div className="min-w-0">
                          <Link href={`/${slug}/projetos/${p.id}`} className="font-serif text-[21px] leading-snug text-tinta hover:text-garrafa">
                            {c?.razaoSocial}
                          </Link>
                          <p className="num mt-1 text-sm text-tinta-2">
                            Projeto HUB {p.numeroProjetoHub || "sem número"}, consultor {consultor?.nome ?? "a definir"}, {feitas} de {p.etapas.length} etapas
                            concluídas
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {p.status === "aguardando_plano" ? (
                            <Selo tom="atencao">Definir plano de trabalho</Selo>
                          ) : et ? (
                            <>
                              <span className="text-sm text-tinta-2">Etapa {doisDigitos(et.ordem)}</span>
                              <StatusEtapa status={et.status} />
                              {sit && sit.tom !== "neutro" && <Selo tom={sit.tom}>{sit.texto}</Selo>}
                            </>
                          ) : (
                            <Status tom="ok">Etapas concluídas</Status>
                          )}
                        </div>
                      </div>
                      <Trilho projeto={p} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}
