"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { useAcesso, useEstado } from "@/lib/dados/store";
import { nomeDoCliente } from "@/lib/campos-cliente";
import { traduzirErro } from "@/lib/erros";

// Excluir o projeto (só gestores da empresa): um modal pede para digitar EXCLUIR e então apaga etapas, relatórios, imagens, PDFs e materiais
export function useExcluirProjeto(projeto: Projeto | undefined) {
  const { estado, excluir } = useEstado();
  const { gerencia } = useAcesso();
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);
  const [confirmando, setConfirmando] = useState(false); // o modal de confirmação está aberto
  const cliente = estado.clientes.find((c) => c.id === projeto?.clienteId);

  // Abre o modal; quem digita EXCLUIR e confirma chama confirmarExclusao
  const excluirProjeto = () => setConfirmando(true);
  const aviso = `Excluir o projeto de ${nomeDoCliente(cliente, "este cliente")}? Etapas, relatórios, imagens, o PDF assinado e os materiais do HUB serão apagados e não há como desfazer.`;

  const confirmarExclusao = async () => {
    if (!projeto) return;
    setExcluindo(true);
    try {
      await excluir("projeto", projeto.id);
      router.replace(`/${projeto.empresa}`);
    } catch (e) {
      alert(traduzirErro(e, "Não foi possível excluir."));
      setExcluindo(false);
    }
  };

  return { excluirProjeto, excluindo, confirmando, cancelarExclusao: () => !excluindo && setConfirmando(false), confirmarExclusao, aviso, podeExcluir: !!projeto && gerencia(projeto.empresa) };
}
