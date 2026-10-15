"use client";

import Link from "next/link";
import { statusEtapa, type StatusEtapa, type Tom } from "@/lib/rotulos";
import type { Passo } from "@/lib/proximo-passo";

// Cor de cada tom: etiqueta (fundo claro + texto), barra de progresso e ponto.
export const corTom: Record<Tom, { ponto: string; texto: string; fundo: string; barra: string }> = {
  neutro: { ponto: "bg-linha-forte", texto: "text-tinta-2", fundo: "bg-pedra", barra: "bg-linha" },
  andamento: { ponto: "bg-garrafa", texto: "text-garrafa", fundo: "bg-garrafa-claro", barra: "bg-garrafa" },
  atencao: { ponto: "bg-latao", texto: "text-latao", fundo: "bg-latao-claro", barra: "bg-latao" },
  ok: { ponto: "bg-musgo", texto: "text-musgo", fundo: "bg-musgo-claro", barra: "bg-musgo" },
  critico: { ponto: "bg-vinho", texto: "text-vinho", fundo: "bg-vinho-claro", barra: "bg-vinho" },
};

// Situação de algo (etapa, projeto, pessoa): etiqueta com ponto
export function Status({ tom, children, className = "" }: { tom: Tom; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-0.5 pl-2 pr-2.5 text-[13px] font-medium ${corTom[tom].fundo} ${corTom[tom].texto} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${corTom[tom].ponto}`} aria-hidden />
      {children}
    </span>
  );
}

export function StatusEtapa({ status }: { status: StatusEtapa }) {
  const s = statusEtapa[status];
  return <Status tom={s.tom}>{s.rotulo}</Status>;
}

// Prazo e contagem que pedem atenção: texto colorido, sem fundo
export function Selo({ tom, children }: { tom: Tom; children: React.ReactNode }) {
  return <span className={`num whitespace-nowrap text-[13px] font-medium ${corTom[tom].texto}`}>{children}</span>;
}

type Variante = keyof typeof variantes;
type Tamanho = keyof typeof tamanhos;
type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamanho?: Tamanho };

const variantes = {
  primario: "bg-garrafa text-folha hover:bg-garrafa-escuro border-garrafa",
  secundario: "bg-folha text-tinta hover:border-tinta-2/50 hover:bg-pedra/40 border-linha-forte",
  perigo: "bg-folha text-vinho hover:bg-vinho-claro border-vinho/40",
  fantasma: "bg-transparent text-garrafa hover:bg-garrafa-claro border-transparent",
};
const tamanhos = {
  normal: "px-4 py-2 text-sm",
  pequeno: "px-2.5 py-1 text-[13px]",
};

const baseBotao =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-campo)] border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export function Botao({ variante = "primario", tamanho = "normal", className = "", ...props }: BotaoProps) {
  return <button {...props} className={`${baseBotao} ${tamanhos[tamanho]} ${variantes[variante]} ${className}`} />;
}

export function BotaoLink({
  href,
  variante = "primario",
  tamanho = "normal",
  className = "",
  children,
}: {
  href: string;
  variante?: Variante;
  tamanho?: Tamanho;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${baseBotao} ${tamanhos[tamanho]} ${variantes[variante]} ${className}`}>
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
      <span className="mb-1.5 block text-[13px] font-medium text-tinta">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-tinta-2">{dica}</span>}
    </label>
  );
}

export type Migalha = { rotulo: string; href?: string };

