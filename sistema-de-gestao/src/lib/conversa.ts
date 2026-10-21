import type { Atividade, Contratacao, Etapa, Projeto, RelatorioAssinado, TipoAtividade } from "./dados/tipos";
import { faseDoProjeto, mudarContratacao, ordemContratacao } from "./fase";
import { todasSecoes, verificarCompletude } from "./relatorio/secoes";
import { assinada, automatizarEtapa, bloqueioStatus, marcarAtividade } from "./regras-etapa";
import { doisDigitos, statusEtapa, type StatusEtapa as StatusEtapaTipo } from "./rotulos";
import { distribuirPorHoras, formatarData, hojeIso, sugerirDatas } from "./datas";
import { horasFmt, tiposAtividade } from "./horas";
import { etapaAtual } from "./projeto";

// Conversa do projeto: o que a IA pode fazer no projeto a partir de uma
// mensagem, e como desfazer. As ações chegam do servidor já no formato
// abaixo; aqui elas são conferidas (etapa, seção, código existem?) antes de valer.

export type Anexo = { id: string; caminho: string; nome: string; tipo: string; largura?: number; altura?: number };

export type AcaoIA =
  | { tipo: "marcar_atividades"; etapa: number; codigos: string[]; situacao: "feito" | "nao_aplicavel"; justificativa: string }
  | { tipo: "escrever_secao"; etapa: number; chave: string; texto: string }
  | { tipo: "escrever_entregavel"; etapa: number; titulo: string; texto: string }
  | { tipo: "guardar_anexo"; etapa: number; anexo: string; legenda: string }
  | { tipo: "registrar_atividade"; etapa: number; data: string; modalidade: TipoAtividade; horas: number; participantes: string; anotacoes: string }
  | { tipo: "definir_cronograma"; inicio: string; fim: string }
  | { tipo: "alterar_datas_etapa"; etapa: number; inicio: string; fim: string; justificativa: string }
  | { tipo: "registrar_assinatura"; etapa: number; anexo: string; data_consultor: string; data_cliente: string }
  | { tipo: "mudar_situacao_etapa"; etapa: number; situacao: "a_enviar" | "enviada" | "aprovada" | "devolvida"; observacao: string }
  | { tipo: "atualizar_contratacao"; situacao: "aguardando_aprovacao" | "aguardando_pagamento" | "contratado"; data: string };

// O que a IA fez (ou tentou e o sistema não deixou, com o motivo)
export type ItemAcao = { descricao: string; aviso?: boolean };

// Um passo para voltar ao estado anterior
export type Desfazer =
  | { tipo: "atividade"; etapa: number; codigo: string; status: Atividade["status"]; justificativa: string }
  | { tipo: "secao"; etapa: number; chave: string; texto: string | null }
  | { tipo: "entregavel"; etapa: number; titulo: string; conteudo: string }
  | { tipo: "evidencia"; etapa: number; id: string }
  | { tipo: "registro"; id: string }
  | { tipo: "status"; etapa: number; status: StatusEtapaTipo }
  | {
      tipo: "datas";
      etapa: number;
      dataInicio: string | null;
      dataFim: string | null;
      dataInicioPlano: string | null;
      dataFimPlano: string | null;
      dataRelatorio: string | null;
    }
  | { tipo: "plano"; planoFechadoEm: string | null; status: Projeto["status"] }
  | { tipo: "contratacao"; anterior: Contratacao | null }
  | { tipo: "assinatura"; etapa: number; assinaturaConsultor: string | null; assinaturaCliente: string | null; relatorioAssinado: RelatorioAssinado | null };

const concluida = (s: StatusEtapaTipo) => s === "enviada" || s === "aprovada";
const resumo = (t: string, n = 60) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);
const dataValida = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
const passoDatas = (e: Etapa): Desfazer => ({
  tipo: "datas",
  etapa: e.ordem,
  dataInicio: e.dataInicio,
  dataFim: e.dataFim,
  dataInicioPlano: e.dataInicioPlano,
  dataFimPlano: e.dataFimPlano,
  dataRelatorio: e.dataRelatorio,
});

