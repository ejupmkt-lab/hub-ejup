import type { Atividade, Contratacao, Diagnostico, Etapa, Hub, PassoHub, Projeto, Registro, RelatorioAssinado } from "./dados/tipos";
import { ajustarPlanoAoPagamento, aplicarPlanoHub, carimbarInicios, datasMudadasAMao, reencadearExecucao, avisoEnvioAntecipado, avisoFinalizarAntecipado, bloqueioAte, dataDoPagamento, textoPlanoAjustado, mudarHub, ordemPassos, passoHubDoProjeto, registroHub } from "./fase";
import { ehUltimaEtapa, faltaDoRelatorio, todasSecoes, verificarCompletude } from "./relatorio/secoes";
import { assinada, automatizarEtapa, bloqueioStatus, marcarAtividade } from "./regras-etapa";
import { doisDigitos, statusEtapa, type StatusEtapa as StatusEtapaTipo } from "./rotulos";
import { distribuirPorHoras, formatarData, hojeIso, sugerirDatas } from "./datas";
import { etapaAtual } from "./projeto";
import { tipoRegistro } from "./registros";

// Conversa do projeto: o que a IA pode fazer no projeto a partir de uma
// mensagem, e como desfazer. As ações chegam do servidor já no formato
// abaixo; aqui elas são conferidas (etapa, seção, código existem?) antes de valer.

export type Anexo = { id: string; caminho: string; nome: string; tipo: string; largura?: number; altura?: number };

export type AcaoIA =
  | { tipo: "marcar_atividades"; etapa: number; codigos: string[]; situacao: "feito" | "nao_aplicavel"; justificativa: string }
  | { tipo: "escrever_secao"; etapa: number; chave: string; texto: string }
  | { tipo: "escrever_entregavel"; etapa: number; titulo: string; texto: string }
  | { tipo: "guardar_anexo"; etapa: number; anexo: string; legenda: string }
  | { tipo: "definir_cronograma"; inicio: string; fim: string }
  | { tipo: "alterar_datas_etapa"; etapa: number; inicio: string; fim: string; justificativa: string }
  | { tipo: "alterar_plano_hub"; etapa: number; inicio: string; fim: string; justificativa: string }
  | { tipo: "registrar_assinatura"; etapa: number; anexo: string; data_consultor: string; data_cliente: string }
  | { tipo: "mudar_situacao_etapa"; etapa: number; situacao: "a_enviar" | "enviada" | "aprovada" | "devolvida"; observacao: string }
  | { tipo: "avancar_hub"; passo: PassoHub; data: string }
  | { tipo: "preencher_tabela"; tabela: string; linhas: string[][]; substituir: boolean }
  // O diagnóstico do projeto (texto completo e atualizado); o Word sai dele em Entregas
  | { tipo: "escrever_diagnostico"; texto: string }
  // Só vem da importação do HUB (a conversa não oferece): código do pedido e gestor lidos na página do HUB
  | { tipo: "dados_hub"; codigo_hub: string; gestor: string }
  // Só vem da importação do HUB: a etapa já foi enviada no HUB na data dada; com o PDF do relatório, ele fica em Entregas
  | {
      tipo: "registrar_envio_etapa";
      etapa: number;
      data: string;
      relatorio?: { caminho: string; nome: string };
      // Datas lidas no relatório da etapa (quando a IA leu o PDF baixado do HUB)
      inicio?: string;
      data_relatorio?: string;
      assinatura_consultor?: string;
      assinatura_cliente?: string;
    };

// O que a IA fez (ou tentou e o sistema não deixou, com o motivo)
export type ItemAcao = { descricao: string; aviso?: boolean };

