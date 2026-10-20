"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { novoId, registrarEvento, useEstado, useUsuario } from "@/lib/dados/store";
import type { EmpresaSlug, Projeto } from "@/lib/dados/tipos";
import { modelosDaEmpresa } from "@/lib/modelos";
import { etapasDoModelo } from "@/lib/modelos/instanciar";
import { normasPadrao, referenciasPadrao } from "@/lib/relatorio/padroes";
import { Botao, BotaoLink, Cabecalho, Campo, Vazio } from "@/components/ui";

function Conteudo() {
  const { empresa: slug } = useParams<{ empresa: EmpresaSlug }>();
  const { estado, atualizar } = useEstado();
  const usuario = useUsuario();
  const router = useRouter();
  const params = useSearchParams();
  const modelos = modelosDaEmpresa(slug);
  const clientes = estado.clientes.filter((c) => c.empresa === slug);
  const consultores = estado.usuarios.filter((u) => u.acessos[slug]);

  const [f, setF] = useState({
    modeloId: modelos[0]?.id ?? "",
    clienteId: "", // em branco = cliente indicado no endereço (?cliente=) ou o mais recente
    consultorId: (consultores.find((u) => u.id === usuario.id) ?? consultores[0])?.id ?? "",
    numeroProjetoHub: "",
    codigoSolicitacaoHub: "",
    numeroVisitas: "",
    gestorSebrae: "",
    segmento: "",
    areaAtuacao: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const modelo = modelos.find((m) => m.id === f.modeloId);
  // Calculado a cada render: o cliente recém-cadastrado pode chegar à lista um instante depois
  const clienteId = f.clienteId || (clientes.find((c) => c.id === params.get("cliente")) ?? clientes[clientes.length - 1])?.id || "";
  const cliente = clientes.find((c) => c.id === clienteId);
  // Sugestões a partir da atividade do cliente (CNAE); valem se o campo ficar em branco
  const segmentoSugerido = cliente?.ramo ?? "";
  const areaSugerida = cliente?.ramo
    ? `Governança em privacidade e proteção de dados pessoais aplicada a ${cliente.ramo.charAt(0).toLowerCase() + cliente.ramo.slice(1)}`
    : "Governança em privacidade e proteção de dados pessoais";

  const [criando, setCriando] = useState(false);
  const jaTemProjeto = estado.projetos.filter((p) => p.clienteId === clienteId);

  const criar = () => {
    if (!modelo || criando) return;
    setCriando(true);
    const id = novoId("prj");
    atualizar((r) => {
      const p: Projeto = {
        id,
        empresa: slug,
        clienteId,
        modeloId: modelo.id,
        modeloVersao: modelo.versao,
        consultorId: f.consultorId,
        status: "aguardando_plano",
        prestadoraVinculada: modelo.prestadoraVinculada,
        numeroProjetoHub: f.numeroProjetoHub,
        codigoSolicitacaoHub: f.codigoSolicitacaoHub,
        numeroVisitas: f.numeroVisitas,
        gestorSebrae: f.gestorSebrae,
        fichaTecnica: modelo.fichaTecnica,
        codigoFichaTecnica: modelo.codigoFichaTecnica,
        segmento: f.segmento.trim() || segmentoSugerido,
        areaAtuacao: f.areaAtuacao.trim() || areaSugerida,
        localAssinatura: "Natal/RN",
        planoFechadoEm: null,
        etapas: etapasDoModelo(modelo),
        registros: normasPadrao().map((r) => ({ ...r, id: novoId("reg") })),
        referencias: referenciasPadrao().map((r) => ({ ...r, id: novoId("ref") })),
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
                      {m.nome}, ficha {m.codigoFichaTecnica}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Cliente">
                <select className="campo" value={clienteId} onChange={set("clienteId")}>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razaoSocial}
                    </option>
                  ))}
                </select>
                {jaTemProjeto.length > 0 && (
                  <span className="mt-1.5 block text-[13px] text-laranja">
                    Este cliente já tem {jaTemProjeto.length === 1 ? "um projeto" : `${jaTemProjeto.length} projetos`}. Confira se não é o mesmo.
                  </span>
                )}
                <Link href={`/${slug}/clientes?novo=1&voltar=novo-projeto`} className="mt-1.5 inline-block text-[13px] text-azul underline-offset-4 hover:underline">
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
              <Campo rotulo="Nº do projeto no HUB">
                <input className="campo num" value={f.numeroProjetoHub} onChange={set("numeroProjetoHub")} />
              </Campo>
              <Campo rotulo="Código do pedido no HUB">
                <input className="campo num" value={f.codigoSolicitacaoHub} onChange={set("codigoSolicitacaoHub")} />
              </Campo>
              <Campo rotulo="Número de visitas">
                <input className="campo num" inputMode="numeric" value={f.numeroVisitas} onChange={set("numeroVisitas")} />
              </Campo>
              <Campo rotulo="Gestor ou gestora SEBRAE">
                <input className="campo" value={f.gestorSebrae} onChange={set("gestorSebrae")} />
              </Campo>
              <Campo rotulo="Segmento do cliente">
                <input className="campo" placeholder={segmentoSugerido} value={f.segmento} onChange={set("segmento")} />
              </Campo>
              <Campo rotulo="Área de atuação da consultoria" className="sm:col-span-2">
                <input className="campo" placeholder={areaSugerida} value={f.areaAtuacao} onChange={set("areaAtuacao")} />
              </Campo>
            </fieldset>
            <div className="border-t border-linha pt-6">
              <Botao type="submit" disabled={!clienteId || !modelo || criando}>
                {criando ? "Criando…" : "Criar projeto"}
              </Botao>
              {!modelo && <span className="ml-3 text-sm text-tinta-2">Esta empresa ainda não tem serviço cadastrado.</span>}
            </div>
          </form>

          {modelo && (
            <aside className="lg:pt-9">
              <p className="text-base font-semibold">O projeto nasce com</p>
              <ol className="mt-4 space-y-3 border-l border-linha pl-5">
                {modelo.etapas.map((e) => (
                  <li key={e.ordem} className="text-[15px]">
                    <span className="num font-semibold">{String(e.ordem).padStart(2, "0")}</span>{" "}
                    {e.nome.charAt(0) + e.nome.slice(1).toLowerCase()}
                    <span className="num block text-[13px] text-tinta-2">
                      {e.horasPrevistas} h, {e.entregaveis.length} entregáveis
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-sm text-tinta-2">
                Também já entram as referências normativas e o inventário de normas usados nos relatórios. Prestadora vinculada:{" "}
                {modelo.prestadoraVinculada}. As datas de cada etapa são definidas logo depois, no plano de trabalho.
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
