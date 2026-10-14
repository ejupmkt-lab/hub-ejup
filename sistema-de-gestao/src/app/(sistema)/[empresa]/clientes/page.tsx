"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { novoId, useEstado } from "@/lib/dados/store";
import type { Cliente, EmpresaSlug } from "@/lib/dados/tipos";
import { camposCliente, gruposCliente } from "@/lib/campos-cliente";
import { Botao, Cabecalho, Campo, Cartao, Vazio } from "@/components/ui";

const vazio = Object.fromEntries(camposCliente.map((c) => [c.chave, ""])) as Record<string, string>;

export default function Clientes() {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { estado, atualizar } = useEstado();
  const empresa = estado.empresas.find((e) => e.slug === slug)!;
  const clientes = estado.clientes.filter((c) => c.empresa === slug);
  const [editando, setEditando] = useState<string | null>(null); // id, "novo" ou null
  const [form, setForm] = useState<Record<string, string>>(vazio);
  const [busca, setBusca] = useState("");

  const abrir = (c?: Cliente) => {
    setEditando(c ? c.id : "novo");
    setForm(c ? { ...vazio, ...(c as unknown as Record<string, string>) } : vazio);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const faltando = camposCliente.filter((c) => c.obrigatorio && !form[c.chave]?.trim());

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (faltando.length) return;
    atualizar((r) => {
      if (editando === "novo") {
        r.clientes.push({ ...(form as unknown as Cliente), id: novoId("cli"), empresa: slug });
      } else {
        const i = r.clientes.findIndex((c) => c.id === editando);
        r.clientes[i] = { ...r.clientes[i], ...(form as unknown as Cliente) };
      }
    });
    setEditando(null);
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
            <h2 className="mb-6 font-serif text-2xl">{editando === "novo" ? "Novo cliente" : form.razaoSocial || "Editar cliente"}</h2>
            <div className="space-y-8">
              {gruposCliente.map((g) => (
                <fieldset key={g.titulo} className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  <legend className="mb-3 text-[15px] font-medium text-tinta">{g.titulo}</legend>
                  {g.campos.map((c) => (
                    <Campo key={c.chave} rotulo={c.rotulo + (c.obrigatorio ? " *" : "")} className={c.largo ? "sm:col-span-2" : ""}>
                      <input
                        type={c.tipo ?? "text"}
                        required={c.obrigatorio}
                        className="campo"
                        value={form[c.chave] ?? ""}
                        onChange={(e) => setForm({ ...form, [c.chave]: e.target.value })}
                      />
                    </Campo>
                  ))}
                </fieldset>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-linha pt-6">
              <Botao type="submit" disabled={faltando.length > 0}>
                {editando === "novo" ? "Cadastrar cliente" : "Salvar alterações"}
              </Botao>
              <Botao type="button" variante="secundario" onClick={() => setEditando(null)}>
                Cancelar
              </Botao>
              {faltando.length > 0 && <span className="text-sm text-tinta-2">Preencha os campos com *.</span>}
            </div>
          </form>
        </Cartao>
      )}

      {clientes.length === 0 ? (
        !editando && (
          <Vazio titulo="Nenhum cliente cadastrado" acao={<Botao onClick={() => abrir()}>Cadastrar o primeiro cliente</Botao>}>
            Cadastre a empresa demandante antes de criar o projeto.
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
          <ul className="divide-y divide-linha border-y border-linha">
            {lista.map((c) => {
              const n = estado.projetos.filter((p) => p.clienteId === c.id).length;
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-4">
                  <div className="min-w-0">
                    <p className="font-serif text-[18px] text-tinta">{c.razaoSocial}</p>
                    <p className="num mt-0.5 text-sm text-tinta-2">
                      {[c.cnpj, c.responsavel, c.ramo].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-5 text-sm">
                    <span className="num text-tinta-2">{n === 1 ? "1 projeto" : `${n} projetos`}</span>
                    <Botao variante="fantasma" onClick={() => abrir(c)}>
                      Editar
                    </Botao>
                  </div>
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
