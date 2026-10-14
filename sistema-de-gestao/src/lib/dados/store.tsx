"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabaseNavegador } from "../supabase/navegador";
import type { Cliente, Empresa, EmpresaSlug, Estado, Papel, Projeto, Usuario } from "./tipos";

// Estado do sistema carregado do Supabase. As telas alteram uma cópia local
// (atualizar) e as mudanças são gravadas no banco automaticamente, com uma
// pequena espera para não salvar a cada tecla. O isolamento por empresa é
// garantido pelo banco (RLS): só chega aqui o que o usuário pode ver.

export type Salvamento = "salvo" | "salvando" | "pendente" | "erro";

type Ctx = {
  estado: Estado;
  atualizar: (fn: (rascunho: Estado) => void) => void;
  salvamento: Salvamento;
  sair: () => Promise<void>;
};

const Contexto = createContext<Ctx | null>(null);
const ESPERA_MS = 800;

type Carga =
  | { tipo: "carregando" }
  | { tipo: "sem_acesso"; email: string }
  | { tipo: "erro"; mensagem: string }
  | { tipo: "pronto"; estado: Estado };

async function carregarDoBanco(): Promise<Carga> {
  const sb = supabaseNavegador();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { tipo: "erro", mensagem: "Sessão expirada. Entre novamente." };

  const [perfis, membros, empresas, clientes, projetos] = await Promise.all([
    sb.from("perfis").select("id, email, nome, nome_completo, admin_grupo"),
    sb.from("membros").select("empresa, user_id, papel"),
    sb.from("empresas").select("slug, nome, status, descricao, socios").order("ordem"),
    sb.from("clientes").select("id, dados").order("created_at"),
    sb.from("projetos").select("id, dados, versao").order("created_at", { ascending: false }),
  ]);
  const erro = [perfis, membros, empresas, clientes, projetos].find((r) => r.error)?.error;
  if (erro) return { tipo: "erro", mensagem: erro.message };

  if (!perfis.data!.some((p) => p.id === user.id)) return { tipo: "sem_acesso", email: user.email ?? "" };

  const usuarios: Usuario[] = perfis.data!.map((p) => ({
    id: p.id,
    email: p.email,
    nome: p.nome,
    nomeCompleto: p.nome_completo,
    adminGrupo: p.admin_grupo,
    acessos: Object.fromEntries(
      membros.data!.filter((m) => m.user_id === p.id).map((m) => [m.empresa as EmpresaSlug, m.papel as Papel]),
    ),
  }));

  versoes.clear();
  for (const p of projetos.data!) versoes.set(p.id, p.versao);

  return {
    tipo: "pronto",
    estado: {
      usuarioAtualId: user.id,
      usuarios,
      empresas: empresas.data as Empresa[],
      clientes: clientes.data!.map((c) => c.dados as Cliente),
      projetos: projetos.data!.map((p) => p.dados as Projeto),
    },
  };
}

// Versão de cada projeto conforme lida do banco (controle de concorrência)
const versoes = new Map<string, number>();

