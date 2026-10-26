"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { novoId, useAcesso, useEstado } from "@/lib/dados/store";
import type { EmpresaSlug } from "@/lib/dados/tipos";
import { servicoVazio } from "@/lib/servicos";
import { BotaoLink, Cabecalho, Vazio } from "@/components/ui";
import { FormServico } from "@/components/servicos/form-servico";

export default function NovoServico() {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { atualizar } = useEstado();
  const { gerencia } = useAcesso();
  const router = useRouter();
  // O Next mantém a página montada ao navegar: depois de salvar ou cancelar, o
  // formulário recomeça em branco (a chave nova remonta o componente)
  const [rodada, setRodada] = useState(0);
  const [inicial] = useState(() => servicoVazio(slug, ""));
  const sair = (destino: string) => {
    setRodada((n) => n + 1);
    router.push(destino);
  };

  return (
    <>
      <Cabecalho migalhas={[{ rotulo: "Serviços", href: `/${slug}/servicos` }, { rotulo: "Novo serviço" }]} titulo="Novo serviço" />
      {!gerencia(slug) ? (
        <Vazio titulo="Só gestores cadastram serviços" acao={<BotaoLink href={`/${slug}/servicos`}>Ver os serviços</BotaoLink>}>
          Peça a um gestor da empresa para cadastrar a ficha técnica.
        </Vazio>
      ) : (
        <FormServico
          key={rodada}
          inicial={inicial}
          novo
          aoSalvar={(s) => {
            const id = novoId("srv");
            atualizar((r) => void r.servicos.push({ ...s, id }));
            sair(`/${slug}/servicos/${id}`);
          }}
          aoCancelar={() => sair(`/${slug}/servicos`)}
        />
      )}
    </>
  );
}
