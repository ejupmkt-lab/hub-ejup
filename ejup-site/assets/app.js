import PADRAO from '/assets/padrao.js';
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOVER=matchMedia('(hover:hover)').matches;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
document.documentElement.classList.add('js');

/* ---------- ícones e peças ---------- */
const I={
 ar:'<path d="M5 11l6-6M6 5h5v5"/>',
 play:'<path d="M5.5 3.5v9l7-4.5z" fill="currentColor" stroke="none"/>',
 plus:'<path d="M8 3v10M3 8h10"/>',
 check:'<path d="M3 8.5l3 3 7-7"/>',
 x:'<path d="M4 4l8 8M12 4l-8 8"/>',
 search:'<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/>',
 mic:'<rect x="6" y="2" width="4" height="7.5" rx="2"/><path d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2"/>',
 book:'<path d="M8 4c-1.5-1-3.5-1-5.5-.5v9c2-.5 4-.5 5.5.5 1.5-1 3.5-1 5.5-.5v-9c-2-.5-4-.5-5.5.5zM8 4v9"/>',
 mail:'<rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2.5 4.5 8 9l5.5-4.5"/>',
 clock:'<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/>',
 layers:'<path d="M8 2.5 2.5 5.5 8 8.5l5.5-3zM2.5 8.5 8 11.5l5.5-3"/>',
 screen:'<rect x="2" y="3" width="12" height="8" rx="1"/><path d="M6 13.5h4"/>',
 award:'<circle cx="8" cy="6.5" r="3.5"/><path d="M6 9.5 5 14l3-1.5 3 1.5-1-4.5"/>',
 share:'<circle cx="4" cy="8" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="12" cy="12" r="1.5"/><path d="M5.4 7.3l5.2-2.6M5.4 8.7l5.2 2.6"/>',
 link:'<path d="M7 9a2.5 2.5 0 0 0 3.5 0l2-2A2.5 2.5 0 0 0 9 3.5l-.7.7M9 7a2.5 2.5 0 0 0-3.5 0l-2 2A2.5 2.5 0 0 0 7 12.5l.7-.7"/>',
 eye:'<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
 pin:'<path d="M8 14s4.5-4 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 10 8 14 8 14z"/><circle cx="8" cy="6.5" r="1.5"/>',
 menu:'<path d="M2.5 6h11M2.5 10h11"/>',
 home:'<path d="M2.5 7.5 8 3l5.5 4.5v6h-11z"/><path d="M6.5 13.5v-4h3v4"/>',
 cal:'<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5"/>',
 chat:'<path d="M3.5 3.5h9a1 1 0 0 1 1 1V10a1 1 0 0 1-1 1h-5l-3 2.5V11h-1a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/>',
 crown:'<path d="M2.5 12.5h11M3 10l-.8-5 3.3 2.5L8 3.5l2.5 4L13.8 5 13 10z"/>',
 lock:'<rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>',
 video:'<rect x="2" y="4" width="8.5" height="8" rx="1.5"/><path d="M10.5 7 14 5v6l-3.5-2"/>',
 bell:'<path d="M4 11V7.5a4 4 0 0 1 8 0V11l1.2 1.5H2.8zM6.8 14a1.2 1.2 0 0 0 2.4 0"/>',
 send:'<path d="M13.5 2.5 7 9M13.5 2.5l-4.2 11L7 9 2.5 6.7z"/>',
 file:'<path d="M4.5 2H9l3 3v9H4.5z"/><path d="M9 2v3h3"/>',
 user:'<circle cx="8" cy="5.5" r="2.8"/><path d="M2.8 13.5c.6-2.7 2.6-4 5.2-4s4.600 1.300 5.200 4"/>',
 pen:'<path d="M3 13l.8-3.200L10.500 3 13 5.500l-6.800 6.700z"/><path d="M9.500 4 12 6.500"/>',
 help:'<circle cx="8" cy="8" r="6"/><path d="M6.200 6.300a1.900 1.900 0 1 1 2.600 1.700c-.6.300-.8.700-.8 1.300M8 11.400v.2"/>',
 refresh:'<path d="M13 8a5 5 0 1 1-1.500-3.500M13 2.500V5h-2.500"/>',
 down:'<path d="M4 6.500l4 4 4-4"/>',
 minus:'<path d="M5 8h6"/>',
 back:'<path d="M9.5 4l-4 4 4 4"/>',
 fwd:'<path d="M6.5 4l4 4-4 4"/>',
 users:'<circle cx="6" cy="5.5" r="2.5"/><path d="M1.5 13.5c.4-2.500 2.200-3.800 4.500-3.800s4.100 1.300 4.500 3.800M10.500 3.300a2.500 2.500 0 0 1 0 4.500M12 9.900c1.400.5 2.200 1.700 2.500 3.400"/>',
 shield:'<path d="M8 2l5 1.8v3.7c0 3-2 5.3-5 6.5-3-1.2-5-3.5-5-6.5V3.800z"/><path d="M5.800 8l1.600 1.600 2.800-3.200"/>',
 pause:'<path d="M5.500 3.500v9M10.500 3.500v9"/>',
 spark:'<path d="M8 2.5l1.3 3.2L12.5 7 9.3 8.3 8 11.5 6.7 8.3 3.5 7l3.2-1.3zM12.5 10.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>'
};
const ic=(n,s=16)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const LOGO=`<svg viewBox="214.6 689.5 594.8 117.7" aria-hidden="true"><use href="#lg"/></svg>`;
const SYM=c=>`<svg class="${c}" viewBox="214.6 689.5 116.9 116.9" aria-hidden="true"><use href="#sym"/></svg>`;
const em=t=>`<em class="s">${t}</em>`;
const CAST=(cls='')=>`<button type="button" class="cast ${cls}" data-modal="ep${(E[0]||{}).n}" aria-label="EJUPcast: assistir ao último episódio"><svg class="cast-r" viewBox="-100 -100 200 200" aria-hidden="true"><circle class="rg" r="98" pathLength="1"/><g class="cast-o"><circle cx="98" cy="0" r="2.8"/><circle cx="-98" cy="0" r="2.8"/></g></svg><svg class="cast-l" viewBox="180 200 314 86" aria-hidden="true"><use href="#cast"/></svg></button>`;
const tag=(l,v='')=>`<span class="tag ${v}">${l}</span>`;
const btn=(l,v='gold',o={})=>{
 const c=`btn b-${v}${o.s?' s':''}${o.full?' full':''}`;
 const inner=`<span>${l}</span>${o.icon===false?'':ic(o.icon||'ar',o.s?14:16)}`;
 return o.go?`<a href="#${o.go}" class="${c}"${o.attr?' '+o.attr:''}>${inner}</a>`:`<button type="${o.type||'button'}" class="${c}"${o.toast?` data-toast="${o.toast}"`:''}${o.attr?' '+o.attr:''}>${inner}</button>`;
};
const pt=(r,a)=>[(r*Math.cos(a*Math.PI/180)).toFixed(1),(r*Math.sin(a*Math.PI/180)).toFixed(1)];
const orb=(cls,o={})=>{
 const a0=o.a0??-74,a1=o.a1??-40,[x0,y0]=pt(480,a0),[x1,y1]=pt(480,a1),[dx,dy]=pt(340,o.d??160);
 const N=16,STEP=3,seg=k=>{const [ax,ay]=pt(480,-k*STEP),[bx,by]=pt(480,-(k+1)*STEP-.4);return `<path class="tail" style="opacity:${Math.pow(1-k/N,1.6).toFixed(3)}" d="M${ax} ${ay}A480 480 0 0 0 ${bx} ${by}"/>`};
 const arc=o.arc===false?'':`<g class="comet" style="--a:${a1}deg">${Array.from({length:N},(_,k)=>seg(k)).join('')}<circle class="node" cx="480" cy="0" r="5"/></g>`;
 return `<svg class="orb ${cls}" viewBox="-500 -500 1000 1000" aria-hidden="true"${o.par?` data-par="${o.par}"`:''}><circle r="480"/>${arc}<g class="spin"><circle r="340"/><circle class="dot" cx="${dx}" cy="${dy}" r="4"/></g></svg>`;
};
/* ações que levam para fora: o endereço vem de LINKS; botão sem endereço não aparece */
const T={yt:'@youtube',sp:'@spotify',wa:'@whatsapp',map:'@mapa',soc:'@instagram',leg:'@privacidade',more:'@youtube',mail:'@mail'};
let LINKS={...PADRAO.LINKS};
/* link de pagamento de cada formação; vazio = o botão abre o WhatsApp com a formação já citada */
const CHECKOUT={licenciamento:'',pareceres:'',equipes:''};
const waMsg=t=>LINKS.whatsapp+'?text='+encodeURIComponent(t);
/* imagem: nome de arquivo em img/ (curso1) ou endereço completo (/img/x.jpg, https://…) */
const src=(u,pad='ep18')=>/^(https?:|\/)/.test(u||'')?u:`img/${u||pad}.jpg`;
const paras=t=>String(t||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);

