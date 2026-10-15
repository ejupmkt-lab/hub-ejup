"use client";

import { useCallback, useState } from "react";

// Dica que acompanha o ponteiro sobre barras e dias. Também abre no foco
// do teclado (posicionada no elemento).
type Estado = { x: number; y: number; conteudo: React.ReactNode } | null;

export function useDica() {
  const [dica, setDica] = useState<Estado>(null);
  const mostrar = useCallback((e: React.MouseEvent | React.FocusEvent, conteudo: React.ReactNode) => {
    if ("clientX" in e) setDica({ x: e.clientX, y: e.clientY, conteudo });
    else {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDica({ x: r.left + r.width / 2, y: r.bottom, conteudo });
    }
  }, []);
  const esconder = useCallback(() => setDica(null), []);
  const props = (conteudo: React.ReactNode) => ({
    onMouseMove: (e: React.MouseEvent) => mostrar(e, conteudo),
    onMouseLeave: esconder,
    onFocus: (e: React.FocusEvent) => mostrar(e, conteudo),
    onBlur: esconder,
  });
  const elemento = dica && (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 max-w-72 rounded-[var(--radius-campo)] bg-tinta px-3 py-2 text-[13px] leading-snug text-folha shadow-lg"
      style={{
        left: Math.min(dica.x + 14, (typeof window !== "undefined" ? window.innerWidth : 9999) - 300),
        top: dica.y + 16,
      }}
    >
      {dica.conteudo}
    </div>
  );
  return { props, elemento };
}
