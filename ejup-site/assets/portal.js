/* EJUP · Portal do Aluno, Área do Professor, entrar/criar conta e certificado público.
   Carregado sob demanda pelo app.js. Os dados vêm de /api/portal (sessão em cookie HttpOnly). */
(()=>{
'use strict';
const E=window.EJUP;if(!E)return;
const {$,$$,RM,ic,btn,tag,em,orb,LOGO,LINKS,waMsg,okMail,toast,go,links,placeSeg,reveal,PAGES}=E;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');

/* ---------- API ---------- */
async function api(r,{body,query=''}={}){
 let res;
 try{res=await fetch(`/api/portal?r=${r}${query}`,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'same-origin'})}
 catch(e){const x=new Error('Sem conexão. Confira a internet e tente de novo.');x.status=0;throw x}
 let data={};try{data=await res.json()}catch(e){}
 if(!res.ok){const x=new Error(data.error||'Não foi possível concluir agora. Tente de novo em instantes.');x.status=res.status;throw x}
 return data;
}
const busy=(b,on,label)=>{if(!b)return;if(on){b._h=b.innerHTML;b.disabled=true;b.setAttribute('aria-busy','true');b.innerHTML=`<span>${label||'Aguarde…'}</span>`}else{b.disabled=false;b.removeAttribute('aria-busy');if(b._h)b.innerHTML=b._h}};
const say=(el,msg,bad)=>{if(!el)return;el.textContent=msg||'';el.classList.toggle('bad',!!bad);el.classList.remove('on');if(msg&&bad){void el.offsetWidth;el.classList.add('on')}};

/* ---------- datas e números ---------- */
/* datas no fuso do aparelho, o mesmo dos campos de data e hora */
const fmt=(iso,o)=>new Date(iso).toLocaleString('pt-BR',o);
const quando=iso=>{const s=fmt(iso,{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});return s.charAt(0).toUpperCase()+s.slice(1).replace(':00','h').replace(/(\d{2}):(\d{2})/,'$1h$2')};
const dia=iso=>fmt(iso,{day:'numeric',month:'long',year:'numeric'});
const curto=iso=>fmt(iso,{day:'2-digit',month:'2-digit'});
const rel=iso=>{const d=Math.floor((Date.now()-new Date(iso))/86400000);return d<=0?'hoje':d===1?'ontem':d<7?`há ${d} dias`:d<30?`há ${Math.floor(d/7)} ${d<14?'semana':'semanas'}`:curto(iso)};
const hm=m=>`${Math.floor(m/60)}h${String(Math.round(m%60)).padStart(2,'0')}`;
const mmss=s=>{s=Math.max(0,Math.floor(s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=String(s%60).padStart(2,'0');return h?`${h}:${String(m).padStart(2,'0')}:${x}`:`${String(m).padStart(2,'0')}:${x}`};
const plural=(n,a,b)=>`${n} ${n===1?a:b}`;
function maisDiasUteis(iso,n){const d=new Date(iso);let k=0;while(k<n){d.setDate(d.getDate()+1);const w=d.getDay();if(w&&w<6)k++}return d}
const toLocalInput=d=>{const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
const iniOf=n=>(n||'').trim().split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';
const fav=(i,c='')=>`<span class="fav ${c}">${esc(i)}</span>`;

/* ---------- peças ---------- */
const mnv=(sz='s')=>`<span class="mnv ${sz}" data-mnv aria-hidden="true"><span class="mnv-f"><i class="mnv-h"></i><img src="/minerva/repouso.jpg" alt=""><img class="on" src="/minerva/aberta.jpg" alt=""></span></span>`;
const mnvSet=(m,open)=>{if(!m)return;m.classList.toggle('open',open);m.classList.toggle('still',open)};
const crumb=(a,b)=>`<span>${esc(a)}</span>${b?`<i>/</i><strong>${esc(b)}</strong>`:''}`;
const lk=(l,o={})=>o.go?`<a href="/${o.go}" class="lk"${o.attr?' '+o.attr:''}><span>${l}</span>${ic('ar',14)}</a>`:o.href?`<a href="${o.href}" class="lk" target="_blank" rel="noopener"><span>${l}</span>${ic('ar',14)}</a>`:`<button type="button" class="lk"${o.attr?' '+o.attr:''}><span>${l}</span>${ic('ar',14)}</button>`;
const abtn=(l,v,href,o={})=>`<a href="${href}" class="btn b-${v}${o.s?' s':''}${o.full?' full':''}"${/^https?:/.test(href)?' target="_blank" rel="noopener"':''}><span>${l}</span>${o.icon===false?'':ic('ar',o.s?14:16)}</a>`;
const barH=(v,label='Progresso da formação')=>`<div class="bar" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}"><i style="--v:${v}%"></i></div>`;
const sw=(k,l,on,s,data='data-pref')=>`<label class="psw${s?' fsw':''}"><span>${s?`<span>${l}</span><span class="sm">${s}</span>`:l}</span><input type="checkbox" ${data}="${k}"${on?' checked':''}><i></i></label>`;
const segH=(id,items,on,attr)=>`<div class="seg" id="${id}"><span class="seg-ind"></span>${items.map(([k,l])=>`<button type="button" ${attr}="${k}"${String(k)===String(on)?' class="on"':''}>${l}</button>`).join('')}</div>`;
const fhead=(t,lead,extra='')=>`<div class="phead"><div class="hd"><h1 class="h2s blur" data-r>${t}</h1><p class="lead" data-r>${lead}</p></div>${extra}</div>`;
const errBox=(msg,retry)=>`<div class="okbox"><span class="icb">${ic('help',20)}</span><p class="h4">${esc(msg)}</p>${retry?btn('Tentar de novo','glass',{s:1,icon:false,attr:'data-reload'}):''}</div>`;
const WA=t=>waMsg(t);
function download(name,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

/* planos de acesso (nomes, prazos e itens da proposta do protótipo) */
const PLANS=[
 {k:'essencial',n:'Essencial',d:'Para estudar no seu ritmo, com a Minerva ao lado.',s:'Minerva e plano de estudo',its:['Minerva, o banco de respostas da EJUP, na hora','Plano de estudo automático','Equipe EJUP para acesso e certificado']},
 {k:'acompanhado',n:'Acompanhado',d:'Para ter o professor por perto durante a formação.',s:'Dúvidas ao professor e plantão ao vivo',its:['Tudo do Essencial','Dúvida ao professor por escrito, em até 2 dias úteis','Plantão ao vivo em grupo']},
 {k:'mentoria',n:'Mentoria',d:'Para quem quer acompanhamento individual.',s:'Professor com prioridade e encontros individuais',its:['Tudo do Acompanhado','Resposta do professor com prioridade, em 1 dia útil','2 encontros individuais com o professor']}];
const lvl=p=>Math.max(0,PLANS.findIndex(x=>x.k===p));
const MX=[['Conteúdo'],['Aulas gravadas e materiais','',[true,true,true]],['Plano de estudo automático','Distribui as aulas pelo tempo que você tem',[true,true,true]],['Certificado','',[true,true,true]],['Suporte'],['Minerva','Responde na hora com as respostas cadastradas pela EJUP',[true,true,true]],['Equipe EJUP','Acesso, pagamento e certificado',[true,true,true]],['Dúvida ao professor por escrito','Resposta no portal e por e-mail',[false,'Até 2 dias úteis','Prioridade · 1 dia útil']],['Plantão ao vivo em grupo','Encontro on-line com o professor, gravado',[false,true,true]],['Mentoria individual','Encontro 1 a 1 com hora marcada',[false,false,'2 encontros']]];
const sla=p=>p==='mentoria'?1:2;
const ST={professor:'Com o professor',respondida:'Respondida',encerrada:'Encerrada',plantao:'No plantão ao vivo'};
const MST={pedido:'Aguardando o professor',proposto:'Novo horário proposto',confirmado:'Confirmada',realizado:'Realizada',cancelado:'Cancelada'};
const DAYS=['seg','ter','qua','qui','sex','sáb','dom'],DAYN=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const AREAS=['Advocacia','Setor público','Departamento jurídico de empresa','Consultoria','Docência e pesquisa','Estudante','Outra'];

/* ---------- estado ---------- */
const S={me:null,prof:null,cfg:null,curso:null,pc:null,aulas:{},chat:{},view:'',arg:'',area:'',ff:'todas',sel:null,draft:null,tab:'sobre',t:0,fq:'pend',fpl:0,fsel:null,fturma:'todos',irsel:0,iredit:false,fopen:false};
const cfg=async()=>S.cfg||(S.cfg=await api('config').catch(()=>({google:null,email:false})));
const VOLTA='ejup_volta';
function precisaEntrar(){try{sessionStorage.setItem(VOLTA,location.pathname);history.replaceState(null,'','/entrar')}catch(e){}S.me=S.prof=null;go('entrar',{push:false})}
function voltar(def){let v='';try{v=sessionStorage.getItem(VOLTA)||'';sessionStorage.removeItem(VOLTA)}catch(e){}go(v&&new RegExp('^[#/]'+def+'(?![a-z])').test(v)?v:def)}

/* ======================================================================
   ENTRAR · CRIAR CONTA · RECUPERAR
   ====================================================================== */
const AUTH={entrar:{h:`Continue ${em('de onde parou.')}`,p:'Acesse suas formações, aulas e materiais no Portal do Aluno.',t:'Acesse sua conta',s:'Continue de onde parou em suas formações.',b:'Entrar',q:'Ainda não tem conta?',o:['criar','Criar conta']},
 criar:{h:`Formações e ${em('conteúdos exclusivos.')}`,p:'Crie sua conta com o e-mail usado na inscrição. A equipe da EJUP libera as formações nesse e-mail.',t:'Crie sua conta',s:'Use o mesmo e-mail da sua inscrição.',b:'Criar conta',q:'Já tem uma conta?',o:['entrar','Entrar']},
 prof:{h:`A sua turma, ${em('em um só lugar.')}`,p:'Responda às dúvidas, conduza os plantões e acompanhe a turma na Área do Professor.',t:'Acesso do professor',s:'Use o e-mail que a EJUP cadastrou na sua formação.',b:'Entrar na Área do Professor',q:'Primeiro acesso?',o:['criar','Criar conta com este e-mail']},
 equipe:{h:`A escola ${em('por dentro.')}`,p:'Libere alunos, edite formações, aulas e o conteúdo do site na Área da Equipe.',t:'Acesso da equipe',s:'Use o seu e-mail da equipe EJUP.',b:'Entrar na Área da Equipe',q:'Primeiro acesso?',o:['criar','Criar conta com este e-mail']}};
/* aluno escolhe entre Entrar e Criar conta; professor e equipe entram com o e-mail já reconhecido pela EJUP */
const ACC={aluno:['book','Sou aluno','Portal do Aluno'],prof:['users','Sou professor','Área do Professor'],equipe:['shield','Sou equipe EJUP','Área da Equipe']};
const accDe=m=>m==='prof'||m==='equipe'?m:'aluno';
const accOpt=(k,on)=>`<button type="button" role="radio" aria-checked="${on}" class="acc-o${on?' on':''}" data-acc="${k}"><span class="icb">${ic(ACC[k][0],18)}</span><span><strong>${ACC[k][1]}</strong><span class="sm">${ACC[k][2]}</span></span></button>`;
const pwField=(id,l,ac)=>`<label class="fl"><span>${l}</span><span class="pw"><input class="inp" id="${id}" type="password" placeholder="••••••••" autocomplete="${ac}"><button type="button" data-eye="${id}" aria-label="Mostrar senha">${ic('eye',18)}</button></span></label>`;
const auEmail=m=>m==='prof'?'E-mail cadastrado pela EJUP':m==='equipe'?'E-mail da equipe':'E-mail';
function auth(m){const a=AUTH[m],k=accDe(m),pf=k!=='aluno';return `
<section class="sec dark authp" data-hero>${orb('orb-b',{a0:-56,a1:-36,d:-120})}<div class="wrap auth">
 <div class="auth-m"><span class="tag gold" id="au-tag">Acesso EJUP</span><h1 class="d1 swap" id="au-h">${a.h}</h1><p class="lead swap" id="au-p">${a.p}</p><p class="lbl">Reconhecida por quem valoriza excelência</p></div>
 <form class="card authc glow" id="au-f" novalidate data-mode="${m}">
  <div class="acc"><p class="lbl" id="au-acc-l">Tipo de acesso</p><div class="acc-g" role="radiogroup" aria-labelledby="au-acc-l">${Object.keys(ACC).map(x=>accOpt(x,x===k)).join('')}</div></div>
  <div class="fxc${pf?'':' on'}" id="au-sx"${pf?' inert':''}><div><div class="seg"><span class="seg-ind"></span><button type="button" data-mode="entrar"${m!=='criar'?' class="on"':''}>Entrar</button><button type="button" data-mode="criar"${m==='criar'?' class="on"':''}>Criar conta</button></div></div></div>
  <div class="tt swap" id="au-t"><h2 class="h3">${a.t}</h2><p class="body">${a.s}</p></div>
  <div class="fields">
   <div class="fx${m==='criar'?' on':''}" id="au-fx"${m==='criar'?'':' inert'}><div><label class="fl"><span>Nome completo</span><input class="inp" id="au-nome" placeholder="Seu nome" autocomplete="name"></label></div></div>
   <label class="fl"><span id="au-el">${auEmail(m)}</span><input class="inp" id="au-email" type="email" placeholder="voce@exemplo.com" autocomplete="email"></label>
   ${pwField('au-senha','Senha',m==='criar'?'new-password':'current-password')}
   <div id="au-tx"${m==='criar'?'':' hidden'}><div><label class="chk"><input type="checkbox" id="au-termos"><span>Li e aceito os <a href="/termos" target="_blank" rel="noopener">Termos de Uso</a> e a <a href="/privacidade" target="_blank" rel="noopener">Política de Privacidade</a>.</span></label></div></div>
   <p class="err" id="au-err" role="alert"></p>
  </div>
  <button type="button" class="forgot swap" id="au-fg" data-go-rec${m==='criar'?' hidden':''}>Esqueci minha senha</button>
  <button type="submit" class="btn b-gold full"><span id="au-b">${a.b}</span>${ic('ar')}</button>
  <div class="fxc" id="au-gx" inert><div class="au-g"><div class="or">ou</div><a class="btn b-glass full" id="au-google" href="#"><span>Continuar com Google</span></a><p class="sm" style="text-align:center">Ao continuar com Google, você aceita os <a href="/termos" target="_blank" rel="noopener">Termos de Uso</a> e a <a href="/privacidade" target="_blank" rel="noopener">Política de Privacidade</a>.</p></div></div>
  <p class="alt"><span id="au-q">${a.q}</span> <button type="button" id="au-o" data-mode="${a.o[0]}">${a.o[1]}</button></p>
 </form></div></section>`}
function setAuth(m){
 const f=$('#au-f');if(!f||f.dataset.mode===m)return;const a=AUTH[m],k=accDe(m),pf=k!=='aluno';
 // "Criar conta com este e-mail" a partir de professor ou equipe: guarda para onde ir depois
 if(m==='criar')f.dataset.volta=accDe(f.dataset.mode)!=='aluno'?accDe(f.dataset.mode):(f.dataset.volta||'');else if(m!=='entrar')f.dataset.volta='';
 f.dataset.mode=m;
 $$('.seg button',f).forEach(b=>b.classList.toggle('on',b.dataset.mode===(pf?'entrar':m)));placeSeg($('.seg',f));
 $$('[data-acc]',f).forEach(b=>{const on=b.dataset.acc===k;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)});
 const sx=$('#au-sx');sx.classList.toggle('on',!pf);sx.toggleAttribute('inert',pf);googleBox(!pf);
 const swp=$$('.swap',f.parentElement);swp.forEach(x=>x.classList.add('x'));
 setTimeout(()=>{$('#au-h').innerHTML=a.h;$('#au-p').textContent=a.p;$('#au-t').innerHTML=`<h2 class="h3">${a.t}</h2><p class="body">${a.s}</p>`;$('#au-fg').hidden=m==='criar';swp.forEach(x=>x.classList.remove('x'))},RM?0:220);
 const fx=$('#au-fx');fx.classList.toggle('on',m==='criar');fx.toggleAttribute('inert',m!=='criar');$('#au-tx').hidden=m!=='criar';
 $('#au-b').textContent=a.b;$('#au-q').textContent=a.q;$('#au-senha').setAttribute('autocomplete',m==='criar'?'new-password':'current-password');
 const o=$('#au-o');o.dataset.mode=a.o[0];o.textContent=a.o[1];
 $('#au-el').textContent=auEmail(m);
 say($('#au-err'),'');$$('.inp.bad',f).forEach(i=>i.classList.remove('bad'));
 try{history.replaceState(null,'',m==='criar'?'/criar':m==='prof'?'/entrar/professor':m==='equipe'?'/entrar/equipe':'/entrar')}catch(e){}
}
function googleBox(show){const g=$('#au-gx');if(!g)return;const on=show&&!!(S.cfg&&S.cfg.google);g.classList.toggle('on',on);g.toggleAttribute('inert',!on);if(on)$('#au-google').href=S.cfg.google}
/* o link do e-mail (confirmação ou nova senha) e o Google voltam com os tokens no endereço */
function hashTokens(){const h=new URLSearchParams(location.hash.slice(1));if(!h.get('access_token'))return h.get('error_description')?{erro:h.get('error_description')}:null;
 const t={access_token:h.get('access_token'),refresh_token:h.get('refresh_token'),expires_in:+h.get('expires_in')||3600,type:h.get('type')||''};try{history.replaceState(null,'',location.pathname)}catch(e){}return t}
async function mountAuth(){
 await cfg();googleBox($('#au-f')&&accDe($('#au-f').dataset.mode)==='aluno');
 const t=hashTokens();if(!t)return;
 if(t.erro){say($('#au-err'),'O link expirou ou já foi usado. Entre com e-mail e senha ou peça um novo link.',true);return}
 try{await api('sessao',{body:t});E.syncSess();toast(t.type==='signup'?'E-mail confirmado. Bem-vindo ao Portal do Aluno.':'Você entrou na sua conta.');voltar('portal')}
 catch(e){say($('#au-err'),e.message,true)}
}
PAGES.entrar=a=>auth(a==='professor'?'prof':a==='equipe'?'equipe':'entrar');PAGES.entrar.mount=mountAuth;
PAGES.criar=()=>auth('criar');PAGES.criar.mount=mountAuth;

async function authSubmit(f){
 const m=f.dataset.mode,er=$('#au-err'),em_=$('#au-email'),pw=$('#au-senha'),nm=$('#au-nome'),b=$('button[type="submit"]',f);let msg='',bad=null;
 [em_,pw,nm].forEach(i=>i.classList.remove('bad'));
 if(m==='criar'&&nm.value.trim().length<2){msg='Digite seu nome completo.';bad=nm}
 else if(!okMail(em_.value)){msg='Digite um e-mail válido, como voce@exemplo.com.';bad=em_}
 else if(m==='criar'&&pw.value.length<8){msg='A senha precisa ter pelo menos 8 caracteres.';bad=pw}
 else if(!pw.value){msg='Digite a sua senha.';bad=pw}
 else if(m==='criar'&&!$('#au-termos').checked){msg='Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.';bad=$('#au-termos')}
 if(bad){bad.classList.add('bad');say(er,msg,true);bad.focus();return}
 say(er,'');busy(b,true,m==='criar'?'Criando a conta…':'Entrando…');
 try{
  if(m==='criar'){
   const r=await api('criar',{body:{nome:nm.value.trim(),email:em_.value.trim(),senha:pw.value,termos:true,termos_versao:E.TERMOS_VERSAO}});
   if(r.confirmar){f.innerHTML=`<div class="okbox"><span class="ck">${ic('mail',28)}</span><p class="h3">Confirme o seu e-mail.</p><p class="body">Enviamos um link para <strong style="color:var(--branco);font-weight:500">${esc(em_.value.trim())}</strong>. Abra o link para ativar a conta e entrar no portal.</p><p class="sm">Não chegou? Veja a caixa de spam ou fale com a equipe: contato@ejup.com.br.</p></div>`;return}
   E.syncSess();const st=await api('estado').catch(()=>({}));toast(st.equipe?'Conta criada. Bem-vindo à Área da Equipe.':'Conta criada. Bem-vindo ao Portal da EJUP.');voltar(st.equipe?'equipe':st.professor?'prof':'portal');return}
  const r=await api('entrar',{body:{email:em_.value.trim(),senha:pw.value}});pw.value='';E.syncSess();
  if(m==='prof'&&!r.professor){toast('Esta conta não tem Área do Professor. Abrimos o Portal do Aluno.');go('portal');return}
  if(m==='equipe'&&!r.equipe){toast('Este e-mail não faz parte da equipe EJUP. Abrimos o Portal do Aluno.');go('portal');return}
  voltar(m==='equipe'?'equipe':m==='prof'?'prof':'portal');
 }catch(e){busy(b,false);pw.classList.add('bad');say(er,e.message,true);pw.focus()}
}

/* recuperar senha: e-mail → link → nova senha */
const REC={step:1,email:''};
const RECP=['','Informe o e-mail da sua conta. Enviamos um link para você criar uma nova senha.','O link chega no e-mail informado. Por segurança, ele vale por tempo limitado.','Você chegou pelo link do e-mail. Falta só escolher a nova senha.','Tudo certo. A nova senha já vale para o Portal do Aluno e para a Área do Professor.'];
PAGES.recuperar=()=>`
<section class="sec dark authp" data-hero>${orb('orb-b',{a0:-56,a1:-36,d:-120})}<div class="wrap auth">
 <div class="auth-m">${tag('Recuperar acesso','gold')}<h1 class="d1">Recupere ${em('o seu acesso.')}</h1><p class="lead swap" id="rc-p"></p><p class="lbl">Reconhecida por quem valoriza excelência</p></div>
 <div class="card authc glow swap" id="rc-c"></div></div></section>`;
PAGES.recuperar.mount=()=>{const t=hashTokens();
 if(t&&!t.erro){REC.step=3;api('sessao',{body:t}).then(()=>renderRec(true),e=>{REC.step=1;renderRec(true);say($('#rc-err'),e.message,true)});return}
 REC.step=1;renderRec(true);if(t&&t.erro)say($('#rc-err'),'O link expirou ou já foi usado. Peça um novo abaixo.',true)};
const recBack=()=>`<a href="/entrar" class="rc-b">${ic('back',14)}<span>Voltar para Entrar</span></a>`;
function renderRec(first){
 const c=$('#rc-c');if(!c)return;
 const put=()=>{const s=REC.step;$('#rc-p').textContent=RECP[s];
  c.innerHTML=s===1?`${recBack()}<div class="tt"><h2 class="h3">Esqueci minha senha</h2><p class="body">Informe o e-mail da sua conta. Vale para aluno e professor.</p></div>
    <form id="rc-f1" class="fields" novalidate><label class="fl"><span>E-mail</span><input class="inp" id="rc-email" type="email" placeholder="voce@exemplo.com" autocomplete="email"></label><p class="err" id="rc-err" role="alert"></p><button type="submit" class="btn b-gold full"><span>Enviar link de recuperação</span>${ic('ar')}</button></form>
    <p class="alt">Lembrou a senha? <a href="/entrar" class="alt-l">Entrar</a></p>`
   :s===2?`${recBack()}<span class="rc-ok">${ic('mail',24)}</span><div class="tt"><h2 class="h3">Confira o seu e-mail</h2><p class="body">Se existir uma conta com <strong id="rc-em" style="color:var(--branco);font-weight:500"></strong>, o link para criar a nova senha chega em alguns minutos.</p></div>
    <div class="rc-tip"><strong>Não chegou?</strong><span class="sm">Veja a caixa de spam ou peça um novo link daqui a um minuto.</span></div>
    <p class="alt">E-mail errado? <button type="button" data-rc="1">Usar outro e-mail</button></p>`
   :s===3?`<div class="tt"><h2 class="h3">Crie uma nova senha</h2><p class="body">Escolha uma senha que você ainda não usou na EJUP.</p></div>
    <form id="rc-f3" class="fields" novalidate>${pwField('rc-n1','Nova senha','new-password')}${pwField('rc-n2','Confirmar nova senha','new-password')}<ul class="rc-rules" id="rc-rules"><li><i></i>Pelo menos 8 caracteres</li><li><i></i>As duas senhas iguais</li></ul><p class="err" id="rc-err" role="alert"></p><button type="submit" class="btn b-gold full"><span>Salvar nova senha</span>${ic('ar')}</button></form>`
   :`<span class="rc-ok">${ic('check',26)}</span><div class="tt"><h2 class="h3">Senha alterada</h2><p class="body">A nova senha já está valendo.</p></div>${abtn('Ir para o portal','gold','/portal',{full:1})}`;
  if(s===1){const i=$('#rc-email');i.value=REC.email;first||i.focus()}
  if(s===2)$('#rc-em').textContent=REC.email;
  if(s===3)first||$('#rc-n1').focus();
  $$('.swap').forEach(x=>x.classList.remove('x'))};
 if(first||RM){put();return}
 $$('.swap').forEach(x=>x.classList.add('x'));setTimeout(put,220);
}
function recRules(){const a=$('#rc-n1'),b=$('#rc-n2');if(!a)return [false,false];const r=[a.value.length>=8,a.value.length>0&&a.value===b.value];$$('#rc-rules li').forEach((li,i)=>li.classList.toggle('ok',r[i]));return r}
async function recSubmit(f){
 const b=$('button[type="submit"]',f),er=$('#rc-err');
 if(f.id==='rc-f1'){const i=$('#rc-email');if(!okMail(i.value)){i.classList.add('bad');say(er,'Digite um e-mail válido, como voce@exemplo.com.',true);i.focus();return}
  busy(b,true,'Enviando…');try{await api('recuperar',{body:{email:i.value.trim()}});REC.email=i.value.trim();REC.step=2;renderRec()}catch(e){busy(b,false);say(er,e.message,true)}return}
 const r=recRules();if(!r[0]||!r[1]){const bad=$(r[0]?'#rc-n2':'#rc-n1');bad.classList.add('bad');say(er,r[0]?'As duas senhas precisam ser iguais.':'A senha precisa ter pelo menos 8 caracteres.',true);bad.focus();return}
 busy(b,true,'Salvando…');try{await api('nova-senha',{body:{senha:$('#rc-n1').value}});E.syncSess();REC.step=4;renderRec()}catch(e){busy(b,false);say(er,e.message,true)}
}

/* ======================================================================
   CERTIFICADO PÚBLICO (conferência e PDF pela impressão do navegador)
   ====================================================================== */
PAGES.certificado=()=>`<section class="sec dark authp cert-pub" data-hero>${orb('orb-b',{a0:-56,a1:-36,d:-120})}<div class="wrap" id="cp-w"><div class="okbox"><p class="sm">Conferindo o certificado…</p></div></div></section>`;
const cpForm=v=>`<form id="cp-f" class="aiform cp-f" novalidate><label class="field"><input id="cp-c" placeholder="EJUP-XXXX-XXXX" aria-label="Código do certificado" autocomplete="off" autocapitalize="characters" value="${esc(v||'')}"></label>${btn('Conferir','gold',{s:1,type:'submit'})}</form><p class="err" id="cp-err" role="alert"></p>`;
const normCod=v=>{const x=String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');return x.length===12&&x.startsWith('EJUP')?`EJUP-${x.slice(4,8)}-${x.slice(8)}`:String(v||'').trim().toUpperCase()};
PAGES.certificado.mount=async arg=>{
 const w=$('#cp-w'),codigo=(arg||'').toUpperCase();
 if(!codigo){document.title='Conferir certificado · EJUP';w.innerHTML=`<div class="cp-h"><div>${tag('Certificados EJUP','gold')}<h1 class="h2s">Conferir ${em('um certificado.')}</h1><p class="lead">Digite o código que aparece no rodapé do certificado. A conferência mostra o nome, a formação, a carga horária e a data de conclusão.</p></div></div><div class="card pc glow cp-box">${cpForm()}</div>`;$('#cp-c').focus();return}
 try{const c=await api('certificado',{query:`&codigo=${encodeURIComponent(codigo)}`});
  w.innerHTML=`<div class="cp-h"><div>${tag('Certificado válido','gold')}<h1 class="h2s">Certificado ${em('de conclusão.')}</h1><p class="lead">Emitido pela EJUP · Educação Jurídica. Código de conferência <span style="white-space:nowrap">${esc(c.codigo)}</span>.</p></div>
   <div class="acts no-print">${btn('Baixar PDF','gold',{attr:'data-print'})}${btn('Copiar link de conferência','glass',{icon:false,attr:'data-copy'})}</div></div>
   <article class="pcp light cp-doc" aria-label="Certificado"><div><div><span class="cp-logo">${LOGO}</span><p class="lbl">EJUP · Educação Jurídica</p><p class="lbl g">Certificado de conclusão</p></div>
    <div><p class="sm">Certificamos que</p><p class="h3">${esc(c.nome)}</p><p class="sm">concluiu a formação ${esc(c.curso)}${c.professores?`, conduzida por ${esc(c.professores)},`:''} com carga horária de ${esc(String(c.horas).replace('.',','))} horas.</p></div>
    <div class="pc-h"><span class="sm">${c.concluida_em?dia(c.concluida_em):''}</span><span class="sm">Código ${esc(c.codigo)}</span></div></div></article>`;
  document.title=`Certificado ${c.codigo} · EJUP`;
  if(new URLSearchParams(location.search).get('pdf')==='1')setTimeout(()=>print(),400);
 }catch(e){w.innerHTML=`<div class="okbox"><span class="icb">${ic('shield',20)}</span><p class="h3">Certificado não encontrado.</p><p class="body">Confira o código. Ele tem o formato EJUP-XXXX-XXXX e aparece no rodapé do certificado.</p><div class="cp-box" style="width:100%;max-width:520px">${cpForm(codigo)}</div></div>`}
};

/* ======================================================================
   PORTAL DO ALUNO
   ====================================================================== */
const M=()=>S.me;
const pad=n=>String(n).padStart(2,'0');
const cursoOf=id=>M().cursos.find(c=>c.id===id);
const matOf=id=>M().matriculas.find(m=>m.curso_id===id);
const modsOf=cid=>M().modulos.filter(m=>m.curso_id===cid).sort((a,b)=>a.ordem-b.ordem);
const aulasDoMod=mid=>M().aulas.filter(a=>a.modulo_id===mid).sort((a,b)=>a.ordem-b.ordem);
const aulasOf=cid=>modsOf(cid).flatMap(m=>aulasDoMod(m.id));
const aulaOf=id=>M().aulas.find(a=>a.id===id);
const modOf=a=>M().modulos.find(m=>m.id===a.modulo_id);
const cursoDaAula=a=>modOf(a).curso_id;
const prog=id=>M().progresso.find(p=>p.aula_id===id);
const feita=id=>!!(prog(id)||{}).concluida;
const lesL=a=>`Módulo ${pad(modOf(a).ordem)} · Aula ${a.ordem}`;
const lesT=a=>/^aula \d+$/i.test(a.titulo)?modOf(a).titulo:a.titulo;
const lesPos=a=>`${lesL(a)} de ${aulasDoMod(a.modulo_id).length}`;
const prefs=()=>M().perfil.prefs||{};
const pace=()=>prefs().pace||4;
const days=()=>Array.isArray(prefs().days)&&prefs().days.length?prefs().days:[0,2,4];
const planoDe=cid=>(matOf(cid)||{}).plano||'essencial';
function stat(cid){
 const as=aulasOf(cid),tot=as.reduce((s,a)=>s+a.duracao_min,0),fe=as.filter(a=>feita(a.id)),min=fe.reduce((s,a)=>s+a.duracao_min,0);
 const left=Math.max(0,tot-min),next=as.find(a=>!feita(a.id))||as[as.length-1]||null,m=matOf(cid)||{};
 const pct=tot?Math.round(min/tot*100):as.length&&fe.length===as.length?100:0;
 return {as,tot,min,left,next,pct,done:fe.length,n:as.length,weeks:Math.ceil(left/(pace()*60)),fim:!!m.certificado||(as.length>0&&fe.length===as.length),iniciada:fe.length>0||as.some(a=>prog(a.id))};
}
function escolheCurso(){
 const ms=M().matriculas;if(!ms.length){S.curso=null;return}
 const p=prefs().curso;if(p&&matOf(p)){S.curso=p;return}
 const a=ms.find(m=>!m.prof&&!stat(m.curso_id).fim)||ms.find(m=>!m.prof)||ms[0];S.curso=a.curso_id;
}
async function loadMe(force){if(S.me&&!force)return S.me;S.me=await api('me');if(!S.curso||!matOf(S.curso))escolheCurso();return S.me}
const proxPlantao=cid=>M().plantoes.filter(p=>p.curso_id===cid&&+new Date(p.inicio)+p.duracao_min*60000>Date.now()).sort((a,b)=>new Date(a.inicio)-new Date(b.inicio))[0]||null;
function weeksPlan(cid){
 const cap=pace()*60,pend=aulasOf(cid).filter(a=>!feita(a.id)),w=[[]];let acc=0;
 pend.forEach(a=>{if(acc&&acc+a.duracao_min>cap){w.push([]);acc=0}w[w.length-1].push(a);acc+=a.duracao_min});
 return w;
}
/* semana de estudo: as aulas desta semana incluem as concluídas nos últimos 7 dias */
function semanaAtual(cid){const w=weeksPlan(cid)[0]||[],recent=aulasOf(cid).filter(a=>feita(a.id)&&Date.now()-new Date(prog(a.id).atualizado_em)<7*86400000);return [...recent,...w]}
const weekItems=list=>list.map(a=>`<li><label><input type="checkbox" data-les="${a.id}"${feita(a.id)?' checked':''}><span>${esc(lesL(a))}</span></label><span class="sm">${a.duracao_min} min</span></li>`).join('')||'<li><span class="sm">Nenhuma aula pendente.</span></li>';

const PNAV=[['','Início','home'],['formacoes','Minhas formações','book'],['plano','Plano de estudo','cal'],['ia','Minerva','spark'],['suporte','Suporte','chat'],['cert','Certificados','award'],['planos','Planos de acesso','crown']];
const PTAB=[['','Início','home'],['formacoes','Formações','book'],['plano','Plano','cal'],['ia','Minerva','spark'],['suporte','Suporte','chat']];
PAGES.portal=()=>`
<section class="sec dark portal">
 <aside class="pside"><div class="pside-t"><a href="/portal" class="logo" aria-label="Portal do Aluno, início">${LOGO}</a>
  <nav class="pnav" aria-label="Portal do Aluno">${PNAV.map(([k,l,i])=>`<a href="/portal${k?'/'+k:''}" data-pv="${k}">${ic(i,18)}<span>${l}</span></a>`).join('')}</nav></div>
  <div class="pside-b"><a href="/portal/planos" class="pplan"><span class="lbl g">Seu plano</span><span class="h4" data-plan-n>—</span><span class="sm" data-curso-n></span></a>
   <div class="puser"><a href="/portal/perfil" class="pav" data-u-ini aria-label="Meu perfil"></a><div><a href="/portal/perfil" class="pu-n" data-u-nome></a><p class="sm"><a href="/portal/perfil">Meu perfil</a><span data-prof-link hidden> · <a href="/prof">Área do Professor</a></span> · <button type="button" class="lk-in" data-logout>Sair</button></p></div></div></div></aside>
 <div class="pbody">
  <header class="ptop"><a href="/portal" class="logo pmo" aria-label="Portal do Aluno, início">${LOGO}</a><p class="pcrumb" id="pcrumb"></p>
   <div class="ptop-r"><form class="field psearch" id="p-sf" role="search" novalidate>${ic('search',16)}<input type="search" placeholder="Buscar aula, material ou dúvida" aria-label="Buscar no portal"></form><button type="button" class="pico pbell" data-bell aria-label="Avisos" aria-haspopup="true" aria-expanded="false">${ic('bell',18)}<i class="dot" hidden></i></button><button type="button" class="pav pmo" data-pmenu aria-haspopup="true" aria-expanded="false" aria-label="Conta: perfil, certificados, planos e sair" data-u-ini></button></div>
   <div class="pmenu" id="pmenu" hidden><p class="sm"><span data-u-nome></span></p><a href="/portal/perfil">${ic('user',16)}<span>Meu perfil</span></a><a href="/portal/cert">${ic('award',16)}<span>Certificados</span></a><a href="/portal/planos">${ic('crown',16)}<span>Planos de acesso</span></a><a href="/prof" data-prof-link hidden>${ic('users',16)}<span>Área do Professor</span></a><a href="/equipe" data-eq-link hidden>${ic('shield',16)}<span>Área da Equipe</span></a><button type="button" data-logout>${ic('ar',16)}<span>Sair</span></button></div>
   <div class="pmenu pavisos" id="pavisos" hidden></div></header>
  <div id="pmain" class="pmain" tabindex="-1"><div class="okbox"><p class="sm">Carregando o portal…</p></div></div>
 </div>
 <nav class="ptabs" aria-label="Portal do Aluno">${PTAB.map(([k,l,i])=>`<a href="/portal${k?'/'+k:''}" data-pv="${k}">${ic(i,20)}<span>${l}</span></a>`).join('')}</nav>
</section>`;
PAGES.portal.mount=async arg=>{
 S.area='portal';
 try{await loadMe()}catch(e){if(e.status===401)return precisaEntrar();$('#pmain').innerHTML=errBox(e.message,true);return}
 syncShell();portalView(arg,true);
};
PAGES.portal.sub=(arg,y)=>{if(!S.me)return PAGES.portal.mount(arg);portalView(arg,false,y)};

function syncUser(p,root=document){$$('[data-u-ini]',root).forEach(e=>{e.textContent=iniOf(p.nome||p.email)});$$('[data-u-nome]',root).forEach(e=>{e.textContent=p.nome||p.email});$$('[data-u-email]',root).forEach(e=>{e.textContent=p.email})}
function syncShell(){
 const me=M();syncUser(me.perfil);
 const c=S.curso&&cursoOf(S.curso),pl=S.curso?PLANS[lvl(planoDe(S.curso))]:null;
 $$('[data-plan-n]').forEach(e=>{e.textContent=pl?pl.n:'Sem formação'});$$('[data-curso-n]').forEach(e=>{e.textContent=c?c.titulo:'Nenhuma formação liberada'});
 $$('[data-prof-link]').forEach(e=>{e.hidden=!me.professor});$$('[data-eq-link]').forEach(e=>{e.hidden=me.perfil.papel!=='equipe'});
 const n=avisos().filter(a=>a.novo).length;$$('[data-bell] .dot').forEach(d=>{d.hidden=!n});
}
function avisos(){
 const me=M(),lido=+new Date(prefs().lido||0),out=[];
 me.duvidas.forEach(d=>{const last=[...d.mensagens].reverse().find(m=>m.papel==='professor');if(last&&d.status==='respondida')out.push({t:`O professor respondeu: ${d.titulo}`,quando:last.criado_em,go:`portal/suporte/${d.id}`,novo:+new Date(last.criado_em)>lido})});
 me.mentorias.filter(m=>m.status==='proposto').forEach(m=>out.push({t:`Novo horário de mentoria proposto: ${quando(m.inicio)}`,quando:m.criado_em,go:'portal/suporte',novo:true}));
 me.matriculas.forEach(m=>{const p=proxPlantao(m.curso_id);if(p&&lvl(m.plano)>0&&new Date(p.inicio)-Date.now()<3*86400000)out.push({t:`Plantão ao vivo: ${quando(p.inicio)}`,quando:p.criado_em||p.inicio,go:'portal/suporte',novo:+new Date(p.criado_em||0)>lido})});
 return out.sort((a,b)=>new Date(b.quando)-new Date(a.quando));
}

const PV={},PB={};
const CR={inicio:['Portal do Aluno','Início'],formacoes:['Portal do Aluno','Minhas formações'],plano:['Plano de estudo',''],ia:['Minerva',''],suporte:['Suporte',''],cert:['Portal do Aluno','Certificados'],planos:['Portal do Aluno','Planos de acesso'],perfil:['Portal do Aluno','Meu perfil'],busca:['Portal do Aluno','Busca'],aula:['','']};
function viewKey(arg){const [v,...rest]=(arg||'').split('/');return [PV[v]?v:'inicio',rest]}
function portalView(arg,first,y=0){
 const main=$('#pmain');if(!main)return;
 const [v,rest]=viewKey(arg);S.view=v;S.rest=rest;S.arg=arg;
 if(S.vid){S.vid.save&&S.vid.save();S.vid=null}
 const put=()=>{
  try{main.innerHTML=PV[v](rest)}catch(e){console.error(e);main.innerHTML=errBox('Não foi possível abrir esta tela.',true)}
  links(main);main.classList.remove('pv-out');
  const c=S.curso&&cursoOf(S.curso),cr=CR[v];$('#pcrumb').innerHTML=v==='aula'?'':crumb(cr[0],cr[1]||(c?c.titulo:''));
  $$('[data-pv]').forEach(a=>{const on=a.dataset.pv===(v==='inicio'?'':v==='aula'?'formacoes':v);a.classList.toggle('on',on);on?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')});
  const pm=$('#pmenu');if(pm)pm.hidden=true;const pa=$('#pavisos');if(pa)pa.hidden=true;
  syncShell();PB[v]&&PB[v](rest);
  document.title=`${v==='inicio'?'Portal do Aluno':(cr[1]||cr[0]||'Portal do Aluno')} · EJUP`;
  if(!first){scrollTo({top:y,behavior:'instant'});main.focus({preventScroll:true})}
  reveal();$$('.seg',main).forEach(placeSeg)};
 if(first||RM){put();return}
 main.classList.add('pv-out');setTimeout(put,180);
}
const rerender=()=>{const y=scrollY;S.area==='prof'?profView(S.parg,true,y):portalView(S.arg,true,y);scrollTo({top:y,behavior:'instant'})};
async function refresh(){await loadMe(true);syncShell();rerender()}
const cursoSel=(id='p-curso')=>M().matriculas.length>1?`<label class="psel">${ic('book',16)}<select id="${id}" data-curso-sel aria-label="Formação">${M().matriculas.map(m=>`<option value="${m.curso_id}"${m.curso_id===S.curso?' selected':''}>${esc(cursoOf(m.curso_id).titulo)}</option>`).join('')}</select>${ic('down',14)}</label>`:'';
const semFormacao=()=>`${fhead(`Bem-vindo ${em('ao Portal do Aluno.')}`,'As suas formações aparecem aqui assim que a equipe da EJUP libera o acesso no e-mail da sua inscrição.')}
 <article class="card pc glow" data-r><div class="pc-i"><span class="icb">${ic('book',20)}</span><div><h2 class="h4">Nenhuma formação liberada ainda</h2><p class="sm">Entrou com o e-mail usado na inscrição? Se a formação não aparecer, fale com a equipe.</p></div></div>
 <div class="acts">${abtn('Conhecer as formações','gold','/formacoes',{s:1})}${abtn('Falar com a equipe','glass',WA('Olá, criei minha conta no Portal da EJUP e minha formação não aparece.'),{s:1,icon:false})}</div></article>`;

/* início */
PV.inicio=()=>{
 if(!S.curso)return semFormacao();
 const cid=S.curso,c=cursoOf(cid),st=stat(cid),pl=lvl(planoDe(cid)),pp=proxPlantao(cid),wk=semanaAtual(cid),wkMin=wk.filter(a=>!feita(a.id)).reduce((s,a)=>s+a.duracao_min,0);
 const abertas=M().duvidas.filter(d=>d.curso_id===cid);
 return `
 ${fhead(`Continue ${em('de onde parou.')}`,'Suas formações, o plano de estudo, a Minerva e o canal com o professor em um só lugar.',cursoSel()?`<div data-r>${cursoSel()}</div>`:'')}
 <div class="prow a">
  <article class="card pcont glow" data-r>${st.next?`<a href="/portal/aula/${st.next.id}" class="cover" aria-label="Continuar aula">`:'<span class="cover">'}<img src="${esc(c.capa||'/img/curso1.jpg')}" alt="">${st.next?'</a>':'</span>'}
   <div><p class="lbl g">${st.fim?'Concluída':st.iniciada?'Em andamento':'Não iniciada'}${st.next&&!st.fim?' · '+esc(lesL(st.next)):''}</p><h2 class="h3">${esc(c.titulo)}</h2><p class="body">${st.next&&!st.fim?esc(lesT(st.next)):st.fim?'Você concluiu todas as aulas.':''}</p>${barH(st.pct)}<p class="sm">${st.pct}% concluído · ${hm(st.min)} de ${hm(st.tot)}</p>${st.next?btn(st.fim?'Rever aulas':st.iniciada?'Continuar aula':'Começar','gold',{go:`portal/aula/${st.next.id}`}):''}</div></article>
  <article class="card pc" data-r><div class="pc-h"><h2 class="h4">Esta semana</h2><span class="tag gold">${hm(wkMin)} de ${pace()}h</span></div><ul class="plan">${weekItems(wk)}</ul>${lk('Ver plano de estudo',{go:'portal/plano'})}</article>
 </div>
 <div class="prow b">
  <article class="card pc glow" data-r><div class="pc-i">${mnv('s')}<div><h2 class="h4">Minerva</h2><p class="sm">Responde na hora com o conteúdo cadastrado pela EJUP e pelos professores.</p></div></div>
   <div class="chips">${['Quando recebo o certificado?','Como funciona o plano de estudo?'].map(q=>`<button type="button" class="chip sug" data-ai-go="${q}">${q}</button>`).join('')}</div>${lk('Perguntar à Minerva',{go:'portal/ia'})}</article>
  <article class="card pc glow" data-r><div class="pc-i"><span class="icb">${ic('pen',20)}</span><div><h2 class="h4">Suporte do professor</h2><p class="sm">Dúvidas por escrito, com a aula e o minuto anexados.</p></div></div>
   <div class="tags">${pl?[['respondida','respondida','respondidas','gold'],['professor','com o professor','com o professor','']].map(([s,a,b,cl])=>{const n=abertas.filter(d=>d.status===s).length;return n?tag(`${n} ${n===1?a:b}`,cl):''}).join('')||tag('Nenhuma dúvida aberta'):tag('Plano Acompanhado')}</div>${pl?lk('Ver minhas dúvidas',{go:'portal/suporte'}):lk('Conhecer os planos',{go:'portal/planos'})}</article>
  <article class="card pc glow" data-r><div class="pc-i"><span class="icb">${ic('video',20)}</span><div><h2 class="h4">Plantão ao vivo</h2><p class="sm">Encontro on-line em grupo com o professor. Fica gravado.</p></div></div>
   <div class="tags">${tag(pl?(pp?quando(pp.inicio):'Data a definir'):'Plano Acompanhado',pl&&pp?'gold':'')}</div>${pl?lk(pp?'Ver detalhes':'Ver suporte',{go:'portal/suporte'}):lk('Conhecer os planos',{go:'portal/planos'})}</article>
 </div>
 <div class="prow c">
  <article class="card pc" data-r><div class="pc-h"><h2 class="h4">Minhas formações</h2>${lk('Ver todas',{go:'portal/formacoes'})}</div>
   ${M().matriculas.map(m=>{const x=cursoOf(m.curso_id),s=stat(m.curso_id);return `<div class="myc"><div><p>${esc(x.titulo)}</p><p class="sm">${x.horas} horas · ${s.iniciada?`${s.done} de ${s.n} aulas`:'ainda não iniciada'}</p></div>${s.iniciada||s.fim?`<p class="sm">${s.pct}%</p>`:s.next?btn('Começar','glass',{s:1,icon:false,go:`portal/aula/${s.next.id}`}):''}</div>`}).join('')}</article>
  <article class="card pc" data-r><div class="pc-i"><span class="icb">${ic('award',20)}</span><div><h2 class="h4">Certificados</h2><p class="sm">Liberado ao concluir 100% da formação.</p></div></div>${barH(st.pct)}<p class="sm">${st.pct}% concluído${st.left?` · faltam ${hm(st.left)}`:''}</p>${lk('Ver certificados',{go:'portal/cert'})}</article>
 </div>`};

/* minhas formações */
PV.formacoes=()=>{
 if(!S.curso)return semFormacao();
 const ms=M().matriculas,cls=m=>{const s=stat(m.curso_id);return s.fim?'ok':s.iniciada?'and':'nao'};
 const n=k=>ms.filter(m=>cls(m)===k).length;
 return `${fhead(`Suas ${em('formações.')}`,'O que você está cursando, o que ainda vai começar e o que já concluiu.')}
 <div class="ptit mid" data-r>${segH('pf-seg',[['todas',`Todas · ${ms.length}`],['and',`Em andamento · ${n('and')}`],['nao',`Não iniciadas · ${n('nao')}`],['ok',`Concluídas · ${n('ok')}`]],S.ff,'data-ff')}${lk('Conhecer outras formações',{go:'formacoes'})}</div>
 <div id="pf-list" class="pflist" data-r>${formList()}</div>`};
function formList(){
 const f=S.ff,ms=M().matriculas;let h='';const outros=[];
 ms.forEach(m=>{const c=cursoOf(m.curso_id),s=stat(m.curso_id),k=s.fim?'ok':s.iniciada?'and':'nao';if(f!=='todas'&&f!==k)return;
  if(k==='and'&&!h){const mods=modsOf(c.id);
   h=`<article class="card pcont pfeat glow"><a href="/portal/aula/${s.next.id}" class="cover" aria-label="Continuar aula"><img src="${esc(c.capa||'/img/curso1.jpg')}" alt=""></a>
   <div><div class="tags">${tag('Em andamento','gold')}${c.area?tag(esc(c.area)):''}</div><h2 class="h3">${esc(c.titulo)}</h2><p class="sm">${c.professores?`Com ${esc(c.professores)} · `:''}${c.horas} horas · ${plural(mods.length,'módulo','módulos')}</p>
    ${barH(s.pct)}<div class="pc-h wr" style="width:100%"><span class="sm" style="color:var(--branco)">${s.pct}% concluído · ${hm(s.min)} de ${hm(s.tot)}</span><span class="sm">${s.left?`Conclusão prevista em ${plural(s.weeks,'semana','semanas')}`:''}</span></div>
    <a href="/portal/aula/${s.next.id}" class="pnext"><span><span class="lbl g">Próxima aula · ${esc(lesPos(s.next))}</span><strong>${esc(lesT(s.next))}</strong></span><span class="sm">${s.next.duracao_min} min</span></a>
    <div class="acts">${btn('Continuar aula','gold',{go:`portal/aula/${s.next.id}`})}${btn('Plano de estudo','glass',{go:'portal/plano',icon:false,attr:`data-set-curso="${c.id}"`})}</div></div></article>
   <article class="card pc" style="gap:0"><div class="pc-h" style="padding-bottom:16px"><h2 class="h4">Módulos desta formação</h2><span class="sm">${s.done} de ${s.n} aulas</span></div><ul class="pml pfm">${mods.map(md=>{const as=aulasDoMod(md.id),d=as.filter(a=>feita(a.id)).length,ok=as.length&&d>=as.length,cu=s.next&&s.next.modulo_id===md.id&&!ok;return `<li><a class="pmr" href="/portal/aula/${(as.find(a=>!feita(a.id))||as[0]||{}).id||''}"><span class="pmk${ok?' on':cu?' cur':''}">${ok?ic('check',12):''}</span><span class="lbl${ok||cu?' g':''}">Módulo ${pad(md.ordem)}</span><span class="t">${esc(md.titulo)}</span><span class="sm${cu?' g':''}">${d?`${d} de ${as.length} aulas`:plural(as.length,'aula','aulas')}${cu?' · em andamento':''}</span></a></li>`}).join('')}</ul></article>`;return}
  outros.push(`<article class="card pfc glow"><span class="cover"><img src="${esc(c.capa||'/img/curso1.jpg')}" alt=""></span><div>${tag(k==='ok'?'Concluída':k==='and'?'Em andamento':'Não iniciada',k==='nao'?'':'gold')}<h3 class="h4">${esc(c.titulo)}</h3><p class="sm">${c.horas} horas · ${plural(s.n,'aula','aulas')}${m.prof?' · você é professor':''}</p>
   <p class="sm" style="color:var(--w82)">${k==='ok'?(m.concluida_em?`Concluída em ${dia(m.concluida_em)}.`:'Todas as aulas concluídas.'):k==='and'?`${s.pct}% concluído.`:s.n?'Você pode começar quando quiser. O plano de estudo distribui as aulas pelo seu tempo.':'O programa desta formação está sendo publicado.'}</p>
   <div class="acts">${k==='ok'?btn('Ver certificado','gold',{s:1,go:'portal/cert'})+(s.as[0]?btn('Rever aulas','glass',{s:1,icon:false,go:`portal/aula/${s.as[0].id}`}):''):s.next?btn(k==='and'?'Continuar':'Começar','glass',{s:1,icon:false,go:`portal/aula/${s.next.id}`}):''}</div></div></article>`)});
 if(outros.length)h+=`${f==='todas'&&h?'<h2 class="h4">Outras formações</h2>':''}<div class="pfo">${outros.join('')}</div>`;
 return h||`<p class="sm" style="padding:24px 0">Nenhuma formação com este filtro.</p>`;
}

/* aula */
PV.aula=rest=>{
 const a=aulaOf(rest[0]);if(!a)return errBox('Aula não encontrada ou sem acesso.');
 const cid=cursoDaAula(a);if(S.curso!==cid){S.curso=cid}
 S.aula=a.id;S.t=+rest[1]||((prog(a.id)||{}).segundo)||0;S.seek=!!rest[1];
 const mod=modOf(a),as=aulasDoMod(mod.id),all=aulasOf(cid),i=all.indexOf(a),c=cursoOf(cid);
 return `<div class="pl2">
  <div class="pcol">
   <div class="pplayer" id="pp" data-r><img src="${esc(c.capa||'/img/curso1.jpg')}" alt=""><span class="pp-msg sm">Carregando a aula…</span></div>
   <div class="ptit" data-r><div><p class="lbl g">${esc(lesPos(a))}</p><h1 class="h3">${esc(lesT(a))}</h1></div>${doneBtn(a)}</div>
   <div class="ptit mid" data-r>${`<div class="seg" id="pp-tabs"><span class="seg-ind"></span>${[['sobre','Sobre a aula','Sobre'],['mat','Materiais','Materiais'],['notas','Anotações','Notas']].map(([k,l,s])=>`<button type="button" data-ptab="${k}"${k===S.tab?' class="on"':''}><span class="t-l">${l}</span><span class="t-s">${s}</span></button>`).join('')}</div>`}
    <div class="acts">${i>0?`<a href="/portal/aula/${all[i-1].id}" class="btn s b-glass pnv" aria-label="Aula anterior">${ic('back',14)}<span>Aula anterior</span></a>`:''}${i<all.length-1?`<a href="/portal/aula/${all[i+1].id}" class="btn s b-glass pnv" aria-label="Próxima aula"><span>Próxima aula</span>${ic('fwd',14)}</a>`:''}</div></div>
   <div id="pp-panel" data-r></div>
  </div>
  <aside class="pcol">
   <article class="card pc" data-r><div class="pc-h"><h2 class="h4">Neste módulo</h2><span class="sm">${as.filter(x=>feita(x.id)).length} de ${as.length}</span></div><ul class="pml" id="pm-list">${pmItems(a,as)}</ul></article>
   <article class="card pc glow" data-r><div class="pc-i">${mnv('m')}<div><h2 class="h4">Minerva nesta aula</h2><p class="sm">Pergunte sobre o que acabou de ver.</p></div></div>
    <div><span class="tag" id="pa-ctx">${esc(lesL(a))}</span></div>
    <div class="ailog" id="ai-log" data-scope="aula" aria-live="polite"><p class="msgb a">Pergunte sobre o que acabou de ver. Quando a resposta vier de uma aula, mostro o trecho.</p></div>
    <form class="aiform" id="ai-f" novalidate><label class="field"><input id="ai-q" placeholder="Pergunte sobre esta aula" aria-label="Pergunta para a Minerva sobre esta aula" autocomplete="off"></label><button type="submit" class="pico g" aria-label="Enviar pergunta">${ic('send',16)}</button></form>
    <div class="phand"><p class="sm">Não resolveu? Envie esta dúvida ao professor, já com a aula e o minuto anexados.</p>${lk('Enviar ao professor',{attr:'data-handoff'})}</div></article>
  </aside></div>`};
/* atualiza só a lista do módulo e o botão, sem recarregar o vídeo */
function aulaSide(){const a=aulaOf(S.aula),l=$('#pm-list');if(!a||!l)return;const as=aulasDoMod(a.modulo_id);l.innerHTML=pmItems(a,as);const c=l.closest('.pc').querySelector('.pc-h .sm');if(c)c.textContent=`${as.filter(x=>feita(x.id)).length} de ${as.length}`;const b=$('#pp-done');if(b)b.outerHTML=doneBtn(a)}
const pmItems=(a,as)=>as.map(x=>{const d=feita(x.id),cu=x.id===a.id;return `<li${d?' class="dn"':''}><a class="pmr" href="/portal/aula/${x.id}"${cu?' aria-current="true"':''}><span class="pmk${d?' on':cu?' cur':''}">${d?ic('check',12):''}</span><span class="t">${esc(/^aula \d+$/i.test(x.titulo)?'Aula '+x.ordem:x.ordem+'. '+x.titulo)}</span><span class="sm${cu?' g':''}">${cu?'assistindo':x.duracao_min+' min'}</span></a></li>`}).join('');
const doneBtn=a=>{const d=feita(a.id);return `<button type="button" class="btn ${d?'b-glass':'b-gold'}" id="pp-done" aria-pressed="${d}">${d?`${ic('check',16)}<span>Concluída</span>`:'<span>Marcar como concluída</span>'}</button>`};
PB.aula=async()=>{
 const a=aulaOf(S.aula);if(!a)return;
 const c=cursoOf(cursoDaAula(a));$('#pcrumb').innerHTML=crumb(c.titulo,lesL(a));document.title=`${lesT(a)} · EJUP`;
 renderTab();
 const id=a.id;let d=S.aulas[id];
 if(!d){try{d=S.aulas[id]=await api('aula',{query:`&id=${encodeURIComponent(id)}`})}catch(e){const m=$('#pp .pp-msg');if(m)m.textContent=e.message;return}}
 if(S.aula!==id||!$('#pp'))return;
 player(d);if(S.tab==='mat')renderTab();
};
function player(d){
 const p=$('#pp'),v=d.video;
 if(!v){p.querySelector('.pp-msg').textContent='O vídeo desta aula ainda não foi publicado. Os materiais e as anotações já estão disponíveis.';return}
 p.classList.add('live');
 if(v.tipo==='arquivo'){
  p.innerHTML=`<video controls playsinline preload="metadata" src="${esc(v.url)}"></video>`;const el=$('video',p);let last=0;
  const save=(force)=>{const t=Math.floor(el.currentTime||0);if(!force&&Math.abs(t-last)<20)return;last=t;api('progresso',{body:{aula:S.aula,segundo:t}}).then(()=>{const x=prog(S.aula);x?x.segundo=t:M().progresso.push({aula_id:S.aula,concluida:false,segundo:t,atualizado_em:new Date().toISOString()})}).catch(()=>{})};
  el.addEventListener('loadedmetadata',()=>{if(S.t>5&&S.t<el.duration-5)el.currentTime=S.t},{once:true});
  el.addEventListener('timeupdate',()=>{S.t=el.currentTime;save()});el.addEventListener('pause',()=>save(true));
  el.addEventListener('ended',()=>{if(!feita(S.aula))marcar(S.aula,true,'Aula assistida até o fim e marcada como concluída.')});
  S.vid={el,save:()=>save(true),seek:t=>{el.currentTime=t;el.play().catch(()=>{})}};
  if(S.seek)el.addEventListener('loadedmetadata',()=>el.play().catch(()=>{}),{once:true});
  return}
 const src=t=>v.provedor==='youtube'?v.url+(t?`&start=${Math.floor(t)}`:'')+(S.seek?'&autoplay=1':''):v.provedor==='vimeo'&&t?`${v.url}#t=${Math.floor(t)}s`:v.url;
 p.innerHTML=`<iframe src="${esc(src(S.seek?S.t:0))}" title="${esc(lesT(aulaOf(S.aula)))}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
 S.vid={seek:t=>{S.seek=true;$('iframe',p).src=src(t)}};
}
function renderTab(){
 const p=$('#pp-panel'),a=aulaOf(S.aula);if(!p||!a)return;
 if(S.tab==='mat'){const d=S.aulas[a.id];p.innerHTML=`<article class="card pc" style="gap:0"><h2 class="h4" style="padding-bottom:16px">Materiais da aula</h2>${!d?'<p class="sm">Carregando…</p>':d.materiais.length?d.materiais.map(m=>`<a class="pmat" href="${esc(m.url)}" target="_blank" rel="noopener"><span>${ic('file',18)}<span>${esc(m.nome)}</span></span><span class="sm">${esc(m.tipo||'Abrir')}</span></a>`).join(''):'<p class="sm">Esta aula não tem materiais anexos.</p>'}</article>`;return}
 if(S.tab==='notas'){const n=M().notas.find(x=>x.aula_id===a.id);p.innerHTML=`<article class="card pc"><h2 class="h4">Suas anotações</h2><label class="fl"><span>Ficam guardadas na sua conta, ligadas a esta aula${n&&n.segundo?` (último ponto: ${mmss(n.segundo)})`:''}</span><textarea class="inp" id="pp-note" placeholder="Escreva o que quer lembrar desta aula"></textarea></label><div class="pc-h wr"><p class="msg" aria-live="polite"></p>${btn('Salvar anotação','glass',{s:1,icon:false,attr:'data-note-save'})}</div></article>`;$('#pp-note').value=n?n.texto:'';return}
 p.innerHTML=`<article class="card pc"><h2 class="h4">Nesta aula</h2><p class="body">${a.sobre?esc(a.sobre):`Aula ${a.ordem} do ${esc(modOf(a).titulo)}.`}</p>${a.topicos.length?`<ul class="pck">${a.topicos.map(x=>`<li>${ic('check',16)}<span>${esc(x)}</span></li>`).join('')}</ul>`:''}</article>`;
}
async function marcar(id,on,msg){
 const x=prog(id);const before=x?{...x}:null;
 if(x){x.concluida=on;x.atualizado_em=new Date().toISOString()}else M().progresso.push({aula_id:id,concluida:on,segundo:0,atualizado_em:new Date().toISOString()});
 const b=$('#pp-done');if(b&&S.aula===id)b.outerHTML=doneBtn(aulaOf(id));
 try{const r=await api('progresso',{body:{aula:id,concluida:on}});
  if(r.certificado){const m=matOf(cursoDaAula(aulaOf(id)));if(m){m.certificado=r.certificado;m.concluida_em=r.concluida_em||new Date().toISOString()}toast('Formação concluída. O seu certificado está em Certificados.')}
  else if(msg||on)toast(msg||'Aula concluída. O plano de estudo foi atualizado.');
  syncShell();if(S.view==='aula')aulaSide();else rerender();
 }catch(e){if(before)Object.assign(x,before);else M().progresso=M().progresso.filter(p=>p.aula_id!==id);toast(e.message);rerender()}
}

/* plano de estudo */
PV.plano=()=>{
 if(!S.curso)return semFormacao();
 const cid=S.curso,st=stat(cid),w=weeksPlan(cid),d=new Date();d.setDate(d.getDate()+st.weeks*7);
 const pl=lvl(planoDe(cid)),pp=proxPlantao(cid),ds=days().map(i=>DAYS[i]),dl=ds.length>1?ds.slice(0,-1).join(', ')+' e '+ds[ds.length-1]:ds[0];
 const wk0=semanaAtual(cid);
 return `${fhead(`Seu plano ${em('de estudo.')}`,'Você diz quanto tempo tem por semana. O portal distribui as aulas pendentes e refaz a distribuição quando a rotina muda.',cursoSel()?`<div data-r>${cursoSel()}</div>`:'')}
 <div class="prow p1">
  <article class="card pc pcfg" data-r>
   <div class="pg"><p class="lbl">Tempo por semana</p>${segH('pl-seg',[[2,'2h'],[4,'4h'],[6,'6h'],[8,'8h']],pace(),'data-pace')}<p class="sm">Mude quando quiser</p></div>
   <div class="pg"><p class="lbl">Dias de estudo</p><div class="pdays">${'STQQSSD'.split('').map((x,i)=>`<button type="button" class="pday${days().includes(i)?' on':''}" data-day="${i}" aria-pressed="${days().includes(i)}" aria-label="${DAYN[i]}">${x}</button>`).join('')}</div><p class="sm">${dl.charAt(0).toUpperCase()+dl.slice(1)}</p></div>
   <div class="pg grow"><p class="lbl">Lembretes</p>${sw('mail','Por e-mail nos dias de estudo',!!prefs().mail)}${M().email?'':'<p class="sm">O envio de lembretes começa quando a EJUP ligar os e-mails do portal. A sua escolha já fica guardada.</p>'}</div>
  </article>
  <article class="card pc" data-r><p class="lbl g">Conclusão prevista</p><p class="pbig">${st.fim?'Concluída':plural(st.weeks,'semana','semanas')}</p>${barH(st.pct)}<div class="pc-h"><span class="sm" style="color:var(--branco)">${st.pct}% concluído</span><span class="sm">${hm(st.min)} de ${hm(st.tot)}</span></div><p class="sm">${st.fim?'Certificado liberado.':`Até ${d.toLocaleDateString('pt-BR',{day:'numeric',month:'long'})}, com ${pace()}h por semana.`}</p></article>
 </div>
 <div class="pweeks" id="pl-weeks" data-r>${st.fim?'':w.map((ids,n)=>{const list=n===0?wk0:ids;return `<article class="card pc"><div class="pc-h"><h2 class="h4">Semana ${n+1}</h2>${n===0?tag('Esta semana','gold'):n===1?tag('Próxima'):''}</div><p class="sm">${hm(list.filter(a=>!feita(a.id)).reduce((s,a)=>s+a.duracao_min,0))} de ${pace()}h</p><ul class="plan">${weekItems(list)}</ul>${n===0&&pl>0&&pp&&new Date(pp.inicio)-Date.now()<7*86400000?`<a class="pev" href="/portal/suporte">${ic('video',18)}<span><strong>Plantão ao vivo</strong><span class="sm">${quando(pp.inicio)}</span></span></a>`:''}</article>`}).join('')}
  <div class="pcol"><article class="card pc"><span class="icb">${ic('award',20)}</span><h2 class="h4">Certificado ao concluir</h2><p class="sm">Liberado quando a última aula for marcada como concluída.</p></article>
  <article class="card pc dash"><span class="icb">${ic('refresh',20)}</span><h2 class="h4">A semana não rendeu?</h2><p class="sm">O plano redistribui as aulas que ficaram para trás a partir de hoje, sem perder o que você já fez.</p>${btn('Reorganizar plano','glass',{s:1,icon:false,attr:'data-reorg'})}</article></div></div>`};

/* Minerva */
const chatOf=cid=>S.chat[cid]||(S.chat[cid]=[]);
PV.ia=()=>{
 if(!S.curso)return semFormacao();
 const hist=M().historico.filter(h=>h.curso_id===S.curso),hoje=new Date().toDateString();
 const grupos=[['Hoje',hist.filter(h=>new Date(h.criado_em).toDateString()===hoje)],['Antes',hist.filter(h=>new Date(h.criado_em).toDateString()!==hoje)]].filter(g=>g[1].length);
 return `<h1 class="vh">Minerva</h1>
 <div class="pl3">
  <aside class="card pc phist" data-r><button type="button" class="btn s b-glass full" data-ai-new>${ic('plus',14)}<span>Nova conversa</span></button>
   ${grupos.length?grupos.map(([g,l])=>`<div class="phg"><p class="lbl">${g}</p>${l.slice(0,8).map(h=>`<button type="button" class="pconv" data-ai-sug="${esc(h.pergunta)}">${esc(h.pergunta)}</button>`).join('')}</div>`).join(''):'<p class="sm">As suas perguntas aparecem aqui.</p>'}</aside>
  <article class="card pc pchat glow" data-r>
   <div class="pc-i mnv-hd">${mnv('l')}<div><h2 class="h4">Minerva</h2><p class="sm">Responde com o conteúdo cadastrado pela EJUP e pelos professores desta formação.</p></div></div>
   ${cursoSel('ai-course')?`<div class="pc-h wr">${cursoSel('ai-course')}</div>`:''}
   <div class="ailog lgc" id="ai-log" aria-live="polite"></div>
   <div class="chips">${['Quando recebo o certificado?','Como funciona o plano de estudo?','Como mando uma dúvida ao professor?'].map(q=>`<button type="button" class="chip sug" data-ai-sug="${q}">${q}</button>`).join('')}</div>
   <form class="aiform" id="ai-f" novalidate><label class="field"><input id="ai-q" placeholder="Pergunte à Minerva" aria-label="Pergunta para a Minerva" autocomplete="off"></label><button type="submit" class="pico g" aria-label="Enviar pergunta">${ic('send',16)}</button></form>
   <p class="sm">A Minerva é apoio ao estudo e não substitui a análise de um advogado. O que ela não souber, envie ao professor.</p>
  </article></div>`};
PB.ia=()=>{const log=$('#ai-log');if(!log)return;const ch=chatOf(S.curso);
 log.innerHTML=`<p class="msgb a">Olá. Sou a Minerva, da EJUP. Aqui respondo sobre <strong></strong>: pergunte sobre as aulas, o plano de estudo ou o suporte.</p>`;$('strong',log).textContent=cursoOf(S.curso).titulo;
 ch.forEach(x=>drawAnswer(log,x.q,x.r,true));
 if(S.askQ){const q=S.askQ;S.askQ='';aiAsk(q)}};
function drawAnswer(log,q,r,instant){
 const u=document.createElement('p');u.className='msgb u';u.textContent=q;log.appendChild(u);
 const a=document.createElement('div');a.className='msgb a'+(r?'':' typing');a.innerHTML=r?'':'<i></i><i></i><i></i>';log.appendChild(a);
 if(r)fillAnswer(log,a,r,instant);return a;
}
function fillAnswer(log,a,r,instant){
 const scope=log.dataset.scope;a.classList.remove('typing');a.innerHTML='<p></p>';$('p',a).textContent=r.reply;
 if(r.fonte){const x=aulaOf(r.fonte.aula);if(x){const same=scope==='aula'&&r.fonte.aula===S.aula;a.insertAdjacentHTML('beforeend',`<p class="lbl">De onde veio</p><div class="tags"><button type="button" class="tag" data-src="${x.id}" data-seg="${r.fonte.segundo||0}">${same?'Rever em '+mmss(r.fonte.segundo):esc(lesL(x))+(r.fonte.segundo?' · '+mmss(r.fonte.segundo):'')}</button>${r.professor?'<span class="tag">Resposta do professor</span>':''}</div>`)}}
 if(r.sugestoes&&r.sugestoes.length)a.insertAdjacentHTML('beforeend',`<div class="chips">${r.sugestoes.map(s=>`<button type="button" class="chip sug" data-ai-sug="${esc(s)}">${esc(s)}</button>`).join('')}</div>`);
 if(r.log&&!instant&&scope!=='aula'){const f=document.createElement('div');f.className='aifb';f.dataset.log=r.log;f.innerHTML=`<span class="sm">Esta resposta ajudou?</span><button type="button" class="btn s b-glass" data-fb="1"><span>Sim</span></button><button type="button" class="btn s b-glass" data-fb="0"><span>Não, enviar ao professor</span>${ic('ar',14)}</button>`;log.appendChild(f)}
 if(log.dataset.scope==='aula')log.scrollTop=log.scrollHeight;else if(!instant)a.scrollIntoView({behavior:RM?'auto':'smooth',block:'nearest'});
}
async function aiAsk(q){
 q=(q||'').trim();const log=$('#ai-log');if(!q||!log)return;
 const aula=log.dataset.scope==='aula',cid=aula?cursoDaAula(aulaOf(S.aula)):S.curso,m=$('[data-mnv]',log.closest('.pc'));
 mnvSet(m,true);S.lastQ=q;const a=drawAnswer(log,q,null);const t0=Date.now();
 let r;try{r=await api('minerva',{body:{curso:cid,pergunta:q,aula:aula?S.aula:undefined}})}catch(e){r={reply:e.message}}
 await new Promise(ok=>setTimeout(ok,Math.max(0,(RM?0:600)-(Date.now()-t0))));
 if(!a.isConnected)return;fillAnswer(log,a,r);if(!aula)chatOf(cid).push({q,r:{...r,log:null}});
 M().historico.unshift({curso_id:cid,pergunta:q,criado_em:new Date().toISOString()});
}

/* suporte */
const CH=[['spark','Minerva','Na hora, a qualquer momento','Responde com o conteúdo cadastrado e mostra a aula de onde veio a resposta.',0,'Perguntar à Minerva','ia'],['pen','Dúvida ao professor','Por escrito','Você escreve, anexa a aula e recebe a resposta do professor aqui e por e-mail.',1,'Escrever dúvida','new'],['video','Plantão ao vivo','Em grupo','Encontro on-line com o professor para as dúvidas da turma. Fica gravado.',1,'Ver próxima data','live'],['user','Mentoria individual','1 a 1 · com hora marcada','Conversa individual com o professor sobre o seu caso de estudo.',2,'Agendar encontro','ment']];
PV.suporte=rest=>{
 if(!S.curso)return semFormacao();
 if(rest[0]){const d=M().duvidas.find(x=>String(x.id)===rest[0]);if(d){S.sel=d.id;S.curso=d.curso_id}}
 const cid=S.curso,pl=lvl(planoDe(cid));
 return `${fhead(`Quem responde ${em('a sua dúvida.')}`,'Comece pela Minerva, que responde na hora. Se não resolver, a dúvida segue para o professor com a aula e o minuto já anexados.',`<div class="acts" data-r>${cursoSel()}${pl?btn('Nova dúvida','gold',{attr:'data-th-new'}):''}</div>`)}
 <div class="pch" data-r>${CH.map(([i,t,mt,d,min,cta,act])=>{const lock=pl<min,meta=act==='new'?`Por escrito · ${pl===2?'prioridade, 1 dia útil':'até 2 dias úteis'}`:mt;
  const inner=`<span class="pch-h"><span class="icb">${ic(i,20)}</span>${lock?ic('lock',16):''}</span><span class="h4">${t}</span><span class="sm g">${meta}</span><span class="sm">${d}</span><span class="pch-f">${tag(lock?'Plano '+PLANS[min].n:min?'Incluído no seu plano':'Todos os planos',lock?'':'gold')}<span class="lk"><span>${lock?'Conhecer o plano':cta}</span>${ic('ar',14)}</span></span>`;
  return lock?`<a href="/portal/planos" class="card pchn lock">${inner}</a>`:act==='ia'?`<a href="/portal/ia" class="card pchn glow">${inner}</a>`:act==='new'?`<button type="button" class="card pchn glow" data-th-new>${inner}</button>`:`<button type="button" class="card pchn glow" data-anchor="${act==='live'?'p-live':'p-ment'}">${inner}</button>`}).join('')}</div>
 <a class="card peq" href="${WA('Olá, preciso de ajuda com acesso, pagamento ou certificado no Portal da EJUP.')}" target="_blank" rel="noopener" data-r><span>${ic('help',18)}<strong>Acesso, pagamento ou certificado?</strong><span class="sm">Isso é com a equipe EJUP, em todos os planos.</span></span><span class="lk"><span>Falar com a equipe</span>${ic('ar',14)}</span></a>
 <div class="pl4"><article class="card pc" data-r><div class="pc-h"><h2 class="h4">Minhas dúvidas</h2><span class="sm" id="th-n"></span></div><div id="th-list"></div></article><article class="card pc" id="th-det" data-r></article></div>
 ${pl?`<div class="prow c2"><article class="card pc glow" id="p-live" data-r></article>${pl>1?`<article class="card pc" id="p-ment" data-r></article>`:`<a class="card pc dash" id="p-ment" href="/portal/planos" data-r><span class="icb">${ic('lock',20)}</span><h2 class="h4">Mentoria individual</h2><p class="sm">Encontros 1 a 1 com o professor fazem parte do plano Mentoria.</p><span class="lk"><span>Conhecer o plano</span>${ic('ar',14)}</span></a>`}</div>`:''}`};
PB.suporte=()=>{renderThreads();renderLive();renderMent()};
function renderThreads(){
 const l=$('#th-list');if(!l)return;const ds=M().duvidas;$('#th-n').textContent=ds.length;
 if(S.sel==null&&S.draft==null&&ds.length)S.sel=ds[0].id;
 l.innerHTML=ds.length?ds.map(d=>`<button type="button" class="pth${S.sel===d.id?' on':''}" data-th="${d.id}"><span class="t"></span><span class="pth-f"><span class="sm"></span>${tag(ST[d.status],d.status==='respondida'?'gold':'')}</span></button>`).join(''):'<p class="sm" style="padding:8px 0">Nenhuma dúvida enviada ainda.</p>';
 $$('.pth',l).forEach((b,i)=>{const d=ds[i],a=d.aula_id&&aulaOf(d.aula_id);$('.t',b).textContent=d.titulo;$('.sm',b).textContent=(a?lesL(a)+(d.segundo?' · '+mmss(d.segundo):''):cursoOf(d.curso_id)?.titulo||'')+' · '+rel(d.criado_em)});
 renderThread();
}
function renderThread(){
 const d=$('#th-det');if(!d)return;
 if(S.sel==='new'){
  const pl=lvl(planoDe(S.curso));
  if(pl<1){d.innerHTML=`<div class="okbox"><span class="icb">${ic('lock',20)}</span><p class="h4">A dúvida ao professor faz parte do plano Acompanhado.</p><p class="sm">No plano Essencial, a Minerva responde na hora.</p><div class="acts" style="justify-content:center">${btn('Ver planos','gold',{go:'portal/planos',s:1})}${btn('Perguntar à Minerva','glass',{go:'portal/ia',s:1,icon:false})}</div></div>`;links(d);return}
  const dr=S.draft||{},a=dr.aula&&aulaOf(dr.aula);
  d.innerHTML=`<div class="pc-h"><h2 class="h4">Nova dúvida ao professor</h2>${btn('Cancelar','line',{s:1,icon:false,attr:'data-th-cancel'})}</div>
   <div class="tags">${tag(esc(cursoOf(S.curso).titulo))}${a?tag('Anexado: '+esc(lesL(a))+(dr.segundo?' · '+mmss(dr.segundo):'')):''}${dr.ia?tag('Perguntou à Minerva antes'):''}</div>
   <form id="sup-f" class="pform" novalidate><label class="fl"><span>Sua dúvida</span><textarea class="inp" id="sup-q" placeholder="Escreva a dúvida com o contexto que o professor precisa para responder."></textarea></label><div class="pc-h wr"><p class="msg" aria-live="polite">Resposta em até ${plural(sla(planoDe(S.curso)),'dia útil','dias úteis')}, aqui e por e-mail.</p>${btn('Enviar ao professor','gold',{type:'submit'})}</div></form>`;
  $('#sup-q').value=dr.q||'';return}
 const t=M().duvidas.find(x=>x.id===S.sel);if(!t){d.innerHTML=`<div class="okbox"><span class="icb">${ic('chat',20)}</span><p class="h4">Suas dúvidas aparecem aqui.</p><p class="sm">Escolha uma dúvida na lista ou escreva uma nova.</p></div>`;return}
 const a=t.aula_id&&aulaOf(t.aula_id),lv=t.status==='professor'||t.status==='plantao'?1:2;
 d.innerHTML=`<div class="pc-h top"><h2 class="h4" id="th-t"></h2>${tag(ST[t.status],t.status==='respondida'?'gold':'')}</div>
  <ol class="pst">${['Enviada','Com o professor','Respondida'].map((s,i)=>`<li class="${i<=lv?'on':''}${lv===1&&i===1?' cur':''}"><i>${ic('check',12)}</i><span>${s}</span></li>`).join('')}</ol>
  ${t.mensagens.map((m,i)=>`<div class="pmsg${m.papel==='professor'?' ans':''}"><div class="pc-h">${m.papel==='professor'?`<span class="pwho"><span class="pav g">${ic('user',14)}</span><strong>Professor da formação</strong></span>`:'<strong>Você</strong>'}<span class="sm">${rel(m.criado_em)}</span></div><p class="body" data-m="${i}"></p>${i===0?`<div class="tags">${a?`<a class="tag" href="/portal/aula/${a.id}${t.segundo?'/'+t.segundo:''}">${esc(lesL(a))}${t.segundo?' · '+mmss(t.segundo):''}</a>`:''}${t.via_minerva?tag('Perguntou à Minerva antes'):''}</div>`:''}</div>`).join('')}
  ${t.status==='professor'?`<p class="sm pwait">${ic('clock',14)}<span>O professor responde em até ${plural(sla(planoDe(t.curso_id)),'dia útil','dias úteis')}. Você recebe um aviso por e-mail.</span></p>`:t.status==='plantao'?`<p class="sm pwait">${ic('video',14)}<span>O professor levou esta dúvida para o próximo plantão ao vivo.</span></p>`:''}
  ${t.status!=='encerrada'?`<form id="th-f" class="pform" novalidate><label class="fl"><span>${t.status==='respondida'?'Continuar a conversa':'Acrescentar algo à dúvida'}</span><textarea class="inp" id="th-r" placeholder="Escreva aqui"></textarea></label><div class="acts">${btn('Enviar','gold',{s:1,type:'submit'})}${t.status==='respondida'?btn('Resolveu, obrigado','glass',{s:1,icon:false,attr:'data-th-ok'}):''}</div><p class="msg" aria-live="polite"></p></form>`:''}`;
 $('#th-t').textContent=t.titulo;$$('[data-m]',d).forEach(p=>{p.textContent=t.mensagens[+p.dataset.m].texto});links(d);
}
const ics=p=>{const z=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),e=new Date(+new Date(p.inicio)+p.duracao_min*60000),c=cursoOf(p.curso_id);
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//EJUP//Portal//PT','BEGIN:VEVENT',`UID:plantao-${p.id}@ejup.com.br`,`DTSTAMP:${z(Date.now())}`,`DTSTART:${z(p.inicio)}`,`DTEND:${z(e)}`,`SUMMARY:Plantão ao vivo · ${c?c.titulo:'EJUP'}`,`DESCRIPTION:${p.link||'O link aparece no Portal do Aluno.'}`,p.link?`URL:${p.link}`:'','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n')};
function renderLive(){
 const w=$('#p-live');if(!w)return;const p=proxPlantao(S.curso),past=M().plantoes.filter(x=>x.curso_id===S.curso&&x.gravacao).sort((a,b)=>new Date(b.inicio)-new Date(a.inicio));
 const aberto=p&&new Date(p.inicio)-Date.now()<15*60000;
 w.innerHTML=`<div class="pc-i"><span class="icb">${ic('video',20)}</span><div><h2 class="h4">Plantão ao vivo</h2><p class="sm">${p?`${quando(p.inicio)} · ${p.duracao_min} minutos · fica gravado`:'O professor ainda não marcou o próximo plantão.'}</p></div></div>
  ${p?`<div class="acts">${p.link&&aberto?abtn('Entrar no plantão','gold',p.link,{s:1}):''}${btn('Adicionar ao calendário','glass',{s:1,icon:false,attr:`data-ics="${p.id}"`})}</div>${p.link&&!aberto?'<p class="sm">O link para entrar aparece aqui 15 minutos antes.</p>':''}`:''}
  ${past.length?`<div><p class="lbl" style="padding-bottom:8px">Gravações</p>${past.map(x=>`<a class="fq" href="${esc(x.gravacao)}" target="_blank" rel="noopener"><span class="fav">${ic('play',14)}</span><span class="tx"><strong>Plantão de ${curto(x.inicio)}</strong><span class="sm">${x.duracao_min} min</span></span><span class="lk"><span>Ver gravação</span>${ic('ar',14)}</span></a>`).join('')}</div>`:''}`;
}
function slots(cid){
 const disp=(M().disponibilidade||{})[cid]||[],out=[],now=new Date();
 for(let k=1;k<=14;k++){const d=new Date(now);d.setDate(d.getDate()+k);const wd=(d.getDay()+6)%7;
  disp.filter(x=>x.dia===wd).forEach(x=>{const [h1,m1]=x.ini.split(':').map(Number),[h2,m2]=x.fim.split(':').map(Number);let t=h1*60+m1;while(t+30<=h2*60+m2){const s=new Date(d);s.setHours(Math.floor(t/60),t%60,0,0);out.push(s);t+=30}})}
 return out.slice(0,24);
}
function renderMent(){
 const w=$('#p-ment');if(!w||w.tagName==='A')return;const cid=S.curso,ms=M().mentorias.filter(m=>m.curso_id===cid&&m.status!=='cancelado'),usadas=ms.length,livres=Math.max(0,2-usadas),sl=slots(cid);
 w.innerHTML=`<div class="pc-h"><h2 class="h4">Mentoria individual</h2>${tag(`${usadas} de 2 encontros`,'gold')}</div>
  ${ms.map(m=>`<div class="fment"><div class="pwho"><span class="fav">${ic('user',14)}</span><span style="display:grid;gap:2px"><strong style="font-weight:500;font-size:14px">${quando(m.inicio)}</strong><span class="sm">${MST[m.status]}</span></span></div><div class="acts">${m.status==='proposto'?btn('Aceitar horário','gold',{s:1,icon:false,attr:`data-m-acao="aceitar" data-m="${m.id}"`}):''}${m.status==='confirmado'&&m.link?abtn('Entrar','gold',m.link,{s:1}):''}${['pedido','proposto','confirmado'].includes(m.status)?btn('Cancelar','line',{s:1,icon:false,attr:`data-m-acao="cancelar" data-m="${m.id}"`}):''}</div></div>`).join('')}
  ${livres?sl.length?`<p class="sm">Escolha um horário livre do professor nas próximas duas semanas:</p><div class="chips">${sl.map(s=>`<button type="button" class="chip sug" data-slot="${s.toISOString()}">${s.toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'})} · ${s.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</button>`).join('')}</div>`:'<p class="sm">O professor ainda não publicou horários livres. Volte em breve ou fale com a equipe.</p>':'<p class="sm">Os seus 2 encontros já estão marcados.</p>'}`;
}

/* certificados */
PV.cert=()=>{
 if(!S.curso)return semFormacao();
 const ms=M().matriculas.filter(m=>!m.prof),nome=M().perfil.nome_certificado||M().perfil.nome;
 const ok=ms.filter(m=>m.certificado),resto=ms.filter(m=>!m.certificado);
 return `${fhead(`Seus ${em('certificados.')}`,'O certificado é emitido quando você conclui a carga horária da formação. Cada um tem um código para conferência pública.')}
 ${ok.map(m=>{const c=cursoOf(m.curso_id),url=`${location.origin}/certificado/${m.certificado}`,d=new Date(m.concluida_em||Date.now());
  const li=`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(c.titulo)}&organizationName=${encodeURIComponent('EJUP · Educação Jurídica')}&issueYear=${d.getFullYear()}&issueMonth=${d.getMonth()+1}&certUrl=${encodeURIComponent(url)}&certId=${m.certificado}`;
  return `<article class="card pcert glow" data-r><div class="pcp light" role="img" aria-label="Prévia do certificado"><div><div><p class="lbl">EJUP · Educação Jurídica</p><p class="lbl g">Certificado de conclusão</p></div>
   <div><p class="sm">Certificamos que</p><p class="h3">${esc(nome)}</p><p class="sm">concluiu a formação ${esc(c.titulo)}, com carga horária de ${String(c.horas).replace('.',',')} horas.</p></div>
   <div class="pc-h"><span class="sm">${dia(d)}</span><span class="sm">Código ${m.certificado}</span></div></div></div>
  <div class="pcd">${tag('Disponível','gold')}<h2 class="h3">${esc(c.titulo)}</h2>
   <dl>${[['Concluída em',dia(d)],['Carga horária',`${String(c.horas).replace('.',',')} horas`],['Código de validação',m.certificado]].map(([k,v])=>`<div><dt class="sm">${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
   <div class="acts">${abtn('Baixar PDF','gold',`/certificado/${m.certificado}?pdf=1`)}${abtn('Compartilhar no LinkedIn','glass',li,{icon:false})}</div>${lk('Copiar link de validação',{attr:`data-copy-url="${url}"`})}</div></article>`}).join('')}
 <div class="prow c2">${resto.map(m=>{const c=cursoOf(m.curso_id),s=stat(m.curso_id);return s.iniciada?`<article class="card pc" data-r><div class="pc-h"><span class="icb">${ic('award',20)}</span>${tag('Em andamento')}</div><h2 class="h4">${esc(c.titulo)}</h2>${barH(s.pct)}<div class="pc-h"><span class="sm" style="color:var(--branco)">${s.pct}% concluído</span><span class="sm">${s.left?'faltam '+hm(s.left):'carga horária concluída'}</span></div><p class="sm">Liberado ao concluir 100% da carga horária.</p>${s.next?lk('Continuar aula',{go:`portal/aula/${s.next.id}`}):''}</article>`
  :`<article class="card pc dash" data-r><div class="pc-h" style="width:100%"><span class="icb">${ic('lock',20)}</span>${tag('Não iniciada')}</div><h2 class="h4" style="color:var(--w82)">${esc(c.titulo)}</h2><p class="sm">O certificado aparece aqui quando você concluir a formação.</p>${s.next?lk('Começar formação',{go:`portal/aula/${s.next.id}`}):''}</article>`}).join('')}</div>
 <div class="prow c2">
  <article class="card pinfo" id="cert-name" data-r>${certNameH()}</article>
  <article class="card pinfo" data-r><span class="icb">${ic('shield',20)}</span><div><p class="pin-n">Como conferir a autenticidade</p><p class="sm">Quem recebe o certificado abre o link de validação ou digita o código em ejup.com.br/certificado/código.</p></div></article>
 </div>`};
const certNameH=()=>`<span class="icb">${ic('user',20)}</span><div><p class="sm">Nome no certificado</p><p class="pin-n"></p></div>${lk('Corrigir nome',{attr:'data-cert-edit'})}`;
PB.cert=()=>{const n=$('#cert-name .pin-n');if(n)n.textContent=M().perfil.nome_certificado||M().perfil.nome};

/* planos de acesso */
PV.planos=()=>{
 const cid=S.curso,c=cid&&cursoOf(cid),cur=cid?lvl(planoDe(cid)):-1;
 const cell=v=>v===true?`<td>${ic('check',16)}<span class="vh">Incluído</span></td>`:v===false?`<td class="no">${ic('minus',16)}<span class="vh">Não incluído</span></td>`:`<td>${v}</td>`;
 return `${fhead(`Mesmo conteúdo, ${em('suporte diferente.')}`,'Todas as aulas, materiais e o certificado estão em qualquer plano. A diferença está no tipo de suporte.',cursoSel()?`<div data-r>${cursoSel()}</div>`:'')}
 <div class="pplans" data-r>${PLANS.map((p,i)=>`<article class="card pc ppl${i===cur?' on':''}"><h2 class="h3">${p.n}</h2><p class="body">${p.d}</p><div class="ppv"><div><p class="h4 g">Valor sob consulta</p><p class="sm">por formação</p></div>${i===cur?tag('Seu plano','gold'):''}</div><ul class="pck">${p.its.map(x=>`<li>${ic('check',16)}<span>${x}</span></li>`).join('')}</ul>${i===cur?`<p class="pcur">${ic('check',16)}<span>Seu plano atual</span></p>`:abtn(i>cur?'Fazer upgrade':'Falar com a equipe',i>cur?'gold':'glass',WA(`Olá, quero mudar para o plano ${p.n}${c?` na formação ${c.titulo}`:''}.`),{full:1})}</article>`).join('')}</div>
 <article class="card pmx" data-r><table><thead><tr><th scope="col">Tipos de suporte</th>${PLANS.map((p,i)=>`<th scope="col"${i===cur?' class="on"':''}>${p.n}</th>`).join('')}</tr></thead><tbody>${MX.map(r=>r.length===1?`<tr class="grp"><th colspan="4" scope="colgroup">${r[0]}</th></tr>`:`<tr><th scope="row">${r[0]}${r[1]?`<span class="sm">${r[1]}</span>`:''}</th>${r[2].map(cell).join('')}</tr>`).join('')}</tbody></table></article>
 <p class="sm pnote">A mudança de plano vale para a formação em andamento e não reinicia o progresso. Fale com a equipe para valores e condições.</p>`};

/* perfil */
PV.perfil=()=>{const prof=S.area==='prof';return `
 ${fhead(`Seu ${em('perfil.')}`,prof?'Como os alunos veem você, os avisos que quer receber e a segurança da conta.':'Seus dados, as preferências de estudo e a segurança da conta em um só lugar.')}
 <div class="pl5">
  <div class="pcol">
   <article class="card pc" data-r><h2 class="h4">${prof?'Dados do professor':'Dados pessoais'}</h2>
    <form id="pf-f" class="pgf" novalidate>
     <label class="fl"><span>${prof?'Nome como aparece para os alunos':'Nome completo'}</span><input class="inp" id="pf-nome" autocomplete="name"></label>
     <label class="fl"><span>E-mail de acesso</span><input class="inp" id="pf-email" type="email" readonly aria-describedby="pf-email-n"></label>
     ${prof?`<label class="fl full"><span>Áreas de atuação</span><input class="inp" id="pf-areas" placeholder="Ex.: Direito Ambiental, Licenciamento" autocomplete="off"></label>
     <label class="fl full"><span>Minibiografia</span><textarea class="inp" id="pf-bio" placeholder="Duas ou três linhas sobre a sua trajetória."></textarea></label>`
     :`<label class="fl"><span>Telefone ou WhatsApp</span><input class="inp" id="pf-tel" placeholder="(00) 00000-0000" autocomplete="tel"></label>
     <label class="fl"><span>Área de atuação</span><select class="inp" id="pf-area"><option value="">Selecione</option>${AREAS.map(a=>`<option>${a}</option>`).join('')}</select></label>
     <label class="fl"><span>Inscrição na OAB (opcional)</span><input class="inp" id="pf-oab" placeholder="UF 000000" autocomplete="off"></label>
     <label class="fl"><span>Nome no certificado</span><input class="inp" id="pf-cert" autocomplete="off"></label>`}
     <p class="sm full" id="pf-email-n">Para trocar o e-mail de acesso, fale com a equipe: as formações ficam ligadas a ele.</p>
     <p class="msg full" aria-live="polite"></p><div class="full">${btn('Salvar alterações','gold',{type:'submit',icon:false})}</div></form></article>
   ${prof?`<article class="card pc" data-r><h2 class="h4">Avisos por e-mail</h2>${sw('n1','A cada nova dúvida',prefs2().n1!==false,'Com a aula e o minuto no próprio e-mail')}${sw('n2','Resumo diário das dúvidas',!!prefs2().n2,'Um e-mail por dia, de manhã')}${sw('n3','Pedidos de mentoria',prefs2().n3!==false,'Quando um aluno do plano Mentoria pedir um horário')}${S.prof.email?'':'<p class="sm">Os e-mails do portal ainda não foram ligados pela EJUP. As escolhas já ficam guardadas.</p>'}</article>
   <article class="card pc" data-r><div class="pc-i">${mnv('s')}<div><h2 class="h4">Minerva</h2><p class="sm">Como as suas respostas alimentam o banco da Minerva.</p></div></div>${sw('n4','Ensinar a Minerva com as minhas respostas',prefs2().n4!==false,'Fica marcado por padrão ao responder uma dúvida')}${lk('Revisar respostas da Minerva',{go:'prof/ia'})}</article>`
   :`<article class="card pc" data-r><h2 class="h4">Preferências de estudo</h2>
    <div class="prl first"><span><strong>Tempo por semana</strong><span class="sm">Vale para o plano de estudo</span></span>${segH('pf-pace',[[2,'2h'],[4,'4h'],[6,'6h'],[8,'8h']],pace(),'data-pace')}</div>
    ${sw('mail','Lembretes por e-mail nos dias de estudo',!!prefs().mail)}${sw('news','Novidades da EJUP','Formações novas, episódios e artigos')}</article>`}
  </div>
  <div class="pcol">
   <article class="card pc pfid" data-r><span class="pav xl${prof?' gold':''}" data-u-ini></span><div><p class="h4" data-u-nome></p><p class="sm" data-u-email></p></div>${prof?tag('Professor','gold'):S.curso?`<span class="tag gold">Plano&nbsp;<span data-plan-n></span></span>`:''}</article>
   <article class="card pc" style="gap:0" data-r><h2 class="h4" style="padding-bottom:12px">Acesso e segurança</h2>
    <div class="prl"><span><span class="sm">E-mail de acesso</span><strong data-u-email></strong></span></div>
    <div class="prl"><span><span class="sm">Senha</span><strong>••••••••</strong></span>${lk('Alterar senha',{attr:'data-pw-go'})}</div>
    <div id="pw-box" hidden></div>
    <div class="prl"><span><span class="sm">Sessões abertas</span><strong>Este e outros aparelhos</strong></span>${lk('Sair de todos',{attr:'data-sair-todos'})}</div></article>
   ${prof?'':`<article class="card pc" data-r><h2 class="h4">Plano de acesso</h2><p class="sm">${S.curso?`Você está no plano <strong style="color:var(--branco);font-weight:500" data-plan-n></strong> em ${esc(cursoOf(S.curso).titulo)}.`:'Nenhuma formação liberada ainda.'}</p>${lk('Ver planos de acesso',{go:'portal/planos'})}</article>`}
   <article class="card pc dash" data-r><h2 class="h4">Privacidade</h2><p class="sm">Baixe uma cópia dos seus dados ou encerre a conta. O encerramento apaga perfil, progresso, anotações e dúvidas.</p>${lk('Baixar meus dados',{attr:'data-dados'})}${lk('Excluir minha conta',{attr:'data-excluir'})}<div id="ex-box" hidden></div></article>
  </div></div>`};
const prefs2=()=>(S.prof?S.prof.perfil.prefs:M().perfil.prefs)||{};
const perfilAtual=()=>S.area==='prof'?S.prof.perfil:M().perfil;
PB.perfil=()=>{const u=perfilAtual(),set=(id,v)=>{const e=$(id);if(e)e.value=v||''};
 set('#pf-nome',u.nome);set('#pf-email',u.email);set('#pf-tel',u.tel);set('#pf-area',u.area);set('#pf-oab',u.oab);set('#pf-cert',u.nome_certificado);set('#pf-areas',u.areas);set('#pf-bio',u.bio);syncUser(u,$('#pmain'))};

/* busca */
PV.busca=rest=>{
 const q=decodeURIComponent(rest.join('/')||''),n=norm(q).trim();
 const aulas=n?M().aulas.filter(a=>norm(`${a.titulo} ${lesT(a)} ${a.sobre} ${a.topicos.join(' ')} ${modOf(a).titulo}`).includes(n)):[];
 const ds=n?M().duvidas.filter(d=>norm(d.titulo+' '+d.mensagens.map(m=>m.texto).join(' ')).includes(n)):[];
 return `${fhead(`Resultados ${em('da busca.')}`,q?`Para “${esc(q)}”: ${plural(aulas.length,'aula','aulas')} e ${plural(ds.length,'dúvida','dúvidas')}.`:'Digite o que procura no campo de busca.')}
 <div class="prow c2"><article class="card pc" style="gap:0" data-r><h2 class="h4" style="padding-bottom:12px">Aulas</h2>${aulas.map(a=>`<a class="fq" href="/portal/aula/${a.id}"><span class="fav">${ic('play',14)}</span><span class="tx"><strong>${esc(lesT(a))}</strong><span class="sm">${esc(cursoOf(cursoDaAula(a)).titulo)} · ${esc(lesL(a))}</span></span>${ic('ar',14)}</a>`).join('')||'<p class="sm">Nenhuma aula encontrada.</p>'}</article>
 <article class="card pc" style="gap:0" data-r><h2 class="h4" style="padding-bottom:12px">Dúvidas</h2>${ds.map(d=>`<a class="fq" href="/portal/suporte/${d.id}"><span class="fav">${ic('chat',14)}</span><span class="tx"><strong>${esc(d.titulo)}</strong><span class="sm">${ST[d.status]}</span></span>${ic('ar',14)}</a>`).join('')||'<p class="sm">Nenhuma dúvida encontrada.</p>'}${lk('Perguntar à Minerva',{attr:`data-ai-go="${esc(q)}"`})}</article></div>`};

/* ======================================================================
   ÁREA DO PROFESSOR
   ====================================================================== */
const P=()=>S.prof;
const pCurso=id=>P().cursos.find(c=>c.id===id);
const pMods=cid=>P().modulos.filter(m=>m.curso_id===cid).sort((a,b)=>a.ordem-b.ordem);
const pAulas=cid=>pMods(cid).flatMap(m=>P().aulas.filter(a=>a.modulo_id===m.id).sort((a,b)=>a.ordem-b.ordem));
const pAula=id=>P().aulas.find(a=>a.id===id);
const pMod=a=>P().modulos.find(m=>m.id===a.modulo_id);
const pLesL=a=>`Módulo ${pad(pMod(a).ordem)} · Aula ${a.ordem}`;
const pLesT=a=>/^aula \d+$/i.test(a.titulo)?pMod(a).titulo:a.titulo;
const SIT=['Em dia','Atrasado','Parado'],SITC=['var(--ouro-400)','var(--w64)','var(--erro)'];
function turma(cid){
 const as=pAulas(cid),ids=new Set(as.map(a=>a.id)),tot=as.reduce((s,a)=>s+a.duracao_min,0)||1;
 return P().alunos.filter(a=>a.curso_id===cid).map(a=>{
  const ps=a.user_id?P().progresso.filter(p=>p.user_id===a.user_id&&ids.has(p.aula_id)):[],fe=ps.filter(p=>p.concluida);
  const min=fe.reduce((s,p)=>s+(pAula(p.aula_id)||{duracao_min:0}).duracao_min,0),last=ps.map(p=>p.atualizado_em).sort().pop()||null;
  const ref=last||a.desde,d=(Date.now()-new Date(ref))/86400000,fim=!!a.concluida_em||(as.length&&fe.length===as.length);
  return {...a,pct:Math.round(min/tot*100),last,sit:fim||d<=7?0:d<=14?1:2,fim,conta:!!a.user_id}});
}
const dueOf=d=>{const lim=maisDiasUteis(d.criado_em,sla(d.plano)),dd=Math.ceil((lim-Date.now())/86400000);return {urg:dd<=0,t:dd<0?'Atrasada':dd===0?'Vence hoje':`Vence em ${plural(dd,'dia','dias')}`}};
const pDuv=()=>P().duvidas.filter(d=>d.curso_id===S.pc);
const pPend=()=>pDuv().filter(d=>d.status==='professor').sort((a,b)=>(b.plano==='mentoria')-(a.plano==='mentoria')||new Date(a.criado_em)-new Date(b.criado_em));

const FNAV=[['','Painel','home'],['duvidas','Dúvidas','chat'],['agenda','Plantões e mentorias','video'],['turma','Turma','users'],['ia','Minerva','spark']];
const FTAB=[['','Painel','home'],['duvidas','Dúvidas','chat'],['agenda','Agenda','video'],['turma','Turma','users'],['ia','Minerva','spark']];
PAGES.prof=()=>`
<section class="sec dark portal farea">
 <aside class="pside"><div class="pside-t"><a href="/prof" class="logo" aria-label="Área do Professor, painel">${LOGO}</a><div>${tag('Área do Professor','gold')}</div>
  <nav class="pnav" aria-label="Área do Professor">${FNAV.map(([k,l,i])=>`<a href="/prof${k?'/'+k:''}" data-pv="${k||'painel'}">${ic(i,18)}<span>${l}</span>${k==='duvidas'?'<span class="cnt" data-fq-n hidden></span>':''}</a>`).join('')}</nav></div>
  <div class="pside-b"><div class="pplan"><span class="lbl g">Formação</span><span id="pc-box"></span><span class="sm" data-pc-n></span></div>
   <div class="puser"><a href="/prof/perfil" class="pav gold" data-u-ini aria-label="Meu perfil"></a><div><a href="/prof/perfil" class="pu-n" data-u-nome></a><p class="sm"><a href="/prof/perfil">Perfil</a> · <a href="/portal">Ver como aluno</a> · <button type="button" class="lk-in" data-logout>Sair</button></p></div></div></div></aside>
 <div class="pbody">
  <header class="ptop"><a href="/prof" class="logo pmo" aria-label="Área do Professor, painel">${LOGO}</a><p class="pcrumb" id="pcrumb"></p>
   <div class="ptop-r"><form class="field psearch" id="f-sf" role="search" novalidate>${ic('search',16)}<input type="search" placeholder="Buscar aluno ou dúvida" aria-label="Buscar na área do professor"></form><button type="button" class="pav gold pmo" data-pmenu aria-haspopup="true" aria-expanded="false" aria-label="Conta: perfil, ver como aluno e sair" data-u-ini></button></div>
   <div class="pmenu" id="pmenu" hidden><p class="sm" data-u-nome></p><a href="/prof/perfil">${ic('user',16)}<span>Meu perfil</span></a><a href="/portal">${ic('book',16)}<span>Ver como aluno</span></a><a href="/equipe" data-eq-link hidden>${ic('shield',16)}<span>Área da Equipe</span></a><button type="button" data-logout>${ic('ar',16)}<span>Sair</span></button></div></header>
  <div id="pmain" class="pmain" tabindex="-1"><div class="okbox"><p class="sm">Carregando a Área do Professor…</p></div></div>
 </div>
 <nav class="ptabs" aria-label="Área do Professor">${FTAB.map(([k,l,i])=>`<a href="/prof${k?'/'+k:''}" data-pv="${k||'painel'}">${ic(i,20)}<span>${l}</span></a>`).join('')}</nav>
</section>`;
async function loadProf(force){if(S.prof&&!force)return S.prof;S.prof=await api('prof');if(!S.pc||!pCurso(S.pc))S.pc=(P().cursos[0]||{}).id;return S.prof}
PAGES.prof.mount=async arg=>{
 S.area='prof';
 try{await loadProf()}catch(e){if(e.status===401)return precisaEntrar();$('#pmain').innerHTML=e.status===403?`<div class="okbox"><span class="icb">${ic('lock',20)}</span><p class="h4">${esc(e.message)}</p>${abtn('Ir para o Portal do Aluno','gold','/portal',{s:1})}</div>`:errBox(e.message,true);links($('#pmain'));return}
 profShell();profView(arg,true);
};
PAGES.prof.sub=(arg,y)=>{if(!S.prof)return PAGES.prof.mount(arg);profView(arg,false,y)};
function profShell(){
 syncUser(P().perfil);const cs=P().cursos;$$('[data-eq-link]').forEach(e=>{e.hidden=P().perfil.papel!=='equipe'});
 $('#pc-box').innerHTML=cs.length>1?`<label class="psel">${ic('book',16)}<select data-pc-sel aria-label="Formação">${cs.map(c=>`<option value="${c.id}"${c.id===S.pc?' selected':''}>${esc(c.titulo)}</option>`).join('')}</select>${ic('down',14)}</label>`:`<span style="font-size:14px;font-weight:500;line-height:1.4">${esc(pCurso(S.pc).titulo)}</span>`;
 const n=turma(S.pc).length;$$('[data-pc-n]').forEach(e=>{e.textContent=plural(n,'aluno','alunos')});
 const p=pPend().length;$$('[data-fq-n]').forEach(e=>{e.textContent=p;e.hidden=!p});
}
const FV={},FB={};
const FCR={painel:'Painel',duvidas:'Dúvidas',agenda:'Plantões e mentorias',turma:'Turma',ia:'Minerva',perfil:'Meu perfil'};
function profView(arg,first,y=0){
 const main=$('#pmain');if(!main)return;S.parg=arg;
 const [v0,...rest]=(arg||'').split('/'),v=FV[v0]||v0==='perfil'?v0:'painel';S.view=v;
 const put=()=>{
  try{main.innerHTML=v==='perfil'?PV.perfil():FV[v](rest)}catch(e){console.error(e);main.innerHTML=errBox('Não foi possível abrir esta tela.',true)}
  links(main);main.classList.remove('pv-out');$('#pcrumb').innerHTML=crumb('Área do Professor',FCR[v]);
  $$('[data-pv]').forEach(a=>{const on=a.dataset.pv===v;a.classList.toggle('on',on);on?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')});
  const pm=$('#pmenu');if(pm)pm.hidden=true;profShell();(v==='perfil'?PB.perfil:FB[v])&&(v==='perfil'?PB.perfil:FB[v])(rest);
  document.title=`${FCR[v]} · Área do Professor · EJUP`;
  if(!first){scrollTo({top:y,behavior:'instant'});main.focus({preventScroll:true})}
  reveal();$$('.seg',main).forEach(placeSeg)};
 if(first||RM){put();return}
 main.classList.add('pv-out');setTimeout(put,180);
}
const fstat=(l,v,n)=>`<article class="card fstat" data-r><p class="lbl">${l}</p><p class="h3">${v}</p><p class="sm">${n}</p></article>`;
const fbar=(l,n,p)=>`<div class="fbar"><div><span>${esc(l)}</span><span class="sm">${n}</span></div><div class="bar"><i style="--v:${p}%"></i></div></div>`;
const fqRow=d=>{const du=dueOf(d);return `<button type="button" class="fq" data-fq-go="${d.id}">${fav(iniOf(d.aluno))}<span class="tx"><strong>${esc(d.titulo)}</strong><span class="sm">${esc(d.aluno)}${d.aula_id&&pAula(d.aula_id)?' · '+esc(pLesL(pAula(d.aula_id))):''}</span></span>${d.plano==='mentoria'?tag('Mentoria · prioridade'):''}${tag(du.t,du.urg?'gold':'')}</button>`};
const proxPl=cid=>P().plantoes.filter(p=>p.curso_id===cid&&+new Date(p.inicio)+p.duracao_min*60000>Date.now()).sort((a,b)=>new Date(a.inicio)-new Date(b.inicio))[0]||null;
function mStats(cid){
 const L=P().minerva.logs.filter(l=>l.curso_id===cid),sem=L.filter(l=>Date.now()-new Date(l.criado_em)<7*86400000),av=L.filter(l=>l.ajudou!==null&&l.ajudou!==undefined),ok=av.filter(l=>l.ajudou).length;
 const grupos={};L.filter(l=>!l.revisado&&(l.ajudou===false||!l.resposta_id)).forEach(l=>{const k=norm(l.pergunta).replace(/[^\w ]/g,'').trim();(grupos[k]=grupos[k]||{q:l.pergunta,ids:[],n:0,resp:l.resposta_id,sem:!l.resposta_id}).ids.push(l.id);grupos[k].n++});
 return {L,sem,pct:av.length?Math.round(ok/av.length*100):null,rev:Object.values(grupos).sort((a,b)=>b.n-a.n)};
}

FV.painel=()=>{
 const cid=S.pc,pend=pPend(),t=turma(cid),pl=proxPl(cid),ms=P().mentorias.filter(m=>m.curso_id===cid&&['pedido','proposto','confirmado'].includes(m.status)),st=mStats(cid);
 const resp=pDuv().map(d=>{const a=d.mensagens.find(m=>m.papel==='professor');return a?(new Date(a.criado_em)-new Date(d.criado_em))/86400000:null}).filter(x=>x!==null);
 const med=resp.length?resp.reduce((a,b)=>a+b,0)/resp.length:null,ativos=t.filter(a=>a.last&&Date.now()-new Date(a.last)<14*86400000).length;
 const cnt=[0,1,2].map(s=>t.filter(a=>a.sit===s).length),tot=t.length||1;
 const trava={};pDuv().forEach(d=>{if(d.aula_id)trava[d.aula_id]=(trava[d.aula_id]||0)+1});const tr=Object.entries(trava).sort((a,b)=>b[1]-a[1]).slice(0,3),max=tr[0]?tr[0][1]:1;
 return `${fhead(`A sua turma, ${em('hoje.')}`,'O que espera a sua resposta, o próximo encontro ao vivo e como os alunos estão avançando.')}
 <div class="fstats">${fstat('Dúvidas aguardando',pend.length,pend.filter(d=>dueOf(d).urg).length?`${pend.filter(d=>dueOf(d).urg).length} vence hoje ou atrasada`:'nenhuma vence hoje')}${fstat('Tempo médio de resposta',med===null?'—':med<1?'menos de 1 dia':plural(Math.round(med),'dia','dias'),'Combinado: até 2 dias úteis')}${fstat('Alunos ativos',ativos,`${cnt[0]} em dia com o plano`)}${fstat('Resolvidas pela Minerva',st.pct===null?'—':st.pct+'%','entre as respostas avaliadas pelos alunos')}</div>
 <div class="prow f1">
  <article class="card pc" style="gap:0" data-r><div class="pc-h" style="padding-bottom:12px"><h2 class="h4">Aguardando a sua resposta</h2>${lk('Ver todas',{go:'prof/duvidas'})}</div>${pend.length?pend.slice(0,5).map(fqRow).join(''):'<p class="sm" style="padding:16px 0">Nenhuma dúvida esperando resposta.</p>'}</article>
  <div class="pcol">
   <article class="card pc glow" data-r><div class="pc-h"><span class="icb">${ic('video',20)}</span>${tag('Em grupo')}</div><h2 class="h4">Próximo plantão ao vivo</h2><p class="sm">${pl?quando(pl.inicio):'Data a definir'} · ${plural(pDuv().filter(d=>d.status==='plantao').length,'dúvida','dúvidas')} na pauta</p>${lk(pl?'Abrir pauta':'Definir data',{go:'prof/agenda'})}</article>
   <article class="card pc" style="gap:0" data-r><h2 class="h4" style="padding-bottom:12px">Mentorias individuais</h2>${ms.length?ms.slice(0,4).map(m=>`<a href="/prof/agenda" class="fq">${fav(iniOf(m.aluno),'s')}<span class="tx"><strong>${esc(m.aluno)}</strong><span class="sm">${MST[m.status]} · ${quando(m.inicio)}</span></span>${ic('ar',14)}</a>`).join(''):'<p class="sm">Nenhum pedido de mentoria.</p>'}</article>
  </div></div>
 <div class="prow f3">
  <article class="card pc" data-r><h2 class="h4">Andamento da turma</h2><div class="fstack">${cnt.map((n,i)=>`<i style="--f:${Math.round(n/tot*100)};background:${SITC[i]}"></i>`).join('')}</div>
   ${[['Em dia com o plano',0],['Atrasados',1],['Parados há 2 semanas',2]].map(([l,i])=>`<p class="fleg"><i style="background:${SITC[i]}"></i><span>${l}</span><strong>${cnt[i]}</strong></p>`).join('')}${lk('Ver a turma',{go:'prof/turma'})}</article>
  <article class="card pc" data-r><h2 class="h4">Onde a turma trava</h2><p class="sm">Aulas com mais dúvidas enviadas</p>${tr.length?tr.map(([id,n])=>{const a=pAula(id);return a?fbar(pLesL(a),plural(n,'dúvida','dúvidas'),Math.round(n/max*100)):''}).join(''):'<p class="sm">Ainda sem dúvidas ligadas a aulas.</p>'}</article>
  <article class="card pc glow" data-r>${mnv('s')}<h2 class="h4">Minerva</h2><p class="sm">${st.rev.length?`${plural(st.rev.length,'pergunta espera','perguntas esperam')} a sua revisão: sem resposta cadastrada ou marcadas como “não ajudou”.`:'Nenhuma resposta esperando revisão.'}</p>${lk('Revisar respostas',{go:'prof/ia'})}</article>
 </div>`};

FV.duvidas=rest=>{
 if(rest[0])S.fsel=+rest[0];
 const all=pDuv(),n=all.filter(d=>d.status==='professor').length;
 return `${fhead(`Dúvidas ${em('da turma.')}`,'Cada dúvida chega com a aula e o minuto em que surgiu e se o aluno já tinha perguntado à Minerva.')}
 <div class="ptit mid" data-r>${segH('fq-seg',[['pend',`Aguardando · ${n}`],['ok','Respondidas'],['todas','Todas']],S.fq,'data-fqf')}
  <div class="chips">${['Todos os planos','Mentoria · prioridade'].map((l,i)=>`<button type="button" class="chip sug${i===S.fpl?' on':''}" data-fpl="${i}">${l}</button>`).join('')}</div></div>
 <div class="pl4"><article class="card pc" style="padding:12px" data-r><div id="fq-list"></div></article><article class="card pc" id="fq-det" data-r></article></div>`};
const fqView=()=>pDuv().filter(d=>(S.fq==='todas'||(S.fq==='pend'?d.status==='professor':d.status!=='professor'))&&(!S.fpl||d.plano==='mentoria')).sort((a,b)=>S.fq==='pend'?(b.plano==='mentoria')-(a.plano==='mentoria')||new Date(a.criado_em)-new Date(b.criado_em):new Date(b.atualizado_em)-new Date(a.atualizado_em));
FB.duvidas=()=>renderFQ();
function renderFQ(){
 const w=$('#fq-list');if(!w)return;const l=fqView();
 if(!l.some(d=>d.id===S.fsel))S.fsel=l.length?l[0].id:null;
 const host=w.closest('.pl4').parentElement;host.classList.toggle('fq-open',!!S.fopen&&!!S.fsel);
 w.innerHTML=l.length?l.map(d=>{const du=dueOf(d);return `<button type="button" class="pth${d.id===S.fsel?' on':''}" data-fq="${d.id}"><span class="fh">${fav(iniOf(d.aluno),'s')}<span class="sm" style="flex:1">${esc(d.aluno)}</span>${tag(d.status==='professor'?du.t:ST[d.status],d.status==='professor'&&du.urg?'gold':'')}</span><span class="t">${esc(d.titulo)}</span><span class="sm c">${d.aula_id&&pAula(d.aula_id)?esc(pLesL(pAula(d.aula_id)))+(d.segundo?' · '+mmss(d.segundo):''):''}${d.plano==='mentoria'?' · Mentoria':''}</span></button>`}).join(''):`<p class="sm" style="padding:16px 12px">Nada por aqui com este filtro.</p>`;
 renderFQD();
}
function renderFQD(){
 const d=$('#fq-det');if(!d)return;const x=P().duvidas.find(y=>y.id===S.fsel);
 if(!x){d.innerHTML=`<div class="okbox"><span class="ck">${ic('check',28)}</span><p class="h4">Tudo respondido.</p><p class="sm">Quando um aluno enviar uma dúvida, ela aparece aqui.</p></div>`;return}
 const a=x.aula_id&&pAula(x.aula_id),du=dueOf(x),aberta=x.status!=='encerrada',as=pAulas(x.curso_id);
 d.innerHTML=`<button type="button" class="lk fq-back" data-fq-back>${ic('back',14)}<span>Todas as dúvidas</span></button>
  <div class="pc-h wr"><span class="pwho">${fav(iniOf(x.aluno),'l')}<span style="display:grid;gap:2px"><strong style="font-weight:500;font-size:14px">${esc(x.aluno)}</strong><span class="sm">Plano ${PLANS[lvl(x.plano)].n} · resposta em até ${plural(sla(x.plano),'dia útil','dias úteis')}</span></span></span>${tag(x.status==='professor'?du.t:ST[x.status],x.status==='professor'&&du.urg||x.status==='respondida'?'gold':'')}</div>
  <h2 class="h4">${esc(x.titulo)}</h2>
  ${x.mensagens.map((m,i)=>`<div class="pmsg${m.papel==='professor'?' ans':''}"><div class="pc-h"><strong>${m.papel==='professor'?'Você':esc(x.aluno)}</strong><span class="sm">${rel(m.criado_em)}</span></div><p class="body">${esc(m.texto)}</p>${i===0?`<div class="pc-h wr" style="justify-content:flex-start">${a?tag(esc(pLesL(a))+(x.segundo?' · '+mmss(x.segundo):'')):''}${x.via_minerva?tag('Perguntou à Minerva antes'):''}${a?lk('Abrir a aula neste ponto',{go:`portal/aula/${a.id}${x.segundo?'/'+x.segundo:''}`}):''}</div>`:''}</div>`).join('')}
  ${x.status==='plantao'?`<p class="sm pwait">${ic('video',14)}<span>Esta dúvida está na pauta do próximo plantão ao vivo.</span></p>`:''}
  ${aberta?`<form id="fq-f" class="pform" novalidate><div class="fed"><label class="lbl g" for="fq-a">${x.status==='respondida'?'Complementar a resposta':'Sua resposta'}</label><textarea id="fq-a" placeholder="Escreva a resposta ao aluno. Ele recebe aqui no portal${P().email?' e por e-mail':''}."></textarea>
   <div class="ftools"><button type="button" class="ftool" data-fq-draft>${ic('spark',16)}<span>Sugestão do banco da Minerva</span></button><label class="ftool psel-in">${ic('book',16)}<select data-fq-ind aria-label="Indicar uma aula na resposta"><option value="">Indicar aula</option>${as.map(y=>`<option value="${y.id}">${esc(pLesL(y)+' · '+pLesT(y))}</option>`).join('')}</select></label></div></div>
   ${sw('teach','Ensinar a Minerva com esta resposta',prefs2().n4!==false,'Ela passa a usar a sua explicação nas próximas perguntas parecidas desta formação','data-fq-teach')}
   <p class="msg" aria-live="polite"></p><div class="acts">${btn('Enviar resposta','gold',{type:'submit'})}${x.status==='professor'?btn('Levar para o plantão','glass',{icon:false,attr:'data-fq-live'}):''}${btn('Encerrar','line',{icon:false,attr:'data-fq-close'})}</div></form>`:`<p class="sm pwait">${ic('check',14)}<span>Dúvida encerrada.</span></p>`}`;
 links(d);
}

FV.agenda=()=>`${fhead(`Encontros ${em('ao vivo.')}`,'O plantão junta as dúvidas da turma em um encontro em grupo. A mentoria é individual, para os alunos do plano Mentoria.')}
 <div class="prow f2">
  <div class="pcol"><article class="card pc glow" data-r id="f-live"></article><article class="card pc" style="gap:0" data-r id="f-past"></article></div>
  <div class="pcol"><article class="card pc" style="gap:0" data-r><div class="pc-h" style="padding-bottom:12px"><h2 class="h4">Mentorias</h2>${tag('Plano Mentoria')}</div><div id="f-ment"></div></article>
   <article class="card pc" data-r id="f-disp"></article></div></div>`;
FB.agenda=()=>{renderAgenda();renderMentP();renderDisp()};
function renderAgenda(){
 const l=$('#f-live');if(!l)return;const cid=S.pc,pl=proxPl(cid),pauta=pDuv().filter(d=>d.status==='plantao'),d0=pl?new Date(pl.inicio):new Date(Date.now()+7*86400000);if(!pl)d0.setHours(19,0,0,0);
 l.innerHTML=`<div class="pc-i wr"><span class="icb">${ic('video',20)}</span><div style="flex:1 1 160px"><h2 class="h4">Próximo plantão da turma</h2><p class="sm">${pl?`${quando(pl.inicio)} · ${pl.duracao_min} minutos`:'Data a definir'}</p></div>${pl?tag('Marcado','gold'):''}</div>
  <div><div class="pc-h" style="padding-bottom:10px"><p class="lbl g">Pauta do encontro</p><span class="sm">${plural(pauta.length,'dúvida','dúvidas')}</span></div>${pauta.length?pauta.map((d,i)=>`<div class="fq"><span class="fnum">${i+1}</span><span class="tx"><strong>${esc(d.titulo)}</strong><span class="sm">${esc(d.aluno)}</span></span></div>`).join(''):'<p class="sm">Leve dúvidas para a pauta pela tela Dúvidas.</p>'}</div>
  <form id="pl-f" class="pgf" novalidate><label class="fl"><span>Data e hora</span><input class="inp" id="pl-quando" type="datetime-local" value="${toLocalInput(d0)}"></label><label class="fl"><span>Duração (min)</span><input class="inp" id="pl-dur" type="number" min="15" max="240" step="15" value="${pl?pl.duracao_min:60}"></label>
   <label class="fl full"><span>Link da sala (Meet, Zoom, Teams)</span><input class="inp" id="pl-link" type="url" placeholder="https://" value="${esc(pl&&pl.link||'')}"></label>
   <p class="msg full" aria-live="polite"></p><div class="acts full">${btn(pl?'Salvar alterações':'Marcar plantão','gold',{type:'submit',icon:false})}${pl&&P().email?btn('Avisar a turma por e-mail','glass',{icon:false,attr:`data-avisar="${pl.id}"`}):''}${pl?btn('Desmarcar','line',{icon:false,attr:`data-pl-del="${pl.id}"`}):''}</div></form>`;
 const past=P().plantoes.filter(p=>p.curso_id===cid&&+new Date(p.inicio)+p.duracao_min*60000<=Date.now()).slice(0,8);
 $('#f-past').innerHTML=`<h2 class="h4" style="padding-bottom:12px">Plantões anteriores</h2>${past.length?past.map(p=>`<div class="fq"><span class="fav">${ic('play',14)}</span><span class="tx"><strong>Plantão de ${curto(p.inicio)}</strong><span class="sm">${p.gravacao?'Gravação publicada para a turma':'Sem gravação publicada'}</span></span>${p.gravacao?`<a class="lk" href="${esc(p.gravacao)}" target="_blank" rel="noopener"><span>Ver</span>${ic('ar',14)}</a>`:`<button type="button" class="lk" data-grav="${p.id}"><span>Publicar gravação</span>${ic('ar',14)}</button>`}</div>`).join(''):'<p class="sm">Os plantões realizados aparecem aqui, com a gravação para a turma.</p>'}`;
}
function renderMentP(){
 const w=$('#f-ment');if(!w)return;const ms=P().mentorias.filter(m=>m.curso_id===S.pc&&m.status!=='cancelado').sort((a,b)=>new Date(a.inicio)-new Date(b.inicio));
 w.innerHTML=ms.length?ms.map(m=>`<div class="fment" data-mid="${m.id}"><div class="pwho">${fav(iniOf(m.aluno))}<span style="display:grid;gap:2px"><strong style="font-weight:500;font-size:14px">${esc(m.aluno)}</strong><span class="sm">${quando(m.inicio)} · ${MST[m.status]}</span></span></div>
  ${m.status==='pedido'?`<div class="acts">${btn('Confirmar horário','gold',{s:1,icon:false,attr:`data-mp="confirmar" data-m="${m.id}"`})}${btn('Propor outro','glass',{s:1,icon:false,attr:`data-mp-prop="${m.id}"`})}${btn('Recusar','line',{s:1,icon:false,attr:`data-mp="cancelar" data-m="${m.id}"`})}</div>`
  :m.status==='confirmado'?`<div class="acts">${btn(m.link?'Trocar link':'Adicionar link','glass',{s:1,icon:false,attr:`data-mp-link="${m.id}"`})}${new Date(m.inicio)<Date.now()?btn('Marcar como realizada','gold',{s:1,icon:false,attr:`data-mp="realizado" data-m="${m.id}"`}):''}${btn('Cancelar','line',{s:1,icon:false,attr:`data-mp="cancelar" data-m="${m.id}"`})}</div>`
  :m.status==='proposto'?`<div>${tag('Aguardando o aluno')}</div>`:`<div>${tag(MST[m.status],'gold')}</div>`}<div class="mp-x"></div></div>`).join(''):'<p class="sm" style="padding:8px 0">Nenhum pedido de mentoria nesta formação.</p>';
}
function renderDisp(){
 const w=$('#f-disp');if(!w)return;const d=Array.isArray(prefs2().disp)?prefs2().disp:[];
 w.innerHTML=`<h2 class="h4">Sua disponibilidade</h2><p class="sm">Os alunos do plano Mentoria escolhem horários de 30 minutos dentro destas janelas, nas duas semanas seguintes.</p>
  ${d.map((x,i)=>`<div class="psw fsw"><span><span>${DAYN[x.dia]}</span><span class="sm">${x.ini} às ${x.fim}</span></span><span class="acts"><label class="psw"><input type="checkbox" data-disp-on="${i}"${x.on!==false?' checked':''} aria-label="Ativar ${DAYN[x.dia]} ${x.ini}"><i></i></label><button type="button" class="pico" data-disp-del="${i}" aria-label="Remover ${DAYN[x.dia]} ${x.ini}">${ic('x',14)}</button></span></div>`).join('')||'<p class="sm">Nenhum horário cadastrado.</p>'}
  <form id="disp-f" class="pgf" novalidate><label class="fl"><span>Dia</span><select class="inp" id="dp-dia">${DAYN.map((n,i)=>`<option value="${i}">${n}</option>`).join('')}</select></label><label class="fl"><span>Das</span><input class="inp" id="dp-ini" type="time" value="18:00"></label><label class="fl"><span>Às</span><input class="inp" id="dp-fim" type="time" value="19:00"></label><div class="fl" style="align-self:end">${btn('Adicionar','glass',{type:'submit',icon:false,s:1})}</div></form>`;
}

FV.turma=()=>{const t=turma(S.pc),n=s=>t.filter(a=>a.sit===s).length;return `${fhead(`Como a turma ${em('está avançando.')}`,'Quem está em dia, quem atrasou e quem parou. Um lembrete seu costuma trazer o aluno de volta.')}
 <div class="ptit mid" data-r>${segH('ft-seg',[['todos',`Todos · ${t.length}`],['0',`Em dia · ${n(0)}`],['1',`Atrasados · ${n(1)}`],['2',`Parados · ${n(2)}`]],S.fturma,'data-ftf')}${lk('Exportar lista',{attr:'data-exp'})}</div>
 <article class="card ftb" data-r><div class="ftr h"><span class="lbl">Aluno</span><span class="lbl">Plano</span><span class="lbl">Progresso</span><span class="lbl">Última atividade</span><span class="lbl">Situação</span><span></span></div><div id="ft-rows"></div></article>
 <p class="sm" id="ft-note"></p>`};
FB.turma=()=>{
 const w=$('#ft-rows');if(!w)return;const t=turma(S.pc),f=S.fturma,rows=t.filter(r=>f==='todos'||r.sit===+f);
 w.innerHTML=rows.map(r=>`<div class="ftr"><span>${fav(iniOf(r.nome||r.email),'s')}<span class="nm">${esc(r.nome||r.email)}</span></span><span>${PLANS[lvl(r.plano)].n}</span><span><span class="bar"><i style="--v:${r.pct}%"></i></span><span style="color:var(--branco)">${r.pct}%</span></span><span>${r.conta?r.last?rel(r.last):'não começou':'ainda sem conta'}</span><span><i class="d" style="background:${SITC[r.sit]}"></i><span style="color:var(--branco)">${r.fim?'Concluiu':SIT[r.sit]}</span></span><span>${r.sit&&P().email&&r.conta?`<button type="button" class="lk" data-lemb="${esc(r.email)}"><span>Enviar lembrete</span>${ic('ar',14)}</button>`:''}</span></div>`).join('')||'<p class="sm" style="padding:16px">Nenhum aluno com este filtro.</p>';
 $('#ft-note').textContent=`Mostrando ${rows.length} de ${plural(t.length,'aluno','alunos')}.${P().email?'':' Os lembretes por e-mail aparecem quando a EJUP ligar o envio de e-mails do portal.'}`;
};

FV.ia=()=>{const st=mStats(S.pc),ens=P().minerva.ensinadas.filter(r=>r.curso_id===S.pc);
 const temas={};st.L.filter(l=>l.resposta_id).forEach(l=>{(temas[l.resposta_id]=temas[l.resposta_id]||{n:0,q:l.pergunta}).n++});const tt=Object.values(temas).sort((a,b)=>b.n-a.n).slice(0,4),mx=tt[0]?tt[0].n:1;
 return `${fhead(`O que a Minerva ${em('anda respondendo.')}`,'A Minerva responde só com o banco de respostas da EJUP e dos professores. Aqui você confere o que ela não soube ou não ajudou e ensina a resposta certa.')}
 <div class="fstats t3">${fstat('Perguntas na semana',st.sem.length,`de ${plural(new Set(st.sem.map(l=>l.user_id||l.id)).size,'aluno','alunos')}`)}${fstat('Ajudaram o aluno',st.pct===null?'—':st.pct+'%','entre as respostas avaliadas')}${fstat('Para revisar',st.rev.length,'sem resposta ou “não ajudou”')}</div>
 <div class="prow f4">
  <article class="card pc" data-r><div class="pc-h"><h2 class="h4">Para revisar</h2>${tag(plural(st.rev.length,'pergunta','perguntas'),'gold')}</div><div id="ir-list"></div></article>
  <div class="pcol">
   <article class="card pc" data-r><h2 class="h4">Temas mais perguntados</h2>${tt.length?tt.map(x=>fbar(x.q,String(x.n),Math.round(x.n/mx*100))).join(''):'<p class="sm">Ainda sem perguntas nesta formação.</p>'}</article>
   <article class="card pc" data-r><h2 class="h4">De onde a Minerva responde</h2><div class="prl first"><span><strong>Respostas desta formação</strong><span class="sm">Cadastradas pela EJUP ou ensinadas por professores</span></span><strong>${ens.length}</strong></div><div class="prl"><span><strong>Ensinadas por professores</strong><span class="sm">Respostas às dúvidas e correções</span></span><strong>${ens.filter(r=>r.origem==='professor').length}</strong></div><p class="sm">Ela também usa as respostas gerais da EJUP. Nada de fora do banco.</p></article>
  </div></div>`};
FB.ia=()=>{
 const w=$('#ir-list');if(!w)return;const l=mStats(S.pc).rev;
 if(!l.length){w.innerHTML=`<div class="okbox"><span class="ck">${ic('check',28)}</span><p class="h4">Tudo revisado.</p><p class="sm">Novas perguntas sem resposta ou marcadas como “não ajudou” aparecem aqui.</p></div>`;return}
 S.irsel=Math.min(S.irsel,l.length-1);
 w.innerHTML=l.map((r,i)=>i===S.irsel?`<div class="fir" data-ir-i="${i}"><div class="pc-h wr"><p class="lbl">Pergunta do aluno</p>${tag(r.sem?'Sem resposta cadastrada':`${plural(r.n,'aluno marcou','alunos marcaram')}: não ajudou`)}</div><p class="body" style="color:var(--branco)"></p>
   ${S.iredit?`<form id="ir-f" class="pform" novalidate><div class="fed"><label class="lbl g" for="ir-a">Como a Minerva deve responder</label><textarea id="ir-a" placeholder="Escreva a resposta. Ela passa a valer para perguntas parecidas nesta formação."></textarea></div><p class="msg" aria-live="polite"></p><div class="acts">${btn('Salvar resposta','gold',{s:1,icon:false,type:'submit'})}${btn('Cancelar','line',{s:1,icon:false,attr:'data-ir="cancel"'})}</div></form>`
    :`<div class="acts">${btn(r.sem?'Ensinar a resposta':'Corrigir resposta','gold',{s:1,icon:false,attr:'data-ir="edit"'})}${r.sem?'':btn('Está certa','glass',{s:1,icon:false,attr:'data-ir="ok"'})}${btn('Encaminhar ao professor','line',{s:1,icon:false,attr:'data-ir="nao"'})}</div>`}</div>`
  :`<button type="button" class="fq" data-ir-sel="${i}"><span class="tx"><strong></strong></span><span class="sm">${plural(r.n,'vez','vezes')}</span>${ic('ar',14)}</button>`).join('');
 $$('[data-ir-i] .body,[data-ir-sel] strong',w).forEach(e=>{const i=+(e.closest('[data-ir-i]')||e.closest('[data-ir-sel]')).dataset[e.closest('[data-ir-i]')?'irI':'irSel'];e.textContent=l[i].q});
};

/* ======================================================================
   EVENTOS
   ====================================================================== */
const inPortal=()=>!!$('#pmain');
async function savePrefs(patch,msg){
 const src=S.area==='prof'?S.prof.perfil:M().perfil;
 try{const r=await api('prefs',{body:patch});src.prefs=r.prefs;if(S.me&&S.area==='prof')S.me.perfil.prefs=r.prefs;if(S.prof&&S.area!=='prof')S.prof.perfil.prefs=r.prefs;msg&&toast(msg);return true}catch(e){toast(e.message);return false}
}
async function sair(todos){try{await api('sair',{body:{todos:!!todos}})}catch(e){}S.me=S.prof=null;S.chat={};S.aulas={};E.syncSess();toast(todos?'Você saiu de todos os aparelhos.':'Você saiu da conta.');go('home')}

document.addEventListener('click',async e=>{
 const t=e.target;if(!t.closest)return;let x;
 /* login */
 if((x=t.closest('[data-acc]'))){setAuth(x.dataset.acc==='aluno'?'entrar':x.dataset.acc);return}
 if((x=t.closest('#au-f [data-mode]'))){setAuth(x.dataset.mode);return}
 if(t.closest('[data-go-rec]')){REC.email=($('#au-email')||{}).value||'';go('recuperar');return}
 if((x=t.closest('[data-rc]'))){REC.step=+x.dataset.rc;renderRec();return}
 if((x=t.closest('[data-eye]'))){const i=document.getElementById(x.dataset.eye),s=i.type==='password';i.type=s?'text':'password';x.setAttribute('aria-label',s?'Ocultar senha':'Mostrar senha');return}
 if(t.closest('[data-print]')){print();return}
 if(!inPortal())return;
 if(t.closest('[data-reload]')){if(S.area==='equipe'){S.eq=null;S.news=null;PAGES.equipe.mount(S.earg);return}S.area==='prof'?(S.prof=null,PAGES.prof.mount(S.parg)):(S.me=null,PAGES.portal.mount(S.arg));return}
 /* menus */
 const pm=$('#pmenu'),pa=$('#pavisos');
 if((x=t.closest('[data-pmenu]'))){pm.hidden=!pm.hidden;x.setAttribute('aria-expanded',!pm.hidden);if(pa)pa.hidden=true;return}
 if((x=t.closest('[data-bell]'))){const l=avisos();pa.innerHTML=`<p class="sm">Avisos</p>${l.length?l.slice(0,8).map(a=>`<a href="/${a.go}"${a.novo?' class="on"':''}>${ic('bell',16)}<span>${esc(a.t)}</span></a>`).join(''):'<p class="sm" style="border:0;padding:10px 12px">Nenhum aviso por enquanto.</p>'}`;links(pa);pa.hidden=!pa.hidden;x.setAttribute('aria-expanded',!pa.hidden);pm.hidden=true;if(!pa.hidden&&l.some(a=>a.novo)){savePrefs({lido:true}).then(()=>syncShell())}return}
 if(pm&&!pm.hidden&&!t.closest('#pmenu'))pm.hidden=true;
 if(pa&&!pa.hidden&&!t.closest('#pavisos'))pa.hidden=true;
 if(t.closest('[data-logout]')){sair(false);return}
 if(t.closest('[data-sair-todos]')){sair(true);return}
 if((x=t.closest('[data-copy-url]'))){try{await navigator.clipboard.writeText(x.dataset.copyUrl);toast('Link de validação copiado.')}catch(err){toast('Não foi possível copiar aqui. O link é '+x.dataset.copyUrl)}return}
 if((x=t.closest('[data-set-curso]'))){S.curso=x.dataset.setCurso;savePrefs({curso:S.curso});return}

 /* aluno */
 if(S.area==='portal'&&S.me){
  if((x=t.closest('[data-ff]'))){S.ff=x.dataset.ff;$$('[data-ff]').forEach(b=>b.classList.toggle('on',b===x));placeSeg(x.parentElement);const w=$('#pf-list');w.classList.add('pv-out');setTimeout(()=>{w.innerHTML=formList();links(w);w.classList.remove('pv-out')},RM?0:200);return}
  if(t.closest('#pp-done')){marcar(S.aula,!feita(S.aula));return}
  if((x=t.closest('[data-ptab]'))){S.tab=x.dataset.ptab;$$('[data-ptab]').forEach(b=>b.classList.toggle('on',b===x));placeSeg(x.parentElement);renderTab();return}
  if((x=t.closest('[data-note-save]'))){const v=$('#pp-note').value,m=$('#pp-panel .msg');busy(x,true,'Salvando…');try{const r=await api('nota',{body:{aula:S.aula,texto:v,segundo:Math.floor(S.t||0)}});const ns=M().notas,i=ns.findIndex(n=>n.aula_id===S.aula);i<0?ns.push(r.nota):ns[i]=r.nota;busy(x,false);say(m,'Anotação salva.')}catch(err){busy(x,false);say(m,err.message,true)}return}
  if((x=t.closest('[data-src]'))){const id=x.dataset.src,sg=+x.dataset.seg||0;if(id===S.aula&&S.vid&&S.vid.seek){S.vid.seek(sg);$('#pp').scrollIntoView({behavior:RM?'auto':'smooth',block:'center'})}else go(`portal/aula/${id}${sg?'/'+sg:''}`);return}
  if((x=t.closest('[data-pace]'))){const v=+x.dataset.pace;$$('[data-pace]').forEach(b=>b.classList.toggle('on',b===x));placeSeg(x.parentElement);if(await savePrefs({pace:v}))S.view==='plano'&&rerender();return}
  if((x=t.closest('[data-day]'))){const d=+x.dataset.day,cur=days();let n=cur.includes(d)?cur.filter(i=>i!==d):[...cur,d].sort();if(!n.length){toast('Mantenha pelo menos um dia de estudo.');return}if(await savePrefs({days:n}))rerender();return}
  if(t.closest('[data-reorg]')){const g=$('#pl-weeks');g.classList.add('pv-out');setTimeout(()=>{rerender();toast('Plano refeito: as aulas pendentes foram redistribuídas a partir desta semana.')},RM?0:220);return}
  if((x=t.closest('[data-ai-go]'))){S.askQ=x.dataset.aiGo;S.view==='ia'?(S.askQ='',aiAsk(x.dataset.aiGo)):go('portal/ia');return}
  if((x=t.closest('[data-ai-sug]'))){aiAsk(x.dataset.aiSug);return}
  if(t.closest('[data-ai-new]')){S.chat[S.curso]=[];PB.ia();$('#ai-q').focus();return}
  if((x=t.closest('[data-fb]'))){const box=x.closest('.aifb'),ok=x.dataset.fb==='1';api('minerva-fb',{body:{log:+box.dataset.log,ajudou:ok}}).catch(()=>{});
   if(ok){box.innerHTML='<span class="sm">Obrigado pelo retorno.</span>';return}
   box.innerHTML='<span class="sm">Obrigado. O professor revisa as respostas marcadas.</span>';S.draft={q:S.lastQ,ia:true};S.sel='new';go('portal/suporte');return}
  if(t.closest('[data-handoff]')){S.draft={q:S.lastQ||'',aula:S.aula,segundo:Math.floor(S.t||0)||null,ia:!!S.lastQ};S.sel='new';go('portal/suporte');return}
  if(t.closest('[data-th-new]')){S.sel='new';S.draft=S.draft||null;renderThreads();$('#th-det').scrollIntoView({behavior:RM?'auto':'smooth',block:'center'});const q=$('#sup-q');q&&q.focus({preventScroll:true});return}
  if(t.closest('[data-th-cancel]')){S.sel=null;S.draft=null;renderThreads();return}
  if((x=t.closest('[data-th]'))){S.sel=+x.dataset.th;S.draft=null;renderThreads();if(innerWidth<1025)$('#th-det').scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});return}
  if((x=t.closest('[data-th-ok]'))){busy(x,true);try{await api('duvida-status',{body:{duvida:S.sel,status:'encerrada'}});M().duvidas.find(d=>d.id===S.sel).status='encerrada';renderThreads();toast('Dúvida encerrada.')}catch(err){busy(x,false);toast(err.message)}return}
  if((x=t.closest('[data-ics]'))){const p=M().plantoes.find(y=>String(y.id)===x.dataset.ics);if(p)download('plantao-ejup.ics',ics(p),'text/calendar');return}
  if((x=t.closest('[data-slot]'))){const when=new Date(x.dataset.slot);busy(x,true);try{const r=await api('mentoria-pedir',{body:{curso:S.curso,inicio:when.toISOString()}});M().mentorias.push(r.mentoria);renderMent();toast('Pedido enviado. O professor confirma o horário ou propõe outro.')}catch(err){busy(x,false);toast(err.message)}return}
  if((x=t.closest('[data-m-acao]'))){busy(x,true);try{const r=await api('mentoria-aluno',{body:{id:+x.dataset.m,acao:x.dataset.mAcao}});const ms=M().mentorias,i=ms.findIndex(m=>m.id===r.mentoria.id);ms[i]=r.mentoria;renderMent();toast(r.mentoria.status==='confirmado'?'Horário confirmado.':'Mentoria cancelada.')}catch(err){busy(x,false);toast(err.message)}return}
  if(t.closest('[data-cert-edit]')){const c=$('#cert-name');c.innerHTML=`<span class="icb">${ic('user',20)}</span><form id="cert-f" class="aiform" style="flex:1" novalidate><label class="field"><input id="cert-n" aria-label="Nome no certificado" autocomplete="off"></label>${btn('Salvar','gold',{s:1,icon:false,type:'submit'})}</form>`;const i=$('#cert-n');i.value=M().perfil.nome_certificado||M().perfil.nome;i.focus();return}
 }
 /* perfil (aluno e professor) */
 if(t.closest('[data-pw-go]')){const b=$('#pw-box');b.hidden=!b.hidden;if(!b.hidden){b.innerHTML=`<form id="pw-f" class="fields" novalidate style="padding:12px 0">${pwField('pw-n1','Nova senha','new-password')}${pwField('pw-n2','Confirmar nova senha','new-password')}<p class="err" id="pw-err" role="alert"></p>${btn('Salvar nova senha','gold',{s:1,type:'submit',icon:false})}</form>`;$('#pw-n1').focus()}return}
 if((x=t.closest('[data-dados]'))){busy(x,true,'Preparando…');try{const d=await api('dados');download(`meus-dados-ejup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(d,null,2))}catch(err){toast(err.message)}busy(x,false);return}
 if(t.closest('[data-excluir]')){const b=$('#ex-box');b.hidden=!b.hidden;if(!b.hidden){b.innerHTML=`<form id="ex-f" class="fields" novalidate><label class="fl"><span>Para confirmar, digite EXCLUIR. Não dá para desfazer.</span><input class="inp" id="ex-c" autocomplete="off"></label><p class="err" id="ex-err" role="alert"></p>${btn('Excluir minha conta','line',{s:1,type:'submit',icon:false})}</form>`;$('#ex-c').focus()}return}

 /* professor */
 if(S.area==='prof'&&S.prof){
  if((x=t.closest('[data-fq-go]'))){S.fsel=+x.dataset.fqGo;S.fq='pend';S.fpl=0;S.fopen=innerWidth<1025;go(`prof/duvidas`);return}
  if((x=t.closest('[data-fq]'))){S.fsel=+x.dataset.fq;S.fopen=innerWidth<1025;renderFQ();if(S.fopen)scrollTo(0,0);return}
  if(t.closest('[data-fq-back]')){S.fopen=false;renderFQ();scrollTo(0,0);return}
  if((x=t.closest('[data-fqf]'))){S.fq=x.dataset.fqf;$$('[data-fqf]').forEach(b=>b.classList.toggle('on',b===x));placeSeg(x.parentElement);S.fsel=null;renderFQ();return}
  if((x=t.closest('[data-fpl]'))){S.fpl=+x.dataset.fpl;$$('[data-fpl]').forEach(b=>b.classList.toggle('on',b===x));renderFQ();return}
  if((x=t.closest('[data-fq-draft]'))){const d=P().duvidas.find(y=>y.id===S.fsel),a=$('#fq-a');busy(x,true,'Buscando…');try{const r=await api('minerva',{body:{curso:d.curso_id,pergunta:d.mensagens[0].texto.slice(0,500)}});busy(x,false);if(r.semResposta){toast('O banco da Minerva não tem resposta para esta pergunta. Escreva a sua: ela ensina a Minerva.');return}a.value=r.reply;a.focus()}catch(err){busy(x,false);toast(err.message)}return}
  if((x=t.closest('[data-fq-live]'))){busy(x,true);try{await api('duvida-status',{body:{duvida:S.fsel,status:'plantao'}});P().duvidas.find(d=>d.id===S.fsel).status='plantao';S.fopen=false;renderFQ();profShell();toast(proxPl(S.pc)?'Dúvida levada para a pauta do próximo plantão.':'Dúvida na pauta. Marque a data do plantão em Plantões e mentorias.')}catch(err){busy(x,false);toast(err.message)}return}
  if((x=t.closest('[data-fq-close]'))){busy(x,true);try{await api('duvida-status',{body:{duvida:S.fsel,status:'encerrada'}});P().duvidas.find(d=>d.id===S.fsel).status='encerrada';renderFQ();profShell();toast('Dúvida encerrada.')}catch(err){busy(x,false);toast(err.message)}return}
  if((x=t.closest('[data-ftf]'))){S.fturma=x.dataset.ftf;$$('[data-ftf]').forEach(b=>b.classList.toggle('on',b===x));placeSeg(x.parentElement);FB.turma();return}
  if((x=t.closest('[data-lemb]'))){busy(x,true,'Enviando…');try{await api('lembrete',{body:{curso:S.pc,email:x.dataset.lemb}});x.outerHTML='<span class="sm g">Lembrete enviado</span>'}catch(err){busy(x,false);toast(err.message)}return}
  if(t.closest('[data-exp]')){const rows=turma(S.pc),c=pCurso(S.pc),q=v=>`"${String(v??'').replace(/"/g,'""')}"`;download(`turma-${c.id}.csv`,'﻿'+[['Nome','E-mail','Plano','Progresso (%)','Última atividade','Situação'].map(q).join(';'),...rows.map(r=>[r.nome,r.email,PLANS[lvl(r.plano)].n,r.pct,r.last?dia(r.last):'',r.fim?'Concluiu':SIT[r.sit]].map(q).join(';'))].join('\n'),'text/csv;charset=utf-8');return}
  if((x=t.closest('[data-avisar]'))){busy(x,true,'Enviando…');try{const r=await api('avisar',{body:{plantao:+x.dataset.avisar}});busy(x,false);toast(`Aviso enviado para ${plural(r.enviados,'aluno','alunos')}.`)}catch(err){busy(x,false);toast(err.message)}return}
  if((x=t.closest('[data-pl-del]'))){if(!confirm('Desmarcar este plantão?'))return;try{await api('plantao',{body:{id:+x.dataset.plDel,remover:true}});P().plantoes=P().plantoes.filter(p=>p.id!==+x.dataset.plDel);renderAgenda();toast('Plantão desmarcado.')}catch(err){toast(err.message)}return}
  if((x=t.closest('[data-grav]'))){const url=prompt('Cole o link da gravação (YouTube, Vimeo, Drive):');if(!url)return;try{const r=await api('plantao',{body:{id:+x.dataset.grav,gravacao:url.trim()}});const i=P().plantoes.findIndex(p=>p.id===r.plantao.id);P().plantoes[i]=r.plantao;renderAgenda();toast('Gravação publicada para a turma.')}catch(err){toast(err.message)}return}
  if((x=t.closest('[data-mp]'))){busy(x,true);try{const r=await api('mentoria-prof',{body:{id:+x.dataset.m,acao:x.dataset.mp}});const ms=P().mentorias,i=ms.findIndex(m=>m.id===r.mentoria.id);ms[i]={...ms[i],...r.mentoria};renderMentP();toast({confirmado:'Horário confirmado. O aluno recebe o aviso.',cancelado:'Mentoria cancelada.',realizado:'Mentoria marcada como realizada.'}[r.mentoria.status]||'Mentoria atualizada.')}catch(err){busy(x,false);toast(err.message)}return}
  if((x=t.closest('[data-mp-prop],[data-mp-link]'))){const id=+(x.dataset.mpProp||x.dataset.mpLink),prop=!!x.dataset.mpProp,box=$(`[data-mid="${id}"] .mp-x`);const m=P().mentorias.find(y=>y.id===id);
   box.innerHTML=`<form class="pgf mp-f" data-mid-f="${id}" data-kind="${prop?'propor':'link'}" novalidate style="padding-top:10px">${prop?`<label class="fl full"><span>Novo horário</span><input class="inp" type="datetime-local" name="q" value="${toLocalInput(new Date(Math.max(Date.now()+86400000,+new Date(m.inicio))))}"></label>`:`<label class="fl full"><span>Link da sala</span><input class="inp" type="url" name="q" placeholder="https://" value="${esc(m.link||'')}"></label>`}<div class="full">${btn(prop?'Enviar proposta':'Salvar link','gold',{s:1,icon:false,type:'submit'})}</div></form>`;$('input',box).focus();return}
  if((x=t.closest('[data-disp-del]'))){const d=[...(prefs2().disp||[])];d.splice(+x.dataset.dispDel,1);if(await savePrefs({disp:d},'Horário removido.'))renderDisp();return}
  if((x=t.closest('[data-ir-sel]'))){S.irsel=+x.dataset.irSel;S.iredit=false;FB.ia();return}
  if((x=t.closest('[data-ir]'))){const k=x.dataset.ir;if(k==='edit'){S.iredit=true;FB.ia();$('#ir-a').focus();return}if(k==='cancel'){S.iredit=false;FB.ia();return}
   const r=mStats(S.pc).rev[S.irsel];busy(x,true);try{await api('minerva-rev',{body:{curso:S.pc,pergunta:r.q,logs:r.ids,acao:k}});P().minerva.logs.forEach(l=>{if(r.ids.includes(l.id))l.revisado=true});S.iredit=false;FB.ia();toast(k==='ok'?'Marcada como correta. A Minerva mantém esta resposta.':'A Minerva passa a encaminhar perguntas como esta ao professor.')}catch(err){busy(x,false);toast(err.message)}return}
 }
});

document.addEventListener('submit',async e=>{
 const f=e.target;
 if(f.id==='au-f'){e.preventDefault();authSubmit(f);return}
 if(f.id==='rc-f1'||f.id==='rc-f3'){e.preventDefault();recSubmit(f);return}
 if(f.id==='cp-f'){e.preventDefault();const c=normCod($('#cp-c').value);if(!/^EJUP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c)){say($('#cp-err'),'O código tem o formato EJUP-XXXX-XXXX.',true);$('#cp-c').focus();return}go('certificado/'+c);return}
 if(!inPortal())return;
 e.preventDefault();const b=$('button[type="submit"]',f),m=$('.msg',f);
 if(f.id==='p-sf'||f.id==='f-sf'){const q=$('input',f).value.trim();if(!q)return;if(f.id==='p-sf'){go('portal/busca/'+encodeURIComponent(q));return}
  const n=norm(q),hit=P().duvidas.find(d=>norm(d.titulo+' '+d.aluno).includes(n));if(hit){S.fsel=hit.id;S.fq='todas';S.fpl=0;go('prof/duvidas');return}
  const al=turma(S.pc).find(a=>norm(a.nome+' '+a.email).includes(n));if(al){S.fturma='todos';go('prof/turma');toast(`${al.nome||al.email}: ${al.pct}% concluído.`);return}toast('Nada encontrado com essa busca.');return}
 if(f.id==='ai-f'){const i=$('#ai-q');aiAsk(i.value);i.value='';return}
 if(f.id==='sup-f'){const i=$('#sup-q'),v=i.value.trim();if(v.length<8){i.classList.add('bad');say(m,'Escreva a dúvida com um pouco mais de detalhe.',true);i.focus();return}
  const dr=S.draft||{};busy(b,true,'Enviando…');try{const r=await api('duvida',{body:{curso:S.curso,texto:v,aula:dr.aula||undefined,segundo:dr.segundo||undefined,via_minerva:!!dr.ia}});M().duvidas.unshift(r.duvida);S.draft=null;S.sel=r.duvida.id;renderThreads();toast('Dúvida enviada ao professor.')}catch(err){busy(b,false);say(m,err.message,true)}return}
 if(f.id==='th-f'){const i=$('#th-r'),v=i.value.trim();if(v.length<2){i.classList.add('bad');i.focus();return}busy(b,true,'Enviando…');
  try{const r=await api('mensagem',{body:{duvida:S.sel,texto:v}});const d=M().duvidas.find(x=>x.id===S.sel);d.mensagens.push(r.mensagem);d.status=r.status;renderThreads();toast('Mensagem enviada ao professor.')}catch(err){busy(b,false);say(m,err.message,true)}return}
 if(f.id==='cert-f'){const i=$('#cert-n'),v=i.value.trim();if(v.length<2){i.closest('.field').classList.add('bad');i.focus();return}
  try{const r=await api('perfil',{body:{nome_certificado:v}});M().perfil=r.perfil;rerender();toast('Nome atualizado. A troca vale para os certificados exibidos e baixados a partir de agora.')}catch(err){toast(err.message)}return}
 if(f.id==='pf-f'){const n=$('#pf-nome');n.classList.remove('bad');if(n.value.trim().length<2){n.classList.add('bad');say(m,'Digite o seu nome completo.',true);n.focus();return}
  const val=id=>{const x=$(id);return x?x.value.trim():undefined},body={nome:n.value.trim()};
  if(S.area==='prof')Object.assign(body,{areas:val('#pf-areas'),bio:val('#pf-bio')});else Object.assign(body,{tel:val('#pf-tel'),area:val('#pf-area'),oab:val('#pf-oab'),nome_certificado:val('#pf-cert')});
  busy(b,true,'Salvando…');try{const r=await api('perfil',{body});if(S.area==='prof')S.prof.perfil=r.perfil;else M().perfil=r.perfil;busy(b,false);say(m,'');syncUser(r.perfil);toast('Perfil atualizado.')}catch(err){busy(b,false);say(m,err.message,true)}return}
 if(f.id==='pw-f'){const a=$('#pw-n1'),c=$('#pw-n2'),er=$('#pw-err');if(a.value.length<8){say(er,'A senha precisa ter pelo menos 8 caracteres.',true);a.focus();return}if(a.value!==c.value){say(er,'As duas senhas precisam ser iguais.',true);c.focus();return}
  busy(b,true,'Salvando…');try{await api('nova-senha',{body:{senha:a.value}});$('#pw-box').hidden=true;toast('Senha alterada.')}catch(err){busy(b,false);say(er,err.message,true)}return}
 if(f.id==='ex-f'){const c=$('#ex-c'),er=$('#ex-err');if(c.value.trim()!=='EXCLUIR'){say(er,'Digite EXCLUIR para confirmar.',true);c.focus();return}
  busy(b,true,'Excluindo…');try{await api('excluir',{body:{confirmar:'EXCLUIR'}});S.me=S.prof=null;E.syncSess();toast('Conta excluída. Seus dados foram apagados.');go('home')}catch(err){busy(b,false);say(er,err.message,true)}return}
 /* professor */
 if(f.id==='fq-f'){const a=$('#fq-a'),v=a.value.trim();if(v.length<8){say(m,'Escreva a resposta antes de enviar.',true);a.focus();return}
  const teach=!!($('[data-fq-teach]',f)||{}).checked;busy(b,true,'Enviando…');
  try{const r=await api('mensagem',{body:{duvida:S.fsel,texto:v,ensinar:teach}});const d=P().duvidas.find(x=>x.id===S.fsel);d.mensagens.push(r.mensagem);d.status=r.status;d.atualizado_em=new Date().toISOString();
   if(teach)P().minerva.ensinadas.push({id:'prof-'+d.id,curso_id:d.curso_id,origem:'professor'});
   S.fopen=false;const nx=pPend()[0];if(S.fq==='pend')S.fsel=nx?nx.id:null;renderFQ();profShell();if(innerWidth<1025)scrollTo(0,0);
   toast(`Resposta enviada.${teach?' A Minerva passa a usar a sua explicação.':''}`)}catch(err){busy(b,false);say(m,err.message,true)}return}
 if(f.id==='ir-f'){const a=$('#ir-a'),v=a.value.trim();if(v.length<8){say(m,'Escreva a resposta antes de salvar.',true);a.focus();return}
  const r=mStats(S.pc).rev[S.irsel];busy(b,true,'Salvando…');try{await api('minerva-rev',{body:{curso:S.pc,pergunta:r.q,logs:r.ids,acao:'corrigir',texto:v}});P().minerva.logs.forEach(l=>{if(r.ids.includes(l.id))l.revisado=true});P().minerva.ensinadas.push({curso_id:S.pc,origem:'professor'});S.iredit=false;FB.ia();toast('Resposta salva. A Minerva passa a responder com o seu texto.')}catch(err){busy(b,false);say(m,err.message,true)}return}
 if(f.id==='pl-f'){const q=$('#pl-quando').value,dur=+$('#pl-dur').value||60,link=$('#pl-link').value.trim(),pl=proxPl(S.pc);if(!q){say(m,'Escolha data e hora.',true);return}
  if(link&&!/^https?:\/\//.test(link)){say(m,'O link precisa começar com https://',true);$('#pl-link').focus();return}
  busy(b,true,'Salvando…');try{const r=await api('plantao',{body:pl?{id:pl.id,inicio:new Date(q).toISOString(),duracao_min:dur,link}:{curso:S.pc,inicio:new Date(q).toISOString(),duracao_min:dur,link}});
   const ps=P().plantoes,i=ps.findIndex(p=>p.id===r.plantao.id);i<0?ps.unshift(r.plantao):ps[i]=r.plantao;renderAgenda();toast(pl?'Plantão atualizado.':'Plantão marcado. Ele aparece no Portal do Aluno.')}catch(err){busy(b,false);say(m,err.message,true)}return}
 if(f.matches('[data-mid-f]')){const id=+f.dataset.midF,v=$('input',f).value,kind=f.dataset.kind;if(!v)return;busy(b,true);
  try{const r=await api('mentoria-prof',{body:kind==='propor'?{id,acao:'propor',inicio:new Date(v).toISOString()}:{id,acao:'link',link:v.trim()}});const ms=P().mentorias,i=ms.findIndex(x=>x.id===id);ms[i]={...ms[i],...r.mentoria};renderMentP();toast(kind==='propor'?'Novo horário enviado ao aluno.':'Link salvo.')}catch(err){busy(b,false);toast(err.message)}return}
 if(f.id==='disp-f'){const dia_=+$('#dp-dia').value,ini=$('#dp-ini').value,fim=$('#dp-fim').value;if(!ini||!fim||ini>=fim){toast('O horário final precisa ser depois do inicial.');return}
  const d=[...(prefs2().disp||[]),{dia:dia_,ini,fim,on:true}].sort((a,b)=>a.dia-b.dia||a.ini.localeCompare(b.ini));if(await savePrefs({disp:d},'Horário adicionado.'))renderDisp();return}
});

document.addEventListener('change',async e=>{
 const t=e.target,d=t.dataset||{};if(!inPortal())return;
 if(d.cursoSel!==undefined){S.curso=t.value;S.sel=null;S.draft=null;savePrefs({curso:S.curso});syncShell();rerender();return}
 if(d.pcSel!==undefined){S.pc=t.value;S.fsel=null;S.irsel=0;profShell();profView(S.parg,true);return}
 if(d.les){const on=t.checked;marcar(d.les,on);return}
 if(d.pref){const k=d.pref,v=t.checked;if(!(await savePrefs({[k]:v},{mail:v?'Lembretes por e-mail ativados.':'Lembretes por e-mail desativados.',news:v?'Você vai receber as novidades da EJUP.':'Novidades desativadas.'}[k]||'Preferência salva.')))t.checked=!v;return}
 if(d.dispOn!==undefined){const ds=[...(prefs2().disp||[])];ds[+d.dispOn]={...ds[+d.dispOn],on:t.checked};savePrefs({disp:ds},t.checked?'Horário disponível para os alunos.':'Horário fora da agenda.');return}
 if(d.fqInd!==undefined&&t.value){const a=pAula(t.value),ta=$('#fq-a');ta.value=(ta.value.trim()?ta.value.trim()+'\n\n':'')+`Reveja ${pLesL(a)}: ${pLesT(a)}.`;t.value='';ta.focus();return}
});
document.addEventListener('input',e=>{if(e.target.id==='rc-n1'||e.target.id==='rc-n2')recRules()});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;['#pmenu','#pavisos'].forEach(s=>{const x=$(s);if(x&&!x.hidden){x.hidden=true;const b=$(s==='#pmenu'?'[data-pmenu]':'[data-bell]');b&&b.focus()}})});

/* ======================================================================
   ÁREA DA EQUIPE (perfis.papel = equipe): matrículas, formações e aulas, banco da Minerva
   ====================================================================== */
const Q=()=>S.eq;
const ENAV=[['','Matrículas','users'],['formacoes','Formações e aulas','book'],['minerva','Banco da Minerva','spark']];
PAGES.equipe=()=>`
<section class="sec dark portal farea">
 <aside class="pside"><div class="pside-t"><a href="/equipe" class="logo" aria-label="Área da Equipe">${LOGO}</a><div>${tag('Área da Equipe','gold')}</div>
  <nav class="pnav" aria-label="Área da Equipe">${ENAV.map(([k,l,i])=>`<a href="/equipe${k?'/'+k:''}" data-pv="${k||'matriculas'}">${ic(i,18)}<span>${l}</span></a>`).join('')}</nav></div>
  <div class="pside-b"><div class="puser"><span class="pav gold" data-u-ini></span><div><span class="pu-n" data-u-nome></span><p class="sm"><a href="/prof">Área do Professor</a> · <a href="/portal">Portal</a> · <button type="button" class="lk-in" data-logout>Sair</button></p></div></div></div></aside>
 <div class="pbody">
  <header class="ptop"><a href="/equipe" class="logo pmo" aria-label="Área da Equipe">${LOGO}</a><p class="pcrumb" id="pcrumb"></p><div class="ptop-r"><button type="button" class="pav gold pmo" data-pmenu aria-haspopup="true" aria-expanded="false" aria-label="Conta" data-u-ini></button></div>
   <div class="pmenu" id="pmenu" hidden><p class="sm" data-u-nome></p><a href="/prof">${ic('users',16)}<span>Área do Professor</span></a><a href="/portal">${ic('book',16)}<span>Portal do Aluno</span></a><button type="button" data-logout>${ic('ar',16)}<span>Sair</span></button></div></header>
  <div id="pmain" class="pmain" tabindex="-1"><div class="okbox"><p class="sm">Carregando a Área da Equipe…</p></div></div>
 </div>
 <nav class="ptabs" aria-label="Área da Equipe">${ENAV.map(([k,l,i])=>`<a href="/equipe${k?'/'+k:''}" data-pv="${k||'matriculas'}">${ic(i,20)}<span>${l.split(' ')[0]}</span></a>`).join('')}</nav>
</section>`;
PAGES.equipe.mount=async arg=>{
 S.area='equipe';
 try{S.eq=await api('equipe')}catch(e){if(e.status===401)return precisaEntrar();$('#pmain').innerHTML=e.status===403?`<div class="okbox"><span class="icb">${ic('lock',20)}</span><p class="h4">${esc(e.message)}</p>${abtn('Ir para o Portal do Aluno','gold','/portal',{s:1})}</div>`:errBox(e.message,true);links($('#pmain'));return}
 if(!S.ec||!Q().cursos.some(c=>c.id===S.ec))S.ec=(Q().cursos[0]||{}).id||null;
 eqView(arg,true);
};
PAGES.equipe.sub=(arg,y)=>{if(!S.eq)return PAGES.equipe.mount(arg);eqView(arg,false,y)};
const EV={},ECR={matriculas:'Matrículas',formacoes:'Formações e aulas',minerva:'Banco da Minerva'};
function eqView(arg,first,y=0){
 const main=$('#pmain');if(!main)return;S.earg=arg;const v=EV[(arg||'').split('/')[0]]?(arg||'').split('/')[0]:'matriculas';S.view=v;
 const put=()=>{try{main.innerHTML=EV[v]()}catch(e){console.error(e);main.innerHTML=errBox('Não foi possível abrir esta tela.',true)}
  links(main);main.classList.remove('pv-out');$('#pcrumb').innerHTML=crumb('Área da Equipe',ECR[v]);syncUser(Q().perfil);
  $$('[data-pv]').forEach(a=>{const on=a.dataset.pv===v;a.classList.toggle('on',on);on?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')});
  const pm=$('#pmenu');if(pm)pm.hidden=true;document.title=`${ECR[v]} · Área da Equipe · EJUP`;
  if(!first){scrollTo({top:y,behavior:'instant'});main.focus({preventScroll:true})}reveal();$$('.seg',main).forEach(placeSeg)};
 if(first||RM){put();return}main.classList.add('pv-out');setTimeout(put,180);
}
const eqRe=()=>{const y=scrollY;eqView(S.earg,true);scrollTo({top:y,behavior:'instant'})};
const qCurso=id=>Q().cursos.find(c=>c.id===id);
const optCursos=(sel,todas)=>(todas?`<option value="">${todas}</option>`:'')+Q().cursos.map(c=>`<option value="${esc(c.id)}"${c.id===sel?' selected':''}>${esc(c.titulo)}</option>`).join('');
const optPlanos=sel=>PLANS.map(p=>`<option value="${p.k}"${p.k===sel?' selected':''}>${p.n}</option>`).join('');

/* matrículas */
EV.matriculas=()=>{const f=S.mf||{curso:'',q:''},n=norm(f.q).trim();
 const ms=Q().matriculas.filter(m=>(!f.curso||m.curso_id===f.curso)&&(!n||norm(m.email+' '+(m.nome||'')).includes(n)));
 return `${fhead(`Quem tem ${em('acesso.')}`,'Libere uma formação pelo e-mail usado na inscrição. O aluno vê a formação no portal assim que entra com esse e-mail, mesmo que crie a conta depois.')}
 <article class="card pc glow" data-r><h2 class="h4">Liberar acesso</h2>
  <form id="eq-mf" class="pgf" novalidate><label class="fl full"><span>E-mails (um por linha)</span><textarea class="inp" id="eq-emails" placeholder="aluno@exemplo.com"></textarea></label>
   <label class="fl"><span>Formação</span><select class="inp" id="eq-curso">${optCursos(S.ec)}</select></label><label class="fl"><span>Plano</span><select class="inp" id="eq-plano">${optPlanos('essencial')}</select></label>
   <p class="msg full" aria-live="polite"></p><div class="full">${btn('Liberar acesso','gold',{type:'submit',icon:false})}</div></form></article>
 <div class="ptit mid" data-r><label class="psel">${ic('book',16)}<select data-mf="curso" aria-label="Filtrar por formação">${optCursos(f.curso,'Todas as formações')}</select>${ic('down',14)}</label><label class="field psearch">${ic('search',16)}<input type="search" data-mf="q" value="${esc(f.q)}" placeholder="Buscar por e-mail ou nome" aria-label="Buscar aluno"></label></div>
 <article class="card ftb" data-r><div class="ftr h"><span class="lbl">Aluno</span><span class="lbl">Formação</span><span class="lbl">Plano</span><span class="lbl">Conta</span><span class="lbl">Acesso</span><span></span></div>
  ${ms.slice(0,300).map(m=>`<div class="ftr"><span>${fav(iniOf(m.nome||m.email),'s')}<span style="display:grid;min-width:0"><span class="nm">${esc(m.nome||m.email)}</span>${m.nome?`<span class="sm">${esc(m.email)}</span>`:''}</span></span><span>${esc((qCurso(m.curso_id)||{}).titulo||m.curso_id)}</span>
   <span><select class="eq-sel" data-mat-plano="${m.id}" aria-label="Plano">${optPlanos(m.plano)}</select></span><span>${m.conta?'Criou conta':'Ainda sem conta'}${m.certificado?' · certificado':''}</span>
   <span><label class="psw"><input type="checkbox" data-mat-ativa="${m.id}"${m.ativa?' checked':''} aria-label="Acesso ativo"><i></i></label></span><span><button type="button" class="lk" data-mat-del="${m.id}"><span>Remover</span></button></span></div>`).join('')||'<p class="sm" style="padding:16px 0">Nenhuma matrícula com este filtro.</p>'}</article>
 <p class="sm">${plural(ms.length,'matrícula','matrículas')}${ms.length>300?' · mostrando as 300 mais recentes':''}.</p>
 <article class="card pc" data-r><div class="pc-h wr"><h2 class="h4">Pessoas da equipe</h2>${tag(plural((Q().pessoas||[]).length,'pessoa','pessoas'))}</div>
  <p class="sm">Quem está aqui entra pela opção “Sou equipe EJUP” e vê a Área da Equipe e a Área do Professor de todas as formações. A pessoa precisa ter criado a conta no site antes. ${(Q().fixos||[]).length?`Os e-mails ${Q().fixos.map(esc).join(' e ')} são fixos.`:''}</p>
  ${(Q().pessoas||[]).map(x=>`<div class="fq">${fav(iniOf(x.nome||x.email),'s')}<span class="tx"><strong>${esc(x.nome||x.email)}</strong><span class="sm">${esc(x.email)}${x.fixa?' · fixo':''}</span></span>${x.fixa||x.id===Q().perfil.id?'':`<button type="button" class="lk" data-pessoa-del="${esc(x.email)}"><span>Tirar acesso</span></button>`}</div>`).join('')}
  <form id="eq-pf" class="aiform" novalidate style="margin-top:8px"><label class="field"><input type="email" id="eq-pe" placeholder="E-mail de quem vai entrar na equipe" aria-label="E-mail da nova pessoa da equipe" autocomplete="off"></label>${btn('Adicionar','gold',{s:1,icon:false,type:'submit'})}</form><p class="msg" id="eq-pm" aria-live="polite"></p></article>`};

/* formações e aulas */
const linhas=a=>(a||[]).join('\n');
const matTxt=ms=>(ms||[]).map(m=>[m.nome,m.url,m.tipo].filter(Boolean).join(' | ')).join('\n');
const parseMat=t=>t.split('\n').map(l=>l.split('|').map(x=>x.trim())).filter(p=>p[0]).map(([nome,url,tipo])=>({nome:url?nome:'Material',url:url||nome,tipo:tipo||''}));
EV.formacoes=()=>{const c=S.ec&&qCurso(S.ec),mods=c?Q().modulos.filter(m=>m.curso_id===c.id).sort((a,b)=>a.ordem-b.ordem):[];
 const cursoForm=(x,novo)=>`<form class="pgf" data-eq-curso novalidate>
   <label class="fl"><span>Nome da formação</span><input class="inp" name="titulo" value="${esc(x.titulo||'')}"></label>
   <label class="fl"><span>Endereço${novo?' (ex.: licenciamento)':''}</span><input class="inp" name="id" value="${esc(x.id||'')}"${novo?'':' readonly'}></label>
   <label class="fl"><span>Área</span><input class="inp" name="area" value="${esc(x.area||'')}"></label><label class="fl"><span>Carga horária (horas)</span><input class="inp" name="horas" type="number" min="0" step="0.5" value="${esc(x.horas??'')}"></label>
   <label class="fl"><span>Professores (como aparece ao aluno)</span><input class="inp" name="professores" value="${esc(x.professores||'')}"></label><label class="fl"><span>Capa (ex.: /img/curso1.jpg)</span><input class="inp" name="capa" value="${esc(x.capa||'')}"></label>
   <label class="fl full"><span>E-mails dos professores com acesso à Área do Professor (um por linha)</span><textarea class="inp" name="professor_emails">${esc(linhas(x.professor_emails))}</textarea></label>
   <label class="fl full"><span>Descrição curta</span><textarea class="inp" name="descricao">${esc(x.descricao||'')}</textarea></label>
   <label class="psw full"><span>Formação ativa</span><input type="checkbox" name="ativo"${x.ativo!==false?' checked':''}><i></i></label>
   <p class="msg full" aria-live="polite"></p><div class="full">${btn(novo?'Criar formação':'Salvar formação','gold',{type:'submit',icon:false})}</div></form>`;
 const aulaForm=(a,mid)=>`<form class="pgf" data-eq-aula="${esc(a.id||'')}" data-mod="${esc(mid)}" novalidate>
   <label class="fl full"><span>Título</span><input class="inp" name="titulo" value="${esc(a.titulo||'')}"></label>
   <label class="fl"><span>Ordem no módulo</span><input class="inp" name="ordem" type="number" min="0" value="${esc(a.ordem??'')}"></label><label class="fl"><span>Duração (minutos)</span><input class="inp" name="duracao_min" type="number" min="0" value="${esc(a.duracao_min??'')}"></label>
   <label class="fl full"><span>Vídeo: link do YouTube, Vimeo, Panda ou .mp4, ou caminho no Storage (bucket aulas)</span><input class="inp" name="video" value="${esc(a.video||'')}" placeholder="https://"></label>
   <label class="fl full"><span>Sobre a aula</span><textarea class="inp" name="sobre">${esc(a.sobre||'')}</textarea></label>
   <label class="fl full"><span>Tópicos (um por linha)</span><textarea class="inp" name="topicos">${esc(linhas(a.topicos))}</textarea></label>
   <label class="fl full"><span>Materiais (um por linha: nome | link ou caminho no bucket materiais | tipo)</span><textarea class="inp" name="materiais" placeholder="Slides da aula | https://… | PDF">${esc(matTxt(a.materiais))}</textarea></label>
   <label class="psw full"><span>Publicada para os alunos</span><input type="checkbox" name="publicada"${a.publicada!==false?' checked':''}><i></i></label>
   <p class="msg full" aria-live="polite"></p><div class="acts full">${btn(a.id?'Salvar aula':'Criar aula','gold',{type:'submit',icon:false,s:1})}${a.id?btn('Excluir aula','line',{icon:false,s:1,attr:`data-aula-del="${esc(a.id)}"`}):''}</div></form>`;
 return `${fhead(`Formações ${em('e aulas.')}`,'O que o aluno vê no portal: módulos, aulas, vídeos e materiais. As mudanças valem na hora.')}
 <div class="ptit mid" data-r>${Q().cursos.length?`<label class="psel">${ic('book',16)}<select data-ec aria-label="Formação">${optCursos(S.ec)}</select>${ic('down',14)}</label>`:''}${btn('Nova formação','glass',{s:1,icon:false,attr:'data-curso-novo'})}</div>
 ${S.cnovo?`<article class="card pc glow" data-r><h2 class="h4">Nova formação</h2>${cursoForm({},true)}</article>`:''}
 ${c?`<details class="card pc eqd" data-r><summary><span class="h4">${esc(c.titulo)}</span><span class="sm">${c.ativo===false?'inativa · ':''}${c.horas} horas · ${plural((c.professor_emails||[]).length,'professor','professores')} · editar</span></summary>${cursoForm(c,false)}</details>
 ${mods.map(m=>{const as=Q().aulas.filter(a=>a.modulo_id===m.id).sort((a,b)=>a.ordem-b.ordem);return `<article class="card pc" data-r><div class="pc-h wr"><h2 class="h4">Módulo ${pad(m.ordem)} · ${esc(m.titulo)}</h2><span class="acts">${btn('Renomear','line',{s:1,icon:false,attr:`data-mod-ren="${esc(m.id)}"`})}${as.length?'':btn('Excluir módulo','line',{s:1,icon:false,attr:`data-mod-del="${esc(m.id)}"`})}</span></div>
  ${as.map(a=>`<details class="eqd"><summary><span><strong>${a.ordem}. ${esc(a.titulo)}</strong></span><span class="sm">${a.duracao_min} min · ${a.video?'com vídeo':'sem vídeo'}${(a.materiais||[]).length?` · ${plural(a.materiais.length,'material','materiais')}`:''}${a.publicada===false?' · oculta':''}</span></summary>${aulaForm(a,m.id)}</details>`).join('')}
  <details class="eqd"><summary><span><strong>${ic('plus',14)} Nova aula neste módulo</strong></span></summary>${aulaForm({ordem:as.length+1},m.id)}</details></article>`}).join('')}
 <article class="card pc dash" data-r><h2 class="h4">Novo módulo</h2><form class="pgf" id="eq-mod" novalidate><label class="fl"><span>Título</span><input class="inp" name="titulo"></label><label class="fl"><span>Ordem</span><input class="inp" name="ordem" type="number" min="0" value="${mods.length+1}"></label><p class="msg full" aria-live="polite"></p><div class="full">${btn('Criar módulo','glass',{type:'submit',icon:false,s:1})}</div></form></article>`
 :'<p class="sm">Nenhuma formação cadastrada. Crie a primeira.</p>'}`};

/* banco da Minerva */
EV.minerva=()=>{const f=S.rf||{esc:'todas',q:''},n=norm(f.q).trim();
 const rs=Q().respostas.filter(r=>(f.esc==='todas'||(f.esc==='site'?!r.curso_id&&!r.portal:f.esc==='portal'?!r.curso_id&&r.portal:r.curso_id===f.esc))&&(!n||norm(r.pergunta+' '+r.resposta+' '+(r.variacoes||[]).join(' ')).includes(n)));
 const form=r=>`<form class="pgf" data-eq-resp="${esc(r.id||'')}" novalidate>
   <label class="fl full"><span>Pergunta principal</span><input class="inp" name="pergunta" value="${esc(r.pergunta||'')}"></label>
   <label class="fl full"><span>Resposta</span><textarea class="inp" name="resposta">${esc(r.resposta||'')}</textarea></label>
   <label class="fl"><span>Outras formas de perguntar (uma por linha)</span><textarea class="inp" name="variacoes">${esc(linhas(r.variacoes))}</textarea></label>
   <label class="fl"><span>Palavras-chave (uma por linha)</span><textarea class="inp" name="palavras">${esc(linhas(r.palavras))}</textarea></label>
   <label class="fl"><span>Vale para</span><select class="inp" name="curso_id"><option value="">Todas (geral)</option>${Q().cursos.map(c=>`<option value="${esc(c.id)}"${c.id===r.curso_id?' selected':''}>${esc(c.titulo)}</option>`).join('')}</select></label>
   <label class="fl"><span>Ordem</span><input class="inp" name="ordem" type="number" value="${esc(r.ordem??0)}"></label>
   <label class="psw"><span>Só no Portal (fora do hotsite)</span><input type="checkbox" name="portal"${r.portal?' checked':''}><i></i></label><label class="psw"><span>Ativa</span><input type="checkbox" name="ativo"${r.ativo!==false?' checked':''}><i></i></label>
   <p class="msg full" aria-live="polite"></p><div class="acts full">${btn(r.id?'Salvar resposta':'Criar resposta','gold',{type:'submit',icon:false,s:1})}${r.id?btn('Excluir','line',{icon:false,s:1,attr:`data-resp-del="${esc(r.id)}"`}):''}</div></form>`;
 return `${fhead(`O que a Minerva ${em('sabe responder.')}`,'A Minerva não usa IA: compara a pergunta com estas linhas e devolve a resposta mais parecida. As mudanças valem em até 1 minuto.')}
 <div class="ptit mid" data-r><label class="psel">${ic('spark',16)}<select data-rf="esc" aria-label="Filtrar">${[['todas','Todas'],['site','Hotsite e Portal (gerais)'],['portal','Só no Portal'],...Q().cursos.map(c=>[c.id,c.titulo])].map(([k,l])=>`<option value="${esc(k)}"${k===f.esc?' selected':''}>${esc(l)}</option>`).join('')}</select>${ic('down',14)}</label><label class="field psearch">${ic('search',16)}<input type="search" data-rf="q" value="${esc(f.q)}" placeholder="Buscar pergunta ou resposta" aria-label="Buscar resposta"></label></div>
 <article class="card pc glow" data-r><details class="eqd"${S.rnovo?' open':''}><summary><span><strong>${ic('plus',14)} Nova resposta</strong></span></summary>${form({ativo:true})}</details></article>
 <article class="card pc" data-r>${rs.map(r=>`<details class="eqd"><summary><span><strong>${esc(r.pergunta)}</strong></span><span class="sm">${r.curso_id?esc((qCurso(r.curso_id)||{}).titulo||r.curso_id):r.portal?'Só no Portal':'Geral'}${r.origem==='professor'?' · ensinada por professor':''}${r.ativo===false?' · desativada':''}</span></summary>${form(r)}</details>`).join('')||'<p class="sm">Nenhuma resposta com este filtro.</p>'}</article>
 <p class="sm">${plural(rs.length,'resposta','respostas')}.</p>`};

const fval=(f,n)=>{const e=f.elements[n];return e?(e.type==='checkbox'?e.checked:e.value.trim()):undefined};
document.addEventListener('submit',async e=>{
 const f=e.target;if(S.area!=='equipe'||!$('#pmain')||!f.closest('#pmain'))return;
 const b=$('button[type="submit"]',f),m=$('.msg',f),done=async(msg)=>{S.eq=await api('equipe');eqRe();toast(msg)};
 try{
  if(f.id==='eq-mf'){const emails=$('#eq-emails').value.trim();if(!emails){say(m,'Digite pelo menos um e-mail.',true);return}busy(b,true,'Liberando…');
   const r=await api('eq-matricula',{body:{email:emails,curso:$('#eq-curso').value,plano:$('#eq-plano').value}});S.ec=$('#eq-curso').value;await done(`Acesso liberado para ${plural(r.matriculas.length,'e-mail','e-mails')}.`);return}
  if(f.matches('[data-eq-curso]')){busy(b,true,'Salvando…');const r=await api('eq-curso',{body:{id:fval(f,'id'),titulo:fval(f,'titulo'),area:fval(f,'area'),horas:+fval(f,'horas')||0,professores:fval(f,'professores'),capa:fval(f,'capa'),professor_emails:fval(f,'professor_emails'),descricao:fval(f,'descricao'),ativo:fval(f,'ativo'),ordem:(qCurso(fval(f,'id'))||{}).ordem??Q().cursos.length+1}});S.ec=r.curso.id;S.cnovo=false;await done('Formação salva.');return}
  if(f.id==='eq-pf'){const em_=$('#eq-pe').value.trim();if(!okMail(em_)){say($('#eq-pm'),'Digite um e-mail válido.',true);return}busy(b,true,'Adicionando…');try{await api('eq-pessoa',{body:{email:em_}});await done(`${em_} agora faz parte da equipe.`)}catch(err){busy(b,false);say($('#eq-pm'),err.message,true)}return}
  if(f.id==='eq-mod'){busy(b,true,'Criando…');await api('eq-modulo',{body:{curso:S.ec,titulo:fval(f,'titulo'),ordem:+fval(f,'ordem')||0}});await done('Módulo criado.');return}
  if(f.matches('[data-eq-aula]')){busy(b,true,'Salvando…');await api('eq-aula',{body:{id:f.dataset.eqAula||undefined,modulo:f.dataset.mod,titulo:fval(f,'titulo'),ordem:+fval(f,'ordem')||0,duracao_min:+fval(f,'duracao_min')||0,video:fval(f,'video'),sobre:fval(f,'sobre'),topicos:fval(f,'topicos'),materiais:parseMat(fval(f,'materiais')),publicada:fval(f,'publicada')}});await done('Aula salva.');return}
  if(f.matches('[data-eq-resp]')){busy(b,true,'Salvando…');await api('eq-resposta',{body:{id:f.dataset.eqResp||undefined,pergunta:fval(f,'pergunta'),resposta:fval(f,'resposta'),variacoes:fval(f,'variacoes'),palavras:fval(f,'palavras'),curso_id:fval(f,'curso_id'),ordem:+fval(f,'ordem')||0,portal:fval(f,'portal'),ativo:fval(f,'ativo')}});S.rnovo=false;await done('Resposta salva. A Minerva passa a usar em até 1 minuto.');return}
 }catch(err){busy(b,false);say(m,err.message,true)}
});
document.addEventListener('click',async e=>{
 const t=e.target;if(S.area!=='equipe'||!t.closest||!t.closest('#pmain'))return;let x;
 const run=async(r,body,msg)=>{try{await api(r,{body});S.eq=await api('equipe');eqRe();toast(msg)}catch(err){toast(err.message)}};
 if(t.closest('[data-curso-novo]')){S.cnovo=!S.cnovo;eqRe();return}
 if((x=t.closest('[data-pessoa-del]'))){if(confirm(`Tirar o acesso de ${x.dataset.pessoaDel} à Área da Equipe?`))run('eq-pessoa',{email:x.dataset.pessoaDel,remover:true},'Acesso de equipe retirado.');return}
 if((x=t.closest('[data-mat-del]'))){if(confirm('Remover esta matrícula? O aluno perde o acesso à formação.'))run('eq-matricula',{id:+x.dataset.matDel,remover:true},'Matrícula removida.');return}
 if((x=t.closest('[data-aula-del]'))){if(confirm('Excluir esta aula? O progresso dos alunos nela também é apagado.'))run('eq-aula',{id:x.dataset.aulaDel,remover:true},'Aula excluída.');return}
 if((x=t.closest('[data-mod-del]'))){if(confirm('Excluir este módulo?'))run('eq-modulo',{id:x.dataset.modDel,remover:true},'Módulo excluído.');return}
 if((x=t.closest('[data-mod-ren]'))){const md=Q().modulos.find(y=>y.id===x.dataset.modRen),n=prompt('Novo título do módulo:',md.titulo);if(n&&n.trim())run('eq-modulo',{id:md.id,curso:md.curso_id,titulo:n.trim(),ordem:md.ordem},'Módulo renomeado.');return}
 if((x=t.closest('[data-resp-del]'))){if(confirm('Excluir esta resposta da Minerva?'))run('eq-resposta',{id:x.dataset.respDel,remover:true},'Resposta excluída.');return}
});
document.addEventListener('change',async e=>{
 const t=e.target,d=t.dataset||{};if(S.area!=='equipe'||!t.closest||!t.closest('#pmain'))return;
 if(d.ec!==undefined){S.ec=t.value;eqRe();return}
 if(d.mf){S.mf={...(S.mf||{curso:'',q:''}),[d.mf]:t.value};eqRe();return}
 if(d.rf){S.rf={...(S.rf||{esc:'todas',q:''}),[d.rf]:t.value};eqRe();return}
 const save=async(body,msg,undo)=>{try{const r=await api('eq-matricula',{body});const i=Q().matriculas.findIndex(m=>m.id===r.matricula.id);Object.assign(Q().matriculas[i],r.matricula);toast(msg)}catch(err){undo();toast(err.message)}};
 if(d.matPlano){const old=Q().matriculas.find(m=>m.id===+d.matPlano).plano;save({id:+d.matPlano,plano:t.value},`Plano alterado para ${PLANS[lvl(t.value)].n}.`,()=>{t.value=old});return}
 if(d.matAtiva){save({id:+d.matAtiva,ativa:t.checked},t.checked?'Acesso reativado.':'Acesso suspenso.',()=>{t.checked=!t.checked});return}
});

/* ----- Área da Equipe › Site: o que aparece nas páginas públicas ----- */
const CATSEL=[['direito','Direito'],['power','Power Skills'],['negocios','Negócios & Inovação']];
const SITE={
 formacao:{n:'Formações',um:'formação',title:x=>x.t,sub:x=>[x.lb,x.preco].filter(Boolean).join(' · '),f:[
  ['id','Endereço (ex.: licenciamento; o mesmo da formação no Portal)','id'],['t','Nome da formação'],['lb','Área (rótulo)'],['cat','Pilar','select',CATSEL],
  ['d','Descrição curta','area'],['f','Etiquetas do cartão (uma por linha: 10 horas, Online…)','lines'],['fd','Etiquetas na página da formação (opcional, uma por linha)','lines'],
  ['img','Capa (nome em img/, /img/arquivo.jpg ou https://)'],['alt','Descrição da capa (acessibilidade)'],
  ['preco','Preço (ex.: R$ 649,90)'],['preco_de','Preço anterior, riscado (opcional)'],['parcelas','Parcelamento (ex.: ou 12x de R$ 65)'],['checkout','Link de pagamento (https://; vazio = WhatsApp)'],
  ['sobre','Sobre o curso (parágrafos separados por uma linha em branco)','area'],['aprender','O que você vai aprender (um por linha)','lines'],
  ['modulos','Módulos (um por linha: Título | descrição opcional)','mods'],['profs','Professores (um por linha: identificador do professor | papel opcional)','profs'],
  ['incl','O que está incluído (opcional, um por linha)','lines'],['incompany','Formação in company (aparece na página In company)','check']]},
 professor:{n:'Professores',um:'professor',title:x=>x.nome,sub:x=>x.cargo,f:[['id','Identificador (ex.: leonardo-pivotto)','id'],['nome','Nome'],['cargo','Cargo (ex.: Advogado e Consultor Ambiental)'],['foto','Retrato (nome em img/, /img/arquivo.jpg ou https://)'],['resumo','Resumo (cartões e páginas das formações)','area'],['bio','Biografia completa (parágrafos separados por linha em branco)','area']]},
 artigo:{n:'Coluna Jurídica',um:'artigo',title:x=>x.t,sub:x=>[x.by,x.date].filter(Boolean).join(' · '),f:[['id','Endereço (ex.: multiportas)','id'],['t','Título'],['st','Título curto (lista da Home, opcional)'],['d','Linha fina','area'],['by','Autor'],['date','Data (ex.: 29 de setembro de 2026)'],['min','Minutos de leitura','num'],['img','Capa (nome em img/, /img/arquivo.jpg ou https://)'],['imgv','Capa vertical (opcional)'],['corpo','Texto (parágrafos separados por linha em branco; “## ” no início vira subtítulo e entra no índice)','area']]},
 episodio:{n:'EJUPcast',um:'episódio',title:x=>x.t,sub:x=>x.m,f:[['id','Identificador (ex.: ep19)','id'],['n','Número do episódio','num'],['t','Título'],['m','Linha de apoio (ex.: Ep. 19 · 58 min)'],['d','Descrição','area'],['cat','Pilar','select',CATSEL],['img','Capa (nome em img/, /img/arquivo.jpg ou https://)'],['yt','Código do vídeo no YouTube (ex.: dQw4w9WgXcQ)']]},
 faq:{n:'Perguntas frequentes',um:'pergunta',title:x=>x.q,sub:()=>'',f:[['id','Identificador','id'],['q','Pergunta'],['a','Resposta','area']]},
 config:{n:'Links',um:'',title:()=>'Links do site',sub:()=>'WhatsApp, Instagram, YouTube, Spotify e mapa',f:[['id','Identificador','id'],['whatsapp','WhatsApp (https://wa.me/55…)'],['instagram','Instagram (https://…)'],['youtube','Canal no YouTube (https://…; vazio esconde os botões)'],['spotify','EJUPcast no Spotify (https://…; vazio esconde os botões)'],['mapa','Mapa do endereço (https://…)']]}
};
const STAB=Object.keys(SITE);
/* textos que já estão no site (código), para importar para o banco */
function padrao(tipo){const D=E.DEF;
 const sl=t=>norm(t).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
 return {formacao:()=>D.F,professor:()=>D.PROF,artigo:()=>D.AR,episodio:()=>D.E.map(e=>({id:'ep'+e.n,...e})),faq:()=>D.FAQ.map(x=>({id:sl(x.q),...x})),config:()=>[{id:'links',...D.LINKS}]}[tipo]().map((x,i)=>({tipo,id:x.id,dados:x,ordem:(i+1)*10,publicado:true,padrao:true}));
}
const siteRows=tipo=>{const r=(Q().site||[]).filter(x=>x.tipo===tipo);return r.length?r:padrao(tipo)};
const fieldVal=(x,[k,,t])=>{const v=x[k];if(t==='lines')return linhas(v);if(t==='mods')return (v||[]).map(m=>[m.t,m.d].filter(Boolean).join(' | ')).join('\n');if(t==='profs')return (v||[]).map(m=>[m.id,m.papel].filter(Boolean).join(' | ')).join('\n');return v??''};
function itemForm(tipo,row,novo){const x={...row.dados,id:row.id};
 return `<form class="pgf" data-eq-item="${tipo}" data-orig="${esc(novo?'':row.id)}" novalidate>${SITE[tipo].f.map(fd=>{const [k,l,t,o]=fd,v=fieldVal(x,fd),full=['area','lines','mods','profs'].includes(t)||k==='id'||k==='t'?' full':'';
  if(t==='check')return `<label class="psw full"><span>${l}</span><input type="checkbox" name="${k}"${v?' checked':''}><i></i></label>`;
  if(t==='select')return `<label class="fl"><span>${l}</span><select class="inp" name="${k}">${o.map(([a,b])=>`<option value="${a}"${a===v?' selected':''}>${b}</option>`).join('')}</select></label>`;
  if(['area','lines','mods','profs'].includes(t))return `<label class="fl full"><span>${l}</span><textarea class="inp${k==='corpo'||k==='sobre'||k==='bio'?' tall':''}" name="${k}">${esc(v)}</textarea></label>`;
  return `<label class="fl${full}"><span>${l}</span><input class="inp" name="${k}" ${t==='num'?'type="number" ':''}value="${esc(v)}"${t==='id'&&!novo?' readonly':''}></label>`}).join('')}
  <label class="fl"><span>Ordem (menor aparece antes)</span><input class="inp" name="__ordem" type="number" value="${esc(row.ordem??0)}"></label>
  <label class="psw"><span>Publicado no site</span><input type="checkbox" name="__pub"${row.publicado!==false?' checked':''}><i></i></label>
  <p class="msg full" aria-live="polite"></p><div class="acts full">${btn(novo?'Criar':'Salvar','gold',{type:'submit',icon:false,s:1})}${!novo&&!row.padrao&&tipo!=='config'?btn('Excluir','line',{icon:false,s:1,attr:`data-item-del="${tipo}|${esc(row.id)}"`}):''}</div></form>`}
function itemDados(f,tipo){const d={};SITE[tipo].f.forEach(([k,,t])=>{if(k==='id')return;const e=f.elements[k];if(!e)return;const v=e.type==='checkbox'?e.checked:e.value.trim();
 if(t==='lines')d[k]=v.split('\n').map(x=>x.trim()).filter(Boolean);
 else if(t==='mods')d[k]=v.split('\n').map(l=>l.split('|').map(x=>x.trim())).filter(p=>p[0]).map(([t2,dd])=>dd?{t:t2,d:dd}:{t:t2});
 else if(t==='profs')d[k]=v.split('\n').map(l=>l.split('|').map(x=>x.trim())).filter(p=>p[0]).map(([id,papel])=>papel?{id,papel}:{id});
 else if(t==='num')d[k]=Number(v)||0;else d[k]=v});return d}
ENAV.push(['site','Site','screen']);ECR.site='Site';
EV.site=()=>{const tipo=SITE[S.st]?S.st:'formacao',sp=SITE[tipo],rows=siteRows(tipo),pad=rows.some(r=>r.padrao),semTabela=Q().site===null;
 return `${fhead(`O que aparece ${em('no site.')}`,'Formações, professores, Coluna Jurídica, EJUPcast, perguntas frequentes e links. As mudanças aparecem no site em até 1 minuto.')}
 ${semTabela?`<article class="card pc dash" data-r><h2 class="h4">Falta criar a tabela do site</h2><p class="sm">Rode de novo o arquivo <strong>dev/supabase_portal.sql</strong> no SQL Editor do Supabase. Ele cria a tabela <strong>site_itens</strong> sem apagar nada.</p></article>`:''}
 <div class="ptit mid" data-r><div class="chips eq-tabs">${STAB.map(k=>`<button type="button" class="chip sug${k===tipo?' on':''}" data-st="${k}">${SITE[k].n}</button>`).join('')}</div>${pad&&!semTabela?btn('Trazer o conteúdo atual para o banco','gold',{s:1,icon:false,attr:'data-site-import'}):''}</div>
 ${pad?`<p class="sm" data-r>Estes são os textos que hoje estão no código do site. Para editar, primeiro traga o conteúdo atual para o banco (um clique, vale para todas as abas). Depois disso, o site passa a mostrar só o que estiver publicado aqui.</p>`:''}
 ${!pad&&tipo!=='config'?`<article class="card pc glow" data-r><details class="eqd"><summary><span><strong>${ic('plus',14)} Novo ${sp.um==='formação'||sp.um==='pergunta'?'item':sp.um}</strong></span></summary>${itemForm(tipo,{dados:{},ordem:(rows.length+1)*10,publicado:true},true)}</details></article>`:''}
 <article class="card pc" data-r>${rows.map(r=>{const x={...r.dados,id:r.id};return `<details class="eqd"><summary><span><strong>${esc(sp.title(x)||r.id)}</strong></span><span class="sm">${esc(sp.sub(x)||'')}${r.publicado===false?' · não publicado':''}</span></summary>${pad?`<fieldset disabled style="border:0;padding:0;margin:0;min-width:0">${itemForm(tipo,r,false)}</fieldset>`:itemForm(tipo,r,false)}</details>`}).join('')||'<p class="sm">Nada cadastrado.</p>'}</article>`};
document.addEventListener('click',async e=>{
 const t=e.target;if(S.area!=='equipe'||!t.closest||!t.closest('#pmain'))return;let x;
 if((x=t.closest('[data-st]'))){S.st=x.dataset.st;eqRe();return}
 if((x=t.closest('[data-site-import]'))){busy(x,true,'Importando…');try{for(const tipo of STAB){if((Q().site||[]).some(r=>r.tipo===tipo))continue;for(const r of padrao(tipo))await api('eq-item',{body:{tipo,id:r.id,dados:r.dados,ordem:r.ordem,publicado:true}})}S.eq=await api('equipe');eqRe();toast('Conteúdo atual trazido para o banco. Agora é só editar.')}catch(err){busy(x,false);toast(err.message)}return}
 if((x=t.closest('[data-item-del]'))){const [tipo,id]=x.dataset.itemDel.split('|');if(!confirm('Excluir este item do site?'))return;try{await api('eq-item',{body:{tipo,id,remover:true}});S.eq=await api('equipe');eqRe();toast('Item excluído do site.')}catch(err){toast(err.message)}return}
});
document.addEventListener('submit',async e=>{
 const f=e.target;if(S.area!=='equipe'||!f.matches||!f.matches('[data-eq-item]'))return;
 const tipo=f.dataset.eqItem,b=$('button[type="submit"]',f),m=$('.msg',f),id=f.elements.id.value.trim();
 if(!id){say(m,'Preencha o identificador.',true);f.elements.id.focus();return}
 busy(b,true,'Salvando…');
 try{await api('eq-item',{body:{tipo,id,dados:itemDados(f,tipo),ordem:Number(f.elements.__ordem.value)||0,publicado:f.elements.__pub.checked}});S.eq=await api('equipe');eqRe();toast('Salvo. O site mostra a mudança em até 1 minuto.')}
 catch(err){busy(b,false);say(m,err.message,true)}
});

/* ----- Área da Equipe › Newsletter: inscritos, exportação e envio das edições ----- */
ENAV.splice(3,0,['newsletter','Newsletter','mail']);ECR.newsletter='Newsletter';
EV.newsletter=()=>{
 if(!S.news){api('eq-newsletter').then(d=>{S.news=d;eqRe()},e=>{S.news={erro:e.message};eqRe()});return `<div class="okbox"><p class="sm">Carregando a newsletter…</p></div>`}
 if(S.news.erro)return errBox(S.news.erro,true);
 const N=S.news,ativos=N.inscritos.filter(i=>!i.descadastrado_em),sairam=N.inscritos.length-ativos.length,novos=ativos.filter(i=>Date.now()-new Date(i.created_at)<30*86400000).length;
 return `${fhead(`Newsletter ${em('da Coluna.')}`,'Quem se inscreveu no site e no Portal, a exportação da lista e o envio das edições. Cada e-mail sai com o link de descadastro de quem recebe.')}
 <div class="fstats t3">${fstat('Inscritos',ativos.length,'recebem as próximas edições')}${fstat('Novos em 30 dias',novos,'inscrições recentes')}${fstat('Saíram da lista',sairam,'pelo link do e-mail ou pelo perfil')}</div>
 ${N.email?`<article class="card pc glow" data-r><h2 class="h4">Nova edição</h2>
  <form id="nw-f" class="pgf" novalidate>
   <label class="fl full"><span>Assunto do e-mail</span><input class="inp" name="assunto" value="${esc((S.nwDraft||{}).assunto||'')}" placeholder="Ex.: Coluna Jurídica · outubro"></label>
   <label class="fl full"><span>Título dentro do e-mail (opcional)</span><input class="inp" name="titulo" value="${esc((S.nwDraft||{}).titulo||'')}"></label>
   <label class="fl full"><span>Texto (parágrafos separados por uma linha em branco)</span><textarea class="inp tall" name="corpo">${esc((S.nwDraft||{}).corpo||'')}</textarea></label>
   <label class="fl"><span>Link do botão (opcional, https://)</span><input class="inp" name="link" value="${esc((S.nwDraft||{}).link||'')}" placeholder="https://ejup.com.br/artigo/…"></label>
   <label class="fl"><span>Texto do botão</span><input class="inp" name="link_texto" value="${esc((S.nwDraft||{}).link_texto||'Ler na Coluna Jurídica')}"></label>
   <p class="msg full" aria-live="polite"></p>
   <div class="acts full">${btn('Enviar teste para mim','glass',{icon:false,attr:'data-nw="teste"'})}${btn(`Enviar para ${plural(ativos.length,'inscrito','inscritos')}`,'gold',{icon:false,attr:'data-nw="todos"'})}</div></form>
  <p class="sm">O teste chega só no seu e-mail. O envio para a lista não pode ser desfeito. Até ${N.limite} inscritos por envio; o plano gratuito do Resend envia 100 e-mails por dia.</p></article>`
 :`<article class="card pc dash" data-r><h2 class="h4">Envio de edições ainda desligado</h2><p class="sm">Para enviar pela Área da Equipe, ligue os e-mails do site (RESEND_API_KEY e EMAIL_FROM na Vercel). Enquanto isso, exporte a lista e envie pela ferramenta que preferir, sempre com um link para sair da lista.</p></article>`}
 <div class="prow c2">
  <article class="card pc" style="gap:0" data-r><div class="pc-h wr" style="padding-bottom:12px"><h2 class="h4">Inscritos</h2>${btn('Exportar lista (CSV)','glass',{s:1,icon:false,attr:'data-nw-exp'})}</div>
   ${N.inscritos.slice(0,150).map(i=>`<div class="fq"><span class="tx"><strong>${esc(i.email)}</strong><span class="sm">${dia(i.created_at)}${i.origem?' · '+esc(i.origem):''}</span></span>${i.descadastrado_em?tag('Saiu'):''}</div>`).join('')||'<p class="sm">Ninguém inscrito ainda.</p>'}
   ${N.inscritos.length>150?`<p class="sm" style="padding-top:12px">Mostrando 150 de ${N.inscritos.length}. A lista completa vai na exportação.</p>`:''}</article>
  <article class="card pc" style="gap:0" data-r><h2 class="h4" style="padding-bottom:12px">Edições enviadas</h2>
   ${N.edicoes.map(e=>`<div class="fq"><span class="tx"><strong>${esc(e.assunto)}</strong><span class="sm">${dia(e.enviada_em)} · ${plural(e.enviados,'e-mail','e-mails')}${e.autor?' · '+esc(e.autor):''}</span></span></div>`).join('')||'<p class="sm">Nenhuma edição enviada pelo site ainda.</p>'}</article>
 </div>`};
document.addEventListener('click',async e=>{
 const t=e.target;if(S.area!=='equipe'||!t.closest||!t.closest('#pmain'))return;let x;
 if(t.closest('[data-nw-exp]')){const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;const at=S.news.inscritos.filter(i=>!i.descadastrado_em);
  download(`newsletter-ejup-${new Date().toISOString().slice(0,10)}.csv`,'﻿'+[['E-mail','Inscrito em','Origem'].map(q).join(';'),...at.map(i=>[i.email,dia(i.created_at),i.origem].map(q).join(';'))].join('\n'),'text/csv;charset=utf-8');return}
 if((x=t.closest('[data-nw]'))){const f=$('#nw-f'),m=$('.msg',f),teste=x.dataset.nw==='teste';
  const body={assunto:f.elements.assunto.value.trim(),titulo:f.elements.titulo.value.trim(),corpo:f.elements.corpo.value.trim(),link:f.elements.link.value.trim(),link_texto:f.elements.link_texto.value.trim(),teste};
  S.nwDraft=body;
  if(body.assunto.length<3||body.corpo.length<10){say(m,'Preencha o assunto e o texto da edição.',true);return}
  if(body.link&&!/^https:\/\//.test(body.link)){say(m,'O link precisa começar com https://',true);return}
  const n=S.news.inscritos.filter(i=>!i.descadastrado_em).length;
  if(!teste&&!confirm(`Enviar “${body.assunto}” para ${plural(n,'inscrito','inscritos')}? Não dá para desfazer.`))return;
  busy(x,true,teste?'Enviando teste…':'Enviando…');
  try{const r=await api('eq-news-enviar',{body});busy(x,false);
   if(teste){say(m,`Teste enviado para ${r.para}. Confira a caixa de entrada.`);return}
   S.nwDraft=null;S.news=null;eqRe();toast(`Edição enviada para ${plural(r.enviados,'inscrito','inscritos')}.`)}
  catch(err){busy(x,false);say(m,err.message,true)}return}
});
})();
