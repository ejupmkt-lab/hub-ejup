"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useEstado, useUsuario } from "@/lib/dados/store";
import { papelMembro, statusEmpresa } from "@/lib/rotulos";
import type { EmpresaSlug, Papel } from "@/lib/dados/tipos";
import { Botao, Cabecalho, Campo, Cartao, Status } from "@/components/ui";

type Situacao = "ativo" | "pendente" | "sem_acesso";
type Pessoa = {
  email: string;
  nome: string;
  nomeCompleto: string;
  admin: boolean;
  acessos: Partial<Record<EmpresaSlug, Papel>>;
  situacao: Situacao;
};
type Form = Omit<Pessoa, "situacao">;

const situacoes: Record<Situacao, { rotulo: string; tom: "ok" | "atencao" | "neutro" }> = {
  ativo: { rotulo: "Com acesso", tom: "ok" },
  pendente: { rotulo: "Aguardando criar a conta", tom: "atencao" },
  sem_acesso: { rotulo: "Acesso retirado", tom: "neutro" },
};

const formVazio: Form = { email: "", nome: "", nomeCompleto: "", admin: false, acessos: {} };

async function carregarPessoas(): Promise<Pessoa[]> {
  const sb = supabaseNavegador();
  const [perfis, membros, convites] = await Promise.all([
    sb.from("perfis").select("id, email, nome, nome_completo, admin_grupo"),
    sb.from("membros").select("empresa, user_id, papel"),
    sb.from("convites").select("email, nome, nome_completo, admin_grupo, acessos"),
  ]);
  const erro = perfis.error ?? membros.error ?? convites.error;
  if (erro) throw erro;
  const pessoas: Pessoa[] = perfis.data!.map((p) => {
    const acessos = Object.fromEntries(membros.data!.filter((m) => m.user_id === p.id).map((m) => [m.empresa, m.papel]));
    return {
      email: p.email,
      nome: p.nome,
      nomeCompleto: p.nome_completo,
      admin: p.admin_grupo,
      acessos,
      situacao: p.admin_grupo || Object.keys(acessos).length ? "ativo" : "sem_acesso",
    };
  });
  for (const c of convites.data!) {
    if (pessoas.some((p) => p.email === c.email.toLowerCase())) continue;
    pessoas.push({
      email: c.email,
      nome: c.nome,
      nomeCompleto: c.nome_completo,
      admin: c.admin_grupo,
      acessos: c.acessos as Pessoa["acessos"],
      situacao: "pendente",
    });
  }
  const ordem: Situacao[] = ["ativo", "pendente", "sem_acesso"];
  return pessoas.sort((a, b) => ordem.indexOf(a.situacao) - ordem.indexOf(b.situacao) || a.nome.localeCompare(b.nome));
}

function mensagemConvite(p: { nome: string; email: string }) {
  return (
    `Olá, ${p.nome}! Seu acesso ao Sistema de Gestão do grupo Pivotto foi liberado.\n\n` +
    `1. Entre em ${window.location.origin}/login\n` +
    `2. Clique em "Primeiro acesso? Criar conta"\n` +
    `3. Use este e-mail: ${p.email} e crie a sua senha.`
  );
}

