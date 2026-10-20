"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useAcesso, useEstado } from "@/lib/dados/store";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import { horasDoServico, servicosDaEmpresa } from "@/lib/servicos";
import { BotaoLink, Cabecalho, Cartao, Chip, Vazio } from "@/components/ui";
import { IconeBusca, IconeMaisSinal } from "@/components/icones";

// Serviços da empresa, em cartões como no catálogo do Sebraetec. Cada um abre
// a ficha técnica (etapas do projeto) e a biblioteca de textos do serviço.
export default function Servicos() {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { estado } = useEstado();
  const { gerencia } = useAcesso();
  const [busca, setBusca] = useState("");
  const empresa = estado.empresas.find((e) => e.slug === slug)!;
  const todos = servicosDaEmpresa(estado, slug);
  const termo = busca.trim().toLowerCase();
  const servicos = todos.filter(
    (s) => !termo || `${s.fichaTecnica} ${s.nomeCurto} ${s.area} ${s.descricao} ${s.codigoFichaTecnica}`.toLowerCase().includes(termo),
  );
  const podeCadastrar = gerencia(slug);

  return (
    <>
      <Cabecalho
        migalhas={[{ rotulo: empresa.nome, href: `/${slug}` }, { rotulo: "Serviços" }]}
        titulo="Serviços"
        subtitulo="As fichas técnicas que a empresa presta. Cada serviço define as etapas dos projetos e tem a sua biblioteca de textos."
      >
        {podeCadastrar && (
          <BotaoLink href={`/${slug}/servicos/novo`} className="w-full sm:w-auto">
            <IconeMaisSinal className="h-4 w-4" />
            Novo serviço
          </BotaoLink>
        )}
      </Cabecalho>

      {todos.length === 0 ? (
        <Vazio titulo="Nenhum serviço cadastrado" acao={podeCadastrar && <BotaoLink href={`/${slug}/servicos/novo`}>Cadastrar serviço</BotaoLink>}>
          Cadastre a ficha técnica do serviço (etapas, atividades e entregáveis). Os projetos novos já nascem com essas etapas.
        </Vazio>
      ) : (
        <>
          {todos.length > 3 && (
            <label className="relative mb-5 block max-w-sm">
              <span className="sr-only">Buscar serviço</span>
              <IconeBusca className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta-2" />
              <input
                type="search"
                className="campo !pl-10"
                placeholder="Buscar por nome, tema ou ficha"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </label>
          )}
          {servicos.length === 0 ? (
            <p className="rounded-[var(--radius-bloco)] border border-dashed border-linha-forte py-10 text-center text-[15px] text-tinta-2">
              Nenhum serviço com essa busca.
            </p>
          ) : (
            <ul className="grid max-w-5xl gap-5 md:grid-cols-2">
              {servicos.map((s) => {
                const projetos = estado.projetos.filter((p) => p.modeloId === s.id);
                const ativos = projetos.filter((p) => p.status !== "encerrado").length;
                return (
                  <li key={s.id} className="flex">
                    <Cartao className="flex w-full flex-col bg-gradient-to-b from-folha to-azul-claro/50 p-5 sm:p-7">
                      <h2 className="text-balance break-words text-[17px] font-semibold leading-snug text-tinta">{s.fichaTecnica}</h2>
                      {s.area && <p className="mt-1.5 text-[15px] font-semibold text-azul">{s.area}</p>}
                      <hr className="my-4 border-linha" />
                      {s.descricao && <p className="break-words text-[15px] leading-relaxed text-tinta-2">{s.descricao}</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {s.codigoFichaTecnica && <Chip tom="neutro">Ficha {s.codigoFichaTecnica}</Chip>}
                        <Chip tom="neutro">
                          {s.etapas.length} {s.etapas.length === 1 ? "etapa" : "etapas"} · {horasDoServico(s)} h
                        </Chip>
                        <Chip tom={s.credenciado ? "ok" : "atencao"}>{s.credenciado ? "Credenciado" : "Não credenciado"}</Chip>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                        <BotaoLink href={`/${slug}/servicos/${s.id}`} variante="secundario" className="px-6 tracking-wide">
                          Acessar
                        </BotaoLink>
                        <span className="text-[13px] text-tinta-2">
                          {ativos
                            ? `${ativos} em andamento`
                            : projetos.length
                              ? `${projetos.length} ${projetos.length === 1 ? "projeto" : "projetos"}`
                              : "Nenhum projeto ainda"}
                        </span>
                      </div>
                    </Cartao>
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
