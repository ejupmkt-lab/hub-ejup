"use client";

import { traduzirErro } from "@/lib/erros";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { novoId, useAcesso, useEstado } from "@/lib/dados/store";
import type { Cliente, EmpresaSlug } from "@/lib/dados/tipos";
import { camposCliente, gruposCliente, nomeDoCliente } from "@/lib/campos-cliente";
import { formatarCnpj, tempoDeAtividade, type DadosCnpj } from "@/lib/cnpj";
import Link from "next/link";
import { servicoDoProjeto } from "@/lib/projeto";
import { Botao, Cabecalho, Campo, Cartao, Chip, Vazio } from "@/components/ui";

const vazio = Object.fromEntries(camposCliente.map((c) => [c.chave, ""])) as Record<string, string>;

// Campos que vêm da Receita Federal (os de contato só entram se estiverem em branco)
function dadosParaFormulario(d: DadosCnpj): Record<string, string> {
  const admin = d.socios.find((s) => /administrador/i.test(s.qualificacao)) ?? d.socios[0];
  return {
    razaoSocial: d.razaoSocial,
    nomeFantasia: d.nomeFantasia,
    endereco: d.endereco,
    cep: d.cep,
    cidadeUf: d.cidadeUf,
    porte: d.porte,
    ramo: d.ramo,
    tempoAtividade: tempoDeAtividade(d.dataAbertura),
    email: d.email,
    telefone: d.telefone,
    responsavel: admin?.nome ?? "",
    cargoResponsavel: admin?.qualificacao ?? "",
  };
}
const soSeVazio = new Set(["email", "telefone", "responsavel", "cargoResponsavel"]);

