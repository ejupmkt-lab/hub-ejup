"use client";

import { useState } from "react";
import type { Projeto } from "@/lib/dados/tipos";
import { useEstado } from "@/lib/dados/store";
import { useFinanceiro } from "@/lib/dados/financeiro";
import { FONTES_DE_CUSTEIO, entradasDeRecebimento, moeda, recebimento, type Entrada } from "@/lib/financeiro";
import {
  intervaloDoPeriodo,
  passoDoModo,
  somarMeses,
  type ModoDePeriodo,
} from "@/lib/periodo";
import { formatarData, hojeIso, mesPorExtenso } from "@/lib/datas";
import { nomeDoCliente } from "@/lib/campos-cliente";
import { Botao, Campo } from "@/components/ui";
import {
  ProjetosDoRecebimento,
  type LinhaDeProjeto,
} from "./projetos-recebimento";
import { TotaisDoPeriodo } from "./totais";

const soma = (l: Entrada[], f: (e: Entrada) => number) =>
  l.reduce((a, e) => a + f(e), 0);
const valorDe = (e: Entrada) => e.parcela.valor;
const diaDe = (e: Entrada) => e.parcela.recebidaEm ?? e.parcela.previsao;
// O filtro vale por período (mês, trimestre, ano, tudo, intervalo) ou por fonte de custeio da contrapartida
type Modo = ModoDePeriodo | "fonte";
const modos: { chave: Modo; rotulo: string }[] = [
  { chave: "mes", rotulo: "Mês" },
  { chave: "trimestre", rotulo: "Trimestre" },
  { chave: "ano", rotulo: "Ano" },
  { chave: "tudo", rotulo: "Tudo" },
  { chave: "personalizado", rotulo: "Personalizado" },
  { chave: "fonte", rotulo: "Fonte de custeio" },
];

function Numero({
  rotulo,
  valor,
  detalhe,
  tom = "",
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  tom?: string;
}) {
  return (
    <div className="rounded-[var(--radius-bloco)] border border-linha bg-folha p-3.5 shadow-[var(--shadow-cartao)]">
      <dt className="text-[12px] text-tinta-2">{rotulo}</dt>
      <dd className={`num text-[19px] font-bold leading-tight ${tom}`}>
        {valor}
      </dd>
      {detalhe && <dd className="text-[12px] text-tinta-2">{detalhe}</dd>}
    </div>
  );
}

