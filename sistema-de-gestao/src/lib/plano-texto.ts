import type { Cliente, Projeto } from "./dados/tipos";
import { formatarData } from "./datas";

// "ANÁLISE E MELHORIA" → "Análise e Melhoria"
function tituloEtapa(nome: string) {
  const minusculas = new Set(["e", "de", "da", "do", "das", "dos"]);
  return nome
    .toLowerCase()
    .split(" ")
    .map((p, i) => (i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

// O plano de trabalho no formato da mensagem que a equipe envia (WhatsApp)
export function textoPlano(p: Projeto, cliente: Cliente | undefined) {
  const total = p.etapas.reduce((a, e) => a + e.horasPrevistas, 0);
  const linhas = [
    `Plano de Trabalho — ${cliente?.nomeFantasia || cliente?.razaoSocial || "Cliente"}`,
    `Código do pedido no Hub: ${p.codigoSolicitacaoHub || p.numeroProjetoHub || "a definir"}`,
    `Ficha: ${p.fichaTecnica}`,
    `Código da ficha técnica: ${p.codigoFichaTecnica}`,
    `Número de Visitas: ${Number(p.numeroVisitas) || p.etapas.length}`,
    ...p.etapas.map(
      (e) => `Etapa ${e.ordem} – ${tituloEtapa(e.nome)}: ${formatarData(e.dataInicioPlano ?? e.dataInicio)} a ${formatarData(e.dataFimPlano ?? e.dataFim)} - carga horária - ${e.horasPrevistas ? `${e.horasPrevistas}h` : "a definir"}`,
    ),
    `Carga horária total: ${total ? `${total}h` : "a definir"}.`,
  ];
  return linhas.join("\n");
}

// O que falta para a mensagem sair completa