function Conteudo() {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const busca_ = useSearchParams();
  const router = useRouter();
  const { estado, atualizar, excluir } = useEstado();
  const { gerencia } = useAcesso();
  const empresa = estado.empresas.find((e) => e.slug === slug)!;
  const clientes = estado.clientes.filter((c) => c.empresa === slug);
  const [editando, setEditando] = useState<string | null>(null); // id, "novo" ou null
  const [form, setForm] = useState<Record<string, string>>(vazio);
  const [busca, setBusca] = useState("");
  const [consulta, setConsulta] = useState<{ estado: "buscando" | "ok" | "erro"; texto: string } | null>(null);
  const ultimoCnpj = useRef("");
  const voltarParaProjeto = busca_.get("voltar") === "novo-projeto";
  // Veio de um projeto ("Dados do cliente"): salvar ou cancelar volta para ele
  const projetoDeOrigem = busca_.get("voltar")?.startsWith("prj-") ? busca_.get("voltar") : null;

  const abrir = (c?: Cliente) => {
    setEditando(c ? c.id : "novo");
    setForm(c ? { ...vazio, ...(c as unknown as Record<string, string>) } : vazio);
    setConsulta(null);
    ultimoCnpj.current = c?.cnpj.replace(/\D/g, "") ?? "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Abre direto pelo endereço: ?editar=<id> ou ?novo=1
  const abriuPeloEndereco = useRef(false);
  useEffect(() => {
    if (abriuPeloEndereco.current) return;
    abriuPeloEndereco.current = true;
    const id = busca_.get("editar");
    const c = id ? clientes.find((x) => x.id === id) : undefined;
    if (c || busca_.get("novo")) queueMicrotask(() => abrir(c));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consultarCnpj = async (cnpj: string, sobrescrever: boolean) => {
    const digitos = cnpj.replace(/\D/g, "");
    if (digitos.length !== 14) return;
    ultimoCnpj.current = digitos;
    setConsulta({ estado: "buscando", texto: "Consultando a Receita Federal…" });
    try {
      const r = await fetch(`/api/cnpj/${digitos}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      const novos = dadosParaFormulario(d as DadosCnpj);
      setForm((f) => {
        const out = { ...f };
        for (const [k, v] of Object.entries(novos)) {
          if (!v) continue;
          if (sobrescrever ? !soSeVazio.has(k) || !f[k]?.trim() : !f[k]?.trim()) out[k] = v;
        }
        return out;
      });
      setConsulta({ estado: "ok", texto: "Dados preenchidos a partir da Receita Federal. Confira e ajuste o que precisar." });
    } catch (e) {
      setConsulta({ estado: "erro", texto: e instanceof Error && e.message ? e.message : "Não foi possível consultar o CNPJ agora." });
    }
  };

  const faltando = camposCliente.filter((c) => c.obrigatorio && !form[c.chave]?.trim());
  const digitos = (form.cnpj ?? "").replace(/\D/g, "");
  const duplicado = digitos.length === 14 ? clientes.find((c) => c.id !== editando && c.cnpj.replace(/\D/g, "") === digitos) : undefined;

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (faltando.length || duplicado) return;
    // O id é gerado antes: a atualização do estado roda depois, e a volta ao projeto precisa dele já
    const id = editando === "novo" ? novoId("cli") : editando!;
    atualizar((r) => {
      if (editando === "novo") {
        r.clientes.push({ ...(form as unknown as Cliente), id, empresa: slug });
      } else {
        const i = r.clientes.findIndex((c) => c.id === editando);
        r.clientes[i] = { ...r.clientes[i], ...(form as unknown as Cliente) };
      }
    });
    setEditando(null);
    if (voltarParaProjeto) router.push(`/${slug}/projetos/novo?cliente=${id}`);
    else if (projetoDeOrigem) router.push(`/${slug}/projetos/${projetoDeOrigem}`);
    else router.push(`/${slug}/clientes/${id}`);
  };

  const excluirCliente = async () => {
    const c = clientes.find((x) => x.id === editando);
    if (!c || !confirm(`Excluir ${c.nomeFantasia || c.razaoSocial} do cadastro? Não há como desfazer.`)) return;
    try {
      await excluir("cliente", c.id);
      setEditando(null);
    } catch (e) {
      alert(traduzirErro(e, "Não foi possível excluir."));
    }
  };

  const termo = busca.trim().toLowerCase();
  const lista = clientes.filter((c) => !termo || `${c.razaoSocial} ${c.nomeFantasia} ${c.cnpj} ${c.responsavel}`.toLowerCase().includes(termo));

  return (
    <>
      <Cabecalho
        migalhas={[{ rotulo: empresa.nome, href: `/${slug}` }, { rotulo: "Clientes" }]}
        titulo="Clientes"
        subtitulo="Os dados do Diagnóstico de qualificação. Eles preenchem a ficha de identificação de todos os relatórios."
      >
        {!editando && <Botao onClick={() => abrir()}>Novo cliente</Botao>}
      </Cabecalho>

      {editando && (
        <Cartao className="mb-10 p-6 sm:p-8">
          <form onSubmit={salvar}>
            <h2 className="mb-1 text-xl font-semibold">{editando === "novo" ? "Novo cliente" : form.razaoSocial || "Editar cliente"}</h2>
            <p className="mb-6 text-[15px] text-tinta-2">Comece pelo CNPJ: o resto do cadastro é preenchido com os dados públicos da Receita Federal.</p>
            <div className="space-y-8">
              {gruposCliente.map((g) => (
                <fieldset key={g.titulo} className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  <legend className="mb-3 text-[15px] font-medium text-tinta">{g.titulo}</legend>
                  {g.campos.map((c) =>
                    c.chave === "cnpj" ? (
                      <div key="cnpj">
                        <Campo rotulo="CNPJ *">
                          <span className="flex gap-2">
                            <input
                              required
                              inputMode="numeric"
                              className="campo num"
                              placeholder="00.000.000/0000-00"
                              value={form.cnpj ?? ""}
                              onChange={(e) => {
                                const v = formatarCnpj(e.target.value);
                                setForm({ ...form, cnpj: v });
                                const d = v.replace(/\D/g, "");
                                const existe = clientes.some((c) => c.id !== editando && c.cnpj.replace(/\D/g, "") === d);
                                if (d.length === 14 && d !== ultimoCnpj.current && !existe) void consultarCnpj(v, false);
                              }}
                            />
                            <Botao
                              type="button"
                              variante="secundario"
                              className="shrink-0"
                              disabled={(form.cnpj ?? "").replace(/\D/g, "").length !== 14 || consulta?.estado === "buscando"}
                              onClick={() => consultarCnpj(form.cnpj, true)}
                            >
                              Atualizar
                            </Botao>
                          </span>
                        </Campo>
                        {duplicado && (
                          <p className="mt-1.5 text-[13px] text-vermelho">
                            Este CNPJ já está cadastrado.{" "}
                            <button type="button" className="underline underline-offset-4" onClick={() => abrir(duplicado)}>
                              Abrir o cadastro existente
                            </button>
                          </p>
                        )}
                        {consulta && !duplicado && (
                          <p className={`mt-1.5 text-[13px] ${consulta.estado === "erro" ? "text-vermelho" : consulta.estado === "ok" ? "text-verde" : "text-tinta-2"}`}>
                            {consulta.texto}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Campo key={c.chave} rotulo={c.rotulo + (c.obrigatorio ? " *" : "")} className={c.largo ? "sm:col-span-2" : ""}>
                        <input
                          type={c.tipo ?? "text"}
                          required={c.obrigatorio}
                          className="campo"
                          value={form[c.chave] ?? ""}
                          onChange={(e) => setForm({ ...form, [c.chave]: e.target.value })}
                        />
                      </Campo>
                    ),
                  )}
                </fieldset>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-linha pt-6">
              <Botao type="submit" disabled={faltando.length > 0 || !!duplicado}>
                {editando === "novo" ? (voltarParaProjeto ? "Cadastrar e voltar ao projeto" : "Cadastrar cliente") : projetoDeOrigem ? "Salvar e voltar ao projeto" : "Salvar alterações"}
              </Botao>
              <Botao
                type="button"
                variante="secundario"
                onClick={() =>
                  voltarParaProjeto
                    ? router.push(`/${slug}/projetos/novo`)
                    : projetoDeOrigem
                      ? router.push(`/${slug}/projetos/${projetoDeOrigem}`)
                      : editando !== "novo"
                        ? router.push(`/${slug}/clientes/${editando}`)
                        : (setEditando(null), router.replace(`/${slug}/clientes`))
                }
              >
                Cancelar
              </Botao>
              {faltando.length > 0 && <span className="text-sm text-tinta-2">Preencha os campos com *.</span>}
              {editando !== "novo" && gerencia(slug) && (
                <span className="ml-auto">
                  {estado.projetos.some((p) => p.clienteId === editando) ? (
                    <span className="text-[13px] text-tinta-2">Para excluir este cliente, exclua antes o projeto dele.</span>
                  ) : (
                    <Botao type="button" variante="perigo" onClick={excluirCliente}>
                      Excluir cliente
                    </Botao>
                  )}
                </span>
              )}
            </div>
          </form>
        </Cartao>
      )}

      {editando ? null : clientes.length === 0 ? (
        !editando && (
          <Vazio titulo="Nenhum cliente cadastrado" acao={<Botao onClick={() => abrir()}>Cadastrar o primeiro cliente</Botao>}>
            Cadastre a empresa demandante antes de criar o projeto. Basta o CNPJ para começar.
          </Vazio>
        )
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <input
              type="search"
              placeholder="Buscar por nome, CNPJ ou responsável"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="campo !w-80 max-w-full"
              aria-label="Buscar clientes"
            />
          </div>
          <ul className="divide-y divide-linha rounded-[var(--radius-bloco)] border border-linha bg-folha shadow-[var(--shadow-cartao)]">
            {lista.map((c) => {
              const projetos = estado.projetos.filter((p) => p.clienteId === c.id);
              const ativos = projetos.filter((p) => p.status !== "encerrado");
              return (
                <li key={c.id} className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 py-4 hover:bg-pedra/50 sm:px-6">
                  <div className="min-w-0">
                    <Link href={`/${slug}/clientes/${c.id}`} className="break-words text-[17px] font-semibold text-tinta after:absolute after:inset-0 after:content-[''] hover:text-azul">
                      {nomeDoCliente(c)}
                    </Link>
                    <p className="num mt-0.5 break-words text-sm text-tinta-2">{[c.nomeFantasia && c.razaoSocial, c.cnpj, c.responsavel].filter(Boolean).join(", ")}</p>
                    {ativos.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-1.5">
                        {ativos.map((p) => (
                          <Chip key={p.id} tom="andamento">
                            {servicoDoProjeto(p)}
                          </Chip>
                        ))}
                      </p>
                    )}
                  </div>
                  <span className="relative z-10 flex items-center gap-2 text-sm">
                    <span className="num text-tinta-2">{projetos.length === 0 ? "Sem projetos" : `${ativos.length} em andamento`}</span>
                    <Botao variante="fantasma" tamanho="pequeno" onClick={() => abrir(c)}>
                      Editar
                    </Botao>
                  </span>
                </li>
              );
            })}
          </ul>
          {lista.length === 0 && <p className="py-8 text-center text-[15px] text-tinta-2">Nenhum cliente encontrado.</p>}
        </>
      )}
    </>
  );
}

export default function Clientes() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}
