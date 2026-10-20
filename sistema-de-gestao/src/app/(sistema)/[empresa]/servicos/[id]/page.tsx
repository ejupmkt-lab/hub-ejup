"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAcesso, useEstado } from "@/lib/dados/store";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import type { EtapaModelo } from "@/lib/modelos/tipos";
import { horasDoServico } from "@/lib/servicos";
import { doisDigitos } from "@/lib/rotulos";
import { traduzirErro } from "@/lib/erros";
import { Abas, Botao, BotaoLink, Cabecalho, Cartao, Chip, Vazio } from "@/components/ui";
import { BibliotecaServico } from "@/components/servicos/biblioteca-servico";
import { IconeMaisSinal } from "@/components/icones";

const abas = ["Ficha técnica", "Biblioteca de textos"] as const;
type Aba = (typeof abas)[number];

export default function PaginaServico() {
  const { empresa: slug, id } = useParams<{ empresa: EmpresaSlug; id: string }>();
  const { estado, excluir } = useEstado();
  const { gerencia } = useAcesso();
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("Ficha técnica");
  const s = estado.servicos.find((x) => x.id === id && x.empresa === slug);

  if (!s)
    return (
      <div className="pt-10">
        <Vazio titulo="Serviço não encontrado" acao={<BotaoLink href={`/${slug}/servicos`}>Ver os serviços</BotaoLink>}>
          O link pode estar errado, ou o serviço foi excluído.
        </Vazio>
      </div>
    );

  const projetos = estado.projetos.filter((p) => p.modeloId === s.id);
  const podeEditar = gerencia(slug);

  const apagar = async () => {
    if (!confirm(`Excluir o serviço “${s.nomeCurto}”? A biblioteca de textos dele também é apagada.`)) return;
    try {
      await excluir("servico", s.id);
      router.push(`/${slug}/servicos`);
    } catch (e) {
      alert(traduzirErro(e, "Não foi possível excluir o serviço."));
    }
  };

  return (
    <>
      <Cabecalho
        migalhas={[{ rotulo: "Serviços", href: `/${slug}/servicos` }, { rotulo: s.nomeCurto }]}
        titulo={s.fichaTecnica}
        subtitulo={
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {s.area && <span className="font-semibold text-azul">{s.area}</span>}
            {s.area && s.codigoFichaTecnica && <span aria-hidden>·</span>}
            {s.codigoFichaTecnica && <span className="num">Ficha {s.codigoFichaTecnica}</span>}
            <Chip tom={s.credenciado ? "ok" : "atencao"}>{s.credenciado ? "Credenciado" : "Não credenciado"}</Chip>
          </p>
        }
        abas={<Abas abas={abas} atual={aba} aoTrocar={setAba} naFaixa />}
      >
        {podeEditar && (
          <BotaoLink href={`/${slug}/servicos/${s.id}/editar`} variante="secundario" className="flex-1 sm:flex-none">
            Editar ficha
          </BotaoLink>
        )}
        <BotaoLink href={`/${slug}/projetos/novo?servico=${s.id}`} className="flex-1 sm:flex-none">
          <IconeMaisSinal className="h-4 w-4" />
          Novo projeto
        </BotaoLink>
      </Cabecalho>

      {aba === "Ficha técnica" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <ol className="min-w-0 space-y-4">
            {s.etapas.map((e) => (
              <li key={e.ordem}>
                <EtapaFicha e={e} />
              </li>
            ))}
          </ol>
          <aside className="min-w-0 space-y-4">
            <Cartao className="p-4 sm:p-5">
              <h2 className="text-[17px] font-bold">Resumo</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                {(
                  [
                    ["Nome curto", s.nomeCurto],
                    [
                      "Carga horária",
                      `${horasDoServico(s) ? `${horasDoServico(s)} h` : "Definida na proposta de cada projeto"}, ${s.etapas.length} ${s.etapas.length === 1 ? "etapa" : "etapas"}`,
                    ],
                    ["Prestadora vinculada", s.prestadoraVinculada],
                    ["Área de atuação nos relatórios", s.areaAtuacao],
                    [
                      "Projetos",
                      projetos.length ? `${projetos.length} (${projetos.filter((p) => p.status !== "encerrado").length} em andamento)` : "Nenhum ainda",
                    ],
                  ] as [string, string][]
                )
                  .filter(([, v]) => v?.trim())
                  .map(([rotulo, valor]) => (
                    <div key={rotulo}>
                      <dt className="text-[12px] text-tinta-2">{rotulo}</dt>
                      <dd className="break-words text-tinta">{valor}</dd>
                    </div>
                  ))}
              </dl>
              {s.descricao && <p className="mt-4 border-t border-linha pt-3 text-sm text-tinta-2">{s.descricao}</p>}
            </Cartao>
            <p className="text-[13px] text-tinta-2">
              Mudanças na ficha valem para os projetos criados depois. Os projetos em andamento mantêm as etapas com que nasceram.
            </p>
            {podeEditar && (
              <div>
                <Botao variante="secundario" tamanho="pequeno" onClick={() => void apagar()} disabled={projetos.length > 0} className="hover:!text-vermelho">
                  Excluir serviço
                </Botao>
                {projetos.length > 0 && <p className="mt-1.5 text-[13px] text-tinta-2">Não dá para excluir um serviço que tem projetos.</p>}
              </div>
            )}
          </aside>
        </div>
      )}
      {aba === "Biblioteca de textos" && <BibliotecaServico servico={s} />}
    </>
  );
}

function EtapaFicha({ e }: { e: EtapaModelo }) {
  return (
    <Cartao className="p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[17px] font-bold">
          <span className="num text-azul">{doisDigitos(e.ordem)}</span> · {e.nome.charAt(0) + e.nome.slice(1).toLowerCase()}
        </h2>
        <span className="num text-sm text-tinta-2">
          {e.horasPrevistas ? `${e.horasPrevistas} h` : "horas da proposta"}
          {e.duracaoReferenciaDias ? ` · cerca de ${e.duracaoReferenciaDias} ${e.duracaoReferenciaDias === 1 ? "dia" : "dias"}` : ""}
        </span>
      </div>
      {e.descricao && <p className="mt-2 text-[15px] text-tinta-2">{e.descricao}</p>}
      <h3 className="mt-4 text-[13px] font-bold uppercase tracking-wide text-tinta-2">Checklist</h3>
      <ul className="mt-2 space-y-1.5">
        {e.atividades.map(([codigo, texto]) => (
          <li key={codigo} className={`flex gap-2 text-sm ${codigo.includes(".") ? "pl-6 text-tinta-2" : "font-medium text-tinta"}`}>
            <span className="num shrink-0">{codigo}</span>
            <span className="min-w-0 break-words">{texto}</span>
          </li>
        ))}
      </ul>
      {e.entregaveis.length > 0 && (
        <>
          <h3 className="mt-4 text-[13px] font-bold uppercase tracking-wide text-tinta-2">Entregáveis</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-tinta">
            {e.entregaveis.map((t) => (
              <li key={t} className="break-words">
                {t}
              </li>
            ))}
          </ul>
        </>
      )}
      {e.instrumentos.length > 0 && (
        <>
          <h3 className="mt-4 text-[13px] font-bold uppercase tracking-wide text-tinta-2">Instrumentos complementares</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-tinta">
            {e.instrumentos.map((t) => (
              <li key={t} className="break-words">
                {t}
              </li>
            ))}
          </ul>
        </>
      )}
    </Cartao>
  );
}
