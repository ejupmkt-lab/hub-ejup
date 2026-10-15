"use client";

import { useParams } from "next/navigation";
import { registrarEvento, useEstado, useUsuario } from "@/lib/dados/store";
import type { Projeto } from "@/lib/dados/tipos";

// Projeto da rota + função para alterá-lo registrando no histórico
export function useProjeto() {
  const { id, empresa } = useParams<{ id: string; empresa: string }>();
  const { estado, atualizar } = useEstado();
  const usuario = useUsuario();
  // O projeto precisa ser da empresa do endereço
  const projeto = estado.projetos.find((p) => p.id === id && p.empresa === empresa);
  const cliente = projeto && estado.clientes.find((c) => c.id === projeto.clienteId);
  const consultor = projeto && estado.usuarios.find((u) => u.id === projeto.consultorId);

  const alterar = (fn: (p: Projeto) => void, evento?: { acao: string; detalhe?: string }) =>
    atualizar((r) => {
      const p = r.projetos.find((x) => x.id === id);
      if (!p) return;
      fn(p);
      if (evento) registrarEvento(p, usuario.nome, evento.acao, evento.detalhe);
    });

  return { projeto, cliente, consultor, alterar, usuario };
}
