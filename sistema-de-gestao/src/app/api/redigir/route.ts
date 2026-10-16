import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";
import type { Cliente, Projeto } from "@/lib/dados/tipos";
import { todasSecoes } from "@/lib/relatorio/secoes";
import { formatarData } from "@/lib/datas";
import { tiposAtividade } from "@/lib/horas";

// Redige seções do relatório técnico a partir das anotações de visitas, do
// checklist e dos dados do cliente. Os dados são lidos no banco com a sessão
// de quem pediu (as regras de acesso valem aqui também), nunca do navegador.

export const maxDuration = 300;

const SISTEMA = `Você redige seções de Relatórios Técnicos de consultoria de Adequação à LGPD (Lei 13.709/2018), entregues ao SEBRAE pelo programa Sebraetec (ficha técnica 13070-5), em nome do escritório Pivotto & Pivotto.

Estilo dos relatórios:
- Português formal, técnico-jurídico, em terceira pessoa ("a empresa demandante", "a consultoria", "o responsável interno"). Frases claras e objetivas, sem adjetivos promocionais.
- Parágrafos separados por uma linha em branco. Listas em alíneas no formato "a) texto;" "b) texto;" e a última terminada em ponto final. Nada de Markdown (sem asteriscos, sem # , sem negrito).
- Subtítulos, se necessários, em linha própria começando com "## ".
- Marcadores como [[tabela:acoes]] ou [[tabela:pessoas]] inserem tabelas no relatório: mantenha-os exatamente como estão, em linha própria.

Regras de conteúdo:
- Use apenas fatos presentes nos dados fornecidos (anotações das visitas, checklist, dados do cliente e texto atual da seção). Não invente nomes, números, sistemas, datas ou documentos.
- Quando faltar uma informação necessária, escreva o marcador [completar: o que falta] no ponto exato, para o consultor preencher.
- Aproveite a estrutura do texto atual da seção quando houver, substituindo os marcadores [completar...] pelo que as anotações permitirem.
- Respeite a finalidade de cada seção descrita em "orientação".
- Dados pessoais de terceiros que aparecerem nas anotações só entram no relatório se forem necessários (ex.: nome e cargo do responsável interno).`;

type Pedido = { projetoId: string; etapa: number; secoes: string[] };

