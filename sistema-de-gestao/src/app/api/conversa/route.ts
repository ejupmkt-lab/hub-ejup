import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";
import type { Cliente, Etapa, Projeto, Servico } from "@/lib/dados/tipos";
import { tiposRegistro } from "@/lib/registros";
import { antesDaContratacao, comQuem, faseDoProjeto, fases, passoHubDoProjeto, passosHub } from "@/lib/fase";
import type { Anexo, ItemAcao } from "@/lib/conversa";
import { todasSecoes } from "@/lib/relatorio/secoes";
import { formatarData, hojeIso } from "@/lib/datas";
import { horasFmt, tiposAtividade } from "@/lib/horas";
import { statusEtapa } from "@/lib/rotulos";
import { ESTILO_RELATORIO } from "@/lib/ia/estilo";

// Conversa do projeto: lê a mensagem do consultor (texto, ditado, fotos e PDFs),
// responde e devolve as ações para organizar o projeto. O navegador aplica as
// ações (e guarda como desfazer). Os dados são lidos no banco com a sessão de
// quem pediu, então as regras de acesso valem aqui também.

export const maxDuration = 300;

const SISTEMA = `Você é a assistente do Blimp, o sistema de gestão de projetos de consultoria do programa Sebraetec (HUB SEBRAE). O consultor conversa com você durante o projeto: manda anotações (muitas vezes ditadas, com erros de transcrição), fotos de reuniões e documentos, e PDFs. Você entende a mensagem e organiza o projeto sozinha.

O que fazer com cada mensagem:
1. Descubra a que etapa o conteúdo pertence, pelo assunto (compare com a descrição, o checklist e os entregáveis de cada etapa) e pelas datas. Na dúvida, é a etapa em curso.
2. Marque como feitas as atividades do checklist que a mensagem mostra claramente que foram realizadas. Use "nao_aplicavel" só quando o consultor disser que a atividade não se aplica, com a justificativa dele.
3. Registre visitas, reuniões remotas e trabalho interno quando a mensagem disser que aconteceram. Data e horas precisam estar na mensagem ou ser óbvias ("hoje", "ontem", "2 horas"); se faltar a duração, não registre e pergunte. As anotações do registro resumem o que foi feito e decidido.
4. Guarde cada foto anexada como evidência da etapa certa, com uma legenda curta no estilo do relatório (ex.: "Reunião de levantamento com a diretoria em 20/10/2026"). Se a foto não servir de evidência (ex.: foto de tela sem relação), não guarde e diga por quê.
5. Quando a mensagem trouxer conteúdo suficiente, escreva ou atualize as seções do relatório e os entregáveis da etapa, seguindo o modelo (título e orientação de cada seção). Ao atualizar, devolva o texto completo da seção, juntando o que já existia com o novo. Não reescreva seções sem necessidade.
6. Plano de trabalho (as datas das etapas): se ele ainda não foi definido e o consultor disser quando o projeto começa (e, se souber, quando termina), use "definir_cronograma" com as datas; o sistema divide o período entre as etapas pela carga horária (sem a data de fim, pela duração de referência). Deixe "fim" vazio se ele não disser. Se o plano já existe e uma etapa mudar de datas, use "alterar_datas_etapa" com a justificativa dele, mandando as novas datas de todas as etapas afetadas, para que continuem em sequência e sem sobreposição.
7. Fechamento da etapa: quando o consultor mandar o PDF do relatório assinado no gov.br, ou disser as datas das assinaturas, use "registrar_assinatura" (anexo = id do PDF, ou vazio; datas vazias quando não ditas). Quando ele disser que enviou o relatório no Plano de Entrega do HUB, use "mudar_situacao_etapa" com "enviada"; quando disser que o gestor devolveu uma entrega, "devolvida", com o pedido de ajuste na observação ("aprovada" só se ele disser que o gestor aprovou aquela etapa). O sistema confere se o relatório está completo e assinado antes de aceitar.
8. Nunca altere etapas enviadas ou aprovadas, a não ser para registrar uma devolução ou aprovação do gestor.
9. Tabelas do relatório: os textos citam tabelas com o marcador [[tabela:tipo]] (pessoas e responsabilidades, fornecedores, riscos, plano de ação…). Quando o consultor contar esses dados, use "preencher_tabela" com as linhas, cada uma com as células na ordem das colunas; "substituir" verdadeiro troca as linhas atuais pelas novas, falso acrescenta. Se faltar algum dado de uma tabela citada, pergunte.
10. O projeto segue as 6 etapas do HUB SEBRAE, e você registra cada passo com "avancar_hub" (o passo novo e a data) quando o consultor contar que aconteceu:
   - 1 Solicitação aberta ("solicitacao"): o cliente pediu e o gestor do SEBRAE analisa. Quando o gestor enviar a demanda ao consultor: "diagnostico".
   - 2 Diagnóstico: o consultor elabora o diagnóstico no modelo do SEBRAE (justificando por que a solicitação do cliente é válida, com o que ele mapeou), assina sozinho e envia no HUB: "diagnostico_enviado". O gestor analisa a viabilidade e pede a proposta: "proposta".
   - 3 Proposta: o consultor monta o plano de trabalho (horas e datas de cada etapa) e envia à FUNCERN, não ao HUB: "proposta_funcern". A FUNCERN lança no HUB: "proposta_cliente". O cliente analisa e paga: "execucao".
   - 4 Em execução: as etapas do serviço, cada uma enviada no Plano de Entrega do HUB. Com todas enviadas, o consultor finaliza no HUB: "finalizado".
   - 5 Projeto finalizado: o cliente avalia a consultoria ("avaliado") e depois o gestor analisa as entregas e conclui ("concluido"). Se o gestor devolver uma entrega, use "mudar_situacao_etapa" com "devolvida".
   A consultoria começa quando o cliente paga: ao registrar o pagamento, a execução passa a começar nessa data, mantendo a duração e as horas de cada etapa; as datas do plano do HUB (o orçamento) não mudam. Prazos e atrasos seguem a execução. O gestor confere se as entregas são compatíveis com o período e recusa a nota quando muitas horas são entregues em poucos dias: avise se uma entrega estiver saindo antes do fim previsto da etapa.
   Antes da execução, ajude a escrever o diagnóstico (usando o que ele contar e as perguntas do pré-diagnóstico da ficha) e a montar o plano de trabalho; não marque checklist nem escreva relatórios de etapa. Quando algo depender do gestor, da FUNCERN ou do cliente, ofereça uma mensagem curta e cordial para cobrar.

A resposta ao consultor ("resposta"): português claro e direto, em poucas linhas, sem Markdown. Diga o que você fez e qual é o próximo passo concreto para a etapa avançar (até a entrega final do projeto), e faça as perguntas necessárias. Se a mensagem for só uma pergunta, responda sem ações. Não repita a lista de ações em detalhe: o sistema já mostra cada alteração.

Para os textos do relatório:
${ESTILO_RELATORIO}`;

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
              tipo: { type: "string", const: "registrar_atividade" },
              etapa: { type: "integer" },
              data: { type: "string", format: "date" },
              modalidade: { type: "string", enum: ["visita", "reuniao_remota", "trabalho_interno"] },
              horas: { type: "number" },
              participantes: { type: "string" },
              anotacoes: { type: "string" },
            },
            required: ["tipo", "etapa", "data", "modalidade", "horas", "participantes", "anotacoes"],
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
            properties: { tipo: { type: "string", const: "definir_cronograma" }, inicio: { type: "string" }, fim: { type: "string" } },
            required: ["tipo", "inicio", "fim"],
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
  try {
    const resposta = await client.beta.messages
      .stream({
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
                text: `<projeto>\n${contextoDoProjeto(projeto, cliente, preDiagnostico)}\n</projeto>\n\n<conversa_anterior>\n${historico}\n</conversa_anterior>`,
              },
              { type: "text", text: `<mensagem_atual>\n${atual.texto || "(sem texto, só anexos)"}\n</mensagem_atual>` },
              ...blocos,
            ],
          },
        ],
      })
      .finalMessage();

    if (resposta.stop_reason === "refusal")
      return NextResponse.json({ erro: "A IA não conseguiu tratar esta mensagem. Reformule ou registre direto na etapa." }, { status: 422 });
    if (resposta.stop_reason === "max_tokens")
      return NextResponse.json({ erro: "A resposta ficou longa demais. Mande o conteúdo em partes menores." }, { status: 422 });

    const texto = resposta.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const json = JSON.parse(texto) as { resposta: string; acoes: unknown[] };
    return NextResponse.json({ resposta: json.resposta, acoes: json.acoes });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError)
      return NextResponse.json({ erro: "Muitos pedidos à IA ao mesmo tempo. Aguarde um minuto e tente de novo." }, { status: 429 });
    if (e instanceof Anthropic.AuthenticationError)
      return NextResponse.json({ erro: "A chave da API da Anthropic cadastrada na Vercel não é válida." }, { status: 503 });
    if (e instanceof Anthropic.APIError)
      return NextResponse.json({ erro: `A IA está indisponível agora (erro ${e.status}). Tente de novo em instantes.` }, { status: 502 });
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível falar com a IA agora. Tente de novo." }, { status: 500 });
  }
}

