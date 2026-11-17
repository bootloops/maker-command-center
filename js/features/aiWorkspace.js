import { chooseTaskMission } from '../ai/taskDestination.js';
import { getAll, get, put, uid, now, getSettings, saveSettings } from '../store.js';
import { el, pageHead } from '../ui.js';
import { chatWithOllama, listOllamaModels } from '../ai/ollama.js';
import { buildContextPacket } from '../ai/context.js';
import { TOOL_PROMPTS } from '../ai/prompts.js';

const cssURL = new URL('../../styles/workspace.css', import.meta.url).href;
if (!document.querySelector('link[data-mcc-workspace]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = cssURL; link.dataset.mccWorkspace = 'true';
  document.head.append(link);
}

// Scan balanced objects; brackets inside quoted strings are not structural.
export function extractProposals(text) {
  const found = [];
  const source = String(text || '');
  const key = /"proposedActions"\s*:\s*\[/g;
  let match;
  while ((match = key.exec(source))) {
    let depth = 0, quoted = false, escaped = false, start = -1;
    for (let i = key.lastIndex; i < source.length; i++) {
      const c = source[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === '"') quoted = false;
        continue;
      }
      if (c === '"') { quoted = true; continue; }
      if (c === '{') { if (!depth) start = i; depth++; }
      if (c === '}' && depth) {
        depth--;
        if (!depth) {
          try {
            const item = JSON.parse(source.slice(start, i + 1));
            if (typeof item.title === 'string' && item.title.trim()) {
              found.push({title:item.title.trim(), notes:typeof item.notes === 'string' ? item.notes : '',
                priority:['high','medium','low'].includes(item.priority) ? item.priority : 'medium'});
            }
          } catch (_) { /* Incomplete objects remain visible in the original response. */ }
        }
      }
      if (c === ']' && depth === 0) break;
    }
  }
  const unique = [...new Map(found.map(a => [a.title.toLowerCase(), a])).values()].slice(0, 30);
  return {proposals:unique, cleaned:source};
}

function userDisplay(content) {
  const text = String(content || '');
  const i = text.lastIndexOf('\nREQUEST\n');
  return i < 0 ? text : text.slice(i + 9);
}

async function mount(host, initialProject = '', fixedProject = false) {
  const settings = await getSettings();
  settings.ai = settings.ai || {};
  let projectId = initialProject, thread = null, messages = [], sending = false;
  let restoreVersion = 0;
  const shell = el('div', {class:'mcc-messenger'});
  const chat = el('section', {class:'card mcc-chat', 'aria-label':'AI conversation'});
  const log = el('div', {class:'mcc-log', role:'log', 'aria-live':'polite', tabindex:'0'});
  const input = el('textarea', {class:'mcc-compose-input', rows:'3', placeholder:'Message your local AI…'});
  const sendButton = el('button', {class:'btn primary', type:'button'}, 'Send');
  const status = el('p', {class:'mcc-status'}, 'Checking Ollama…');
  const side = el('aside', {class:'card mcc-controls'});
  const model = el('select', {'aria-label':'AI model'});
  const mission = el('select', {'aria-label':'Mission context'});
  const notes = el('textarea', {rows:'3', placeholder:'Optional context notes'});
  const preview = el('textarea', {rows:'7', 'aria-label':'Editable context to send'});
  const errorPanel = el('div', {class:'mcc-error', role:'alert', hidden:''});
  const errorText = el('pre');
  const errorTitle = el('strong');
  errorPanel.append(errorTitle, errorText,
    el('button', {class:'btn small', type:'button', onclick:async()=>{
      try { await navigator.clipboard.writeText(errorTitle.textContent+'\n'+errorText.textContent); }
      catch (_) { errorText.focus(); }
    }}, 'Copy error'),
    el('button', {class:'btn small', type:'button', onclick:()=>{errorPanel.hidden=true;}}, 'Dismiss'));
  function report(stage, error) {
    console.error('[MCC AI] '+stage, error);
    errorTitle.textContent = stage;
    errorText.textContent = (error?.name ? error.name+': ' : '') + (error?.message || String(error));
    errorPanel.hidden = false;
  }
  function guarded(stage, fn) {
    return async (...args) => { try { return await fn(...args); } catch(e) { report(stage,e); } };
  }
  function nearBottom() { return log.scrollHeight-log.scrollTop-log.clientHeight < 100; }
  function scrollEnd() { log.scrollTop=log.scrollHeight; }
  function addMessage(role, text) {
    const bubble=el('div',{class:'mcc-bubble mcc-'+role});
    const body=el('div',{class:'mcc-message-text'},text);
    bubble.append(el('div',{class:'mcc-role'},role==='user'?'You':'Local AI'),body);
    log.append(bubble); return {bubble,body};
  }
  async function updateModelPreference(value) {
    const current=await getSettings();
    current.ai={...current.ai,model:value};
    await saveSettings(current);
    settings.ai.model=value;
    const label=document.getElementById('aiStatus');
    if(label) label.textContent='AI: '+value;
  }
  async function refreshContext() {
    preview.value=await buildContextPacket(projectId,{extraNotes:notes.value});
  }
  async function persist() {
    if(!thread) thread={id:uid('ai'),createdAt:now(),appliedActionKeys:[]};
    thread={...thread,projectId:projectId||null,provider:'ollama',model:model.value||settings.ai.model,
      messages:messages.map(m=>({...m})),contextPacket:preview.value,
      title:thread.title||userDisplay(messages.find(m=>m.role==='user')?.content||'Conversation').slice(0,60)};
    await put('aiThreads',thread);
  }
  function actionKey(index, action) { return String(index)+':'+action.title.toLowerCase(); }
  function actionCard(actions, index, bubble) {
    const card=el('div',{class:'mcc-actions'});
    card.append(el('strong',{},'Suggested tasks'));
    const applied=new Set(thread?.appliedActionKeys||[]);
    // MCC task destinations 009: separate action destination from conversation context.
    let destinationOverride=thread?.actionTargets?.[String(index)]||null;
    const buttons=[];
    const all=el('button',{class:'btn primary small',type:'button'},'Create remaining tasks');
    const target=el('p',{class:'item-meta'},projectId?'Tasks will be added to the selected mission.':'Select a mission before creating tasks.');
    if(destinationOverride&&!projectId)target.textContent='Task destination: '+destinationOverride.name+' (conversation unchanged)';
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
    }
    async function createOne(action, button) {
      
      if(sending) throw new Error('Wait for the current response to finish.');
      const key=actionKey(index,action);
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
      }
      button.disabled=true;
      try {
        const existing=await getAll('tasks');
        const origin=thread.id+':'+key;
        if(!existing.some(t=>t.aiActionKey===origin)) {
          await put('tasks',{id:uid('task'),projectId:destinationId,...action,status:'todo',dueDate:null,tags:[],
            createdAt:now(),completedAt:null,aiActionKey:origin});
        }
        applied.add(key);
        thread.appliedActionKeys=[...applied];
        await persist();
        button.textContent='Created';
      } catch(e) { button.disabled=false; throw e; }
    }
    for(const action of actions) {
      const done=applied.has(actionKey(index,action));
      const button=el('button',{class:'btn small',type:'button'},done?'Created':'Create task');
      button.disabled=done;
      button.addEventListener('click',guarded('Task creation failed',()=>createOne(action,button)));
      const row=el('div',{class:'mcc-action-row'},[
        el('div',{},[el('strong',{},action.title),el('p',{},action.notes),el('small',{},'Priority: '+action.priority)]),button]);
      buttons.push({action,button}); card.append(row);
    }
    all.addEventListener('click',guarded('Task creation failed',async()=>{
      all.disabled=true;
      try { for(const item of buttons){if(await createOne(item.action,item.button)===false)return;} all.textContent='Tasks created'; }
      finally { all.disabled=false; }
    }));
    card.append(all); bubble.append(card);
  }
  async function restore() {
    const version=++restoreVersion;
    const records=(await getAll('aiThreads')).filter(t=>(t.projectId||null)===(projectId||null))
      .sort((a,b)=>new Date(b.updatedAt||b.createdAt)-new Date(a.updatedAt||a.createdAt));
    if(version!==restoreVersion) return;
    thread=records[0]||null; messages=(thread?.messages||[]).map(m=>({...m}));
    log.replaceChildren();
    messages.forEach((m,index)=>{
      const {bubble}=addMessage(m.role,m.role==='user'?userDisplay(m.content):String(m.content||''));
      if(m.role==='assistant') {
        const actions=extractProposals(m.content).proposals;
        if(actions.length) actionCard(actions,index,bubble);
      }
    });
    if(!messages.length) log.append(el('p',{class:'item-meta'},'Start a conversation. Completed replies and suggested tasks are saved locally.'));
    requestAnimationFrame(scrollEnd);
  }
  async function connect() {
    status.textContent='Connecting…';
    const models=await listOllamaModels(settings.ai.baseUrl||'http://localhost:11434');
    model.replaceChildren();
    for(const item of models) {
      const option=el('option',{value:item.name},item.name); option.selected=item.name===settings.ai.model;
      model.append(option);
    }
    if(models.length) {
      if(!models.some(m=>m.name===settings.ai.model)) await updateModelPreference(models[0].name);
      status.textContent='Connected · '+models.length+' model(s)';
    } else { status.textContent='Connected, but no local models found.'; }
  }
  async function send() {
    if(sending||!input.value.trim()) return;
    if(!model.value) throw new Error('Connect Ollama and select an installed model first.');
    const text=input.value.trim();
    const selectedModel=model.value;
    sending=true; sendButton.disabled=true; mission.disabled=true; model.disabled=true;
    let assistant=null;
    try {
      // The exact editable preview is used; sending does not silently regenerate it.
      messages.push({role:'user',content:preview.value+'\n\nREQUEST\n'+text});
      addMessage('user',text); input.value='';
      await persist();
      assistant=addMessage('assistant','Thinking…'); scrollEnd();
      const full=await chatWithOllama({baseUrl:settings.ai.baseUrl,model:selectedModel,
        messages:[{role:'system',content:settings.ai.systemPrompt||'You are a practical maker assistant.'},...messages],
        temperature:settings.ai.temperature??0.4,onToken:(_,whole)=>{
          const follow=nearBottom(); assistant.body.textContent=whole; if(follow) scrollEnd();
        }});
      assistant.body.textContent=full||'(The model returned an empty response.)';
      messages.push({role:'assistant',content:full});
      try { await persist(); } catch(e) { report('Response received, but saving the conversation failed',e); }
      const actions=extractProposals(full).proposals;
      if(actions.length) actionCard(actions,messages.length-1,assistant.bubble);
      if(settings.ai.allowAutoActions&&actions.length) {
        // Auto-actions use the same validation and per-action deduplication path.
        // Leave the review card available when no mission is selected.
        if(projectId) {
          sending=false;
          assistant.bubble.querySelector('.mcc-actions > button')?.click();
        }
      }
    } catch(e) {
      if(assistant) assistant.body.textContent='The request did not complete. See the error panel above.';
      if(!input.value) input.value=text;
      report('AI request or post-response processing failed',e);
    } finally { sending=false; sendButton.disabled=false; mission.disabled=fixedProject; model.disabled=false; }
  }
  sendButton.addEventListener('click',guarded('Could not send message',send));
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();guarded('Could not send message',send)();}});
  model.addEventListener('change',guarded('Could not save selected model',()=>updateModelPreference(model.value)));
  mission.addEventListener('change',guarded('Could not switch mission',async()=>{
    projectId=mission.value; await restore(); await refreshContext();
  }));
  const projects=await getAll('projects');
  mission.append(el('option',{value:''},'General conversation (no mission)'));
  for(const p of projects) { const option=el('option',{value:p.id},p.name); option.selected=p.id===projectId; mission.append(option); }
  mission.value=projectId; mission.disabled=fixedProject;
  const newChat=el('button',{class:'btn small',type:'button',onclick:guarded('Could not start chat',async()=>{
    if(sending) return;
    thread=null; messages=[]; log.replaceChildren(); input.value=''; await persist();
  })},'New conversation');
  const details=el('details',{class:'mcc-context'});
  details.append(el('summary',{},'Review / edit context sent to the model'),notes,preview,
    el('button',{class:'btn small',type:'button',onclick:guarded('Could not refresh context',refreshContext)},'Refresh context'));
  chat.append(el('div',{class:'mcc-chat-head'},[el('h2',{},'Conversation'),newChat]),errorPanel,log,
    el('div',{class:'mcc-composer'},[details,input,el('div',{class:'row'},[sendButton,el('small',{},'Ctrl/⌘ + Enter to send')])]));
  function control(label,node) { return el('div',{class:'mcc-control'},[el('label',{},label),node]); }
  side.append(el('h2',{},'Local AI'),status,control('Mission',mission),control('Model',model),
    el('button',{class:'btn small',type:'button',onclick:guarded('Ollama connection failed',connect)},'Test connection'));
  const tools=el('details',{class:'mcc-tools'}); tools.open=true; tools.append(el('summary',{},'Workflow prompts'));
  for(const tool of Object.values(TOOL_PROMPTS)) tools.append(el('button',{class:'ai-tool',type:'button',onclick:()=>{
    input.value=tool.instruction+'\n\nMY REQUEST\n'; input.focus();
  }},[el('strong',{},tool.label),el('span',{},tool.description)]));
  side.append(tools); shell.append(chat,side); host.replaceChildren(shell);
  await guarded('Could not restore conversation',restore)();
  await guarded('Could not load context',refreshContext)();
  await guarded('Ollama connection failed',connect)();
}

export async function renderAIWorkspace(view, params={}) {
  view.replaceChildren(pageHead('AI Workspace','Local AI conversations and reviewable workflow actions.'));
  const host=el('div'); view.append(host);
  await mount(host,params.project||'',false);
}
export async function renderProjectAI(container, project) {
  const host=el('div'); container.replaceChildren(host);
  await mount(host,project.id,true);
}
