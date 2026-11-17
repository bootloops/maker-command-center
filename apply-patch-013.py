from pathlib import Path
import re,shutil
root=Path(__file__).resolve().parent
paths={n:root/n for n in ['js/main.js','js/music/studio.js','js/music/transport.js']}
if not all(p.exists() for p in paths.values()):raise SystemExit('Missing prerequisites. Run from repo root after patches 007–012.')
texts={n:p.read_text(encoding='utf-8') for n,p in paths.items()}
s=texts['js/music/studio.js'];t=texts['js/music/transport.js']
if '// MCC integration 013' not in s:
 required=["await save();renderDocument();tell('Revision ready — your song is unchanged');",'}catch(e){fail(e);}finally{busy=false;renderDocument();renderPartner();}']
 if any(x not in s for x in required):raise SystemExit('Studio source differs from patch 010–012. No files changed; share studio.js for a matching patch.')
if '// MCC progress 013' not in t and 'document.body.append(panel);' not in t:raise SystemExit('Transport differs from patch 007. No files changed; share transport.js.')
main=texts['js/main.js']
if "import './music/integration.js';" not in main:main="import './music/integration.js';\n"+main
if '// MCC integration 013' not in s:
 s="import {finishMusicJob} from './integration.js';\n// MCC integration 013\n"+s
 s=s.replace("await save();renderDocument();tell('Revision ready — your song is unchanged');","await save();renderDocument();tell('Revision ready — your song is unchanged');finishMusicJob('complete','Music revision ready for review — your song is unchanged.');",1)
 s=s.replace('}catch(e){fail(e);}finally{busy=false;renderDocument();renderPartner();}',"}catch(e){fail(e);finishMusicJob('error',e.message||'Music generation needs attention');}finally{busy=false;renderDocument();renderPartner();}",1)
 # Dashboard song links select by stable ID rather than display-title matching.
 s+="\nwindow.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.source!=='mcc-host-013'||event.data.type!=='select-song')return;safe(()=>choose(event.data.id))();});\n"
if '// MCC progress 013' not in t:
 t="import {attachMusicProgress} from './integration.js';\n// MCC progress 013\n"+t
 t=t.replace('document.body.append(panel);','attachMusicProgress(panel);',1)
for n,text in [('js/main.js',main),('js/music/studio.js',s),('js/music/transport.js',t)]:
 p=paths[n]
 if text!=texts[n]:
  backup=p.with_suffix('.js.patch013-backup')
  if not backup.exists():shutil.copy2(p,backup)
  p.write_text(text,encoding='utf-8')
sw=root/'service-worker.js'
if sw.exists():
 old=sw.read_text(encoding='utf-8');new=old.replace('maker-command-center-v012','maker-command-center-v013')
 if './js/music/integration.js' not in new:new=re.sub(r'(const ASSETS\s*=\s*\[)',lambda m:m.group(1)+"'./js/music/integration.js',",new,count=1)
 if new!=old:
  b=sw.with_suffix('.js.patch013-backup')
  if not b.exists():shutil.copy2(sw,b)
  sw.write_text(new,encoding='utf-8')
print('Patch 013 applied. Commit main.js, studio.js, transport.js, integration.js and service-worker.js. Keep rollback backups local.')