// Um passo para voltar ao estado anterior
export type Desfazer =
  | { tipo: "atividade"; etapa: number; codigo: string; status: Atividade["status"]; justificativa: string }
  | { tipo: "secao"; etapa: number; chave: string; texto: string | null }
  | { tipo: "entregavel"; etapa: number; titulo: string; conteudo: string }
  | { tipo: "evidencia"; etapa: number; id: string }
  | { tipo: "status"; etapa: number; status: StatusEtapaTipo }
  | {
      tipo: "datas";
      etapa: number;
      dataInicio: string | null;
      dataFim: string | null;
      dataInicioPlano: string | null;
      dataFimPlano: string | null;
      dataInicioBase?: string | null; // desfazeres antigos não têm
      dataFimBase?: string | null;
      dataRelatorio: string | null;
    }
  | { tipo: "plano"; planoFechadoEm: string | null; status: Projeto["status"] }
  | { tipo: "hub"; hub: Hub | null; contratacao: Contratacao | null; status: Projeto["status"] }
  | { tipo: "registros"; registros: Registro[] }
  | { tipo: "diagnostico"; antes: Diagnostico | null }
  | { tipo: "etapa"; etapa: number; antes: Etapa }
  | { tipo: "dados"; numeroProjetoHub: string; codigoSolicitacaoHub: string; gestorSebrae: string }
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
  dataInicioBase: e.dataInicioBase ?? null,
  dataFimBase: e.dataFimBase ?? null,
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

  let planoHubFeito = false;
  acoes.forEach((a, i) => {
    // Código do pedido e gestor, lidos na página do HUB
    if (a.tipo === "dados_hub") {
      const codigo = String(a.codigo_hub ?? "").trim();
      const gestor = String(a.gestor ?? "").trim();
      const mudaCodigo = !!codigo && codigo !== (p.codigoSolicitacaoHub || p.numeroProjetoHub);
      const mudaGestor = !!gestor && gestor !== p.gestorSebrae;
      if (!mudaCodigo && !mudaGestor) return;
      desfazer.push({ tipo: "dados", numeroProjetoHub: p.numeroProjetoHub, codigoSolicitacaoHub: p.codigoSolicitacaoHub, gestorSebrae: p.gestorSebrae });
      if (mudaCodigo) p.numeroProjetoHub = p.codigoSolicitacaoHub = codigo;
      if (mudaGestor) p.gestorSebrae = gestor;
      feito(`Dados do pedido: ${[mudaCodigo ? `código do HUB ${codigo}` : "", mudaGestor ? `gestor ${gestor}` : ""].filter(Boolean).join("; ")}`);
      return;
    }
    // Diagnóstico do projeto: o texto inteiro, sempre atualizado (o arquivo anexado, se houver, não muda)
    if (a.tipo === "escrever_diagnostico") {
      const texto = String(a.texto ?? "").trim();
      if (!texto) return;
      desfazer.push({ tipo: "diagnostico", antes: p.diagnostico ? structuredClone(p.diagnostico) : null });
      const novo = !(p.diagnostico?.texto ?? "").trim();
      p.diagnostico = { arquivo: null, ...p.diagnostico, texto, atualizadoEm: hojeIso() };
      feito(`Diagnóstico: texto ${novo ? "escrito" : "atualizado"} (o Word está em Entregas, na área Diagnóstico)`);
      return;
    }
    // Tabelas do relatório ([[tabela:tipo]]): linhas com as células na ordem das colunas
    if (a.tipo === "preencher_tabela") {
      const t = tipoRegistro(a.tabela);
      const linhas = (a.linhas ?? []).filter((l) => Array.isArray(l) && l.some((c) => String(c ?? "").trim()));
      if (!t || !linhas.length) return;
      desfazer.push({ tipo: "registros", registros: structuredClone(p.registros) });
      if (a.substituir) p.registros = p.registros.filter((r) => r.tipo !== t.tipo);
      const usados = p.registros.filter((r) => r.tipo === t.tipo).map((r) => Number(r.codigo.replace(t.prefixo, "")) || 0);
      let n = Math.max(0, ...usados);
      const origem = etapaAtual(p)?.ordem ?? 1;
      linhas.forEach((l, j) => {
        n += 1;
        p.registros.push({
          id: `reg-${mensagemId}-${i}-${j}`,
          tipo: t.tipo,
          codigo: `${t.prefixo}${n}`,
          dados: Object.fromEntries(t.colunas.map((c, k) => [c.chave, String(l[k] ?? "").trim()])),
          etapaOrigem: origem,
        });
      });
      feito(`Tabela “${t.nome}”: ${linhas.length} ${linhas.length === 1 ? "linha" : "linhas"} ${a.substituir ? "(substituindo as anteriores)" : "acrescentadas"}`);
      return;
    }

    // Plano do HUB (o orçamento enviado à FUNCERN): todas as etapas citadas mudam juntas, para ficarem em sequência
    if (a.tipo === "alterar_plano_hub") {
      if (planoHubFeito) return;
      planoHubFeito = true;
      if (!p.planoFechadoEm) return avisar("O plano de trabalho ainda não foi definido; não alterei as datas do plano do HUB");
      const pedidas = acoes.filter((x): x is Extract<AcaoIA, { tipo: "alterar_plano_hub" }> => x.tipo === "alterar_plano_hub");
      const validas = pedidas.filter((x) => p.etapas.some((e) => e.ordem === x.etapa) && dataValida(x.inicio) && dataValida(x.fim));
      if (!validas.length) return avisar("Não alterei o plano do HUB: as datas informadas não são válidas");
      const antes = p.etapas.map(passoDatas);
      const motivo = aplicarPlanoHub(
        p,
        validas.map((x) => ({ ordem: x.etapa, inicio: x.inicio, fim: x.fim })),
      );
      if (motivo) return avisar(`Não alterei o plano do HUB: ${motivo.charAt(0).toLowerCase()}${motivo.slice(1)}`);
      antes.forEach((d) => desfazer.push(d));
      for (const x of validas) tocadas.add(x.etapa);
      const just = validas.find((x) => x.justificativa.trim())?.justificativa.trim();
      feito(
        `Plano do HUB alterado: ${validas.map((x) => `etapa ${doisDigitos(x.etapa)} de ${formatarData(x.inicio)} a ${formatarData(x.fim)}`).join("; ")}${just ? ` (${resumo(just, 120)})` : ""}. A execução foi recalculada a partir do pagamento.`,
      );
      return;
    }

    // Passos do HUB: diagnóstico enviado, proposta, FUNCERN, pagamento, finalização…
    if (a.tipo === "avancar_hub") {
      const atual = passoHubDoProjeto(p);
      if (!ordemPassos.includes(a.passo) || ordemPassos.indexOf(a.passo) <= ordemPassos.indexOf(atual)) return;
      const motivo = bloqueioAte(p, a.passo);
      if (motivo) return avisar(`Não registrei “${registroHub[a.passo](a.data).split(" em ")[0]}”: ${motivo}`);
      const data = dataValida(a.data) ? a.data : hojeIso();
      const cedo = a.passo === "finalizado" ? avisoFinalizarAntecipado(p, data) : null;
      desfazer.push({ tipo: "hub", hub: p.hub ? structuredClone(p.hub) : null, contratacao: p.contratacao ?? null, status: p.status });
      // O pagamento move o plano de trabalho: guarda as datas para desfazer
      const inicioAntes = p.etapas[0]?.dataInicio;
      if (a.passo === "execucao") for (const e of p.etapas) desfazer.push(passoDatas(e));
      mudarHub(p, a.passo, data);
      feito(registroHub[a.passo](data));
      if (a.passo === "execucao" && p.etapas[0]?.dataInicio !== inicioAntes) feito(textoPlanoAjustado(p));
      if (cedo) avisar(cedo);
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
        datasMudadasAMao(e);
        e.dataRelatorio ??= linhas[j].fim;
        tocadas.add(e.ordem);
      });
      desfazer.push({ tipo: "plano", planoFechadoEm: p.planoFechadoEm, status: p.status });
      p.planoFechadoEm = new Date().toISOString().slice(0, 19);
      p.status = "em_andamento";
      const pago = dataDoPagamento(p);
      if (pago && ajustarPlanoAoPagamento(p, pago)) feito(textoPlanoAjustado(p));
      const fim = linhas[linhas.length - 1].fim;
      feito(
        `Plano de trabalho definido: ${formatarData(a.inicio)} a ${formatarData(fim)}, ${p.etapas.length} etapas divididas ${a.fim ? "pela carga horária" : "pela duração de referência"}`,
      );
      return;
    }

    const e = p.etapas.find((x) => x.ordem === a.etapa);
    if (!e) return;
    const et = `Etapa ${doisDigitos(e.ordem)}`;

    // Importação do HUB: a etapa já foi enviada lá. Sem o PDF no sistema, só o envio fica registrado
    if (a.tipo === "registrar_envio_etapa") {
      if (!dataValida(a.data)) return avisar(`${et}: não registrei o envio porque a data de envio no HUB não é válida`);
      const jaEnviada = concluida(e.status);
      if (jaEnviada && (!a.relatorio || e.relatorioAssinado)) return;
      if (!jaEnviada && ordemPassos.indexOf(passoHubDoProjeto(p)) < ordemPassos.indexOf("execucao"))
        return avisar(`${et}: não registrei o envio no HUB porque o pagamento do cliente ainda não está registrado`);
      desfazer.push({ tipo: "etapa", etapa: e.ordem, antes: structuredClone(e) });
      if (!jaEnviada) {
        e.status = "enviada";
        e.enviadaEm = a.data;
        e.dataRelatorio ??= a.data;
        e.atividades.forEach((x) => x.status === "pendente" && (x.status = "feito"));
        situacaoDefinida.add(e.ordem);
      }
      if (a.relatorio) {
        e.relatorioAssinado = { caminho: a.relatorio.caminho, nome: a.relatorio.nome, enviadoEm: `${a.data}T12:00:00`, por: autor };
        e.relatorioExterno = true;
      }
      // Datas escritas no relatório: assinaturas, fechamento e começo das atividades
      const consultorEm = a.assinatura_consultor && dataValida(a.assinatura_consultor) ? a.assinatura_consultor : null;
      const clienteEm = a.assinatura_cliente && dataValida(a.assinatura_cliente) ? a.assinatura_cliente : null;
      if (a.relatorio || consultorEm || clienteEm) {
        e.assinaturaConsultor = consultorEm ?? e.assinaturaConsultor ?? (a.relatorio ? a.data : null);
        e.assinaturaCliente = clienteEm ?? e.assinaturaCliente ?? (a.relatorio ? a.data : null);
      }
      if (a.data_relatorio && dataValida(a.data_relatorio)) e.dataRelatorio = a.data_relatorio;
      if (a.inicio && dataValida(a.inicio) && a.inicio <= a.data) e.iniciadaEm = a.inicio;
      const datasDoRelatorio = [
        a.data_relatorio && dataValida(a.data_relatorio) && `relatório de ${formatarData(a.data_relatorio)}`,
        a.inicio && dataValida(a.inicio) && `atividades desde ${formatarData(a.inicio)}`,
        consultorEm && `assinado pelo consultor em ${formatarData(consultorEm)}`,
        clienteEm && `assinado pela empresa em ${formatarData(clienteEm)}`,
      ].filter(Boolean);
      feito(
        `${et}: ${jaEnviada ? "relatório guardado em Entregas" : `enviada no HUB em ${formatarData(a.data)}`}${a.relatorio && !jaEnviada ? `, com o relatório “${resumo(a.relatorio.nome)}” em Entregas` : a.relatorio ? ` (“${resumo(a.relatorio.nome)}”)` : ""}${datasDoRelatorio.length ? `; lido do relatório: ${datasDoRelatorio.join(", ")}` : ""}`,
      );
      return;
    }

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
      const cedo = a.situacao === "enviada" ? avisoEnvioAntecipado(e) : null;
      e.status = a.situacao;
      if (a.situacao === "enviada") e.enviadaEm = hojeIso();
      situacaoDefinida.add(e.ordem);
      feito(`${et} marcada como “${rotulo}”${a.observacao.trim() ? ` (${resumo(a.observacao.trim(), 120)})` : ""}`);
      if (cedo) avisar(cedo);
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
      datasMudadasAMao(e);
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
      feito(`${et}: seção “${def.titulo(e, ehUltimaEtapa(p.etapas, e))}” ${novo ? "escrita" : "atualizada"}`);
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
  carimbarInicios(p, statusAntes);
  reencadearExecucao(p);
  return { itens, desfazer };
}

