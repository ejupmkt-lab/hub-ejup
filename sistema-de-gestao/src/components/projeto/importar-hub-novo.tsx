"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Cliente, EmpresaSlug } from "@/lib/dados/tipos";
import { novoId, registrarEvento, useEstado, useUsuario } from "@/lib/dados/store";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { aplicarAcoes, type AcaoIA } from "@/lib/conversa";
import { acoesDaImportacao, type RespostaImportacao } from "@/lib/hub-importar";
import { carimbarInicios, reencadearExecucao } from "@/lib/fase";
import { montarProjeto } from "@/lib/projeto-novo";
import { servicosDaEmpresa } from "@/lib/servicos";
import { LIMITE_PROJETOS_CLIENTE } from "@/lib/projeto";
import { camposCliente, nomeDoCliente } from "@/lib/campos-cliente";
import { dadosParaFormulario, formatarCnpj, type DadosCnpj } from "@/lib/cnpj";
import { traduzirErro } from "@/lib/erros";
import { Botao, Campo } from "@/components/ui";
import { EntradaDoHub, LidoDaPagina, useLeituraHub } from "./hub-leitura";

const BUCKET = "evidencias";
const digitos = (t: string) => (t ?? "").replace(/\D/g, "");
const vazioCliente = Object.fromEntries(camposCliente.map((c) => [c.chave, ""])) as Record<string, string>;