/* imagens embutidas na própria página, para não depender de arquivos externos */
const IMG=new Proxy({},{get:(o,n)=>`/img/${String(n)}.jpg`});
const VID={logo:'/vid/cast-logo.mp4',sub:'/vid/cast-subscribe.mp4',est:'/vid/estatuas.mp4'};
const withImg=h=>h.replace(/"img\/(\w+)\.jpg/g,'"/img/$1.jpg');
const hydrate=root=>$$('video[data-vid]',root).forEach(v=>{const auto=v.hasAttribute('autoplay');if(RM&&auto){v.removeAttribute('autoplay');v.addEventListener('loadedmetadata',()=>{v.currentTime=+(v.dataset.poster||0)},{once:true})}v.src=VID[v.dataset.vid];v.removeAttribute('data-vid');if(auto&&!RM)v.play().catch(()=>{})});

/* ---------- conteúdo ---------- */
const CATS=[['todos','Todos'],['direito','Direito'],['power','Power Skills'],['negocios','Negócios & Inovação']];
const copia=x=>JSON.parse(JSON.stringify(x));
let F=copia(PADRAO.F),E=copia(PADRAO.E),AR=copia(PADRAO.AR),FAQ=copia(PADRAO.FAQ),PROF=copia(PADRAO.PROF);
const FE=()=>F.find(f=>f.incompany)||F[F.length-1]||{f:[]};
const profOf=id=>PROF.find(p=>p.id===id);
const profF=p=>F.filter(f=>(f.profs||[]).some(x=>x.id===p.id));
/* versão dos Termos de Uso: muda junto com o texto; o aceite fica registrado na conta */
const TERMOS_VERSAO='2026-10-03',TERMOS_DATA='3 de outubro de 2026';
const NAV=[['escola','A escola'],['formacoes','Formações'],['professores','Professores'],['ejupcast','EJUPcast'],['coluna','Coluna Jurídica'],['incompany','In company']];

/* ---------- componentes ---------- */
const cardF=f=>`<article class="card cf glow" data-cat="${f.cat}" data-text="${f.t} ${f.lb}" data-r>
 <a href="#formacao.${f.id}" class="cover" aria-label="${f.t}"><img src="${src(f.img,'curso1')}" alt="${f.alt||''}" loading="lazy"></a>
 <div class="cf-b"><p class="lbl g">${f.lb}</p><h3 class="h3"><a href="#formacao.${f.id}">${f.t}</a></h3><p class="body">${f.d}</p><div class="tags">${f.f.map(x=>tag(x)).join('')}</div>
 <div class="cf-f">${btn('Saiba mais','glass',{go:'formacao.'+f.id,s:1,icon:false})}${btn('Adquirir agora','gold',{s:1,attr:`data-buy="${f.id}"`})}</div></div></article>`;
const cardE=e=>`<article class="ce" data-cat="${e.cat}" data-text="${e.t}" data-r>
 <button class="cover thumb" data-modal="ep${e.n}" aria-label="Assistir: ${e.t}"><img src="${src(e.img)}" alt="" loading="lazy"><span class="play">${ic('play',20)}</span></button>
 <div class="ce-b"><p class="lbl g">${e.m}</p><h3 class="h3">${e.t}</h3><p class="body">${e.d}</p></div></article>`;
const cardA=(a,hid)=>`<a href="#artigo.${a.id}" class="ca" data-cat="direito" data-text="${a.t} ${a.by}" data-r${hid?' hidden data-extra':''}>
 ${a.img?`<span class="cover"><img src="${src(a.img)}" alt="" loading="lazy"></span>`:''}
 <span class="ca-b"><span class="lbl g">Direito</span><span class="h3">${a.t}</span>${a.d?`<span class="body">${a.d}</span>`:''}${a.by?`<span class="sm">${a.by} · ${a.min} min de leitura</span>`:''}</span></a>`;
const filters=(k,ph,on='todos')=>`<div class="filters" data-filter="${k}" data-r><div class="chips" role="group" aria-label="Filtrar por pilar">${CATS.map(([v,l])=>`<button class="chip${v===on?' on':''}" data-cat="${v}" aria-pressed="${v===on}">${l}</button>`).join('')}</div><label class="field">${ic('search',18)}<input id="q-${k}" type="search" placeholder="${ph}" aria-label="${ph}" autocomplete="off"></label></div>`;
const empty=(k,t)=>`<div class="empty" id="empty-${k}" hidden><p class="h3">${t}</p><p class="body">Limpe a busca ou escolha outro pilar.</p></div>`;
const banner=(l,t,p,o={})=>`<div class="panel banner dark glow ${o.cls||''}" data-r>${o.orb===false?'':orb('orb-card',{a0:110,a1:150,d:20})}<div class="tx-row">${o.pre||''}<div class="tx"><p class="lbl g">${l}</p><h2 class="h2s">${t}</h2>${p?`<p class="lead">${p}</p>`:''}${o.tags?`<div class="tags">${o.tags.map(x=>tag(x)).join('')}</div>`:''}</div></div>${o.act||btn('Fale com um consultor','gold',{go:'incompany.proposta'})}</div>`;
const ORGS=['Escritórios','Departamentos jurídicos','Instituições públicas'];
const nform=(k,note)=>`<form class="nform" data-news novalidate><div class="nform-l"><label class="field"><input id="nl-${k}" type="email" placeholder="Seu melhor e-mail" aria-label="Seu melhor e-mail" autocomplete="email"></label>${btn('Assinar grátis','gold',{type:'submit'})}</div><p class="msg" aria-live="polite">${note?'Ao assinar, você concorda com nossa Política de Privacidade.':''}</p></form>`;
const newsBig=k=>`<div class="panel banner plain dark glow" data-r>${orb('orb-card',{a0:200,a1:235})}<div class="tx"><p class="lbl g">Newsletter semanal</p><h2 class="h2s">Conteúdo jurídico de qualidade, ${em('na sua caixa de entrada.')}</h2><p class="body">Artigos, reflexões e comentários exclusivos. Uma vez por semana.</p></div>${nform(k,true)}</div>`;
const steps=a=>`<div class="g4 hs drag">${a.map(([t,d],i)=>`<div class="card step" data-r><p class="num">0${i+1}</p><div><h3 class="h3">${t}</h3><p class="body">${d}</p></div></div>`).join('')}</div>`;
const chan=(l,t,s,a)=>`<${a.go?`a href="#${a.go}"`:`button data-toast="${a.toast}"`} class="card chan" data-r><span class="chan-h"><span class="lbl">${l}</span>${ic('ar',16)}</span><span><span class="h4" style="display:block">${t}</span><span class="sm">${s}</span></span></${a.go?'a':'button'}>`;
const footer=cta=>`<footer class="sec deep foot">${orb('orb-foot',{arc:false,par:.1})}<div class="wrap">
 ${cta?`<div class="cta"><div class="cta-t"><p class="lbl">Seu próximo capítulo</p><h2 class="d1" data-r>${em('Alma clássica.')}<br>Repertório contemporâneo.</h2></div><div class="cta-a" data-r><p class="body">Formações, análises e conversas para quem não aceita superficialidade como método.</p>${btn('Conhecer as formações','gold',{go:'formacoes'})}</div></div>`:''}
 <div class="g4">${chan('WhatsApp','(85) 99271-4050','Converse com a equipe',{toast:T.wa})}${chan('Endereço','R. da Saudade, 1028','Lagoa Nova, Natal/RN',{toast:T.map})}${chan('In company','Fale com um consultor','Formações fechadas para equipes',{go:'incompany.proposta'})}${chan('Redes','@ejup.oficial','YouTube · Instagram · Spotify',{toast:T.soc})}</div>
 <div class="foot-b"><div class="foot-s"><a href="#home" class="logo" aria-label="EJUP — início">${LOGO}</a><p class="h4">Formamos juristas com alma clássica e repertório contemporâneo.</p><p class="sm">EJUP — CNPJ 41.402.986/0001-03 · © 2026</p></div>
 <div class="foot-cols">
  <ul><li class="lbl">A escola</li><li><a href="#formacoes">Formações</a></li><li><a href="#professores">Professores</a></li><li><a href="#incompany">In company</a></li></ul>
  <ul><li class="lbl">Conteúdos</li><li><a href="#ejupcast">EJUPcast</a></li><li><a href="#coluna">Coluna Jurídica</a></li><li><a href="#coluna.newsletter">Newsletter</a></li></ul>
  <ul><li class="lbl">Legal</li><li><a href="#termos">Termos de Uso</a></li><li><a href="#privacidade">Política de Privacidade</a></li></ul>
 </div></div></div></footer>`;
const symAv=`<span class="sym">${SYM('')}</span>`;

/* ---------- páginas ---------- */
const PAGES={
home:()=>`
<section class="sec dark hero hero-home" data-hero><div class="mer"></div>${orb('orb-c',{a0:-66,a1:-34,d:186})}
 <div class="wrap hero-c">${tag('Educação jurídica continuada','gold')}
  <h1 class="d1"><span class="ln"><span>${em('Alma clássica,')}</span></span><span class="ln"><span>repertório contemporâneo.</span></span></h1>
  <p class="lead" data-r>Para quem não aceita superficialidade como método. Formações, análises e conversas para juristas que tratam o estudo como percurso.</p>
  <div class="acts" data-r>${btn('Conhecer as formações','gold',{go:'formacoes'})}${btn('Assistir o EJUPcast','glass',{go:'ejupcast'})}</div>
  <ul class="fronts" data-r><li><a href="#formacoes">Formações</a></li><li><a href="#coluna">Coluna Jurídica</a></li><li><a href="#ejupcast">EJUPcast</a></li><li><a href="#incompany">In company</a></li></ul>
 </div></section>
<section class="sec dark flush"><div class="wrap"><div class="media" data-scale>
 <video class="cov" data-vid="est" data-poster="26" autoplay muted loop playsinline aria-label="Abertura do EJUPcast: estátuas de mármore dos três sócios da EJUP"></video>
 <div class="media-ov"><p class="lbl g">Manifesto</p><h2 class="h2s">Vemos o Direito sob outra ótica.</h2><p class="body" style="color:var(--w82)">A prática contemporânea exige maturidade decisória, integração estratégica e responsabilidade intelectual.</p>
  </div>
 
</div></div></section>
<section class="sec dark"><div class="wrap stack">
 <div class="hd ctr"><p class="lbl">Como a EJUP ensina</p><h2 class="h2" data-r>Três pilares para ampliar alcance ${em('sem perder rigor.')}</h2><p class="lead" data-r>Técnica, estratégia e competências humanas — o que determina o alcance real de um jurista e raramente é ensinado na graduação.</p></div>
 <div class="g3 hs drag">${[
  ['p1','direito','Base jurídica','O núcleo técnico e doutrinário do Direito.',['Doutrina','Técnica','Legislação','Prática']],
  ['p2','negocios','Negócios & Inovação','Como o Direito opera dentro de mercados, empresas e políticas públicas.',['Mercados','Empresas','Políticas públicas']],
  ['p3','power','Power Skills','Negociação, mediação, posicionamento profissional e construção de relacionamento.',['Negociação','Mediação','Posicionamento','Relacionamento']]
 ].map(([c,f,t,d,tg],i)=>`<a href="#formacoes.${f}" class="pilar ${c}" data-r><span class="pilar-bg"></span>${SYM('ring')}<span class="pilar-n"><i></i>Pilar 0${i+1}</span><span class="pilar-c"><span class="ct">${t}</span><span class="body">${d}</span><span class="tags">${tg.map(x=>tag(x)).join('')}</span><span class="lk">Ver formações ${ic('ar',14)}</span></span></a>`).join('')}</div>
</div></section>
<section class="sec light"><div class="wrap stack">
 <div class="head"><div class="hd"><p class="lbl">Para quem é</p><h2 class="h2" data-r>Para quem trata o aprendizado ${em('como percurso.')}</h2></div><p class="body side" data-r>A EJUP é indicada a quem busca profundidade e visão estratégica. Não é indicada a quem procura atalho formativo, fórmula pronta ou promessa de resultado imediato.</p></div>
 <div class="rows">${[
  ['Advogados e juristas','Você já exerce e quer ampliar repertório.','Formações continuadas que aprofundam a técnica e conectam o Direito à estratégia do cliente, do escritório e do mercado.','Base jurídica','formacoes.direito'],
  ['Professores e pesquisadores','Você ensina e produz conhecimento.','Análises assinadas e debates de fundo que renovam o repertório de quem forma outros juristas.','Coluna Jurídica','coluna'],
  ['Profissionais da interface jurídica','Você atua onde o Direito encontra a operação.','Como o Direito opera dentro de mercados, empresas e políticas públicas — sem perder o rigor técnico.','Negócios & Inovação','formacoes.negocios'],
  ['Estudantes em fase final','Você está prestes a exercer a profissão.','Negociação, mediação, posicionamento e relacionamento: competências raramente ensinadas na graduação.','Power Skills','formacoes.power']
 ].map(([t,s,d,by,go],i)=>`<a class="row" href="#${go}" data-r><span class="sm">0${i+1}</span><span class="row-t"><span class="h3">${t}</span><span class="body">${s}</span></span><span class="body row-d">${d}</span><span class="row-go"><span class="lbl">Começa por</span><span class="h4">${by} ${ic('ar',14)}</span></span></a>`).join('')}</div>
 <div class="fecho ctr" data-r><p class="h3">Não substitui o ensino formal: é seu prolongamento qualificado.</p>${btn('Conhecer as formações','navy',{go:'formacoes'})}</div>
</div></section>
<section class="sec light tight"><div class="wrap"><div class="panel nums dark glow" data-r>
 <div class="nums-a"><p class="lbl">EJUP · em números</p><p class="big" data-count="18">18</p><p class="body" style="color:var(--w82)">episódios do EJUPcast publicados</p></div>
 <div class="nums-b"><p class="h3">Uma escola, não um curso.</p><p class="body">Formações, uma coluna de análise assinada por especialistas e um podcast institucional — três frentes da mesma escola.</p></div>
 <div class="nums-c"><div><p class="ct" data-count="3">3</p><p class="lbl">pilares de formação</p></div></div>
</div></div></section>
<section class="sec dark"><div class="wrap stack">
 <div class="head"><div class="hd"><p class="lbl">Formações</p><h2 class="h2" data-r>Profundidade técnica e aplicação prática, ${em('na medida ideal.')}</h2></div><div data-r>${btn('Ver todas as formações','line',{go:'formacoes'})}</div></div>
 <div class="g3 hs drag">${F.map(cardF).join('')}</div>
</div></section>
<section class="sec light"><div class="wrap stack">
 <div class="head"><div class="hd"><p class="lbl">Professores</p><h2 class="h2" data-r>Aprenda com quem ${em('percorreu o caminho.')}</h2></div><p class="body side" data-r>A curadoria é o principal critério da escola: quem ensina precisa ter percorrido o caminho que ensina.</p></div>
 <div class="profs" data-r>
  ${PROF.map((p,i)=>`<div class="prof dark pic${i?'':' on'}" tabindex="0" role="button" aria-label="${p.nome}"><img src="${src(p.foto)}" alt="Retrato de ${p.nome}" loading="lazy"><div class="prof-t"><p class="sm" style="color:var(--w82)">${String(i+1).padStart(2,'0')} / ${String(PROF.length).padStart(2,'0')}</p><p class="nm">${p.nome}</p><div class="prof-x"><div><p class="lbl g" style="padding-bottom:10px">${p.cargo}</p><p class="body" style="color:var(--w82)">${p.resumo}</p></div></div></div></div>`).join('')}
 </div>
</div></section>
<section class="sec light tight"><div class="wrap">${banner('Para organizações','Educação jurídica sob medida para o seu time.','Programas in company que alinham o repertório técnico da EJUP às prioridades estratégicas da sua empresa ou instituição.',{tags:ORGS})}</div></section>
<section class="sec dark"><div class="wrap stack">
 <div class="hd ctr"><p class="lbl">Conteúdos abertos</p><h2 class="h2" data-r>Formatos diferentes, ${em('a mesma profundidade.')}</h2></div>
 <div style="display:grid;gap:24px">
 <div class="open-row">
  <div class="oc img" data-r><img src="img/ep18.jpg" alt="Gravação do EJUPcast com três pessoas à mesa" loading="lazy"><div class="oc-top"><span class="icb">${ic('mic',22)}</span>${tag('Ep. 18 · 67 min')}</div>
   <div class="oc-c"><p class="lbl g">Áudio e vídeo</p><h3 class="ct"><a href="#ejupcast">EJUPcast</a></h3><p class="body" style="color:var(--w82)">Conversas longas com profissionais que construíram trajetória no Direito, nos negócios e nas instituições.</p><div class="acts">${btn('Assistir no YouTube','white',{s:1,toast:T.yt})}${btn('Ouvir no Spotify','glass',{s:1,toast:T.sp})}</div></div></div>
  <div class="card oc glow" data-r><div style="display:grid;gap:14px"><div class="oc-top"><span class="icb">${ic('book',22)}</span><span class="lbl">Leitura</span></div><h3 class="ct"><a href="#coluna">Coluna Jurídica</a></h3><p class="body">Ensaios, comentários e provocações de quem pensa o Direito com profundidade — e escreve para ser entendido.</p></div>
   <div class="alist">${AR.slice(0,3).map(a=>`<a href="#artigo.${a.id}"><span>${a.st||a.t}</span><span class="sm">${a.min} min</span>${ic('ar',14)}</a>`).join('')}</div></div>
 </div>
 <div class="card news glow" data-r><div class="news-t"><span class="icb">${ic('mail',22)}</span><div style="display:grid;gap:6px"><p class="lbl">Newsletter semanal</p><p class="h3">Conteúdo jurídico de qualidade, na sua caixa de entrada.</p><p class="sm">Artigos, reflexões e comentários exclusivos. Uma vez por semana.</p></div></div>${nform('home')}</div>
 </div>
 
</div></section>
<section class="sec light"><div class="wrap faq">
 <div class="faq-l"><p class="lbl">Antes de entrar</p><h2 class="h2" data-r>Respostas para suas dúvidas.</h2><p class="body" data-r>Reunimos aqui as perguntas que mais recebemos. Se a dúvida permanecer, entre em contato conosco.</p><div data-r>${btn('Falar com a equipe','lined',{toast:T.wa})}</div></div>
 <div data-r>${FAQ.map(([q,a],i)=>`<div class="faq-i${i?'':' on'}"><button class="faq-q" aria-expanded="${!i}"><span>${q}</span><span class="pm"></span></button><div class="faq-a"><div><p>${a}</p></div></div></div>`).join('')}</div>
</div></section>
${footer(true)}`,

formacoes:arg=>`
<section class="sec dark hero" data-hero>${orb('orb-r',{a0:-60,a1:-20,d:200})}<div class="wrap hero-c">${tag('Formações EJUP','gold')}
 <h1 class="d1 blur" data-r style="max-width:900px">O conhecimento jurídico que move ${em('decisões reais.')}</h1>
 <p class="lead" data-r>Da fundamentação clássica à aplicação contemporânea — formações pensadas para juristas que não se contentam com o superficial.</p></div></section>
<section class="sec dark flush"><div class="wrap" style="display:grid;gap:32px"><div class="rule">${filters('f','Buscar por nome ou área…',CATS.some(c=>c[0]===arg)?arg:'todos')}</div>
 <div class="g3 gridf" id="grid-f">${F.map(cardF).join('')}</div>${empty('f','Nenhuma formação encontrada.')}</div></section>
<section class="sec light"><div class="wrap stack">
 <div class="hd"><p class="lbl">Diferenciais</p><h2 class="h2" data-r>O que faz uma formação EJUP ${em('ser diferente.')}</h2></div>
 <div class="g3">${[['Conteúdo aplicável','Da teoria à prática profissional: cada módulo é construído para atravessar a sala de aula e chegar ao seu dia a dia.'],['Professores de referência','Você aprende com quem ensina o Direito e também o exerce — autores, magistrados e advogados de prestígio nacional.'],['Certificação que pesa','Um certificado EJUP no currículo é sinal de profundidade técnica reconhecida no mercado jurídico.']].map(([t,d],i)=>`<div class="card step" data-r><p class="num">0${i+1}</p><div><h3 class="h3">${t}</h3><p class="body">${d}</p></div></div>`).join('')}</div>
</div></section>
<section class="sec light tight"><div class="wrap">${banner('Para sua organização',`Educação jurídica feita ${em('sob medida')} para o seu time.`,'Programas personalizados, conduzidos por especialistas, para desenvolver competências jurídicas de impacto direto nos resultados do seu time.',{tags:ORGS})}</div></section>
${footer()}`,

formacao:id=>{const f=F.find(x=>x.id===id)||F[0],facts=f.fd&&f.fd.length?f.fd:f.f,profs=(f.profs||[]).map(x=>({...profOf(x.id),papel:x.papel})).filter(x=>x.nome),full=!!(f.sobre||(f.modulos||[]).length);
const icon=x=>/hora/i.test(x)?'clock':/m[oó]dulo/i.test(x)?'layers':/online|presencial|ao vivo/i.test(x)?'screen':/certificado/i.test(x)?'award':'check';
const nav=[f.sobre||(f.aprender||[]).length?['b-sobre','Visão geral']:null,(f.modulos||[]).length?['b-curr','Currículo']:null,profs.length?['b-inst','Instrutores']:null].filter(Boolean);
return `
<section class="sec dark hero"><div class="wrap det">
 <div class="det-m">
  <div class="det-h"><nav class="crumb" aria-label="Você está em"><a href="#formacoes">Formações</a><span>/</span><span class="cur">${f.lb}</span></nav>
   <h1 class="h2 blur" data-r>${f.t}</h1><p class="lead" style="max-width:620px">${f.d}</p><div class="tags">${facts.map(x=>tag(x)).join('')}</div>
   ${nav.length>1?`<div class="seg" data-spy><span class="seg-ind"></span>${nav.map(([a,l],i)=>`<button${i?'':' class="on"'} data-anchor="${a}">${l}</button>`).join('')}</div>`:''}</div>
  ${f.sobre?`<div class="card blk" id="b-sobre" data-r><h2 class="h3">Sobre o curso</h2>${paras(f.sobre).map(x=>`<p class="body">${x}</p>`).join('')}</div>`:''}
  ${(f.aprender||[]).length?`<div class="card blk"${f.sobre?'':' id="b-sobre"'} data-r><h2 class="h3">O que você vai aprender</h2><ul class="checks">${f.aprender.map(x=>`<li>${ic('check',18)}<span>${x}</span></li>`).join('')}</ul></div>`:''}
  ${(f.modulos||[]).length?`<div class="card blk" id="b-curr" data-r><div class="blk-h"><h2 class="h3">Estrutura do curso</h2><p class="sm">${facts.filter(x=>/hora|m[oó]dulo/i.test(x)).join(' · ')}</p></div><div>${f.modulos.map((m,i)=>`<div class="mod"><button class="mod-q" aria-expanded="false"><span class="lbl g">Módulo ${String(i+1).padStart(2,'0')}</span><span class="h4">${m.t}</span><span class="pm"></span></button><div class="faq-a"><div>${m.d?paras(m.d).map(x=>`<p class="sm" style="padding-bottom:12px">${x}</p>`).join('')+'<div style="height:10px"></div>':'<p class="sm" style="padding-bottom:22px">As aulas de cada módulo estão no programa completo, enviado pela equipe da EJUP.</p>'}</div></div></div>`).join('')}</div></div>`:''}
  ${full&&profs.length?`<div class="card blk" id="b-inst" data-r><h2 class="h3">Quem ensina</h2>${profs.map(p=>`<div class="inst"><span class="av"><img src="${src(p.foto)}" alt="Retrato de ${p.nome}" loading="lazy"></span><div><p class="h4">${p.nome}</p><p class="lbl g">${p.cargo}${p.papel?' · '+p.papel:''}</p><p class="body">${p.resumo}</p></div></div>`).join('')}</div>`:''}
  ${full?'':`<div class="card blk" data-r><h2 class="h3">Programa da formação</h2><p class="body">O conteúdo programático, a carga horária e os valores desta formação são enviados pela equipe da EJUP.</p><div class="acts">${btn('Receber o programa','glass',{s:1,toast:T.wa})}</div></div>`}
 </div>
 <aside class="card buy glow" data-r><span class="cover"><img src="${src(f.img)}" alt="${f.alt||''}"></span>
  <div class="buy-b">${f.preco?`<div class="price">${f.preco_de?`<s class="body">${f.preco_de}</s>`:''}<p class="ct">${f.preco}</p>${f.parcelas?`<p class="sm">${f.parcelas}</p>`:''}</div>`:''}${btn('Adquirir agora','gold',{full:1,attr:`data-buy="${f.id}"`})}
   <ul class="incl">${((f.incl||[]).length?f.incl:facts).map(x=>`<li>${ic(icon(x),18)}<span>${x}</span></li>`).join('')}</ul>
   <button class="sharel" data-copy>${ic('share',16)}<span>Compartilhar este curso</span></button></div></aside>
</div></section>
<section class="sec dark flush"><div class="wrap stack"><div class="rule" style="padding-top:clamp(40px,5vw,64px)"><div class="head"><div class="hd"><p class="lbl">Continue aprendendo</p><h2 class="h2s" data-r>Outras formações ${em('da escola.')}</h2></div><div data-r>${btn('Ver todas as formações','line',{go:'formacoes'})}</div></div></div>
 <div class="g3 hs drag">${F.filter(x=>x.id!==f.id).map(cardF).join('')}<a href="#incompany" class="pilar p1" data-r><span class="pilar-bg"></span><span class="pilar-c"><span class="lbl g">In company</span><span class="ct">Soluções corporativas EJUP</span><span class="body">Programas personalizados, conduzidos por especialistas, para desenvolver competências jurídicas de impacto direto nos resultados do seu time.</span></span><span class="btn b-gold" style="align-self:flex-start"><span>Fale com um consultor</span>${ic('ar')}</span></a></div>
</div></section>
${footer()}`},

ejupcast:()=>`
<section class="sec dark hero hero-cast" data-hero>${orb('orb-l',{arc:false})}<div class="wrap hero-2">
 <div class="hero-c">${CAST()}<p class="lbl g">O podcast da EJUP</p><h1 class="d1 blur" data-r>Conversas que ampliam ${em('seu repertório.')}</h1>
  <p class="lead" data-r>Diálogos com vozes que pensam o Direito, a liderança e a inovação com profundidade — para ouvir entre uma audiência e outra, ou no trânsito da próxima decisão importante.</p>
  <div class="acts" data-r>${btn('Assistir no YouTube','gold',{toast:T.yt})}${btn('Ouvir no Spotify','glass',{toast:T.sp})}</div></div>
 ${E[0]?`<button class="oc img" data-modal="ep${E[0].n}" data-r style="min-height:clamp(380px,34vw,460px);text-align:left"><img src="${src(E[0].img)}" alt="Gravação do episódio ${E[0].n} do EJUPcast"><span class="tags">${tag('Último episódio')}${tag(E[0].m)}</span>
  <span style="display:flex;gap:20px;align-items:flex-end;justify-content:space-between;width:100%"><span style="display:grid;gap:10px"><span class="h3">${E[0].t}</span><span class="body" style="color:var(--w82)">${E[0].d}</span></span><span class="play" style="width:44px;height:44px;flex:none">${ic('play',18)}</span></span></button>`:''}
</div></section>
<section class="sec dark flush"><div class="wrap" style="display:grid;gap:40px">
 <div class="hd"><p class="lbl">Últimos episódios</p><h2 class="h2" data-r>Conversas que continuam ${em('depois do play.')}</h2></div>
 <div class="rule">${filters('e','Buscar por título ou tema…')}</div>
 <div class="g3 gridf" id="grid-e">${E.map(cardE).join('')}</div>${empty('e','Nenhum episódio encontrado.')}
 <div class="ctr" data-r>${btn('Carregar mais episódios','line',{icon:false,toast:T.more})}</div>
</div></section>
<section class="sec dark flush"><div class="wrap">${banner('Onde ouvir','Disponível no YouTube e no Spotify.','A porta de entrada pública da escola: conversas longas com profissionais que construíram trajetória no Direito, nos negócios e nas instituições.',{cls:'gold',orb:false,pre:CAST('sm'),act:`<div class="acts">${btn('Assistir no YouTube','white',{toast:T.yt})}${btn('Ouvir no Spotify','glass',{toast:T.sp})}</div>`})}</div></section>
${footer()}`,

coluna:()=>`
<section class="sec light hero" data-hero>${orb('orb-l',{arc:false})}<div class="wrap hero-2">
 <div class="hero-c">${tag('Coluna EJUP')}<h1 class="d1 blur" data-r>Análises que constroem ${em('pensamento jurídico.')}</h1>
  <p class="lead" data-r>Ensaios, comentários e provocações de quem pensa o Direito com profundidade — e escreve para ser entendido.</p></div>
 ${AR[0]?`<article class="card cf" data-r>${AR[0].img?`<a href="#artigo.${AR[0].id}" class="cover" aria-label="${AR[0].t}"><img src="${src(AR[0].img)}" alt="Capa do artigo ${AR[0].t}"></a>`:''}
  <div class="cf-b"><div style="display:flex;gap:12px;align-items:center">${tag('Último artigo')}<span class="lbl g">Direito</span></div><h2 class="h3"><a href="#artigo.${AR[0].id}">${AR[0].t}</a></h2>${AR[0].d?`<p class="body">${AR[0].d}</p>`:''}
  <div class="cf-f"><span class="sm">${AR[0].by||'Equipe EJUP'}${AR[0].min?` · ${AR[0].min} min de leitura`:''}</span>${btn('Ler artigo','navy',{s:1,go:'artigo.'+AR[0].id})}</div></div></article>`:''}
</div></section>
<section class="sec light flush"><div class="wrap stack">
 <div class="rule" style="padding-bottom:24px;border-bottom:1px solid var(--line)">${filters('a','Buscar por título, autor ou tema…')}</div>
 <div class="head"><div class="hd"><p class="lbl">Recém-publicados</p><h2 class="h2" data-r>Leituras para ${em('acompanhar agora.')}</h2></div><div data-r>${btn('Ver todas as publicações','lined',{attr:'data-more'})}</div></div>
 <div class="g3 gridf" id="grid-a">${AR.map((a,i)=>cardA(a,i>2)).join('')}</div>${empty('a','Nenhuma publicação encontrada.')}
</div></section>
<section class="sec light tight" id="newsletter"><div class="wrap">${newsBig('coluna')}</div></section>
${footer()}`,

artigo:id=>{const a=AR.find(x=>x.id===id)||AR[0],blocks=paras(a.corpo),toc=blocks.filter(b=>b.startsWith('## ')).map(b=>b.slice(3));let h=0;
return `<div class="prog" id="prog"></div>
<section class="sec light" style="padding-top:0"><div class="wrap stack">
 <header class="art-h"><nav class="crumb" aria-label="Você está em"><a href="#coluna">Coluna Jurídica</a><span>/</span><span class="cur">Direito</span></nav>
  <h1 class="d1 blur" data-r>${a.t}</h1>${a.d?`<p class="lead">${a.d}</p>`:''}
  <div class="meta"><div class="meta-a">${symAv}<div><p class="h4">${a.by||'Equipe EJUP'}</p><p class="sm">Educação Jurídica</p></div>${a.date?`<p class="sm">${a.date}${a.min?` · ${a.min} min de leitura`:''}</p>`:a.min?`<p class="sm">${a.min} min de leitura</p>`:''}</div>
   <div class="shr"><span class="sm">Compartilhar</span><button data-copy aria-label="Copiar link">${ic('link',18)}</button><button data-toast="${T.mail}" aria-label="Enviar por e-mail">${ic('mail',18)}</button><button data-copy aria-label="Compartilhar">${ic('share',18)}</button></div></div></header>
 ${blocks.length?`<div class="art">
  <div class="art-t">
   ${blocks.map(b=>b.startsWith('## ')?`<h2 class="h3" id="t-${h++}">${b.slice(3)}</h2>`:`<p>${b}</p>`).join('\n   ')}
   <div class="card by">${symAv}<div><p class="lbl g">Escrito por</p><p class="h3">${a.by||'Equipe EJUP'}</p><p class="body">Educação Jurídica</p></div></div>
  </div>
  <aside class="art-s">${a.imgv||a.img?`<img src="${src(a.imgv||a.img)}" alt="Capa do artigo ${a.t}" loading="lazy">`:''}
   ${toc.length?`<nav class="card toc" aria-label="Neste artigo"><p class="lbl">Neste artigo</p><ul data-spy>${toc.map((t,i)=>`<li><a role="button" tabindex="0" data-anchor="t-${i}"${i?'':' class="on"'}>${t}</a></li>`).join('')}</ul></nav>`:''}</aside>
 </div>`:`<p class="body" data-r style="max-width:720px">O texto completo desta análise será publicado em breve na Coluna Jurídica. Para recebê-lo, assine a newsletter.</p>`}
 <div class="rule" style="padding-top:clamp(40px,5vw,64px)"><div class="head"><div class="hd"><p class="lbl">Coluna Jurídica</p><h2 class="h2s" data-r>Leituras ${em('relacionadas.')}</h2></div><div data-r>${btn('Ver todas as publicações','lined',{go:'coluna'})}</div></div></div>
 <div class="g3">${AR.filter(x=>x.id!==a.id).slice(0,3).map(x=>cardA(x)).join('')}</div>
</div></section>
<section class="sec light tight"><div class="wrap">${newsBig('artigo')}</div></section>
${footer()}`},

escola:()=>`
<section class="sec dark hero" data-hero>${orb('orb-r',{a0:-60,a1:-20,d:60})}<div class="wrap hero-c">${tag('A escola','gold')}
 <h1 class="d1 blur" data-r style="max-width:1100px">Formamos juristas com ${em('alma clássica')} e repertório contemporâneo.</h1>
 <p class="lead" data-r>A EJUP é uma escola de educação jurídica continuada, que oferece formações, uma coluna de análise assinada por especialistas e o EJUPcast, seu podcast institucional.</p></div></section>
<section class="sec dark flush"><div class="wrap stack"><div class="media cap" data-scale><video class="cov" data-vid="est" data-poster="26" autoplay muted loop playsinline aria-label="Abertura do EJUPcast: estátuas de mármore dos três sócios da EJUP"></video><div class="media-cap"><div style="display:grid;gap:8px"><p class="lbl g">Quem está por trás</p><h2 class="h2s">Os sócios da EJUP</h2></div><p class="body" style="color:var(--w82)">Leonardo Pivotto · Rossana Fonseca · Roberto Pivotto</p></div></div>
 <div class="g3 hs drag">${[['prof1','Leonardo Pivotto','Sócio','Retrato de Leonardo Pivotto'],['rossana','Rossana Fonseca','Sócia','Retrato de Rossana Fonseca no estúdio do EJUPcast'],['roberto','Roberto Pivotto','Sócio','Retrato de Roberto Pivotto']].map(([img,n,r,alt])=>`<div class="card socio" data-r><span class="sph"><img src="img/${img}.jpg" alt="${alt}" loading="lazy"></span><div><p class="lbl g">${r} da EJUP</p><h3 class="h3">${n}</h3></div></div>`).join('')}</div>
</div></section>
<section class="sec light"><div class="wrap stack">
 <div class="hd"><p class="lbl">O ponto de partida</p><h2 class="h2" data-r>A EJUP parte ${em('do oposto.')}</h2></div>
 <div class="g2"><div class="card cmp" data-r><p class="lbl">A oferta comum</p><div><h3 class="ct" style="color:var(--n64)">Organizada por velocidade.</h3><p class="lead">Conteúdo curto, promessa de resultado rápido, técnica descolada de contexto.</p></div></div>
  <div class="card cmp dark solid glow" data-r>${orb('orb-sm',{a0:20,a1:55})}<p class="lbl g">A EJUP</p><div><h3 class="ct">Organizada por ${em('profundidade.')}</h3><p class="lead">Trata o tempo de estudo como valor e a profundidade como vantagem competitiva.</p></div></div></div>
 <p class="h3" data-r style="max-width:820px">Não substitui o ensino formal: é seu prolongamento qualificado, voltado a quem já tem base e quer ampliar alcance sem perder rigor.</p>
</div></section>
<section class="sec dark"><div class="wrap stack">
 <div class="hd"><p class="lbl">Com clareza</p><h2 class="h2" data-r>O que a EJUP é — e ${em('o que não é.')}</h2></div>
 <div class="g2" style="align-items:start"><div class="card yn y glow" data-r><h3 class="ct">É</h3><ul>${['Formação continuada para quem já exerce ou está prestes a exercer sua profissão.','Uma escola com três frentes: formações, coluna de análise e podcast.','Indicada a quem busca profundidade e visão estratégica.'].map(x=>`<li>${ic('check',20)}<span>${x}</span></li>`).join('')}</ul></div>
  <div class="card yn n" data-r><h3 class="ct">Não é</h3><ul>${['Curso preparatório para concursos ou para o exame da OAB.','Substituta do ensino formal.','Atalho formativo, fórmula pronta ou promessa de resultado imediato.'].map(x=>`<li>${ic('x',20)}<span>${x}</span></li>`).join('')}</ul></div></div>
 <div class="hd" style="padding-top:clamp(24px,4vw,56px)"><p class="lbl">Uma escola, três frentes</p><h2 class="h2" data-r>A EJUP é uma escola; o podcast é ${em('um de seus meios.')}</h2></div>
 <div class="g3 hs drag">${[['formacoes','curso1','Formações','Conteúdo programático, carga horária e certificado. O centro da escola.','Ver formações'],['coluna','art1','Coluna Jurídica','Análises assinadas por especialistas, para ler com calma.','Ler a coluna'],['ejupcast','ep18','EJUPcast','Conversas longas com quem construiu trajetória. A porta de entrada pública da escola.','Ouvir o podcast']].map(([go,img,t,d,l])=>`<a href="#${go}" class="card frente" data-r><span class="cover"><img src="img/${img}.jpg" alt="" loading="lazy"></span><div><span class="ct">${t}</span><span class="body">${d}</span><span class="lk">${l} ${ic('ar',14)}</span></div></a>`).join('')}</div>
</div></section>
<section class="sec light"><div class="wrap stack">
 <div class="hd"><p class="lbl">Como estudar na EJUP</p><h2 class="h2" data-r>Da matrícula ${em('ao certificado.')}</h2></div>
 ${steps([['Escolha a formação','Cada formação apresenta conteúdo programático, carga horária e forma de ingresso.'],['Faça a matrícula','A inscrição é feita na própria página da formação.'],['Estude no Portal do Aluno','Ambiente digital com as aulas e o material de cada formação.'],['Receba o certificado','Emitido quando você finaliza a carga horária do curso.']])}
</div></section>
<section class="sec light tight"><div class="wrap"><div class="where dark" data-r>
 <div class="where-t"><p class="lbl g">Onde estamos</p><h2 class="h2s">Natal, ${em('Rio Grande do Norte.')}</h2><p class="lead">R. da Saudade, 1028 — Lagoa Nova, Natal/RN<br>(85) 99271-4050</p><div class="acts">${btn('Ver no mapa','gold',{toast:T.map})}${btn('Falar no WhatsApp','glass',{toast:T.wa})}</div></div>
 <button class="map" data-toast="${T.map}" aria-label="Abrir mapa">${orb('orb-card',{arc:false})}${ic('pin',36)}<span class="sm">Mapa interativo</span></button></div></div></section>
${footer()}`,

professores:()=>`
<section class="sec light hero" data-hero>${orb('orb-r',{a0:-60,a1:-20,d:60})}<div class="wrap hero-c">${tag('Professores')}
 <h1 class="d1 blur" data-r>Aprenda com quem<br>${em('percorreu o caminho.')}</h1>
 <p class="lead" data-r>As formações e a coluna são conduzidas por profissionais com notório saber em suas áreas — advogados, professores e especialistas com trajetória reconhecida no exercício e na produção intelectual do Direito.</p></div></section>
<section class="sec light flush"><div class="wrap" style="display:grid;gap:40px"><div class="rule" style="padding-top:40px"><div class="head" style="align-items:center"><p class="lbl">Critérios de curadoria</p><p class="h3" data-r style="flex:0 1 640px">A curadoria é o principal critério da escola.</p></div></div>
 <div class="g3">${[['Notório saber','Profissionais reconhecidos em suas áreas de atuação.'],['Trajetória no exercício','Advogados, professores e especialistas que exercem o Direito que ensinam.'],['Produção intelectual','Quem ensina também pesquisa, escreve e publica.']].map(([t,d],i)=>`<div class="card step" data-r><p class="num">0${i+1}</p><div><h3 class="h3">${t}</h3><p class="body">${d}</p></div></div>`).join('')}</div>
</div></section>
<section class="sec light flush"><div class="wrap stack">
 <div class="hd"><p class="lbl">Corpo docente</p><h2 class="h2" data-r>Quem ensina ${em('na EJUP.')}</h2></div>
 <div style="display:grid;gap:24px">
  ${PROF.map(p=>{const fs=profF(p),col=AR.some(a=>a.by===p.nome);return `<article class="card pcard" data-r><div class="pt"><img src="${src(p.foto)}" alt="Retrato de ${p.nome}" loading="lazy"></div><div class="tx"><div style="display:grid;gap:10px"><p class="lbl g">${p.cargo}</p><h3 class="h2s">${p.nome}</h3></div>
   ${paras(p.bio||p.resumo).map(x=>`<p class="body">${x}</p>`).join('')}
   ${fs.length||col?`<div class="na"><p class="lbl">Na EJUP</p><div class="tags">${fs.map(f=>`<a class="tag" href="#formacao.${f.id}">${f.t}</a>`).join('')}${col?'<a class="tag" href="#coluna">Coluna Jurídica</a>':''}</div></div>`:''}</div></article>`}).join('')}
 </div>
</div></section>
<section class="sec dark">${orb('orb-b',{arc:false})}<div class="wrap quote"><p class="lbl">Critério de curadoria</p><h2 class="h2" data-r>Quem ensina precisa ter percorrido ${em('o caminho que ensina.')}</h2><div class="acts" data-r style="justify-content:center">${btn('Conhecer as formações','gold',{go:'formacoes'})}${btn('Ler a Coluna Jurídica','glass',{go:'coluna'})}</div></div></section>
${footer()}`,

incompany:()=>`
<section class="sec dark hero" data-hero>${orb('orb-l',{arc:false})}<div class="wrap hero-2 wide">
 <div class="hero-c">${tag('In company · para organizações','gold')}<h1 class="d1 blur" data-r>Educação jurídica ${em('sob medida')} para o seu time.</h1>
  <p class="lead" data-r>Programas in company que alinham o repertório técnico da EJUP às prioridades estratégicas da sua empresa ou instituição.</p>
  <div class="acts" data-r>${btn('Solicitar proposta','gold',{attr:'data-anchor="proposta"'})}${btn('Falar no WhatsApp','glass',{toast:T.wa})}</div></div>
 <div class="card sumc glow" data-r><p class="lbl g">Soluções corporativas EJUP</p><h2 class="h3">Formações fechadas e personalizadas.</h2><ul>${['Programas personalizados para o contexto do time','Conduzidos por especialistas','Foco em competências de impacto direto nos resultados','Certificado para quem conclui a carga horária'].map(x=>`<li>${ic('check',18)}<span>${x}</span></li>`).join('')}</ul></div>
</div></section>
<section class="sec dark flush"><div class="wrap stack"><div class="rule" style="padding-top:clamp(40px,5vw,64px)"><div class="hd"><p class="lbl">Para quem</p><h2 class="h2" data-r>Para organizações que querem treinar ${em('suas equipes.')}</h2></div></div>
 <div class="g3 hs drag">${[['p1','Escritórios','Atualização técnica da equipe nos temas que impactam os clientes do escritório.'],['p2','Departamentos jurídicos','Repertório jurídico alinhado às prioridades estratégicas da empresa.'],['p3','Instituições públicas','Capacitação de equipes em novos marcos legais e procedimentos.']].map(([c,t,d],i)=>`<div class="pilar pub ${c}" data-r><span class="pilar-bg"></span><span class="pilar-n"><i></i>0${i+1}</span><span class="pilar-c"><span class="ct">${t}</span><span class="body">${d}</span></span></div>`).join('')}</div>
</div></section>
<section class="sec light"><div class="wrap stack">
 <div class="hd"><p class="lbl">Como funciona</p><h2 class="h2" data-r>Da primeira conversa ${em('ao certificado.')}</h2></div>
 ${steps([['Conversa inicial','Entendemos o contexto, o time e as prioridades da organização.'],['Proposta personalizada','Programa, carga horária e formato definidos para o seu caso.'],['Formação','Conduzida por especialistas, com foco em aplicação prática.'],['Certificação','Certificado EJUP para quem conclui a carga horária.']])}
 <div class="rule" style="padding-top:40px;margin-top:clamp(8px,2vw,32px)"><div class="head" style="align-items:center"><p class="lbl">Já em catálogo</p><p class="h3" data-r style="flex:0 1 640px">Uma formação corporativa pronta para levar ao seu time.</p></div></div>
 <div class="corp dark" data-r><a href="#formacao.${FE().id}" class="cover" aria-label="${FE().t}"><img src="${src(FE().img)}" alt="${FE().alt||''}" loading="lazy"></a>
  <div class="corp-b"><p class="lbl g">${FE().lb}</p><h3 class="h2s">${FE().t}</h3><p class="body">${FE().d}</p><div class="tags">${FE().f.map(x=>tag(x)).join('')}</div><div class="acts" style="padding-top:8px">${btn('Solicitar esta formação','gold',{attr:'data-anchor="proposta" data-tema="Marco Legal do Licenciamento Ambiental para equipes"'})}${btn('Ver detalhes','glass',{go:'formacao.equipes'})}</div></div></div>
</div></section>
<section class="sec dark" id="proposta" style="scroll-margin-top:0"><div class="wrap prop">
 <div class="prop-t"><p class="lbl">Receba uma proposta</p><h2 class="h2" data-r>Fale com ${em('um consultor.')}</h2><p class="lead" data-r>Para escritórios, departamentos jurídicos e instituições públicas que desejam treinar suas equipes, oferecemos formações fechadas e personalizadas. Entre em contato para receber uma proposta.</p>
  <div class="cl" data-r><button data-toast="${T.wa}"><span class="lbl">WhatsApp</span><span class="h4">(85) 99271-4050 ${ic('ar',14)}</span></button><button data-toast="${T.map}"><span class="lbl">Endereço</span><span class="h4">R. da Saudade, 1028 — Lagoa Nova, Natal/RN ${ic('ar',14)}</span></button></div></div>
 <form class="card form glow" id="ic-form" novalidate data-r>
  <div class="fr"><label class="fl"><span>Nome</span><input class="inp" id="ic-nome" placeholder="Seu nome completo" autocomplete="name" required></label><label class="fl"><span>E-mail corporativo</span><input class="inp" id="ic-email" type="email" placeholder="nome@organizacao.com.br" autocomplete="email" required></label></div>
  <div class="fr"><label class="fl"><span>Organização</span><input class="inp" id="ic-org" placeholder="Escritório, empresa ou órgão" autocomplete="organization" required></label><label class="fl"><span>Tamanho da equipe</span><select class="inp" id="ic-size"><option value="">Selecione</option><option>Até 10 pessoas</option><option>11 a 50 pessoas</option><option>51 a 200 pessoas</option><option>Mais de 200 pessoas</option></select></label></div>
  <label class="fl"><span>Tema de interesse</span><input class="inp" id="ic-tema" placeholder="Ex.: licenciamento ambiental, pareceres técnicos"></label>
  <label class="fl"><span>Mensagem</span><textarea class="inp" id="ic-msg" placeholder="Conte o contexto e o que o time precisa desenvolver"></textarea></label>
  ${btn('Solicitar proposta','gold',{full:1,type:'submit'})}<p class="msg" aria-live="polite">Ao enviar, você concorda com nossa Política de Privacidade.</p></form>
</div></section>
${footer()}`,

termos:()=>`
<section class="sec light hero" data-hero><div class="wrap hero-c">${tag('Legal')}
 <h1 class="d1 blur" data-r>Termos ${em('de Uso.')}</h1>
 <p class="lead" data-r>As regras para usar o site, a conta e o Portal do Aluno da EJUP. Versão de ${TERMOS_DATA}.</p></div></section>
<section class="sec light flush"><div class="wrap"><div class="art-t priv" data-r>
 <h2 class="h3">1. Quem somos e o que estes termos regem</h2>
 <p>EJUP — Educação Jurídica, CNPJ 41.402.986/0001-03, Rua da Saudade, 1028, Lagoa Nova, Natal/RN. Estes termos valem para o site, a conta de aluno ou professor, o Portal do Aluno, a Área do Professor e a Minerva. Ao criar a conta, você declara que leu e aceita estes termos e a <a href="#privacidade">Política de Privacidade</a>.</p>
 <h2 class="h3">2. Conta</h2>
 <p>A conta é pessoal e intransferível. Você se compromete a informar dados verdadeiros, manter a senha em sigilo e avisar a EJUP se suspeitar de uso indevido. Para contratar uma formação é preciso ter 18 anos ou ser representado por quem tenha. O acesso simultâneo da mesma conta por várias pessoas não é permitido.</p>
 <h2 class="h3">3. Acesso às formações</h2>
 <p>As formações aparecem no Portal do Aluno depois que a EJUP libera o acesso no e-mail usado na inscrição. O prazo de acesso, a carga horária, o formato e o plano de suporte (Essencial, Acompanhado ou Mentoria) são os informados na oferta de cada formação. Prazos de resposta do professor, plantões e mentorias seguem o plano contratado. A EJUP pode atualizar aulas e materiais para manter o conteúdo correto, sem reduzir a carga horária contratada.</p>
 <h2 class="h3">4. Pagamento, cancelamento e arrependimento</h2>
 <p>Valores, formas de pagamento e parcelamento são os da oferta no momento da compra. Na contratação pela internet, você pode desistir em até 7 dias contados da contratação ou da liberação do acesso, com devolução integral do valor pago, como prevê o art. 49 do Código de Defesa do Consumidor. O pedido é feito pelo e-mail <a href="mailto:contato@ejup.com.br">contato@ejup.com.br</a> ou pelo WhatsApp da escola.</p>
 <h2 class="h3">5. Propriedade intelectual</h2>
 <p>Aulas, materiais, textos, marcas e o conteúdo do site pertencem à EJUP ou aos professores e são protegidos pela Lei nº 9.610/1998. O acesso é para estudo pessoal. Não é permitido gravar, baixar por meios não oferecidos pelo portal, copiar, compartilhar, transmitir ou revender aulas e materiais. A violação leva à suspensão do acesso, sem prejuízo das medidas legais cabíveis.</p>
 <h2 class="h3">6. Conduta</h2>
 <p>Dúvidas, plantões e mentorias são espaços de estudo. Pedimos respeito aos professores e aos colegas. Não envie dados pessoais de terceiros nem informações sigilosas de clientes ou processos: descreva o caso em termos gerais.</p>
 <h2 class="h3">7. Natureza do conteúdo e da Minerva</h2>
 <p>O conteúdo da EJUP tem finalidade educacional e não constitui consultoria ou parecer jurídico sobre casos concretos. A Minerva responde com o banco de respostas cadastrado pela EJUP e pelos professores; ela pode não ter a resposta ou não cobrir as particularidades do seu caso. Decisões profissionais continuam sendo de responsabilidade de quem as toma.</p>
 <h2 class="h3">8. Certificados</h2>
 <p>O certificado é emitido quando a carga horária da formação é concluída no portal. Cada certificado tem um código e uma página pública de conferência, que mostra o nome que você escolheu para o certificado, a formação, a carga horária e a data de conclusão.</p>
 <h2 class="h3">9. Suspensão e encerramento</h2>
 <p>A EJUP pode suspender ou encerrar a conta em caso de descumprimento destes termos, com aviso por e-mail. Você pode encerrar a conta a qualquer momento no seu perfil; o encerramento apaga perfil, progresso, anotações e dúvidas, e não gera reembolso fora das hipóteses do item 4.</p>
 <h2 class="h3">10. Disponibilidade</h2>
 <p>Trabalhamos para manter o site e o portal no ar, mas podem ocorrer interrupções para manutenção ou por falhas de terceiros (hospedagem, vídeo, e-mail). Interrupções longas que impeçam o uso do que foi contratado dão direito a prorrogação proporcional do acesso.</p>
 <h2 class="h3">11. Alterações destes termos</h2>
 <p>Quando estes termos mudarem, a nova versão será publicada nesta página com a data, e quem tem conta será avisado por e-mail. As mudanças não alteram as condições de formações já contratadas.</p>
 <h2 class="h3">12. Lei e foro</h2>
 <p>Estes termos seguem as leis brasileiras. Fica eleito o foro de Natal/RN, ressalvado o direito do consumidor de propor ação no foro do seu domicílio.</p>
 <h2 class="h3">Contato</h2>
 <p><a href="mailto:contato@ejup.com.br">contato@ejup.com.br</a> · WhatsApp 85 9 9271.4050.</p>
</div></div></section>
${footer()}`,

privacidade:()=>`
<section class="sec light hero" data-hero><div class="wrap hero-c">${tag('Legal')}
 <h1 class="d1 blur" data-r>Política de ${em('Privacidade.')}</h1>
 <p class="lead" data-r>Como a EJUP trata os dados que você informa neste site.</p></div></section>
<section class="sec light flush"><div class="wrap"><div class="art-t priv" data-r>
 <h2 class="h3">Quem trata os dados</h2>
 <p>EJUP — Educação Jurídica, Rua da Saudade, 1028, Lagoa Nova, Natal/RN. Contato: <a href="mailto:contato@ejup.com.br">contato@ejup.com.br</a>.</p>
 <h2 class="h3">Que dados coletamos e para quê</h2>
 <p>Newsletter: o seu e-mail, para enviar a edição semanal da Coluna Jurídica. Proposta in company: nome, e-mail, organização, tamanho da equipe, tema e mensagem, para preparar e responder ao pedido. Coletamos apenas o que você digita nesses formulários, com o seu consentimento.</p>
 <h2 class="h3">Portal do Aluno e Área do Professor</h2>
 <p>Para quem tem conta: nome, e-mail, senha (guardada de forma cifrada pelo provedor de login), dados opcionais do perfil (telefone, área de atuação, inscrição na OAB, nome no certificado), as formações liberadas, o progresso nas aulas, as anotações, as dúvidas enviadas ao professor, os encontros de mentoria, as preferências de estudo e de e-mail e o registro do aceite dos Termos de Uso (versão e data). Usamos esses dados para dar acesso às formações, emitir certificados, encaminhar dúvidas ao professor da formação e enviar os avisos que você escolher. O professor da formação vê o nome, o e-mail, o plano e o progresso dos alunos da turma. No perfil, você baixa uma cópia dos seus dados ou exclui a conta.</p>
 <h2 class="h3">Minerva</h2>
 <p>No site público, as perguntas feitas à Minerva são usadas só para encontrar a resposta no banco de respostas da EJUP e não são guardadas. No Portal do Aluno, as perguntas ficam registradas na sua conta, junto com a avaliação “ajudou” ou “não ajudou”, para que o professor revise e melhore as respostas da formação. Não informe dados pessoais ou detalhes sigilosos de casos na conversa.</p>
 <h2 class="h3">Com quem compartilhamos</h2>
 <p>Com os serviços que mantêm o site no ar: hospedagem, banco de dados e login, envio de e-mails e a plataforma que exibe os vídeos das aulas. Não vendemos nem cedemos dados para publicidade.</p>
 <h2 class="h3">Cookies</h2>
 <p>Este site não usa cookies de publicidade nem de rastreamento. Quem entra no Portal recebe cookies de sessão, necessários para manter o login.</p>
 <h2 class="h3">Seus direitos</h2>
 <p>Você pode pedir acesso, correção ou exclusão dos seus dados, ou cancelar a newsletter a qualquer momento, escrevendo para <a href="mailto:contato@ejup.com.br">contato@ejup.com.br</a>.</p>
</div></div></section>
${footer()}`,

};

/* ---------- casca: nav, menu, modal ---------- */
const nav=$('#nav'),menu=$('#menu'),app=$('#app');app.tabIndex=-1;
const modal=$('#modal'),toastEl=$('#toast'),pbar=$('#pbar');
nav.innerHTML=`<div class="wrap nav-in"><a href="#home" class="logo" aria-label="EJUP — início">${LOGO}</a>
 <nav class="nav-pill" aria-label="Principal"><span class="nav-ind"></span>${NAV.map(([k,l])=>`<a href="#${k}" data-p="${k}">${l}</a>`).join('')}</nav>
 <div class="nav-acts"><a href="/minerva" class="btn s b-glass"><span>Minerva</span></a>${btn('Entrar','glass',{go:'entrar',s:1,icon:false,attr:'data-sess'})}${btn('Ver formações','gold',{go:'formacoes',s:1})}</div>
 <button class="btn s b-glass nav-menu" id="menu-open" aria-expanded="false" aria-controls="menu">${ic('menu',18)}<span>Menu</span></button>
 <a href="#home" class="btn s b-glass nav-back"><span>Voltar ao site</span>${ic('ar',14)}</a></div>`;
menu.innerHTML=`${orb('',{arc:false})}<div class="menu-top"><a href="#home" class="logo" aria-label="EJUP — início">${LOGO}</a><button class="btn s b-glass" id="menu-close">${ic('x',18)}<span>Fechar</span></button></div>
 <nav class="menu-list" aria-label="Menu">${[...NAV,['minerva','Minerva']].map(([k,l],i)=>`<a href="${k==='minerva'?'/minerva':'#'+k}" data-p="${k}" style="--i:${i}"><span class="n">0${i+1}</span><span class="t">${l}</span>${ic('ar',16)}</a>`).join('')}</nav>
 <div class="menu-bot">${btn('Ver formações','gold',{go:'formacoes'})}${btn('Entrar','glass',{go:'entrar',icon:false,attr:'data-sess'})}<p class="sm">(85) 99271-4050 &nbsp;·&nbsp; @ejup.oficial</p></div>`;
const ind=$('.nav-ind'),pill=$('.nav-pill');
pill.addEventListener('mouseover',e=>{const a=e.target.closest('a');if(!a)return;ind.style.width=a.offsetWidth+'px';ind.style.transform=`translateX(${a.offsetLeft}px)`;ind.style.opacity=1});
pill.addEventListener('mouseleave',()=>{ind.style.opacity=0});
/* com sessão aberta (aviso sem token, gravado pelo portal), "Entrar" vira o atalho de volta */
const syncSess=()=>{const on=/(?:^|; )ejup_on=1/.test(document.cookie);$$('[data-sess]').forEach(a=>{a.setAttribute('href',on?'/portal':'/entrar');$('span',a).textContent=on?'Meu portal':'Entrar'})};
let menuOn=false;
const setMenu=v=>{menuOn=v;menu.classList.toggle('on',v);menu.toggleAttribute('inert',!v);$('#menu-open').setAttribute('aria-expanded',v);document.documentElement.style.overflow=v?'hidden':''};
setMenu(false);

let toastT;
const toast=m=>{toastEl.textContent=m;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('on'),3400)};

