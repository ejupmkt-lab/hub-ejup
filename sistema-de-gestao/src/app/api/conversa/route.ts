import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";
import type { Cliente, Etapa, Projeto, Servico } from "@/lib/dados/tipos";
import { tiposRegistro } from "@/lib/registros";
import { antesDaContratacao, comQuem, faseDoProjeto, fases, passoHubDoProjeto, passosHub } from "@/lib/fase";
import type { Anexo, ItemAcao } from "@/lib/conversa";
import { todasSecoes } from "@/lib/relatorio/secoes";
import { formatarData, hojeIso } from "@/lib/datas";
import { statusEtapa } from "@/lib/rotulos";
import { SISTEMA } from "@/lib/ia/conversa-prompt";
import { descreverErroDaIA } from "@/lib/ia/erros";
import { faltasDoDiagnostico, lerDiagnostico, secoesDoModelo } from "@/lib/diagnostico";
import { textoDoPrazo } from "@/lib/projeto";
import { textoPlano } from "@/lib/plano-texto";
import { contarAConfirmar, contarMarcadores, dataLimiteInformacoes } from "@/lib/relatorio/padroes";

// Conversa do projeto: lê a mensagem do consultor (texto, ditado, fotos e PDFs),
// responde e devolve as ações para organizar o projeto. O navegador aplica as
// ações (e guarda como desfazer). Os dados são lidos no banco com a sessão de
// quem pediu, então as regras de acesso valem aqui também.

export const maxDuration = 300;

