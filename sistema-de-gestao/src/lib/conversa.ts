import type { Atividade, Projeto, TipoAtividade } from "./dados/tipos";
import { todasSecoes } from "./relatorio/secoes";
import { automatizarEtapa } from "./regras-etapa";
import { doisDigitos, statusEtapa, type StatusEtapa as StatusEtapaTipo } from "./rotulos";
import { formatarData } from "./datas";
import { horasFmt, tiposAtividade } from "./horas";

// Conversa do projeto: o que a IA pode fazer no projeto a partir de uma
// mensagem, e como desfazer. As ações chegam do servidor já no formato
// abaixo; aqui elas são conferidas (etapa, seção, código existem?) antes de valer.

export type Anexo = { id: string; caminho: string; nome: string; tipo: string; largura?: number; altura?: number };

export type AcaoIA =
  | { tipo: "marcar_atividades"; etapa: number; codigos: string[]; situacao: "feito" | "nao_aplicavel"; justificativa: string }
  | { tipo: "escrever_secao"; etapa: number; chave: string; texto: string }
  | { tipo: "escrever_entregavel"; etapa: number; titulo: string; texto: string }
  | { tipo: "guardar_anexo"; etapa: number; anexo: string; legenda: string }
  | {
      tipo: "registrar_atividade";
      etapa: number;
      data: string;
      modalidade: TipoAtividade;
      horas: number;
      participantes: string;
      anotacoes: string;
    };

// Um passo para voltar ao estado anterior
export type Desfazer =
  | { tipo: "atividade"; etapa: number; codigo: string; status: Atividade["status"]; justificativa: string }
  | { tipo: "secao"; etapa: number; chave: string; texto: string | null }
  | { tipo: "entregavel"; etapa: number; titulo: string; conteudo: string }
  | { tipo: "evidencia"; etapa: number; id: string }
  | { tipo: "registro"; id: string }
  | { tipo: "status"; etapa: number; status: StatusEtapaTipo };

const concluida = (s: StatusEtapaTipo) => s === "enviada" || s === "aprovada";
const resumo = (t: string, n = 60) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

// Aplica as ações no projeto (que é alterado) e devolve o que foi feito e como
// desfazer. Determinística: os identificadores vêm da mensagem, então dá o
// mesmo resultado quando aplicada de novo sobre o mesmo projeto.
export function aplicarAcoes(p: Projeto, acoes: AcaoIA[], anexos: Anexo[], mensagemId: string, autor: string) {
  const descricoes: string[] = [];
  const desfazer: Desfazer[] = [];
  const statusAntes = new Map(p.etapas.map((e) => [e.ordem, e.status]));
  const tocadas = new Set<number>();

  acoes.forEach((a, i) => {
    const e = p.etapas.find((x) => x.ordem === a.etapa);
    if (!e || concluida(e.status) || p.status === "encerrado") return;
    const et = `Etapa ${doisDigitos(e.ordem)}`;

    if (a.tipo === "marcar_atividades") {
      const marcadas: string[] = [];
      for (const codigo of a.codigos) {
        const at = e.atividades.find((x) => x.codigo === codigo);
        if (!at || at.status === a.situacao) continue;
        desfazer.push({ tipo: "atividade", etapa: e.ordem, codigo, status: at.status, justificativa: at.justificativa });
        at.status = a.situacao;
        if (a.situacao === "nao_aplicavel") at.justificativa = a.justificativa;
        marcadas.push(codigo);
      }
      if (marcadas.length)
        descricoes.push(
          `${et}: ${marcadas.length === 1 ? "atividade" : "atividades"} ${marcadas.join(", ")} ${a.situacao === "feito" ? (marcadas.length === 1 ? "marcada como feita" : "marcadas como feitas") : "marcadas como não se aplica"}`,
        );
    } else if (a.tipo === "escrever_secao") {
      const def = todasSecoes.find((d) => d.chave === a.chave);
      if (!def || !a.texto.trim()) return;
      desfazer.push({ tipo: "secao", etapa: e.ordem, chave: a.chave, texto: e.secoes[a.chave] ?? null });
      const novo = !(e.secoes[a.chave] ?? "").trim();
      e.secoes[a.chave] = a.texto.trim();
      descricoes.push(`${et}: seção “${def.titulo(e)}” ${novo ? "escrita" : "atualizada"}`);
    } else if (a.tipo === "escrever_entregavel") {
      const ent = e.entregaveis.find((x) => x.titulo === a.titulo);
      if (!ent || !a.texto.trim()) return;
      desfazer.push({ tipo: "entregavel", etapa: e.ordem, titulo: ent.titulo, conteudo: ent.conteudo });
      const novo = !ent.conteudo.trim();
      ent.conteudo = a.texto.trim();
      descricoes.push(`${et}: entregável “${resumo(ent.titulo)}” ${novo ? "escrito" : "atualizado"}`);
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
      descricoes.push(`${et}: foto guardada como evidência (“${resumo(a.legenda.trim() || anexo.nome)}”)`);
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
      descricoes.push(`${et}: ${tiposAtividade[a.modalidade].rotulo.toLowerCase()} de ${formatarData(a.data)} registrada (${horasFmt(a.horas)})`);
    } else return;
    tocadas.add(e.ordem);
  });

  // O status avança sozinho pelas regras de sempre (checklist completo → redação…)
  for (const ordem of tocadas) {
    const e = p.etapas.find((x) => x.ordem === ordem)!;
    automatizarEtapa(p, e);
    const antes = statusAntes.get(ordem)!;
    if (e.status !== antes) {
      desfazer.push({ tipo: "status", etapa: ordem, status: antes });
      descricoes.push(`Etapa ${doisDigitos(ordem)} passou para “${statusEtapa[e.status].rotulo}”`);
    }
  }
  return { descricoes, desfazer };
}

// Volta cada passo, do último para o primeiro
export function desfazerAcoes(p: Projeto, passos: Desfazer[]) {
  for (const d of [...passos].reverse()) {
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
    }
  }
}
