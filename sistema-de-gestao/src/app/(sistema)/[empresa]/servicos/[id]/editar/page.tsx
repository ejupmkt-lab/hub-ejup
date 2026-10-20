"use client";

import { useParams, useRouter } from "next/navigation";
import { useAcesso, useEstado } from "@/lib/dados/store";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import { BotaoLink, Cabecalho, Vazio } from "@/components/ui";
import { FormServico } from "@/components/servicos/form-servico";

export default function EditarServico() {
  const { empresa: slug, id } = useParams<{ empresa: EmpresaSlug; id: string }>();
  const { estado, atualizar } = useEstado();
  const { gerencia } = useAcesso();
  const router = useRouter();
  const s = estado.servicos.find((x) => x.id === id && x.empresa === slug);
  const voltar = () => router.push(`/${slug}/servicos/${id}`);

  if (!s || !gerencia(slug))
    return (
      <div className="pt-10">
        <Vazio titulo={s ? "Só gestores editam serviços" : "Serviço não encontrado"} acao={<BotaoLink href={`/${slug}/servicos`}>Ver os serviços</BotaoLink>}>
          {s ? "Peça a um gestor da empresa para alterar a ficha técnica." : "O link pode estar errado, ou o serviço foi excluído."}
        </Vazio>
      </div>
    );

  return (
    <>
      <Cabecalho
        migalhas={[{ rotulo: "Serviços", href: `/${slug}/servicos` }, { rotulo: s.nomeCurto, href: `/${slug}/servicos/${id}` }, { rotulo: "Editar" }]}
        titulo="Editar ficha do serviço"
        subtitulo="As mudanças valem para os projetos criados depois. Os projetos em andamento mantêm as etapas com que nasceram."
      />
      <FormServico
        key={`${s.id}-${s.versao}`}
        inicial={s}
        novo={false}
        aoSalvar={(novo) => {
          atualizar((r) => {
            const i = r.servicos.findIndex((x) => x.id === novo.id);
            if (i >= 0) r.servicos[i] = novo;
          });
          voltar();
        }}
        aoCancelar={voltar}
      />
    </>
  );
}
