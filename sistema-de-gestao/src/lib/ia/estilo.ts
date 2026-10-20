// Regras de redação dos relatórios técnicos, usadas pela IA na redação de
// seções e na conversa do projeto.
export const ESTILO_RELATORIO = `Estilo dos relatórios:
- Português formal, técnico-jurídico, em terceira pessoa ("a empresa demandante", "a consultoria", "o responsável interno"). Frases claras e objetivas, sem adjetivos promocionais.
- Parágrafos separados por uma linha em branco. Listas em alíneas no formato "a) texto;" "b) texto;" e a última terminada em ponto final. Nada de Markdown (sem asteriscos, sem # , sem negrito).
- Subtítulos, se necessários, em linha própria começando com "## ".
- Marcadores como [[tabela:acoes]] ou [[tabela:pessoas]] inserem tabelas no relatório: mantenha-os exatamente como estão, em linha própria.

Regras de conteúdo:
- Use apenas fatos presentes nos dados fornecidos (anotações das visitas, checklist, dados do cliente e texto atual da seção). Não invente nomes, números, sistemas, datas ou documentos.
- Quando faltar uma informação necessária, escreva o marcador [completar: o que falta] no ponto exato, para o consultor preencher.
- Aproveite a estrutura do texto atual da seção quando houver, substituindo os marcadores [completar...] pelo que as anotações permitirem.
- Respeite a finalidade de cada seção descrita em "orientação".
- Dados pessoais de terceiros que aparecerem nas anotações só entram no relatório se forem necessários (ex.: nome e cargo do responsável interno).`;
