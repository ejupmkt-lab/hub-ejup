import { LogoBlimp } from "@/components/logo";

// Tela de entrada: à esquerda a identidade e as etapas da consultoria; à direita o formulário.
const etapas = [
  { nome: "Preparação", dias: 4 },
  { nome: "Organização", dias: 5 },
  { nome: "Implementação", dias: 6 },
  { nome: "Governança", dias: 4 },
  { nome: "Análise e melhoria", dias: 3 },
];

export function TelaAcesso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] bg-pedra lg:grid-cols-[1.1fr_1fr] lg:grid-rows-none">
      <div className="flex flex-col justify-between bg-gradient-to-br from-marinho to-azul px-6 py-8 text-folha sm:px-14 lg:py-14">
        <div>
          <LogoBlimp className="h-10 w-auto" claro />
          <p className="mt-2 text-[13px] text-folha/75">Sistema de gestão de projetos e consultorias</p>
        </div>
        <div className="mt-16 hidden lg:block" aria-hidden>
          <div className="flex gap-1.5">
            {etapas.map((e, i) => (
              <div key={e.nome} style={{ flexGrow: e.dias, flexBasis: 0 }} className="min-w-[5.75rem]">
                <span className={`block h-2 rounded-full ${i < 2 ? "bg-folha" : i === 2 ? "bg-folha/45" : "bg-folha/20"}`} />
                <span className="mt-3 block pr-2 text-[13px] leading-snug text-folha/75">
                  <span className="block text-[15px] font-semibold text-folha">{String(i + 1).padStart(2, "0")}</span>
                  <span className="block text-balance">{e.nome}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-sm text-xl font-semibold leading-snug text-folha">
            Cada consultoria, etapa por etapa, do plano de trabalho ao relatório assinado.
          </p>
        </div>
      </div>
      <div className="flex items-start justify-center px-4 py-10 sm:items-center sm:px-6 sm:py-12">
        <div className="w-full max-w-sm rounded-[var(--radius-bloco)] border border-linha bg-folha p-6 shadow-[var(--shadow-cartao)] sm:p-8">
          <h1 className="mb-6 text-2xl font-bold tracking-tight">{titulo}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
