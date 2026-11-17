"""Run from your existing MCC repo root: python apply-patch-009.py"""
from pathlib import Path
import re, shutil
root=Path(__file__).resolve().parent
p=root/'js/features/aiWorkspace.js'
if not p.exists():raise SystemExit('Cannot find js/features/aiWorkspace.js. Place this installer in the repo root.')
s=p.read_text(encoding='utf-8')
if '// MCC task destinations 009' in s:
    print('AI Workspace already patched; no further changes required.')
else:
    # Expected source is patch 005, retained unchanged by Music Studio patches 006–008.
    required=["async function createOne(action, button) {", "if(!projectId) throw new Error('Select a mission in the controls panel before creating a task.');", "const origin=thread.id+':'+key;", "await put('tasks',{id:uid('task'),projectId,...action", "const applied=new Set(thread?.appliedActionKeys||[]);", 'all.disabled=true;']
    missing=[x for x in required if x not in s]
    if missing:raise SystemExit('AI Workspace differs from patch 005. No existing files were modified. Share your current js/features/aiWorkspace.js for an exact patch. Missing signatures: '+repr(missing))
    s="import { chooseTaskMission } from '../ai/taskDestination.js';\n"+s
    s=s.replace("const applied=new Set(thread?.appliedActionKeys||[]);", """const applied=new Set(thread?.appliedActionKeys||[]);
    // MCC task destinations 009: separate action destination from conversation context.
    let destinationOverride=thread?.actionTargets?.[String(index)]||null;""",1)
    guard="if(!projectId) throw new Error('Select a mission in the controls panel before creating a task.');"
    s=s.replace(guard,'',1)
    marker="const key=actionKey(index,action);\n      if(applied.has(key)) return;"
    if marker not in s:raise SystemExit('Action execution signature differs; no files changed.')
    s=s.replace(marker,"""const key=actionKey(index,action);
      if(applied.has(key)) return;
      let destinationId=projectId||destinationOverride?.id;
      if(!destinationId){
        const chosen=await chooseTaskMission();
        if(!chosen)return false;
        destinationOverride=chosen;
        if(!thread)throw new Error('Conversation has not been saved yet. Please wait and retry.');
        thread.actionTargets={...(thread.actionTargets||{}),[String(index)]:chosen};
        await persist();
        target.textContent='Task destination: '+chosen.name+' (conversation unchanged)';
        destinationId=chosen.id;
      }
      if(!(await get('projects',destinationId))) {
        destinationOverride=null;
        if(thread?.actionTargets)delete thread.actionTargets[String(index)];
        throw new Error('The task destination no longer exists. Use Choose / change destination to select another mission.');
      }""",1)
    s=s.replace("await put('tasks',{id:uid('task'),projectId,...action", "await put('tasks',{id:uid('task'),projectId:destinationId,...action",1)
    # Cancellation during bulk creation exits without repeating the modal for every action.
    bulk="for(const item of buttons) await createOne(item.action,item.button); all.textContent='Tasks created';"
    if bulk not in s:raise SystemExit('Bulk action signature differs; no files changed.')
    s=s.replace(bulk,"for(const item of buttons){if(await createOne(item.action,item.button)===false)return;} all.textContent='Tasks created';",1)
    old="card.append(target);"
    if old not in s:raise SystemExit('Action card signature differs; no files changed.')
    s=s.replace(old,"""if(destinationOverride&&!projectId)target.textContent='Task destination: '+destinationOverride.name+' (conversation unchanged)';
    card.append(target);
    if(!projectId){
      const change=el('button',{class:'btn small',type:'button'},'Choose / change destination');
      change.addEventListener('click',guarded('Could not choose task destination',async()=>{
        if(sending)throw new Error('Wait for the current response to finish.');
        change.disabled=true;
        try{
          const chosen=await chooseTaskMission({selectedId:destinationOverride?.id||''});
          if(!chosen)return;
          if(!thread)throw new Error('Conversation has not been saved yet. Please wait and retry.');
          destinationOverride=chosen;
          thread.actionTargets={...(thread.actionTargets||{}),[String(index)]:chosen};
          await persist();
          target.textContent='Task destination: '+chosen.name+' (conversation unchanged)';
        }finally{change.disabled=false;}
      }));
      card.append(change);
    }""",1)
    backup=p.with_suffix('.js.patch009-backup')
    if not backup.exists():shutil.copy2(p,backup)
    p.write_text(s,encoding='utf-8')
    print('AI Workspace patched. Conversation selection is unchanged by task destination actions.')
sw=root/'service-worker.js'
if sw.exists():
    content=sw.read_text(encoding='utf-8')
    updated=re.sub(r"maker-command-center-v00[6-8]",'maker-command-center-v009',content)
    if './js/ai/taskDestination.js' not in updated:
        updated,n=re.subn(r'(const ASSETS\s*=\s*\[)',r"\1'./js/ai/taskDestination.js',",updated,count=1)
        if not n:print('WARNING: cache asset list was not recognized; add ./js/ai/taskDestination.js manually if using custom offline caching.')
    if updated!=content:
        backup=sw.with_suffix('.js.patch009-backup')
        if not backup.exists():shutil.copy2(sw,backup)
        sw.write_text(updated,encoding='utf-8')
print('Commit js/features/aiWorkspace.js, js/ai/taskDestination.js and service-worker.js. Do not commit local backup files.')
