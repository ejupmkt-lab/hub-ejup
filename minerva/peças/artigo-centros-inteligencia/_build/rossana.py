#!/usr/bin/env python3
"""Versão da Dra. Rossana com as perguntas-subtítulo de volta. O texto dela fica como está, com um único ajuste (marcado em README)."""
import pathlib
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

OUT = pathlib.Path(__file__).resolve().parent.parent

TITULO = "Centros de Inteligência do Judiciário e o enfrentamento das demandas repetitivas"

# (None = sem subtítulo) · cada item: (subtítulo, [parágrafos])
SECOES = [
 (None, [
  "Quem advoga há algum tempo conhece bem a cena. O mesmo conflito, nascido da mesma causa, chega aos tribunais em centenas ou milhares de processos praticamente idênticos. Uma cobrança indevida replicada em escala, uma norma que admite duas leituras, um contrato-padrão com uma cláusula mal resolvida. A litigiosidade repetitiva é hoje um dos maiores desafios do Judiciário brasileiro, e foi para enfrentá-la de outro modo que surgiram os Centros de Inteligência do Poder Judiciário.",
  "A ideia por trás deles é simples de enunciar e difícil de executar. Em vez de tratar cada processo isoladamente, os Centros procuram identificar padrões, entender por que aquele conflito se repete e propor respostas capazes de prevenir novas ações ou, ao menos, racionalizar o seu tratamento. Para isso combinam monitoramento, estudos, articulação com outras instituições, gestão de precedentes e produção de notas técnicas."]),
 ("Por que os Centros de Inteligência ganharam espaço no Judiciário brasileiro?", [
  "Por mais produtivo que seja um tribunal, julgar caso a caso deixa intacta a causa que gera o litígio em série. O próprio Judiciário reconheceu isso ao incluir a gestão de demandas repetitivas e de grandes litigantes entre os macrodesafios da Estratégia Nacional do Poder Judiciário 2021-2026, como registra a Resolução CNJ nº 349/2020. Os Centros de Inteligência trabalham com uma pergunta que vem antes do julgamento, a de saber por que aquele conflito insiste em voltar. Quase sempre a resposta está numa prática administrativa, numa norma ambígua, num contrato-padrão ou em orientações divergentes entre órgãos públicos. Estudo publicado na Revista Themis em 2023 aponta justamente esse potencial dos centros para prevenir conflitos e reduzir o efeito multiplicador das demandas repetitivas."]),
 ("O que é um Centro de Inteligência do Judiciário?", [
  # ajuste único: removida a pergunta retórica inicial ("Mas o que é, afinal, um Centro de Inteligência?"), que agora é o subtítulo
  "É uma estrutura, instalada dentro de um tribunal ou de um conselho, encarregada de monitorar a litigiosidade e propor o tratamento adequado para demandas estratégicas, repetitivas e de massa. No topo da rede está o Centro de Inteligência do Poder Judiciário, o CIPJ, que funciona junto ao Conselho Nacional de Justiça e coordena os centros locais dos tribunais e os centros nacionais da Justiça Federal e da Justiça do Trabalho. O trabalho segue um percurso conhecido. O centro identifica a causa do litígio, propõe uma solução na origem, seja por autocomposição, seja por encaminhamento administrativo, e depois acompanha os resultados. O produto mais visível desse esforço é a nota técnica, documento que reúne estudos e recomendações sobre prevenção de conflitos, monitoramento de demandas e gestão de precedentes."]),
 ("Como surgiu o modelo e como ele se tornou uma política nacional?", [
  "O modelo tem raízes potiguares, e isso merece registro. Em 2015, a Justiça Federal no Rio Grande do Norte criou, por meio da Portaria nº 164/2015 da Direção do Foro, a Comissão Judicial de Prevenção de Demandas, mais tarde transformada em Centro Local de Inteligência. À frente da Direção do Foro estava o juiz federal Marco Bruno Miranda Clementino, que presidiu a comissão e, depois, o Centro Local de Inteligência da JFRN, e que desde então se dedica ao estudo e à difusão do tema. A experiência foi levada ao plano nacional pelo Conselho da Justiça Federal, que em 2017, pela Portaria CJF nº 369, criou o Centro Nacional e os Centros Locais de Inteligência da Justiça Federal, estrutura consolidada no ano seguinte pela Resolução CJF nº 499/2018.",
  "Em 2020, o CNJ estendeu essa lógica a todo o Judiciário. A Resolução CNJ nº 349, aprovada pelo Plenário em 20 de outubro e datada de 23 de outubro de 2020, instituiu o CIPJ e a rede de Centros de Inteligência do Poder Judiciário. Desde então, a política integra a estratégia nacional de gestão de precedentes e de demandas repetitivas."]),
 ("Como os Centros de Inteligência funcionam na prática?", [
  "Na prática, os centros acompanham o volume e o perfil das ações, estudam as causas dos conflitos que se repetem e buscam, em diálogo com outros órgãos públicos e com os próprios litigantes, soluções que evitem novos processos. As notas técnicas orientam, mas não decidem. O julgamento de cada caso continua com o juiz."]),
 ("Qual é a diferença entre Centro de Inteligência, IRDR e recursos repetitivos?", [
  "É comum que se confunda o papel dos Centros de Inteligência com o de instrumentos processuais como o incidente de resolução de demandas repetitivas, previsto no art. 976 do CPC, e o julgamento de recursos especial e extraordinário repetitivos, disciplinado a partir do art. 1.036. Esses mecanismos entram em cena quando a controvérsia já está espalhada por muitos processos, e o que produzem é uma tese jurídica ou um precedente qualificado. O IRDR uniformiza a questão no âmbito dos tribunais de segundo grau, e os recursos repetitivos fazem o mesmo nos tribunais superiores. O Centro de Inteligência atua em outro plano. Seu foco é a causa do litígio, e ele pode agir antes que os conflitos se multipliquem ou enquanto se multiplicam, inclusive sinalizando que determinado tema merece ser levado a um desses instrumentos.",
  "Os dois caminhos se complementam. O precedente formado no IRDR ou no julgamento repetitivo ajuda o centro a acompanhar a aplicação da tese."]),
 ("O que muda com a Lei nº 15.484/2026?", [
  "Esse sistema ganhou recentemente uma nova peça com a Lei nº 15.484/2026, que regulamentou o filtro de relevância da questão federal no recurso especial e incluiu os julgamentos do STJ proferidos sob esse regime entre os precedentes de observância obrigatória. Com o acesso ao STJ mais seletivo, a tendência é que a uniformização feita pelos tribunais de segundo grau ganhe ainda mais peso, e com ela o trabalho de quem identifica, já na origem, as controvérsias que se repetem."]),
 ("O que está mudando nos Centros de Inteligência em 2026?", [
  "Mas é bom que se diga que todo esse arcabouço está em revisão. Em julho de 2026, pela Portaria nº 333, o CNJ instituiu um grupo de trabalho para estudar e propor mudanças na Resolução 349 e aprimorar a rede de Centros de Inteligência.",
  "Segundo o CNJ, a revisão pretende reforçar a atuação dos centros na identificação de litigância abusiva, mas sempre tentando promover o que é da essência do judiciário, que é a pacificação social. Também está no horizonte o uso de inteligência artificial e de análise de dados processuais para identificar padrões entre processos, partes e advogados. A proposta ainda passará por consulta pública, e até lá a Resolução 349/2020 segue como texto de referência."]),
 ("O que os Centros de Inteligência mudam para a advocacia?", [
  "Para quem advoga, e para os departamentos jurídicos de empresas expostas a litígios em série, nada disso é um debate distante. As notas técnicas e os estudos dos centros mostram onde estão as causas da litigiosidade repetitiva, e essa informação tem valor prático em pelo menos quatro frentes. A primeira é o diagnóstico, já que é possível verificar se a controvérsia do cliente integra um grupo de demandas repetitivas e se o tribunal já estudou alguma solução administrativa para ela. A segunda é a argumentação, porque conhecer o estudo que o próprio tribunal produziu sobre o tema qualifica a petição e o diálogo com o juízo.",
  "A terceira frente é a prevenção. Quando a origem do litígio está numa prática da própria organização, como um contrato-padrão, um fluxo de atendimento ou uma interpretação reiterada de norma, o trabalho consultivo pode reduzir o volume de processos e o risco jurídico, o que pesa ainda mais para quem se enquadra no perfil de grande litigante. A quarta é a participação institucional. A revisão da Resolução 349 prevê consulta pública, e entidades, escritórios e departamentos jurídicos podem acompanhar o processo e contribuir com sua experiência prática."]),
 ("Continue essa conversa no EJUPcast", [
  "Esse tema rendeu uma ótima conversa no episódio #019 do EJUPcast, quando recebi o juiz federal Marco Bruno Miranda Clementino para falar sobre inovação na Justiça, prevenção de litígios, doutrina e o futuro da advocacia diante da inteligência artificial. Marco Bruno, que como um dos idealizadores, esteve na origem dessa história no Rio Grande do Norte e hoje integra o grupo de trabalho do CNJ responsável pela revisão da Resolução nº 349/2020, conforme a Portaria CNJ nº 333/2026. Vale a escuta."]),
]

