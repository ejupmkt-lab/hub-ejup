"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAcesso, useEstado, type Salvamento } from "@/lib/dados/store";
import { statusEmpresa } from "@/lib/rotulos";
import { etapaAtual, servicoDoProjeto } from "@/lib/projeto";
import { doisDigitos } from "@/lib/rotulos";
import {
  IconeAcessos,
  IconeServicos,
  IconeClientes,
  IconeConta,
  IconeEmpresa,
  IconeFechar,
  IconeMais,
  IconePainel,
  IconeProjetos,
  IconeRegistrar,
  IconeSair,
  IconeSeta,
  IconeTarefas,
  Marca,
} from "@/components/icones";

type Folha = "mais" | "registrar" | null;

// Moldura do sistema. No computador, menu lateral claro; no celular, menu
// inferior com o botão central de registrar visita, reunião ou horas.
export function Shell({ children }: { children: React.ReactNode }) {
  const { salvamento, sair } = useEstado();
  const { usuario, empresasVisiveis } = useAcesso();
  const caminho = usePathname();
  const [folha, setFolha] = useState<Folha>(null);

  // Folha aberta: a página por baixo não rola; Esc fecha
  useEffect(() => {
    document.body.style.overflow = folha ? "hidden" : "";
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setFolha(null);
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", tecla);
    };
  }, [folha]);

  const ativa = empresasVisiveis.find((e) => e.status === "ativo");
  const base = ativa ? `/${ativa.slug}` : null;
  const outras = empresasVisiveis.filter((e) => e.status !== "ativo");
  const em = (p: string) => caminho === p || caminho.startsWith(`${p}/`);
  const emProjetos = !!base && em(base) && !em(`${base}/clientes`) && !em(`${base}/servicos`);

  const principais = [
    { href: "/", rotulo: "Painel", icone: IconePainel, ativo: caminho === "/" },
    ...(base ? [{ href: base, rotulo: "Projetos", icone: IconeProjetos, ativo: emProjetos }] : []),
    { href: "/tarefas", rotulo: "Tarefas", icone: IconeTarefas, ativo: em("/tarefas") },
  ];
  // No menu inferior: Painel e Projetos à esquerda do botão central, Tarefas à direita
  const esquerda = principais.filter((i) => i.href !== "/tarefas");
  const direita = principais.filter((i) => i.href === "/tarefas");
  const secundarios = [
    ...(base
      ? [
          { href: `${base}/clientes`, rotulo: "Clientes", icone: IconeClientes, ativo: em(`${base}/clientes`) },
          { href: `${base}/servicos`, rotulo: "Serviços", icone: IconeServicos, ativo: em(`${base}/servicos`) },
        ]
      : []),
    ...(usuario.adminGrupo ? [{ href: "/acessos", rotulo: "Acessos", icone: IconeAcessos, ativo: em("/acessos") }] : []),
  ];

  const itemLateral = (i: (typeof principais)[number]) => (
    <Link
      key={i.href}
      href={i.href}
      aria-current={i.ativo ? "page" : undefined}
      className={`flex items-center gap-3 rounded-[var(--radius-campo)] px-3 py-2.5 text-[15px] transition-colors ${
        i.ativo ? "bg-azul-claro font-semibold text-azul" : "font-medium text-tinta-2 hover:bg-pedra hover:text-tinta"
      }`}
    >
      <i.icone className="h-5 w-5 shrink-0" />
      {i.rotulo}
    </Link>
  );

  return (
    <div className="min-h-screen">
      {/* Menu lateral (computador) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-linha bg-folha lg:flex">
        <Link href="/" className="flex items-center gap-3 px-5 pb-5 pt-6">
          <Marca />
          <span className="min-w-0">
            <span className="block text-[17px] font-bold leading-tight text-tinta">Blimp</span>
            <span className="block text-[13px] text-tinta-2">Sistema de gestão</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Principal">
          {principais.map(itemLateral)}
          {secundarios.length > 0 && <div className="!mt-4 border-t border-linha pt-4">{secundarios.map(itemLateral)}</div>}
          {outras.length > 0 && (
            <div className="!mt-4 border-t border-linha pt-4">
              <p className="px-3 pb-1.5 text-[12px] font-semibold uppercase tracking-wide text-tinta-2">Outras empresas</p>
              {outras.map((e) => (
                <Link
                  key={e.slug}
                  href={`/${e.slug}`}
                  aria-current={em(`/${e.slug}`) ? "page" : undefined}
                  className={`flex items-center justify-between gap-2 rounded-[var(--radius-campo)] px-3 py-2 text-[15px] ${
                    em(`/${e.slug}`) ? "bg-azul-claro font-semibold text-azul" : "font-medium text-tinta-2 hover:bg-pedra hover:text-tinta"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <IconeEmpresa className="h-5 w-5 shrink-0" />
                    <span className="truncate">{e.nome}</span>
                  </span>
                  <span className="shrink-0 text-xs font-normal text-tinta-2">{statusEmpresa[e.status].toLowerCase()}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>
        <div className="border-t border-linha px-5 py-4">
          <IndicadorSalvamento estado={salvamento} />
          <p className="mt-3 truncate text-sm font-semibold text-tinta">{usuario.nomeCompleto}</p>
          <p className="truncate text-[13px] text-tinta-2">{usuario.email}</p>
          <div className="mt-3 flex gap-4 text-[13px] font-medium">
            <Link href="/conta" aria-current={em("/conta") ? "page" : undefined} className="text-azul hover:underline aria-[current=page]:underline">
              Minha conta
            </Link>
            <button onClick={sair} className="text-tinta-2 hover:text-vermelho hover:underline">
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Aviso de salvamento no celular, só quando há algo a dizer */}
      {salvamento !== "salvo" && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center pt-[calc(env(safe-area-inset-top)+0.5rem)] lg:hidden">
          <span className="rounded-full border border-linha bg-folha px-3 py-1 shadow-md">
            <IndicadorSalvamento estado={salvamento} curto />
          </span>
        </div>
      )}

      <main className="respiro-menu min-w-0 px-4 sm:px-8 lg:ml-64 lg:px-10">
        <div className="mx-auto max-w-[72rem]">{children}</div>
      </main>

      {/* Menu inferior (celular) */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-folha/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center">
          {esquerda.map((i) => (
            <ItemInferior key={i.href} {...i} />
          ))}
          {esquerda.length < 2 && <span />}
          <div className="flex justify-center">
            <button
              onClick={() => setFolha("registrar")}
              aria-label="Desenvolver projeto"
              disabled={!base}
              className="-mt-7 grid h-[3.75rem] w-[3.75rem] place-items-center rounded-full bg-azul text-folha shadow-lg shadow-azul/30 ring-4 ring-folha active:scale-95 disabled:opacity-40"
            >
              <IconeRegistrar className="h-6 w-6" />
            </button>
          </div>
          {direita.map((i) => (
            <ItemInferior key={i.href} {...i} />
          ))}
          <button
            onClick={() => setFolha(folha === "mais" ? null : "mais")}
            aria-expanded={folha === "mais"}
            className={`flex h-full flex-col items-center justify-center gap-1 text-[12px] font-medium ${folha === "mais" ? "text-azul" : "text-tinta-2"}`}
          >
            <IconeMais className="h-6 w-6" />
            Mais
          </button>
        </div>
      </nav>

      {folha === "mais" && (
        <FolhaSobreposta titulo="Mais" aoFechar={() => setFolha(null)} soCelular>
          <ul className="space-y-1">
            {secundarios.map((i) => (
              <li key={i.href}>
                <LinkFolha href={i.href} icone={<i.icone className="h-5 w-5" />}>
                  {i.rotulo}
                </LinkFolha>
              </li>
            ))}
            <li>
              <LinkFolha href="/conta" icone={<IconeConta className="h-5 w-5" />}>
                Minha conta
              </LinkFolha>
            </li>
            {outras.map((e) => (
              <li key={e.slug}>
                <LinkFolha href={`/${e.slug}`} icone={<IconeEmpresa className="h-5 w-5" />} detalhe={statusEmpresa[e.status].toLowerCase()}>
                  {e.nome}
                </LinkFolha>
              </li>
            ))}
            <li>
              <button
                onClick={sair}
                className="flex w-full items-center gap-3 rounded-[var(--radius-campo)] px-3 py-3 text-left text-[15px] font-medium text-vermelho hover:bg-vermelho-claro"
              >
                <IconeSair className="h-5 w-5" />
                Sair
              </button>
            </li>
          </ul>
          <div className="mt-4 border-t border-linha pt-4">
            <p className="truncate text-sm font-semibold text-tinta">{usuario.nomeCompleto}</p>
            <p className="truncate text-[13px] text-tinta-2">{usuario.email}</p>
            <div className="mt-2">
              <IndicadorSalvamento estado={salvamento} />
            </div>
          </div>
        </FolhaSobreposta>
      )}

      {folha === "registrar" && <EscolherProjeto aoFechar={() => setFolha(null)} />}
    </div>
  );
}