const ESQUEMA = {
  type: "object",
  properties: {
    resposta: { type: "string" },
    acoes: {
      type: "array",
      items: {
        anyOf: [
          {
            type: "object",
            properties: {
              tipo: { type: "string", const: "marcar_atividades" },
              etapa: { type: "integer" },
              codigos: { type: "array", items: { type: "string" } },
              situacao: { type: "string", enum: ["feito", "nao_aplicavel"] },
              justificativa: { type: "string" },
            },
            required: ["tipo", "etapa", "codigos", "situacao", "justificativa"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: { tipo: { type: "string", const: "escrever_secao" }, etapa: { type: "integer" }, chave: { type: "string" }, texto: { type: "string" } },
            required: ["tipo", "etapa", "chave", "texto"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              tipo: { type: "string", const: "escrever_entregavel" },
              etapa: { type: "integer" },
              titulo: { type: "string" },
              texto: { type: "string" },
            },
            required: ["tipo", "etapa", "titulo", "texto"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              tipo: { type: "string", const: "guardar_anexo" },
              etapa: { type: "integer" },
              anexo: { type: "string" },
              legenda: { type: "string" },
            },
            required: ["tipo", "etapa", "anexo", "legenda"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              tipo: { type: "string", const: "preencher_tabela" },
              tabela: { type: "string", enum: tiposRegistro.map((t) => t.tipo) },
              linhas: { type: "array", items: { type: "array", items: { type: "string" } } },
              substituir: { type: "boolean" },
            },
            required: ["tipo", "tabela", "linhas", "substituir"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: { tipo: { type: "string", const: "escrever_diagnostico" }, anamnese: { type: "string" }, analise: { type: "string" }, parecer: { type: "string" } },
            required: ["tipo", "anamnese", "analise", "parecer"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: { tipo: { type: "string", const: "dados_do_diagnostico" }, telefone: { type: "string" }, email: { type: "string" }, data: { type: "string" } },
            required: ["tipo", "telefone", "email", "data"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: { tipo: { type: "string", const: "guardar_evidencia_diagnostico" }, anexo: { type: "string" }, legenda: { type: "string" } },
            required: ["tipo", "anexo", "legenda"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: { tipo: { type: "string", const: "definir_cronograma" }, inicio: { type: "string" }, fim: { type: "string" } },
            required: ["tipo", "inicio", "fim"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              tipo: { type: "string", const: "alterar_plano_hub" },
              etapa: { type: "integer" },
              inicio: { type: "string", format: "date" },
              fim: { type: "string", format: "date" },
              justificativa: { type: "string" },
            },
            required: ["tipo", "etapa", "inicio", "fim", "justificativa"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              tipo: { type: "string", const: "alterar_datas_etapa" },
              etapa: { type: "integer" },
              inicio: { type: "string", format: "date" },
              fim: { type: "string", format: "date" },
              justificativa: { type: "string" },
            },
            required: ["tipo", "etapa", "inicio", "fim", "justificativa"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              tipo: { type: "string", const: "registrar_assinatura" },
              etapa: { type: "integer" },
              anexo: { type: "string" },
              data_consultor: { type: "string" },
              data_cliente: { type: "string" },
            },
            required: ["tipo", "etapa", "anexo", "data_consultor", "data_cliente"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              tipo: { type: "string", const: "mudar_situacao_etapa" },
              etapa: { type: "integer" },
              situacao: { type: "string", enum: ["a_enviar", "enviada", "aprovada", "devolvida"] },
              observacao: { type: "string" },
            },
            required: ["tipo", "etapa", "situacao", "observacao"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              tipo: { type: "string", const: "avancar_hub" },
              passo: { type: "string", enum: ["diagnostico", "diagnostico_enviado", "proposta", "proposta_funcern", "proposta_cliente", "execucao", "finalizado", "avaliado", "concluido"] },
              data: { type: "string", format: "date" },
            },
            required: ["tipo", "passo", "data"],
            additionalProperties: false,
          },
        ],
      },
    },
  },
  required: ["resposta", "acoes"],
  additionalProperties: false,
} as const;

type Linha = { id: string; papel: string; texto: string; anexos: Anexo[]; acoes: ItemAcao[]; desfeita: boolean; created_at: string };

export async function POST(req: Request) {
  const sb = await supabaseServidor();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessão expirada. Entre de novo." }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json(
      {
        erro: "A IA ainda não foi ativada no servidor: falta cadastrar a chave da API da Anthropic na Vercel. A sua mensagem ficou guardada; depois é só tentar de novo.",
      },
      { status: 503 },
    );

  const pedido = (await req.json().catch(() => null)) as { projetoId?: string; mensagemId?: string } | null;
  if (!pedido?.projetoId || !pedido.mensagemId) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });

  const { data: linhaProjeto } = await sb.from("projetos").select("dados, cliente_id").eq("id", pedido.projetoId).maybeSingle();
  if (!linhaProjeto) return NextResponse.json({ erro: "Projeto não encontrado." }, { status: 404 });
  const projeto = linhaProjeto.dados as Projeto;
  const { data: linhaCliente } = await sb.from("clientes").select("dados").eq("id", linhaProjeto.cliente_id).maybeSingle();
  const cliente = (linhaCliente?.dados ?? {}) as Partial<Cliente>;
  const { data: linhaServico } = await sb.from("servicos").select("dados").eq("id", projeto.modeloId).maybeSingle();
  const preDiagnostico = ((linhaServico?.dados ?? {}) as Partial<Servico>).preDiagnostico ?? [];
  // O e-mail do consultor do projeto é o que sai no quadro de assinatura do diagnóstico, se ninguém informar outro
  const { data: perfilConsultor } = await sb.from("perfis").select("email").eq("id", projeto.consultorId).maybeSingle();
  const emailDoConsultor = perfilConsultor?.email ?? "";

  const { data: ultimas } = await sb
    .from("mensagens_projeto")
    .select("id, papel, texto, anexos, acoes, desfeita, created_at")
    .eq("projeto_id", pedido.projetoId)
    .order("created_at", { ascending: false })
    .limit(30);
  const conversa = ((ultimas ?? []) as unknown as Linha[]).reverse();
  const atual = conversa.find((m) => m.id === pedido.mensagemId && m.papel === "usuario");
  if (!atual) return NextResponse.json({ erro: "Mensagem não encontrada." }, { status: 404 });
  const anteriores = conversa.filter((m) => m.created_at < atual.created_at);

  // Anexos da mensagem atual vão para a IA: imagens e PDFs
  const blocos: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const anexo of atual.anexos) {
    const { data: arquivo } = await sb.storage.from("evidencias").download(anexo.caminho);
    if (!arquivo) continue;
    const base64 = Buffer.from(await arquivo.arrayBuffer()).toString("base64");
    blocos.push({ type: "text", text: `Anexo id="${anexo.id}" (${anexo.nome}):` });
    if (anexo.tipo === "application/pdf") blocos.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } });
    else if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(anexo.tipo))
      blocos.push({ type: "image", source: { type: "base64", media_type: anexo.tipo as "image/jpeg", data: base64 } });
  }

  const historico = anteriores.length
    ? anteriores
        .map((m) =>
          [
            `[${m.created_at.slice(0, 16).replace("T", " ")}] ${m.papel === "usuario" ? "Consultor" : "Assistente"}: ${m.texto || "(sem texto)"}`,
            m.anexos.length ? `(anexos: ${m.anexos.map((a) => a.nome).join(", ")})` : "",
            m.acoes.length
              ? `(${m.desfeita ? "alterações desfeitas pelo consultor" : "resultado"}: ${m.acoes.map((a) => (a.aviso ? `NÃO FEITO: ${a.descricao}` : a.descricao)).join("; ")})`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n")
    : "(primeira mensagem)";

  const client = new Anthropic();
  const pedidoParaIA: Anthropic.Beta.MessageCreateParamsNonStreaming = {
    model: "claude-opus-5-5",
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: ESQUEMA } },
    system: SISTEMA,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `<projeto>\n${contextoDoProjeto(projeto, cliente, preDiagnostico, emailDoConsultor)}\n</projeto>\n\n<conversa_anterior>\n${historico}\n</conversa_anterior>`,
          },
          { type: "text", text: `<mensagem_atual>\n${atual.texto || "(sem texto, só anexos)"}\n</mensagem_atual>` },
          ...blocos,
        ],
      },
    ],
  };

  // A resposta vai em fluxo (uma linha JSON por evento): "vivo" e "progresso" mantêm a conexão aberta e deixam o navegador
  // mostrar que a IA está escrevendo; "fim" traz o resultado e "erro", o problema explicado. Mensagens longas levavam minutos
  // sem nenhum sinal; assim a conexão não fica muda e o erro não se perde.
  const codificar = new TextEncoder();
  const corpo = new ReadableStream<Uint8Array>({
    async start(controle) {
      const enviar = (evento: Record<string, unknown>) => {
        try {
          controle.enqueue(codificar.encode(`${JSON.stringify(evento)}\n`));
        } catch {
          // o navegador desistiu da conversa: nada a enviar
        }
      };
      let caracteres = 0;
      let ultimoAviso = 0;
      const batida = setInterval(() => enviar({ tipo: "vivo" }), 10_000);
      try {
        const fluxo = client.beta.messages.stream(pedidoParaIA);
        fluxo.on("text", (trecho) => {
          caracteres += trecho.length;
          if (Date.now() - ultimoAviso > 2000) {
            ultimoAviso = Date.now();
            enviar({ tipo: "progresso", caracteres });
          }
        });
        const resposta = await fluxo.finalMessage();
        if (resposta.stop_reason === "refusal")
          return enviar({ tipo: "erro", erro: "A IA não conseguiu tratar esta mensagem. Reformule ou registre direto na etapa.", tipoDoErro: "recusa", http: 422 });
        if (resposta.stop_reason === "max_tokens")
          return enviar({ tipo: "erro", erro: "A resposta ficou longa demais. Mande o conteúdo em partes menores.", tipoDoErro: "tempo", http: 422 });
        const texto = resposta.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
        const json = JSON.parse(texto) as { resposta: string; acoes: unknown[] };
        enviar({ tipo: "fim", resposta: json.resposta, acoes: json.acoes });
      } catch (e) {
        const erro = descreverErroDaIA(e);
        // O que o provedor respondeu fica no registro do servidor (nunca a chave nem o conteúdo da conversa)
        console.error("[conversa] erro da IA", { tipo: erro.tipo, status: erro.status, requestId: erro.requestId, detalhe: erro.detalhe, corpo: corpoDoErro(e) });
        enviar({ tipo: "erro", erro: erro.mensagem, tipoDoErro: erro.tipo, status: erro.status, http: erro.http });
      } finally {
        clearInterval(batida);
        controle.close();
      }
    },
  });
  return new Response(corpo, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform" } });
}

