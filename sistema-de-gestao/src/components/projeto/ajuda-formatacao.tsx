export function AjudaFormatacao() {
  return (
    <details className="group rounded-[var(--radius-bloco)] px-1 py-1 text-sm text-tinta-2">
      <summary className="cursor-pointer list-none text-sm text-tinta-2 marker:hidden hover:text-tinta">
        <span className="underline decoration-linha-forte underline-offset-4 group-open:no-underline">Como o texto vira o relatório: parágrafos, alíneas, tabelas e quadros</span>
      </summary>
      <dl className="mt-3 grid rounded-[var(--radius-bloco)] border border-linha bg-folha p-5 gap-x-6 gap-y-2.5 sm:grid-cols-[11rem_1fr]">
        <dt className="text-tinta">Linha em branco</dt>
        <dd>Novo parágrafo, justificado e com recuo, como nos relatórios.</dd>
        <dt className="font-mono text-[13px] text-tinta">a) texto</dt>
        <dd>Alínea com o recuo largo. Também vale (i), (ii)…</dd>
        <dt className="font-mono text-[13px] text-tinta">## Subtítulo</dt>
        <dd>Subseção numerada (8.1, 8.2…).</dd>
        <dt className="font-mono text-[13px] text-tinta">[[tabela:riscos]]</dt>
        <dd>
          Tabela de um registro do programa: pessoas, marcos, fornecedores, normas, reunioes, treinamentos, processos, riscos, acoes, ropa ou
          incidentes.
        </dd>
        <dt className="font-mono text-[13px] text-tinta">!QUADRO Título</dt>
        <dd>Na primeira linha do parágrafo, cria um quadro de destaque. Use !ALERTA para o quadro laranja.</dd>
        <dt className="font-mono text-[13px] text-tinta">Figura: legenda</dt>
        <dd>Legenda numerada “Figura 1 - legenda”.</dd>
      </dl>
    </details>
  );
}
