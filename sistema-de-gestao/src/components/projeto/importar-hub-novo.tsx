"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Cliente, EmpresaSlug } from "@/lib/dados/tipos";
import { novoId, registrarEvento, useEstado, useUsuario } from "@/lib/dados/store";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { aplicarAcoes, type AcaoIA } from "@/lib/conversa";
import { cnpjDoCliente, cnpjDosRelatorios, completarVazio, efetivosDoHub, montarAcoes, pendenciasDoHub, type Completar, type RespostaImportacao } from "@/lib/hub-importar";
import { carimbarInicios, reencadearExecucao } from "@/lib/fase";
import { montarProjeto } from "@/lib/projeto-novo";
import { servicosDaEmpresa } from "@/lib/servicos";
import { LIMITE_PROJETOS_CLIENTE } from "@/lib/projeto";
import { camposCliente, nomeDoCliente } from "@/lib/campos-cliente";
import { dadosDaEmpresa, formatarCnpj, type DadosCnpj } from "@/lib/cnpj";
import { traduzirErro } from "@/lib/erros";
import { Botao, Campo } from "@/components/ui";
import { registrarDocumentosNoHistorico } from "@/lib/hub-documentos";
import { registrarLinhaDoTempoDoHub } from "@/lib/hub-historico";
import type { PendenteDoHub } from "@/lib/hub-extensao";
import { CompletarDados, DatasDosRelatorios, DocumentosDoHub, EntradaDoHub, LidoDaPagina, relatoriosDasEtapas, useLeituraHub } from "./hub-leitura";

const BUCKET = "evidencias";
const digitos = (t: string) => (t ?? "").replace(/\D/g, "");
const vazioCliente = Object.fromEntries(camposCliente.map((c) => [c.chave, ""])) as Record<string, string>;

