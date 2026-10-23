import { novoId } from "@/lib/dados/store";
import type { EmpresaSlug, PassoHub, Projeto, Servico } from "@/lib/dados/tipos";
import { etapasDoModelo } from "@/lib/modelos/instanciar";
import { hubInicial } from "@/lib/fase";
import { hojeIso } from "@/lib/datas";
import { ID_SERVICO_LGPD } from "@/lib/servicos";
import { normasPadrao, referenciasPadrao } from "@/lib/relatorio/padroes";

// O projeto novo, como nasce a partir de um serviço: etapas, checklist, horas, referências e o passo no HUB.
// Usado pela tela de novo projeto e pela importação do HUB.
export function montarProjeto(a: {
  slug: EmpresaSlug;
  id: string;
  clienteId: string;
  modelo: Servico;
  consultorId: string;
  codigoHub: string;
  gestorSebrae: string;
  segmento: string;
  areaAtuacao: string;
  situacao: PassoHub;
  dataSituacao?: string;
  horasDaEtapa: (ordem: number, padrao: number) => number;
}): Projeto {
  const { modelo } = a;
  const lgpd = modelo.id === ID_SERVICO_LGPD;
  return {
    id: a.id,
    empresa: a.slug,
    clienteId: a.clienteId,
    modeloId: modelo.id,
    modeloVersao: modelo.versao,
    servicoNome: modelo.nomeCurto,
    consultorId: a.consultorId,
    status: "aguardando_plano",
    prestadoraVinculada: modelo.prestadoraVinculada,
    numeroProjetoHub: a.codigoHub.trim(),
    codigoSolicitacaoHub: a.codigoHub.trim(),
    numeroVisitas: String(modelo.etapas.length), // uma visita por etapa
    gestorSebrae: a.gestorSebrae.trim(),
    fichaTecnica: modelo.fichaTecnica,
    codigoFichaTecnica: modelo.codigoFichaTecnica,
    segmento: a.segmento,
    areaAtuacao: a.areaAtuacao,
    localAssinatura: "Natal/RN",
    planoFechadoEm: null,
    etapas: etapasDoModelo(modelo).map((e) => ({ ...e, horasPrevistas: a.horasDaEtapa(e.ordem, e.horasPrevistas) })),
    hub: hubInicial(a.situacao, a.dataSituacao ?? hojeIso()),
    registros: lgpd ? normasPadrao().map((r) => ({ ...r, id: novoId("reg") })) : [],
    // Referências do serviço (a LGPD sem lista própria usa as padrão)
    referencias: modelo.referencias?.length
      ? modelo.referencias.map((r) => ({ ...r, id: novoId("ref"), consultadoEm: r.url ? hojeIso() : "" }))
      : lgpd
        ? referenciasPadrao().map((r) => ({ ...r, id: novoId("ref") }))
        : [],
    historico: [],
  };
}