// Etapas em sequência, cada uma com início e fim, sem sobreposição
export function cronogramaValido(p: Projeto) {
  return p.etapas.every((e, i) => !!e.dataInicio && !!e.dataFim && e.dataInicio <= e.dataFim && (i === 0 || e.dataInicio > (p.etapas[i - 1].dataFim ?? "")));
}

// Aplica as ações no projeto (que é alterado) e devolve o que foi feito e como
// desfazer. Determinística: os identificadores vêm da mensagem, então dá o
// mesmo resultado quando aplicada de novo sobre o mesmo projeto.
export function aplicarAcoes(p: Projeto, acoes: AcaoIA[], anexos: Anexo[], mensagemId: string, autor: string) {
  const itens: ItemAcao[] = [];
  const feito = (descricao: string) => void itens.push({ descricao });
  const avisar = (descricao: string) => itens.push({ descricao, aviso: true });
  const desfazer: Desfazer[] = [];
  const statusAntes = new Map(p.etapas.map((e) => [e.ordem, e.status]));
  const tocadas = new Set<number>();
  const situacaoDefinida = new Set<number>();
  const datasAlteradas: { item: number; passo: number }[] = [];
  if (p.status === "encerrado") return { itens, desfazer };

  acoes.forEach((a, i) => {
    // Antes da consultoria: diagnóstico enviado, gestor aprovou, cliente pagou
    if (a.tipo === "atualizar_contratacao") {
      const antes = p.contratacao?.situacao ?? "contratado";
      if (!ordemContratacao.includes(a.situacao) || ordemContratacao.indexOf(a.situacao) <= ordemContratacao.indexOf(antes)) return;
      const data = dataValida(a.data) ? a.data : hojeIso();
      desfazer.push({ tipo: "contratacao", anterior: p.contratacao ? { ...p.contratacao } : null });
      p.contratacao = mudarContratacao(p.contratacao, a.situacao, data);
      feito(
        a.situacao === "aguardando_aprovacao"
          ? `Diagnóstico enviado no HUB em ${formatarData(data)}; aguardando o gestor`
          : a.situacao === "aguardando_pagamento"
            ? `Gestor aprovou a contratação em ${formatarData(data)}; aguardando o pagamento`
            : `Cliente pagou em ${formatarData(data)}: a consultoria começou`,
      );
      return;
    }
    // Cronograma do projeto inteiro: só enquanto o plano não foi definido
    if (a.tipo === "definir_cronograma") {
      if (p.planoFechadoEm || !dataValida(a.inicio) || (a.fim && !dataValida(a.fim))) return;
      if (!a.fim && p.etapas.every((e) => !e.duracaoReferenciaDias))
        return avisar("Plano de trabalho não definido: este serviço não tem duração de referência; diga também a data de fim");
      const linhas = a.fim
        ? distribuirPorHoras(
            a.inicio,
            a.fim,
            p.etapas.map((e) => e.horasPrevistas),
          )
        : sugerirDatas(
            a.inicio,
            p.etapas.map((e) => e.duracaoReferenciaDias),
          );
      if (!linhas) return avisar("Plano de trabalho não definido: o período tem menos dias do que etapas");
      p.etapas.forEach((e, j) => {
        desfazer.push(passoDatas(e));
        e.dataInicio = e.dataInicioPlano = linhas[j].inicio;
        e.dataFim = e.dataFimPlano = linhas[j].fim;
        e.dataRelatorio ??= linhas[j].fim;
        tocadas.add(e.ordem);
      });
      desfazer.push({ tipo: "plano", planoFechadoEm: p.planoFechadoEm, status: p.status });
      p.planoFechadoEm = new Date().toISOString().slice(0, 19);
      p.status = "em_andamento";
      const fim = linhas[linhas.length - 1].fim;
      feito(
        `Plano de trabalho definido: ${formatarData(a.inicio)} a ${formatarData(fim)}, ${p.etapas.length} etapas divididas ${a.fim ? "pela carga horária" : "pela duração de referência"}`,
      );
      return;
    }

    const e = p.etapas.find((x) => x.ordem === a.etapa);
    if (!e) return;
    const et = `Etapa ${doisDigitos(e.ordem)}`;

    // Situação: a única ação que vale para etapas já enviadas (aprovação ou devolução do SEBRAE)
    if (a.tipo === "mudar_situacao_etapa") {
      const rotulo = statusEtapa[a.situacao]?.rotulo;
      if (!rotulo || e.status === a.situacao) return;
      const deEnviada = a.situacao === "aprovada" || a.situacao === "devolvida";
      if (deEnviada !== (e.status === "enviada") || e.status === "aprovada")
        return avisar(`${et} não foi para “${rotulo}”: ${deEnviada ? "só uma etapa enviada no HUB pode ser aprovada ou devolvida" : "a etapa já foi enviada"}`);
      const bloqueio = bloqueioStatus(p, e, a.situacao);
      if (bloqueio && a.situacao !== "devolvida") return avisar(`${et} não foi para “${rotulo}”: ${bloqueio.charAt(0).toLowerCase()}${bloqueio.slice(1)}`);
      desfazer.push({ tipo: "status", etapa: e.ordem, status: e.status });
      // Devolvida: o relatório vai mudar, então as assinaturas e o PDF enviados deixam de valer
      if (a.situacao === "devolvida") {
        desfazer.push({
          tipo: "assinatura",
          etapa: e.ordem,
          assinaturaConsultor: e.assinaturaConsultor,
          assinaturaCliente: e.assinaturaCliente,
          relatorioAssinado: e.relatorioAssinado ?? null,
        });
        e.assinaturaConsultor = null;
        e.assinaturaCliente = null;
        e.relatorioAssinado = null;
      }
      e.status = a.situacao;
      situacaoDefinida.add(e.ordem);
      feito(`${et} marcada como “${rotulo}”${a.observacao.trim() ? ` (${resumo(a.observacao.trim(), 120)})` : ""}`);
      return;
    }

    if (concluida(e.status)) return;

    if (a.tipo === "alterar_datas_etapa") {
      if (!p.planoFechadoEm || !dataValida(a.inicio) || !dataValida(a.fim) || a.fim < a.inicio) return;
      if (e.dataInicio === a.inicio && e.dataFim === a.fim) return;
      const antes = `${formatarData(e.dataInicio)} a ${formatarData(e.dataFim)}`;
      datasAlteradas.push({ item: itens.length, passo: desfazer.length });
      desfazer.push(passoDatas(e));
      if (e.dataRelatorio === e.dataFim) e.dataRelatorio = a.fim; // acompanha o novo fim, se não foi mudada à mão
      e.dataInicio = a.inicio;
      e.dataFim = a.fim;
      feito(
        `${et}: datas de ${antes} para ${formatarData(a.inicio)} a ${formatarData(a.fim)}${a.justificativa.trim() ? ` (${resumo(a.justificativa.trim(), 120)})` : ""}`,
      );
      return;
    }

    if (a.tipo === "marcar_atividades") {
      const marcadas: string[] = [];
      for (const codigo of a.codigos) {
        if (!e.atividades.some((x) => x.codigo === codigo)) continue;
        // A mãe leva junto as filhas pendentes: guarda como estava cada uma, para desfazer
        const antes = new Map(e.atividades.map((x) => [x.codigo, { status: x.status, justificativa: x.justificativa }]));
        for (const c of marcarAtividade(e, codigo, a.situacao, a.justificativa)) {
          desfazer.push({ tipo: "atividade", etapa: e.ordem, codigo: c, ...antes.get(c)! });
          if (!marcadas.includes(c)) marcadas.push(c);
        }
      }
      if (marcadas.length)
        feito(
          `${et}: ${marcadas.length === 1 ? "atividade" : "atividades"} ${marcadas.join(", ")} ${a.situacao === "feito" ? (marcadas.length === 1 ? "marcada como feita" : "marcadas como feitas") : "marcadas como não se aplica"}`,
        );
    } else if (a.tipo === "escrever_secao") {
      const def = todasSecoes.find((d) => d.chave === a.chave);
      if (!def || !a.texto.trim()) return;
      desfazer.push({ tipo: "secao", etapa: e.ordem, chave: a.chave, texto: e.secoes[a.chave] ?? null });
      const novo = !(e.secoes[a.chave] ?? "").trim();
      e.secoes[a.chave] = a.texto.trim();
      feito(`${et}: seção “${def.titulo(e)}” ${novo ? "escrita" : "atualizada"}`);
    } else if (a.tipo === "escrever_entregavel") {
      const ent = e.entregaveis.find((x) => x.titulo === a.titulo);
      if (!ent || !a.texto.trim()) return;
      desfazer.push({ tipo: "entregavel", etapa: e.ordem, titulo: ent.titulo, conteudo: ent.conteudo });
      const novo = !ent.conteudo.trim();
      ent.conteudo = a.texto.trim();
      feito(`${et}: entregável “${resumo(ent.titulo)}” ${novo ? "escrito" : "atualizado"}`);
    } else if (a.tipo === "guardar_anexo") {
      const anexo = anexos.find((x) => x.id === a.anexo);
      if (!anexo || !anexo.tipo.startsWith("image/")) return;
      const id = `ev-${anexo.id}`;
      if ((e.evidencias ?? []).some((x) => x.id === id)) return;
      (e.evidencias ??= []).push({
        id,
        caminho: anexo.caminho,
        legenda: a.legenda.trim() || anexo.nome,
        largura: anexo.largura ?? 1600,
        altura: anexo.altura ?? 1200,
        tipo: anexo.tipo,
      });
      desfazer.push({ tipo: "evidencia", etapa: e.ordem, id });
      feito(`${et}: foto guardada como evidência (“${resumo(a.legenda.trim() || anexo.nome)}”)`);
    } else if (a.tipo === "registrar_atividade") {
      if (!(a.horas > 0 && a.horas <= 24) || !/^\d{4}-\d{2}-\d{2}$/.test(a.data) || !tiposAtividade[a.modalidade]) return;
      const id = `atv-${mensagemId}-${i}`;
      if ((p.atividadesRegistradas ?? []).some((x) => x.id === id)) return;
      (p.atividadesRegistradas ??= []).push({
        id,
        data: a.data,
        etapa: e.ordem,
        tipo: a.modalidade,
        horas: a.horas,
        participantes: a.modalidade === "trabalho_interno" ? "" : a.participantes.trim(),
        anotacoes: a.anotacoes.trim(),
        registradoPor: autor,
      });
      desfazer.push({ tipo: "registro", id });
      feito(`${et}: ${tiposAtividade[a.modalidade].rotulo.toLowerCase()} de ${formatarData(a.data)} registrada (${horasFmt(a.horas)})`);
    } else if (a.tipo === "registrar_assinatura") {
      // PDF assinado no gov.br, mandado na conversa, e/ou as datas das assinaturas
      const pdf = anexos.find((x) => x.id === a.anexo && x.tipo === "application/pdf");
      const consultor = dataValida(a.data_consultor) ? a.data_consultor : null;
      const cliente = dataValida(a.data_cliente) ? a.data_cliente : null;
      if (!pdf && !consultor && !cliente) return;
      desfazer.push({
        tipo: "assinatura",
        etapa: e.ordem,
        assinaturaConsultor: e.assinaturaConsultor,
        assinaturaCliente: e.assinaturaCliente,
        relatorioAssinado: e.relatorioAssinado ?? null,
      });
      const hoje = hojeIso();
      if (pdf) e.relatorioAssinado = { caminho: pdf.caminho, nome: pdf.nome, enviadoEm: new Date().toISOString(), por: autor };
      e.assinaturaConsultor = consultor ?? e.assinaturaConsultor ?? (pdf ? hoje : null);
      e.assinaturaCliente = cliente ?? e.assinaturaCliente ?? (pdf ? hoje : null);
      feito(
        pdf
          ? `${et}: relatório assinado guardado (“${resumo(pdf.nome)}”)`
          : `${et}: assinaturas registradas (${[consultor && `consultor em ${formatarData(consultor)}`, cliente && `cliente em ${formatarData(cliente)}`].filter(Boolean).join(", ")})`,
      );
    } else return;
    tocadas.add(e.ordem);
  });

  // Datas que deixariam etapas sobrepostas não valem: volta todas as mudanças de datas avulsas
  if (datasAlteradas.length && !cronogramaValido(p)) {
    const passos = new Set(datasAlteradas.map((d) => d.passo));
    const linhas = new Set(datasAlteradas.map((d) => d.item));
    desfazerAcoes(
      p,
      desfazer.filter((_, j) => passos.has(j)),
    );
    desfazer.splice(0, desfazer.length, ...desfazer.filter((_, j) => !passos.has(j)));
    itens.splice(0, itens.length, ...itens.filter((_, j) => !linhas.has(j)));
    avisar("Datas não alteradas: as etapas ficariam sobrepostas ou fora de ordem. Diga as novas datas de todas as etapas afetadas");
  }

  // O status avança sozinho pelas regras de sempre (checklist completo → redação…)
  for (const ordem of tocadas) {
    if (situacaoDefinida.has(ordem)) continue;
    const e = p.etapas.find((x) => x.ordem === ordem)!;
    automatizarEtapa(p, e);
    const antes = statusAntes.get(ordem)!;
    if (e.status !== antes) {
      desfazer.push({ tipo: "status", etapa: ordem, status: antes });
      feito(`Etapa ${doisDigitos(ordem)} passou para “${statusEtapa[e.status].rotulo}”`);
    }
  }
  return { itens, desfazer };
}