export async function POST(req: Request) {
  const sb = await supabaseServidor();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessão expirada. Entre de novo." }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json(
      { erro: "A redação com IA ainda não foi ativada no servidor. O administrador precisa cadastrar a chave da API da Anthropic na Vercel." },
      { status: 503 },
    );

  const pedido = (await req.json().catch(() => null)) as Pedido | null;
  if (!pedido?.projetoId || !pedido.etapa || !Array.isArray(pedido.secoes) || !pedido.secoes.length)
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });

  const { data: linhaProjeto } = await sb.from("projetos").select("dados, cliente_id").eq("id", pedido.projetoId).maybeSingle();
  if (!linhaProjeto) return NextResponse.json({ erro: "Projeto não encontrado." }, { status: 404 });
  const projeto = linhaProjeto.dados as Projeto;
  const { data: linhaCliente } = await sb.from("clientes").select("dados").eq("id", linhaProjeto.cliente_id).maybeSingle();
  const cliente = (linhaCliente?.dados ?? {}) as Partial<Cliente>;
  const etapa = projeto.etapas.find((e) => e.ordem === pedido.etapa);
  if (!etapa) return NextResponse.json({ erro: "Etapa não encontrada." }, { status: 404 });

  const defs = todasSecoes.filter((d) => pedido.secoes.includes(d.chave));
  if (!defs.length) return NextResponse.json({ erro: "Nenhuma seção válida." }, { status: 400 });

  const registros = (projeto.atividadesRegistradas ?? [])
    .filter((r) => r.etapa === etapa.ordem)
    .sort((a, b) => a.data.localeCompare(b.data));

  const contexto = [
    "## Empresa demandante",
    linha("Razão social", cliente.razaoSocial),
    linha("Nome fantasia", cliente.nomeFantasia),
    linha("Ramo de atividade", cliente.ramo),
    linha("Produtos e serviços", cliente.produtosServicos),
    linha("Porte", cliente.porte),
    linha("Tempo de atividade", cliente.tempoAtividade),
    linha("Cidade", cliente.cidadeUf),
    linha("Responsável", [cliente.responsavel, cliente.cargoResponsavel].filter(Boolean).join(", ")),
    linha("Empregados na gestão", cliente.empregadosGestao),
    linha("Empregados na operação", cliente.empregadosOperacionais),
    linha("Segmento", projeto.segmento),
    "",
    `## Etapa ${etapa.ordem}: ${etapa.nome}`,
    etapa.descricao,
    linha("Período", `${formatarData(etapa.dataInicio)} a ${formatarData(etapa.dataFim)}`),
    "",
    "## Checklist da ficha técnica",
    ...etapa.atividades.map(
      (a) =>
        `${a.codigo} ${a.texto}: ${a.status === "feito" ? "feito" : a.status === "nao_aplicavel" ? `não se aplica (${a.justificativa || "sem justificativa"})` : "pendente"}`,
    ),
    "",
    "## Visitas, reuniões e trabalho interno registrados nesta etapa",
    ...(registros.length
      ? registros.map((r) =>
          [
            `### ${formatarData(r.data)}, ${tiposAtividade[r.tipo].rotulo.toLowerCase()}, ${r.horas} h`,
            r.participantes && `Participantes: ${r.participantes}`,
            r.anotacoes || "(sem anotações)",
          ]
            .filter(Boolean)
            .join("\n"),
        )
      : ["(nenhum registro)"]),
  ]
    .filter((l) => l !== null)
    .join("\n");

  const pedidoSecoes = defs
    .map((d) => `<secao chave="${d.chave}">\nTítulo: ${d.titulo(etapa)}\nOrientação: ${d.ajuda}\nTexto atual:\n${etapa.secoes[d.chave]?.trim() || "(em branco)"}\n</secao>`)
    .join("\n\n");

  const client = new Anthropic();
  try {
    const resposta = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              secoes: {
                type: "array",
                items: {
                  type: "object",
                  properties: { chave: { type: "string", enum: defs.map((d) => d.chave) }, texto: { type: "string" } },
                  required: ["chave", "texto"],
                  additionalProperties: false,
                },
              },
            },
            required: ["secoes"],
            additionalProperties: false,
          },
        },
      },
      system: SISTEMA,
      messages: [
        {
          role: "user",
          content: `<dados>\n${contexto}\n</dados>\n\nRedija as seções abaixo para o relatório desta etapa. Devolva uma entrada para cada seção pedida.\n\n${pedidoSecoes}`,
        },
      ],
    });

    if (resposta.stop_reason === "refusal")
      return NextResponse.json({ erro: "A IA não conseguiu redigir este conteúdo. Escreva manualmente ou ajuste as anotações." }, { status: 422 });
    if (resposta.stop_reason === "max_tokens")
      return NextResponse.json({ erro: "O texto ficou longo demais. Peça menos seções de uma vez." }, { status: 422 });

    const texto = resposta.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const json = JSON.parse(texto) as { secoes: { chave: string; texto: string }[] };
    return NextResponse.json({ secoes: json.secoes.filter((s) => defs.some((d) => d.chave === s.chave)) });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError)
      return NextResponse.json({ erro: "Muitos pedidos à IA ao mesmo tempo. Aguarde um minuto e tente de novo." }, { status: 429 });
    if (e instanceof Anthropic.AuthenticationError)
      return NextResponse.json({ erro: "A chave da API da Anthropic cadastrada na Vercel não é válida." }, { status: 503 });
    if (e instanceof Anthropic.APIError) return NextResponse.json({ erro: `A IA está indisponível agora (erro ${e.status}). Tente de novo em instantes.` }, { status: 502 });
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível redigir agora. Tente de novo." }, { status: 500 });
  }
}

function linha(rotulo: string, valor?: string | null) {
  return valor?.trim() ? `${rotulo}: ${valor.trim()}` : null;
}
