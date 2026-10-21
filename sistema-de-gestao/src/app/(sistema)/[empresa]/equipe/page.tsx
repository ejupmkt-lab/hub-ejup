"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useAcesso, useEstado } from "@/lib/dados/store";
import type { EmpresaSlug, Papel } from "@/lib/dados/tipos";
import { papelMembro, statusEmpresa } from "@/lib/rotulos";
import { traduzirErro } from "@/lib/erros";
import { Botao, Cabecalho, Campo, Cartao, Chip, Vazio } from "@/components/ui";
import { IconeConta, IconeMaisSinal } from "@/components/icones";

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

  const carregar = useCallback(async () => {
    const { data, error } = await supabaseNavegador().rpc("equipe_da_empresa", { p_empresa: slug });
    if (error) return setAviso({ tom: "erro", texto: traduzirErro(error) });
    const ordem: Papel[] = ["gestor", "consultor", "equipe"];
    setLista(((data ?? []) as Membro[]).sort((a, b) => ordem.indexOf(a.papel) - ordem.indexOf(b.papel) || a.nome.localeCompare(b.nome)));
  }, [slug]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const salvar = async (m: Form, novo: boolean) => {
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
    if (novo) {
      setForm(null);
      try {
        await navigator.clipboard.writeText(mensagemConvite(m, empresa.nome));
        setAviso({ tom: "ok", texto: `${m.nome} incluído na equipe. A mensagem de convite foi copiada: é só colar no WhatsApp ou no e-mail.` });
      } catch {
        setAviso({ tom: "ok", texto: `${m.nome} incluído na equipe. Peça para entrar em ${window.location.origin}/login e criar a conta com ${m.email}.` });
      }
    } else setAviso({ tom: "ok", texto: `Função de ${m.nome} alterada para ${papelMembro[m.papel].toLowerCase()}.` });
    await carregar();
    await recarregar(); // a lista de consultores dos projetos muda
  };

  const retirar = async (m: Membro) => {
    if (!confirm(`Retirar ${m.nome} da ${empresa.nome}? O acesso às outras empresas continua.`)) return;
    setOcupado(true);
    const { error } = await supabaseNavegador().rpc("retirar_membro", { p_empresa: slug, p_email: m.email });
    setOcupado(false);
    if (error) return setAviso({ tom: "erro", texto: traduzirErro(error) });
    setAviso({ tom: "ok", texto: `${m.nome} não tem mais acesso à ${empresa.nome}.` });
    await carregar();
    await recarregar();
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
        subtitulo={`Quem trabalha na ${empresa.nome} e com qual função. Cada empresa tem a sua equipe.`}
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
              void salvar(form, true);
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
                        {podeGerir && !eu && m.membro ? (
                          <>
                            <label className="min-w-0 flex-1 sm:flex-none">
                              <span className="sr-only">Função de {m.nome}</span>
                              <select
                                className="campo !py-2 sm:!w-40"
                                value={m.papel}
                                disabled={ocupado}
                                onChange={(e) =>
                                  void salvar({ email: m.email, nome: m.nome, nomeCompleto: m.nome_completo, papel: e.target.value as Papel }, false)
                                }
                              >
                                {(Object.keys(funcoes) as Papel[]).map((p) => (
                                  <option key={p} value={p}>
                                    {papelMembro[p]}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <Botao variante="fantasma" tamanho="pequeno" onClick={() => void retirar(m)} disabled={ocupado} className="hover:!text-vermelho">
                              Retirar
                            </Botao>
                          </>
                        ) : (
                          !m.membro ? null : <Chip tom="neutro">{papelMembro[m.papel]}</Chip>
                        )}
                      </div>
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
