#!/bin/bash
# usage: fonts.sh <outdir> <css2 family query>
set -e
out=$1; q=$2; mkdir -p $out/fonts
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
curl -sS -A "$UA" "https://fonts.googleapis.com/css2?$q&display=swap" > $out/fonts/raw.css
python3 - "$out" <<'PY'
import re,sys,subprocess,os
out=sys.argv[1]; css=open(f"{out}/fonts/raw.css").read()
blocks=re.findall(r"/\* ([\w-]+) \*/\s*(@font-face \{.*?\})",css,re.S)
res=[]
for sub,b in blocks:
    if sub not in("latin","latin-ext"):continue
    fam=re.search(r"font-family: '([^']+)'",b).group(1);st=re.search(r"font-style: (\w+)",b).group(1);wt=re.search(r"font-weight: ([\d ]+)",b).group(1)
    url=re.search(r"url\((.*?)\)",b).group(1)
    fn=f"{fam.replace(' ','')}-{st}-{wt.replace(' ','_')}-{sub}.woff2"
    subprocess.run(["curl","-sS","-o",f"{out}/fonts/{fn}",url],check=True)
    res.append(b.replace(url,f"fonts/{fn}"))
open(f"{out}/fonts.css","w").write("\n".join(res)+"\n");os.remove(f"{out}/fonts/raw.css")
print(out,len(res))
PY
