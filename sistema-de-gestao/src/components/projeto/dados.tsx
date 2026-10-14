"use client";

import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { Campo, Cartao } from "@/components/ui";
import { useProjeto } from "./use-projeto";

const campos: { k: keyof Projeto; r: string; largo?: boolean }[] = [
  { k: "prestadoraVinculada", r: "Prestadora vinculada" },
  { k: "numeroProjetoHub", r: "Nº do projeto no HUB" },
  { k: "codigoSolicitacaoHub", r: "Código da solicitação no HUB" },
  { k: "gestorSebrae", r: "Gestor ou gestora SEBRAE" },
  { k: "fichaTecnica", r: "Ficha técnica", largo: true },
  { k: "codigoFichaTecnica", r: "Código da ficha técnica" },
  { k: "segmento", r: "Segmento" },
  { k: "areaAtuacao", r: "Área de atuação da consultoria", largo: true },
  { k: "localAssinatura", r: "Local (fechamento do relatório)" },
];

export function DadosProjeto({ projeto }: { projeto: Projeto }) {
  const { alterar, cliente } = useProjeto();
  const { estado } = useEstado();
  const consultores = estado.usuarios.filter((u) => u.acessos[projeto.empresa]);
  const consultorAtual = consultores.find((u) => u.id === projeto.consultorId);

  return (
    <Cartao className="p-6 sm:p-8">
      <h2 className="font-serif text-2xl">Ficha de identificação</h2>
      <p className="mb-6 mt-1 text-[15px] text-tinta-2">
        Estes dados e os do cliente ({cliente?.razaoSocial}) preenchem a ficha no topo de todos os relatórios.
      </p>
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <Campo
          rotulo="Consultor responsável"
          dica={consultorAtual ? "Assina os relatórios como Consultor Responsável." : "Escolha quem assina os relatórios."}
          className="sm:col-span-2"
        >
          <select
            className="campo"
            value={consultorAtual ? projeto.consultorId : ""}
            onChange={(e) => {
              const novo = consultores.find((u) => u.id === e.target.value);
              alterar((p) => void (p.consultorId = e.target.value), { acao: "Consultor responsável definido", detalhe: novo?.nomeCompleto });
            }}
          >
            {!consultorAtual && <option value="">A definir</option>}
            {consultores.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nomeCompleto}
              </option>
            ))}
          </select>
        </Campo>
        {campos.map(({ k, r, largo }) => (
          <Campo key={k} rotulo={r} className={largo ? "sm:col-span-2" : ""}>
            <input className="campo" value={String(projeto[k] ?? "")} onChange={(e) => alterar((p) => void ((p[k] as string) = e.target.value))} />
          </Campo>
        ))}
      </div>
    </Cartao>
  );
}