// Volta cada passo, do último para o primeiro
export function desfazerAcoes(p: Projeto, passos: Desfazer[]) {
  for (const d of [...passos].reverse()) {
    if (d.tipo === "contratacao") {
      if (d.anterior) p.contratacao = d.anterior;
      else delete p.contratacao;
      continue;
    }
    if (d.tipo === "plano") {
      p.planoFechadoEm = d.planoFechadoEm;
      p.status = d.status;
      continue;
    }
    if (d.tipo === "registro") {
      p.atividadesRegistradas = (p.atividadesRegistradas ?? []).filter((r) => r.id !== d.id);
      continue;
    }
    const e = p.etapas.find((x) => x.ordem === d.etapa);
    if (!e) continue;
    if (d.tipo === "atividade") {
      const at = e.atividades.find((x) => x.codigo === d.codigo);
      if (at) {
        at.status = d.status;
        at.justificativa = d.justificativa;
      }
    } else if (d.tipo === "secao") {
      if (d.texto === null) delete e.secoes[d.chave];
      else e.secoes[d.chave] = d.texto;
    } else if (d.tipo === "entregavel") {
      const ent = e.entregaveis.find((x) => x.titulo === d.titulo);
      if (ent) ent.conteudo = d.conteudo;
    } else if (d.tipo === "evidencia") {
      e.evidencias = (e.evidencias ?? []).filter((x) => x.id !== d.id);
    } else if (d.tipo === "status") {
      e.status = d.status;
    } else if (d.tipo === "datas") {
      e.dataInicio = d.dataInicio;
      e.dataFim = d.dataFim;
      e.dataInicioPlano = d.dataInicioPlano;
      e.dataFimPlano = d.dataFimPlano;
      e.dataRelatorio = d.dataRelatorio;
    } else if (d.tipo === "assinatura") {
      e.assinaturaConsultor = d.assinaturaConsultor;
      e.assinaturaCliente = d.assinaturaCliente;
      e.relatorioAssinado = d.relatorioAssinado;
    }
  }
}

