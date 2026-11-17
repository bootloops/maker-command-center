from pathlib import Path
import shutil,re
root=Path(__file__).resolve().parent;p=root/'js/music/studio.js'
if not p.exists():raise SystemExit('Run from your existing repository root after patches 008–013.')
s=p.read_text(encoding='utf-8')
if '// MCC creative direction 014' not in s:
 pattern=r"\{role:'system',content:'You are a collaborative original songwriter\.(?:\\.|[^'\\])*'\}"
 matches=list(re.finditer(pattern,s))
 required=["const setup=details('Model & creative preferences',[",'creativeProfile:profile,',"box.classList.add('flow-result');"]
 if len(matches)!=1 or any(x not in s for x in required):raise SystemExit('Studio source differs from expected source. No studio.js changes made; share your current file for an exact patch.')
 s=re.sub(pattern,"{role:'system',content:buildCreativeSystem(song.creativeControls)}",s,count=1)
 s="import {buildCreativeSystem, creativeDesign, creativeControlsUI, appendQualityNotes} from './creative-direction.js';\n// MCC creative direction 014\n"+s
 s=s.replace("const setup=details('Model & creative preferences',[","const setup=details('Model & creative preferences',[...creativeControlsUI({song,save}),",1)
 s=s.replace('creativeProfile:profile,','creativeProfile:profile,creativeDesign:creativeDesign(song),',1)
 s=s.replace("box.classList.add('flow-result');","box.classList.add('flow-result');appendQualityNotes(box,result.recommended);",1)
 backup=p.with_suffix('.js.patch014-backup')
 if not backup.exists():shutil.copy2(p,backup)
 p.write_text(s,encoding='utf-8')
 print('Creative-direction prompt, per-song controls and local craft checks installed.')
else:print('Creative direction already installed.')
sw=root/'service-worker.js'
if sw.exists():
 old=sw.read_text(encoding='utf-8');new=old.replace('maker-command-center-v013','maker-command-center-v014')
 if './js/music/creative-direction.js' not in new:new=re.sub(r'(const ASSETS\s*=\s*\[)',lambda m:m.group(1)+"'./js/music/creative-direction.js',",new,count=1)
 if new!=old:
  backup=sw.with_suffix('.js.patch014-backup')
  if not backup.exists():shutil.copy2(sw,backup)
  sw.write_text(new,encoding='utf-8')
print('Commit js/music/studio.js js/music/creative-direction.js service-worker.js. Keep backup files local.')
