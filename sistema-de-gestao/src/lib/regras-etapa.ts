import type { Etapa, Projeto } from "./dados/tipos";
import type { StatusEtapa } from "./rotulos";
import { verificarCompletude } from "./relatorio/secoes";

// Regras de status da etapa, num só lugar: o que o sistema avança sozinho e o
// que impede cada status. Usadas pela etapa, pelo plano e pelo próximo passo.

export const fluxoEtapa: StatusEtapa[] = ["nao_iniciada", "em_levantamento", "em_redacao", "em_revisao", "aguardando_assinaturas", "a_enviar", "enviada", "aprovada"];
const exigemRelatorioPronto: StatusEtapa[] = ["a_enviar", "enviada", "aprovada"];

export const assinada = (e: Etapa) => !!(e.assinaturaConsultor && e.assinaturaCliente);

// Avanços automáticos: primeira atividade marcada → "Em levantamento";
// checklist completo → "Em redação"; relatório completo e assinado → "Pronta".
export function automatizarEtapa(p: Projeto, e: Etapa) {
  if (!p.planoFechadoEm || p.status === "encerrado") return;
  if (e.status === "nao_iniciada" && e.atividades.some((a) => a.status !== "pendente")) e.status = "em_levantamento";
  if (e.status === "em_levantamento" && e.atividades.every((a) => a.status !== "pendente")) e.status = "em_redacao";
  const antes: StatusEtapa[] = ["nao_iniciada", "em_levantamento", "em_redacao", "em_revisao", "aguardando_assinaturas"];
  if (assinada(e) && antes.includes(e.status) && verificarCompletude(p, e).length === 0) e.status = "a_enviar";
}

// Por que a etapa não pode ir para este status (null = pode)
export function bloqueioStatus(p: Projeto, e: Etapa, s: StatusEtapa): string | null {
  if (s === e.status) return null;
  if (p.status === "encerrado") return "O projeto está encerrado. Reabra para mudar o status";
  if (!p.planoFechadoEm && s !== "nao_iniciada") return "Feche o plano de trabalho primeiro";
  if (exigemRelatorioPronto.includes(s)) {
    const n = verificarCompletude(p, e).length;
    if (n) return n === 1 ? "Há 1 pendência no relatório" : `Há ${n} pendências no relatório`;
    if (!assinada(e)) return "Registre as datas das duas assinaturas";
  }
  return null;
}
