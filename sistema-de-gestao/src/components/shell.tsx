"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAcesso, useEstado, type Salvamento } from "@/lib/dados/store";
import { statusEmpresa } from "@/lib/rotulos";

export function Shell({ children }: { children: React.ReactNode }) {
  const { salvamento, sair, estado } = useEstado();
  const { usuario, empresasVisiveis } = useAcesso();
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);

  const ativos = estado.projetos.filter((p) => p.status !== "encerrado");

  const item = (href: string, ativo: boolean, rotulo: string, detalhe?: React.ReactNode) => (
    <Link
      href={href}
      onClick={() => setAberto(false)}
      aria-current={ativo ? "page" : undefined}
      className={`flex items-baseline justify-between gap-3 rounded-[var(--radius-campo)] px-3 py-2 text-[15px] transition-colors ${
        ativo ? "bg-capa-2 text-folha" : "text-folha/70 hover:bg-capa-2/60 hover:text-folha"
      }`}
    >
      <span>{rotulo}</span>
      {detalhe}
    </Link>
  );

  const menu = (
    <>
      <div className="px-6 pb-8 pt-7">
        <Link href={usuario.adminGrupo ? "/" : "/pivotto"} className="block">
          <span className="block font-serif text-[1.45rem] leading-none text-folha">Pivotto</span>
          <span className="mt-1.5 block text-[13px] text-folha/55">Sistema de gestão</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Principal">
        {usuario.adminGrupo && item("/", caminho === "/", "Painel")}
        <p className="px-3 pb-1.5 pt-6 text-[13px] text-folha/45">Empresas</p>
        {empresasVisiveis.map((e) => {
          const n = ativos.filter((p) => p.empresa === e.slug).length;
          return item(
            `/${e.slug}`,
            caminho.startsWith(`/${e.slug}`),
            e.nome,
            e.status === "ativo" ? (
              n > 0 && <span className="num text-[13px] text-folha/55">{n}</span>
            ) : (
              <span className="text-xs italic text-folha/40">{statusEmpresa[e.status].toLowerCase()}</span>
            ),
          );
        })}
        {usuario.adminGrupo && (
          <>
            <p className="px-3 pb-1.5 pt-6 text-[13px] text-folha/45">Administração</p>
            {item("/acessos", caminho === "/acessos", "Acessos")}
          </>
        )}
      </nav>

      <div className="px-6 pb-3">
        <IndicadorSalvamento estado={salvamento} />
      </div>
      <div className="border-t border-folha/10 px-6 py-5">
        <p className="text-[15px] text-folha">{usuario.nomeCompleto}</p>
        <p className="mt-0.5 truncate text-[13px] text-folha/55">{usuario.email}</p>
        <div className="mt-3 flex gap-5 text-[13px] text-folha/65">
          <Link
            href="/conta"
            onClick={() => setAberto(false)}
            aria-current={caminho === "/conta" ? "page" : undefined}
            className="underline-offset-4 hover:text-folha hover:underline aria-[current=page]:text-folha"
          >
            Minha conta
          </Link>
          <button onClick={sair} className="underline-offset-4 hover:text-folha hover:underline">
            Sair
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Barra superior no celular */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-capa px-4 py-3 text-folha lg:hidden">
        <span className="font-serif text-lg">Pivotto</span>
        <span className="flex items-center gap-4">
          <IndicadorSalvamento estado={salvamento} curto />
          <button
            onClick={() => setAberto(!aberto)}
            aria-expanded={aberto}
            className="rounded-[var(--radius-campo)] border border-folha/25 px-3 py-1.5 text-sm"
          >
            {aberto ? "Fechar" : "Menu"}
          </button>
        </span>
      </div>
      {aberto && <div className="fixed inset-0 z-20 flex flex-col bg-capa pt-14 lg:hidden">{menu}</div>}

      <aside className="hidden bg-capa lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">{menu}</aside>

      {/* O cabeçalho (.faixa) vai de ponta a ponta; o resto fica na coluna central */}
      <main className="min-w-0 flex-1 px-5 pb-20 sm:px-10 lg:ml-64 [&>*:not(.faixa)]:mx-auto [&>*:not(.faixa)]:max-w-[67rem]">
        {children}
      </main>
    </div>
  );
}

function IndicadorSalvamento({ estado, curto = false }: { estado: Salvamento; curto?: boolean }) {
  const t = {
    salvo: { texto: "Tudo salvo", cor: "text-folha/45", ponto: "bg-folha/35" },
    pendente: { texto: curto ? "Salvando" : "Salvando em instantes", cor: "text-folha/70", ponto: "bg-latao" },
    salvando: { texto: "Salvando…", cor: "text-folha/80", ponto: "bg-latao" },
    erro: { texto: curto ? "Não salvou" : "Não foi possível salvar. Confira a conexão.", cor: "text-[#f2b8ad]", ponto: "bg-[#e0796a]" },
  }[estado];
  return (
    <span role="status" className={`flex items-center gap-2 text-[13px] ${t.cor}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.ponto}`} aria-hidden />
      {t.texto}
    </span>
  );
}
