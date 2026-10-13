export function AjudaFormatacao() {
  return (
    <details className="rounded-md border border-linha bg-papel px-4 py-3 text-xs text-tinta-2">
      <summary className="cursor-pointer font-medium text-tinta">Como o texto vira o relatório</summary>
      <ul className="mt-2 space-y-1">
        <li>Linha em branco separa parágrafos (justificados, com recuo de primeira linha).</li>
        <li><code>a) texto</code> ou <code>(i) texto</code> no início da linha vira alínea, com o recuo largo dos relatórios.</li>
        <li><code>## Subtítulo</code> vira subseção numerada (8.1, 8.2…).</li>
        <li><code>[[tabela:riscos]]</code> insere a tabela do registro (pessoas, marcos, fornecedores, normas, reunioes, treinamentos, processos, riscos, acoes, ropa, incidentes).</li>
        <li><code>!QUADRO Título</code> ou <code>!ALERTA Título</code> na primeira linha de um parágrafo cria um quadro de destaque (azul ou laranja).</li>
        <li><code>Figura: legenda</code> vira a legenda numerada “Figura 1 - legenda”.</li>
      </ul>
    </details>
  );
}