// Cabeçalho de página: faixa branca de ponta a ponta com a trilha de
// navegação, o título, as ações e, quando houver, as abas da página.
export function Cabecalho({
  migalhas,
  titulo,
  subtitulo,
  children,
  abas,
}: {
  migalhas?: Migalha[];
  titulo: string;
  subtitulo?: React.ReactNode;
  children?: React.ReactNode;
  abas?: React.ReactNode;
}) {
  return (
    <header className="faixa -mx-5 mb-8 border-b border-linha bg-folha sm:-mx-10">
      <div className={`mx-auto max-w-[72rem] px-5 pt-7 sm:px-10 ${abas ? "" : "pb-7"}`}>
        {migalhas && migalhas.length > 0 && (
          <nav aria-label="Você está em" className="mb-2 flex flex-wrap items-center gap-1.5 text-[13px] text-tinta-2">
            {migalhas.map((m, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span aria-hidden className="text-linha-forte">
                    /
                  </span>
                )}
                {m.href ? (
                  <Link href={m.href} className="hover:text-garrafa hover:underline">
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
            <h1 className="text-balance font-serif text-[1.9rem] font-medium leading-[1.15] tracking-[-0.01em] text-tinta">{titulo}</h1>
            {subtitulo && <div className="mt-1.5 text-[15px] text-tinta-2">{subtitulo}</div>}
          </div>
          {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
        </div>
        {abas && <div className="mt-6">{abas}</div>}
      </div>
    </header>
  );
}

// Abas. Dentro do cabeçalho ficam coladas na borda de baixo da faixa.
export function Abas<T extends string>({
  abas,
  atual,
  aoTrocar,
  extra,
  naFaixa = false,
}: {
  abas: readonly T[];
  atual: T;
  aoTrocar: (a: T) => void;
  extra?: Partial<Record<T, React.ReactNode>>;
  naFaixa?: boolean;
}) {
  return (
    <div role="tablist" className={`flex gap-7 overflow-x-auto ${naFaixa ? "-mb-px" : "mb-6 border-b border-linha"}`}>
      {abas.map((a) => (
        <button
          key={a}
          role="tab"
          aria-selected={a === atual}
          onClick={() => aoTrocar(a)}
          className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 pt-1 text-[15px] transition-colors ${
            a === atual ? "border-garrafa font-medium text-tinta" : "border-transparent text-tinta-2 hover:border-linha-forte hover:text-tinta"
          }`}
        >
          {a}
          {extra?.[a]}
        </button>
      ))}
    </div>
  );
}

// O que fazer agora: a única faixa escura do conteúdo
export function ProximoPasso({ passo, aoAgir, className = "" }: { passo: Passo; aoAgir?: () => void; className?: string }) {
  const fundo = passo.tom === "critico" ? "bg-vinho" : "bg-capa";
  return (
    <div className={`flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[var(--radius-bloco)] px-6 py-5 text-folha ${fundo} ${className}`}>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-folha/65">Próximo passo</p>
        <p className="mt-0.5 font-serif text-[1.3rem] leading-snug">{passo.texto}</p>
        {passo.detalhe && <p className="mt-1 text-sm text-folha/75">{passo.detalhe}</p>}
      </div>
      {aoAgir ? (
        <button onClick={aoAgir} className={`${baseBotao} ${tamanhos.normal} border-folha bg-folha text-capa hover:bg-garrafa-claro`}>
          {passo.rotulo}
        </button>
      ) : (
        <Link href={passo.href} className={`${baseBotao} ${tamanhos.normal} border-folha bg-folha text-capa hover:bg-garrafa-claro`}>
          {passo.rotulo}
        </Link>
      )}
    </div>
  );
}

export function Vazio({ titulo, children, acao }: { titulo: string; children?: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-bloco)] border border-dashed border-linha-forte bg-folha/60 px-8 py-14 text-center">
      <p className="font-serif text-xl text-tinta">{titulo}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-tinta-2">{children}</p>}
      {acao && <div className="mt-6">{acao}</div>}
    </div>
  );
}

export function Barra({ valor, total, tom = "andamento" }: { valor: number; total: number; tom?: Tom }) {
  const pct = total ? Math.round((valor / total) * 100) : 0;
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-linha" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span className={`block h-full rounded-full ${corTom[tom].barra}`} style={{ width: `${pct}%` }} />
    </span>
  );
}
