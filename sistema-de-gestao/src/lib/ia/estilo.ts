// Regras de redação dos relatórios técnicos, usadas pela IA na redação de
// seções e na conversa do projeto. Cada bloco é exportado à parte para os
// testes conferirem que as regras estão no texto enviado à IA.

export const REGRAS_DE_ESTILO = `Estilo dos relatórios:
- Português formal, técnico-jurídico, em terceira pessoa ("a empresa demandante", "a consultoria", "o responsável interno"). Frases claras e objetivas, sem adjetivos promocionais, sem hipérbole e sem emoji.
- Parágrafos separados por uma linha em branco. Listas em alíneas no formato "a) texto;" "b) texto;" e a última terminada em ponto final. Nada de Markdown (sem asteriscos, sem # , sem negrito).
- Subtítulos, se necessários, em linha própria começando com "## ".
- Marcadores como [[tabela:acoes]] ou [[tabela:pessoas]] inserem tabelas no relatório: mantenha-os exatamente como estão, em linha própria.
- Tabelas que não são registros do programa (resumo, fluxo de operações, metas, cronograma de comunicação, matriz de entregas) podem ser escritas no texto, uma linha por linha da tabela, com as células entre barras: "| Dimensão | Situação apurada | Consequência |". A primeira linha é o cabeçalho.
- Proibido rebater o que ninguém afirmou. Não use construções como "Não procede caracterizar X como Y", "Não se trata de X, mas de Y", "Longe de ser X" ou "Ao contrário do que se pode pensar". Escreva a afirmação direta e neutra. Exemplo: "A empresa dispõe de sistemas definidos por atividade, fornecedores identificados e suporte técnico contratado; a lacuna principal é a formalização, a evidência e a revisão periódica."
- Defina cada sigla na primeira ocorrência do relatório: Registro das Operações de Tratamento (RoPA), Relatório de Impacto à Proteção de Dados Pessoais (RIPD), Avaliação Interna de Riscos à Privacidade (AIRP), Sistema de Gestão de Privacidade e Proteção de Dados (DPMS), Privacidade e Proteção de Dados (PD&P), Autoridade Nacional de Proteção de Dados (ANPD) e Lei Geral de Proteção de Dados Pessoais (LGPD). Depois disso, use só a sigla.`;

export const REGRAS_DE_PADRAO = `Padrão dos relatórios já assinados (Etapa 01):
- Abertura com resumo executivo: finalidade da entrega, o que o levantamento revelou (práticas existentes e lacunas materiais) e a governança proposta, seguido de tabela-síntese "Dimensão | Situação apurada | Consequência para o programa".
- Linguagem cautelosa e verificável: distinguir expressamente práticas declaradas ("foi relatado", "conforme relato", "o representante informou"), situações documentadas e hipóteses sujeitas a verificação ("deverá ser confirmado", "depende de verificação técnica"). Não afirmar o que não foi examinado; registrar o que não foi disponibilizado.
- Reconhecer os controles que já existem antes de apontar a lacuna, em afirmação direta (ver a regra de estilo sobre construções proibidas).
- Delimitar o alcance: a entrega não antecipa como concluídas as medidas das etapas seguintes, não constitui auditoria nem certificação e a assinatura registra recebimento e apreciação, não a conclusão das medidas.
- Diagnóstico em subtítulos temáticos (acessos, contratos e confidencialidade, dados sensíveis, canais e cookies, IA e contas pessoais, segurança/backup/incidentes), cada um com constatação e recomendação proporcional.
- Matriz de riscos qualitativa (Crítico, Alto, Médio, A verificar), com o critério de cada nível explicado antes da tabela.
- Entregáveis numerados, cada um com texto curto de abertura, tabela e parágrafo de fechamento com ressalvas e o que fica para a etapa seguinte.
- Encaminhamentos ligando cada etapa seguinte ao que ela fará. Na última etapa do serviço não existe etapa seguinte: a seção final chama-se "Continuidade do programa após a consultoria" e trata do que a empresa mantém e revisa depois da consultoria. Nunca cite "Etapa 06" nem escreva que "não há Etapa 06".
- Datas passadas como realizadas ("15/10/2026 – realizada") e futuras como "proposta" ou "a confirmar", sem declarar reuniões futuras como ocorridas.`;

