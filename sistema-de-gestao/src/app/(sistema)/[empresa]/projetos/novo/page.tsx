"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { novoId, registrarEvento, useEstado, useUsuario } from "@/lib/dados/store";
import type { EmpresaSlug, Projeto } from "@/lib/dados/tipos";
import { etapasDoModelo } from "@/lib/modelos/instanciar";
import { LIMITE_PROJETOS_CLIENTE } from "@/lib/projeto";
import { horasDoServico, ID_SERVICO_LGPD, servicosDaEmpresa } from "@/lib/servicos";
import { fases, hubInicial, ordemPassos, passosHub, rotuloPassoHub } from "@/lib/fase";
import { hojeIso } from "@/lib/datas";
import type { PassoHub } from "@/lib/dados/tipos";
import { normasPadrao, referenciasPadrao } from "@/lib/relatorio/padroes";
import { Botao, BotaoLink, Cabecalho, Campo, Vazio } from "@/components/ui";
import { EscolherGestorSebrae } from "@/components/projeto/gestor-sebrae";

function Conteudo() {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { estado, atualizar } = useEstado();
  const usuario = useUsuario();
  const router = useRouter();
  const params = useSearchParams();
  const modelos = servicosDaEmpresa(estado, slug);
  const clientes = estado.clientes.filter((c) => c.empresa === slug);
  const consultores = estado.usuarios.filter((u) => u.acessos[slug]);

  const [f, setF] = useState({
    modeloId: (modelos.find((m) => m.id === params.get("servico")) ?? modelos[0])?.id ?? "",
    clienteId: "", // em branco = cliente indicado no endereço (?cliente=) ou o mais recente
    consultorId: (consultores.find((u) => u.id === usuario.id) ?? consultores[0])?.id ?? "",
    codigoHub: "", // código do pedido = nº do projeto no HUB
    gestorSebrae: "",
    segmento: "",
    areaAtuacao: "",
    situacao: "diagnostico" as PassoHub, // onde o projeto está no HUB
  });
  // Horas de cada etapa: as da ficha do serviço, ou as da proposta (quando a ficha não traz)
  const [horas, setHoras] = useState<Record<string, string>>({});
  const horaDaEtapa = (ordem: number, padrao: number) => horas[`${f.modeloId}:${ordem}`] ?? (padrao ? String(padrao) : "");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const modelo = modelos.find((m) => m.id === f.modeloId);
  // Calculado a cada render: o cliente recém-cadastrado pode chegar à lista um instante depois
  const clienteId = f.clienteId || (clientes.find((c) => c.id === params.get("cliente")) ?? clientes[clientes.length - 1])?.id || "";
  const cliente = clientes.find((c) => c.id === clienteId);
  // Sugestões a partir da atividade do cliente (CNAE); valem se o campo ficar em branco
  const segmentoSugerido = cliente?.ramo ?? "";
  const areaBase = modelo?.areaAtuacao || modelo?.fichaTecnica || "";
  const areaSugerida = cliente?.ramo && areaBase ? `${areaBase} aplicada a ${cliente.ramo.charAt(0).toLowerCase() + cliente.ramo.slice(1)}` : areaBase;
  // Normas e referências prontas existem só para a LGPD
  const lgpd = modelo?.id === ID_SERVICO_LGPD;

  const [criando, setCriando] = useState(false);
  // Até 3 projetos em andamento por cliente; um 4º só excepcionalmente, e nunca um 5º
  const emAndamento = estado.projetos.filter((p) => p.clienteId === clienteId && p.status !== "encerrado");
  const mesmoServico = emAndamento.some((p) => p.modeloId === f.modeloId);
  const bloqueado = emAndamento.length > LIMITE_PROJETOS_CLIENTE;

  const criar = () => {
    if (!modelo || criando || bloqueado) return;
    setCriando(true);
    const id = novoId("prj");
    atualizar((r) => {
      const p: Projeto = {
        id,
        empresa: slug,
        clienteId,
        modeloId: modelo.id,
        modeloVersao: modelo.versao,
        servicoNome: modelo.nomeCurto,
        consultorId: f.consultorId,
        status: "aguardando_plano",
        prestadoraVinculada: modelo.prestadoraVinculada,
        numeroProjetoHub: f.codigoHub.trim(),
        codigoSolicitacaoHub: f.codigoHub.trim(),
        numeroVisitas: String(modelo.etapas.length), // uma visita por etapa
        gestorSebrae: f.gestorSebrae.trim(),
        fichaTecnica: modelo.fichaTecnica,
        codigoFichaTecnica: modelo.codigoFichaTecnica,
        segmento: f.segmento.trim() || segmentoSugerido,
        areaAtuacao: f.areaAtuacao.trim() || areaSugerida,
        localAssinatura: "Natal/RN",
        planoFechadoEm: null,
        etapas: etapasDoModelo(modelo).map((e) => ({ ...e, horasPrevistas: Number(horaDaEtapa(e.ordem, e.horasPrevistas).replace(",", ".")) || 0 })),
        hub: hubInicial(f.situacao, hojeIso()),
        registros: lgpd ? normasPadrao().map((r) => ({ ...r, id: novoId("reg") })) : [],
        // Referências do serviço (a LGPD sem lista própria usa as padrão)
        referencias: modelo.referencias?.length
          ? modelo.referencias.map((r) => ({ ...r, id: novoId("ref"), consultadoEm: r.url ? hojeIso() : "" }))
          : lgpd
            ? referenciasPadrao().map((r) => ({ ...r, id: novoId("ref") }))
            : [],
        historico: [],
      };
      registrarEvento(p, usuario.nome, "Projeto criado");
      r.projetos.unshift(p);
    });
    router.push(`/${slug}/projetos/${id}`);
  };

  const empresa = estado.empresas.find((e) => e.slug === slug)!;

  return (
    <>
      <Cabecalho migalhas={[{ rotulo: empresa.nome, href: `/${slug}` }, { rotulo: "Novo projeto" }]} titulo="Novo projeto" />
      {clientes.length === 0 ? (
        <Vazio titulo="Cadastre o cliente primeiro" acao={<BotaoLink href={`/${slug}/clientes?novo=1&voltar=novo-projeto`}>Cadastrar cliente</BotaoLink>}>
          O projeto é criado para um cliente já cadastrado, porque os dados dele preenchem a ficha de todos os relatórios.
        </Vazio>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              criar();
            }}
            className="space-y-8"
          >
            <fieldset className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <legend className="mb-3 text-[15px] font-medium">Serviço e cliente</legend>
              <Campo rotulo="Serviço" className="sm:col-span-2">
                <select className="campo" value={f.modeloId} onChange={set("modeloId")}>
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fichaTecnica}
                      {m.codigoFichaTecnica ? `, ficha ${m.codigoFichaTecnica}` : ""}
                      {m.credenciado ? "" : " (não credenciado)"}
                    </option>
                  ))}
                </select>
                <Link href={`/${slug}/servicos/novo`} className="mt-1.5 inline-block text-[13px] text-azul underline-offset-4 hover:underline">
                  Cadastrar outro serviço
                </Link>
              </Campo>
              <Campo rotulo="Cliente">
                <select className="campo" value={clienteId} onChange={set("clienteId")}>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razaoSocial}
                    </option>
                  ))}
                </select>
                {emAndamento.length > 0 && (
                  <span className={`mt-1.5 block text-[13px] ${bloqueado ? "text-vermelho" : "text-laranja"}`}>
                    {bloqueado
                      ? `Este cliente já tem ${emAndamento.length} projetos em andamento, o máximo permitido. Encerre um antes de abrir outro.`
                      : emAndamento.length >= LIMITE_PROJETOS_CLIENTE
                        ? `Este cliente já tem ${emAndamento.length} projetos em andamento. Um 4º só excepcionalmente.`
                        : `Este cliente já tem ${emAndamento.length === 1 ? "um projeto" : `${emAndamento.length} projetos`} em andamento${mesmoServico ? ", um deles deste mesmo serviço. Confira se não é o mesmo" : ""}.`}
                  </span>
                )}
                <Link
                  href={`/${slug}/clientes?novo=1&voltar=novo-projeto`}
                  className="mt-1.5 inline-block text-[13px] text-azul underline-offset-4 hover:underline"
                >
                  Cadastrar outro cliente
                </Link>
              </Campo>
              <Campo rotulo="Consultor responsável">
                <select className="campo" value={f.consultorId} onChange={set("consultorId")}>
                  {consultores.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nomeCompleto}
                    </option>
                  ))}
                </select>
              </Campo>
            </fieldset>
            <fieldset className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <legend className="mb-3 text-[15px] font-medium">Dados do HUB SEBRAE</legend>
              <Campo rotulo="Onde o projeto está no HUB" className="sm:col-span-2" dica={fases[passosHub[f.situacao].fase].descricao}>
                <select className="campo" value={f.situacao} onChange={set("situacao")}>
                  {ordemPassos.slice(0, ordemPassos.indexOf("execucao") + 1).map((s) => (
                    <option key={s} value={s}>
                      {rotuloPassoHub(s)}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Código do pedido no HUB" dica="É o mesmo número do projeto no HUB.">
                <input className="campo num" value={f.codigoHub} onChange={set("codigoHub")} />
              </Campo>
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-tinta">Número de visitas</span>
                <p className="flex min-h-10 items-center rounded-[var(--radius-campo)] bg-pedra px-3 text-[15px] text-tinta">
                  {modelo ? (
                    <span>
                      <span className="num font-semibold">{modelo.etapas.length}</span>, uma por etapa do serviço
                    </span>
                  ) : (
                    "Escolha o serviço"
                  )}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="gestor-sebrae" className="mb-1.5 block text-[13px] font-semibold text-tinta">
                  Gestor ou gestora SEBRAE
                </label>
                <EscolherGestorSebrae id="gestor-sebrae" empresa={slug} valor={f.gestorSebrae} aoMudar={(nome) => setF((x) => ({ ...x, gestorSebrae: nome }))} />
              </div>
              <Campo rotulo="Segmento do cliente">
                <input className="campo" placeholder={segmentoSugerido} value={f.segmento} onChange={set("segmento")} />
              </Campo>
              <Campo rotulo="Área de atuação da consultoria" className="sm:col-span-2">
                <input className="campo" placeholder={areaSugerida} value={f.areaAtuacao} onChange={set("areaAtuacao")} />
              </Campo>
            </fieldset>
            <div className="border-t border-linha pt-6">
              <Botao type="submit" disabled={!clienteId || !modelo || criando || bloqueado}>
                {criando ? "Criando…" : "Criar projeto"}
              </Botao>
              {!modelo && (
                <span className="ml-3 text-sm text-tinta-2">
                  Esta empresa ainda não tem serviço cadastrado.{" "}
                  <Link href={`/${slug}/servicos/novo`} className="font-semibold text-azul hover:underline">
                    Cadastrar serviço
                  </Link>
                </span>
              )}
            </div>
          </form>

          {modelo && (
            <aside className="lg:pt-9">
              <p className="text-base font-semibold">O projeto nasce com</p>
              <p className="mt-1 text-[13px] text-tinta-2">
                {horasDoServico(modelo)
                  ? "Horas da ficha do serviço; ajuste se a proposta for diferente."
                  : "A ficha deste serviço não traz as horas: informe as da proposta (ou deixe para depois)."}
              </p>
              <ol className="mt-4 space-y-3 border-l border-linha pl-5">
                {modelo.etapas.map((e) => (
                  <li key={e.ordem} className="text-[15px]">
                    <span className="num font-semibold">{String(e.ordem).padStart(2, "0")}</span> {e.nome.charAt(0) + e.nome.slice(1).toLowerCase()}
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-tinta-2">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          aria-label={`Horas da etapa ${e.ordem}`}
                          className="campo num !w-20 !py-1 !text-sm"
                          value={horaDaEtapa(e.ordem, e.horasPrevistas)}
                          onChange={(ev) => setHoras((h) => ({ ...h, [`${f.modeloId}:${e.ordem}`]: ev.target.value }))}
                        />
                        h
                      </label>
                      <span className="num">
                        · {e.atividades.length} {e.atividades.length === 1 ? "atividade" : "atividades"}, {e.entregaveis.length}{" "}
                        {e.entregaveis.length === 1 ? "entregável" : "entregáveis"}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="num mt-4 text-sm font-semibold text-tinta">
                {modelo.etapas.reduce((a, e) => a + (Number(horaDaEtapa(e.ordem, e.horasPrevistas).replace(",", ".")) || 0), 0) || "Horas a definir"}
                {modelo.etapas.some((e) => Number(horaDaEtapa(e.ordem, e.horasPrevistas)) > 0) ? " h no total" : ""}
              </p>
              <p className="mt-3 text-sm text-tinta-2">
                {lgpd ? "Também já entram as referências normativas e o inventário de normas usados nos relatórios. " : ""}
                {modelo.prestadoraVinculada ? `Prestadora vinculada: ${modelo.prestadoraVinculada}. ` : ""}As datas de cada etapa são definidas logo depois, no
                plano de trabalho.
              </p>
            </aside>
          )}
        </div>
      )}
    </>
  );
}

export default function NovoProjeto() {
  return (
    <Suspense fallback={null}>
      <Conteudo />
    </Suspense>
  );
}
