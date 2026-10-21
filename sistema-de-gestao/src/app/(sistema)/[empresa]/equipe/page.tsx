"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useAcesso, useEstado } from "@/lib/dados/store";
import type { Empresa, EmpresaSlug, Papel } from "@/lib/dados/tipos";
import { papelMembro, statusEmpresa } from "@/lib/rotulos";
import { traduzirErro } from "@/lib/erros";
import { Botao, Cabecalho, Campo, Cartao, Chip, Vazio } from "@/components/ui";
import { IconeAcessos, IconeConta, IconeMaisSinal } from "@/components/icones";

type Membro = { email: string; nome: string; nome_completo: string; papel: Papel; situacao: "ativo" | "convidado"; admin_grupo: boolean; membro: boolean };
type Form = { email: string; nome: string; nomeCompleto: string; papel: Papel };
const formVazio: Form = { email: "", nome: "", nomeCompleto: "", papel: "consultor" };

// O que cada função faz na empresa
const funcoes: Record<Papel, string> = {
  gestor: "Tudo na empresa: projetos, clientes, serviços, equipe e exclusões.",
  consultor: "Projetos, clientes e relatórios; pode ser o consultor responsável por um projeto.",
  equipe: "Apoio nos projetos e clientes, sem excluir nada nem mexer em serviços e equipe.",
};

function mensagemConvite(m: { nome: string; email: string }, empresa: string) {
  return (
    `Olá, ${m.nome}! Seu acesso à ${empresa} no Blimp, o sistema de gestão de projetos, foi liberado.\n\n` +
    `1. Entre em ${window.location.origin}/login\n` +
    `2. Clique em "Primeiro acesso? Criar conta"\n` +
    `3. Use este e-mail: ${m.email} e crie a sua senha.`
  );
}

