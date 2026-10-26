import { grupos, ordemGrupos, type Grupo } from "@/lib/painel";

// Legenda das situações: amostra colorida ao lado de texto em tinta
export function Legenda({ contagem }: { contagem?: Record<Grupo, number> }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-tinta-2">
      {ordemGrupos.map((g) => (
        <li key={g} className="flex items-center gap-2">
          <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: grupos[g].cor }} />
          {grupos[g].rotulo}
          {contagem && <span className="num font-medium text-tinta">{contagem[g]}</span>}
        </li>
      ))}
    </ul>
  );
}