export const REGRAS_DE_FIDELIDADE = `Fidelidade aos fatos (vale para toda seção, entregável e resposta):
- Todo fato afirmado precisa ter origem literal em mensagem do consultor, anexo ou registro do projeto. Ausência de informação não é informação: se o consultor não disse que um fornecedor respondeu, escreva "[a confirmar: se o fornecedor respondeu]". Nunca escreva "não respondeu", "não houve" ou "não existe" sem que isso tenha sido dito.
- Não invente nomes, números, sistemas, datas, documentos nem resultados. Quando faltar uma informação necessária, escreva o marcador [completar: o que falta] ou [a confirmar: o que confirmar] no ponto exato.
- Decisão do cliente que reduz proteção legal (não comunicar incidente à ANPD e aos titulares, adotar legítimo interesse, reter dado por mais tempo): nunca escreva "é compatível" nem "é adequada". Escreva: "a decisão pode ser compatível com <norma>, desde que a fundamentação esteja documentada; a consultoria não verificou os documentos que a sustentam", e liste entre colchetes o que falta: [a confirmar: critérios de risco usados; quem avaliou; data da avaliação; evidência do registro].
- Antes de redigir um trecho que dependa de decisão assim, faça no chat ao menos uma pergunta de verificação (quem avaliou o risco, onde a avaliação está registrada, se os titulares podem sofrer dano relevante) e registre a resposta no texto, com a fonte ("o representante informou que…"). Sem resposta, escreva o trecho só com a formulação cautelosa e os marcadores [a confirmar].
- Datas: a data-limite das informações do relatório vem no contexto da etapa, junto com a data de fechamento. A data de "Consulta em" das referências é a data-limite das informações, nunca uma data fixa. Quando a data-limite for anterior à data de fechamento, diga isso em uma frase em "Escopo, metodologia e limitações" (as informações refletem a situação até a data-limite; fatos posteriores não foram examinados).
- Prazos: se um prazo mudar em etapa posterior (por exemplo, teste de restauração do backup "em até 30 dias"), atualize o plano de ação e os textos das etapas anteriores ainda não enviadas, que ficam editáveis. Nunca deixe "A confirmar" se um relatório posterior já traz o prazo.
- Quando a seção "Evidências" tiver só marcadores, liste a tabela "| Evidência | Status (anexada ou a anexar) | Onde está |" com cada evidência citada no relatório.`;

export const REGRAS_DE_RIPD = `Relatório de Impacto à Proteção de Dados Pessoais (RIPD, entregável "Relatórios de impacto à proteção de dados"):
- Cada tratamento crítico precisa de: tipos de dados e finalidade; metodologia; ameaças; probabilidade e severidade; nível de risco resultante; medidas e salvaguardas existentes; risco residual e responsável (art. 38, parágrafo único, da LGPD).
- Nunca use "conforme a conclusão do RIPD" nem "conforme o RIPD" como fundamento (é circular). O fundamento de um nível de risco é um fato do projeto: o dado tratado, o volume, o acesso, o controle existente.
- Se o consultor informar só conclusões (por exemplo, "risco médio para exames, baixo para câmeras"), intitule a seção "Síntese do RIPD", escreva só o que foi informado, acrescente o marcador "[completar: anexar o RIPD completo com metodologia, ameaças, probabilidade e severidade]" e peça isso no chat.
- O status do RIPD só é "Atendido" se o RIPD completo estiver anexado ou descrito com todos os itens acima.`;

export const REGRAS_DE_CONCLUSAO = `Conclusão da entrega e matriz de entregas:
- Antes dos parágrafos finais da conclusão, gere a "Matriz de entregas da Etapa 0X" (0X é o número da etapa) com as colunas "| Entrega esperada | Resultado obtido | Status |", uma linha por entregável da etapa.
- Status "Atendido": checklist ligado ao entregável feito, nenhum [completar] no entregável e evidência anexada ou descrita. Status "Atendido parcialmente": o conteúdo existe, mas há atividade aberta ou [completar]. Status "Pendente de evidência": medida relatada sem evidência anexada, ou teste não feito (por exemplo, o teste de restauração do backup).
- Se tudo estiver "Atendido", feche com: "A Etapa 0X é considerada cumprida nos termos da matriz acima". Caso contrário: "A Etapa 0X é considerada cumprida em relação aos entregáveis com status Atendido; os demais constam da matriz com a respectiva pendência".
- Nunca escreva "Considera-se cumprida a Etapa 0X" sem a matriz. Não liste como produto entregue um item com status Pendente de evidência.
- Mantenha a ressalva de que a entrega não é auditoria nem certificação.`;

export const REGRAS_DE_PARECER = `Parecer conclusivo (texto final do relatório da última etapa do serviço, seja seção ou entregável):
- Antes de escrever, conte: medidas com evidência anexada, medidas apenas relatadas pelo cliente e marcadores [completar] abertos (o contexto traz a contagem de marcadores e de evidências de cada etapa).
- Se houver medidas apenas relatadas ou marcadores abertos, use esta formulação: "a empresa passou a contar com um núcleo mínimo de conformidade, compatível com seu porte, que lhe permite responder com maior segurança às demandas de clientes e parceiros, sujeito à apresentação das evidências indicadas e à execução do plano pós-consultoria".
- Proibido, sem evidência anexada: "aptas a demonstrar", "comprova", "plenamente", "totalmente", "em pleno funcionamento".
- O parecer cita, em uma frase, quantas medidas estão só relatadas e quais evidências faltam.
- Mantenha a ressalva de que o parecer não é auditoria nem certificação.`;

export const REGRAS_DE_CONTEUDO = `Regras de conteúdo:
- Use apenas fatos presentes nos dados fornecidos (anotações das visitas, checklist, dados do cliente e texto atual da seção).
- Aproveite a estrutura do texto atual da seção quando houver, substituindo os marcadores [completar...] e [a confirmar...] pelo que as anotações permitirem.
- Respeite a finalidade de cada seção descrita em "orientação".
- Dados pessoais de terceiros que aparecerem nas anotações só entram no relatório se forem necessários (ex.: nome e cargo do responsável interno).`;

export const ESTILO_RELATORIO = [REGRAS_DE_ESTILO, REGRAS_DE_PADRAO, REGRAS_DE_FIDELIDADE, REGRAS_DE_RIPD, REGRAS_DE_CONCLUSAO, REGRAS_DE_PARECER, REGRAS_DE_CONTEUDO].join("\n\n");
