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
 return f(u,o)}})();
</script>"""
BADGE = '<div style="position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);z-index:90;padding:6px 12px;border-radius:999px;background:rgba(8,12,17,.82);border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.82);font:500 11px/1.4 Gotham,Montserrat,system-ui,sans-serif;letter-spacing:.06em;pointer-events:none">Prévia · formulários em demonstração</div>'

# ---------- site ----------
js = R('assets/app.js')
js = must(js, "const withImg=h=>h.replace(/\"img\\/(\\w+)\\.jpg/g,'\"/img/$1.jpg');", "const withImg=h=>h;")
js = must(js, "const IMG=new Proxy({},{get:(o,n)=>`/img/${String(n)}.jpg`});", "const IMG=new Proxy({},{get:(o,n)=>`img/${String(n)}.jpg`});")
js = must(js, "const VID={logo:'/vid/cast-logo.mp4',sub:'/vid/cast-subscribe.mp4',est:'/vid/estatuas.mp4'};", "const VID={logo:'vid/cast-logo.mp4',sub:'vid/cast-subscribe.mp4',est:'vid/estatuas.mp4'};")
js = must(js, "const toPath=tok=>{const [p,a]=parse(tok);return p==='home'?'/':'/'+p+(a?'/'+a:'')};", "const toPath=tok=>{const [p,a]=parse(tok);return '#'+p+(a?'.'+a:'')};")
js = must(js, "if(k==='privacidade'){toLink(el,'/privacidade',true);return}", "if(k==='privacidade'){toLink(el,'#privacidade',true);return}")
js = must(js, " $$('a[href^=\"#\"]',root).forEach(a=>a.setAttribute('href',toPath(a.getAttribute('href'))));\n", "")
js = must(js, "if(a&&!a.target&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&a.origin===location.origin&&PAGES[parse(a.pathname)[0]]){e.preventDefault();go(a.pathname);return}",
          "if(a&&a.getAttribute('href').startsWith('#')){e.preventDefault();go(a.getAttribute('href'));return}")
js = must(js, "addEventListener('popstate',()=>go(location.pathname,{push:false}));", "addEventListener('popstate',()=>go(location.hash,{push:false}));addEventListener('hashchange',()=>{if(toPath(cur)!==location.hash)go(location.hash,{push:false})});")
js = must(js, "go(location.pathname==='/'&&location.hash.length>1?location.hash:location.pathname,{push:false,instant:true});", "go(location.hash,{push:false,instant:true});")
js = js.replace("href=\"/minerva\"", "href=\"minerva.html\"").replace("k==='minerva'?'/minerva'", "k==='minerva'?'minerva.html'")
js = js.replace('src="img/', 'src="img/')  # templates já usam caminho relativo
css = inline_fonts(R('assets/style.css'))
shell = R('index.html')
body = shell[shell.index('<body>') + 6:shell.index('</body>')]
title = re.search(r'<title>.*?</title>', shell).group(0)
gfonts = '\n'.join(re.findall(r'<link rel="(?:preconnect|stylesheet)" href="https://fonts[^>]+>', shell))
page = f'{title}\n{gfonts}\n<style>\n{css}\n</style>\n{SHIM}\n{body}\n{BADGE}\n<script>\n{js}\n</script>\n'
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