// Volta cada passo, do último para o primeiro
export function desfazerAcoes(p: Projeto, passos: Desfazer[]) {
  for (const d of [...passos].reverse()) {
    if (d.tipo === "diagnostico") {
      // O arquivo anexado depois da ação fica; só o texto volta
      if (d.antes) p.diagnostico = { ...d.antes, arquivo: p.diagnostico?.arquivo ?? d.antes.arquivo };
      else if (p.diagnostico?.arquivo) p.diagnostico = { ...p.diagnostico, texto: "", atualizadoEm: null };
      else delete p.diagnostico;
      continue;
    }
    if (d.tipo === "registros") {
      p.registros = d.registros;
      continue;
    }
    if (d.tipo === "hub") {
      if (d.hub) p.hub = d.hub;
      else delete p.hub;
      if (d.contratacao) p.contratacao = d.contratacao;
      else delete p.contratacao;
      p.status = d.status;
      continue;
    }
    if (d.tipo === "etapa") {
      const i = p.etapas.findIndex((x) => x.ordem === d.etapa);
      if (i >= 0) p.etapas[i] = d.antes;
      continue;
    }
    if (d.tipo === "dados") {
      p.numeroProjetoHub = d.numeroProjetoHub;
      p.codigoSolicitacaoHub = d.codigoSolicitacaoHub;
      p.gestorSebrae = d.gestorSebrae;
      continue;
    }
    if (d.tipo === "plano") {
      p.planoFechadoEm = d.planoFechadoEm;
      p.status = d.status;
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
      if (d.dataInicioBase !== undefined) {
        e.dataInicioBase = d.dataInicioBase;
        e.dataFimBase = d.dataFimBase ?? null;
      } else datasMudadasAMao(e);
      e.dataInicioPlano = d.dataInicioPlano;
      e.dataFimPlano = d.dataFimPlano;
      e.dataRelatorio = d.dataRelatorio;
    } else if (d.tipo === "assinatura") {
      e.assinaturaConsultor = d.assinaturaConsultor;
      e.assinaturaCliente = d.assinaturaCliente;
      e.relatorioAssinado = d.relatorioAssinado;
    }
  }
  reencadearExecucao(p);
}

