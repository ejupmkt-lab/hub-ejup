"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useAcesso, useEstado } from "@/lib/dados/store";
import type { Papel } from "@/lib/dados/tipos";
import { papelMembro } from "@/lib/rotulos";
import { traduzirErro } from "@/lib/erros";
import { Botao, Cabecalho, Campo, Cartao, Chip } from "@/components/ui";

type Linha = { email: string; nome: string; nomeCompleto: string; admin: boolean; acessos: Record<string, Papel>; situacao: "ativo" | "convidado" };
type Registro = { id: number; em: string; quem: string; acao: string; email: string; empresa: string | null; antes: Estado | null; depois: Estado | null };
type Estado = { admin: boolean; acessos: Record<string, string> };

const acoes: Record<string, string> = {
  salvar_acesso: "mudou os acessos de",
  retirar_acesso: "retirou todo o acesso de",
  incluir_na_equipe: "incluiu na equipe",
  retirar_da_empresa: "retirou de uma empresa",
};
const igual = (a: Pick<Linha, "admin" | "acessos">, b: Pick<Linha, "admin" | "acessos">) =>
  a.admin === b.admin && JSON.stringify(Object.entries(a.acessos).sort()) === JSON.stringify(Object.entries(b.acessos).sort());
const resumo = (e: Estado | null, nomes: Record<string, string>) =>
  !e ? "—" : [e.admin ? "administrador" : "", ...Object.entries(e.acessos).map(([k, v]) => `${nomes[k] ?? k}: ${papelMembro[v as Papel]?.toLowerCase() ?? v}`)].filter(Boolean).join("; ") || "sem acesso";