function ItemInferior({
  href,
  rotulo,
  icone: Icone,
  ativo,
}: {
  href: string;
  rotulo: string;
  icone: (p: { className?: string }) => React.ReactNode;
  ativo: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      className={`flex h-full flex-col items-center justify-center gap-1 text-[12px] font-medium ${ativo ? "text-azul" : "text-tinta-2"}`}
    >
      <Icone className="h-6 w-6" />
      {rotulo}
    </Link>
  );
}

function LinkFolha({ href, icone, detalhe, children }: { href: string; icone: React.ReactNode; detalhe?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[var(--radius-campo)] px-3 py-3 text-[15px] font-medium text-tinta hover:bg-pedra">
      <span className="text-tinta-2">{icone}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {detalhe && <span className="shrink-0 text-xs text-tinta-2">{detalhe}</span>}
    </Link>
  );
}

// Folha que sobe de baixo no celular; no computador, janela no centro
export function FolhaSobreposta({
  titulo,
  aoFechar,
  children,
  soCelular = false,
}: {
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
  soCelular?: boolean;
}) {
  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center lg:items-center ${soCelular ? "lg:hidden" : ""}`}>
      {/* Fundo escurecido: tocar fora fecha (no teclado, Esc ou o botão Fechar) */}
      <div aria-hidden onClick={aoFechar} className="absolute inset-0 bg-tinta/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        // Seguir um link de dentro da folha também a fecha
        onClick={(e) => (e.target as HTMLElement).closest("a") && aoFechar()}
        className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-[1.25rem] bg-folha px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-xl lg:max-w-md lg:rounded-[var(--radius-bloco)] lg:px-6 lg:pb-6 lg:pt-5"
      >
        <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-linha-forte lg:hidden" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button autoFocus onClick={aoFechar} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-full text-tinta-2 hover:bg-pedra">
            <IconeFechar className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Registrar: escolher o projeto e abrir o formulário de visita, reunião ou horas
function EscolherProjeto({ aoFechar }: { aoFechar: () => void }) {
  const { estado } = useEstado();
  const { novoProjeto } = useAcesso();
  const projetos = estado.projetos.filter((p) => p.status !== "encerrado");
  const nome = (id: string) => {
    const c = estado.clientes.find((x) => x.id === id);
    return c?.nomeFantasia || c?.razaoSocial || "Cliente";
  };
  return (
    <FolhaSobreposta titulo="Desenvolver projeto" aoFechar={aoFechar}>
      <p className="mb-3 text-sm text-tinta-2">Conte o que aconteceu (visita, reunião, fotos, documentos) no Desenvolvimento do projeto. Escolha qual:</p>
      {projetos.length === 0 ? (
        <div className="rounded-[var(--radius-campo)] bg-pedra px-4 py-6 text-center text-sm text-tinta-2">
          Nenhum projeto em andamento.
          {novoProjeto && (
            <Link href={novoProjeto} className="mt-3 block font-semibold text-azul">
              Criar um projeto
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-linha rounded-[var(--radius-campo)] border border-linha">
          {projetos.map((p) => {
            const et = etapaAtual(p);
            return (
              <li key={p.id}>
                <Link href={`/${p.empresa}/projetos/${p.id}#registrar`} className="flex items-center gap-3 px-4 py-3 hover:bg-pedra">
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[15px] font-semibold text-tinta">{nome(p.clienteId)}</span>
                    <span className="block text-[13px] text-tinta-2">
                      {servicoDoProjeto(p)} · {et ? `Etapa ${doisDigitos(et.ordem)} ${et.nome.charAt(0) + et.nome.slice(1).toLowerCase()}` : "todas as etapas enviadas"}
                    </span>
                  </span>
                  <IconeSeta className="h-5 w-5 shrink-0 text-tinta-2" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </FolhaSobreposta>
  );
}

function IndicadorSalvamento({ estado, curto = false }: { estado: Salvamento; curto?: boolean }) {
  const t = {
    salvo: { texto: "Tudo salvo", cor: "text-tinta-2", ponto: "bg-verde-vivo" },
    pendente: { texto: curto ? "Salvando" : "Salvando em instantes", cor: "text-tinta-2", ponto: "bg-laranja-vivo" },
    salvando: { texto: "Salvando…", cor: "text-tinta", ponto: "bg-laranja-vivo" },
    erro: { texto: curto ? "Não salvou" : "Não foi possível salvar. Confira a conexão.", cor: "text-vermelho", ponto: "bg-vermelho-vivo" },
  }[estado];
  return (
    <span role="status" className={`flex items-center gap-2 text-[13px] font-medium ${t.cor}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${t.ponto}`} aria-hidden />
      {t.texto}
    </span>
  );
}
