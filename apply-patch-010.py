from pathlib import Path
import re,shutil
root=Path(__file__).resolve().parent
p=root/'js/music/studio.js'
if not p.exists():raise SystemExit('Place installer in the existing repository root after patch 008.')
s=p.read_text(encoding='utf-8')
if '// MCC response recovery 010' not in s:
 checks=['const envelope=await response.json();let decoded;','const result=validateResult(decoded);',"}catch(e){fail(e);}finally{busy=false;renderPartner();}","function renderTools(){const c=card('Keep / export');"]
 missing=[x for x in checks if x not in s]
 if missing:raise SystemExit('Unexpected Studio source; no studio.js changes made. Share the current file. Missing: '+repr(missing))
 s=s.replace('const envelope=await response.json();let decoded;',"""const envelope=await response.json();
 // MCC response recovery 010: checkpoint before JSON parsing or schema validation.
 const raw=envelope.message?.content;
 if(typeof raw!=='string')throw new Error('Ollama returned no response text.');
 song.flowRawOutputs=song.flowRawOutputs||[];
 song.flowRawOutputs.push({id:uid('raw'),at:now(),model,raw});
 try{await save();}catch(checkpointError){console.error('Raw response could not be saved locally',checkpointError);tell('Response held in memory; export it before closing');}
 let decoded;""",1)
 s=s.replace('const result=validateResult(decoded);','const result=validateResult(decoded,song);',1)
 s=s.replace('}catch(e){fail(e);}finally{busy=false;renderPartner();}','}catch(e){fail(e);}finally{busy=false;renderDocument();renderPartner();}',1)
 s=s.replace("function renderTools(){const c=card('Keep / export');","""function renderTools(){const c=card('Keep / export');
 const rawRecords=song.flowRawOutputs||[];
 const recovery=details('Response recovery ('+rawRecords.length+')',[
 h('p',{class:'flow-help'},'Completed responses are kept before parsing. Inspect or repair locally; Recover creates a reviewable proposal and never calls the model. Protected fields will still be enforced.'),
 ...[...rawRecords].reverse().map(record=>{
  const text=h('textarea',{rows:'10','aria-label':'Raw model response'});text.value=record.raw;
  return details(new Date(record.at).toLocaleString()+' · '+(record.model||'model'),[
   text,
   h('div',{class:'flow-row'},[
    btn('Copy response',()=>navigator.clipboard.writeText(text.value)),
    btn('Download response',()=>download('music-response-'+record.id+'.txt',text.value,'text/plain')),
    btn('Recover as proposal',async()=>{
     let raw=text.value.trim();
     if(raw.startsWith('```'))raw=raw.replace(/^```(?:json)?\\s*/i,'').replace(/\\s*```$/,'');
     const restored=validateResult(JSON.parse(raw),song);
     const locks={style:preserveStyle,title:preserveTitle,sections:[...locked]};
     restored.recommended=protectDraft(song,restored.recommended,locks);
     restored.alternatives=restored.alternatives.map(d=>protectDraft(song,d,locks));
     song.flowResult={...restored,state:'pending',base:JSON.stringify(draftOf(song)),locks,at:now()};
     await save();renderDocument();tell('Response recovered for review — no generation needed');
    })
   ])
  ]);
 })
 ]);
 c.append(recovery);""",1)
 backup=p.with_suffix('.js.patch010-backup')
 if not backup.exists():shutil.copy2(p,backup)
 p.write_text(s,encoding='utf-8')
 print('Studio response recovery installed.')
else:print('Studio response recovery already installed.')
sw=root/'service-worker.js'
if sw.exists():
 text=sw.read_text(encoding='utf-8');updated=re.sub(r'maker-command-center-v00[89]', 'maker-command-center-v010',text)
 if updated!=text:
  backup=sw.with_suffix('.js.patch010-backup')
  if not backup.exists():shutil.copy2(sw,backup)
  sw.write_text(updated,encoding='utf-8')
print('Commit js/music/songflow.js, js/music/studio.js and service-worker.js. Local backup files are for rollback only.')