// Tudo o que a IA precisa saber do projeto: cliente, etapas, checklist, modelo
// do relatório (seções e entregáveis, com o texto atual) e o que já foi registrado
function contextoDoProjeto(p: Projeto, c: Partial<Cliente>, preDiagnostico: string[]) {
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
    `Etapa em curso: ${emCurso ? `${emCurso.ordem} (${emCurso.nome})` : "todas enviadas"}`,
  ];
  for (const e of p.etapas) {
    const regs = (p.atividadesRegistradas ?? []).filter((r) => r.etapa === e.ordem).sort((a, b) => a.data.localeCompare(b.data));
    const horas = regs.reduce((a, r) => a + r.horas, 0);
    const editavel = !concluida(e);
    partes.push(
      "",
      `## Etapa ${e.ordem}: ${e.nome} (${statusEtapa[e.status].rotulo}${editavel ? "" : ", NÃO ALTERAR"})`,
      e.descricao,
      `Período: ${e.dataInicio && e.dataFim ? `${e.dataInicio} a ${e.dataFim}` : "a definir"} (duração de referência: ${e.duracaoReferenciaDias} dias). Horas: ${horasFmt(horas)} de ${e.horasPrevistas} h.`,
      `Assinaturas do relatório: consultor ${e.assinaturaConsultor ?? "pendente"}, cliente ${e.assinaturaCliente ?? "pendente"}${e.relatorioAssinado ? `; PDF assinado guardado (${e.relatorioAssinado.nome})` : ""}.`,
      "Checklist (código, texto, situação):",
      ...e.atividades.map(
        (a) => `- ${a.codigo} ${a.texto}: ${a.status === "feito" ? "feito" : a.status === "nao_aplicavel" ? `não se aplica (${a.justificativa})` : "pendente"}`,
      ),
      "Seções do relatório (chave, título, orientação, texto atual):",
      ...todasSecoes.map((d) => {
        const atual = (e.secoes[d.chave] ?? "").trim();
        return `<secao chave="${d.chave}" titulo="${d.titulo(e)}">\nOrientação: ${d.ajuda}\nTexto atual: ${atual ? (editavel ? `\n${atual}` : `(${atual.length} caracteres)`) : "(em branco)"}\n</secao>`;
      }),
      "Entregáveis e instrumentos (título exato, texto atual):",
      ...e.entregaveis.map((x) => {
        const atual = x.conteudo.trim();
        return `<entregavel titulo="${x.titulo}">\n${atual ? (editavel ? atual : `(${atual.length} caracteres)`) : "(em branco)"}\n</entregavel>`;
      }),
      `Evidências guardadas: ${(e.evidencias ?? []).length ? (e.evidencias ?? []).map((x) => x.legenda).join("; ") : "nenhuma"}`,
      "Registros de atividade:",
      ...(regs.length
        ? regs.map(
            (r) =>
              `- ${formatarData(r.data)}, ${tiposAtividade[r.tipo].rotulo.toLowerCase()}, ${horasFmt(r.horas)}${r.participantes ? `, com ${r.participantes}` : ""}: ${r.anotacoes || "(sem anotações)"}`,
          )
        : ["- nenhum"]),
    );
  }
  // Tabelas do relatório (marcador [[tabela:tipo]] no texto), com as linhas atuais
  partes.push("", "## Tabelas do relatório (tipo: nome; colunas na ordem)");
  for (const t of tiposRegistro) {
    const linhas = p.registros.filter((r) => r.tipo === t.tipo);
    partes.push(`- ${t.tipo}: ${t.nome}; colunas: ${t.colunas.map((c) => c.titulo).join(" | ")}; ${linhas.length} ${linhas.length === 1 ? "linha" : "linhas"}`);
    for (const r of linhas) partes.push(`  ${r.codigo}: ${t.colunas.map((c) => r.dados[c.chave] || "—").join(" | ")}`);
  }
  return partes.filter((l) => l !== null).join("\n");
}