NAVY = RGBColor(0x03, 0x1c, 0x37)


def montar():
    d = Document()
    s = d.sections[0]
    s.left_margin = s.right_margin = Cm(2.5); s.top_margin = s.bottom_margin = Cm(2.3)
    st = d.styles["Normal"]; st.font.name = "Calibri"; st.font.size = Pt(11.5)
    t = d.add_paragraph(); r = t.add_run(TITULO); r.bold = True; r.font.size = Pt(22); r.font.color.rgb = NAVY
    t.paragraph_format.space_after = Pt(14)
    for sub, pars in SECOES:
        if sub:
            h = d.add_paragraph(); r = h.add_run(sub); r.bold = True; r.font.size = Pt(14); r.font.color.rgb = NAVY
            h.paragraph_format.space_before = Pt(16); h.paragraph_format.space_after = Pt(6); h.paragraph_format.keep_with_next = True
        for p in pars:
            q = d.add_paragraph(p); q.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            q.paragraph_format.space_after = Pt(8); q.paragraph_format.line_spacing = 1.25
    return d


def texto_md():
    L = [f"# {TITULO}", ""]
    for sub, pars in SECOES:
        if sub: L += [f"## {sub}", ""]
        for p in pars: L += [p, ""]
    return "\n".join(L)


if __name__ == "__main__":
    montar().save(OUT / "Artigo_Centros_de_Inteligencia_versao_Dra_Rossana_com_perguntas.docx")
    (OUT / "versao-rossana-com-perguntas.md").write_text(texto_md())
    print("ok")
