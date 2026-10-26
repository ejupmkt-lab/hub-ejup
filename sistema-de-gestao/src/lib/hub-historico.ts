import type { Projeto } from "./dados/tipos";
import type { AcaoIA } from "./conversa";
import { registroHub } from "./fase";
import { formatarData } from "./datas";
import { doisDigitos } from "./rotulos";
import { ordenarHistorico } from "./hub-documentos";
import type { LeiturasDosRelatorios } from "./hub-importar";

// A linha do tempo como realmente foi: cada passo do HUB, cada envio de etapa e o que os relatórios dizem
// entram no histórico com a data de verdade (não a do dia da importação), e o histórico é reordenado.
export function registrarLinhaDoTempoDoHub(p: Projeto, usuario: string, acoes: AcaoIA[], leituras?: LeiturasDosRelatorios) {
  const eventos: { em: string; acao: string; detalhe: string }[] = [];
  // Sem hora conhecida: 00:00 (a tela do histórico não mostra a hora nesse caso)
  const em = (data: string) => `${data}T00:00:00`;
  for (const a of acoes) {
    if (a.tipo === "avancar_hub" && p.hub?.datas[a.passo] === a.data) eventos.push({ em: em(a.data), acao: registroHub[a.passo](a.data), detalhe: `Importado da página do pedido no HUB por ${usuario}` });
    if (a.tipo !== "registrar_envio_etapa") continue;
    const e = p.etapas.find((x) => x.ordem === a.etapa);
    if (!e || e.enviadaEm !== a.data) continue;
    const et = `Etapa ${doisDigitos(e.ordem)}`;
    eventos.push({ em: em(a.data), acao: `${et}: relatório enviado no HUB em ${formatarData(a.data)}`, detalhe: `Importado da página do pedido no HUB por ${usuario}` });
    const l = leituras?.[e.ordem];
    if (!l || "erro" in l) continue;
    const ok = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d ?? "");
    const lido = `Lido no relatório da etapa, importado por ${usuario}`;
    if (ok(l.inicio_das_atividades)) eventos.push({ em: em(l.inicio_das_atividades), acao: `${et}: atividades começaram`, detalhe: lido });
    if (ok(l.fim_das_atividades) && l.fim_das_atividades !== l.inicio_das_atividades) eventos.push({ em: em(l.fim_das_atividades), acao: `${et}: atividades terminaram`, detalhe: lido });
    if (ok(l.data_do_relatorio)) eventos.push({ em: em(l.data_do_relatorio), acao: `${et}: relatório fechado`, detalhe: lido });
    if (ok(l.assinatura_consultor)) eventos.push({ em: em(l.assinatura_consultor), acao: `${et}: relatório assinado pelo consultor`, detalhe: lido });
    if (ok(l.assinatura_cliente)) eventos.push({ em: em(l.assinatura_cliente), acao: `${et}: relatório assinado pela empresa`, detalhe: lido });
    for (const d of l.datas ?? []) if (ok(d.data) && d.o_que?.trim()) eventos.push({ em: em(d.data), acao: `${et}: ${d.o_que.trim()}`, detalhe: lido });
  }
  for (const ev of eventos) if (!p.historico.some((x) => x.em === ev.em && x.acao === ev.acao)) p.historico.push({ ...ev, usuario: "HUB SEBRAE" });
  ordenarHistorico(p);
}