// Financeiro (só para quem vê o financeiro): o que entra no período escolhido (abre no mês corrente), por cliente e projeto,
// com as duas parcelas de cada um, a data prevista (projetada pelo andamento do projeto) e a nota fiscal; tudo se corrige ali.
export function AReceber({ projetos }: { projetos: Projeto[] }) {
  const fin = useFinanceiro();
  const { estado } = useEstado();
  // O período abre no mês corrente; dá para andar por mês, trimestre ou ano, ver tudo ou escolher um intervalo
  const [modo, setModo] = useState<Modo>("mes");
  const [fonte, setFonte] = useState<string>("todas"); // "todas", uma das FONTES_DE_CUSTEIO ou "nenhuma" (não definida)
  const [ref, setRef] = useState(() => hojeIso().slice(0, 7));
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [semDataAberto, setSemDataAberto] = useState(false);
  if (!fin || !fin.carregado) return null;
  const hoje = hojeIso();
  const mesAtual = hoje.slice(0, 7);
  const clienteDe = (p: Projeto) =>
    estado.clientes.find((x) => x.id === p.clienteId);

  const entradas = entradasDeRecebimento(
    projetos,
    fin.servicos,
    fin.projetos,
    fin.empresas,
  );
  const pendentes = entradas.filter((e) => !e.parcela.recebidaEm);
  const comData = pendentes.filter((e) => e.mes);
  const semData = entradas.filter((e) => !diaDe(e));
  const recebidoNoMes = entradas.filter(
    (e) => e.parcela.recebidaEm && e.mes === mesAtual,
  );
  const proximoDia = comData[0]?.parcela.previsao ?? null;
  const doProximo = comData.filter((e) => e.parcela.previsao === proximoDia);

  // O que o período mostra: as parcelas cujo dia (recebimento ou previsão) cai nele, ou as sem data
  const { inicio, fim } = intervaloDoPeriodo(modo === "fonte" ? "tudo" : modo, ref, de, ate);
  // Por fonte de custeio: todas as parcelas dos projetos que têm contrapartida e saíram dessa fonte
  const contrapartidaDe = (p: Projeto) => recebimento(p, fin.servicos[p.modeloId], fin.projetos[p.id], hoje).contrapartida;
  const fonteDe = (p: Projeto) => fin.projetos[p.id]?.fonteContrapartida ?? null;
  const daFonte = (p: Projeto) => contrapartidaDe(p) > 0 && (fonte === "todas" || (fonte === "nenhuma" ? !fonteDe(p) : fonteDe(p) === fonte));
  const doPeriodo =
    modo === "fonte"
      ? entradas.filter((e) => daFonte(e.projeto))
      : semDataAberto
        ? semData
        : entradas.filter((e) => {
            const d = diaDe(e);
            return !!d && d >= inicio && d <= fim;
          });
  const projetosDoPeriodo = [
    ...new Set(doPeriodo.map((e) => e.projeto.id)),
  ].map((id) => projetos.find((p) => p.id === id)!);
  const clientes = [...new Set(projetosDoPeriodo.map((p) => p.clienteId))]
    .map((id) => {
      const ps = projetosDoPeriodo.filter((p) => p.clienteId === id);
      const todas = entradas.filter((e) =>
        ps.some((p) => p.id === e.projeto.id),
      );
      const proxima =
        todas
          .filter((e) => !e.parcela.recebidaEm && e.parcela.previsao)
          .map((e) => e.parcela.previsao!)
          .sort()[0] ?? "9999";
      return { id, ps, todas, proxima, cliente: clienteDe(ps[0]) };
    })
    .sort(
      (a, b) =>
        a.proxima.localeCompare(b.proxima) ||
        nomeDoCliente(a.cliente).localeCompare(nomeDoCliente(b.cliente)),
    );
  const mesEscolhido = modo === "mes" && !semDataAberto ? ref : null;
  // Uma linha por projeto, agrupadas por cliente, na ordem do próximo pagamento
  const linhas: LinhaDeProjeto[] = clientes.flatMap((c) =>
    c.ps.map((p) => ({
      projeto: p,
      nomeCliente: nomeDoCliente(c.cliente),
      // Só as parcelas que caem no período escolhido: em novembro, quem recebeu a 1ª em outubro mostra apenas a 2ª
      entradas: doPeriodo
        .filter((e) => e.projeto.id === p.id)
        .sort((a, b) => a.parcela.ordem - b.parcela.ordem),
    })),
  );
  // Contrapartida de cada fonte, entre os projetos mostrados
  const porFonte = modo === "fonte"
    ? [...FONTES_DE_CUSTEIO.map((f) => ({ chave: f.valor as string, rotulo: f.rotulo })), { chave: "", rotulo: "Fonte não definida" }]
        .map(({ chave, rotulo }) => ({ rotulo: `Contrapartida · ${rotulo}`, valor: projetosDoPeriodo.filter((p) => (fonteDe(p) ?? "") === chave).reduce((a, p) => a + contrapartidaDe(p), 0) }))
        .filter((l) => l.valor > 0)
    : [];
  const andar = (n: number) => setRef(somarMeses(ref, n * (modo === "fonte" ? 0 : passoDoModo[modo])));

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero
          rotulo="A receber"
          valor={moeda(soma(pendentes, valorDe))}
          detalhe={`${pendentes.length} ${pendentes.length === 1 ? "parcela" : "parcelas"}`}
        />
        <Numero
          rotulo="Próximo pagamento"
          valor={proximoDia ? formatarData(proximoDia) : "—"}
          detalhe={
            proximoDia ? moeda(soma(doProximo, valorDe)) : "nada com data"
          }
          tom={proximoDia && proximoDia < hoje ? "text-laranja" : ""}
        />
        <Numero
          rotulo={`Recebido em ${mesPorExtenso(mesAtual)}`}
          valor={moeda(soma(recebidoNoMes, valorDe))}
          tom="text-verde"
        />
        <Numero
          rotulo="Imposto previsto"
          valor={moeda(soma(comData, (e) => e.imposto))}
          detalhe="sobre o que tem data"
        />
      </dl>

      <div className="space-y-3 rounded-[var(--radius-bloco)] border border-linha bg-folha p-3.5 shadow-[var(--shadow-cartao)]">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <Campo rotulo="Filtrar por">
            <select
              className="campo"
              value={modo}
              onChange={(ev) => {
                setModo(ev.target.value as Modo);
                setSemDataAberto(false);
              }}
            >
              {modos.map((m) => (
                <option key={m.chave} value={m.chave}>
                  {m.rotulo}
                </option>
              ))}
            </select>
          </Campo>
          {(modo === "mes" || modo === "trimestre" || modo === "ano") && (
            <div className="flex items-end gap-2">
              <button
                type="button"
                aria-label="Período anterior"
                onClick={() => {
                  andar(-1);
                  setSemDataAberto(false);
                }}
                className="min-h-11 rounded-[var(--radius-campo)] border border-linha-forte bg-folha px-3.5 text-lg font-semibold hover:bg-pedra"
              >
                ‹
              </button>
              <Campo rotulo="Ir para o mês">
                <input
                  type="month"
                  className="campo num"
                  value={ref}
                  onChange={(ev) =>
                    ev.target.value &&
                    (setRef(ev.target.value), setSemDataAberto(false))
                  }
                />
              </Campo>
              <button
                type="button"
                aria-label="Próximo período"
                onClick={() => {
                  andar(1);
                  setSemDataAberto(false);
                }}
                className="min-h-11 rounded-[var(--radius-campo)] border border-linha-forte bg-folha px-3.5 text-lg font-semibold hover:bg-pedra"
              >
                ›
              </button>
            </div>
          )}
          {modo === "personalizado" && (
            <>
              <Campo rotulo="De">
                <input
                  type="date"
                  className="campo num"
                  value={de}
                  onChange={(ev) => setDe(ev.target.value)}
                />
              </Campo>
              <Campo rotulo="Até">
                <input
                  type="date"
                  className="campo num"
                  value={ate}
                  onChange={(ev) => setAte(ev.target.value)}
                />
              </Campo>
            </>
          )}
          {modo === "fonte" && (
            <Campo rotulo="Fonte de custeio">
              <select className="campo" value={fonte} onChange={(ev) => setFonte(ev.target.value)}>
                <option value="todas">Todas as fontes</option>
                {FONTES_DE_CUSTEIO.map((f) => (
                  <option key={f.valor} value={f.valor}>
                    {f.rotulo}
                  </option>
                ))}
                <option value="nenhuma">Não definida</option>
              </select>
            </Campo>
          )}
          {modo !== "fonte" && semData.length > 0 && (
            <Botao
              variante={semDataAberto ? "primario" : "secundario"}
              aria-pressed={semDataAberto}
              onClick={() => setSemDataAberto(!semDataAberto)}
            >
              Sem data ({semData.length})
            </Botao>
          )}
        </div>
        {semDataAberto && (
          <p className="text-[13px] text-tinta-2">
            Projetos sem plano de trabalho. Em “Editar”, combine uma data para a
            parcela entrar na conta.
          </p>
        )}
      </div>

      {linhas.length === 0 ? (
        <p className="text-sm text-tinta-2">{modo === "fonte" ? "Nenhum projeto com contrapartida nesta fonte." : "Nada neste período."}</p>
      ) : (
        <>
          <ProjetosDoRecebimento fin={fin} linhas={linhas} mesEscolhido={mesEscolhido} />
          <TotaisDoPeriodo entradas={doPeriodo} contrapartidas={porFonte} />
        </>
      )}
    </div>
  );
}