/* links internos viram caminhos (/escola, /formacao/licenciamento) e as ações externas viram links de verdade */
const toPath=tok=>{const [p,a]=parse(tok);return p==='home'?'/':'/'+p+(a?'/'+a:'')};
function links(root){
 $$('a[href^="#"]',root).forEach(a=>a.setAttribute('href',toPath(a.getAttribute('href'))));
 $$('[data-buy]',root).forEach(el=>{const f=F.find(x=>x.id===el.dataset.buy);el.removeAttribute('data-buy');
  toLink(el,f.checkout||CHECKOUT[f.id]||waMsg(f.incompany?`Olá, quero uma proposta da formação ${f.t} para a minha equipe.`:`Olá, quero me inscrever em: ${f.t}.`))});
 $$('[data-toast^="@"]',root).forEach(el=>{const k=el.dataset.toast.slice(1);el.removeAttribute('data-toast');
  if(k==='mail'){const h=$('h1',root);toLink(el,'mailto:?subject='+encodeURIComponent(h?h.textContent:'EJUP')+'&body='+encodeURIComponent(location.origin+location.pathname),true);return}
  if(k==='privacidade'){toLink(el,'/privacidade',true);return}
  LINKS[k]?toLink(el,LINKS[k]):el.remove()});
 $$('.acts',root).forEach(x=>{if(!x.children.length)x.remove()});
}
function toLink(el,href,same){
 const a=document.createElement('a');[...el.attributes].forEach(at=>{if(at.name!=='type')a.setAttribute(at.name,at.value)});
 a.innerHTML=el.innerHTML;a.href=href;if(!same&&/^https?:/.test(href)){a.target='_blank';a.rel='noopener'}el.replaceWith(a);
}

