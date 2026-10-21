"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { statusEtapa, type StatusEtapa, type Tom } from "@/lib/rotulos";
import type { Passo } from "@/lib/proximo-passo";

// Cor de cada tom: etiqueta (fundo claro + texto), barra, ponto e borda de destaque.
export const corTom: Record<Tom, { ponto: string; texto: string; fundo: string; barra: string; borda: string }> = {
  neutro: { ponto: "bg-linha-forte", texto: "text-tinta-2", fundo: "bg-pedra", barra: "bg-linha-forte", borda: "border-l-linha-forte" },
  andamento: { ponto: "bg-azul", texto: "text-azul", fundo: "bg-azul-claro", barra: "bg-azul", borda: "border-l-azul" },
  atencao: { ponto: "bg-laranja-vivo", texto: "text-laranja", fundo: "bg-laranja-claro", barra: "bg-laranja-vivo", borda: "border-l-laranja-vivo" },
  ok: { ponto: "bg-verde-vivo", texto: "text-verde", fundo: "bg-verde-claro", barra: "bg-verde-vivo", borda: "border-l-verde-vivo" },
  critico: { ponto: "bg-vermelho-vivo", texto: "text-vermelho", fundo: "bg-vermelho-claro", barra: "bg-vermelho-vivo", borda: "border-l-vermelho-vivo" },
};

// Situação de algo (etapa, projeto, pessoa): etiqueta com ponto
export function Status({ tom, children, className = "" }: { tom: Tom; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md py-0.5 pl-2 pr-2.5 text-[13px] font-medium ${corTom[tom].fundo} ${corTom[tom].texto} ${className}`}
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

// Etiqueta curta de alerta ou contagem, com ícone opcional
export function Chip({ tom, icone, children }: { tom: Tom; icone?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium leading-none ${corTom[tom].fundo} ${corTom[tom].texto}`}>
      {icone}
      {children}
    </span>
  );
}

// Prazo e contagem que pedem atenção: texto colorido, sem fundo
export function Selo({ tom, children }: { tom: Tom; children: React.ReactNode }) {
  return <span className={`num whitespace-nowrap text-[13px] font-medium ${corTom[tom].texto}`}>{children}</span>;
}

type Variante = keyof typeof variantes;
type Tamanho = keyof typeof tamanhos;
type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamanho?: Tamanho };

const variantes = {
  primario: "bg-azul text-folha hover:bg-azul-escuro border-azul shadow-sm",
  secundario: "bg-folha text-tinta hover:bg-pedra border-linha-forte shadow-sm",
  perigo: "bg-folha text-vermelho hover:bg-vermelho-claro border-vermelho/30",
  fantasma: "bg-transparent text-azul hover:bg-azul-claro border-transparent",
};
const tamanhos = { normal: "min-h-10 px-4 py-2 text-sm", pequeno: "min-h-8 px-3 py-1 text-[13px]" };

const baseBotao =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-campo)] border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45";

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
  return <section className={`rounded-[var(--radius-bloco)] border border-linha bg-folha shadow-[var(--shadow-cartao)] ${className}`}>{children}</section>;
}

export function Campo({ rotulo, dica, children, className = "" }: { rotulo: string; dica?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-semibold text-tinta">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-tinta-2">{dica}</span>}
    </label>
  );
}

export type Migalha = { rotulo: string; href?: string };

