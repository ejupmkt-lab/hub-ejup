"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { novoId, useEstado } from "@/lib/dados/store";
import type { Cliente, EmpresaSlug } from "@/lib/dados/tipos";
import { camposCliente } from "@/lib/campos-cliente";
import { Botao, Cabecalho, Campo, Cartao, Vazio } from "@/components/ui";

const vazio = Object.fromEntries(camposCliente.map((c) => [c.chave, ""])) as Record<string, string>;

export default function Clientes() {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { estado, atualizar } = useEstado();
  const clientes = estado.clientes.filter((c) => c.empresa === slug);
  const [editando, setEditando] = useState<string | null>(null); // id, "novo" ou null
  const [form, setForm] = useState<Record<string, string>>(vazio);

  const abrir = (c?: Cliente) => {
    setEditando(c ? c.id : "novo");
    setForm(c ? { ...(c as unknown as Record<string, string>) } : vazio);
  };

  const faltando = camposCliente.filter((c) => c.obrigatorio && !form[c.chave]?.trim());

  const salvar = () => {
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

  return (
    <>
      <Cabecalho sobre={estado.empresas.find((e) => e.slug === slug)?.nome} titulo="Clientes">
        {!editando && <Botao onClick={() => abrir()}>Novo cliente</Botao>}
      </Cabecalho>

      {editando && (
        <Cartao className="mb-6 p-5">
          <h2 className="mb-1 font-semibold">{editando === "novo" ? "Novo cliente" : "Editar cliente"}</h2>
          <p className="mb-4 text-xs text-tinta-2">Campos do Diagnóstico de qualificação da demanda. Eles preenchem a ficha de identificação de todos os relatórios.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {camposCliente.map((c) => (
              <Campo key={c.chave} rotulo={c.rotulo + (c.obrigatorio ? " *" : "")} className={c.largo ? "sm:col-span-2" : ""}>
                <input className="campo" value={form[c.chave] ?? ""} onChange={(e) => setForm({ ...form, [c.chave]: e.target.value })} />
              </Campo>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Botao onClick={salvar} disabled={faltando.length > 0}>Salvar</Botao>
            <Botao variante="secundario" onClick={() => setEditando(null)}>Cancelar</Botao>
          </div>
        </Cartao>
      )}

      {clientes.length === 0 ? (
        <Vazio>Nenhum cliente cadastrado.</Vazio>
      ) : (
        <Cartao className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-linha text-left text-xs text-tinta-2">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
                <th className="px-4 py-3 font-medium">Projetos</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-linha last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.razaoSocial}</div>
                    <div className="text-xs text-tinta-2">{c.ramo}</div>
                  </td>
                  <td className="px-4 py-3">{c.cnpj}</td>
                  <td className="px-4 py-3">{c.responsavel}</td>
                  <td className="px-4 py-3">{estado.projetos.filter((p) => p.clienteId === c.id).length}</td>
                  <td className="px-4 py-3 text-right">
                    <Botao variante="fantasma" onClick={() => abrir(c)}>Editar</Botao>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Cartao>
      )}
    </>
  );
}
