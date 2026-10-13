"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { novoId, registrarEvento, useEstado, useUsuario } from "@/lib/prototipo/store";
import type { EmpresaSlug, Projeto } from "@/lib/prototipo/tipos";
import { modelosDaEmpresa } from "@/lib/modelos";
import { etapasDoModelo } from "@/lib/prototipo/semente";
import { Botao, Cabecalho, Campo, Cartao } from "@/components/ui";

export default function NovoProjeto() {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { estado, atualizar } = useEstado();
  const usuario = useUsuario();
  const router = useRouter();
  const modelos = modelosDaEmpresa(slug);
  const clientes = estado.clientes.filter((c) => c.empresa === slug);
  const consultores = estado.usuarios.filter((u) => u.acessos[slug]);

  const [f, setF] = useState({
    modeloId: modelos[0]?.id ?? "",
    clienteId: clientes[0]?.id ?? "",
    consultorId: usuario.id,
    numeroProjetoHub: "",
    codigoSolicitacaoHub: "",
    gestorSebrae: "",
    segmento: "",
    areaAtuacao: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const modelo = modelos.find((m) => m.id === f.modeloId);

  const criar = () => {
    if (!modelo) return;
    const id = novoId("prj");
    atualizar((r) => {
      const p: Projeto = {
        id,
        empresa: slug,
        clienteId: f.clienteId,
        modeloId: modelo.id,
        modeloVersao: modelo.versao,
        consultorId: f.consultorId,
        status: "aguardando_plano",
        prestadoraVinculada: modelo.prestadoraVinculada,
        numeroProjetoHub: f.numeroProjetoHub,
        codigoSolicitacaoHub: f.codigoSolicitacaoHub,
        gestorSebrae: f.gestorSebrae,
        fichaTecnica: modelo.fichaTecnica,
        codigoFichaTecnica: modelo.codigoFichaTecnica,
        segmento: f.segmento,
        areaAtuacao: f.areaAtuacao,
        localAssinatura: "Natal/RN",
        planoFechadoEm: null,
        etapas: etapasDoModelo(modelo),
        registros: [],
        referencias: [],
        historico: [],
      };
      registrarEvento(p, usuario.nome, "Projeto criado");
      r.projetos.unshift(p);
    });
    router.push(`/${slug}/projetos/${id}`);
  };

  return (
    <>
      <Cabecalho sobre={<Link href={`/${slug}`} className="hover:text-marinho">← Projetos</Link>} titulo="Novo projeto" />
      <Cartao className="max-w-3xl p-6">
        {clientes.length === 0 ? (
          <p className="text-sm">
            Cadastre o cliente primeiro em <Link href={`/${slug}/clientes`} className="text-marinho underline">Clientes</Link>.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Serviço (modelo de fluxo)" className="sm:col-span-2">
              <select className="campo" value={f.modeloId} onChange={set("modeloId")}>
                {modelos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome} — ficha {m.codigoFichaTecnica} (v{m.versao})</option>
                ))}
              </select>
            </Campo>
            <Campo rotulo="Cliente">
              <select className="campo" value={f.clienteId} onChange={set("clienteId")}>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.razaoSocial}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Consultor responsável">
              <select className="campo" value={f.consultorId} onChange={set("consultorId")}>
                {consultores.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Nº do projeto no HUB"><input className="campo" value={f.numeroProjetoHub} onChange={set("numeroProjetoHub")} /></Campo>
            <Campo rotulo="Código da solicitação no HUB"><input className="campo" value={f.codigoSolicitacaoHub} onChange={set("codigoSolicitacaoHub")} /></Campo>
            <Campo rotulo="Gestor(a) SEBRAE"><input className="campo" value={f.gestorSebrae} onChange={set("gestorSebrae")} /></Campo>
            <Campo rotulo="Segmento"><input className="campo" value={f.segmento} onChange={set("segmento")} /></Campo>
            <Campo rotulo="Área de atuação da consultoria" className="sm:col-span-2"><input className="campo" value={f.areaAtuacao} onChange={set("areaAtuacao")} /></Campo>
            {modelo && (
              <div className="rounded-md bg-papel p-4 text-xs text-tinta-2 sm:col-span-2">
                O projeto nasce com as {modelo.etapas.length} etapas da ficha {modelo.codigoFichaTecnica} (
                {modelo.etapas.reduce((a, e) => a + e.horasPrevistas, 0)} h previstas), checklist de atividades e entregáveis. Prestadora vinculada: {modelo.prestadoraVinculada}. As datas são definidas depois, no plano de trabalho.
              </div>
            )}
            <div className="sm:col-span-2">
              <Botao onClick={criar} disabled={!f.clienteId}>Criar projeto</Botao>
            </div>
          </div>
        )}
      </Cartao>
    </>
  );
}
