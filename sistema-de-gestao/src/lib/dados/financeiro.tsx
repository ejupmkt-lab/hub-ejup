"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import type { ChaveDeParcela, FinEmpresa, FinProjeto, FinServico, NotaFiscal } from "@/lib/financeiro";
import type { MudancaDeAliquota } from "@/lib/imposto";
import { traduzirErro } from "@/lib/erros";
import { useUsuario } from "./store";

export type AjusteDeParcela = { previsao?: string | null; valor?: number | null; recebidaEm?: string | null; nota?: NotaFiscal | null };
export type Financeiro = NonNullable<ReturnType<typeof useFinanceiro>>;

// Valores e recebimentos, carregados só para quem tem a permissão (o banco
// não entrega nada aos demais). Devolve null para quem não vê o financeiro.
export function useFinanceiro() {
  const usuario = useUsuario();
  const pode = !!usuario.veFinanceiro;
  const [servicos, setServicos] = useState<Record<string, FinServico>>({});
  const [projetos, setProjetos] = useState<Record<string, FinProjeto>>({});
  const [empresas, setEmpresas] = useState<Record<string, FinEmpresa>>({});
  const [carregado, setCarregado] = useState(false);

  const carregar = useCallback(async () => {
    if (!pode) return;
    const sb = supabaseNavegador();
    const [s, p, e] = await Promise.all([
      sb.from("financeiro_servicos").select("servico_id, empresa, teto, valor_hora, perc_funcern"),
      sb.from("financeiro_projetos").select("projeto_id, empresa, valor_hora, perc_funcern, recebidos, previsoes, valores, notas"),
      sb.from("financeiro_empresas").select("empresa, faturamento_12m, aliquota_fixa, mudancas"),
    ]);
    setServicos(
      Object.fromEntries(
        (s.data ?? []).map((x) => [
          x.servico_id,
          { servicoId: x.servico_id, empresa: x.empresa, teto: Number(x.teto), valorHora: Number(x.valor_hora), percFuncern: Number(x.perc_funcern) },
        ]),
      ),
    );
    setProjetos(
      Object.fromEntries(
        (p.data ?? []).map((x) => [
          x.projeto_id,
          {
            projetoId: x.projeto_id,
            empresa: x.empresa,
            valorHora: x.valor_hora === null ? null : Number(x.valor_hora),
            percFuncern: x.perc_funcern === null ? null : Number(x.perc_funcern),
            recebidos: (x.recebidos ?? {}) as Record<string, string>,
            previsoes: (x.previsoes ?? {}) as Record<string, string>,
            valores: (x.valores ?? {}) as Record<string, number>,
            notas: (x.notas ?? {}) as Record<string, NotaFiscal>,
          },
        ]),
      ),
    );
    setEmpresas(
      Object.fromEntries(
        (e.data ?? []).map((x) => [
          x.empresa,
          {
            empresa: x.empresa,
            faturamento12m: Number(x.faturamento_12m),
            aliquotaFixa: x.aliquota_fixa === null ? null : Number(x.aliquota_fixa),
            mudancas: (Array.isArray(x.mudancas) ? x.mudancas : []) as MudancaDeAliquota[],
          },
        ]),
      ),
    );
    setCarregado(true);
  }, [pode]);
  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const salvarServico = async (f: FinServico) => {
    const { error } = await supabaseNavegador()
      .from("financeiro_servicos")
      .upsert({ servico_id: f.servicoId, empresa: f.empresa, teto: f.teto, valor_hora: f.valorHora, perc_funcern: f.percFuncern, updated_at: new Date().toISOString() });
    if (error) throw new Error(traduzirErro(error));
    setServicos((x) => ({ ...x, [f.servicoId]: f }));
  };
  // Muda na tela na hora e volta atrás se o banco recusar
  const salvarProjeto = async (f: FinProjeto) => {
    const antes = projetos[f.projetoId];
    setProjetos((x) => ({ ...x, [f.projetoId]: f }));
    const { error } = await supabaseNavegador()
      .from("financeiro_projetos")
      .upsert({
        projeto_id: f.projetoId,
        empresa: f.empresa,
        valor_hora: f.valorHora,
        perc_funcern: f.percFuncern,
        recebidos: f.recebidos,
        previsoes: f.previsoes,
        valores: f.valores,
        notas: f.notas,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      setProjetos((x) => {
        const y = { ...x };
        if (antes) y[f.projetoId] = antes;
        else delete y[f.projetoId];
        return y;
      });
      throw new Error(traduzirErro(error));
    }
  };

  // Muda uma parcela: data prevista, valor e/ou dia em que foi recebida (null apaga e volta ao calculado)
  const ajustarParcela = (p: { id: string; empresa: string }, chave: ChaveDeParcela, a: AjusteDeParcela) => {
    const base: FinProjeto = projetos[p.id] ?? { projetoId: p.id, empresa: p.empresa, valorHora: null, percFuncern: null, recebidos: {}, previsoes: {}, valores: {}, notas: {} };
    // O pagamento único antigo ("100") vira as duas parcelas, para poder mexer em cada uma
    const abrir = <T,>(m: Record<string, T>) => {
      const { "100": unico, ...resto } = m;
      return unico === undefined ? resto : { "30": unico, "70": unico, ...resto };
    };
    const troca = <T,>(m: Record<string, T>, v: T | null | undefined) => {
      const y = abrir(m);
      if (v === undefined) return y;
      if (v === null) delete y[chave];
      else y[chave] = v;
      return y;
    };
    return salvarProjeto({
      ...base,
      recebidos: troca(base.recebidos, a.recebidaEm),
      previsoes: troca(base.previsoes, a.previsao),
      valores: troca(base.valores, a.valor),
      notas: troca(base.notas, a.nota),
    });
  };

  // Contrapartida do projeto: desconto sobre o total a receber (vazio ou zero tira o desconto)
  const definirContrapartida = (p: { id: string; empresa: string }, valor: number | null) => {
    const base: FinProjeto = projetos[p.id] ?? { projetoId: p.id, empresa: p.empresa, valorHora: null, percFuncern: null, recebidos: {}, previsoes: {}, valores: {}, notas: {} };
    const valores = { ...base.valores };
    if (valor && valor > 0) valores.contrapartida = valor;
    else delete valores.contrapartida;
    return salvarProjeto({ ...base, valores });
  };

  // Percentual do imposto do projeto, no lugar do calculado pela faixa do faturamento (null volta ao automático; 0 vale: sem imposto)
  const definirAliquota = (p: { id: string; empresa: string }, percentual: number | null) => {
    const base: FinProjeto = projetos[p.id] ?? { projetoId: p.id, empresa: p.empresa, valorHora: null, percFuncern: null, recebidos: {}, previsoes: {}, valores: {}, notas: {} };
    const valores = { ...base.valores };
    if (percentual !== null && percentual >= 0) valores.aliquota = percentual;
    else delete valores.aliquota;
    return salvarProjeto({ ...base, valores });
  };

  // Arquivo da nota fiscal (PDF, XML ou imagem) guardado no bucket privado "notas-fiscais", em "<projeto>/<arquivo>".
  // A linha do projeto no financeiro precisa existir antes (a regra do bucket olha o projeto), por isso o upsert antes.
  const anexarNota = async (p: { id: string; empresa: string }, chave: ChaveDeParcela, arquivo: File) => {
    const antiga = (projetos[p.id]?.notas ?? {})[chave];
    const nome = arquivo.name.replace(/[^\w.\-]+/g, "_").slice(-80) || "nota";
    const caminho = `${p.id}/${crypto.randomUUID()}-${nome}`;
    const sb = supabaseNavegador();
    if (!projetos[p.id]) await ajustarParcela(p, chave, {});
    const { error } = await sb.storage.from("notas-fiscais").upload(caminho, arquivo, { contentType: arquivo.type || undefined });
    if (error) throw new Error(traduzirErro(error, "Não foi possível enviar o arquivo."));
    const nota: NotaFiscal = { numero: antiga?.numero ?? "", emitidaEm: antiga?.emitidaEm ?? null, valor: antiga?.valor ?? null, arquivo: { caminho, nome: arquivo.name } };
    await ajustarParcela(p, chave, { nota });
    if (antiga?.arquivo) await sb.storage.from("notas-fiscais").remove([antiga.arquivo.caminho]);
  };
  const removerArquivoDaNota = async (p: { id: string; empresa: string }, chave: ChaveDeParcela) => {
    const nota = (projetos[p.id]?.notas ?? {})[chave];
    if (!nota?.arquivo) return;
    await ajustarParcela(p, chave, { nota: { ...nota, arquivo: null } });
    await supabaseNavegador().storage.from("notas-fiscais").remove([nota.arquivo.caminho]);
  };
  const abrirArquivoDaNota = async (caminho: string) => {
    const { data, error } = await supabaseNavegador().storage.from("notas-fiscais").createSignedUrl(caminho, 120);
    if (error || !data) throw new Error(traduzirErro(error, "Não foi possível abrir o arquivo."));
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const salvarEmpresa = async (f: FinEmpresa) => {
    const { error } = await supabaseNavegador()
      .from("financeiro_empresas")
      .upsert({ empresa: f.empresa, faturamento_12m: f.faturamento12m, aliquota_fixa: f.aliquotaFixa, mudancas: f.mudancas, updated_at: new Date().toISOString() });
    if (error) throw new Error(traduzirErro(error));
    setEmpresas((x) => ({ ...x, [f.empresa]: f }));
  };

  if (!pode) return null;
  return { servicos, projetos, empresas, carregado, salvarServico, salvarProjeto, ajustarParcela, definirContrapartida, definirAliquota, anexarNota, removerArquivoDaNota, abrirArquivoDaNota, salvarEmpresa, recarregar: carregar };
}
