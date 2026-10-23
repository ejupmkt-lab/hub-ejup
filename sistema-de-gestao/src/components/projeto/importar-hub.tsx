"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MaterialHub, Projeto } from "@/lib/dados/tipos";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { useEstado } from "@/lib/dados/store";
import { aplicarAcoes } from "@/lib/conversa";
import { acoesDaImportacao, conferirIdentificacao, type RespostaImportacao } from "@/lib/hub-importar";
import { traduzirErro } from "@/lib/erros";
import {
  ARQUIVO_DA_EXTENSAO,
  arquivoDoPendente,
  AVISO_DA_EXTENSAO,
  consumirPendente,
  explicarFalhaDaLeitura,
  extensaoInstalada,
  lerAbaDoHub,
  pegarPendente,
  type PendenteDoHub,
} from "@/lib/hub-extensao";
import { Botao } from "@/components/ui";
import { useProjeto } from "./use-projeto";

const MAX_ARQUIVOS = 3;
const MAX_BYTES = 4 * 1024 * 1024;
const BUCKET = "evidencias";

type Material = { arquivo: File; lidoPelaIA: boolean };
type Entrega = { origem: string; titulo: string; falhas: PendenteDoHub["falhas"]; naoGuardados: PendenteDoHub["naoGuardados"]; textoCortado: boolean };

const tamanhoFmt = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// Dos arquivos baixados do HUB, a IA lê os menores (PDFs e imagens) que cabem no limite do pedido
function escolherParaIA(arquivos: File[]) {
  const escolhidos: File[] = [];
  let soma = 0;
  for (const a of [...arquivos].sort((x, y) => x.size - y.size)) {
    if (escolhidos.length >= MAX_ARQUIVOS || soma + a.size > MAX_BYTES - 300 * 1024) continue;
    escolhidos.push(a);
    soma += a.size;
  }
  return escolhidos;
}

// Prints de celular passam de 4 MB com facilidade: reduz antes de enviar
async function reduzir(arquivo: File): Promise<File> {
  if (!arquivo.type.startsWith("image/") || arquivo.size < 700 * 1024) return arquivo;
  try {
    const img = await createImageBitmap(arquivo);
    const escala = Math.min(1, 2000 / Math.max(img.width, img.height));
    const tela = document.createElement("canvas");
    tela.width = Math.round(img.width * escala);
    tela.height = Math.round(img.height * escala);
    tela.getContext("2d")!.drawImage(img, 0, 0, tela.width, tela.height);
    const blob = await new Promise<Blob | null>((r) => tela.toBlob(r, "image/jpeg", 0.85));
    return blob && blob.size < arquivo.size ? new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : arquivo;
  } catch {
    return arquivo;
  }
}