let lastFocus;
function openModal(k){
 const e=E.find(x=>'ep'+x.n===k);if(!e)return;
 const yt=e.yt?`<iframe src="https://www.youtube-nocookie.com/embed/${e.yt}?autoplay=1&rel=0" title="${e.t}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`:'';
 const acts=btn('Assistir no YouTube','white',{s:1,toast:T.yt})+btn('Ouvir no Spotify','glass',{s:1,toast:T.sp});
 const extra=yt?'':`<video class="lt" data-vid="sub" muted loop playsinline aria-hidden="true"></video>${RM?'':`<div class="intro"><video data-vid="logo" muted playsinline aria-label="Abertura do EJUPcast"></video><button class="skip" data-skip>Pular abertura</button></div>`}`;
 modal.innerHTML=withImg(`<div class="modal-c" role="dialog" aria-modal="true" aria-label="${e.t}"><div class="modal-v">${yt||`<img src="img/${e.img}.jpg" alt="">`}${extra}</div><div class="modal-f"><div style="display:grid;gap:4px;flex:1 1 280px"><p class="h4">${e.t}</p><p class="sm">${e.m}</p></div><div class="acts">${acts}${btn('Fechar','line',{s:1,icon:false,attr:'data-close'})}</div></div></div>`);
 links(modal);
 lastFocus=document.activeElement;modal.classList.add('on');$('[data-close]',modal).focus();
 hydrate(modal);
 const intro=$('.intro',modal),lt=$('.lt',modal);
 const endIntro=()=>{intro&&intro.classList.add('off');if(lt){lt.classList.add('on');lt.play().catch(()=>{})}};
 if(intro){const v=$('video',intro);v.addEventListener('ended',endIntro);v.play().catch(endIntro)}else endIntro();
 modal._end=endIntro;
}
const closeModal=()=>{if(!modal.classList.contains('on'))return;modal.classList.remove('on');$$('video',modal).forEach(v=>v.pause());$$('iframe',modal).forEach(f=>f.remove());lastFocus&&lastFocus.focus&&lastFocus.focus()};

