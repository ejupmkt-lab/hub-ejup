"use client";

import type { Projeto } from "@/lib/dados/tipos";
import { Campo, Cartao } from "@/components/ui";
import { useProjeto } from "./use-projeto";

const campos: { k: keyof Projeto; r: string; largo?: boolean }[] = [
  { k: "prestadoraVinculada", r: "Prestadora vinculada" },
  { k: "numeroProjetoHub", r: "Nº do projeto no HUB" },
  { k: "codigoSolicitacaoHub", r: "Código da solicitação no HUB" },
  { k: "gestorSebrae", r: "Gestor(a) SEBRAE" },
  { k: "fichaTecnica", r: "Ficha técnica", largo: true },
  { k: "codigoFichaTecnica", r: "Código da ficha técnica" },
  { k: "segmento", r: "Segmento" },
  { k: "areaAtuacao", r: "Área de atuação da consultoria", largo: true },
  { k: "localAssinatura", r: "Local (fechamento do relatório)" },
];

export function DadosProjeto({ projeto }: { projeto: Projeto }) {
  const { alterar, cliente } = useProjeto();
  return (
    <Cartao className="p-5">
      <h2 className="font-semibold">Ficha de identificação</h2>
      <p className="mb-4 text-xs text-tinta-2">Estes dados e os do cliente ({cliente?.razaoSocial}) preenchem a ficha no topo de todos os relatórios.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map(({ k, r, largo }) => (
          <Campo key={k} rotulo={r} className={largo ? "sm:col-span-2" : ""}>
            <input className="campo" value={String(projeto[k] ?? "")} onChange={(e) => alterar((p) => void ((p[k] as string) = e.target.value))} />
          </Campo>
        ))}
      </div>
    </Cartao>
  );
}
