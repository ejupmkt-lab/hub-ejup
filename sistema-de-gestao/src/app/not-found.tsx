import Link from "next/link";

// Endereço que não existe no sistema
export default function NaoEncontrada() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-pedra px-6">
      <div className="max-w-md text-center">
        <p className="font-serif text-[1.45rem] text-tinta">Página não encontrada</p>
        <p className="mt-2 text-sm text-tinta-2">O endereço pode estar errado ou a página foi movida.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-[var(--radius-campo)] border border-garrafa bg-garrafa px-4 py-2 text-sm font-medium text-folha hover:bg-garrafa-escuro"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