/* ---------- roteador ---------- */
let cur=null,secs=[],hero=null,pars=[],prog=null,spies=[],io,cio,vio;
/* aceita caminho (/formacao/licenciamento) e o formato antigo com # (#formacao.licenciamento) */
const parse=h=>{h=(h||'').replace(/^[#/]+/,'').replace(/\/+$/,'');if(!h)return ['home',''];const i=h.search(/[./]/);return i<0?[h,'']:[h.slice(0,i),h.slice(i+1)]};
const TITLES={home:'EJUP · Educação Jurídica',escola:'A escola',formacoes:'Formações',formacao:'Formação',professores:'Professores',ejupcast:'EJUPcast',coluna:'Coluna Jurídica',artigo:'Artigo',incompany:'In company',privacidade:'Política de Privacidade',termos:'Termos de Uso',entrar:'Entrar',criar:'Criar conta',recuperar:'Recuperar senha',portal:'Portal do Aluno',prof:'Área do Professor',equipe:'Área da Equipe',certificado:'Certificado'};
const SCR={};
/* Portal do Aluno, Área do Professor e login ficam em /assets/portal.js, carregado só quando alguém vai até lá */
const PORTAL=['entrar','criar','recuperar','portal','prof','equipe','certificado'];
let portalJs=null;
const loadPortal=()=>portalJs||(portalJs=new Promise((ok,no)=>{const s=document.createElement('script');s.src='/assets/portal.js?v=1';s.onload=ok;s.onerror=()=>{portalJs=null;no()};document.head.appendChild(s)}));
function go(tok,o={}){
 let [p,arg]=parse(tok);
 if(!PAGES[p]&&PORTAL.includes(p)){loadPortal().then(()=>go(tok,o),()=>toast('Não foi possível abrir o portal. Confira a conexão e tente de novo.'));return}
 let known=!!PAGES[p];if(!known){p='home';arg=''}
 const key=p+(arg?'.'+arg:'');
 setMenu(false);closeModal();
 if(key===cur){afterArg(p,arg)||scrollTo({top:0,behavior:RM?'auto':'smooth'});return}
 const back=o.push===false,y0=back?(SCR[key]||0):0;
 const inner=PAGES[p].sub&&cur&&parse(cur)[0]===p;
 if(cur)SCR[cur]=scrollY;
 cur=key;
 try{if(o.push!==false)history.pushState(null,'',toPath(key));else if(!known||location.hash)history.replaceState(null,'',toPath(key))}catch(e){}
 if(inner){PAGES[p].sub(arg,y0);return}
 const swap=()=>{app.innerHTML=withImg(PAGES[p](arg));links(app);hydrate(app);mount(p,arg);scrollTo({top:y0,behavior:'instant'});frame();app.classList.remove('out');if(!o.instant)app.focus({preventScroll:true})};
 if(o.instant||RM){swap();return}
 pbar.className='pbar';void pbar.offsetWidth;pbar.classList.add('run');app.classList.add('out');
 setTimeout(()=>{swap();pbar.classList.add('end')},240);
}
function afterArg(p,arg){
 const t=p==='incompany'&&arg==='proposta'?$('#proposta'):p==='coluna'&&arg==='newsletter'?$('#newsletter'):null;
 if(t){setTimeout(()=>t.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'}),cur&&app.classList.contains('out')?0:60);return true}
 return false;
}
function mount(p,arg){
 nav.classList.remove('hide');
 nav.classList.toggle('is-auth',['entrar','criar','recuperar','certificado'].includes(p));nav.classList.toggle('is-portal',['portal','prof','equipe'].includes(p));
 document.documentElement.classList.toggle('in-portal',['portal','prof','equipe'].includes(p));syncSess();
 const ttl=p==='formacao'?(F.find(x=>x.id===arg)||F[0]).t:p==='artigo'?(AR.find(x=>x.id===arg)||AR[0]).t:TITLES[p];
 document.title=p==='home'?TITLES.home:`${ttl||'EJUP'} · EJUP`;
 /* descrição da página (o servidor já entrega a da primeira página; aqui segue a navegação) */
 const un=t=>{const d=document.createElement('textarea');d.innerHTML=t||'';return d.value};
 const desc=p==='formacao'?(F.find(x=>x.id===arg)||F[0]).d:p==='artigo'?((AR.find(x=>x.id===arg)||AR[0]).d||ttl):(PADRAO.SEO[p]||PADRAO.SEO.home)[1];
 const md=$('meta[name="description"]');if(md&&desc)md.setAttribute('content',un(desc).replace(/\s+/g,' ').slice(0,180));
 const key={formacao:'formacoes',artigo:'coluna'}[p]||p;
 $$('[data-p]').forEach(a=>{const on=a.dataset.p===key;a.classList.toggle('on',on);on?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')});
 secs=$$('#app > section, #app > footer');hero=$('[data-hero]');pars=$$('[data-par]');prog=$('#prog');
 spies=$$('[data-spy]').map(box=>({box,items:$$('[data-anchor]',box).map(a=>[a,document.getElementById(a.dataset.anchor)]).filter(x=>x[1])}));
 reveal();counters();$$('.seg').forEach(placeSeg);
 vio&&vio.disconnect();
 if(!RM&&'IntersectionObserver' in window){vio=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;e.isIntersecting?v.play().catch(()=>{}):v.pause()}),{threshold:.15});$$('video[loop]',app).forEach(v=>vio.observe(v))}
 $$('[data-filter]').forEach(b=>applyFilter(b,true));
 $$('.drag').forEach(dragScroll);
 frame();afterArg(p,arg);
 PAGES[p].mount&&PAGES[p].mount(arg);
}

/* ---------- entrada no scroll, contagem ---------- */
function reveal(){
 io&&io.disconnect();
 const els=$$('[data-r]');
 if(!('IntersectionObserver' in window)){els.forEach(e=>e.removeAttribute('data-r'));return}
 io=new IntersectionObserver(es=>{
  es.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left)
   .forEach((e,i)=>{const el=e.target,d=Math.min(i,6)*80;el.style.setProperty('--d',d+'ms');el.classList.add('in');io.unobserve(el);
    setTimeout(()=>{el.removeAttribute('data-r');el.classList.remove('in','blur');el.style.removeProperty('--d')},(el.classList.contains('blur')?950:650)+d)});
 },{rootMargin:'0px 0px -6% 0px',threshold:.04});
 els.forEach(e=>io.observe(e));
}
function counters(){
 cio&&cio.disconnect();const els=$$('[data-count]');if(!els.length||RM||!('IntersectionObserver' in window))return;
 cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;cio.unobserve(e.target);const el=e.target,to=+el.dataset.count,t0=performance.now();
  const step=t=>{const k=clamp((t-t0)/1200,0,1);el.textContent=Math.round(to*(1-Math.pow(1-k,3)));k<1&&requestAnimationFrame(step)};el.textContent='0';requestAnimationFrame(step)}),{threshold:.6});
 els.forEach(e=>cio.observe(e));
}

