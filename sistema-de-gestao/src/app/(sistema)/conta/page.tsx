"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useUsuario } from "@/lib/dados/store";
import { MSG_SENHA_VAZADA, senhaVazada } from "@/lib/senha";
import { traduzirErro } from "@/lib/erros";
import { Botao, Cabecalho, Campo, Cartao, Status } from "@/components/ui";

type Cadastro = { id: string; qr: string; segredo: string };

export default function MinhaConta() {
  const usuario = useUsuario();
  return (
    <>
      <Cabecalho titulo="Minha conta" subtitulo={`${usuario.nomeCompleto}, ${usuario.email}`} />
      <div className="grid max-w-3xl gap-8">
        <DuasEtapas />
        <AlterarSenha />
      </div>
    </>
  );
}

function DuasEtapas() {
  const [ativo, setAtivo] = useState<string | null | undefined>(undefined); // id do fator, null = desativado
  const [cadastro, setCadastro] = useState<Cadastro | null>(null);
  const [codigo, setCodigo] = useState("");
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabaseNavegador().auth.mfa.listFactors();
    setAtivo(data?.totp.find((f) => f.status === "verified")?.id ?? null);
  }, []);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const comecar = async () => {
    setOcupado(true);
    setMsg(null);
    const sb = supabaseNavegador();
    // Descarta cadastros anteriores que não foram concluídos
    const { data: lista } = await sb.auth.mfa.listFactors();
    for (const f of lista?.all ?? []) if (f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "Aplicativo autenticador" });
    setOcupado(false);
    if (error || !data) return setMsg({ tipo: "erro", texto: traduzirErro(error, "Não foi possível começar agora.") });
    setCadastro({ id: data.id, qr: data.totp.qr_code, segredo: data.totp.secret });
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadastro) return;
    setOcupado(true);
    const { error } = await supabaseNavegador().auth.mfa.challengeAndVerify({ factorId: cadastro.id, code: codigo.trim() });
    setOcupado(false);
    if (error) return setMsg({ tipo: "erro", texto: "Código incorreto. Confira o aplicativo e tente de novo." });
    setCadastro(null);
    setCodigo("");
    setMsg({ tipo: "ok", texto: "Verificação em duas etapas ativada. Nas próximas entradas o sistema vai pedir o código do aplicativo." });
    await carregar();
  };

  const desativar = async () => {
    if (!ativo || !confirm("Desativar a verificação em duas etapas? A conta fica protegida só pela senha.")) return;
    setOcupado(true);
    const sb = supabaseNavegador();
    const { error } = await sb.auth.mfa.unenroll({ factorId: ativo });
    if (!error) await sb.auth.refreshSession();
    setOcupado(false);
    if (error) return setMsg({ tipo: "erro", texto: traduzirErro(error) });
    setMsg({ tipo: "ok", texto: "Verificação em duas etapas desativada." });
    await carregar();
  };

  return (
    <Cartao className="p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl">Verificação em duas etapas</h2>
        {ativo !== undefined && <Status tom={ativo ? "ok" : "neutro"}>{ativo ? "Ativada" : "Desativada"}</Status>}
      </div>
      <p className="mt-1 text-[15px] text-tinta-2">
        Além da senha, a entrada pede um código que muda a cada 30 segundos no celular. Os dados dos clientes ficam protegidos mesmo se a senha vazar.
      </p>

      {cadastro ? (
        <form onSubmit={confirmar} className="mt-6 grid gap-6 sm:grid-cols-[11rem_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cadastro.qr} alt="QR code para o aplicativo autenticador" className="h-44 w-44 rounded-[var(--radius-campo)] bg-white p-2" />
          <div className="space-y-4">
            <ol className="list-decimal space-y-1.5 pl-5 text-[15px]">
              <li>Instale no celular um aplicativo autenticador (Google Authenticator, Microsoft Authenticator ou similar).</li>
              <li>No aplicativo, escolha adicionar conta e aponte a câmera para o QR code.</li>
              <li>Digite abaixo o código de 6 dígitos que aparecer.</li>
            </ol>
            <p className="text-[13px] text-tinta-2">
              Sem câmera? Digite esta chave no aplicativo: <span className="num select-all break-all text-tinta">{cadastro.segredo}</span>
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <Campo rotulo="Código" className="w-40">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  className="campo num tracking-[0.3em]"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                />
              </Campo>
              <Botao type="submit" disabled={ocupado || codigo.length !== 6}>
                Ativar
              </Botao>
              <Botao type="button" variante="secundario" onClick={() => setCadastro(null)}>
                Cancelar
              </Botao>
            </div>
          </div>
        </form>
      ) : ativo ? (
        <Botao variante="secundario" onClick={desativar} disabled={ocupado} className="mt-6">
          Desativar
        </Botao>
      ) : ativo === null ? (
        <Botao onClick={comecar} disabled={ocupado} className="mt-6">
          Ativar verificação em duas etapas
        </Botao>
      ) : null}

      {msg && (
        <p className={`mt-4 rounded-[var(--radius-campo)] p-3 text-sm ${msg.tipo === "ok" ? "bg-musgo-claro text-musgo" : "bg-vinho-claro text-vinho"}`}>{msg.texto}</p>
      )}
    </Cartao>
  );
}

function AlterarSenha() {
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setOcupado(true);
    setMsg(null);
    if (await senhaVazada(senha)) {
      setOcupado(false);
      return setMsg({ tipo: "erro", texto: MSG_SENHA_VAZADA });
    }
    const { error } = await supabaseNavegador().auth.updateUser({ password: senha });
    setOcupado(false);
    if (error) return setMsg({ tipo: "erro", texto: traduzirErro(error) });
    setSenha("");
    setMsg({ tipo: "ok", texto: "Senha alterada." });
  };

  return (
    <Cartao className="p-6 sm:p-8">
      <h2 className="font-serif text-2xl">Alterar senha</h2>
      <form onSubmit={salvar} className="mt-5 flex flex-wrap items-end gap-3">
        <Campo rotulo="Nova senha" className="w-72 max-w-full">
          <input type="password" placeholder="Mínimo de 8 caracteres" required minLength={8} autoComplete="new-password" className="campo" value={senha} onChange={(e) => setSenha(e.target.value)} />
        </Campo>
        <Botao type="submit" disabled={ocupado}>
          {ocupado ? "Salvando…" : "Salvar senha"}
        </Botao>
      </form>
      {msg && (
        <p className={`mt-4 rounded-[var(--radius-campo)] p-3 text-sm ${msg.tipo === "ok" ? "bg-musgo-claro text-musgo" : "bg-vinho-claro text-vinho"}`}>{msg.texto}</p>
      )}
    </Cartao>
  );
}