// Equipe da empresa: quem trabalha nela e com qual função. O gestor da empresa
// inclui pessoas, muda funções e retira acessos, só nesta empresa.
export default function Equipe() {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { estado, recarregar } = useEstado();
  const { gerencia, usuario } = useAcesso();
  const empresa = estado.empresas.find((e) => e.slug === slug)!;
  const podeGerir = gerencia(slug);
  const [lista, setLista] = useState<Membro[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const [abertoEm, setAbertoEm] = useState<string | null>(null); // e-mail de quem está com os acessos abertos
  // O gestor cuida de quem é da empresa; o administrador, de todos. Ninguém mexe no próprio acesso.
  const podeEditar = (m: Membro) => m.email !== usuario.email && (usuario.adminGrupo || (podeGerir && m.membro && !m.admin_grupo));

  const carregar = useCallback(async () => {
    const { data, error } = await supabaseNavegador().rpc("equipe_da_empresa", { p_empresa: slug });
    if (error) return setAviso({ tom: "erro", texto: traduzirErro(error) });
    const ordem: Papel[] = ["gestor", "consultor", "equipe"];
    setLista(((data ?? []) as Membro[]).sort((a, b) => ordem.indexOf(a.papel) - ordem.indexOf(b.papel) || a.nome.localeCompare(b.nome)));
  }, [slug]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const incluir = async (m: Form) => {
    setOcupado(true);
    setAviso(null);
    const { error } = await supabaseNavegador().rpc("salvar_membro", {
      p_empresa: slug,
      p_email: m.email,
      p_nome: m.nome,
      p_nome_completo: m.nomeCompleto,
      p_papel: m.papel,
    });
    setOcupado(false);
    if (error) return setAviso({ tom: "erro", texto: traduzirErro(error) });
    setForm(null);
    try {
      await navigator.clipboard.writeText(mensagemConvite(m, empresa.nome));
      setAviso({ tom: "ok", texto: `${m.nome} incluído na equipe. A mensagem de convite foi copiada: é só colar no WhatsApp ou no e-mail.` });
    } catch {
      setAviso({ tom: "ok", texto: `${m.nome} incluído na equipe. Peça para entrar em ${window.location.origin}/login e criar a conta com ${m.email}.` });
    }
    await carregar();
    await recarregar(); // a lista de consultores dos projetos muda
  };

  const mudarSituacao = async (status: string) => {
    const { error } = await supabaseNavegador().rpc("definir_situacao_empresa", { p_empresa: slug, p_status: status });
    if (error) return setAviso({ tom: "erro", texto: traduzirErro(error) });
    await recarregar();
  };

  return (
    <>
      <Cabecalho
        migalhas={[{ rotulo: empresa.nome, href: `/${slug}` }, { rotulo: "Equipe" }]}
        titulo="Equipe"
        subtitulo={`Quem trabalha na ${empresa.nome}, com qual função e o que cada pessoa acessa.`}
      >
        {podeGerir && !form && (
          <Botao onClick={() => setForm(formVazio)} className="w-full sm:w-auto">
            <IconeMaisSinal className="h-4 w-4" />
            Incluir pessoa
          </Botao>
        )}
      </Cabecalho>

      {aviso && (
        <p
          role="status"
          className={`mb-4 rounded-[var(--radius-campo)] px-4 py-3 text-sm ${aviso.tom === "ok" ? "bg-verde-claro text-verde" : "bg-vermelho-claro text-vermelho"}`}
        >
          {aviso.texto}
        </p>
      )}

      {form && (
        <Cartao className="mb-6 p-4 sm:p-6">
          <h2 className="text-lg font-bold">Incluir pessoa na {empresa.nome}</h2>
          <p className="mt-1 text-sm text-tinta-2">
            Se a pessoa já usa o Blimp em outra empresa, ela passa a ver esta na hora. Se não, recebe o convite para criar a conta com este e-mail.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void incluir(form);
            }}
            className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2"
          >
            <Campo rotulo="E-mail" className="sm:col-span-2">
              <input type="email" required className="campo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Campo>
            <Campo rotulo="Nome (como aparece no sistema)">
              <input required className="campo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Campo>
            <Campo rotulo="Nome completo (assina os relatórios)">
              <input required className="campo" value={form.nomeCompleto} onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })} />
            </Campo>
            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 text-[13px] font-semibold text-tinta">Função</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(funcoes) as Papel[]).map((p) => (
                  <label
                    key={p}
                    className={`cursor-pointer rounded-[var(--radius-campo)] border p-3 ${form.papel === p ? "border-azul bg-azul-claro" : "border-linha hover:border-azul/40"}`}
                  >
                    <span className="flex items-center gap-2 text-[15px] font-semibold text-tinta">
                      <input type="radio" name="papel" className="accent-azul" checked={form.papel === p} onChange={() => setForm({ ...form, papel: p })} />
                      {papelMembro[p]}
                    </span>
                    <span className="mt-1 block text-[13px] text-tinta-2">{funcoes[p]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <Botao type="submit" disabled={ocupado}>
                {ocupado ? "Salvando…" : "Incluir e copiar o convite"}
              </Botao>
              <Botao type="button" variante="secundario" onClick={() => setForm(null)}>
                Cancelar
              </Botao>
            </div>
          </form>
        </Cartao>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          {lista === null ? (
            <p className="text-sm text-tinta-2">Carregando a equipe…</p>
          ) : lista.length === 0 ? (
            <Vazio titulo="Ninguém na equipe ainda">Inclua as pessoas que trabalham nesta empresa e escolha a função de cada uma.</Vazio>
          ) : (
            <Cartao className="overflow-hidden">
              <ul className="divide-y divide-linha">
                {lista.map((m) => {
                  const eu = m.email === usuario.email;
                  return (
                    <li key={m.email} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-azul-claro text-azul">
                        <IconeConta className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1 basis-48">
                        <p className="break-words font-semibold text-tinta">
                          {m.nome}
                          {eu && <span className="font-normal text-tinta-2"> (você)</span>}
                        </p>
                        <p className="break-words text-[13px] text-tinta-2">{m.nome_completo}</p>
                        <p className="break-all text-[13px] text-tinta-2">{m.email}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {m.situacao === "convidado" && <Chip tom="atencao">Aguardando criar a conta</Chip>}
                          {m.admin_grupo && <Chip tom="neutro">Administrador do grupo</Chip>}
                        </div>
                      </div>
                      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                        {m.membro && <Chip tom="neutro">{papelMembro[m.papel]}</Chip>}
                        {podeEditar(m) && (
                          <Botao
                            variante="secundario"
                            tamanho="pequeno"
                            aria-expanded={abertoEm === m.email}
                            onClick={() => setAbertoEm(abertoEm === m.email ? null : m.email)}
                            className="ml-auto sm:ml-0"
                          >
                            <IconeAcessos className="h-4 w-4" />
                            Acessos
                          </Botao>
                        )}
                      </div>
                      {abertoEm === m.email && (
                        <EditorAcessos
                          key={m.email}
                          membro={m}
                          empresa={empresa}
                          outras={estado.empresas.filter((e) => e.slug !== slug)}
                          admin={usuario.adminGrupo}
                          aoFechar={() => setAbertoEm(null)}
                          aoSalvar={async (texto) => {
                            setAbertoEm(null);
                            setAviso({ tom: "ok", texto });
                            await carregar();
                            await recarregar(); // a lista de consultores e o menu mudam
                          }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </Cartao>
          )}
        </div>
        <aside className="min-w-0 space-y-4">
          <Cartao className="p-4 sm:p-5">
            <h2 className="text-[17px] font-bold">Funções</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {(Object.keys(funcoes) as Papel[]).map((p) => (
                <div key={p}>
                  <dt className="font-semibold text-tinta">{papelMembro[p]}</dt>
                  <dd className="text-tinta-2">{funcoes[p]}</dd>
                </div>
              ))}
            </dl>
          </Cartao>
          {usuario.adminGrupo && (
            <Cartao className="p-4 sm:p-5">
              <Campo rotulo="Situação da empresa" dica="Fora de “Ativo”, só o administrador do grupo vê a empresa.">
                <select className="campo" value={empresa.status} onChange={(e) => void mudarSituacao(e.target.value)}>
                  {(Object.keys(statusEmpresa) as (keyof typeof statusEmpresa)[]).map((s) => (
                    <option key={s} value={s}>
                      {statusEmpresa[s]}
                    </option>
                  ))}
                </select>
              </Campo>
            </Cartao>
          )}
        </aside>
      </div>
    </>
  );
}

// Acessos de uma pessoa, abertos na própria linha da equipe. O gestor muda a
// função nesta empresa ou retira a pessoa dela; o administrador do grupo vê
// também as outras empresas e o acesso de administrador.
function EditorAcessos({
  membro,
  empresa,
  outras,
  admin,
  aoFechar,
  aoSalvar,
}: {
  membro: Membro;
  empresa: Empresa;
  outras: Empresa[];
  admin: boolean;
  aoFechar: () => void;
  aoSalvar: (aviso: string) => Promise<void>;
}) {
  const [papel, setPapel] = useState<Papel | "">(membro.membro ? membro.papel : "");
  // Só o administrador vê e muda o acesso às outras empresas (carregado ao abrir)
  const [demais, setDemais] = useState<Partial<Record<EmpresaSlug, Papel>> | null>(admin ? null : {});
  const [adminGrupo, setAdminGrupo] = useState(membro.admin_grupo);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!admin) return;
    void (async () => {
      const sb = supabaseNavegador();
      const { data: perfil } = await sb.from("perfis").select("id").eq("email", membro.email).maybeSingle();
      let acessos: Record<string, string> = {};
      if (perfil) {
        const { data, error } = await sb.from("membros").select("empresa, papel").eq("user_id", perfil.id);
        if (error) return setErro(traduzirErro(error));
        acessos = Object.fromEntries((data ?? []).map((x) => [x.empresa, x.papel]));
      } else {
        const { data, error } = await sb.from("convites").select("acessos").eq("email", membro.email).maybeSingle();
        if (error) return setErro(traduzirErro(error));
        acessos = (data?.acessos ?? {}) as Record<string, string>;
      }
      delete acessos[empresa.slug];
      setDemais(acessos as Partial<Record<EmpresaSlug, Papel>>);
    })();
  }, [admin, membro.email, empresa.slug]);

  const rodar = async (chamada: PromiseLike<{ error: unknown }>, aviso: string) => {
    setOcupado(true);
    setErro(null);
    const { error } = await chamada;
    setOcupado(false);
    if (error) return setErro(traduzirErro(error));
    await aoSalvar(aviso);
  };

  const sb = supabaseNavegador();
  const salvar = async () => {
    if (admin) {
      const acessos = { ...demais, ...(papel ? { [empresa.slug]: papel } : {}) };
      return rodar(
        sb.rpc("salvar_acesso", { p_email: membro.email, p_nome: membro.nome, p_nome_completo: membro.nome_completo, p_admin: adminGrupo, p_acessos: acessos }),
        `Acessos de ${membro.nome} atualizados.`,
      );
    }
    if (!papel) return retirarDaEmpresa();
    return rodar(
      sb.rpc("salvar_membro", { p_empresa: empresa.slug, p_email: membro.email, p_nome: membro.nome, p_nome_completo: membro.nome_completo, p_papel: papel }),
      `Função de ${membro.nome} na ${empresa.nome}: ${papelMembro[papel].toLowerCase()}.`,
    );
  };
  const retirarDaEmpresa = () => {
    if (!confirm(`Retirar ${membro.nome} da ${empresa.nome}? O acesso às outras empresas continua.`)) return;
    return rodar(sb.rpc("retirar_membro", { p_empresa: empresa.slug, p_email: membro.email }), `${membro.nome} não tem mais acesso à ${empresa.nome}.`);
  };
  const retirarTudo = () => {
    if (!confirm(`Retirar todo o acesso de ${membro.nome}? A pessoa deixa de ver qualquer empresa. O nome continua no histórico dos projetos.`)) return;
    return rodar(sb.rpc("retirar_acesso", { p_email: membro.email }), `${membro.nome} não tem mais acesso ao Blimp.`);
  };
  const copiarConvite = async () => {
    try {
      await navigator.clipboard.writeText(mensagemConvite(membro, empresa.nome));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro(`Não foi possível copiar. Peça para entrar em ${window.location.origin}/login e criar a conta com ${membro.email}.`);
    }
  };

  const opcoes: (Papel | "")[] = [...(Object.keys(funcoes) as Papel[]), ""];
  return (
    <section aria-label={`Acessos de ${membro.nome}`} className="w-full rounded-[var(--radius-bloco)] border border-linha bg-pedra/60 p-4 sm:p-5">
      <fieldset>
        <legend className="mb-2 text-[15px] font-semibold text-tinta">Na {empresa.nome}</legend>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {opcoes.map((p) => (
            <label
              key={p || "nenhum"}
              className={`cursor-pointer rounded-[var(--radius-campo)] border bg-folha p-3 ${papel === p ? "border-azul ring-2 ring-azul/15" : "border-linha hover:border-azul/40"}`}
            >
              <span className="flex items-center gap-2 text-[15px] font-semibold text-tinta">
                <input type="radio" name={`papel-${membro.email}`} className="accent-azul" checked={papel === p} onChange={() => setPapel(p)} />
                {p ? papelMembro[p] : "Sem acesso"}
              </span>
              <span className="mt-1 block text-[13px] text-tinta-2">{p ? funcoes[p] : "Não vê nada desta empresa."}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {admin && (
        <fieldset className="mt-5">
          <legend className="mb-2 text-[15px] font-semibold text-tinta">Outras empresas</legend>
          {demais === null ? (
            <p className="text-sm text-tinta-2">Carregando…</p>
          ) : (
            <ul className="divide-y divide-linha rounded-[var(--radius-campo)] border border-linha bg-folha">
              {outras.map((e) => (
                <li key={e.slug} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-[15px] text-tinta">{e.nome}</span>
                    {e.status !== "ativo" && <span className="block text-[13px] text-tinta-2">{statusEmpresa[e.status].toLowerCase()}</span>}
                  </span>
                  <select
                    aria-label={`Acesso de ${membro.nome} à ${e.nome}`}
                    className="campo !w-full !py-2 sm:!w-44"
                    value={demais[e.slug] ?? ""}
                    onChange={(ev) => {
                      const novo = { ...demais };
                      if (ev.target.value) novo[e.slug] = ev.target.value as Papel;
                      else delete novo[e.slug];
                      setDemais(novo);
                    }}
                  >
                    <option value="">Sem acesso</option>
                    {(Object.keys(funcoes) as Papel[]).map((p) => (
                      <option key={p} value={p}>
                        {papelMembro[p]}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
          <label className="mt-4 flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-azul" checked={adminGrupo} onChange={(e) => setAdminGrupo(e.target.checked)} />
            <span>
              <span className="block text-[15px] font-semibold text-tinta">Administrador do grupo</span>
              <span className="block text-[13px] text-tinta-2">Vê e cuida de todas as empresas, inclusive das que ainda não estão ativas.</span>
            </span>
          </label>
        </fieldset>
      )}

      {erro && <p className="mt-4 rounded-[var(--radius-campo)] bg-vermelho-claro p-3 text-sm text-vermelho">{erro}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Botao onClick={() => void salvar()} disabled={ocupado || demais === null}>
          {ocupado ? "Salvando…" : "Salvar acessos"}
        </Botao>
        <Botao variante="secundario" onClick={aoFechar}>
          Cancelar
        </Botao>
        {membro.situacao === "convidado" && (
          <Botao variante="fantasma" onClick={() => void copiarConvite()}>
            {copiado ? "Convite copiado" : "Copiar convite"}
          </Botao>
        )}
        {admin && (
          <Botao variante="fantasma" onClick={() => void retirarTudo()} disabled={ocupado} className="!text-vermelho sm:ml-auto">
            Retirar todo o acesso
          </Botao>
        )}
      </div>
    </section>
  );
}
