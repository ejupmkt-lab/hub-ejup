import { ProvedorEstado } from "@/lib/dados/store";
import { Shell } from "@/components/shell";
import { ProvedorEmpresaAtual } from "@/lib/dados/empresa-atual";

export default function LayoutSistema({ children }: { children: React.ReactNode }) {
  return (
    <ProvedorEstado>
      <ProvedorEmpresaAtual>
        <Shell>{children}</Shell>
      </ProvedorEmpresaAtual>
    </ProvedorEstado>
  );
}
