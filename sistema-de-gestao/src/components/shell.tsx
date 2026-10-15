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
      className={`relative flex items-baseline justify-between gap-3 rounded-[var(--radius-campo)] px-3 py-2 text-[15px] transition-colors ${
        ativo ? "bg-pedra text-tinta" : "text-tinta-2 hover:text-tinta"
      }`}
    >
      {ativo && <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-garrafa" aria-hidden />}
      <span>{rotulo}</span>
      {detalhe}
    </Link>
  );

  const menu = (
    <>
      <div className="px-6 pb-8 pt-7">
        <Link href={usuario.adminGrupo ? "/" : "/pivotto"} className="block">
          <span className="block font-serif text-[1.4rem] leading-none text-tinta">Pivotto</span>
          <span className="mt-1 block text-[13px] text-tinta-2">Sistema de gestão</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Principal">
        {usuario.adminGrupo && item("/", caminho === "/", "Painel")}
        <p className="px-3 pb-1.5 pt-6 text-[13px] text-tinta-2/80">Empresas</p>
        {empresasVisiveis.map((e) => {
          const n = ativos.filter((p) => p.empresa === e.slug).length;
          return item(
            `/${e.slug}`,
            caminho.startsWith(`/${e.slug}`),
            e.nome,
            e.status === "ativo" ? (
              n > 0 && <span className="num text-[13px] text-tinta-2">{n}</span>
            ) : (
              <span className="text-xs italic text-tinta-2/80">{statusEmpresa[e.status].toLowerCase()}</span>
            ),
          );
        })}
      </nav>

      <div className="border-t border-linha px-6 py-5">
        <p className="text-[15px] text-tinta">{usuario.nomeCompleto}</p>
        <p className="mt-0.5 truncate text-[13px] text-tinta-2">{usuario.email}</p>
        <div className="mt-3 flex gap-5 text-[13px] text-tinta-2">
          <Link href="/conta" onClick={() => setAberto(false)} className="underline-offset-4 hover:text-tinta hover:underline">
            Minha conta
          </Link>
          <button onClick={sair} className="underline-offset-4 hover:text-tinta hover:underline">
            Sair
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Barra superior no celular */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-linha bg-folha px-4 py-3 lg:hidden">
        <span className="font-serif text-lg">Pivotto</span>
        <button
          onClick={() => setAberto(!aberto)}
          aria-expanded={aberto}
          className="rounded-[var(--radius-campo)] border border-linha px-3 py-1.5 text-sm"
        >
          {aberto ? "Fechar" : "Menu"}
        </button>
      </div>
      {aberto && (
        <div className="fixed inset-0 z-20 flex flex-col bg-folha pt-14 lg:hidden">{menu}</div>
      )}

      <aside className="hidden border-r border-linha bg-folha lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">{menu}</aside>

      <div className="flex-1 lg:pl-64">
        <div className="mx-auto flex max-w-[72rem] justify-end px-5 pt-4 sm:px-10">
          <IndicadorSalvamento estado={salvamento} />
        </div>
        <main className="mx-auto max-w-[72rem] px-5 pb-20 pt-4 sm:px-10">{children}</main>
      </div>
    </div>
  );
}

function IndicadorSalvamento({ estado }: { estado: Salvamento }) {
  const t = {
    salvo: { texto: "Tudo salvo", cor: "text-tinta-2/70" },
    pendente: { texto: "Salvando em instantes", cor: "text-tinta-2" },
    salvando: { texto: "Salvando…", cor: "text-garrafa" },
    erro: { texto: "Não foi possível salvar. Confira a conexão; nova tentativa na próxima alteração.", cor: "text-vinho" },
  }[estado];
  return (
    <span role="status" className={`text-[13px] ${t.cor}`}>
      {t.texto}
    </span>
  );
}
