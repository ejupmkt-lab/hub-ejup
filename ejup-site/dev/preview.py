"""Gera uma prévia estática do site (sem servidor) em uma pasta de saída.
Uso: python3 dev/preview.py <pasta-de-saida>
- rotas viram #escola, #formacao.licenciamento (a prévia não tem reescrita de URL)
- fontes embutidas; Minerva e formulários respondem em modo demonstração"""
import base64, os, re, shutil, sys
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
R = lambda p: open(os.path.join(here, p), encoding='utf-8').read()

def must(s, a, b):
    assert a in s, a[:80]
    return s.replace(a, b)

fonts = {n: 'data:font/woff2;base64,' + base64.b64encode(open(os.path.join(here, 'fonts', f'gotham-{n}.woff2'), 'rb').read()).decode()
         for n in ['light', 'book', 'medium', 'black']}
def inline_fonts(css):
    return re.sub(r'url\(/fonts/gotham-(\w+)\.woff2\)', lambda m: f'url({fonts[m.group(1)]})', css)

# a prévia não tem servidor: a busca da Minerva roda no navegador, com o mesmo código e as mesmas respostas
busca_js = R('api/_lib/busca.js').replace('export function', 'function').replace('export const', 'const')
resp_js = R('api/_lib/respostas.js').replace('export default', 'const RESPOSTAS =')
sem = re.search(r"SEM_RESPOSTA =\s*'([^']+)'", R('api/minerva.js')).group(1)
SHIM = """<script>
(()=>{""" + busca_js + resp_js + """
const SEM = '""" + sem + """';
const f=window.fetch.bind(window);window.fetch=(u,o)=>{const p=String(u);
 const ok=b=>Promise.resolve(new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json'}}));
 if(p.endsWith('/api/minerva')){const b=JSON.parse((o&&o.body)||'{}');const m=(b.messages||[]).filter(x=>x.role==='user').pop();
  const r=buscar(String(b.pergunta||(m&&m.content)||''),RESPOSTAS);return ok(r.item?{reply:r.item.resposta,id:r.item.id}:{reply:SEM,sugestoes:r.sugestoes})}
 if(p.endsWith('/api/lead'))return ok({ok:true});
 if(p.includes('/api/portal')&&window.__portalApi)return window.__portalApi(p,o);
 return f(u,o)}})();
</script>"""
# ---------- Portal: a API de verdade roda no navegador, com o Supabase em memória e dados de exemplo ----------
def module(path):
    code = R(path); names = []
    def imp(m):
        what, src = m.group(1).strip(), m.group(2)
        if src == 'node:crypto': return f'const {what} = __crypto;'
        if what.startswith('{'): return f'const {what} = __M;'
        return f'const {what} = __M.__default_{os.path.basename(src).split(".")[0]};'
    code = re.sub(r"^import (.+?) from '([^']+)';$", imp, code, flags=re.M)
    def exp(m):
        names.append(m.group(2)); return m.group(1)
    code = re.sub(r'^export ((?:async )?(?:function|const|class) (\w+))', exp, code, flags=re.M)
    tail = ''
    if 'export default' in code:
        code = code.replace('export default', 'const __default =', 1)
        tail = f'__M.__default_{os.path.basename(path).split(".")[0]} = __default;'
    return '(()=>{\n' + code + f'\nObject.assign(__M,{{{",".join(names)}}});{tail}\n}})();\n'
MODS = ['api/_lib/ratelimit.js', 'api/_lib/busca.js', 'api/_lib/respostas.js', 'api/_lib/supabase.js', 'api/_lib/video.js',
        'api/_lib/sb.js', 'api/_lib/email.js', 'api/_lib/portal.js', 'dev/fake-supabase.mjs']
