"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { nomeDoCliente } from "@/lib/campos-cliente";
import { traduzirErro } from "@/lib/erros";

// Excluir o projeto (só gestores da empresa): pede para digitar EXCLUIR e apaga etapas, relatórios, imagens, PDFs e materiais
export function useExcluirProjeto(projeto: Projeto | undefined) {
  const { estado, excluir } = useEstado();
  const { gerencia } = useAcesso();
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);
  const cliente = estado.clientes.find((c) => c.id === projeto?.clienteId);

  const excluirProjeto = async () => {
    if (!projeto) return;
    const resposta = prompt(
      `Excluir o projeto de ${nomeDoCliente(cliente, "este cliente")}? Etapas, relatórios, imagens, o PDF assinado e os materiais do HUB serão apagados e não há como desfazer.\n\nPara confirmar, digite EXCLUIR.`,
    );
    if (resposta?.trim().toUpperCase() !== "EXCLUIR") return;
    setExcluindo(true);
    try {
      await excluir("projeto", projeto.id);
      router.replace(`/${projeto.empresa}`);
    } catch (e) {
      alert(traduzirErro(e, "Não foi possível excluir."));
      setExcluindo(false);
    }
  };

  return { excluirProjeto, excluindo, podeExcluir: !!projeto && gerencia(projeto.empresa) };
}
