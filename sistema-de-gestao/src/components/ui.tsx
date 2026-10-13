"use client";

import Link from "next/link";
import { statusEtapa, type StatusEtapa } from "@/lib/rotulos";

const cores = {
  cinza: "bg-papel text-tinta-2 border-linha",
  azul: "bg-marinho-claro text-marinho-escuro border-marinho/20",
  ambar: "bg-ambar-claro text-[#8a6508] border-ambar/30",
  verde: "bg-verde-claro text-verde border-verde/20",
  vermelho: "bg-vermelho-claro text-vermelho border-vermelho/20",
} as const;

export type Cor = keyof typeof cores;

export function Chip({ cor = "cinza", children }: { cor?: Cor; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${cores[cor]}`}>
      {children}
    </span>
  );
}

export function ChipEtapa({ status }: { status: StatusEtapa }) {
  const s = statusEtapa[status];
  return <Chip cor={s.cor}>{s.rotulo}</Chip>;
}

export const corBarraEtapa: Record<string, string> = {
  cinza: "bg-linha",
  azul: "bg-marinho",
  ambar: "bg-ambar",
  verde: "bg-verde",
  vermelho: "bg-vermelho",
};

type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "secundario" | "perigo" | "fantasma" };

const variantes = {
  primario: "bg-marinho text-white hover:bg-marinho-escuro border-marinho",
  secundario: "bg-superficie text-tinta hover:bg-papel border-linha",
  perigo: "bg-superficie text-vermelho hover:bg-vermelho-claro border-vermelho/30",
  fantasma: "bg-transparent text-marinho hover:bg-marinho-claro border-transparent",
};

export function Botao({ variante = "primario", className = "", ...props }: BotaoProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantes[variante]} ${className}`}
    />
  );
}

export function BotaoLink({ href, variante = "primario", children }: { href: string; variante?: keyof typeof variantes; children: React.ReactNode }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3.5 py-2 text-sm font-medium transition ${variantes[variante]}`}>
      {children}
    </Link>
  );
}

export function Cartao({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-lg border border-linha bg-superficie ${className}`}>{children}</section>;
}

export function Campo({ rotulo, dica, children, className = "" }: { rotulo: string; dica?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-tinta-2">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-tinta-2">{dica}</span>}
    </label>
  );
}

export function Cabecalho({ sobre, titulo, children }: { sobre?: React.ReactNode; titulo: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {sobre && <div className="mb-1 text-xs text-tinta-2">{sobre}</div>}
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-linha p-8 text-center text-sm text-tinta-2">{children}</div>;
}