// Importar do HUB: cola o texto da página do pedido (ou manda print e PDF), a IA lê,
// o sistema mostra o que vai mudar e só aplica quando o consultor confirma.
// O que for aplicado aparece na conversa do projeto e pode ser desfeito lá.
export function ImportarHub({ projeto, aoFechar }: { projeto: Projeto; aoFechar: () => void }) {
  const { alterar, cliente, usuario } = useProjeto();
  const { salvarAgora } = useEstado();
  const [texto, setTexto] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [lido, setLido] = useState<RespostaImportacao | null>(null);
  const [insistir, setInsistir] = useState(false);
  const [aplicado, setAplicado] = useState<string[] | null>(null);
  const [aplicando, setAplicando] = useState(false);
  // A extensão do navegador puxa a aba do HUB que está aberta, em um clique
  const [extensao, setExtensao] = useState<"verificando" | "sim" | "nao">("verificando");
  const [puxando, setPuxando] = useState(false);
  const tentouSozinho = useRef(false);
  // O que a extensão trouxe do HUB ao clicar em "Ler agora" no ícone dela
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [configurada, setConfigurada] = useState(false);
  const jaRecebidos = useRef(new Set<string>());

  const conferencia = useMemo(() => (lido ? conferirIdentificacao(projeto, cliente, lido.identificacao) : null), [lido, projeto, cliente]);
  const bloqueado = !!conferencia?.bloqueios.length && !insistir;
  const acoes = useMemo(() => (lido ? acoesDaImportacao(lido.acoes, lido.identificacao, !bloqueado) : []), [lido, bloqueado]);
  // O que vai mudar, calculado numa cópia do projeto
  const previa = useMemo(() => (acoes.length ? aplicarAcoes(structuredClone(projeto), acoes, [], "previa", usuario.nome).itens : []), [acoes, projeto, usuario.nome]);
  const feitos = previa.filter((i) => !i.aviso);
  const avisos = previa.filter((i) => i.aviso);

  const escolher = (lista: FileList | null) => {
    setErro(null);
    setArquivos((a) => [...a, ...Array.from(lista ?? [])].slice(0, MAX_ARQUIVOS));
  };

  const ler = async (colado: string = texto, anexos: File[] = arquivos) => {
    setErro(null);
    if (!colado.trim() && !anexos.length) return setErro("Cole o texto da página do HUB ou anexe um print ou PDF.");
    setLendo(true);
    try {
      const prontos = await Promise.all(anexos.map(reduzir));
      if (prontos.reduce((s, a) => s + a.size, 0) > MAX_BYTES) throw new Error("Os anexos passam de 4 MB. Mande menos arquivos ou prints menores.");
      // A IA lê o projeto no banco: o que está pendente precisa estar salvo
      await salvarAgora();
      const f = new FormData();
      f.append("projetoId", projeto.id);
      f.append("texto", colado);
      prontos.forEach((a) => f.append("arquivos", a));
      const r = await fetch("/api/hub/importar", { method: "POST", body: f });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erro ?? "Não foi possível ler o conteúdo agora.");
      setLido(d as RespostaImportacao);
      setInsistir(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler o conteúdo agora.");
    } finally {
      setLendo(false);
    }
  };

  // A extensão leu a página (e baixou os anexos) a pedido do consultor: entra aqui e a IA já lê
  const receber = async (p: PendenteDoHub) => {
    if (jaRecebidos.current.has(p.id)) return;
    jaRecebidos.current.add(p.id);
    setLido(null);
    setAplicado(null);
    setErro(null);
    setPuxando(true);
    try {
      const todos = p.arquivos.map(arquivoDoPendente);
      const paraIA = escolherParaIA(todos);
      setMateriais(todos.map((arquivo) => ({ arquivo, lidoPelaIA: paraIA.includes(arquivo) })));
      setEntrega({ origem: p.origem.endereco, titulo: p.origem.titulo, falhas: p.falhas, naoGuardados: p.naoGuardados, textoCortado: p.textoCortado });
      setTexto(p.texto);
      setArquivos([]);
      await ler(p.texto, paraIA);
      void consumirPendente(p.id);
    } finally {
      setPuxando(false);
    }
  };

  // Botão do Blimp: pede à extensão a aba do HUB que o consultor já permitiu nas opções dela
  const puxar = async (silencioso = false) => {
    setErro(null);
    setPuxando(true);
    try {
      const r = await lerAbaDoHub(projeto.codigoSolicitacaoHub || projeto.numeroProjetoHub);
      if (!r.ok) return silencioso ? undefined : setErro(explicarFalhaDaLeitura[r.motivo] ?? "Não foi possível ler a aba do HUB.");
      setTexto(r.texto);
      await ler(r.texto);
    } finally {
      setPuxando(false);
    }
  };

  // Ao abrir: se a extensão já trouxe a página do HUB, usa; senão, se o consultor deixou o HUB permitido, puxa a aba aberta
  useEffect(() => {
    let ativo = true;
    void extensaoInstalada().then(async (e) => {
      if (!ativo) return;
      setExtensao(e ? "sim" : "nao");
      setConfigurada(!!e?.configurada);
      if (!e || tentouSozinho.current) return;
      tentouSozinho.current = true;
      const pendente = await pegarPendente();
      if (!ativo) return;
      if (pendente) void receber(pendente);
      else if (e.configurada) void puxar(true);
    });
    // A extensão avisa quando o consultor clica em "Ler agora" com o painel já aberto
    const ouvir = (ev: MessageEvent) => {
      if (ev.source !== window || ev.origin !== window.location.origin || ev.data?.tipo !== AVISO_DA_EXTENSAO) return;
      void pegarPendente().then((p) => p && receber(p));
    };
    window.addEventListener("message", ouvir);
    return () => {
      ativo = false;
      window.removeEventListener("message", ouvir);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicar = async () => {
    if (!lido || (!feitos.length && !materiais.length)) return;
    setAplicando(true);
    setErro(null);
    try {
      const sb = supabaseNavegador();
      // Os arquivos baixados do HUB ficam guardados no projeto
      const guardados: MaterialHub[] = [];
      const naoSubiu: string[] = [];
      for (const m of materiais) {
        const ext = m.arquivo.name.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() ?? "bin";
        const caminho = `${projeto.empresa}/${projeto.id}/hub/${crypto.randomUUID()}.${ext}`;
        const { error } = await sb.storage.from(BUCKET).upload(caminho, m.arquivo, { contentType: m.arquivo.type });
        if (error) naoSubiu.push(m.arquivo.name);
        else guardados.push({ id: crypto.randomUUID(), nome: m.arquivo.name, tipo: m.arquivo.type, tamanho: m.arquivo.size, caminho, origem: entrega?.origem ?? "", baixadoEm: new Date().toISOString(), por: usuario.nome });
      }
      const id = crypto.randomUUID();
      const { itens, desfazer } = aplicarAcoes(structuredClone(projeto), acoes, [], id, usuario.nome);
      const efetivos = itens.filter((x) => !x.aviso);
      const dosMateriais = guardados.length ? [{ descricao: `Materiais do HUB guardados no projeto: ${guardados.map((g) => g.nome).join(", ")}` }] : [];
      alterar(
        (p) => {
          void aplicarAcoes(p, acoes, [], id, usuario.nome);
          if (guardados.length) p.materiaisHub = [...(p.materiaisHub ?? []), ...guardados];
        },
        { acao: "HUB: dados importados da página do pedido", detalhe: [...efetivos, ...dosMateriais].map((x) => x.descricao).join("; ") },
      );
      // Fica na conversa do projeto, com o botão de desfazer
      const base = { projeto_id: projeto.id, empresa: projeto.empresa };
      const { error } = await sb.from("mensagens_projeto").insert({ ...base, autor_nome: usuario.nome, papel: "usuario", texto: "Importei os dados da página do pedido no HUB." });
      if (error) throw error;
      const { error: erroIA } = await sb.from("mensagens_projeto").insert({ ...base, autor_nome: "Assistente", papel: "ia", texto: lido.resumo, acoes: [...itens, ...dosMateriais], desfazer });
      if (erroIA) throw erroIA;
      window.dispatchEvent(new Event("mensagens-do-projeto"));
      setAplicado([...efetivos, ...dosMateriais].map((x) => x.descricao));
      if (naoSubiu.length) setErro(`Não consegui guardar: ${naoSubiu.join(", ")}.`);
    } catch (e) {
      setErro(`As alterações foram aplicadas, mas o registro na conversa falhou. ${traduzirErro(e, "")}`.trim());
      setAplicado([]);
    } finally {
      setAplicando(false);
    }
  };

  const ident = lido?.identificacao;
  return (
    <div className="mt-4 space-y-4 rounded-[var(--radius-campo)] border border-linha bg-pedra/60 p-3 sm:p-4" aria-label="Importar do HUB">
      {aplicado ? (
        <div className="space-y-3">
          <p className="text-[15px] font-semibold text-verde">Importado.</p>
          <ul className="list-disc space-y-1 pl-5 text-[14px]">
            {aplicado.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
          <p className="text-[13px] text-tinta-2">Está registrado na conversa do projeto, onde dá para desfazer.</p>
          {erro && <p className="text-[13px] text-vermelho">{erro}</p>}
          <Botao tamanho="pequeno" onClick={aoFechar}>
            Fechar
          </Botao>
        </div>
      ) : !lido ? (
        <>
          {extensao === "sim" && (
            <div className="space-y-2">
              <p className="text-[13px] text-tinta-2">
                Na página do HUB que você quer ler, clique no ícone da extensão e em <strong>Ler agora</strong>. Ela lê a página, baixa os anexos e traz tudo para cá. A IA lê,
                mostra o que vai mudar e só aplica quando você confirmar.
              </p>
              {puxando || lendo ? <p className="text-[13px] font-semibold text-azul">Lendo o que veio do HUB…</p> : null}
              {configurada && (
                <Botao tamanho="pequeno" variante="secundario" onClick={() => void puxar()} disabled={puxando || lendo}>
                  Puxar o texto da aba aberta do HUB
                </Botao>
              )}
            </div>
          )}
          {extensao === "nao" && (
            <details className="rounded-[var(--radius-campo)] bg-folha px-3 py-2 text-[13px] ring-1 ring-linha">
              <summary className="cursor-pointer font-semibold text-azul">Importar com um clique: instalar a extensão do Chrome</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-tinta-2">
                <li>
                  <a className="font-semibold text-azul underline" href={ARQUIVO_DA_EXTENSAO} download>
                    Baixe a extensão
                  </a>{" "}
                  e descompacte a pasta.
                </li>
                <li>
                  No Chrome (ou Edge), abra <span className="font-mono">chrome://extensions</span> e ligue o &quot;Modo do desenvolvedor&quot;.
                </li>
                <li>Clique em &quot;Carregar sem compactação&quot; e escolha a pasta descompactada.</li>
                <li>Deixe o projeto aberto aqui no Blimp, vá à página do HUB que quer ler e clique no ícone da extensão em &quot;Ler agora&quot;.</li>
              </ol>
            </details>
          )}
          <p className="text-[13px] text-tinta-2">
            {extensao === "sim" ? "Ou, " : ""}
            {extensao === "sim" ? "se preferir, abra" : "Abra"} o pedido no HUB, selecione a página toda (Ctrl+A), copie (Ctrl+C) e cole aqui. Também dá para anexar um print ou PDF. A IA
            lê, mostra o que vai mudar e só aplica quando você confirmar.
          </p>
          <label className="block text-[13px] font-semibold">
            Texto copiado do HUB
            <textarea
              className="campo mt-1 min-h-32 text-[14px] font-normal"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Cole aqui o conteúdo da página do pedido"
              maxLength={40000}
            />
          </label>
          <label className="block text-[13px] font-semibold">
            Prints ou PDF <span className="font-normal text-tinta-2">(opcional, até {MAX_ARQUIVOS} arquivos)</span>
            <input type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" className="campo mt-1 !py-1.5" onChange={(e) => escolher(e.target.files)} />
          </label>
          {arquivos.length > 0 && (
            <ul className="flex flex-wrap gap-2 text-[13px]">
              {arquivos.map((a, i) => (
                <li key={`${a.name}-${i}`} className="flex items-center gap-1.5 rounded-full bg-folha px-3 py-1 ring-1 ring-linha">
                  {a.name}
                  <button type="button" className="text-tinta-2 hover:text-vermelho" aria-label={`Tirar ${a.name}`} onClick={() => setArquivos((l) => l.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          {erro && <p className="text-[13px] text-vermelho">{erro}</p>}
          <div className="flex gap-2">
            <Botao tamanho="pequeno" variante={extensao === "sim" ? "secundario" : "primario"} onClick={() => void ler()} disabled={lendo || puxando}>
              {lendo ? "A IA está lendo…" : "Ler com a IA"}
            </Botao>
            <Botao variante="fantasma" tamanho="pequeno" onClick={aoFechar} disabled={lendo}>
              Cancelar
            </Botao>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-[15px]">{lido.resumo}</p>

          {ident && (ident.codigo_hub || ident.empresa || ident.cnpj || ident.gestor) && (
            <p className="text-[13px] text-tinta-2">
              Li no HUB:{" "}
              {[ident.codigo_hub && `pedido ${ident.codigo_hub}`, ident.empresa, ident.cnpj, ident.gestor && `gestor ${ident.gestor}`, ident.servico].filter(Boolean).join(" · ")}
            </p>
          )}

          {conferencia?.bloqueios.map((b) => (
            <p key={b} role="alert" className="rounded-[var(--radius-campo)] border border-vermelho/25 bg-vermelho-claro px-3 py-2 text-[13px] text-vermelho">
              {b}
            </p>
          ))}
          {conferencia?.bloqueios.length ? (
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={insistir} onChange={(e) => setInsistir(e.target.checked)} />É deste projeto mesmo, quero ver o que mudaria
            </label>
          ) : (
            conferencia?.avisos.map((a) => (
              <p key={a} className="rounded-[var(--radius-campo)] bg-laranja-claro px-3 py-2 text-[13px] text-laranja">
                {a}
              </p>
            ))
          )}

          {!bloqueado && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold">O que vai mudar no projeto</h3>
              {feitos.length ? (
                <ul className="list-disc space-y-1 pl-5 text-[14px]">
                  {feitos.map((i, k) => (
                    <li key={k}>{i.descricao}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-tinta-2">Nada para registrar nas datas: o projeto já está como o HUB mostra, ou o conteúdo não trouxe datas.</p>
              )}
            </div>
          )}
          {!bloqueado && avisos.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold">O sistema não aplicaria</h3>
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-laranja">
                {avisos.map((i, k) => (
                  <li key={k}>{i.descricao}</li>
                ))}
              </ul>
            </div>
          )}
          {lido.nao_importado.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold">Está no HUB, mas fica com você</h3>
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-tinta-2">
                {lido.nao_importado.map((t, k) => (
                  <li key={k}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {!bloqueado && entrega && (
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold">Lido da página do HUB{entrega.titulo ? ` (${entrega.titulo.slice(0, 60)})` : ""}</h3>
              {entrega.textoCortado && <p className="mb-1.5 text-[13px] text-laranja">A página era muito longa e só o começo foi lido.</p>}
              {materiais.length > 0 ? (
                <>
                  <p className="mb-1 text-[13px] text-tinta-2">Arquivos baixados, que serão guardados no projeto ao aplicar:</p>
                  <ul className="list-disc space-y-1 pl-5 text-[14px]">
                    {materiais.map((m, i) => (
                      <li key={`${m.arquivo.name}-${i}`}>
                        {m.arquivo.name} <span className="text-tinta-2">({tamanhoFmt(m.arquivo.size)}{m.lidoPelaIA ? ", lido pela IA" : ", guardado, mas grande demais para a IA ler junto"})</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-[14px] text-tinta-2">Nenhum arquivo anexado foi encontrado na página.</p>
              )}
              {(entrega.falhas.length > 0 || entrega.naoGuardados.length > 0) && (
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[14px] text-laranja">
                  {entrega.falhas.map((f, k) => (
                    <li key={`f${k}`}>
                      Não baixei “{f.nome}”: {f.motivo}.
                    </li>
                  ))}
                  {entrega.naoGuardados.map((n, k) => (
                    <li key={`n${k}`}>
                      “{n.nome}” ({n.tipo}) não é PDF nem imagem; o Blimp ainda não guarda esse tipo.
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {erro && <p className="text-[13px] text-vermelho">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <Botao tamanho="pequeno" onClick={() => void aplicar()} disabled={aplicando || bloqueado || (!feitos.length && !materiais.length)}>
              {aplicando ? "Aplicando…" : "Aplicar no projeto"}
            </Botao>
            <Botao variante="secundario" tamanho="pequeno" onClick={() => setLido(null)} disabled={aplicando}>
              Voltar
            </Botao>
            <Botao variante="fantasma" tamanho="pequeno" onClick={aoFechar} disabled={aplicando}>
              Cancelar
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
