"use client";

import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { Botao, Campo } from "@/components/ui";
import { TelaAcesso } from "@/components/tela-acesso";

export default function RedefinirSenha() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const { error } = await supabaseNavegador().auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) setErro(error.message);
    else window.location.href = "/";
  };

  return (
    <TelaAcesso titulo="Nova senha">
      <form onSubmit={salvar} className="space-y-4">
        <Campo rotulo="Nova senha" dica="Mínimo de 8 caracteres.">
          <input type="password" required minLength={8} autoComplete="new-password" className="campo" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </Campo>
        {erro && <p className="rounded-[var(--radius-campo)] bg-vinho-claro p-3 text-sm text-vinho">{erro}</p>}
        <Botao type="submit" disabled={enviando} className="w-full">{enviando ? "Salvando…" : "Salvar senha"}</Botao>
      </form>
    </TelaAcesso>
  );
}
