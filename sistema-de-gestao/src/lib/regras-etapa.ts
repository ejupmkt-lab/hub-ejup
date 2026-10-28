import type { Atividade, Etapa, Projeto } from "./dados/tipos";
import type { StatusEtapa } from "./rotulos";
import { relatorioFeitoFora, verificarCompletude } from "./relatorio/secoes";
import { contarAConfirmar, contarMarcadores } from "./relatorio/padroes";

// Regras de status da etapa, num só lugar: o que o sistema avança sozinho e o
// que impede cada status. Usadas pela etapa, pelo plano e pelo próximo passo.

export const fluxoEtapa: StatusEtapa[] = ["nao_iniciada", "em_levantamento", "em_redacao", "em_revisao", "aguardando_assinaturas", "a_enviar", "enviada", "aprovada"];
const exigemRelatorioPronto: StatusEtapa[] = ["a_enviar", "enviada", "aprovada"];

// Marcadores [completar] e [a confirmar] ainda abertos no relatório da etapa
export const marcadoresEmAberto = (e: Etapa) => contarMarcadores(e) + contarAConfirmar(e);

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
    const abertos = marcadoresEmAberto(e);
    if (abertos && !relatorioFeitoFora(e)) return `O relatório tem ${abertos} ${abertos === 1 ? "marcador" : "marcadores"} em aberto ([completar] ou [a confirmar]); resolva-os antes de enviar`;
    const n = verificarCompletude(p, e).length;
    if (n) return n === 1 ? "Há 1 pendência no relatório" : `Há ${n} pendências no relatório`;
    if (!assinada(e)) return "Registre as datas das duas assinaturas";
  }
  return null;
}

// Marcar a atividade-mãe ("1") vale também para as filhas ainda pendentes
// ("1.1", "1.2"…); marcar uma filha não mexe na mãe. Devolve os códigos que mudaram.
export function marcarAtividade(e: Etapa, codigo: string, status: Atividade["status"], justificativa?: string) {
  const mudaram: string[] = [];
  for (const a of e.atividades) {
    const filha = a.codigo.startsWith(`${codigo}.`);
    if (a.codigo !== codigo && !(filha && status !== "pendente" && a.status === "pendente")) continue;
    if (a.status === status) continue;
    a.status = status;
    if (status === "nao_aplicavel")
      a.justificativa = a.codigo === codigo ? (justificativa ?? a.justificativa) : `Segue a atividade ${codigo}, que não se aplica.`;
    mudaram.push(a.codigo);
  }
  return mudaram;
}