// Sugestões de mensagem para levar o projeto à próxima etapa, até o fim.
// "__" marca o que o consultor completa antes de enviar.
export function sugestoesConversa(p: Projeto): string[] {
  if (p.status === "encerrado") return [];
  const nomeEtapa = (e: Etapa) => `Etapa ${doisDigitos(e.ordem)} (${e.nome.charAt(0)}${e.nome.slice(1).toLowerCase()})`;
  const fase = faseDoProjeto(p);
  if (fase === "diagnostico")
    return [
      "Me ajude a montar o diagnóstico. O cliente pediu: __. O que mapeei: __.",
      "Por que esta solicitação se justifica para o cliente? Monte os argumentos.",
      `Enviei o diagnóstico no HUB hoje (${formatarData(hojeIso())}).`,
    ];
  if (fase === "aguardando_aprovacao") return ["O gestor aprovou o diagnóstico hoje.", "O que acontece depois que o gestor aprovar?"];
  if (fase === "aguardando_pagamento")
    return [`O cliente pagou hoje (${formatarData(hojeIso())}).`, "O cliente pagou. A consultoria começa em __/__/____ e termina em __/__/____."];
  if (!p.planoFechadoEm)
    return [
      `O projeto começa em ${formatarData(hojeIso())} e termina em __/__/____. Monte o plano de trabalho.`,
      "Ainda não sei a data de fim. Monte o plano de trabalho a partir de hoje, com a duração de referência das etapas.",
      "O que preciso preparar para a primeira visita?",
    ];

  const devolvida = p.etapas.find((e) => e.status === "devolvida");
  if (devolvida)
    return [
      `O SEBRAE devolveu a ${nomeEtapa(devolvida)} pedindo: __. Ajuste o relatório.`,
      `O que preciso corrigir para reenviar a Etapa ${doisDigitos(devolvida.ordem)}?`,
    ];

  const e = etapaAtual(p);
  if (!e) {
    const enviada = p.etapas.find((x) => x.status === "enviada");
    if (enviada) return [`O SEBRAE aprovou a Etapa ${doisDigitos(enviada.ordem)}.`, `O SEBRAE devolveu a Etapa ${doisDigitos(enviada.ordem)} pedindo: __.`];
    return ["Faça um resumo final do projeto: o que foi feito em cada etapa e as horas."];
  }

  const n = doisDigitos(e.ordem);
  // Etapa anterior ainda aguardando o SEBRAE: lembrar da aprovação junto
  const anterior = p.etapas.find((x) => x.ordem < e.ordem && x.status === "enviada");
  const extra = anterior ? [`O SEBRAE aprovou a Etapa ${doisDigitos(anterior.ordem)}.`] : [];

  // A atividade-mãe tem o texto mais curto; sem ela, a primeira subatividade pendente
  const pendente = e.atividades.find((a) => a.status === "pendente" && !a.codigo.includes(".")) ?? e.atividades.find((a) => a.status === "pendente");
  if (pendente)
    return [
      `Hoje fiz uma visita de __ horas. Trabalhamos em: ${pendente.texto.charAt(0).toLowerCase()}${pendente.texto.slice(1)}.`,
      `O que falta para concluir a ${nomeEtapa(e)}?`,
      ...extra,
      `Escreva o que já dá para escrever do relatório da Etapa ${n}.`,
    ].slice(0, 3);

  if (verificarCompletude(p, e).length)
    return [
      `Escreva o relatório e os entregáveis da Etapa ${n} com o que já registramos.`,
      `O que ainda falta para o relatório da Etapa ${n} ficar completo?`,
      ...extra,
    ];

  if (!assinada(e))
    return [
      `Segue o relatório da Etapa ${n} assinado no gov.br (anexe o PDF).`,
      `Eu assinei o relatório da Etapa ${n} em __/__ e o cliente em __/__.`,
      ...extra,
    ];

  return [`Enviei o relatório da Etapa ${n} no HUB hoje.`, ...extra];
}