// Novo projeto a partir do HUB: o consultor lê a página do pedido (extensão, texto colado, print ou PDF) e o
// Blimp mostra o cliente, o serviço e os passos que achou. Ao confirmar, cadastra o cliente (se ainda não existir,
// pelos dados da Receita), cria o projeto já no passo certo do HUB e guarda os arquivos baixados.
export function ImportarHubNovo({ slug, aoFechar }: { slug: EmpresaSlug; aoFechar: () => void }) {
  const { estado, atualizar } = useEstado();
  const usuario = useUsuario();
  const router = useRouter();
  const [lido, setLido] = useState<RespostaImportacao | null>(null);
  const [servicoEscolhido, setServicoEscolhido] = useState<string | null>(null);
  const [clienteEscolhido, setClienteEscolhido] = useState("");
  const [insistir, setInsistir] = useState(false);
  const [criando, setCriando] = useState(false);
  const h = useLeituraHub({
    campos: () => ({ modo: "novo", empresa: slug }),
    codigoParaPuxar: "",
    aoLer: (r) => {
      setLido(r);
      setServicoEscolhido(null);
      setClienteEscolhido("");
      setInsistir(false);
    },
    aoReceber: () => setLido(null),
    // Só se consome o que a extensão guardou quando o projeto é criado
    consumirAoLer: false,
  });
  const { materiais, entrega, erro, setErro } = h;

  const modelos = servicosDaEmpresa(estado, slug);
  const clientes = estado.clientes.filter((c) => c.empresa === slug);
  const consultores = estado.usuarios.filter((u) => u.acessos[slug]);
  const consultorId = (consultores.find((u) => u.id === usuario.id) ?? consultores[0])?.id ?? "";
  const ident = lido?.identificacao;

  // Serviço: o que a IA reconheceu na lista (se existir) ou o que o consultor escolher
  const servicoDaIA = modelos.find((m) => m.id === ident?.servico_id)?.id ?? "";
  const modeloId = servicoEscolhido ?? (servicoDaIA || modelos[0]?.id || "");
  const modelo = modelos.find((m) => m.id === modeloId);

  // Cliente: o do CNPJ lido; sem CNPJ válido, o consultor escolhe um já cadastrado
  const cnpjLido = digitos(ident?.cnpj ?? "");
  const cnpjValido = cnpjLido.length === 14;
  const clienteDoCnpj = cnpjValido ? clientes.find((c) => digitos(c.cnpj) === cnpjLido) : undefined;
  const clienteEscolhidoObj = clientes.find((c) => c.id === clienteEscolhido);
  const clienteExistente = clienteDoCnpj ?? (!cnpjValido ? clienteEscolhidoObj : undefined);
  const cadastrarCliente = cnpjValido && !clienteDoCnpj;
  const semCliente = !clienteExistente && !cadastrarCliente;

  const codigoHub = (ident?.codigo_hub ?? "").trim();
  const duplicado = codigoHub ? estado.projetos.find((p) => p.empresa === slug && digitos(p.codigoSolicitacaoHub || p.numeroProjetoHub) === digitos(codigoHub) && p.status !== "encerrado") : undefined;
  const emAndamento = clienteExistente ? estado.projetos.filter((p) => p.clienteId === clienteExistente.id && p.status !== "encerrado").length : 0;
  const passouDoLimite = emAndamento > LIMITE_PROJETOS_CLIENTE;

  // Ações da importação: o diagnóstico define a data do começo do projeto; código e gestor entram na criação
  const { acoes, dataDiagnostico } = useMemo(() => {
    const todas = lido ? acoesDaImportacao(lido.acoes, lido.identificacao, false) : [];
    const diag = todas.find((a): a is Extract<AcaoIA, { tipo: "avancar_hub" }> => a.tipo === "avancar_hub" && a.passo === "diagnostico");
    return { acoes: todas.filter((a) => a !== diag), dataDiagnostico: diag?.data };
  }, [lido]);

  // O projeto como ficaria, para a prévia (cópia): passos e plano aplicados pelas mesmas regras da conversa
  const montar = (id: string, clienteId: string, ramo: string) => {
    if (!modelo) return null;
    const areaBase = modelo.areaAtuacao || modelo.fichaTecnica || "";
    const p = montarProjeto({
      slug,
      id,
      clienteId,
      modelo,
      consultorId,
      codigoHub,
      gestorSebrae: ident?.gestor ?? "",
      segmento: ramo,
      areaAtuacao: ramo && areaBase ? `${areaBase} aplicada a ${ramo.charAt(0).toLowerCase() + ramo.slice(1)}` : areaBase,
      situacao: "diagnostico",
      dataSituacao: dataDiagnostico && /^\d{4}-\d{2}-\d{2}$/.test(dataDiagnostico) ? dataDiagnostico : undefined,
      horasDaEtapa: (_ordem, padrao) => padrao,
    });
    const antes = new Map(p.etapas.map((e) => [e.ordem, e.status]));
    const resultado = aplicarAcoes(p, acoes, [], `hub-${id}`, usuario.nome);
    carimbarInicios(p, antes);
    reencadearExecucao(p);
    return { projeto: p, itens: resultado.itens };
  };
  const previa = lido ? montar("previa", clienteExistente?.id ?? "previa", clienteExistente?.ramo ?? "") : null;
  const feitos = previa?.itens.filter((i) => !i.aviso) ?? [];
  const avisos = previa?.itens.filter((i) => i.aviso) ?? [];
  const bloqueado = !modelo || semCliente || passouDoLimite || (!!duplicado && !insistir);

  const criar = async () => {
    if (!lido || !modelo || bloqueado || criando) return;
    setCriando(true);
    setErro(null);
    try {
      const sb = supabaseNavegador();
      // 1. Cliente: o cadastrado, ou um novo com os dados da Receita Federal
      let cliente: Cliente | null = null;
      let clienteId = clienteExistente?.id ?? "";
      const avisosFinais: string[] = [];
      if (cadastrarCliente) {
        let receita: Record<string, string> = {};
        try {
          const r = await fetch(`/api/cnpj/${cnpjLido}`);
          if (r.ok) receita = dadosParaFormulario((await r.json()) as DadosCnpj);
          else avisosFinais.push("a consulta do CNPJ na Receita falhou; o cadastro do cliente ficou só com o que veio do HUB");
        } catch {
          avisosFinais.push("a consulta do CNPJ na Receita falhou; o cadastro do cliente ficou só com o que veio do HUB");
        }
        const nomeHub = ident?.empresa?.trim() ?? "";
        clienteId = novoId("cli");
        cliente = {
          ...(vazioCliente as unknown as Cliente),
          ...(Object.fromEntries(Object.entries(receita).filter(([, v]) => v)) as unknown as Partial<Cliente>),
          id: clienteId,
          empresa: slug,
          cnpj: formatarCnpj(cnpjLido),
          razaoSocial: receita.razaoSocial || nomeHub || "Cliente do HUB",
          responsavel: ident?.contato_nome?.trim() || receita.responsavel || "A definir",
          email: ident?.contato_email?.trim() || receita.email || "",
          telefone: ident?.contato_telefone?.trim() || receita.telefone || "",
        };
        if (!ident?.contato_nome?.trim() && !receita.responsavel) avisosFinais.push("o responsável do cliente não veio do HUB: complete em Clientes");
      }
      const id = novoId("prj");
      const montado = montar(id, clienteId, cliente?.ramo ?? clienteExistente?.ramo ?? "");
      if (!montado) throw new Error("Escolha o serviço.");

      // 2. Arquivos baixados do HUB
      const guardados = [];
      const naoSubiu: string[] = [];
      for (const m of materiais) {
        const ext = m.arquivo.name.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() ?? "bin";
        const caminho = `${slug}/${id}/hub/${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(caminho, m.arquivo, { contentType: m.arquivo.type });
        if (error) naoSubiu.push(m.arquivo.name);
        else guardados.push({ id: crypto.randomUUID(), nome: m.arquivo.name, tipo: m.arquivo.type, tamanho: m.arquivo.size, caminho, origem: entrega?.origem ?? "", baixadoEm: new Date().toISOString(), por: usuario.nome });
      }
      if (guardados.length) montado.projeto.materiaisHub = guardados;

      // 3. Tudo de uma vez, para o projeto nascer já completo
      const itens = montado.itens.filter((i) => !i.aviso).map((i) => i.descricao);
      registrarEvento(montado.projeto, usuario.nome, "Projeto criado a partir do HUB", [...itens, ...avisosFinais, ...(naoSubiu.length ? [`não guardei: ${naoSubiu.join(", ")}`] : [])].join("; ") || undefined);
      atualizar((r) => {
        if (cliente) r.clientes.push(cliente);
        r.projetos.unshift(montado.projeto);
      });
      h.consumirLeitura();
      router.push(`/${slug}/projetos/${id}`);
    } catch (e) {
      setErro(traduzirErro(e, "Não foi possível criar o projeto."));
      setCriando(false);
    }
  };

  return (
    <div className="mb-8 space-y-4 rounded-[var(--radius-bloco)] border border-linha bg-pedra/60 p-3 sm:p-5" aria-label="Importar do HUB">
      <div>
        <h2 className="text-lg font-bold">Novo projeto a partir do HUB</h2>
        <p className="text-[13px] text-tinta-2">O Blimp lê o pedido, cadastra o cliente se ainda não existir, escolhe o serviço e registra o passo do HUB e o plano. Você confere antes de criar.</p>
      </div>
      {!lido ? (
        <EntradaDoHub
          h={h}
          aoCancelar={aoFechar}
          aviso="Deixe esta tela (Novo projeto) aberta aqui no Blimp, vá à página do pedido no HUB e clique no ícone da extensão em “Ler agora”."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-[15px]">{lido.resumo}</p>

          <div className="space-y-1.5 rounded-[var(--radius-campo)] bg-folha p-3 text-[14px] ring-1 ring-linha">
            <p>
              <span className="font-semibold">Cliente:</span>{" "}
              {clienteExistente ? (
                <>
                  {nomeDoCliente(clienteExistente)} <span className="text-tinta-2">(já cadastrado)</span>
                </>
              ) : cadastrarCliente ? (
                <>
                  {ident?.empresa || "Empresa do pedido"} · {formatarCnpj(cnpjLido)} <span className="text-tinta-2">(será cadastrado com os dados da Receita Federal)</span>
                </>
              ) : (
                <span className="text-laranja">não encontrei o CNPJ no conteúdo. Escolha um cliente já cadastrado:</span>
              )}
            </p>
            {semCliente && (
              <Campo rotulo="Cliente">
                <select className="campo" value={clienteEscolhido} onChange={(e) => setClienteEscolhido(e.target.value)}>
                  <option value="">Escolha…</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {nomeDoCliente(c)}
                    </option>
                  ))}
                </select>
              </Campo>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo rotulo="Serviço" dica={servicoDaIA ? "Reconhecido pelo nome do serviço no HUB." : ident?.servico ? `No HUB: ${ident.servico}. Confira e escolha.` : undefined}>
                <select className="campo" value={modeloId} onChange={(e) => setServicoEscolhido(e.target.value)}>
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fichaTecnica}
                    </option>
                  ))}
                </select>
              </Campo>
              <div className="text-[14px]">
                <p>
                  <span className="font-semibold">Código do pedido:</span> {codigoHub || <span className="text-laranja">não encontrado</span>}
                </p>
                <p>
                  <span className="font-semibold">Gestor SEBRAE:</span> {ident?.gestor || <span className="text-tinta-2">não encontrado</span>}
                </p>
              </div>
            </div>
          </div>

          {duplicado && (
            <div role="alert" className="rounded-[var(--radius-campo)] border border-vermelho/25 bg-vermelho-claro px-3 py-2 text-[13px] text-vermelho">
              Já existe um projeto com o código {codigoHub}:{" "}
              <Link className="font-semibold underline" href={`/${slug}/projetos/${duplicado.id}`}>
                abrir o projeto
              </Link>
              . Para atualizar um projeto que já existe, use &quot;Importar do HUB&quot; dentro dele.
              <label className="mt-1.5 flex items-center gap-2">
                <input type="checkbox" checked={insistir} onChange={(e) => setInsistir(e.target.checked)} />É outro projeto, quero criar mesmo assim
              </label>
            </div>
          )}
          {passouDoLimite && (
            <p role="alert" className="rounded-[var(--radius-campo)] border border-vermelho/25 bg-vermelho-claro px-3 py-2 text-[13px] text-vermelho">
              Este cliente já tem {emAndamento} projetos em andamento, o máximo permitido.
            </p>
          )}

          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold">O projeto nasce com</h3>
            {feitos.length ? (
              <ul className="list-disc space-y-1 pl-5 text-[14px]">
                {feitos.map((i, k) => (
                  <li key={k}>{i.descricao}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-tinta-2">O projeto começa no Diagnóstico; o conteúdo não trouxe passos nem datas para registrar.</p>
            )}
            {dataDiagnostico && <p className="mt-1.5 text-[13px] text-tinta-2">Diagnóstico a partir de {dataDiagnostico.split("-").reverse().join("/")}.</p>}
          </div>
          {avisos.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold">O sistema não aplicaria</h3>
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-laranja">
                {avisos.map((i, k) => (
                  <li key={k}>{i.descricao}</li>
                ))}
              </ul>
            </div>
          )}
          {lido.nao_importado.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold">Está no HUB, mas fica com você</h3>
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-tinta-2">
                {lido.nao_importado.map((t, k) => (
                  <li key={k}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {entrega && <LidoDaPagina h={h} destino="no projeto" />}
          {erro && <p className="text-[13px] text-vermelho">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="pequeno" onClick={() => void criar()} disabled={criando || bloqueado}>
              {criando ? "Criando…" : "Criar projeto"}
            </Botao>
            <Botao variante="secundario" tamanho="pequeno" onClick={() => setLido(null)} disabled={criando}>
              Voltar
            </Botao>
            <Botao variante="fantasma" tamanho="pequeno" onClick={aoFechar} disabled={criando}>
              Cancelar
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
