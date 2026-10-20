// Ícones de traço, 24×24, na cor do texto. Decorativos (aria-hidden): o
// rótulo ao lado é que diz o que o botão faz.

type P = { className?: string };

function Svg({ className = "h-5 w-5", children }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

export const IconePainel = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Svg>
);

export const IconeProjetos = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  </Svg>
);

export const IconeTarefas = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="m8 12.2 2.8 2.8L16.5 9" />
  </Svg>
);

export const IconeMais = (p: P) => (
  <Svg {...p}>
    <circle cx="5.5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="18.5" cy="12" r="1.2" fill="currentColor" />
  </Svg>
);

export const IconeMaisSinal = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconeRegistrar = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 3h6v3H9zM12 10.5v6M9 13.5h6" />
  </Svg>
);

export const IconeClientes = (p: P) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 19.5a6.5 6.5 0 0 1 13 0M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.2a6.5 6.5 0 0 1 3.5 5.3" />
  </Svg>
);

export const IconeBiblioteca = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 5.5a2 2 0 0 1 2-2h12v14h-12a2 2 0 0 0-2 2zM4.5 19.5a2 2 0 0 0 2 2h12v-4" />
    <path d="M9 7.5h6" />
  </Svg>
);

export const IconeAcessos = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5 5 6v5.5c0 4.4 3 7.8 7 9 4-1.2 7-4.6 7-9V6z" />
    <path d="m9.2 12.2 2 2 3.8-4" />
  </Svg>
);

export const IconeConta = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </Svg>
);

export const IconeSair = (p: P) => (
  <Svg {...p}>
    <path d="M14.5 4.5h-8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" />
  </Svg>
);

export const IconeLista = (p: P) => (
  <Svg {...p}>
    <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />
  </Svg>
);

export const IconeQuadro = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
    <path d="M9.2 4v16M14.8 4v16" />
  </Svg>
);

export const IconeCronograma = (p: P) => (
  <Svg {...p}>
    <path d="M3.5 4v16h17" />
    <path d="M7 8h6M10 12.5h7M8 17h5" strokeWidth="2.6" />
  </Svg>
);

export const IconeCalendario = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

export const IconeVoltar = (p: P) => (
  <Svg {...p}>
    <path d="M14.5 6 8.5 12l6 6" />
  </Svg>
);

export const IconeSeta = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const IconeRelatorio = (p: P) => (
  <Svg {...p}>
    <path d="M13.5 3.5h-7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-9z" />
    <path d="M13.5 3.5v6h6M8.5 13.5h7M8.5 17h5" />
  </Svg>
);

export const IconeRelogio = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconeCalendarioPequeno = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8 14h2M14 14h2" />
  </Svg>
);

export const IconeFechar = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconeBusca = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Svg>
);

export const IconeEmpresa = (p: P) => (
  <Svg {...p}>
    <path d="M4 20.5V6.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14M15 9.5h3a2 2 0 0 1 2 2v9M2.5 20.5h19M8 8.5h3M8 12h3M8 15.5h3" />
  </Svg>
);

export const IconeMicrofone = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11.5" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
  </Svg>
);

export const IconeAnexo = (p: P) => (
  <Svg {...p}>
    <path d="m20 11.5-7.8 7.8a5 5 0 0 1-7.1-7.1l8.2-8.2a3.4 3.4 0 0 1 4.8 4.8l-8.2 8.2a1.7 1.7 0 0 1-2.4-2.4l7.4-7.4" />
  </Svg>
);

export const IconeEnviar = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 12h11M11 6l6.5 6-6.5 6" strokeWidth="2.2" />
  </Svg>
);

export const IconeIA = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5Z" />
    <path d="M18.5 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5Z" />
  </Svg>
);

export const IconeConversa = (p: P) => (
  <Svg {...p}>
    <path d="M20.5 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 20.5 12Z" />
  </Svg>
);

export const IconeCheck = (p: P) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth="2.2" />
  </Svg>
);

// Marca: quadrado azul com o "P"
export function Marca({ className = "h-9 w-9", claro = false }: P & { claro?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-[10px] text-[1.05rem] font-bold ${claro ? "bg-folha text-azul" : "bg-azul text-folha"} ${className}`}
    >
      P
    </span>
  );
}