// Cabeçalho de página: trilha de navegação, título, ações e, quando houver,
// as abas da página logo abaixo.
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
    <header className="mb-6 pt-6 sm:pt-8">
      {migalhas && migalhas.length > 0 && (
        <nav aria-label="Você está em" className="mb-2 flex items-center gap-x-1.5 text-[13px] text-tinta-2">
          {migalhas.map((m, i) => (
            <span key={i} className={`flex min-w-0 items-center gap-1.5 ${i === 0 ? "shrink-0" : ""}`}>
              {i > 0 && (
                <span aria-hidden className="text-linha-forte">
                  ›
                </span>
              )}
              {m.href ? (
                <Link href={m.href} className="truncate font-medium text-azul hover:underline">
                  {m.rotulo}
                </Link>
              ) : (
                <span className="truncate">{m.rotulo}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-balance break-words text-[1.65rem] font-bold leading-tight tracking-tight text-tinta sm:text-[1.9rem]">{titulo}</h1>
          {subtitulo && <div className="mt-1 text-[15px] text-tinta-2">{subtitulo}</div>}
        </div>
        {children && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{children}</div>}
      </div>
      {abas && <div className="mt-6">{abas}</div>}
    </header>
  );
}

// Abas com sublinhado. No celular rolam de lado, e a aba aberta fica sempre à vista.
export function Abas<T extends string>({
  abas,
  atual,
  aoTrocar,
  extra,
  naFaixa = false,
  gradeNoCelular = false,
}: {
  abas: readonly T[];
  atual: T;
  aoTrocar: (a: T, botao: HTMLElement) => void;
  extra?: Partial<Record<T, React.ReactNode>>;
  naFaixa?: boolean;
  gradeNoCelular?: boolean; // no celular, botões em duas colunas em vez de rolar de lado
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [atual]);
  const grade = gradeNoCelular && (
    <div
      role="tablist"
      className={`grid grid-cols-2 gap-1 rounded-[var(--radius-bloco)] border border-linha bg-folha p-1 shadow-[var(--shadow-cartao)] sm:hidden ${naFaixa ? "" : "mb-6"}`}
    >
      {abas.map((a) => (
        <button
          key={a}
          role="tab"
          aria-selected={a === atual}
          onClick={(e) => aoTrocar(a, e.currentTarget)}
          className={`flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-campo)] px-2 py-2 text-center text-[14px] font-semibold leading-tight transition-colors ${
            a === atual ? "bg-azul text-folha shadow-sm" : "text-tinta-2 hover:bg-pedra hover:text-tinta"
          }`}
        >
          {a}
          {extra?.[a]}
        </button>
      ))}
    </div>
  );
  return (
    <>
      {grade}
      <div className={`relative border-b border-linha ${naFaixa ? "" : "mb-6"} ${gradeNoCelular ? "max-sm:hidden" : ""}`}>
        <div ref={ref} role="tablist" className="sem-barra -mb-px flex gap-4 overflow-x-auto pr-8 sm:gap-6 lg:pr-0">
          {abas.map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={a === atual}
              onClick={(e) => aoTrocar(a, e.currentTarget)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-3 pt-1 text-[14px] transition-colors sm:gap-2 sm:text-[15px] ${
                a === atual ? "border-azul font-semibold text-azul" : "border-transparent font-medium text-tinta-2 hover:border-linha-forte hover:text-tinta"
              }`}
            >
              {a}
              {extra?.[a]}
            </button>
          ))}
        </div>
        {/* Indica que há mais abas para o lado */}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-pedra to-transparent lg:hidden" />
      </div>
    </>
  );
}

// Seletor de visão (Lista, Quadro…): ícone sobre o rótulo no celular, lado a lado no computador
export function Segmentos<T extends string>({
  opcoes,
  atual,
  aoTrocar,
  rotulo,
}: {
  opcoes: readonly { valor: T; rotulo: string; icone?: React.ReactNode }[];
  atual: T;
  aoTrocar: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className="grid gap-1 rounded-[var(--radius-bloco)] border border-linha bg-folha shadow-[var(--shadow-cartao)] p-1 sm:inline-flex"
      style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}
    >
      {opcoes.map((o) => (
        <button
          key={o.valor}
          role="radio"
          aria-checked={atual === o.valor}
          onClick={() => aoTrocar(o.valor)}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-campo)] px-1 py-2 text-[12px] font-semibold transition-colors sm:flex-row sm:gap-2 sm:px-4 sm:text-sm ${
            atual === o.valor ? "bg-azul text-folha shadow-sm" : "text-tinta-2 hover:bg-pedra hover:text-tinta"
          }`}
        >
          {o.icone}
          <span className="whitespace-nowrap">{o.rotulo}</span>
        </button>
      ))}
    </div>
  );
}

// Número de destaque do painel. Com tom de atenção, o cartão ganha a cor de fundo do alerta.
export function Indicador({
  rotulo,
  valor,
  detalhe,
  tom,
  href,
}: {
  rotulo: string;
  valor: React.ReactNode;
  detalhe?: React.ReactNode;
  tom?: Tom;
  href?: string;
}) {
  const destaque = tom && tom !== "neutro" && tom !== "andamento";
  const fundo = destaque ? `${corTom[tom].fundo} border-transparent` : "border-linha bg-folha";
  const corValor = tom === "critico" ? "text-vermelho" : tom === "atencao" ? "text-laranja" : tom === "ok" ? "text-verde" : "text-tinta";
  const conteudo = (
    <>
      <p className="text-[13px] font-medium text-tinta-2">{rotulo}</p>
      <p className={`num mt-1.5 text-[1.75rem] font-bold leading-none tracking-tight sm:text-[2rem] ${corValor}`}>{valor}</p>
      {detalhe && <p className="mt-2 text-[13px] leading-snug text-tinta-2">{detalhe}</p>}
    </>
  );
  const classe = `block h-full min-w-0 rounded-[var(--radius-bloco)] border px-4 py-4 shadow-[var(--shadow-cartao)] sm:px-5 ${fundo}`;
  return href ? (
    <Link href={href} className={`${classe} transition-colors hover:border-azul/40`}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}

// O que fazer agora, em uma frase e um botão
export function ProximoPasso({ passo, aoAgir, className = "" }: { passo: Passo; aoAgir?: () => void; className?: string }) {
  const critico = passo.tom === "critico";
  const botao = `${baseBotao} ${tamanhos.normal} w-full sm:w-auto ${
    critico ? "border-vermelho bg-vermelho text-folha hover:brightness-110" : "border-azul bg-azul text-folha hover:bg-azul-escuro"
  }`;
  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[var(--radius-bloco)] border px-4 py-4 sm:px-5 ${
        critico ? "border-vermelho/25 bg-vermelho-claro" : "border-azul/20 bg-azul-claro"
      } ${className}`}
    >
      <div className="min-w-0 flex-1 basis-64">
        <p className={`text-[12px] font-bold uppercase tracking-wide ${critico ? "text-vermelho" : "text-azul"}`}>Próximo passo</p>
        <p className="mt-1 text-[17px] font-semibold leading-snug text-tinta">{passo.texto}</p>
        {passo.detalhe && <p className="mt-1 text-sm text-tinta-2">{passo.detalhe}</p>}
      </div>
      {aoAgir ? (
        <button onClick={aoAgir} className={botao}>
          {passo.rotulo}
        </button>
      ) : (
        <Link href={passo.href} className={botao}>
          {passo.rotulo}
        </Link>
      )}
    </div>
  );
}

export function Vazio({ titulo, children, acao }: { titulo: string; children?: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-bloco)] border border-dashed border-linha-forte bg-folha/70 px-6 py-12 text-center sm:px-8">
      <p className="text-lg font-semibold text-tinta">{titulo}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-sm text-tinta-2">{children}</p>}
      {acao && <div className="mt-6">{acao}</div>}
    </div>
  );
}

// Barra de progresso. `marca` (0–100) desenha o traço do previsto para hoje.
export function Barra({
  valor,
  total,
  tom = "andamento",
  marca,
  grossa = false,
}: {
  valor: number;
  total: number;
  tom?: Tom;
  marca?: number | null;
  grossa?: boolean;
}) {
  const pct = total ? Math.min(100, Math.round((valor / total) * 100)) : 0;
  return (
    <span
      className={`relative block w-full rounded-full bg-linha ${grossa ? "h-2.5" : "h-2"}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className={`block h-full rounded-full ${corTom[tom].barra}`} style={{ width: `${pct}%` }} />
      {marca != null && (
        <span
          aria-hidden
          className="absolute -inset-y-1 w-[2px] rounded-full bg-tinta/70"
          style={{ left: `calc(${Math.min(100, Math.max(0, marca))}% - 1px)` }}
        />
      )}
    </span>
  );
}
