"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEstado } from "@/lib/dados/store";
import { codigoHub, LIMITE_PROJETOS_CLIENTE, servicoDoProjeto } from "@/lib/projeto";
import { formatarData } from "@/lib/datas";
import { BotaoLink, Cabecalho, Cartao, Chip, Vazio } from "@/components/ui";
import { CartaoProjeto } from "@/components/cartao-projeto";
import { IconeMaisSinal } from "@/components/icones";

// Um cliente e todos os projetos dele: cada contratação no HUB é um projeto
// independente, com o seu serviço (LGPD, planejamento…) e as suas etapas.
export default function PaginaCliente() {
  const { empresa: slug, id } = useParams<{ empresa: string; id: string }>();
  const { estado } = useEstado();
  const c = estado.clientes.find((x) => x.id === id && x.empresa === slug);

  if (!c)
    return (
      <div className="pt-10">
        <Vazio titulo="Cliente não encontrado" acao={<BotaoLink href={`/${slug}/clientes`}>Ver os clientes</BotaoLink>}>
          O link pode estar errado, ou o cliente foi excluído.
        </Vazio>
      </div>
    );

  const projetos = estado.projetos.filter((p) => p.clienteId === c.id);
  const ativos = projetos.filter((p) => p.status !== "encerrado");
  const encerrados = projetos.filter((p) => p.status === "encerrado");
  const noLimite = ativos.length >= LIMITE_PROJETOS_CLIENTE;

  const dados: [string, string | undefined][] = [
    ["CNPJ", c.cnpj],
    ["Responsável", [c.responsavel, c.cargoResponsavel].filter(Boolean).join(", ")],
    ["E-mail", c.email],
    ["Telefone", c.telefone],
    ["Cidade", c.cidadeUf],
    ["Ramo", c.ramo],
    ["Porte", c.porte],
  ];

  return (
    <>
      <Cabecalho
        migalhas={[{ rotulo: "Clientes", href: `/${slug}/clientes` }, { rotulo: c.nomeFantasia || c.razaoSocial }]}
        titulo={c.nomeFantasia || c.razaoSocial}
        subtitulo={c.nomeFantasia ? c.razaoSocial : undefined}
      >
        <BotaoLink href={`/${slug}/clientes?editar=${c.id}`} variante="secundario" className="flex-1 sm:flex-none">
          Editar dados
        </BotaoLink>
        <BotaoLink href={`/${slug}/projetos/novo?cliente=${c.id}`} className="flex-1 sm:flex-none">
          <IconeMaisSinal className="h-4 w-4" />
          Novo projeto
        </BotaoLink>
      </Cabecalho>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Projetos em andamento</h2>
            <Chip tom={noLimite ? "atencao" : "neutro"}>
              {ativos.length} de {LIMITE_PROJETOS_CLIENTE} simultâneos
            </Chip>
          </div>
          {ativos.length === 0 ? (
            <Vazio titulo="Nenhum projeto em andamento" acao={<BotaoLink href={`/${slug}/projetos/novo?cliente=${c.id}`}>Novo projeto</BotaoLink>}>
              Cada solicitação no HUB SEBRAE vira um projeto deste cliente, com as etapas do serviço contratado.
            </Vazio>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {ativos.map((p) => (
                <CartaoProjeto key={p.id} projeto={p} titulo="servico" />
              ))}
            </div>
          )}
          {noLimite && (
            <p className="text-sm text-tinta-2">
              O normal é até {LIMITE_PROJETOS_CLIENTE} projetos ao mesmo tempo por cliente; um {LIMITE_PROJETOS_CLIENTE + 1}º só excepcionalmente.
            </p>
          )}

          {encerrados.length > 0 && (
            <section className="pt-2">
              <h2 className="mb-2 text-lg font-bold">Encerrados</h2>
              <Cartao className="overflow-hidden">
                <ul className="divide-y divide-linha">
                  {encerrados.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/${slug}/projetos/${p.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-pedra/60 sm:px-5"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold text-tinta">{servicoDoProjeto(p)}</span>
                          <span className="num block text-[13px] text-tinta-2">
                            Projeto HUB {codigoHub(p) || "sem número"} · {formatarData(p.etapas[0]?.dataInicio)} a{" "}
                            {formatarData(p.etapas[p.etapas.length - 1]?.dataFim)}
                          </span>
                        </span>
                        <Chip tom="ok">Encerrado</Chip>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Cartao>
            </section>
          )}
        </div>

        <aside className="min-w-0">
          <Cartao className="p-4 sm:p-5">
            <h2 className="text-[17px] font-bold">Dados do cliente</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              {dados
                .filter(([, v]) => v?.trim())
                .map(([rotulo, valor]) => (
                  <div key={rotulo}>
                    <dt className="text-[12px] text-tinta-2">{rotulo}</dt>
                    <dd className="num break-words text-tinta">{valor}</dd>
                  </div>
                ))}
            </dl>
          </Cartao>
        </aside>
      </div>
    </>
  );
}
