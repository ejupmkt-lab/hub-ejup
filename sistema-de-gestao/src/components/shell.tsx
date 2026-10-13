"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAcesso, useEstado } from "@/lib/prototipo/store";
import { statusEmpresa } from "@/lib/rotulos";
import { Chip } from "./ui";

export function Shell({ children }: { children: React.ReactNode }) {
  const { estado, atualizar, reiniciar } = useEstado();
  const { usuario, empresasVisiveis } = useAcesso();
  const caminho = usePathname();
  const router = useRouter();

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
          <div className="mt-0.5 text-lg font-semibold">HUB de Gestão</div>
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

        <div className="space-y-3 border-t border-white/10 px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-white/45">Entrar como</span>
            <select
              value={usuario.id}
              onChange={(ev) => {
                const id = ev.target.value;
                atualizar((r) => void (r.usuarioAtualId = id));
                const u = estado.usuarios.find((x) => x.id === id)!;
                router.push(u.adminGrupo ? "/" : "/pivotto");
              }}
              className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-white"
            >
              {estado.usuarios.map((u) => (
                <option key={u.id} value={u.id} className="text-tinta">
                  {u.nome} {u.adminGrupo ? "(admin do grupo)" : "(Pivotto & Pivotto)"}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              if (confirm("Apagar as alterações e voltar aos dados de exemplo?")) {
                reiniciar();
                router.push("/");
              }
            }}
            className="text-xs text-white/55 underline-offset-2 hover:text-white hover:underline"
          >
            Restaurar dados de exemplo
          </button>
        </div>
      </aside>

      <div className="flex-1 md:pl-64">
        <div className="border-b border-ambar/30 bg-ambar-claro px-6 py-2 text-xs text-[#7a5a08]">
          <Chip cor="ambar">Protótipo</Chip>
          <span className="ml-2">Os dados são fictícios e ficam salvos só neste navegador.</span>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
