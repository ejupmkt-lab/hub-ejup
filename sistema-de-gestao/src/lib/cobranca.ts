import type { Cliente, Projeto } from "./dados/tipos";
import { formatarData } from "./datas";
import { hubDoProjeto } from "./fase";
import { codigoHub, servicoDoProjeto } from "./projeto";

// Mensagem curta e cordial para cobrar quem está com a bola (gestor do SEBRAE,
// FUNCERN ou cliente), pronta para colar no WhatsApp ou no e-mail
export function mensagemCobranca(p: Projeto, c: Cliente | undefined): string | null {
  const h = hubDoProjeto(p);
  const desde = h.datas[h.passo] ? ` em ${formatarData(h.datas[h.passo])}` : "";
  const cliente = c?.nomeFantasia || c?.razaoSocial || "o cliente";
  const pedido = codigoHub(p) ? ` (pedido ${codigoHub(p)} no HUB)` : "";
  const servico = servicoDoProjeto(p);
  const ola = c?.responsavel ? `Olá, ${c.responsavel.split(" ")[0]}! Tudo bem?` : "Olá! Tudo bem?";
  switch (h.passo) {
    case "solicitacao":
      return `Olá! Tudo bem? Sobre a solicitação de ${servico} de ${cliente}${pedido}: há novidade da análise? Fico à disposição para começar o diagnóstico.`;
    case "diagnostico_enviado":
      return `Olá! Tudo bem? Enviei no HUB${desde} o diagnóstico de ${cliente}${pedido}, para ${servico}. Conseguiu analisar a viabilidade? Fico à disposição para preparar a proposta.`;
    case "proposta_funcern":
      return `Olá! Tudo bem? Enviei${desde} o plano de trabalho de ${cliente}${pedido}, para ${servico}. Conseguiram lançar a proposta no HUB?`;
    case "proposta_cliente":
      return `${ola} A proposta da consultoria de ${servico} já está no HUB SEBRAE para você analisar e fazer o pagamento. Com o pagamento, começamos a execução. Qualquer dúvida, estou à disposição.`;
    case "finalizado":
      return `${ola} Finalizamos a consultoria de ${servico} no HUB SEBRAE. Peço, por gentileza, que avalie a consultoria por lá: só depois da avaliação o projeto pode ser concluído. Obrigado!`;
    case "avaliado":
      return `Olá! Tudo bem? A consultoria de ${servico} de ${cliente}${pedido} foi finalizada e o cliente já avaliou. Consegue analisar as entregas e concluir o projeto?`;
    default:
      return null;
  }
}