// Novo projeto a partir do HUB: o consultor lê a página do pedido (extensão, texto colado, print ou PDF) e o
// Blimp mostra o cliente, o serviço e os passos que achou. Ao confirmar, cadastra o cliente (se ainda não existir,
// pelos dados da Receita), cria o projeto já no passo certo do HUB e guarda os arquivos baixados.
//
// No lote ("Ler todos os projetos da lista"), `inicial` traz o pedido já lido pela extensão; com `automatico`, o projeto é
// criado sozinho quando não falta nada que só a pessoa saiba (CNPJ, serviço reconhecido, sem código repetido).
export function ImportarHubNovo({
  slug,
  aoFechar,
  inicial,
  automatico = false,
  aoCriado,
  rotuloFechar = "Cancelar",
}: {
  slug: EmpresaSlug;
  aoFechar: () => void;
  inicial?: PendenteDoHub;
  automatico?: boolean;
  aoCriado?: (projetoId: string) => void;
  rotuloFechar?: string;
}) {
  const { estado, atualizar } = useEstado();
  const usuario = useUsuario();
  const router = useRouter();
  const [lido, setLido] = useState<RespostaImportacao | null>(null);
  const [c, setC] = useState<Completar>(completarVazio);
  const [servicoEscolhido, setServicoEscolhido] = useState<string | null>(null);
  const [clienteEscolhido, setClienteEscolhido] = useState("");
  // Quando o CNPJ não aparece no que foi lido, o consultor digita
  const [cnpjDigitado, setCnpjDigitado] = useState("");
  const [insistir, setInsistir] = useState(false);
  const [criando, setCriando] = useState(false);
  const h = useLeituraHub({
    campos: () => ({ modo: "novo", empresa: slug }),
    codigoParaPuxar: "",
    aoLer: (r) => {
      setLido(r);
      setC(completarVazio);
      setServicoEscolhido(null);
      setClienteEscolhido("");
      setCnpjDigitado("");
      setInsistir(false);
    },
    aoReceber: () => setLido(null),
    // Só se consome o que a extensão guardou quando o projeto é criado
    consumirAoLer: false,
    ignorarExtensao: !!inicial,
  });
  const { materiais, entrega, erro, setErro, leituras } = h;
  // Pedido do lote: entra na leitura (e a IA lê) assim que o painel abre
  const comecou = useRef(false);
  useEffect(() => {
    if (!inicial || comecou.current) return;
    comecou.current = true;
    void h.receber(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // O CNPJ vem da leitura da página; se a IA não o achou lá, dos relatórios das etapas ou do balão do cliente nos envolvidos
  const cnpjDaIA = digitos(ident?.cnpj ?? "");
  const empresaLida = ident?.empresa?.trim() || Object.values(leituras).map((l) => ("empresa" in l ? l.empresa?.trim() : "") ?? "").find(Boolean) || "";
  const cnpjDoHub = cnpjDaIA.length === 14 ? cnpjDaIA : cnpjDosRelatorios(leituras) || cnpjDoCliente(h.texto) || cnpjDaIA;
  const cnpjLido = cnpjDoHub.length === 14 ? cnpjDoHub : digitos(cnpjDigitado);
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

  // Relatórios por etapa (o primeiro PDF do cartão de cada etapa no HUB) e o que o consultor completou
  const relFiles = useMemo(() => relatoriosDasEtapas(materiais), [materiais]);
  const relPrevia = useMemo(() => Object.fromEntries(Object.entries(relFiles).map(([e, f]) => [Number(e), { caminho: "previa", nome: f.name }])), [relFiles]);
  const totalEtapas = modelo?.etapas.length ?? 0;
  const pend = lido ? pendenciasDoHub(lido, null, leituras, totalEtapas, Object.keys(relFiles).map(Number)) : null;
  const ef = lido ? efetivosDoHub(lido, null, c, leituras, totalEtapas, Object.keys(relFiles).map(Number)) : null;
  // Ações da importação: o diagnóstico define a data do começo do projeto; código e gestor entram na criação
  const dataDiagnostico = (lido?.acoes as { tipo?: string; passo?: string; data?: string }[] | undefined)?.find((a) => a?.tipo === "avancar_hub" && a.passo === "diagnostico")?.data;
  const acoes = lido ? montarAcoes(lido, false, c, null, relPrevia, false, leituras, totalEtapas) : [];
  const etapasComRelatorio = new Set(acoes.flatMap((a) => (a.tipo === "registrar_envio_etapa" && a.relatorio ? [a.etapa] : [])));
  const paraMateriais = materiais.filter((m) => !(m.etapa > 0 && relFiles[m.etapa] === m.arquivo && etapasComRelatorio.has(m.etapa)));

  // O projeto como ficaria, para a prévia (cópia): passos e plano aplicados pelas mesmas regras da conversa
  const montar = (id: string, clienteId: string, ramo: string, acoesUsar: AcaoIA[] = acoes) => {
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
    const resultado = aplicarAcoes(p, acoesUsar, [], `hub-${id}`, usuario.nome);
    carimbarInicios(p, antes);
    reencadearExecucao(p);
    return { projeto: p, itens: resultado.itens };
  };
  const previa = lido ? montar("previa", clienteExistente?.id ?? "previa", clienteExistente?.ramo ?? "") : null;
  const feitos = previa?.itens.filter((i) => !i.aviso) ?? [];
  const avisos = previa?.itens.filter((i) => i.aviso) ?? [];
  const bloqueado = !modelo || semCliente || passouDoLimite || (!!duplicado && !insistir);
  // Criação automática: só sem nada que dependa de uma decisão da pessoa
  const motivosParaRevisar = [
    !servicoDaIA && "não reconheci o serviço pelo nome no HUB (escolha abaixo)",
    semCliente && "não encontrei o CNPJ do cliente (digite abaixo)",
    !!duplicado && !insistir && `já existe um projeto com o código ${codigoHub}`,
    passouDoLimite && "o cliente já está no limite de projetos em andamento",
  ].filter((m): m is string => !!m);
  const lendoAinda = h.lendo || h.puxando || !!h.lendoRelatorios;

  const jaCriou = useRef(false);
  const criar = async () => {
    if (!lido || !modelo || bloqueado || criando || jaCriou.current) return;
    jaCriou.current = true;
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
          if (r.ok) receita = dadosDaEmpresa((await r.json()) as DadosCnpj);
          else avisosFinais.push("a consulta do CNPJ na Receita falhou; o cadastro do cliente ficou só com o que veio do HUB");
        } catch {
          avisosFinais.push("a consulta do CNPJ na Receita falhou; o cadastro do cliente ficou só com o que veio do HUB");
        }
        const nomeHub = empresaLida;
        clienteId = novoId("cli");
        cliente = {
          ...(vazioCliente as unknown as Cliente),
          ...(Object.fromEntries(Object.entries(receita).filter(([, v]) => v)) as unknown as Partial<Cliente>),
          id: clienteId,
          empresa: slug,
          cnpj: formatarCnpj(cnpjLido),
          razaoSocial: receita.razaoSocial || nomeHub || "Cliente do HUB",
          // Responsável e contato só vêm do HUB ou do que a pessoa informar; os da Receita são dado pessoal a conferir
          responsavel: ident?.contato_nome?.trim() || "A definir",
          email: ident?.contato_email?.trim() || "",
          telefone: ident?.contato_telefone?.trim() || "",
        };
        if (!ident?.contato_nome?.trim()) avisosFinais.push("o responsável do cliente não veio do HUB: complete em Clientes (a Receita Federal traz só sugestões, que precisam ser conferidas com o cliente)");
      }
      const id = novoId("prj");
      // 2. Relatórios das etapas, direto em Entregas, e os demais arquivos baixados do HUB
      const naoSubiu: string[] = [];
      const relatorios: Record<number, { caminho: string; nome: string }> = {};
      for (const etapa of etapasComRelatorio) {
        const arquivo = relFiles[etapa];
        const caminho = `${slug}/${id}/${etapa}/assinado-${crypto.randomUUID()}.pdf`;
        const { error } = await sb.storage.from(BUCKET).upload(caminho, arquivo, { contentType: "application/pdf" });
        if (error) naoSubiu.push(arquivo.name);
        else relatorios[etapa] = { caminho, nome: arquivo.name };
      }
      const acoesFinais = montarAcoes(lido, false, c, null, relatorios, false, leituras, totalEtapas);
      const montado = montar(id, clienteId, cliente?.ramo ?? clienteExistente?.ramo ?? "", acoesFinais);
      if (!montado) throw new Error("Escolha o serviço.");
      const guardados = [];
      for (const m of paraMateriais) {
        const ext = m.arquivo.name.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() ?? "bin";
        const caminho = `${slug}/${id}/hub/${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(caminho, m.arquivo, { contentType: m.arquivo.type });
        if (error) naoSubiu.push(m.arquivo.name);
        else guardados.push({ id: crypto.randomUUID(), nome: m.arquivo.name, tipo: m.arquivo.type, tamanho: m.arquivo.size, caminho, origem: entrega?.origem ?? "", baixadoEm: new Date().toISOString(), por: usuario.nome });
      }
      if (guardados.length) montado.projeto.materiaisHub = guardados;

      // 3. Tudo de uma vez, para o projeto nascer já completo
      const itens = montado.itens.filter((i) => !i.aviso).map((i) => i.descricao);
      registrarDocumentosNoHistorico(montado.projeto, usuario.nome, lido.documentos, [...guardados.map((g) => g.nome), ...Object.values(relatorios).map((r) => r.nome)]);
      registrarLinhaDoTempoDoHub(montado.projeto, usuario.nome, acoesFinais, leituras);
      registrarEvento(montado.projeto, usuario.nome, "Projeto criado a partir do HUB", [...itens, ...avisosFinais, ...(naoSubiu.length ? [`não guardei: ${naoSubiu.join(", ")}`] : [])].join("; ") || undefined);
      atualizar((r) => {
        if (cliente) r.clientes.push(cliente);
        r.projetos.unshift(montado.projeto);
      });
      h.consumirLeitura();
      if (aoCriado) aoCriado(id);
      else router.push(`/${slug}/projetos/${id}`);
    } catch (e) {
      jaCriou.current = false;
      setErro(traduzirErro(e, "Não foi possível criar o projeto."));
      setCriando(false);
    }
  };
  // Automático: cria quando a leitura terminou e nada pede a pessoa
  const criarDeNovo = useRef(criar);
  useEffect(() => {
    criarDeNovo.current = criar;
  });
  const podeSozinho = automatico && !!lido && !lendoAinda && !criando && !erro && motivosParaRevisar.length === 0;
  useEffect(() => {
    if (podeSozinho) void criarDeNovo.current();
  }, [podeSozinho]);

  return (
    <div className="mb-8 space-y-4 rounded-[var(--radius-bloco)] border border-linha bg-pedra/60 p-3 sm:p-5" aria-label="Importar do HUB">
      <div>
        <h2 className="text-lg font-bold">Novo projeto a partir do HUB</h2>
        <p className="text-[13px] text-tinta-2">O Blimp lê o pedido, cadastra o cliente se ainda não existir, escolhe o serviço e registra o passo do HUB e o plano. Você confere antes de criar.</p>
      </div>
      {inicial && !lido && !erro && <p className="text-[13px] font-semibold text-azul">Lendo o pedido {entrega?.titulo ? `“${entrega.titulo.slice(0, 50)}”` : ""} e criando o projeto…</p>}
      {inicial && !lido && erro && (
        <div className="space-y-2">
          <p role="alert" className="text-[13px] text-vermelho">
            {erro}
          </p>
          <Botao variante="fantasma" tamanho="pequeno" onClick={aoFechar}>
            {rotuloFechar}
          </Botao>
        </div>
      )}
      {inicial && !lido ? null : !lido ? (
        <EntradaDoHub
          h={h}
          aoCancelar={aoFechar}
          aviso="Deixe esta tela (Novo projeto) aberta aqui no Blimp, vá à página do pedido no HUB e clique no ícone da extensão em “Ler agora”."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-[15px]">{lido.resumo}</p>
          {automatico && motivosParaRevisar.length > 0 && (
            <p role="alert" className="rounded-[var(--radius-campo)] border border-laranja/30 bg-laranja-claro px-3 py-2 text-[13px] text-laranja">
              Preciso de você neste pedido: {motivosParaRevisar.join("; ")}. Assim que você resolver, o projeto é criado sozinho; ou pule para o próximo.
            </p>
          )}

          <div className="space-y-1.5 rounded-[var(--radius-campo)] bg-folha p-3 text-[14px] ring-1 ring-linha">
            <p>
              <span className="font-semibold">Cliente:</span>{" "}
              {clienteExistente ? (
                <>
                  {nomeDoCliente(clienteExistente)} <span className="text-tinta-2">(já cadastrado)</span>
                </>
              ) : cadastrarCliente ? (
                <>
                  {empresaLida || "Empresa do pedido"} · {formatarCnpj(cnpjLido)} <span className="text-tinta-2">(será cadastrado com os dados da Receita Federal)</span>
                </>
              ) : (
                <span className="text-laranja">não encontrei o CNPJ no conteúdo{empresaLida ? ` (empresa: ${empresaLida})` : ""}. Digite o CNPJ para cadastrar{clientes.length ? " ou escolha um cliente já cadastrado" : ""}:</span>
              )}
            </p>
            {cnpjDoHub.length !== 14 && !clienteDoCnpj && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="CNPJ do cliente" dica={cnpjDigitado && !cnpjValido ? "Digite os 14 números do CNPJ." : undefined}>
                  <input className="campo num" inputMode="numeric" placeholder="00.000.000/0000-00" value={cnpjDigitado} onChange={(e) => setCnpjDigitado(formatarCnpj(e.target.value))} />
                </Campo>
                {clientes.length > 0 && !cnpjValido && (
                  <Campo rotulo="Ou cliente já cadastrado">
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
              </div>
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

          <DatasDosRelatorios h={h} />
          {pend && ef && <CompletarDados pend={pend} ef={ef} c={c} setC={setC} relatorios={relFiles} />}

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
          {entrega && <LidoDaPagina h={h} destino="no projeto" totalEtapas={totalEtapas} emEntregas={(m) => (m.etapa > 0 && relFiles[m.etapa] === m.arquivo && etapasComRelatorio.has(m.etapa) ? m.etapa : 0)} />}
          <DocumentosDoHub documentos={lido.documentos} nomesBaixados={materiais.map((m) => m.arquivo.name)} />
          {erro && <p className="text-[13px] text-vermelho">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="pequeno" onClick={() => void criar()} disabled={criando || bloqueado}>
              {criando ? "Criando…" : "Criar projeto"}
            </Botao>
            {!inicial && (
              <Botao variante="secundario" tamanho="pequeno" onClick={() => setLido(null)} disabled={criando}>
                Voltar
              </Botao>
            )}
            <Botao variante="fantasma" tamanho="pequeno" onClick={aoFechar} disabled={criando}>
              {rotuloFechar}
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