export default function Acessos() {
  const usuario = useUsuario();
  const { estado, recarregar } = useEstado();
  const router = useRouter();
  const [pessoas, setPessoas] = useState<Pessoa[] | null>(null);
  const [editando, setEditando] = useState<string | null>(null); // e-mail, "novo" ou null
  const [form, setForm] = useState<Form>(formVazio);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [convite, setConvite] = useState<{ nome: string; email: string } | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const atualizarLista = useCallback(async () => {
    try {
      setPessoas(await carregarPessoas());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os acessos.");
    }
  }, []);

  useEffect(() => {
    if (!usuario.adminGrupo) router.replace("/");
    else void Promise.resolve().then(atualizarLista);
  }, [usuario, router, atualizarLista]);
  if (!usuario.adminGrupo) return null;

  const abrir = (p?: Pessoa) => {
    setEditando(p ? p.email : "novo");
    setForm(p ? { email: p.email, nome: p.nome, nomeCompleto: p.nomeCompleto, admin: p.admin, acessos: { ...p.acessos } } : formVazio);
    setErro(null);
    setConvite(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const proprio = editando === usuario.email;
  const semEmpresa = !form.admin && Object.keys(form.acessos).length === 0;

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const { error } = await supabaseNavegador().rpc("salvar_acesso", {
      p_email: form.email,
      p_nome: form.nome,
      p_nome_completo: form.nomeCompleto,
      p_admin: form.admin,
      p_acessos: form.acessos,
    });
    setSalvando(false);
    if (error) return setErro(error.message);
    const lista = await carregarPessoas();
    setPessoas(lista);
    const salva = lista.find((p) => p.email === form.email.trim().toLowerCase());
    setEditando(null);
    if (salva?.situacao === "pendente") setConvite({ nome: salva.nome, email: salva.email });
    await recarregar(); // atualiza a lista de consultores e o menu
  };

  const retirar = async () => {
    const p = pessoas?.find((x) => x.email === editando);
    if (!p || !confirm(`Retirar todo o acesso de ${p.nome}? A pessoa deixa de ver qualquer dado do sistema. O nome continua no histórico dos projetos.`))
      return;
    setSalvando(true);
    const { error } = await supabaseNavegador().rpc("retirar_acesso", { p_email: p.email });
    setSalvando(false);
    if (error) return setErro(error.message);
    setEditando(null);
    await atualizarLista();
    await recarregar();
  };

  const copiar = async (p: { nome: string; email: string }) => {
    await navigator.clipboard.writeText(mensagemConvite(p));
    setCopiado(p.email);
    setTimeout(() => setCopiado(null), 2500);
  };

  const definirPapel = (slug: EmpresaSlug, papel: string) =>
    setForm((f) => {
      const acessos = { ...f.acessos };
      if (papel) acessos[slug] = papel as Papel;
      else delete acessos[slug];
      return { ...f, acessos };
    });

  const nomeEmpresa = (slug: string) => estado.empresas.find((e) => e.slug === slug)?.nome ?? slug;

  return (
    <>
      <Cabecalho titulo="Acessos" subtitulo="Quem entra no sistema e o que cada pessoa vê.">
        {!editando && <Botao onClick={() => abrir()}>Liberar acesso</Botao>}
      </Cabecalho>

      {convite && (
        <Cartao className="mb-8 border-musgo/30 p-6">
          <p className="font-serif text-xl">Acesso liberado para {convite.nome}</p>
          <p className="mt-1 text-[15px] text-tinta-2">
            Falta a pessoa criar a conta com o e-mail {convite.email}. Copie a mensagem abaixo e envie por WhatsApp ou e-mail.
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-[var(--radius-campo)] bg-pedra p-4 font-sans text-sm text-tinta">{mensagemConvite(convite)}</pre>
          <div className="mt-4 flex gap-3">
            <Botao onClick={() => copiar(convite)}>{copiado === convite.email ? "Copiada" : "Copiar mensagem"}</Botao>
            <Botao variante="secundario" onClick={() => setConvite(null)}>
              Fechar
            </Botao>
          </div>
        </Cartao>
      )}

      {editando && (
        <Cartao className="mb-10 p-6 sm:p-8">
          <h2 className="font-serif text-2xl">{editando === "novo" ? "Liberar acesso" : `Acesso de ${form.nome}`}</h2>
          <form onSubmit={salvar} className="mt-6 space-y-8">
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Campo rotulo="E-mail" dica={editando === "novo" ? "O mesmo que a pessoa vai usar para criar a conta." : undefined} className="sm:col-span-2">
                <input
                  type="email"
                  required
                  disabled={editando !== "novo"}
                  className="campo disabled:opacity-60"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Campo>
              <Campo rotulo="Nome" dica="Como aparece no sistema. Ex.: Leonardo">
                <input required className="campo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </Campo>
              <Campo rotulo="Nome completo" dica="Sai na assinatura dos relatórios.">
                <input required className="campo" value={form.nomeCompleto} onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })} />
              </Campo>
            </div>

            <fieldset>
              <legend className="mb-3 font-serif text-lg">Empresas</legend>
              <ul className="divide-y divide-linha border-y border-linha">
                {estado.empresas.map((emp) => (
                  <li key={emp.slug} className="flex flex-wrap items-center justify-between gap-4 py-3">
                    <span>
                      <span className="block text-[15px]">{emp.nome}</span>
                      {emp.status !== "ativo" && <span className="block text-[13px] italic text-tinta-2">{statusEmpresa[emp.status].toLowerCase()}</span>}
                    </span>
                    <select
                      aria-label={`Acesso a ${emp.nome}`}
                      className="campo !w-48"
                      value={form.acessos[emp.slug] ?? ""}
                      onChange={(e) => definirPapel(emp.slug, e.target.value)}
                    >
                      <option value="">Sem acesso</option>
                      {(Object.keys(papelMembro) as Papel[]).map((p) => (
                        <option key={p} value={p}>
                          {papelMembro[p]}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] leading-relaxed text-tinta-2">
                Gestor, consultor e equipe veem e editam os clientes e projetos da empresa; só o gestor exclui. Quem tem acesso aparece na escolha do
                consultor responsável. Empresas em estruturação ou standby só ficam visíveis para o administrador.
              </p>
            </fieldset>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-garrafa)]"
                checked={form.admin}
                disabled={proprio}
                onChange={(e) => setForm({ ...form, admin: e.target.checked })}
              />
              <span>
                <span className="block text-[15px]">Administrador do grupo</span>
                <span className="block text-[13px] text-tinta-2">
                  Vê todas as empresas, o Painel e esta tela de acessos.{proprio && " Você não pode retirar o seu próprio."}
                </span>
              </span>
            </label>

            {erro && <p className="rounded-[var(--radius-campo)] bg-vinho-claro p-3 text-sm text-vinho">{erro}</p>}

            <div className="flex flex-wrap items-center gap-3 border-t border-linha pt-6">
              <Botao type="submit" disabled={salvando || semEmpresa}>
                {salvando ? "Salvando…" : editando === "novo" ? "Liberar acesso" : "Salvar alterações"}
              </Botao>
              <Botao type="button" variante="secundario" onClick={() => setEditando(null)}>
                Cancelar
              </Botao>
              {semEmpresa && <span className="text-sm text-tinta-2">Escolha ao menos uma empresa.</span>}
              {editando !== "novo" && !proprio && pessoas?.find((p) => p.email === editando)?.situacao !== "sem_acesso" && (
                <Botao type="button" variante="perigo" onClick={retirar} disabled={salvando} className="ml-auto">
                  Retirar acesso
                </Botao>
              )}
            </div>
          </form>
        </Cartao>
      )}

      {!editando && erro && <p className="mb-6 rounded-[var(--radius-campo)] bg-vinho-claro p-3 text-sm text-vinho">{erro}</p>}

      {pessoas === null ? (
        <p className="text-[15px] text-tinta-2">Carregando…</p>
      ) : (
        <ul className="divide-y divide-linha border-y border-linha">
          {pessoas.map((p) => (
            <li key={p.email} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-4">
              <div className="min-w-0">
                <p className="font-serif text-[18px] text-tinta">
                  {p.nomeCompleto}
                  {p.email === usuario.email && <span className="ml-2 font-sans text-[13px] text-tinta-2">você</span>}
                </p>
                <p className="mt-0.5 text-sm text-tinta-2">{p.email}</p>
                <p className="mt-1 text-sm text-tinta-2">
                  {[
                    p.admin && "Administrador do grupo",
                    ...Object.entries(p.acessos).map(([slug, papel]) => `${nomeEmpresa(slug)}: ${papelMembro[papel as Papel].toLowerCase()}`),
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Sem empresa"}
                </p>
              </div>
              <div className="flex items-center gap-5 text-sm">
                <Status tom={situacoes[p.situacao].tom}>{situacoes[p.situacao].rotulo}</Status>
                {p.situacao === "pendente" && (
                  <button onClick={() => copiar(p)} className="text-tinta-2 underline-offset-4 hover:text-garrafa hover:underline">
                    {copiado === p.email ? "Copiada" : "Copiar convite"}
                  </button>
                )}
                <Botao variante="fantasma" onClick={() => abrir(p)}>
                  {p.situacao === "sem_acesso" ? "Liberar de novo" : "Editar"}
                </Botao>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