PORTAL_SHIM = '''<script>
(()=>{const __M={};
const __crypto={randomBytes:n=>crypto.getRandomValues(new Uint8Array(n)),randomUUID:()=>crypto.randomUUID(),
 createHash:()=>{let s='';const h={update:x=>{s+=x;return h},digest:()=>{let a=2166136261,b=5381;for(const c of s){a=Math.imul(a^c.charCodeAt(0),16777619)>>>0;b=(Math.imul(b,33)+c.charCodeAt(0))>>>0}return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0')}};return h}};
''' + ''.join(module(p) for p in MODS).replace("'/img/", "'img/") + '''
const fake=__M.createFakeSupabase({url:'https://previa.supabase.co'});__M.seed(fake);
const handler=__M.createPortalHandler({fetchImpl:fake.fetchImpl,env:{SUPABASE_URL:fake.url,SUPABASE_SERVICE_ROLE_KEY:'previa'}});
const jar={};window.__sess=false;
window.__portalApi=async(u,o)=>{const url=new URL(u,location.href);
 const req={method:(o&&o.method)||'GET',url:url.pathname+url.search,headers:{host:location.host,'x-forwarded-proto':'https',cookie:Object.entries(jar).map(([k,v])=>k+'='+encodeURIComponent(v)).join('; ')},body:o&&o.body?JSON.parse(o.body):undefined};
 const res={statusCode:200,h:{},setHeader(k,v){this.h[k.toLowerCase()]=v},status(c){this.statusCode=c;return this},json(p){this.payload=p;return this}};
 await handler(req,res);
 (res.h['set-cookie']||[]).forEach(c=>{const [kv,...at]=c.split('; ');const i=kv.indexOf('='),k=kv.slice(0,i),v=decodeURIComponent(kv.slice(i+1));at.includes('Max-Age=0')?delete jar[k]:jar[k]=v});
 window.__sess=!!jar.ejup_rt;
 return new Response(JSON.stringify(res.payload),{status:res.statusCode,headers:{'Content-Type':'application/json'}})};
})();
</script>'''
BADGE = '<div style="position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);z-index:90;padding:6px 12px;border-radius:999px;background:rgba(8,12,17,.82);border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.82);font:500 11px/1.4 Gotham,Montserrat,system-ui,sans-serif;letter-spacing:.06em;pointer-events:none">Prévia · Portal com dados de exemplo: aluno@ejup.com.br / senha-aluno-1 · professor@ejup.com.br / senha-prof-1 · equipe@ejup.com.br / senha-equipe-1</div>'

# ---------- site ----------
js = R('assets/app.js')
# o conteúdo padrão vem de um módulo; na prévia ele entra embutido no próprio script
padrao = re.sub(r'^//.*\n', '', R('assets/padrao.js'), flags=re.M).replace('export default', 'const PADRAO =', 1)
js = must(js, "import PADRAO from '/assets/padrao.js';", padrao)
js = must(js, "const withImg=h=>h.replace(/\"img\\/(\\w+)\\.jpg/g,'\"/img/$1.jpg');", "const withImg=h=>h;")
js = must(js, "const IMG=new Proxy({},{get:(o,n)=>`/img/${String(n)}.jpg`});", "const IMG=new Proxy({},{get:(o,n)=>`img/${String(n)}.jpg`});")
js = must(js, "const VID={logo:'/vid/cast-logo.mp4',sub:'/vid/cast-subscribe.mp4',est:'/vid/estatuas.mp4'};", "const VID={logo:'vid/cast-logo.mp4',sub:'vid/cast-subscribe.mp4',est:'vid/estatuas.mp4'};")
js = must(js, "const toPath=tok=>{const [p,a]=parse(tok);return p==='home'?'/':'/'+p+(a?'/'+a:'')};", "const toPath=tok=>{const [p,a]=parse(tok);return '#'+p+(a?'.'+a:'')};")
js = must(js, "if(k==='privacidade'){toLink(el,'/privacidade',true);return}", "if(k==='privacidade'){toLink(el,'#privacidade',true);return}")
js = must(js, " $$('a[href^=\"#\"]',root).forEach(a=>a.setAttribute('href',toPath(a.getAttribute('href'))));\n", "")
js = must(js, "if(a&&!a.target&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&a.origin===location.origin&&(PAGES[parse(a.pathname)[0]]||PORTAL.includes(parse(a.pathname)[0]))){e.preventDefault();go(a.pathname);return}",
          "if(a&&a.getAttribute('href').startsWith('#')){e.preventDefault();go(a.getAttribute('href'));return}")
js = must(js, "addEventListener('popstate',()=>go(location.pathname,{push:false}));", "addEventListener('popstate',()=>go(location.hash,{push:false}));addEventListener('hashchange',()=>{if(toPath(cur)!==location.hash)go(location.hash,{push:false})});")
js = must(js, "go(location.pathname==='/'&&location.hash.length>1?location.hash:location.pathname,{push:false,instant:true});", "go(location.hash,{push:false,instant:true});")
js = must(js, "let portalJs=null;\nconst loadPortal=()=>portalJs||(portalJs=new Promise((ok,no)=>{const s=document.createElement('script');s.src='/assets/portal.js?v=1';s.onload=ok;s.onerror=()=>{portalJs=null;no()};document.head.appendChild(s)}));",
          "const loadPortal=()=>window.__portal||(window.__portal=new Promise(ok=>{window.__portalOk=ok}));")