/* ---------- scroll ---------- */
let lastY=0,tick=false;
function frame(){
 const y=scrollY,vh=innerHeight;
 if(!menuOn){if(y>lastY+6&&y>220)nav.classList.add('hide');else if(y<lastY-6||y<220)nav.classList.remove('hide')}
 lastY=y;
 let tone='dark';for(const s of secs){const r=s.getBoundingClientRect();if(r.top<=56&&r.bottom>56){tone=s.classList.contains('light')?'light':'dark';break}}
 if(nav.dataset.tone!==tone)nav.dataset.tone=tone;
 if(hero&&!RM)hero.style.setProperty('--sp',clamp(y/(hero.offsetHeight||1),0,1).toFixed(3));
 if(!RM){$$('.media[data-scale]').forEach(el=>{const r=el.getBoundingClientRect();el.style.setProperty('--sc',(.93+.07*clamp((vh-r.top)/(vh*.75),0,1)).toFixed(4))});
  pars.forEach(el=>{const r=el.parentElement.getBoundingClientRect();el.style.translate=`0 ${((r.top-vh*.4)*+el.dataset.par).toFixed(1)}px`})}
 if(prog){const d=document.documentElement.scrollHeight-vh;prog.style.setProperty('--p',d>0?clamp(y/d,0,1).toFixed(4):0)}
 spies.forEach(({box,items})=>{let on=items[0];for(const it of items)if(it[1].getBoundingClientRect().top<180)on=it;
  if(on&&!on[0].classList.contains('on')){items.forEach(it=>it[0].classList.toggle('on',it===on));box.classList.contains('seg')&&placeSeg(box)}});
}
addEventListener('scroll',()=>{if(tick)return;tick=true;requestAnimationFrame(()=>{tick=false;frame()})},{passive:true});
addEventListener('resize',()=>{$$('.seg').forEach(placeSeg);frame()});
function placeSeg(seg){const on=$('.on',seg),i=$('.seg-ind',seg);if(!on||!i)return;i.style.width=on.offsetWidth+'px';i.style.transform=`translateX(${on.offsetLeft}px)`}
document.fonts&&document.fonts.ready.then(()=>$$('.seg').forEach(placeSeg));

