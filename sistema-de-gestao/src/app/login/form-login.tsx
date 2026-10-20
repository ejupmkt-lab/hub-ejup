"use client";

import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { Botao, Campo } from "@/components/ui";
import { TelaAcesso } from "@/components/tela-acesso";
import { MSG_SENHA_VAZADA, senhaVazada } from "@/lib/senha";
import { traduzirErro } from "@/lib/erros";

type Modo = "entrar" | "criar" | "esqueci";

const titulos: Record<Modo, string> = {
  entrar: "Entrar",
  criar: "Criar conta",
  esqueci: "Recuperar senha",
};

export function FormLogin({ erroLink }: { erroLink: boolean }) {
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    erroLink ? { tipo: "erro", texto: "O link expirou ou já foi usado. Peça um novo." } : null,
  );

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setMsg(null);
    const sb = supabaseNavegador();
    const retorno = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    try {
      if (modo === "entrar") {
        const { error } = await sb.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        window.location.href = "/";
      } else if (modo === "criar") {
        if (await senhaVazada(senha)) throw new Error(MSG_SENHA_VAZADA);
        const { data, error } = await sb.auth.signUp({ email, password: senha, options: { emailRedirectTo: retorno("/") } });
        if (error) throw error;
        if (data.session) window.location.href = "/";
        else setMsg({ tipo: "ok", texto: "Enviamos um link de confirmação para o seu e-mail. Abra o link para ativar a conta." });
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: retorno("/auth/redefinir-senha") });
        if (error) throw error;
        setMsg({ tipo: "ok", texto: "Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha." });
      }
    } catch (err) {
      setMsg({ tipo: "erro", texto: traduzirErro(err) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TelaAcesso titulo={titulos[modo]}>
      <form onSubmit={enviar} className="space-y-4">
        <Campo rotulo="E-mail">
          <input type="email" required autoComplete="email" className="campo" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Campo>
        {modo !== "esqueci" && (
          <Campo rotulo="Senha" dica={modo === "criar" ? "Mínimo de 8 caracteres." : undefined}>
            <input
              type="password"
              required
              minLength={modo === "criar" ? 8 : undefined}
              autoComplete={modo === "criar" ? "new-password" : "current-password"}
              className="campo"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </Campo>
        )}
        {msg && (
          <p className={`rounded-[var(--radius-campo)] p-3 text-sm ${msg.tipo === "ok" ? "bg-verde-claro text-verde" : "bg-vermelho-claro text-vermelho"}`}>{msg.texto}</p>
        )}
        <Botao type="submit" disabled={enviando} className="w-full">
          {enviando ? "Aguarde…" : modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Enviar link"}
        </Botao>
      </form>
      <div className="mt-6 flex flex-col items-start gap-2 text-[15px]">
        {modo !== "entrar" && (
          <button className="text-azul underline-offset-4 hover:underline" onClick={() => (setModo("entrar"), setMsg(null))}>
            Já tenho conta
          </button>
        )}
        {modo === "entrar" && (
          <>
            <button className="text-azul underline-offset-4 hover:underline" onClick={() => (setModo("criar"), setMsg(null))}>
              Primeiro acesso? Criar conta
            </button>
            <button className="text-tinta-2 underline-offset-4 hover:underline" onClick={() => (setModo("esqueci"), setMsg(null))}>
              Esqueci a senha
            </button>
          </>
        )}
      </div>
      {modo === "criar" && (
        <p className="mt-6 text-[13px] text-tinta-2">O acesso só é liberado para e-mails cadastrados pelo administrador.</p>
      )}
    </TelaAcesso>
  );
}
