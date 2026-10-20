import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";

// Cadastro de serviço: a IA lê a ficha técnica do Sebraetec (PDF ou texto
// colado) e devolve os campos do formulário, que o gestor confere antes de salvar.

export const maxDuration = 300;

const SISTEMA = `Você lê fichas técnicas de serviços do Sebraetec (SEBRAE) e extrai os dados para o cadastro do serviço num sistema de gestão de consultorias.

Regras:
- Copie os textos da ficha (nome do serviço, etapas, atividades, entregáveis) sem resumir nem reescrever. Corrija só quebras de linha e hifenização do PDF.
- "fichaTecnica" é o nome oficial do serviço; "nomeCurto" é uma versão curta (até 4 palavras) para distinguir projetos de um mesmo cliente.
- "codigoFichaTecnica" é o código da ficha (ex.: 13070-5). "area" é o tema ou a área do catálogo (ex.: Gestão da Qualidade). "descricao" é o objetivo ou a descrição do serviço, em até 3 frases da própria ficha.
- "areaAtuacao" descreve a área de atuação da consultoria para a ficha de identificação dos relatórios (ex.: "Governança em privacidade e proteção de dados pessoais").
- Cada etapa traz o nome (como na ficha), a carga horária em horas, a descrição ou o objetivo, as atividades com o código hierárquico ("1", "1.1"…) e os entregáveis. Se a ficha numerar as atividades de outro jeito, refaça os códigos em ordem, mantendo a hierarquia. "instrumentos" são documentos de apoio que não são entregáveis formais; deixe vazio se a ficha não citar.
- "duracaoReferenciaDias" é a duração da etapa em dias corridos, se a ficha disser; senão, estime pela carga horária (cerca de 1 dia para cada 12 horas, no mínimo 1).
- O que a ficha não trouxer fica em branco (texto vazio ou zero). Não invente.`;

const texto = { type: "string" } as const;
const ESQUEMA = {
  type: "object",
  properties: {
    fichaTecnica: texto,
    nomeCurto: texto,
    codigoFichaTecnica: texto,
    area: texto,
    descricao: texto,
    prestadoraVinculada: texto,
    areaAtuacao: texto,
    etapas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: texto,
          descricao: texto,
          horasPrevistas: { type: "number" },
          duracaoReferenciaDias: { type: "integer" },
          atividades: {
            type: "array",
            items: { type: "object", properties: { codigo: texto, texto }, required: ["codigo", "texto"], additionalProperties: false },
          },
          entregaveis: { type: "array", items: texto },
          instrumentos: { type: "array", items: texto },
        },
        required: ["nome", "descricao", "horasPrevistas", "duracaoReferenciaDias", "atividades", "entregaveis", "instrumentos"],
        additionalProperties: false,
      },
    },
  },
  required: ["fichaTecnica", "nomeCurto", "codigoFichaTecnica", "area", "descricao", "prestadoraVinculada", "areaAtuacao", "etapas"],
  additionalProperties: false,
} as const;

export async function POST(req: Request) {
  const sb = await supabaseServidor();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Sessão expirada. Entre de novo." }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json(
      { erro: "A IA ainda não foi ativada no servidor: falta cadastrar a chave da API da Anthropic na Vercel. Até lá, preencha o formulário à mão." },
      { status: 503 },
    );

  const pedido = (await req.json().catch(() => null)) as { pdf?: string; nome?: string; texto?: string } | null;
  const conteudo: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (pedido?.pdf) conteudo.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: pedido.pdf } });
  else if (pedido?.texto?.trim()) conteudo.push({ type: "text", text: `<ficha>\n${pedido.texto.trim().slice(0, 60000)}\n</ficha>` });
  else return NextResponse.json({ erro: "Envie o PDF ou cole o texto da ficha." }, { status: 400 });
  conteudo.push({ type: "text", text: "Extraia os dados desta ficha técnica para o cadastro do serviço." });

  const client = new Anthropic();
  try {
    const resposta = await client.beta.messages
      .stream({
        model: "claude-opus-5-5",
        max_tokens: 32000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA } },
        system: SISTEMA,
        messages: [{ role: "user", content: conteudo }],
      })
      .finalMessage();

    if (resposta.stop_reason === "refusal") return NextResponse.json({ erro: "A IA não conseguiu ler esta ficha. Preencha à mão." }, { status: 422 });
    if (resposta.stop_reason === "max_tokens")
      return NextResponse.json({ erro: "A ficha é longa demais para ler de uma vez. Cole o texto em partes." }, { status: 422 });
    const json = resposta.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return NextResponse.json({ ficha: JSON.parse(json) });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError)
      return NextResponse.json({ erro: "Muitos pedidos à IA ao mesmo tempo. Aguarde um minuto e tente de novo." }, { status: 429 });
    if (e instanceof Anthropic.AuthenticationError)
      return NextResponse.json({ erro: "A chave da API da Anthropic cadastrada na Vercel não é válida." }, { status: 503 });
    if (e instanceof Anthropic.APIError)
      return NextResponse.json({ erro: `A IA está indisponível agora (erro ${e.status}). Tente de novo em instantes.` }, { status: 502 });
    console.error(e);
    return NextResponse.json({ erro: "Não foi possível ler a ficha agora. Tente de novo." }, { status: 500 });
  }
}
