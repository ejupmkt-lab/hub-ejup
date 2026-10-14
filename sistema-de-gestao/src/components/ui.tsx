"use client";

import Link from "next/link";
import { statusEtapa, type StatusEtapa, type Tom } from "@/lib/rotulos";

// Cor de cada tom. O status aparece como um ponto + texto, sem pílulas coloridas
// em toda parte; a pílula fica reservada ao que pede ação (Selo).
export const corTom: Record<Tom, { ponto: string; texto: string; fundo: string; barra: string }> = {
  neutro: { ponto: "bg-linha-forte", texto: "text-tinta-2", fundo: "bg-pedra", barra: "bg-linha" },
  andamento: { ponto: "bg-garrafa", texto: "text-garrafa", fundo: "bg-garrafa-claro", barra: "bg-garrafa" },
  atencao: { ponto: "bg-latao", texto: "text-latao", fundo: "bg-latao-claro", barra: "bg-latao" },
  ok: { ponto: "bg-musgo", texto: "text-musgo", fundo: "bg-musgo-claro", barra: "bg-musgo" },
  critico: { ponto: "bg-vinho", texto: "text-vinho", fundo: "bg-vinho-claro", barra: "bg-vinho" },
};

export function Status({ tom, children, className = "" }: { tom: Tom; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm ${corTom[tom].texto} ${className}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${corTom[tom].ponto}`} aria-hidden />
      {children}
    </span>
  );
}

export function StatusEtapa({ status }: { status: StatusEtapa }) {
  const s = statusEtapa[status];
  return <Status tom={s.tom}>{s.rotulo}</Status>;
}

// Destaque para o que exige ação (prazo, pendência)
export function Selo({ tom, children }: { tom: Tom; children: React.ReactNode }) {
  return (
    <span className={`num inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${corTom[tom].fundo} ${corTom[tom].texto}`}>
      {children}
    </span>
  );
}

type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof variantes };

const variantes = {
  primario: "bg-garrafa text-folha hover:bg-garrafa-escuro border-garrafa",
  secundario: "bg-transparent text-tinta hover:bg-folha border-linha-forte",
  perigo: "bg-transparent text-vinho hover:bg-vinho-claro border-vinho/40",
  fantasma: "bg-transparent text-garrafa hover:bg-garrafa-claro border-transparent",
};

const baseBotao =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-campo)] border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export function Botao({ variante = "primario", className = "", ...props }: BotaoProps) {
  return <button {...props} className={`${baseBotao} ${variantes[variante]} ${className}`} />;
}

export function BotaoLink({ href, variante = "primario", children }: { href: string; variante?: keyof typeof variantes; children: React.ReactNode }) {
  return (
    <Link href={href} className={`${baseBotao} ${variantes[variante]}`}>
      {children}
    </Link>
  );
}

export function Cartao({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-[var(--radius-bloco)] border border-linha bg-folha ${className}`}>{children}</section>;
}

export function Campo({ rotulo, dica, children, className = "" }: { rotulo: string; dica?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-medium text-tinta-2">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-tinta-2">{dica}</span>}
    </label>
  );
}

export type Migalha = { rotulo: string; href?: string };

// Cabeçalho de página: trilha de navegação, título em serifa e ações à direita
export function Cabecalho({
  migalhas,
  titulo,
  subtitulo,
  children,
}: {
  migalhas?: Migalha[];
  titulo: string;
  subtitulo?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      {migalhas && migalhas.length > 0 && (
        <nav aria-label="Você está em" className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px] text-tinta-2">
          {migalhas.map((m, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-linha-forte">/</span>}
              {m.href ? (
                <Link href={m.href} className="hover:text-garrafa">
                  {m.rotulo}
                </Link>
              ) : (
                <span>{m.rotulo}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-serif text-[2.15rem] font-medium leading-[1.1] tracking-[-0.01em] text-tinta">{titulo}</h1>
          {subtitulo && <div className="mt-2 text-[15px] text-tinta-2">{subtitulo}</div>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}

export function Abas<T extends string>({ abas, atual, aoTrocar, extra }: { abas: readonly T[]; atual: T; aoTrocar: (a: T) => void; extra?: Partial<Record<T, React.ReactNode>> }) {
  return (
    <div role="tablist" className="mb-6 flex gap-6 overflow-x-auto border-b border-linha">
      {abas.map((a) => (
        <button
          key={a}
          role="tab"
          aria-selected={a === atual}
          onClick={() => aoTrocar(a)}
          className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 pb-2.5 pt-1 text-[15px] transition-colors ${
            a === atual ? "border-garrafa text-tinta" : "border-transparent text-tinta-2 hover:text-tinta"
          }`}
        >
          {a}
          {extra?.[a]}
        </button>
      ))}
    </div>
  );
}

export function Vazio({ titulo, children, acao }: { titulo: string; children?: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-bloco)] border border-dashed border-linha-forte px-8 py-12 text-center">
      <p className="font-serif text-xl text-tinta">{titulo}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-tinta-2">{children}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}

export function Barra({ valor, total, tom = "andamento" }: { valor: number; total: number; tom?: Tom }) {
  const pct = total ? Math.round((valor / total) * 100) : 0;
  return (
    <span className="block h-1 w-full overflow-hidden rounded-full bg-linha" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span className={`block h-full rounded-full ${corTom[tom].barra}`} style={{ width: `${pct}%` }} />
    </span>
  );
}