// Controle de acessos do grupo (só o administrador): todas as pessoas, em todas as empresas, com a função de cada uma.
// Mudar a função numa empresa não mexe nas outras; retirar todo o acesso pede para digitar o e-mail da pessoa.
export default function ControleDeAcessos() {
  const { usuario } = useAcesso();
  const { estado, recarregar } = useEstado();
  const router = useRouter();
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [edicao, setEdicao] = useState<Record<string, Pick<Linha, "admin" | "acessos">>>({});
  const [registro, setRegistro] = useState<Registro[]>([]);
  const [aviso, setAviso] = useState<{ tom: "ok" | "erro"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [retirando, setRetirando] = useState<string | null>(null);
  const [digitado, setDigitado] = useState("");
  const [novo, setNovo] = useState<{ email: string; nome: string; nomeCompleto: string; acessos: Record<string, Papel> } | null>(null);
  const empresas = estado.empresas;
  const nomes = useMemo(() => Object.fromEntries(empresas.map((e) => [e.slug, e.nome])), [empresas]);

  useEffect(() => {
    if (!usuario.adminGrupo) router.replace("/");
  }, [usuario.adminGrupo, router]);

  const carregar = useCallback(async () => {
    const sb = supabaseNavegador();
    const [p, m, c, l] = await Promise.all([
      sb.from("perfis").select("id, email, nome, nome_completo, admin_grupo"),
      sb.from("membros").select("user_id, empresa, papel"),
      sb.from("convites").select("email, nome, nome_completo, admin_grupo, acessos"),
      sb.from("acessos_log").select("id, em, quem, acao, email, empresa, antes, depois").order("id", { ascending: false }).limit(25),
    ]);
    const erro = p.error ?? m.error ?? c.error;
    if (erro) return setAviso({ tom: "erro", texto: traduzirErro(erro) });
    const porPerfil = new Map<string, Linha>();
    for (const x of p.data ?? []) porPerfil.set(x.id, { email: x.email, nome: x.nome, nomeCompleto: x.nome_completo, admin: x.admin_grupo, acessos: {}, situacao: "ativo" });
    for (const x of m.data ?? []) {
      const l1 = porPerfil.get(x.user_id);
      if (l1) l1.acessos[x.empresa] = x.papel as Papel;
    }
    const lista = [...porPerfil.values()];
    for (const x of c.data ?? []) {
      if (!lista.some((l1) => l1.email === x.email))
        lista.push({ email: x.email, nome: x.nome, nomeCompleto: x.nome_completo, admin: x.admin_grupo, acessos: (x.acessos ?? {}) as Record<string, Papel>, situacao: "convidado" });
    }
    setLinhas(lista.sort((a, b) => Number(b.admin) - Number(a.admin) || a.nome.localeCompare(b.nome)));
    setEdicao({});
    setRegistro((l.data ?? []) as unknown as Registro[]);
  }, []);
  useEffect(() => {
    if (usuario.adminGrupo) void Promise.resolve().then(carregar);
  }, [usuario.adminGrupo, carregar]);

  if (!usuario.adminGrupo) return null;

  const atual = (l: Linha) => edicao[l.email] ?? { admin: l.admin, acessos: l.acessos };
  const mudou = (l: Linha) => !igual(atual(l), { admin: l.admin, acessos: l.acessos });
  const mudarPapel = (l: Linha, slug: string, papel: Papel | "") => {
    const a = atual(l);
    const acessos = { ...a.acessos };
    if (papel) acessos[slug] = papel;
    else delete acessos[slug];
    setEdicao({ ...edicao, [l.email]: { ...a, acessos } });
  };
  const rodar = async (chave: string, chamada: PromiseLike<{ error: unknown }>, texto: string) => {
    setOcupado(chave);
    setAviso(null);
    const { error } = await chamada;
    setOcupado(null);
    if (error) return setAviso({ tom: "erro", texto: traduzirErro(error) });
    setAviso({ tom: "ok", texto });
    await carregar();
    await recarregar();
  };
  const salvar = (l: Linha) => {
    const a = atual(l);
    return rodar(l.email, supabaseNavegador().rpc("salvar_acesso", { p_email: l.email, p_nome: l.nome, p_nome_completo: l.nomeCompleto, p_admin: a.admin, p_acessos: a.acessos }), `Acessos de ${l.nome} atualizados.`);
  };
  const retirarTudo = async (l: Linha) => {
    await rodar(l.email, supabaseNavegador().rpc("retirar_acesso", { p_email: l.email }), `${l.nome} não tem mais acesso ao Blimp.`);
    setRetirando(null);
    setDigitado("");
  };
  const incluir = async () => {
    if (!novo) return;
    await rodar("novo", supabaseNavegador().rpc("salvar_acesso", { p_email: novo.email, p_nome: novo.nome, p_nome_completo: novo.nomeCompleto, p_admin: false, p_acessos: novo.acessos }), `${novo.nome} autorizado. Peça para criar a conta em ${window.location.origin}/login com o e-mail ${novo.email}.`);
    setNovo(null);
  };
  const seletor = (valor: Papel | "", aoMudar: (p: Papel | "") => void, rotulo: string) => (
    <select aria-label={rotulo} className="campo !py-2 !text-sm" value={valor} onChange={(e) => aoMudar(e.target.value as Papel | "")}>
      <option value="">Sem acesso</option>
      {(Object.keys(papelMembro) as Papel[]).map((p) => (
        <option key={p} value={p}>
          {papelMembro[p]}
        </option>
      ))}
    </select>
  );

  return (
    <>
      <Cabecalho titulo="Controle de acessos" subtitulo="Quem entra no Blimp, em qual empresa e com qual função. Só você, como administrador do grupo, vê e muda isto.">
        {!novo && (
          <Botao onClick={() => setNovo({ email: "", nome: "", nomeCompleto: "", acessos: {} })} className="w-full sm:w-auto">
            Autorizar pessoa
          </Botao>
        )}
      </Cabecalho>

      {aviso && (
        <p role="status" className={`mb-4 rounded-[var(--radius-campo)] px-4 py-3 text-sm ${aviso.tom === "ok" ? "bg-verde-claro text-verde" : "bg-vermelho-claro text-vermelho"}`}>
          {aviso.texto}
        </p>
      )}

      {novo && (
        <Cartao className="mb-6 p-4 sm:p-6">
          <h2 className="text-lg font-bold">Autorizar pessoa</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void incluir();
            }}
            className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2"
          >
            <Campo rotulo="E-mail" className="sm:col-span-2">
              <input type="email" required className="campo" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
            </Campo>
            <Campo rotulo="Nome (como aparece no sistema)">
              <input required className="campo" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
            </Campo>
            <Campo rotulo="Nome completo (assina os relatórios)">
              <input required className="campo" value={novo.nomeCompleto} onChange={(e) => setNovo({ ...novo, nomeCompleto: e.target.value })} />
            </Campo>
            {empresas.map((e) => (
              <Campo key={e.slug} rotulo={`Função na ${e.nome}`}>
                {seletor(novo.acessos[e.slug] ?? "", (p) => {
                  const acessos = { ...novo.acessos };
                  if (p) acessos[e.slug] = p;
                  else delete acessos[e.slug];
                  setNovo({ ...novo, acessos });
                }, `Função de ${novo.nome || "a pessoa"} na ${e.nome} (nova pessoa)`)}
              </Campo>
            ))}
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <Botao type="submit" disabled={ocupado === "novo"}>
                {ocupado === "novo" ? "Salvando…" : "Autorizar"}
              </Botao>
              <Botao type="button" variante="secundario" onClick={() => setNovo(null)}>
                Cancelar
              </Botao>
            </div>
          </form>
        </Cartao>
      )}

      {linhas === null ? (
        <p className="text-sm text-tinta-2">Carregando…</p>
      ) : (
        <Cartao className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-[14px]" aria-label="Acessos por pessoa e empresa">
            <thead className="bg-pedra/60 text-left text-[13px] font-semibold text-tinta-2">
              <tr className="border-b border-linha">
                <th scope="col" className="px-4 py-2.5">Pessoa</th>
                {empresas.map((e) => (
                  <th key={e.slug} scope="col" className="px-3 py-2.5">{e.nome}</th>
                ))}
                <th scope="col" className="px-3 py-2.5">Administrador</th>
                <th scope="col" className="px-4 py-2.5"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {linhas.map((l) => {
                const a = atual(l);
                const eu = l.email === usuario.email;
                return (
                  <tr key={l.email} aria-label={l.email} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-tinta">
                        {l.nome}
                        {eu && <span className="font-normal text-tinta-2"> (você)</span>}
                      </p>
                      <p className="break-all text-[13px] text-tinta-2">{l.email}</p>
                      {l.situacao === "convidado" && <Chip tom="atencao">Aguardando criar a conta</Chip>}
                    </td>
                    {empresas.map((e) => (
                      <td key={e.slug} className="px-3 py-3">
                        {seletor(a.admin ? (a.acessos[e.slug] ?? "") : (a.acessos[e.slug] ?? ""), (p) => mudarPapel(l, e.slug, p), `Função de ${l.nome} na ${e.nome}`)}
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-azul"
                          checked={a.admin}
                          disabled={eu}
                          aria-label={`${l.nome} é administrador do grupo`}
                          onChange={(ev) => setEdicao({ ...edicao, [l.email]: { ...a, admin: ev.target.checked } })}
                        />
                        <span className="text-[13px] text-tinta-2">{a.admin ? "Vê tudo" : "Não"}</span>
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-2">
                        {mudou(l) && (
                          <div className="flex gap-2">
                            <Botao tamanho="pequeno" onClick={() => void salvar(l)} disabled={ocupado === l.email}>
                              {ocupado === l.email ? "Salvando…" : `Salvar ${l.nome}`}
                            </Botao>
                            <Botao tamanho="pequeno" variante="secundario" onClick={() => setEdicao(Object.fromEntries(Object.entries(edicao).filter(([k]) => k !== l.email)))}>
                              Desfazer
                            </Botao>
                          </div>
                        )}
                        {!eu && retirando !== l.email && (
                          <Botao tamanho="pequeno" variante="fantasma" className="!text-vermelho" onClick={() => (setRetirando(l.email), setDigitado(""))}>
                            Retirar de todas as empresas
                          </Botao>
                        )}
                        {retirando === l.email && (
                          <div className="w-60 space-y-2 rounded-[var(--radius-campo)] border border-vermelho/30 bg-vermelho-claro p-3 text-left">
                            <p className="text-[13px] text-vermelho">Tira {l.nome} de todas as empresas. Para confirmar, digite o e-mail dela.</p>
                            <input aria-label={`Digite ${l.email} para confirmar`} className="campo !py-2 !text-sm" value={digitado} onChange={(ev) => setDigitado(ev.target.value)} />
                            <div className="flex gap-2">
                              <Botao tamanho="pequeno" disabled={digitado.trim().toLowerCase() !== l.email || ocupado === l.email} onClick={() => void retirarTudo(l)}>
                                Confirmar retirada
                              </Botao>
                              <Botao tamanho="pequeno" variante="secundario" onClick={() => setRetirando(null)}>
                                Cancelar
                              </Botao>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Cartao>
      )}

      <section aria-label="Alterações recentes" className="mt-8">
        <h2 className="mb-3 text-[17px] font-bold">Alterações recentes</h2>
        {registro.length === 0 ? (
          <p className="text-sm text-tinta-2">Nenhuma alteração registrada ainda.</p>
        ) : (
          <Cartao>
            <ul className="divide-y divide-linha text-[14px]">
              {registro.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <p className="text-tinta">
                    <span className="font-semibold">{r.quem}</span> {acoes[r.acao] ?? r.acao} <span className="font-semibold">{r.email}</span>
                    {r.empresa ? ` (${nomes[r.empresa] ?? r.empresa})` : ""}
                  </p>
                  <p className="text-[13px] text-tinta-2">
                    {new Date(r.em).toLocaleString("pt-BR")} · antes: {resumo(r.antes, nomes)} · depois: {resumo(r.depois, nomes)}
                  </p>
                </li>
              ))}
            </ul>
          </Cartao>
        )}
      </section>
    </>
  );
}
