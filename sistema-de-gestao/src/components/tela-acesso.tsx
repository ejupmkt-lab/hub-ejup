// Tela de entrada: à esquerda a identidade e o trilho de etapas em repouso; à direita o formulário.
const etapas = [
  { nome: "Preparação", dias: 4 },
  { nome: "Organização", dias: 5 },
  { nome: "Implementação", dias: 6 },
  { nome: "Governança", dias: 4 },
  { nome: "Análise e melhoria", dias: 3 },
];

export function TelaAcesso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-pedra lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col justify-between bg-capa px-8 py-10 text-folha sm:px-14 lg:py-14">
        <div>
          <p className="font-serif text-[2rem] leading-none">Pivotto</p>
          <p className="mt-2 text-[15px] text-folha/70">Sistema de gestão das empresas do ecossistema</p>
        </div>
        <div className="mt-16 hidden lg:block" aria-hidden>
          <div className="flex gap-1">
            {etapas.map((e, i) => (
              <div key={e.nome} style={{ flexGrow: e.dias, flexBasis: 0 }} className="min-w-[5.75rem]">
                <span className={`block h-2 rounded-[3px] ${i < 2 ? "bg-folha" : i === 2 ? "bg-folha/40" : "bg-folha/15"}`} />
                <span className="mt-3 block pr-2 text-[13px] leading-snug text-folha/70">
                  <span className="block font-serif text-[15px] text-folha">{String(i + 1).padStart(2, "0")}</span>
                  <span className="block text-balance">{e.nome}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-sm font-serif text-xl leading-snug text-folha/90">
            Cada consultoria, etapa por etapa, do plano de trabalho ao relatório assinado.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="mb-6 font-serif text-[1.75rem]">{titulo}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
