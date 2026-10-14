import { ProvedorEstado } from "@/lib/dados/store";
import { Shell } from "@/components/shell";

export default function LayoutSistema({ children }: { children: React.ReactNode }) {
  return (
    <ProvedorEstado>
      <Shell>{children}</Shell>
    </ProvedorEstado>
  );
}
