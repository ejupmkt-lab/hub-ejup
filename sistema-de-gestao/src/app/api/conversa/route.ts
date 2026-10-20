import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";
import type { Cliente, Etapa, Projeto } from "@/lib/dados/tipos";
import type { Anexo } from "@/lib/conversa";
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

const SISTEMA = `Você é a assistente do sistema de gestão do escritório Pivotto & Pivotto, dentro de um projeto de consultoria do programa Sebraetec (HUB SEBRAE). O consultor conversa com você durante o projeto: manda anotações (muitas vezes ditadas, com erros de transcrição), fotos de reuniões e documentos, e PDFs. Você entende a mensagem e organiza o projeto sozinha.

O que fazer com cada mensagem:
1. Descubra a que etapa o conteúdo pertence, pelo assunto (compare com a descrição, o checklist e os entregáveis de cada etapa) e pelas datas. Na dúvida, é a etapa em curso.
2. Marque como feitas as atividades do checklist que a mensagem mostra claramente que foram realizadas. Use "nao_aplicavel" só quando o consultor disser que a atividade não se aplica, com a justificativa dele.
3. Registre visitas, reuniões remotas e trabalho interno quando a mensagem disser que aconteceram. Data e horas precisam estar na mensagem ou ser óbvias ("hoje", "ontem", "2 horas"); se faltar a duração, não registre e pergunte. As anotações do registro resumem o que foi feito e decidido.
4. Guarde cada foto anexada como evidência da etapa certa, com uma legenda curta no estilo do relatório (ex.: "Reunião de levantamento com a diretoria em 20/10/2026"). Se a foto não servir de evidência (ex.: foto de tela sem relação), não guarde e diga por quê.
5. Quando a mensagem trouxer conteúdo suficiente, escreva ou atualize as seções do relatório e os entregáveis da etapa, seguindo o modelo (título e orientação de cada seção). Ao atualizar, devolva o texto completo da seção, juntando o que já existia com o novo. Não reescreva seções sem necessidade.
6. Nunca altere etapas enviadas ou aprovadas.

A resposta ao consultor ("resposta"): português claro e direto, em poucas linhas, sem Markdown. Diga o que você fez e o que falta para a etapa avançar, e faça as perguntas necessárias. Se a mensagem for só uma pergunta, responda sem ações. Não repita a lista de ações em detalhe: o sistema já mostra cada alteração.

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
            properties: { tipo: { type: "string", const: "escrever_entregavel" }, etapa: { type: "integer" }, titulo: { type: "string" }, texto: { type: "string" } },
            required: ["tipo", "etapa", "titulo", "texto"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: { tipo: { type: "string", const: "guardar_anexo" }, etapa: { type: "integer" }, anexo: { type: "string" }, legenda: { type: "string" } },
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
        ],
      },
    },
  },
  required: ["resposta", "acoes"],
  additionalProperties: false,
} as const;

type Linha = { id: string; papel: string; texto: string; anexos: Anexo[]; acoes: { descricao: string }[]; desfeita: boolean; created_at: string };

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
    if (anexo.tipo === "application/pdf")
      blocos.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } });
    else if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(anexo.tipo))
      blocos.push({ type: "image", source: { type: "base64", media_type: anexo.tipo as "image/jpeg", data: base64 } });
  }

  const historico = anteriores.length
    ? anteriores
        .map((m) =>
          [
            `[${m.created_at.slice(0, 16).replace("T", " ")}] ${m.papel === "usuario" ? "Consultor" : "Assistente"}: ${m.texto || "(sem texto)"}`,
            m.anexos.length ? `(anexos: ${m.anexos.map((a) => a.nome).join(", ")})` : "",
            m.acoes.length ? `(${m.desfeita ? "alterações desfeitas pelo consultor" : "alterações feitas"}: ${m.acoes.map((a) => a.descricao).join("; ")})` : "",
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
              { type: "text", text: `<projeto>\n${contextoDoProjeto(projeto, cliente)}\n</projeto>\n\n<conversa_anterior>\n${historico}\n</conversa_anterior>` },
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
    if (e instanceof Anthropic.APIError) return NextResponse.json({ erro: `A IA está indisponível agora (erro ${e.status}). Tente de novo em instantes.` }, { status: 502 });
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível falar com a IA agora. Tente de novo." }, { status: 500 });
  }
}

// Tudo o que a IA precisa saber do projeto: cliente, etapas, checklist, modelo
// do relatório (seções e entregáveis, com o texto atual) e o que já foi registrado
function contextoDoProjeto(p: Projeto, c: Partial<Cliente>) {
  const linha = (rotulo: string, valor?: string | null) => (valor?.trim() ? `${rotulo}: ${valor.trim()}` : null);
  const concluida = (e: Etapa) => e.status === "enviada" || e.status === "aprovada";
  const emCurso = p.etapas.find((e) => !concluida(e));
  const partes: (string | null)[] = [
    `Hoje: ${formatarData(hojeIso())}`,
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
    linha("Projeto no HUB", p.numeroProjetoHub),
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
      `Período: ${formatarData(e.dataInicio)} a ${formatarData(e.dataFim)}. Horas: ${horasFmt(horas)} de ${e.horasPrevistas} h.`,
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
        ? regs.map((r) => `- ${formatarData(r.data)}, ${tiposAtividade[r.tipo].rotulo.toLowerCase()}, ${horasFmt(r.horas)}${r.participantes ? `, com ${r.participantes}` : ""}: ${r.anotacoes || "(sem anotações)"}`)
        : ["- nenhum"]),
    );
  }
  return partes.filter((l) => l !== null).join("\n");
}