// Sugestões de mensagem para levar o projeto à próxima etapa, até o fim.
// "__" marca o que o consultor completa antes de enviar.
export function sugestoesConversa(p: Projeto): string[] {
  if (p.status === "encerrado") return [];
  const nomeEtapa = (e: Etapa) => `Etapa ${doisDigitos(e.ordem)} (${e.nome.charAt(0)}${e.nome.slice(1).toLowerCase()})`;
  const hoje = formatarData(hojeIso());
  const passo = passoHubDoProjeto(p);
  if (passo === "solicitacao") return [`O gestor me enviou a demanda hoje (${hoje}).`, "O que preciso para começar o diagnóstico?"];
  if (passo === "diagnostico")
    return [
      p.diagnostico?.texto?.trim() ? "Atualize o diagnóstico com o que acabei de mapear: __." : "Me ajude a montar o diagnóstico. O cliente pediu: __. O que mapeei: __.",
      "Por que esta solicitação se justifica para o cliente? Monte os argumentos.",
      `Enviei o diagnóstico no HUB hoje (${hoje}).`,
    ];
  if (passo === "diagnostico_enviado") return [`O gestor pediu a proposta hoje (${hoje}).`, "Como cobrar o gestor sobre a análise do diagnóstico?"];
  if (passo === "proposta" && !p.planoFechadoEm)
    return [
      "O projeto começa em __/__/____ e termina em __/__/____. Monte o plano de trabalho da proposta.",
      "Monte o plano de trabalho da proposta a partir de __/__/____, com a duração de referência das etapas.",
      "Quantas horas vai cada etapa e por quê?",
    ];
  if (passo === "proposta") return [`Enviei o plano de trabalho à FUNCERN hoje (${hoje}).`, "Escreva a mensagem para enviar o plano de trabalho à FUNCERN."];
  if (passo === "proposta_funcern") return [`A FUNCERN lançou a proposta no HUB hoje (${hoje}).`, "Escreva uma mensagem cobrando a FUNCERN sobre o lançamento da proposta."];
  if (passo === "proposta_cliente")
    return [`O cliente pagou hoje (${hoje}).`, "Escreva uma mensagem lembrando o cliente de analisar a proposta e pagar no HUB."];
  if (passo === "finalizado" && etapaAtual(p)?.status !== "devolvida")
    return [`O cliente avaliou a consultoria hoje (${hoje}).`, "Escreva uma mensagem pedindo ao cliente que avalie a consultoria no HUB."];
  if (passo === "avaliado" && etapaAtual(p)?.status !== "devolvida")
    return [`O gestor concluiu o projeto hoje (${hoje}).`, `O gestor devolveu a Etapa __ pedindo: __.`, "Faça um resumo final do projeto: o que foi feito em cada etapa."];
  if (!p.planoFechadoEm)
    return [
      `O projeto começa em ${formatarData(hojeIso())} e termina em __/__/____. Monte o plano de trabalho.`,
      "Ainda não sei a data de fim. Monte o plano de trabalho a partir de hoje, com a duração de referência das etapas.",
      "O que preciso preparar para começar a primeira etapa?",
    ];

  const devolvida = p.etapas.find((e) => e.status === "devolvida");
  if (devolvida)
    return [
      `O SEBRAE devolveu a ${nomeEtapa(devolvida)} pedindo: __. Ajuste o relatório.`,
      `O que preciso corrigir para reenviar a Etapa ${doisDigitos(devolvida.ordem)}?`,
    ];

  const e = etapaAtual(p);
  if (!e) return [`Finalizei o projeto no HUB hoje (${hoje}).`, "Faça um resumo final do projeto: o que foi feito em cada etapa."];

  const n = doisDigitos(e.ordem);
  const extra: string[] = [];

  // A atividade-mãe tem o texto mais curto; sem ela, a primeira subatividade pendente
  const pendente = e.atividades.find((a) => a.status === "pendente" && !a.codigo.includes(".")) ?? e.atividades.find((a) => a.status === "pendente");
  if (pendente)
    return [
      `Hoje trabalhei em: ${pendente.texto.charAt(0).toLowerCase()}${pendente.texto.slice(1)}.`,
      `O que falta para concluir a ${nomeEtapa(e)}?`,
      ...extra,
      ...(faltaDoRelatorio(p, e).emBranco ? [`Escreva o que já dá para escrever do relatório da Etapa ${n}.`] : []),
    ].slice(0, 3);

  if (verificarCompletude(p, e).length) {
    // O que sugerir depende do que falta de fato: escrever, resolver marcadores ou reunir evidências
    const falta = faltaDoRelatorio(p, e);
    if (!falta.emBranco && falta.marcadores)
      return [
        `Resolva os marcadores [completar] e [a confirmar] do relatório da Etapa ${n}: __.`,
        `Quais marcadores ainda estão abertos no relatório da Etapa ${n}?`,
        ...extra,
      ];
    if (!falta.emBranco && falta.semEvidencia)
      return [`Quais evidências faltam anexar ao relatório da Etapa ${n}?`, `Anexei as evidências da Etapa ${n} (fotos e prints).`, ...extra];
    return [
      `Escreva o relatório e os entregáveis da Etapa ${n} com o que já registramos.`,
      `O que ainda falta para o relatório da Etapa ${n} ficar completo?`,
      ...extra,
    ];
  }

  if (!assinada(e))
    return [
      `Segue o relatório da Etapa ${n} assinado no gov.br (anexe o PDF).`,
      `Eu assinei o relatório da Etapa ${n} em __/__ e o cliente em __/__.`,
      ...extra,
    ];

  return [`Enviei o relatório da Etapa ${n} no HUB hoje.`, ...extra];
}
