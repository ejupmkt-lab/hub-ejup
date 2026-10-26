"use client";

import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { useAcesso, useEstado, useUsuario } from "@/lib/dados/store";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { nomeDoCliente } from "@/lib/campos-cliente";
import { servicosDaEmpresa } from "@/lib/servicos";
import { traduzirErro } from "@/lib/erros";
import { Botao, Campo } from "@/components/ui";

const BUCKET = "evidencias";
const digitos = (t: string) => (t ?? "").replace(/\D/g, "");

// Todos os arquivos de uma pasta, entrando nas subpastas
async function arquivosDaPasta(pasta: string): Promise<string[]> {
  const sb = supabaseNavegador();
  const { data, error } = await sb.storage.from(BUCKET).list(pasta, { limit: 1000 });
  if (error) throw error;
  const lista: string[] = [];
  for (const f of data ?? []) {
    if (f.id === null) lista.push(...(await arquivosDaPasta(`${pasta}/${f.name}`)));
    else lista.push(`${pasta}/${f.name}`);
  }
  return lista;
}

// Mover o projeto, com todo o histórico e os arquivos, para outra empresa do grupo (só gestores da empresa de origem)
export function MoverProjeto({ projeto }: { projeto: Projeto }) {
  const { estado, salvarAgora } = useEstado();
  const { empresasVisiveis, gerencia } = useAcesso();
  const usuario = useUsuario();
  const [aberto, setAberto] = useState(false);
  const [destino, setDestino] = useState("");
  const [movendo, setMovendo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Quem é administrador do grupo também enxerga (e pode usar) as empresas ainda em estruturação ou em espera
  const destinos = empresasVisiveis.filter((e) => e.slug !== projeto.empresa);
  if (!gerencia(projeto.empresa) || destinos.length === 0) return null;

  const empresaDestino = destinos.find((e) => e.slug === destino);
  const cliente = estado.clientes.find((c) => c.id === projeto.clienteId);
  // O que acontece com o cliente e com o serviço (as mesmas regras da função do banco)
  const cnpj = digitos(cliente?.cnpj ?? "");
  const clienteNoDestino = destino && cnpj ? estado.clientes.find((c) => c.empresa === destino && digitos(c.cnpj) === cnpj) : undefined;
  const outrosDoCliente = estado.projetos.filter((p) => p.clienteId === projeto.clienteId && p.id !== projeto.id).length;
  const servicoNoDestino = destino
    ? servicosDaEmpresa(estado, destino).find((s) => s.codigoFichaTecnica === projeto.codigoFichaTecnica) ?? servicosDaEmpresa(estado, destino).find((s) => s.nomeCurto === projeto.servicoNome)
    : undefined;
  const nomeCliente = nomeDoCliente(cliente, "o cliente");

  const mover = async () => {
    if (!destino || movendo) return;
    setErro(null);
    const sb = supabaseNavegador();
    const origem = projeto.empresa;
    const copiados: string[] = [];
    try {
      setMovendo("Gravando o que estava pendente…");
      await salvarAgora();
      setMovendo("Procurando os arquivos do projeto…");
      const antigos = await arquivosDaPasta(`${origem}/${projeto.id}`);
      for (const [i, de] of antigos.entries()) {
        setMovendo(`Copiando os arquivos para ${empresaDestino?.nome}: ${i + 1} de ${antigos.length}…`);
        const para = `${destino}/${de.slice(origem.length + 1)}`;
        const { error } = await sb.storage.from(BUCKET).copy(de, para);
        if (error) throw error;
        copiados.push(para);
      }
      setMovendo("Passando o projeto para a nova empresa…");
      const { error } = await sb.rpc("mover_projeto", { p_id: projeto.id, p_destino: destino, p_servico_id: servicoNoDestino?.id ?? null, p_usuario: usuario.nome });
      if (error) throw error;
      // O projeto já está na nova empresa: os arquivos antigos podem sair (se falhar, só sobra lixo na pasta antiga)
      if (antigos.length) await sb.storage.from(BUCKET).remove(antigos).catch(() => undefined);
      // Recarrega tudo: o banco mudou o projeto de empresa
      window.location.assign(`/${destino}/projetos/${projeto.id}`);
    } catch (e) {
      if (copiados.length) await sb.storage.from(BUCKET).remove(copiados).catch(() => undefined);
      setErro(traduzirErro(e, "Não foi possível mover o projeto. Nada foi alterado."));
      setMovendo(null);
    }
  };

  return (
    <>
      <Botao variante="secundario" tamanho="pequeno" onClick={() => setAberto(true)}>
        Mover para outra empresa
      </Botao>
      {aberto && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-tinta/40 p-4" role="dialog" aria-modal="true" aria-label="Mover projeto para outra empresa">
          <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-auto rounded-[var(--radius-bloco)] bg-folha p-5 shadow-xl">
            <div>
              <h2 className="text-lg font-bold">Mover para outra empresa</h2>
              <p className="text-[13px] text-tinta-2">
                O projeto vai com tudo: dados, etapas, relatórios, histórico, conversa, arquivos e o que foi lido do HUB. Ele sai da empresa atual e passa a existir só na de destino.
              </p>
            </div>
            <Campo rotulo="Empresa de destino">
              <select className="campo" value={destino} onChange={(e) => setDestino(e.target.value)} disabled={!!movendo}>
                <option value="">Escolha…</option>
                {destinos.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.nome}
                    {e.status === "ativo" ? "" : e.status === "em_estruturacao" ? " (em estruturação)" : " (em espera)"}
                  </option>
                ))}
              </select>
            </Campo>
            {destino && (
              <ul className="list-disc space-y-1 pl-5 text-[13px] text-tinta-2">
                <li>
                  {clienteNoDestino
                    ? `${nomeCliente} já está cadastrado em ${empresaDestino?.nome} (mesmo CNPJ): o projeto passa para esse cadastro.`
                    : outrosDoCliente > 0
                      ? `${nomeCliente} tem outros projetos aqui: o cadastro dele é copiado para ${empresaDestino?.nome} e continua também aqui.`
                      : `${nomeCliente} vai junto, com o cadastro, para ${empresaDestino?.nome}.`}
                </li>
                <li>
                  {servicoNoDestino
                    ? `O serviço passa a ser o de ${empresaDestino?.nome}: ${servicoNoDestino.nomeCurto}.`
                    : `${empresaDestino?.nome} não tem o serviço ${projeto.servicoNome ?? projeto.fichaTecnica} cadastrado: o projeto leva as etapas e o checklist, mas sem a biblioteca de textos do serviço.`}
                </li>
                <li>O consultor continua o mesmo se ele fizer parte da empresa de destino; senão, passa a ser você.</li>
                <li>O histórico ganha o registro da mudança.</li>
              </ul>
            )}
            {movendo && (
              <p role="status" className="text-[13px] font-semibold text-azul">
                {movendo}
              </p>
            )}
            {erro && (
              <p role="alert" className="text-[13px] text-vermelho">
                {erro}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Botao tamanho="pequeno" onClick={() => void mover()} disabled={!destino || !!movendo}>
                {movendo ? "Movendo…" : "Mover o projeto"}
              </Botao>
              <Botao variante="fantasma" tamanho="pequeno" onClick={() => setAberto(false)} disabled={!!movendo}>
                Cancelar
              </Botao>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
