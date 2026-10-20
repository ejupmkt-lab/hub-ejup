"use client";

import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { Botao, Campo } from "@/components/ui";
import { TelaAcesso } from "@/components/tela-acesso";

// Segundo passo da entrada para quem ativou a verificação em duas etapas
export function TelaCodigo({ aoConfirmar, sair }: { aoConfirmar: () => Promise<void>; sair: () => Promise<void> }) {
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const sb = supabaseNavegador();
    const { data } = await sb.auth.mfa.listFactors();
    const fator = data?.totp.find((f) => f.status === "verified");
    const r = fator ? await sb.auth.mfa.challengeAndVerify({ factorId: fator.id, code: codigo.trim() }) : null;
    if (!r || r.error) {
      setErro("Código incorreto ou expirado. Confira o aplicativo e tente de novo.");
      setEnviando(false);
      return;
    }
    await aoConfirmar();
  };

  return (
    <TelaAcesso titulo="Código de verificação">
      <form onSubmit={confirmar} className="space-y-4">
        <p className="text-[15px] text-tinta-2">Abra o aplicativo autenticador no celular e digite o código de 6 dígitos do Sistema de Gestão.</p>
        <Campo rotulo="Código">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            className="campo num tracking-[0.3em]"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
          />
        </Campo>
        {erro && <p className="rounded-[var(--radius-campo)] bg-vermelho-claro p-3 text-sm text-vermelho">{erro}</p>}
        <Botao type="submit" disabled={enviando || codigo.length !== 6} className="w-full">
          {enviando ? "Conferindo…" : "Entrar"}
        </Botao>
      </form>
      <button onClick={sair} className="mt-6 text-[15px] text-tinta-2 underline-offset-4 hover:underline">
        Sair e entrar com outra conta
      </button>
    </TelaAcesso>
  );
}
