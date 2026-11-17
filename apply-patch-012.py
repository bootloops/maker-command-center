from pathlib import Path
import re,shutil
root=Path(__file__).resolve().parent;p=root/'js/music/studio.js'
if not p.exists():raise SystemExit('Run from the repository root after patch 011.')
s=p.read_text(encoding='utf-8')
if '// MCC inline sections 012' not in s:
 central="c.append(renderSectionManager({song,save,refresh:()=>{renderDocument();renderPartner();},onRemoved:id=>locked.delete(id)}));"
 marker="f.dataset.musicSectionId=section.id;f.querySelector('textarea').classList.add('flow-lyrics');c.append(f);"
 if central not in s or marker not in s:raise SystemExit('Studio source differs from patch 011. No studio.js changes made. Share the current file for a matching patch.')
 s="import {decorateSection, sectionInsertButton} from './sections-inline.js';\n// MCC inline sections 012\n"+s
 s=s.replace(central,"c.append(sectionInsertButton({song,save,refresh:()=>{renderDocument();renderPartner();}}));",1)
 s=s.replace(marker,"f.dataset.musicSectionId=section.id;f.querySelector('textarea').classList.add('flow-lyrics');decorateSection({container:f,section,song,save,refresh:()=>{renderDocument();renderPartner();},onRemoved:id=>locked.delete(id)});c.append(f);",1)
 backup=p.with_suffix('.js.patch012-backup')
 if not backup.exists():shutil.copy2(p,backup)
 p.write_text(s,encoding='utf-8')
 print('Inline section controls installed.')
else:print('Inline section controls already installed.')
sw=root/'service-worker.js'
if sw.exists():
 text=sw.read_text(encoding='utf-8');updated=text.replace('maker-command-center-v011','maker-command-center-v012')
 for asset in ['./js/music/sections-inline.js','./styles/section-inline.css']:
  if asset not in updated:
   updated,n=re.subn(r'(const ASSETS\s*=\s*\[)',lambda m:m.group(1)+repr(asset)+',',updated,count=1)
   if not n:print('WARNING: add '+asset+' to your custom cache asset list.')
 if updated!=text:
  backup=sw.with_suffix('.js.patch012-backup')
  if not backup.exists():shutil.copy2(sw,backup)
  sw.write_text(updated,encoding='utf-8')
print('Commit js/music/studio.js js/music/sections-inline.js styles/section-inline.css service-worker.js. Keep backup files local.')
