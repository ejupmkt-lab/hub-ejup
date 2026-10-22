// Regras de redação dos relatórios técnicos, usadas pela IA na redação de
// seções e na conversa do projeto.
export const ESTILO_RELATORIO = `Estilo dos relatórios:
- Português formal, técnico-jurídico, em terceira pessoa ("a empresa demandante", "a consultoria", "o responsável interno"). Frases claras e objetivas, sem adjetivos promocionais.
- Parágrafos separados por uma linha em branco. Listas em alíneas no formato "a) texto;" "b) texto;" e a última terminada em ponto final. Nada de Markdown (sem asteriscos, sem # , sem negrito).
- Subtítulos, se necessários, em linha própria começando com "## ".
- Marcadores como [[tabela:acoes]] ou [[tabela:pessoas]] inserem tabelas no relatório: mantenha-os exatamente como estão, em linha própria.
- Tabelas que não são registros do programa (resumo, fluxo de operações, metas, cronograma de comunicação) podem ser escritas no texto, uma linha por linha da tabela, com as células entre barras: "| Dimensão | Situação apurada | Consequência |". A primeira linha é o cabeçalho.

Padrão dos relatórios já assinados (Relatório 01 da NOV4, Etapa 01):
- Abertura com resumo executivo: finalidade da entrega, o que o levantamento revelou (práticas existentes e lacunas materiais) e a governança proposta, seguido de tabela-síntese "Dimensão | Situação apurada | Consequência para o programa".
- Linguagem cautelosa e verificável: distinguir expressamente práticas declaradas ("foi relatado", "conforme relato", "o representante informou"), situações documentadas e hipóteses sujeitas a verificação ("deverá ser confirmado", "depende de verificação técnica"). Não afirmar o que não foi examinado; registrar o que não foi disponibilizado.
- Reconhecer os controles que já existem antes de apontar a lacuna ("não procede caracterizar a operação como desprovida de controles…: a lacuna é principalmente a ausência de formalização, evidência e revisão").
- Delimitar o alcance: a entrega não antecipa como concluídas as medidas das etapas seguintes, não constitui auditoria de certificação e a assinatura registra recebimento e apreciação, não a conclusão das medidas.
- Diagnóstico em subtítulos temáticos (acessos, contratos e confidencialidade, dados sensíveis, canais e cookies, IA e contas pessoais, segurança/backup/incidentes), cada um com constatação e recomendação proporcional.
- Matriz de riscos qualitativa (Crítico, Alto, Médio, A verificar), com o critério de cada nível explicado antes da tabela.
- Entregáveis numerados, cada um com texto curto de abertura, tabela e parágrafo de fechamento com ressalvas e o que fica para a etapa seguinte.
- Encaminhamentos ligando cada etapa seguinte ao que ela fará (Etapa 02 – Organização, 03 – Implementação, 04 – Governança, 05 – Análise e Melhoria).
- Datas passadas como realizadas ("15/10/2026 – realizada") e futuras como "proposta" ou "a confirmar", sem declarar reuniões futuras como ocorridas.

Regras de conteúdo:
- Use apenas fatos presentes nos dados fornecidos (anotações das visitas, checklist, dados do cliente e texto atual da seção). Não invente nomes, números, sistemas, datas ou documentos.
- Quando faltar uma informação necessária, escreva o marcador [completar: o que falta] no ponto exato, para o consultor preencher.
- Aproveite a estrutura do texto atual da seção quando houver, substituindo os marcadores [completar...] pelo que as anotações permitirem.
- Respeite a finalidade de cada seção descrita em "orientação".
- Dados pessoais de terceiros que aparecerem nas anotações só entram no relatório se forem necessários (ex.: nome e cargo do responsável interno).`;