export function ProvedorEstado({ children }: { children: React.ReactNode }) {
  const [carga, setCarga] = useState<Carga>({ tipo: "carregando" });
  const [salvamento, setSalvamento] = useState<Salvamento>("salvo");
  // Última versão gravada (ou lida) de cada registro, em JSON, para saber o que mudou
  const gravado = useRef(new Map<string, string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const salvandoAgora = useRef(false);
  const estadoRef = useRef<Estado | null>(null);
  const gravarRef = useRef<() => void>(() => {});

  const recarregar = useCallback(async () => {
    const c = await carregarDoBanco();
    if (c.tipo === "pronto") {
      gravado.current = new Map([
        ...c.estado.clientes.map((x) => [`cli:${x.id}`, JSON.stringify(x)] as const),
        ...c.estado.projetos.map((x) => [`prj:${x.id}`, JSON.stringify(x)] as const),
      ]);
      estadoRef.current = c.estado;
    }
    setCarga(c);
  }, []);

  useEffect(() => {
    // Carga inicial assíncrona; o setState acontece depois da resposta do banco
    void Promise.resolve().then(recarregar);
  }, [recarregar]);

  const gravar = useCallback(async () => {
    const estado = estadoRef.current;
    if (!estado || salvandoAgora.current) return;
    salvandoAgora.current = true;
    setSalvamento("salvando");
    const sb = supabaseNavegador();
    let conflito: string | null = null;
    try {
      for (const c of estado.clientes) {
        const chave = `cli:${c.id}`;
        const json = JSON.stringify(c);
        if (gravado.current.get(chave) === json) continue;
        const { error } = gravado.current.has(chave)
          ? await sb.from("clientes").update({ dados: c, updated_at: new Date().toISOString() }).eq("id", c.id)
          : await sb.from("clientes").insert({ id: c.id, empresa: c.empresa, dados: c });
        if (error) throw error;
        gravado.current.set(chave, json);
      }
      for (const p of estado.projetos) {
        const chave = `prj:${p.id}`;
        const json = JSON.stringify(p);
        if (gravado.current.get(chave) === json) continue;
        if (!gravado.current.has(chave)) {
          const { error } = await sb.from("projetos").insert({ id: p.id, empresa: p.empresa, cliente_id: p.clienteId, dados: p });
          if (error) throw error;
          versoes.set(p.id, 1);
        } else {
          const { data, error } = await sb.rpc("salvar_projeto", { p_id: p.id, p_dados: p, p_versao: versoes.get(p.id) ?? 1 });
          if (error) throw error;
          if (data === null) {
            conflito = p.id;
            break;
          }
          versoes.set(p.id, data as number);
        }
        gravado.current.set(chave, json);
      }
      if (conflito) {
        alert(
          "Outra pessoa salvou este projeto enquanto você editava. Carreguei a versão mais recente; confira e refaça a sua última alteração.",
        );
        await recarregar();
      }
      setSalvamento("salvo");
    } catch (e) {
      console.error(e);
      setSalvamento("erro");
    } finally {
      salvandoAgora.current = false;
    }
    // Se algo mudou enquanto gravava, grava de novo
    const atual = estadoRef.current;
    if (
      atual &&
      [...atual.clientes.map((x) => [`cli:${x.id}`, x] as const), ...atual.projetos.map((x) => [`prj:${x.id}`, x] as const)].some(
        ([k, v]) => gravado.current.get(k) !== JSON.stringify(v),
      )
    ) {
      timer.current = setTimeout(() => gravarRef.current(), ESPERA_MS);
    }
  }, [recarregar]);

  useEffect(() => {
    gravarRef.current = gravar;
  }, [gravar]);

  const atualizar = useCallback(
    (fn: (r: Estado) => void) => {
      setCarga((atual) => {
        if (atual.tipo !== "pronto") return atual;
        const copia = structuredClone(atual.estado);
        fn(copia);
        estadoRef.current = copia;
        return { tipo: "pronto", estado: copia };
      });
      setSalvamento("pendente");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(gravar, ESPERA_MS);
    },
    [gravar],
  );

  // Avisa antes de fechar a aba com alteração ainda não gravada
  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (salvamento === "pendente" || salvamento === "salvando" || salvamento === "erro") e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [salvamento]);

  const sair = useCallback(async () => {
    await supabaseNavegador().auth.signOut();
    window.location.href = "/login";
  }, []);

  const valor = useMemo(
    () => (carga.tipo === "pronto" ? { estado: carga.estado, atualizar, salvamento, sair } : null),
    [carga, atualizar, salvamento, sair],
  );

  if (carga.tipo === "carregando") return <div className="p-10 text-sm text-tinta-2">Carregando…</div>;
  if (carga.tipo !== "pronto")
    return (
      <div className="mx-auto mt-24 max-w-md rounded-lg border border-linha bg-superficie p-8 text-center">
        <h1 className="text-lg font-semibold">{carga.tipo === "sem_acesso" ? "Conta sem acesso" : "Não foi possível carregar"}</h1>
        <p className="mt-2 text-sm text-tinta-2">
          {carga.tipo === "sem_acesso"
            ? `O e-mail ${carga.email} ainda não foi liberado. Peça ao administrador do grupo para cadastrar o seu acesso.`
            : carga.mensagem}
        </p>
        <button onClick={sair} className="mt-6 text-sm text-marinho underline">
          Sair
        </button>
      </div>
    );
  return <Contexto.Provider value={valor!}>{children}</Contexto.Provider>;
}

export function useEstado() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useEstado fora do ProvedorEstado");
  return c;
}

export function useUsuario() {
  const { estado } = useEstado();
  return estado.usuarios.find((u) => u.id === estado.usuarioAtualId)!;
}

// Espelha a regra do banco (RLS) para montar menus e telas
export function useAcesso() {
  const { estado } = useEstado();
  const usuario = useUsuario();
  const empresasVisiveis = estado.empresas.filter(
    (e) => usuario.adminGrupo || (usuario.acessos[e.slug] && e.status === "ativo"),
  );
  const podeVer = (slug: EmpresaSlug) => empresasVisiveis.some((e) => e.slug === slug);
  return { usuario, empresasVisiveis, podeVer };
}

export function registrarEvento(p: Projeto, usuario: string, acao: string, detalhe?: string) {
  // Horário de Brasília
  p.historico.unshift({ em: new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 19), usuario, acao, detalhe });
}

export function novoId(prefixo: string) {
  return `${prefixo}-${crypto.randomUUID()}`;
}