js = must(js, "const on=/(?:^|; )ejup_on=1/.test(document.cookie);", "const on=!!window.__sess;")
js = must(js, "a.setAttribute('href',on?'/portal':'/entrar')", "a.setAttribute('href',on?'#portal':'#entrar')")
pj = R('assets/portal.js')
pj = pj.replace('href="/', 'href="#').replace("href=\"/", "href=\"#").replace("'/img/", "'img/").replace("'/minerva/", "'minerva/").replace('"/minerva/', '"minerva/')
pj = pj.replace(",'/portal',{", ",'#portal',{").replace(",'/',{", ",'#home',{").replace(",'/formacoes',{", ",'#formacoes',{")
pj = pj.replace("`/certificado/${m.certificado}?pdf=1`", "`#certificado/${m.certificado}`").replace("`${location.origin}/certificado/${m.certificado}`", "`${location.href.split('#')[0]}#certificado/${m.certificado}`")
pj = must(pj, "history.replaceState(null,'','/entrar')", "history.replaceState(null,'','#entrar')")
pj = must(pj, "sessionStorage.setItem(VOLTA,location.pathname)", "sessionStorage.setItem(VOLTA,location.hash)")
pj = must(pj, "go(v&&/^\\/(portal|prof|equipe)/.test(v)?v:def)", "go(v&&/^[#/](portal|prof|equipe)/.test(v)?v:def)")
pj = must(pj, "history.replaceState(null,'',m==='criar'?'/criar':pf?'/entrar/professor':'/entrar')", "history.replaceState(null,'',m==='criar'?'#criar':pf?'#entrar.professor':'#entrar')")
pj = must(pj, "try{history.replaceState(null,'',location.pathname)}catch(e){}", "")
pj = pj.replace("abtn('Ir para o portal','gold','/portal'", "abtn('Ir para o portal','gold','#portal'").replace("abtn('Ir para o Portal do Aluno','gold','/portal'", "abtn('Ir para o Portal do Aluno','gold','#portal'")
pj = pj.rstrip()
assert pj.endswith('})();')
pj = pj[:-5] + 'window.__portalOk&&window.__portalOk();window.__portal=Promise.resolve();\n})();\n'
js = js.replace("href=\"/minerva\"", "href=\"minerva.html\"").replace("k==='minerva'?'/minerva'", "k==='minerva'?'minerva.html'")
js = js.replace('src="img/', 'src="img/')  # templates já usam caminho relativo
css = inline_fonts(R('assets/style.css'))
shell = R('app.html')
body = shell[shell.index('<body>') + 6:shell.index('</body>')]
title = re.search(r'<title>.*?</title>', shell).group(0)
gfonts = '\n'.join(re.findall(r'<link rel="(?:preconnect|stylesheet)" href="https://fonts[^>]+>', shell))
page = f'{title}\n{gfonts}\n<style>\n{css}\n</style>\n{PORTAL_SHIM}\n{SHIM}\n{body}\n{BADGE}\n<script>\n{js}\n</script>\n<script>\n{pj}\n</script>\n'
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(page)

# ---------- Minerva ----------
m = R('minerva/index.html')
m = inline_fonts(m)
m = re.sub(r'<link rel="preload" href="/fonts/[^>]+>\n', '', m)
m = must(m, '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n', '')
m = m.replace('"/minerva/', '"minerva/').replace("'/minerva/", "'minerva/")
m = must(m, '<a class="logo" href="/"', '<a class="logo" href="index.html"')
m = must(m, '<a class="mail" href="/">', '<a class="mail" href="index.html">')
m = must(m, '<script>document.documentElement.classList.add(\'js\')</script>', SHIM + '\n' + BADGE + "\n<script>document.documentElement.classList.add('js')</script>")
open(os.path.join(out, 'minerva.html'), 'w', encoding='utf-8').write(m)

for d in ['img', 'vid']:
    shutil.copytree(os.path.join(here, d), os.path.join(out, d), dirs_exist_ok=True)
os.makedirs(os.path.join(out, 'minerva'), exist_ok=True)
for f in ['abertura.webp', 'fechamento.webp', 'repouso.jpg', 'aberta.jpg']:
    shutil.copy(os.path.join(here, 'minerva', f), os.path.join(out, 'minerva', f))
print('prévia em', out)
