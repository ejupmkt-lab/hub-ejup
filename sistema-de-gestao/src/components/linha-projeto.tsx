"use client";

import Link from "next/link";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { etapaAtual, etapaConcluida, situacaoPrazo } from "@/lib/projeto";
import { passoDoProjeto } from "@/lib/proximo-passo";
import { horasDoProjeto, horasFmt } from "@/lib/horas";
import { doisDigitos, statusProjeto } from "@/lib/rotulos";
import { BotaoLink, Selo, Status, StatusEtapa, corTom } from "@/components/ui";
import { Trilho } from "@/components/trilho";

// Um projeto numa lista: quem é o cliente, onde está, o calendário e o que
// fazer agora. O nome leva ao projeto; o botão leva direto ao próximo passo.
export function LinhaProjeto({ projeto: p, mostrarEmpresa = false }: { projeto: Projeto; mostrarEmpresa?: boolean }) {
  const { estado } = useEstado();
  const c = estado.clientes.find((x) => x.id === p.clienteId);
  const empresa = estado.empresas.find((e) => e.slug === p.empresa);
  const consultor = estado.usuarios.find((u) => u.id === p.consultorId);
  const et = etapaAtual(p);
  const sit = et && p.status === "em_andamento" ? situacaoPrazo(et) : null;
  const passo = passoDoProjeto(p);
  const feitas = p.etapas.filter(etapaConcluida).length;
  const horas = horasDoProjeto(p);
  const href = `/${p.empresa}/projetos/${p.id}`;

  return (
    <li className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-2">
        <div className="min-w-0">
          <Link href={href} className="font-serif text-[1.3rem] leading-snug text-tinta hover:text-garrafa hover:underline hover:decoration-1 hover:underline-offset-4">
            {c?.nomeFantasia || c?.razaoSocial || "Cliente"}
          </Link>
          <p className="num mt-0.5 text-sm text-tinta-2">
            {[mostrarEmpresa && empresa?.nome, c?.nomeFantasia && c.razaoSocial, `consultor ${consultor?.nome ?? "a definir"}`, `${feitas} de ${p.etapas.length} etapas enviadas`, `${horasFmt(horas.realizadas)} de ${horas.previstas} h registradas`]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {sit && sit.tom !== "neutro" && <Selo tom={sit.tom}>{sit.texto}</Selo>}
          {p.status !== "em_andamento" ? (
            <Status tom={p.status === "encerrado" ? "ok" : "atencao"}>{statusProjeto[p.status]}</Status>
          ) : et ? (
            <span className="flex items-center gap-2">
              <span className="num text-[13px] text-tinta-2">Etapa {doisDigitos(et.ordem)}</span>
              <StatusEtapa status={et.status} />
            </span>
          ) : (
            <Status tom="ok">Entregas enviadas</Status>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Trilho projeto={p} />
      </div>

      {passo && (
        <div className={`mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-[var(--radius-campo)] border-l-[3px] bg-pedra/60 py-2.5 pl-4 pr-2.5 ${borda[passo.tom]}`}>
          <p className="min-w-0 text-[15px]">
            <span className="text-tinta">{passo.texto}</span>
            {passo.detalhe && <span className="text-tinta-2"> {passo.detalhe}</span>}
          </p>
          <BotaoLink href={passo.href} variante="secundario" tamanho="pequeno">
            {passo.rotulo}
          </BotaoLink>
        </div>
      )}
    </li>
  );
}

const borda: Record<keyof typeof corTom, string> = {
  neutro: "border-linha-forte",
  andamento: "border-garrafa",
  atencao: "border-latao",
  ok: "border-musgo",
  critico: "border-vinho",
};
