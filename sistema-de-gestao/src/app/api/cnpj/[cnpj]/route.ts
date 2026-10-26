import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";
import type { DadosCnpj } from "@/lib/cnpj";

// Consulta pública de CNPJ (dados da Receita Federal) para preencher o cadastro
// do cliente. BrasilAPI primeiro; cnpj.ws de reserva.

const mesmo = (s?: string | null) => (s ?? "").trim();

function cepFormatado(cep: string) {
  const d = cep.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 2)}.${d.slice(2, 5)}-${d.slice(5)}` : cep;
}

function telefone(ddd?: string | null, numero?: string | null) {
  const n = (numero ?? "").replace(/\D/g, "");
  const d = (ddd ?? "").replace(/\D/g, "");
  if (!n || /^0+$/.test(n)) return "";
  const meio = n.length === 9 ? `${n.slice(0, 5)}-${n.slice(5)}` : `${n.slice(0, 4)}-${n.slice(4)}`;
  return d && !/^0+$/.test(d) ? `(${d}) ${meio}` : meio;
}

// "RUA DOUTOR POTY NOBREGA, 1946, SALA 505" → "Rua Doutor Poty Nobrega, 1946, Sala 505"
function endereco(partes: (string | null | undefined)[]) {
  return titulo(partes.map(mesmo).filter(Boolean).join(", ").replace(/\s{2,}/g, " "));
}

async function brasilApi(cnpj: string): Promise<DadosCnpj | null> {
  const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const d = await r.json();
  return {
    razaoSocial: mesmo(d.razao_social),
    nomeFantasia: mesmo(d.nome_fantasia),
    endereco: endereco([`${mesmo(d.descricao_tipo_de_logradouro)} ${mesmo(d.logradouro)}`, d.numero, d.complemento, d.bairro]),
    cep: cepFormatado(mesmo(d.cep)),
    cidadeUf: d.municipio ? `${titulo(d.municipio)}/${mesmo(d.uf)}` : "",
    porte: mesmo(d.porte) ? titulo(d.porte) : "",
    ramo: mesmo(d.cnae_fiscal_descricao),
    dataAbertura: mesmo(d.data_inicio_atividade),
    email: mesmo(d.email).toLowerCase(),
    telefone: telefone(String(d.ddd_telefone_1 ?? "").slice(0, 2), String(d.ddd_telefone_1 ?? "").slice(2)),
    socios: (d.qsa ?? []).map((s: { nome_socio: string; qualificacao_socio: string }) => ({ nome: titulo(s.nome_socio), qualificacao: mesmo(s.qualificacao_socio) })),
  };
}

async function cnpjWs(cnpj: string): Promise<DadosCnpj | null> {
  const r = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const d = await r.json();
  const e = d.estabelecimento ?? {};
  return {
    razaoSocial: mesmo(d.razao_social),
    nomeFantasia: mesmo(e.nome_fantasia),
    endereco: endereco([`${mesmo(e.tipo_logradouro)} ${mesmo(e.logradouro)}`, e.numero, e.complemento, e.bairro]),
    cep: cepFormatado(mesmo(e.cep)),
    cidadeUf: e.cidade?.nome ? `${e.cidade.nome}/${e.estado?.sigla ?? ""}` : "",
    porte: mesmo(d.porte?.descricao),
    ramo: mesmo(e.atividade_principal?.descricao),
    dataAbertura: mesmo(e.data_inicio_atividade),
    email: mesmo(e.email).toLowerCase(),
    telefone: telefone(e.ddd1, e.telefone1),
    socios: (d.socios ?? []).map((s: { nome: string; qualificacao_socio?: { descricao?: string } }) => ({
      nome: titulo(s.nome),
      qualificacao: mesmo(s.qualificacao_socio?.descricao),
    })),
  };
}

// "LAGOA NOVA" → "Lagoa Nova", mantendo preposições em minúsculas
function titulo(s: string) {
  const menores = new Set(["de", "da", "do", "das", "dos", "e"]);
  return mesmo(s)
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && menores.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

export async function GET(_: Request, { params }: { params: Promise<{ cnpj: string }> }) {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Entre no sistema para consultar." }, { status: 401 });

  const cnpj = (await params).cnpj.replace(/\D/g, "");
  if (cnpj.length !== 14) return NextResponse.json({ erro: "CNPJ deve ter 14 dígitos." }, { status: 400 });

  for (const fonte of [brasilApi, cnpjWs]) {
    try {
      const dados = await fonte(cnpj);
      if (dados?.razaoSocial) return NextResponse.json(dados);
    } catch {
      // tenta a próxima fonte
    }
  }
  return NextResponse.json({ erro: "Não foi possível consultar o CNPJ agora. Confira o número ou preencha manualmente." }, { status: 502 });
}