/* ---------- filtros ---------- */
function applyFilter(box,now){
 const k=box.dataset.filter,grid=$('#grid-'+k),cat=$('.chip.on',box).dataset.cat,q=norm($('input',box).value);
 const run=()=>{let n=0;[...grid.children].forEach(c=>{if(c.hasAttribute('data-extra'))return;const ok=(cat==='todos'||c.dataset.cat===cat)&&(!q||norm(c.dataset.text).includes(q));c.hidden=!ok;ok&&n++});
  $('#empty-'+k).hidden=n>0;grid.hidden=n===0;grid.classList.remove('out')};
 if(now){run();return}
 grid.classList.add('out');$$('[data-r]',grid).forEach(c=>c.removeAttribute('data-r'));setTimeout(run,220);
}
let fT;
document.addEventListener('input',e=>{const box=e.target.closest('[data-filter]');if(box){clearTimeout(fT);fT=setTimeout(()=>applyFilter(box),160)}
 if(e.target.classList.contains('bad'))e.target.classList.remove('bad');const f=e.target.closest('.field.bad');f&&f.classList.remove('bad')});

/* ---------- arraste nos carrosséis ---------- */
let dragged=false;
function dragScroll(el){
 if(el._d)return;el._d=1;let x0=0,s0=0,down=false;
 el.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||el.scrollWidth<=el.clientWidth)return;down=true;dragged=false;x0=e.clientX;s0=el.scrollLeft});
 addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-x0;if(Math.abs(dx)>6){dragged=true;el.classList.add('dragging')}el.scrollLeft=s0-dx});
 addEventListener('pointerup',()=>{if(!down)return;down=false;el.classList.remove('dragging');setTimeout(()=>dragged=false,0)});
}

