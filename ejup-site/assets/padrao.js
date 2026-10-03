// Conteúdo padrão do site: usado quando a Área da Equipe ainda não publicou itens (tabela site_itens).
// Lido pelo site (assets/app.js) e pelo servidor (api/pagina.js: títulos, descrições e imagens de prévia).
export default {
LINKS:{
 whatsapp:'https://wa.me/5585992714050',
 mapa:'https://www.google.com/maps/search/?api=1&query=Rua%20da%20Saudade%2C%201028%20-%20Lagoa%20Nova%2C%20Natal%20-%20RN',
 instagram:'https://www.instagram.com/ejup.oficial/',
 youtube:'',   // canal da EJUP no YouTube
 spotify:''    // EJUPcast no Spotify
},
F:[
 {id:'licenciamento',img:'curso1',cat:'direito',lb:'Direito Ambiental',t:'Marco Legal do Licenciamento Ambiental',d:'Domine a nova Lei Geral do Licenciamento Ambiental (Lei 15.190/2025) com foco em aplicação prática e segurança jurídica.',f:['10 horas','4 módulos','Online','Certificado'],alt:'Capa da formação Marco Legal do Licenciamento Ambiental, com os professores Leonardo Pivotto e Maria Helena Cortez',
  fd:['10 horas','4 módulos','Online','Certificado de conclusão'],incl:['10 horas de curso','4 módulos','Acesso online','Certificado de conclusão'],preco:'R$ 649,90',preco_de:'R$ 990,00',parcelas:'ou 12x de R$ 65',checkout:'',
  sobre:'A Formação Novo Marco Legal do Licenciamento Ambiental oferece uma análise prática, técnica e aprofundada da Lei Geral do Licenciamento Ambiental, explorando suas principais inovações, modalidades de licenciamento, hipóteses de dispensa, competências institucionais e aspectos procedimentais de maior relevância para a atuação profissional.\n\nConduzido por Leonardo Pivotto, com participação da professora convidada Maria Helena Cortez, o curso foi estruturado para proporcionar segurança jurídica, atualização normativa e capacidade de aplicação concreta da nova legislação no contexto de consultorias, órgãos públicos, empreendimentos e atividades sujeitas ao controle ambiental.',
  aprender:['Compreender profundamente a nova Lei Geral do Licenciamento Ambiental','Aplicar corretamente prazos, renovações e condicionantes ambientais','Dominar as novas modalidades de licenciamento ambiental','Evitar erros comuns de interpretação da nova legislação','Identificar hipóteses de dispensa e atividades não sujeitas ao licenciamento','Utilizar o novo marco legal na prática profissional'],
  modulos:[{t:'Introdução e Princípios Fundamentais'},{t:'As Modalidades de Licenciamento'},{t:'Isenções e Dispensas de Licenciamento'},{t:'Temas Transversais e Procedimentais'}],
  profs:[{id:'leonardo-pivotto'},{id:'maria-helena-cortez',papel:'Professora convidada'}]},
 {id:'pareceres',img:'curso2',cat:'direito',lb:'Direito Ambiental',t:'Formação em Pareceres Técnicos Ambientais',d:'Da estrutura à argumentação: como produzir pareceres robustos e defensáveis.',f:['8 horas','Online','Certificado'],alt:'Capa da formação Elaboração de Parecer Técnico, com o professor Leonardo Pivotto',profs:[{id:'leonardo-pivotto'}]},
 {id:'equipes',img:'curso3',cat:'direito',lb:'Direito Ambiental · Corporativo',t:'Marco Legal do Licenciamento Ambiental para equipes',d:'Formação presencial voltada à compreensão prática da nova Lei Geral do Licenciamento Ambiental (Lei nº 15.190/2025).',f:['5 horas','Presencial','In company'],alt:'Capa da formação corporativa Marco Legal do Licenciamento Ambiental, com o professor Leonardo Pivotto',profs:[{id:'leonardo-pivotto'}],incompany:true}
],
E:[
 {n:18,m:'Ep. 18 · 67 min',img:'ep18',cat:'direito',t:'Decisões por IA, Tribunais e Rumos da Advocacia',d:'O que separa a agilidade técnica de um processo da sua real segurança jurídica? Quase sempre, um profissional disposto a exercer o pensamento crítico.'},
 {n:17,m:'Ep. 17 · 60 min',img:'ep17',cat:'negocios',t:'O Risco Que Virou Case de Sucesso',d:'O que separa uma ideia de um negócio consolidado? Muitas vezes, alguém disposto a apostar antes de qualquer garantia.'},
 {n:16,m:'Ep. 16',img:'ep16',cat:'power',t:'Repertório Não Se Improvisa',d:'Como o repertório jurídico se constrói com tempo, estudo, prática e escuta ativa — e por que a pressa pode ser a maior inimiga da solidez profissional.'}
],
AR:[
 {id:'multiportas',img:'art1',imgv:'art1v',t:'O sistema multiportas do setor elétrico',d:'Mediação na ANEEL e arbitragem na CCEE: como funciona cada porta.',by:'Equipe EJUP',min:12,date:'29 de setembro de 2026',
  corpo:'Ao longo da evolução do marco regulatório do setor elétrico brasileiro, consolidaram-se diferentes mecanismos de tratamento de conflitos. Entre eles estão a Ouvidoria Setorial e a mediação administrativa no âmbito da Agência Nacional de Energia Elétrica (ANEEL), além da arbitragem aplicável a determinadas controvérsias no ambiente da Câmara de Comercialização de Energia (CCEE). Esse conjunto de vias, ao lado do próprio processo judicial, é chamado, na doutrina, de sistema multiportas do setor elétrico.\n\n## O que é o sistema multiportas no setor elétrico?\n\nSistema multiportas é a expressão doutrinária usada para descrever um modelo em que o mesmo conflito pode ser encaminhado por caminhos distintos, a depender de sua natureza e complexidade. No setor elétrico, essas portas incluem a Ouvidoria Setorial e a mediação administrativa, ambas conduzidas pela ANEEL, a arbitragem realizada por câmaras credenciadas no ambiente da CCEE, e o próprio processo judicial.\n\nÉ importante não tratar esse conjunto como uma estrutura única pertencente institucionalmente à ANEEL. A Ouvidoria Setorial e a mediação administrativa integram as competências da Agência, atribuídas pela Lei nº 9.427/1996. Já a arbitragem ocorre em outro ambiente institucional, o da CCEE, regida por sua própria Convenção Arbitral, homologada pela ANEEL.\n\n## Qual é a base legal da mediação administrativa na ANEEL?\n\nA mediação administrativa da ANEEL tem fundamento na Lei nº 9.427/1996, que atribui à Agência a função de dirimir divergências no âmbito administrativo, e é operacionalizada hoje pela Superintendência de Mediação Administrativa e das Relações de Consumo (SMA). A estrutura de resolução de conflitos do setor elétrico está amparada em um conjunto de normas que se complementam.'},
 {id:'stf',img:'art2',t:'A eventual responsabilização de ministros do STF: quais mecanismos o ordenamento brasileiro prevê?',st:'A eventual responsabilização de ministros do STF',d:'Quem pode julgar ministros do STF, o alcance do CNJ, o papel do Senado e os limites institucionais previstos no ordenamento.',by:'Equipe EJUP',min:15},
 {id:'policia',img:'art3',t:'Poder de polícia ambiental municipal: o licenciamento simplificado é eficaz sem capacidade técnica?',st:'Poder de polícia ambiental municipal',d:'Sem órgão ambiental capacitado, a simplificação reduz a burocracia sem reduzir o risco ambiental.',by:'Leonardo Pivotto',min:15},
 {id:'investigacao',img:'art4',t:'A legitimidade da investigação defensiva no processo penal: fundamentos, limites e aplicação prática',d:'',by:'',min:0}
],
FAQ:[
 ['O que é a EJUP?','A EJUP é uma escola de educação jurídica continuada, que oferece formações, uma coluna de análise assinada por especialistas e o EJUPcast, seu podcast institucional. Não é um curso preparatório para concursos nem para o exame da OAB: é formação continuada para quem já exerce ou está prestes a exercer sua profissão.'],
 ['Para quem é a EJUP?','A EJUP é indicada a quem busca profundidade e visão estratégica: advogados e juristas, professores e pesquisadores, profissionais da interface jurídica e estudantes em fase final. Não é indicada a quem procura atalho formativo, fórmula pronta ou promessa de resultado imediato.'],
 ['O que a EJUP ensina?','Três pilares. Base jurídica: o núcleo técnico e doutrinário do Direito. Negócios & Inovação: como o Direito opera dentro de mercados, empresas e políticas públicas. Power Skills: negociação, mediação, posicionamento profissional e construção de relacionamento.'],
 ['Como a EJUP é diferente de outros cursos jurídicos?','A oferta comum é organizada por velocidade: conteúdo curto, promessa de resultado rápido, técnica descolada de contexto. A EJUP parte do oposto: trata o tempo de estudo como valor e a profundidade como vantagem competitiva. Não substitui o ensino formal: é seu prolongamento qualificado.'],
 ['Quem ensina na EJUP?','As formações e a coluna são conduzidas por profissionais com notório saber em suas áreas — advogados, professores e especialistas com trajetória reconhecida no exercício e na produção intelectual do Direito.'],
 ['O que é o EJUPcast?','É o podcast institucional da EJUP: conversas longas com profissionais que construíram trajetória no Direito, nos negócios e nas instituições. Está disponível no YouTube e no Spotify. A EJUP é uma escola; o podcast é um de seus meios.'],
 ['Como faço para estudar na EJUP?','Cada formação apresenta conteúdo programático, carga horária e forma de ingresso. A inscrição é feita na própria página da formação, e as aulas ficam no Portal do Aluno.'],
 ['A EJUP emite certificado?','Sim. O certificado é emitido quando você finaliza a carga horária do curso.'],
 ['A EJUP oferece formações in-company?','Sim. Para escritórios, departamentos jurídicos e instituições públicas que desejam treinar suas equipes, oferecemos formações fechadas e personalizadas. Entre em contato para receber uma proposta.']
],
PROF:[
 {id:'leonardo-pivotto',nome:'Leonardo Pivotto',cargo:'Advogado e Consultor Ambiental',foto:'prof1',resumo:'Doutor e mestre em áreas relacionadas a meio ambiente, sustentabilidade e inovação. Assessora empresas e instituições em processos regulatórios e ambientais.',
  bio:'Leonardo Pivotto Nicodemo é advogado e consultor ambiental, doutor e mestre em áreas relacionadas a meio ambiente, sustentabilidade e inovação. Possui formação multidisciplinar em Direito, Meio Ambiente, Engenharia de Produção e Desenvolvimento Sustentável, com atuação voltada a temas de Direito Ambiental, licenciamento e auditoria ambiental.\n\nAtua na assessoria jurídica e técnica a empresas e instituições em processos regulatórios e ambientais, além de desenvolver projetos que integram gestão ambiental, sustentabilidade e inovação tecnológica aplicada.'},
 {id:'maria-helena-cortez',nome:'Maria Helena Cortez',cargo:'Advogada e Diretora Jurídica',foto:'mh',resumo:'Advogada especialista em Direito Ambiental, Urbanístico e Regulatório, com mais de 15 anos de experiência. Diretora da Assessoria Jurídica da SEMURB/Natal.',
  bio:'Maria Helena Bezerra Cortez de Freitas é advogada especialista em Direito Ambiental, Urbanístico e Regulatório, com mais de 15 anos de experiência na área. É Diretora da Assessoria Jurídica da Secretaria Municipal de Meio Ambiente e Urbanismo de Natal (SEMURB), atuando na condução de processos de licenciamento ambiental e na elaboração de normas ambientais e urbanísticas.\n\nSócia do escritório Cortez de Freitas Advocacia, é autora do livro Direito Ambiental (Editora ITB) e palestrante em eventos na área ambiental e urbanística.'}
],
SEO:{
 home:['EJUP · Educação Jurídica','Escola de educação jurídica continuada. Formações, Coluna Jurídica e EJUPcast para juristas que tratam o estudo como percurso.'],
 escola:['A escola','Alma clássica, repertório contemporâneo. Uma escola de educação jurídica continuada que trata a profundidade como diferencial.'],
 formacoes:['Formações','Formações jurídicas conduzidas por quem exerce o Direito que ensina: da fundamentação clássica à aplicação contemporânea.'],
 professores:['Professores','Advogados, professores e especialistas com notório saber e trajetória reconhecida no exercício e na produção intelectual do Direito.'],
 ejupcast:['EJUPcast','O podcast da EJUP: conversas longas com profissionais que construíram trajetória no Direito, nos negócios e nas instituições.'],
 coluna:['Coluna Jurídica','Ensaios, comentários e análises de quem pensa o Direito com profundidade e escreve para ser entendido.'],
 incompany:['In company','Formações jurídicas fechadas e personalizadas para escritórios, departamentos jurídicos e instituições públicas.'],
 privacidade:['Política de Privacidade','Como a EJUP trata os dados que você informa no site e no Portal do Aluno.'],
 termos:['Termos de Uso','As regras para usar o site, a conta e o Portal do Aluno da EJUP.'],
 minerva:['Minerva','A assistente da EJUP para tirar dúvidas sobre a escola, as formações e o modo como pensamos o Direito.']
}
};
