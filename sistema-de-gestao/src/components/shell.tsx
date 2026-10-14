"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAcesso, useEstado, type Salvamento } from "@/lib/dados/store";
import { statusEmpresa } from "@/lib/rotulos";

export function Shell({ children }: { children: React.ReactNode }) {
  const { salvamento, sair } = useEstado();
  const { usuario, empresasVisiveis } = useAcesso();
  const caminho = usePathname();

  const item = (href: string, ativo: boolean, conteudo: React.ReactNode) => (
    <Link
      href={href}
      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition ${
        ativo ? "bg-white/12 font-medium text-white" : "text-white/75 hover:bg-white/8 hover:text-white"
      }`}
    >
      {conteudo}
    </Link>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="flex flex-col bg-marinho-escuro text-white md:fixed md:inset-y-0 md:w-64">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">Ecossistema Pivotto</div>
          <div className="mt-0.5 text-lg font-semibold">Sistema de Gestão</div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {usuario.adminGrupo && item("/", caminho === "/", <span>Painel do grupo</span>)}
          <div className="px-3 pb-1 pt-4 text-[11px] uppercase tracking-[0.14em] text-white/45">Módulos</div>
          {empresasVisiveis.map((e) =>
            item(
              `/${e.slug}`,
              caminho.startsWith(`/${e.slug}`),
              <>
                <span>{e.nome}</span>
                {e.status !== "ativo" && (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">{statusEmpresa[e.status]}</span>
                )}
              </>,
            ),
          )}
        </nav>

        <div className="space-y-2 border-t border-white/10 px-5 py-4 text-sm">
          <div className="font-medium">{usuario.nomeCompleto}</div>
          <div className="text-xs text-white/55">
            {usuario.adminGrupo ? "Administrador do grupo" : "Pivotto & Pivotto"} · {usuario.email}
          </div>
          <button onClick={sair} className="text-xs text-white/70 underline-offset-2 hover:text-white hover:underline">
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 md:pl-64">
        <div className="flex justify-end px-6 pt-3 text-xs">
          <IndicadorSalvamento estado={salvamento} />
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

function IndicadorSalvamento({ estado }: { estado: Salvamento }) {
  const t = {
    salvo: { texto: "Tudo salvo", cor: "text-tinta-2" },
    pendente: { texto: "Alterações não salvas…", cor: "text-tinta-2" },
    salvando: { texto: "Salvando…", cor: "text-marinho" },
    erro: { texto: "Erro ao salvar. Verifique a conexão; tentaremos de novo na próxima alteração.", cor: "text-vermelho" },
  }[estado];
  return <span className={t.cor}>{t.texto}</span>;
}
