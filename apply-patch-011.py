from pathlib import Path
import shutil,re
root=Path(__file__).resolve().parent
p=root/'js/music/studio.js'
if not p.exists():raise SystemExit('Run from repository root with patches 008 and 010 installed.')
s=p.read_text(encoding='utf-8')
if '// MCC intuitive studio 011' not in s:
 required=[" c.append(details('Edit section structure',[",' doc.append(c);renderResult();renderTools();',"for(const section of song.sections){const f=field",'async function saveAlternative(d,label)',"btn('Save alternative',()=>saveAlternative(result.recommended,'Recommended draft'))", "btn('Save for later',()=>saveAlternative(a,'Alternative '+(i+1)))"]
 missing=[x for x in required if x not in s]
 if missing:raise SystemExit('Studio source differs; no files modified. Share js/music/studio.js for a matching patch. Missing: '+repr(missing))
 # Remove the old bottom-of-document structure editor while preserving the document finish.
 start=s.index(" c.append(details('Edit section structure',[")
 end=s.index(' doc.append(c);renderResult();renderTools();',start)
 s=s[:start]+s[end:]
 s="import {renderSectionManager, installStudioUI} from './studio-ui.js';\n// MCC intuitive studio 011\n"+s
 s=s.replace('for(const section of song.sections){const f=field',"c.append(renderSectionManager({song,save,refresh:()=>{renderDocument();renderPartner();},onRemoved:id=>locked.delete(id)}));\n for(const section of song.sections){const f=field",1)
 marker="f.querySelector('textarea').classList.add('flow-lyrics');"
 if marker not in s:raise SystemExit('Lyric section signature differs; no files modified.')
 s=s.replace(marker,"f.dataset.musicSectionId=section.id;"+marker,1)
 s=s.replace("btn('Save alternative',()=>saveAlternative(result.recommended,'Recommended draft'))","btn('Save alternative',()=>saveAlternative(result.recommended,'Recommended draft')),btn('Make new song',()=>branchSongDraft(result.recommended))",1)
 s=s.replace("btn('Save for later',()=>saveAlternative(a,'Alternative '+(i+1)))","btn('Save for later',()=>saveAlternative(a,'Alternative '+(i+1))),btn('Make new song',()=>branchSongDraft(a))",1)
 old="a.document?btn('Review this draft',async()=>{song.flowResult={state:'pending',base:JSON.stringify(draftOf(song)),locks:{style:preserveStyle,title:preserveTitle,sections:[...locked]},explanation:'Saved alternative',recommended:a.document,alternatives:[]};await save();renderDocument();}):null"
 if old not in s:raise SystemExit('Saved alternatives signature differs; no files modified.')
 s=s.replace(old,old+",a.document?btn('Make new song',()=>branchSongDraft(a.document)):null",1)
 function=r"""
async function branchSongDraft(d){
 if(busy)throw new Error('Wait for generation to finish before branching.');
 const requested=prompt('Name the new song',d.title||song.title+' — alternative');
 if(requested===null)return;
 if(!requested.trim())throw new Error('Enter a name for the new song.');
 // Save the source first. Do not mutate it or change the selected song.
 await save();
 const sourceId=song.id;
 const fresh=blankSong(SONG_PREFIX+uid('song'),now());
 const branched={...fresh,title:requested.trim(),style:d.style,sections:d.sections.map(s=>({...s})),
  brief:song.brief,audience:song.audience,emotion:song.emotion,avoid:song.avoid,preferences:song.preferences,
  sonic:JSON.parse(JSON.stringify(song.sonic||fresh.sonic)),profile:JSON.parse(JSON.stringify(song.profile)),
  arrangement:JSON.parse(JSON.stringify(song.arrangement||[])),
  sourceSongId:sourceId,history:[{at:now(),label:'Branched from '+song.title}],flowResult:null};
 await put('meta',branched);
 await refreshLibrary();
 tell('Created '+branched.title+' — your current song is unchanged');
 if(confirm('New song saved. Open it now? Cancel keeps working on the current song.'))await choose(branched.id);
}
"""
 s=s.replace('async function saveAlternative(d,label)',function+'\nasync function saveAlternative(d,label)',1)
 s+='\ninstallStudioUI();\n'
 backup=p.with_suffix('.js.patch011-backup')
 if not backup.exists():shutil.copy2(p,backup)
 p.write_text(s,encoding='utf-8')
 print('Studio UI updated; source-song progress is preserved when branching.')
else:print('Studio UI already patched.')
sw=root/'service-worker.js'
if sw.exists():
 text=sw.read_text(encoding='utf-8');updated=re.sub(r'maker-command-center-v0(?:08|09|10)','maker-command-center-v011',text)
 for asset in ['./js/music/studio-ui.js','./styles/studio-dock.css']:
  if asset not in updated:
   updated,n=re.subn(r'(const ASSETS\s*=\s*\[)',lambda m:m.group(1)+repr(asset)+',',updated,count=1)
   if not n:print('WARNING: manually add to custom service-worker cache: '+asset)
 if updated!=text:
  backup=sw.with_suffix('.js.patch011-backup')
  if not backup.exists():shutil.copy2(sw,backup)
  sw.write_text(updated,encoding='utf-8')
print('Commit js/music/studio.js js/music/studio-ui.js styles/studio-dock.css service-worker.js. Do not commit backup files.')