// Corpo da resposta de erro do provedor, curto, para o registro do servidor
function corpoDoErro(e: unknown) {
  try {
    const corpo = (e as { error?: unknown }).error;
    return JSON.stringify(corpo ?? null).slice(0, 1000);
  } catch {
    return null;
  }
}

// Tudo o que a IA precisa saber do projeto: cliente, etapas, checklist, modelo
// do relatório (seções e entregáveis, com o texto atual) e o que já foi registrado
function contextoDoProjeto(p: Projeto, c: Partial<Cliente>, preDiagnostico: string[], emailDoConsultor = "") {
  const linha = (rotulo: string, valor?: string | null) => (valor?.trim() ? `${rotulo}: ${valor.trim()}` : null);
  const concluida = (e: Etapa) => e.status === "enviada" || e.status === "aprovada";
  const emCurso = p.etapas.find((e) => !concluida(e));
  const partes: (string | null)[] = [
    `Hoje: ${hojeIso()} (datas no formato AAAA-MM-DD)`,
    "",
    "## Cliente",
    linha("Razão social", c.razaoSocial),
    linha("Nome fantasia", c.nomeFantasia),
    linha("Ramo", c.ramo),
    linha("Produtos e serviços", c.produtosServicos),
    linha("Porte", c.porte),
    linha("Cidade", c.cidadeUf),
    linha("Responsável", [c.responsavel, c.cargoResponsavel].filter(Boolean).join(", ")),
    "",
    "## Projeto",
    `Serviço: ${p.fichaTecnica} (ficha técnica ${p.codigoFichaTecnica})`,
    linha("Código do pedido no HUB", p.codigoSolicitacaoHub || p.numeroProjetoHub),
    `Etapa do HUB: ${fases[faseDoProjeto(p)].numero} ${fases[faseDoProjeto(p)].rotulo}; passo atual: "${passoHubDoProjeto(p)}" (${passosHub[passoHubDoProjeto(p)].rotulo}${comQuem(p) ? `; com quem está: ${comQuem(p)}` : ""})${antesDaContratacao(p) ? ", antes da contratação" : ""}`,
    preDiagnostico.length ? `Perguntas do pré-diagnóstico da ficha:\n${preDiagnostico.map((q, i) => `${i + 1}. ${q}`).join("\n")}` : null,
    `Plano de trabalho: ${p.planoFechadoEm ? "definido" : "ainda não definido"}`,
    p.planoFechadoEm ? `Mensagem do plano de trabalho (pronta para enviar à FUNCERN, no formato do WhatsApp, com as datas do plano do HUB):\n${textoPlano(p, c as Cliente)}` : null,
    `Etapa em curso: ${emCurso ? `${emCurso.ordem} (${emCurso.nome})` : "todas enviadas"}; o serviço tem ${p.etapas.length} etapas`,
    `Marcadores [completar] abertos em todo o projeto: ${p.etapas.reduce((a, e) => a + contarMarcadores(e), 0)}; evidências (imagens) anexadas em todo o projeto: ${p.etapas.reduce((a, e) => a + (e.evidencias ?? []).length, 0)}`,
  ];
  for (const e of p.etapas) {
    const editavel = !concluida(e);
    partes.push(
      "",
      `## Etapa ${e.ordem}: ${e.nome} (${statusEtapa[e.status].rotulo}${editavel ? "" : ", NÃO ALTERAR"})`,
      e.descricao,
      `Execução prevista: ${e.dataInicio && e.dataFim ? `${e.dataInicio} a ${e.dataFim}` : "a definir"}; plano do HUB: ${e.dataInicioPlano && e.dataFimPlano ? `${e.dataInicioPlano} a ${e.dataFimPlano}` : "a definir"}${e.enviadaEm ? `; enviada no HUB em ${e.enviadaEm}` : ""}${textoDoPrazo(e) ? `; ${textoDoPrazo(e)}` : ""} (duração de referência: ${e.duracaoReferenciaDias} dias). Horas da etapa: ${e.horasPrevistas} h (cumpridas quando a etapa é enviada no HUB).`,
      `Assinaturas do relatório: consultor ${e.assinaturaConsultor ?? "pendente"}, cliente ${e.assinaturaCliente ?? "pendente"}${e.relatorioAssinado ? `; PDF assinado guardado (${e.relatorioAssinado.nome})` : ""}.`,
      `Datas do relatório: fechamento ${e.dataRelatorio ?? "não definida"}; data-limite das informações ${dataLimiteInformacoes(e) ?? "não definida"}${e.dataRelatorio && dataLimiteInformacoes(e) && dataLimiteInformacoes(e)! < e.dataRelatorio ? " (anterior ao fechamento: diga isso em \"Escopo, metodologia e limitações\")" : ""}.`,
      `Marcadores abertos nesta etapa: ${contarMarcadores(e)} [completar] e ${contarAConfirmar(e)} [a confirmar]; evidências (imagens) anexadas: ${(e.evidencias ?? []).length}; ${p.etapas.length === e.ordem ? "última etapa do serviço (não existe etapa seguinte)" : `próxima etapa: ${e.ordem + 1}`}.`,
      "Checklist (código, texto, situação):",
      ...e.atividades.map(
        (a) => `- ${a.codigo} ${a.texto}: ${a.status === "feito" ? "feito" : a.status === "nao_aplicavel" ? `não se aplica (${a.justificativa})` : "pendente"}`,
      ),
      "Seções do relatório (chave, título, orientação, texto atual):",
      ...todasSecoes.map((d) => {
        const atual = (e.secoes[d.chave] ?? "").trim();
        return `<secao chave="${d.chave}" titulo="${d.titulo(e, p.etapas.length === e.ordem)}">\nOrientação: ${d.ajuda}\nTexto atual: ${atual ? (editavel ? `\n${atual}` : `(${atual.length} caracteres)`) : "(em branco)"}\n</secao>`;
      }),
      "Entregáveis e instrumentos (título exato, texto atual):",
      ...e.entregaveis.map((x) => {
        const atual = x.conteudo.trim();
        return `<entregavel titulo="${x.titulo}">\n${atual ? (editavel ? atual : `(${atual.length} caracteres)`) : "(em branco)"}\n</entregavel>`;
      }),
      `Evidências guardadas: ${(e.evidencias ?? []).length ? (e.evidencias ?? []).map((x) => x.legenda).join("; ") : "nenhuma"}`,
    );
  }
  // Diagnóstico do projeto (modelo do SEBRAE): os três textos atuais, as evidências guardadas e o que ainda falta
  const dg = lerDiagnostico(p);
  partes.push("", "## Diagnóstico");
  for (const s of secoesDoModelo) partes.push(`${s.numero}. ${s.titulo}: ${dg[s.chave].trim() ? `\n<texto>\n${dg[s.chave].trim()}\n</texto>` : "(em branco)"}`);
  partes.push(`Evidências guardadas: ${dg.evidencias.length ? dg.evidencias.map((e, i) => `0${i + 1} – ${e.legenda}`).join("; ") : "nenhuma"}`);
  partes.push(dg.arquivo ? `Arquivo do diagnóstico anexado em Entregas: ${dg.arquivo.nome}.` : "Nenhum arquivo do diagnóstico anexado em Entregas.");
  partes.push(`Quadro de assinatura do Word: telefone do prestador ${dg.telefone?.trim() || "(não informado)"}; e-mail do prestador ${dg.email?.trim() || (emailDoConsultor ? `(não informado; sai o do consultor, ${emailDoConsultor})` : "(não informado)")}; data do documento ${dg.dataDoDocumento ? formatarData(dg.dataDoDocumento) : "(não informada; sai o dia em que o Word é gerado)"}.`);
  const faltas = faltasDoDiagnostico(p, c, emailDoConsultor);
  partes.push(faltas.length ? `O que ainda falta para o diagnóstico ficar completo: ${faltas.join("; ")}.` : "O diagnóstico tem tudo o que o modelo pede.");
  // Tabelas do relatório (marcador [[tabela:tipo]] no texto), com as linhas atuais
  partes.push("", "## Tabelas do relatório (tipo: nome; colunas na ordem)");
  for (const t of tiposRegistro) {
    const linhas = p.registros.filter((r) => r.tipo === t.tipo);
    partes.push(`- ${t.tipo}: ${t.nome}; colunas: ${t.colunas.map((c) => c.titulo).join(" | ")}; ${linhas.length} ${linhas.length === 1 ? "linha" : "linhas"}`);
    for (const r of linhas) partes.push(`  ${r.codigo}: ${t.colunas.map((c) => r.dados[c.chave] || "—").join(" | ")}`);
  }
  return partes.filter((l) => l !== null).join("\n");
}