/* ---------- ponteiro: brilho e paralaxe ---------- */
document.addEventListener('pointermove',e=>{
 const g=e.target.closest&&e.target.closest('.glow');
 if(g){const r=g.getBoundingClientRect();g.style.setProperty('--mx',(e.clientX-r.left)+'px');g.style.setProperty('--my',(e.clientY-r.top)+'px')}
 if(hero&&!RM&&e.pointerType==='mouse'){hero.style.setProperty('--px',(e.clientX/innerWidth-.5).toFixed(3));hero.style.setProperty('--py',(e.clientY/innerHeight-.5).toFixed(3))}
},{passive:true});

/* ---------- professores (acordeão) ---------- */
const setProf=p=>{if(!p||p.classList.contains('vaga')||p.classList.contains('on'))return;$$('.prof',p.parentElement).forEach(x=>x.classList.toggle('on',x===p))};
if(HOVER)document.addEventListener('mouseover',e=>{const p=e.target.closest&&e.target.closest('.prof');p&&setProf(p)});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){closeModal();menuOn&&setMenu(false);return}
 const p=e.target.closest&&e.target.closest('.prof');
 if(p){if(e.key==='Enter'||e.key===' '){e.preventDefault();setProf(p)}
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const l=$$('.prof:not(.vaga)',p.parentElement),n=l[(l.indexOf(p)+(e.key==='ArrowRight'?1:-1)+l.length)%l.length];n.focus();setProf(n)}}
 const an=e.target.closest&&e.target.closest('a[data-anchor]');if(an&&(e.key==='Enter'||e.key===' ')){e.preventDefault();an.click()}
});

const okMail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const LEAD_ERR='Não foi possível enviar agora. Escreva para contato@ejup.com.br.';
const lead=data=>fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>{if(!r.ok)throw new Error(r.status)});
document.addEventListener('submit',async e=>{
 e.preventDefault();const f=e.target;
 if(f.matches('[data-news]')){const i=$('input',f),m=$('.msg',f),b=$('.btn',f);
  if(!okMail(i.value)){i.closest('.field').classList.add('bad');m.textContent='Digite um e-mail válido, como nome@exemplo.com.';m.classList.add('bad');i.focus();return}
  m.classList.remove('bad');m.textContent='Enviando…';b.disabled=true;
  try{await lead({tipo:'newsletter',email:i.value.trim(),origem:location.pathname});m.textContent='Inscrição confirmada. A próxima edição chega no seu e-mail.';i.disabled=true;b.classList.add('done');b.innerHTML=`${ic('check',16)}<span>Inscrito</span>`}
  catch(err){m.textContent=LEAD_ERR;m.classList.add('bad');b.disabled=false}
  return}
 if(f.id==='ic-form'){let bad=null;[['#ic-nome',v=>v.trim().length>1],['#ic-email',okMail],['#ic-org',v=>v.trim().length>1]].forEach(([s,ok])=>{const i=$(s);const g=ok(i.value);i.classList.toggle('bad',!g);if(!g&&!bad)bad=i});
  const m=$('.msg',f),b=$('button[type="submit"]',f);if(bad){m.textContent='Preencha nome, e-mail corporativo e organização para enviar.';m.classList.add('bad');bad.focus();return}
  const v=id=>$(id).value.trim();m.classList.remove('bad');m.textContent='Enviando…';b.disabled=true;
  try{await lead({tipo:'incompany',nome:v('#ic-nome'),email:v('#ic-email'),organizacao:v('#ic-org'),equipe:v('#ic-size'),tema:v('#ic-tema'),mensagem:v('#ic-msg')});
   f.innerHTML=`<div class="okbox"><span class="ck">${ic('check',28)}</span><p class="h3">Pedido de proposta recebido.</p><p class="body">A equipe da EJUP responde pelo e-mail informado.</p>${btn('Voltar ao início','line',{go:'home',s:1})}</div>`;links(f)}
  catch(err){m.textContent=LEAD_ERR;m.classList.add('bad');b.disabled=false}
  return}
});




/* ---------- cliques ---------- */
document.addEventListener('click',e=>{
 const t=e.target;if(!t.closest)return;
 if(dragged){e.preventDefault();return}
 const a=t.closest('a[href]');
 if(a&&!a.target&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&a.origin===location.origin&&(PAGES[parse(a.pathname)[0]]||PORTAL.includes(parse(a.pathname)[0]))){e.preventDefault();go(a.pathname);return}
 let x;
 if(t.closest('#menu-open')){setMenu(true);return}
 if(t.closest('#menu-close')){setMenu(false);return}
 if(t===modal||t.closest('[data-close]')){closeModal();return}
 if(t.closest('[data-skip]')){modal._end&&modal._end();return}
 if((x=t.closest('[data-modal]'))){openModal(x.dataset.modal);return}
 if((x=t.closest('[data-anchor]'))){const d=document.getElementById(x.dataset.anchor);if(x.dataset.tema){const i=$('#ic-tema');if(i)i.value=x.dataset.tema}d&&d.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});return}
 if((x=t.closest('[data-copy]'))){const ok=()=>toast('Link copiado.'),no=()=>toast('Não foi possível copiar o link aqui.');try{navigator.clipboard.writeText(location.href).then(ok,no)}catch(err){no()}return}
 if((x=t.closest('.faq-q,.mod-q'))){const it=x.parentElement,on=!it.classList.contains('on');$$(':scope > .on',it.parentElement).forEach(o=>{o.classList.remove('on');o.firstElementChild.setAttribute('aria-expanded','false')});it.classList.toggle('on',on);x.setAttribute('aria-expanded',on);return}
 if((x=t.closest('[data-filter] .chip'))){const box=x.closest('[data-filter]');$$('.chip',box).forEach(c=>{c.classList.toggle('on',c===x);c.setAttribute('aria-pressed',c===x)});applyFilter(box);return}
 if((x=t.closest('[data-more]'))){const g=$('#grid-a');$$('[data-extra]',g).forEach(c=>{c.removeAttribute('data-extra');c.hidden=false});x.hidden=true;applyFilter($('[data-filter="a"]'));return}
 if((x=t.closest('.prof'))){setProf(x);return}
});
/* conteúdo editado na Área da Equipe (tabela site_itens); sem banco ou sem itens, valem os textos acima */
const escH=v=>typeof v==='string'?v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]):Array.isArray(v)?v.map(escH):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,escH(x)])):v;
const DEF=JSON.parse(JSON.stringify({F,E,AR,FAQ:FAQ.map(([q,a])=>({q,a})),PROF,LINKS}));
function aplicar(c){
 const L=k=>Array.isArray(c[k])&&c[k].length?c[k].map(escH):null;
 const f=L('formacao'),e=L('episodio'),a=L('artigo'),q=L('faq'),pr=L('professor');
 if(f)F=f;if(e)E=e;if(a)AR=a;if(q)FAQ=q.map(x=>[x.q,x.a]);if(pr)PROF=pr;
 const cfg=(c.config||[])[0];if(cfg)['whatsapp','instagram','youtube','spotify','mapa'].forEach(k=>{if(typeof cfg[k]==='string'&&(!cfg[k]||/^https:\/\//.test(cfg[k])))LINKS[k]=cfg[k]});
}
window.EJUP={TERMOS_VERSAO,$,$$,RM,ic,btn,tag,em,orb,LOGO,SYM,DEF,get F(){return F},LINKS,waMsg,okMail,toast,go,links,hydrate,withImg,placeSeg,reveal,syncSess,PAGES,TITLES,app,nav,cur:()=>cur};
addEventListener('popstate',()=>go(location.pathname,{push:false}));
links(nav);links(menu);
const inicio=()=>go(location.pathname==='/'&&location.hash.length>1?location.hash:location.pathname,{push:false,instant:true});
/* espera o conteúdo do banco por até 1,5 s; depois disso, abre com os textos padrão */
Promise.race([fetch('/api/portal?r=conteudo').then(r=>r.ok?r.json():null).then(c=>{c&&aplicar(c)}),new Promise(ok=>setTimeout(ok,1500))]).catch(()=>{}).finally(inicio);
})();
