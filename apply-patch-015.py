from pathlib import Path
import re,shutil
root=Path(__file__).resolve().parent
paths={n:root/n for n in ['js/music/studio.js','js/music/integration.js']}
if not all(p.exists() for p in paths.values()):raise SystemExit('Requires patches 011–014. Run from the repository root.')
s=paths['js/music/studio.js'].read_text(encoding='utf-8');integration=paths['js/music/integration.js'].read_text(encoding='utf-8')
if '// MCC top-left progress 015' not in integration:
 start=integration.find('export function attachMusicProgress(panel){');end=integration.find('function injectStyles(){',start)
 if start<0 or end<0 or 'if(frame)frame.hidden=!music;' not in integration:raise SystemExit('Integration source differs from patch 013. No existing files modified; share integration.js.')
 replacement="""export function attachMusicProgress(panel){
 mountProgressPanel(panel);
 const update=()=>{if(Date.now()-lastSent<700)return;lastSent=Date.now();send('job',{state:'running',message:panel.querySelector('div')?.textContent||'Music generation running',at:Date.now()});};
 send('job',{state:'running',message:'Music generation started',at:Date.now()});
 const observer=new MutationObserver(update);observer.observe(panel,{childList:true,subtree:true,characterData:true});
 const removal=new MutationObserver(()=>{if(!panel.isConnected){observer.disconnect();removal.disconnect();send('job',{state:'processing',message:'Checking and saving the music response…',at:Date.now()});}});removal.observe(document.body,{childList:true,subtree:true});
}
"""
 integration=integration[:start]+replacement+integration[end:]
 integration="import {mountProgressPanel} from './progress-panel.js';\n// MCC top-left progress 015\n"+integration
 integration=integration.replace('if(frame)frame.hidden=!music;',"if(frame){frame.hidden=!music;if(music&&ready)frame.contentWindow.postMessage({source:'mcc-host-013',type:'studio-visible'},origin);}",1)
if "import './dock-recovery.js';" not in s:s="import './dock-recovery.js';\n"+s
for n,content in [('js/music/studio.js',s),('js/music/integration.js',integration)]:
 p=paths[n];old=p.read_text(encoding='utf-8')
 if old!=content:
  backup=p.with_suffix('.js.patch015-backup')
  if not backup.exists():shutil.copy2(p,backup)
  p.write_text(content,encoding='utf-8')
sw=root/'service-worker.js'
if sw.exists():
 old=sw.read_text(encoding='utf-8');new=old.replace('maker-command-center-v014','maker-command-center-v015')
 for asset in ['./js/music/progress-panel.js','./js/music/dock-recovery.js']:
  if asset not in new:new=re.sub(r'(const ASSETS\s*=\s*\[)',lambda m:m.group(1)+repr(asset)+',',new,count=1)
 if new!=old:
  backup=sw.with_suffix('.js.patch015-backup')
  if not backup.exists():shutil.copy2(sw,backup)
  sw.write_text(new,encoding='utf-8')
print('Patch 015 installed. Commit studio.js integration.js progress-panel.js dock-recovery.js and service-worker.js. Keep rollback files local.')
