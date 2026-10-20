"use client";

import Link from "next/link";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { dataCurta } from "@/lib/datas";
import { grupos, pendenciasDoGrupo } from "@/lib/painel";
import { doisDigitos } from "@/lib/rotulos";

// O que pede ação em todos os projetos: atrasos e devoluções primeiro,
// depois o que está pronto para enviar e os prazos da semana.
export function Pendencias({ projetos }: { projetos: Projeto[] }) {
  const { estado } = useEstado();
  const lista = pendenciasDoGrupo(projetos);
  const nome = (p: Projeto) => {
    const c = estado.clientes.find((x) => x.id === p.clienteId);
    return c?.nomeFantasia || c?.razaoSocial || "Cliente";
  };
  if (!lista.length)
    return <p className="text-sm text-tinta-2">Nada atrasado, nada esperando envio e nenhum prazo nos próximos 7 dias.</p>;
  return (
    <ul className="-mx-2">
      {lista.map((x, i) => (
        <li key={i}>
          <Link
            href={`/${x.projeto.empresa}/projetos/${x.projeto.id}${x.etapa ? `/etapas/${x.etapa.ordem}` : ""}`}
            className="flex items-start gap-3 rounded-[var(--radius-campo)] px-2 py-2.5 hover:bg-pedra/60"
          >
            <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: grupos[x.grupo].cor }} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-tinta">
                {nome(x.projeto)}
                {x.etapa && <span className="text-tinta-2">, etapa {doisDigitos(x.etapa.ordem)}</span>}
              </span>
              <span className="block text-[13px] text-tinta-2">{x.texto}</span>
            </span>
            {x.data && <span className="num shrink-0 pt-0.5 text-[13px] text-tinta-2">{dataCurta(x.data)}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
