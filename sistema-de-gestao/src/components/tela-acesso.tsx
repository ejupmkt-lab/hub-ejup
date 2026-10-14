export function TelaAcesso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-papel px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-tinta-2">Ecossistema Pivotto</div>
          <div className="mt-1 text-xl font-semibold">Sistema de Gestão</div>
        </div>
        <div className="rounded-lg border border-linha bg-superficie p-6">
          <h1 className="mb-4 font-semibold">{titulo}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
