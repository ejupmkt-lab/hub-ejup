import sys,time,urllib.request,pathlib
UA={"User-Agent":"EJUP-Minerva/1.0 (contato@ejup.com.br)"}
DEST=pathlib.Path(__file__).resolve().parent.parent/"fotos"
DEST.mkdir(exist_ok=True)
def baixa(nome,url):
    alvo=DEST/f"{nome}.jpg"
    if alvo.exists(): print(f"ja existe {nome}"); return
    d=10
    for _ in range(6):
        try:
            b=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=120).read()
            alvo.write_bytes(b); print(f"{nome}: {len(b)/1024:.0f} KB"); return
        except Exception as e:
            print(f"  ({e}) espera {d}s",flush=True); time.sleep(d); d=min(int(d*1.8),120)
    print(f"FALHOU {nome}")
for i in range(1,len(sys.argv),2): baixa(sys.argv[i],sys.argv[i+1]); time.sleep(6)
