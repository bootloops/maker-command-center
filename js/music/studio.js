import './dock-recovery.js';
import {buildCreativeSystem, creativeDesign, creativeControlsUI, appendQualityNotes} from './creative-direction.js';
// MCC creative direction 014
import {finishMusicJob} from './integration.js';
// MCC integration 013
import {decorateSection, sectionInsertButton} from './sections-inline.js';
// MCC inline sections 012
import {renderSectionManager, installStudioUI} from './studio-ui.js';
// MCC intuitive studio 011
import {initDB,getAll,get,put,uid,now,getSettings} from '../store.js';
import {SONG_PREFIX,blankSong,checkLimits,exportPackage,snapshot} from './core.js';
import {studioChat} from './transport.js';
import {PROFILE_DEFAULT,FLOW_SCHEMA,validateResult,protectDraft,lyricView,repetitionReport} from './songflow.js';
function h(tag,attrs={},children=[]){const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')n.className=v;else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);else if(v!==undefined&&v!==null)n.setAttribute(k,v);}for(const c of [].concat(children))if(c!==null&&c!==undefined)n.append(c instanceof Node?c:document.createTextNode(String(c)));return n;}
const status=document.getElementById('save-status'),root=document.getElementById('studio');const left=h('aside',{class:'flow-library'}),doc=h('section',{class:'flow-document'}),partner=h('aside',{class:'flow-partner'});root.append(left,doc,partner);
let song,library=[],settings,profile=PROFILE_DEFAULT,mode='create',model='',models=[],instruction='',preserveStyle=false,preserveTitle=false,locked=new Set(),busy=false,lastError='',queue=Promise.resolve();
function tell(t){status.textContent=t;}
function fail(e){console.error('[Music Studio flow]',e);lastError=e?.message||String(e);tell('Needs attention');renderPartner();}
function safe(fn){return async(...args)=>{try{await fn(...args);}catch(e){fail(e);}};}
function btn(text,fn,primary=false){return h('button',{class:'btn small'+(primary?' primary':''),type:'button',onclick:safe(fn)},text);}
function card(title,items=[]){return h('div',{class:'flow-card'},[h('h2',{},title),...items]);}
function details(title,items=[],open=false){return h('details',open?{open:''}:{},[h('summary',{},title),...items]);}
function field(label,value,fn,large=false){const id=uid('field'),input=h(large?'textarea':'input',{id});input.value=value??'';input.addEventListener('change',safe(async()=>{await fn(input.value);}));return h('div',{class:'flow-field'},[h('label',{for:id},label),input]);}
function checkbox(label,checked,fn){const input=h('input',{type:'checkbox'});input.checked=checked;input.addEventListener('change',()=>fn(input.checked));return h('label',{class:'flow-inline'},[input,label]);}
function select(label,value,options,fn){const input=h('select');for(const[v,t]of options){const o=h('option',{value:v},t);o.selected=v===value;input.append(o);}input.addEventListener('change',safe(()=>fn(input.value)));return h('div',{class:'flow-field'},[h('label',{},label),input]);}
function save(){const data=JSON.parse(JSON.stringify(song));data.updatedAt=now();song.updatedAt=data.updatedAt;tell('Saving…');queue=queue.catch(()=>{}).then(()=>put('meta',data)).then(()=>tell('Saved locally'));return queue;}
function draftOf(s){return {title:s.title,style:s.style,sections:s.sections.map(x=>({...x}))};}
function hasContent(s){return s.sections.some(x=>x.lyrics.trim())||s.style.trim();}
async function refreshLibrary(){library=(await getAll('meta')).filter(x=>x.id.startsWith(SONG_PREFIX)).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));renderLibrary();}
async function choose(id){if(busy)throw new Error('Wait for generation to finish.');await queue;song=await get('meta',id);if(!song)throw new Error('Song missing.');locked=new Set();preserveStyle=false;preserveTitle=false;mode=hasContent(song)?'refine':'create';await put('meta',{id:'music:active',songId:id});render();}
async function newSong(){if(busy)throw new Error('Wait for generation to finish.');await queue;song=blankSong(SONG_PREFIX+uid('song'),now());mode='create';instruction='';locked=new Set();await save();await put('meta',{id:'music:active',songId:song.id});await refreshLibrary();render();}
function renderLibrary(){left.replaceChildren(card('Your songs',[btn('New song',newSong,true),h('div',{class:'flow-songs'},library.map(s=>{const b=btn(s.title,()=>choose(s.id));b.classList.add('song');if(s.id===song?.id)b.classList.add('active');return b;})),btn('Import song JSON',importSong),h('p',{class:'flow-help'},'Song fields save when you leave the field. Wait for Saved locally before closing.'),h('a',{href:'./index.html#/settings'},'Full workspace backup')]));}
function render(){renderLibrary();renderDocument();renderPartner();}
function renderDocument(){if(!song)return;doc.replaceChildren();const c=card('Your song');c.append(field('Title',song.title,async v=>{song.title=v||'Untitled song';await save();await refreshLibrary();}));
 c.append(field('Style / sound direction',song.style,async v=>{song.style=v;await save();},true));
 c.append(sectionInsertButton({song,save,refresh:()=>{renderDocument();renderPartner();}}));
 for(const section of song.sections){const f=field('['+section.name+']',section.lyrics,async v=>{section.lyrics=v;await save();},true);f.dataset.musicSectionId=section.id;f.querySelector('textarea').classList.add('flow-lyrics');decorateSection({container:f,section,song,save,refresh:()=>{renderDocument();renderPartner();},onRemoved:id=>locked.delete(id)});c.append(f);}
 doc.append(c);renderResult();renderTools();}
function renderResult(){const result=song.flowResult;if(!result||result.state!=='pending')return;const box=card('Recommended revision');box.classList.add('flow-result');appendQualityNotes(box,result.recommended);
 box.append(h('p',{class:'flow-help'},result.explanation),h('div',{class:'flow-preview'},'STYLE\n'+result.recommended.style+'\n\n'+lyricView(result.recommended)));
 box.append(h('div',{class:'flow-row'},[btn('Use this revision',()=>accept(result.recommended),true),btn('Keep current',async()=>{result.state='dismissed';await save();renderDocument();}),btn('Save alternative',()=>saveAlternative(result.recommended,'Recommended draft')),btn('Make new song',()=>branchSongDraft(result.recommended))]));
 box.append(details('Preview changes',[h('div',{class:'flow-comparison'},[h('div',{},[h('h3',{},'Current'),h('pre',{class:'flow-preview'},song.style+'\n\n'+lyricView(song))]),h('div',{},[h('h3',{},'Proposed'),h('pre',{class:'flow-preview'},result.recommended.style+'\n\n'+lyricView(result.recommended))])])]));
 if(result.alternatives.length)box.append(details('Other ideas ('+result.alternatives.length+')',result.alternatives.map((a,i)=>h('div',{class:'flow-section'},[h('h3',{},a.title||'Alternative '+(i+1)),h('pre',{class:'flow-preview'},a.style+'\n\n'+lyricView(a)),btn('Use this alternative',()=>accept(a)),btn('Save for later',()=>saveAlternative(a,'Alternative '+(i+1))),btn('Make new song',()=>branchSongDraft(a))]))));
 doc.append(box);}

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

async function saveAlternative(d,label){song.alternatives.push({id:uid('alt'),type:'song_draft',title:label,at:now(),text:JSON.stringify(d,null,2),document:JSON.parse(JSON.stringify(d))});await save();renderDocument();tell('Alternative saved; current song unchanged');}
async function accept(d){if(busy)throw new Error('Wait for generation to finish.');const result=song.flowResult;if(!result||result.state!=='pending')return;
 // Freeze protection choices at generation time, and reject stale drafts after manual edits.
 if(JSON.stringify(draftOf(song))!==result.base){throw new Error('You edited the song after this proposal was generated. Save the proposal as an alternative, then refine again against the current song.');}
 const next=protectDraft(song,d,result.locks);song.versions.push(snapshot(song,'Before accepting AI revision'));Object.assign(song,next);result.state='accepted';song.history.push({at:now(),label:'Accepted a song revision'});mode='refine';await save();await refreshLibrary();render();}
function renderTools(){const c=card('Keep / export');
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
     if(raw.startsWith('```'))raw=raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
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
 c.append(recovery);c.append(h('div',{class:'flow-row'},[btn('Copy style',()=>copyExport('style')),btn('Copy lyrics',()=>copyExport('lyrics')),btn('Copy complete package',()=>copyExport('combined'))]));
 const n=checkLimits(song);c.append(h('p',{class:'flow-count'+(n.over?' over':'')},`Style ${n.style}/${song.profile.styleLimit||'∞'} · Lyrics ${n.lyrics}/${song.profile.lyricsLimit||'∞'}\nCombined ${n.combined}/${song.profile.combinedLimit||'∞'}`));
 c.append(details('Destination settings',[
 field('Profile name',song.profile.name,async v=>{song.profile.name=v;await save();}),
 ...[['styleLimit','Style limit'],['lyricsLimit','Lyrics limit'],['combinedLimit','Combined limit']].map(([k,label])=>field(label+' (0 = unlimited)',song.profile[k],async v=>{song.profile[k]=Math.max(0,parseInt(v)||0);await save();renderDocument();})),
 checkbox('Include [section tags]',song.profile.includeTags,safe(async v=>{song.profile.includeTags=v;await save();renderDocument();})),h('p',{class:'flow-help'},'Counts include spaces, tags and separators. Unicode code points are counted; a provider may count differently. Configure the limits your destination currently requires.') ]));
 const versions=[btn('Save named version',async()=>{const label=prompt('Version name','Draft');if(!label)return;song.versions.push(snapshot(song,label));await save();renderDocument();})];
 for(const v of [...song.versions].reverse())versions.push(details(v.label+' · '+new Date(v.at).toLocaleString(),[h('pre',{class:'flow-preview'},v.document?.style+'\n\n'+lyricView(v.document)),btn('Restore',async()=>{if(!confirm('Restore this version? Current song will be kept as a recovery version.'))return;const id=song.id,oldVersions=song.versions,recovery=snapshot(song,'Before restore');song={...song,...JSON.parse(JSON.stringify(v.document)),id,versions:[...oldVersions,recovery],flowResult:null};locked=new Set();await save();render();})]));
 c.append(details('Versions & recovery',versions));
 c.append(details('Saved alternatives',song.alternatives.map(a=>details(a.title,[h('pre',{class:'flow-preview'},a.text||''),a.document?btn('Review this draft',async()=>{song.flowResult={state:'pending',base:JSON.stringify(draftOf(song)),locks:{style:preserveStyle,title:preserveTitle,sections:[...locked]},explanation:'Saved alternative',recommended:a.document,alternatives:[]};await save();renderDocument();}):null,a.document?btn('Make new song',()=>branchSongDraft(a.document)):null].filter(Boolean)))));
 const repeats=repetitionReport(song);c.append(details('Local repetition check',[h('p',{class:'flow-help'},'Exact repeated lines only. Chorus repetition may be intentional; this is not an originality verdict.'),h('pre',{class:'flow-preview'},repeats.map(r=>r.line+' — '+r.sections.join(', ')).join('\n')||'No repeated lines of 12+ normalized characters found.')]));
 c.append(details('Advanced / production notes',[
 field('Arrangement notes',song.arrangement.map(a=>a.name+': '+a.direction).join('\n'),async v=>{song.arrangement=v.split('\n').filter(Boolean).map(line=>({id:uid('arr'),name:'Note',direction:line}));await save();},true),
 h('p',{class:'flow-help'},'Task planning remains in the main AI Workspace. This simplified song flow does not generate task cards.'),h('a',{href:'./index.html#/ai'},'Open general AI Workspace'),
 btn('Export song JSON',()=>download(song.title+'.json',JSON.stringify({app:'mcc-music',schemaVersion:1,song},null,2),'application/json')),btn('Export Markdown',()=>download(song.title+'.md','# '+song.title+'\n\n## Style\n'+song.style+'\n\n## Lyrics\n'+lyricView(song),'text/markdown')) ]));doc.append(c);}
async function copyExport(key){await save();if(checkLimits(song).over){renderDocument();throw new Error('Configured character limits are exceeded. Shorten the draft or change destination settings before copying.');}await navigator.clipboard.writeText(exportPackage(song)[key]);tell('Copied '+key);}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=h('a',{href:url,download:name});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function renderPartner(){partner.replaceChildren();const c=card('Your songwriting partner');
 if(lastError)c.append(h('div',{class:'flow-error',role:'alert'},[lastError,h('div',{class:'flow-row'},[btn('Copy error',()=>navigator.clipboard.writeText(lastError)),btn('Dismiss',()=>{lastError='';renderPartner();})])]));
 const modes=h('div',{class:'flow-row'});for(const m of ['create','refine']){const b=btn(m==='create'?'Create':'Refine',()=>{mode=m;renderPartner();});b.classList.add('flow-mode');if(mode===m)b.classList.add('active');modes.append(b);}c.append(modes);
 c.append(field(mode==='create'?'What are we making?':'What should change?',instruction,v=>{instruction=v;},true));
 const input=c.querySelector('textarea');input.placeholder=mode==='create'?'A joyful conscious hip-hop track about curiosity, with liquid bass and a huge final chorus.':'Keep the chorus. Make the verses less explanatory and the ending more powerful.';input.addEventListener('input',()=>{instruction=input.value;});
 c.append(h('p',{class:'flow-help'},'One request. One coherent draft. No automatic critique loops.'));
 c.append(details('Preserve / protect',[
 checkbox('Keep current style exactly',preserveStyle,v=>{preserveStyle=v;}),checkbox('Keep title',preserveTitle,v=>{preserveTitle=v;}),
 ...song.sections.map(s=>checkbox('Keep ['+s.name+'] exactly',locked.has(s.id),v=>{v?locked.add(s.id):locked.delete(s.id);})),
 h('p',{class:'flow-help'},'Protected fields are restored by the app even if the model changes them. Protection choices are frozen for each generated revision.') ]));
 const run=btn(busy?'Working…':mode==='create'?'Create first draft':'Propose refinement',review,true);run.disabled=busy;c.append(run);
 const setup=details('Model & creative preferences',[...creativeControlsUI({song,save}),
 select('Local model',model,models.length?models.map(m=>[m.name,m.name]):[[model||'',model||'Connect to load models']],v=>{model=v;}),btn('Connect / refresh models',connect),
 field('Creative profile (editable; not mandatory for every song)',profile,async v=>{profile=v;await put('meta',{id:'music:profile',text:profile});},true),
 field('Song-specific preferences / lines to preserve',song.preferences,async v=>{song.preferences=v;await save();},true),field('Avoid in this song',song.avoid,async v=>{song.avoid=v;await save();},true),
 field('Optional sound / energy hint',song.sonic?.energy||'',async v=>{song.sonic={...song.sonic,energy:v};await save();}),h('p',{class:'flow-help'},'Uses your existing Ollama endpoint. Only the current song and the context you review are sent. No other songs are included automatically.') ]);c.append(setup);partner.append(c);}
async function connect(){settings=await getSettings();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);try{const r=await fetch((settings.ai?.baseUrl||'http://localhost:11434').replace(/\/+$/,'')+'/api/tags',{signal:controller.signal});if(!r.ok)throw new Error('Ollama model list HTTP '+r.status);models=(await r.json()).models||[];if(!models.length)throw new Error('No installed models found.');if(!models.some(m=>m.name===model))model=models.some(m=>m.name===settings.ai?.model)?settings.ai.model:models[0].name;renderPartner();tell('Model ready');}finally{clearTimeout(timer);}}
function review(){if(busy)return;if(!model)throw new Error('Connect Ollama and select a model.');if(!instruction.trim())throw new Error('Describe the song or refinement first.');
 const locks={style:preserveStyle,title:preserveTitle,sections:[...locked]},base=JSON.stringify(draftOf(song));
 const context={mode,request:instruction,creativeProfile:profile,creativeDesign:creativeDesign(song),existingBrief:song.brief,audience:song.audience,emotionalDirection:song.emotion,currentSong:draftOf(song),preferences:song.preferences,avoid:song.avoid,sonic:song.sonic,arrangement:song.arrangement,limits:song.profile,counts:checkLimits(song),protect:locks};
 const dialog=h('dialog',{class:'flow-card'}),text=h('textarea',{rows:'14'});text.style.width='100%';text.value=JSON.stringify(context,null,2);
 dialog.append(h('h2',{},'Review context'),h('p',{class:'flow-help'},'One local AI request will produce one recommended revision. Protection is enforced by the app; edits here do not override the checkboxes.'),text,h('div',{class:'flow-row'},[btn('Generate',async()=>{const approved=text.value;dialog.close();dialog.remove();await generate(approved,base,locks);},true),btn('Cancel',()=>{dialog.close();dialog.remove();})]));document.body.append(dialog);dialog.addEventListener('cancel',()=>dialog.remove(),{once:true});dialog.showModal();}
async function generate(context,base,locks){if(busy)return;busy=true;lastError='';renderPartner();const target=song.id;
 try{await save();settings=await getSettings();const response=await studioChat((settings.ai?.baseUrl||'http://localhost:11434').replace(/\/+$/,'')+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,format:FLOW_SCHEMA,options:{temperature:settings.ai?.temperature??0.65},messages:[{role:'system',content:buildCreativeSystem(song.creativeControls)},{role:'user',content:context}]})});
 const envelope=await response.json();
 // MCC response recovery 010: checkpoint before JSON parsing or schema validation.
 const raw=envelope.message?.content;
 if(typeof raw!=='string')throw new Error('Ollama returned no response text.');
 song.flowRawOutputs=song.flowRawOutputs||[];
 song.flowRawOutputs.push({id:uid('raw'),at:now(),model,raw});
 try{await save();}catch(checkpointError){console.error('Raw response could not be saved locally',checkpointError);tell('Response held in memory; export it before closing');}
 let decoded;try{decoded=JSON.parse(envelope.message.content);}catch{throw new Error('The response was not valid JSON. No song changes were applied. Try a shorter request or another model.');}
 const result=validateResult(decoded,song);if(song.id!==target)throw new Error('Song changed while generation was running; no changes applied.');
 result.recommended=protectDraft(song,result.recommended,locks);result.alternatives=result.alternatives.map(d=>protectDraft(song,d,locks));
 song.flowResult={...result,state:'pending',base,locks,at:now()};song.history.push({at:now(),label:'Generated one '+mode+' revision'});await save();renderDocument();tell('Revision ready — your song is unchanged');finishMusicJob('complete','Music revision ready for review — your song is unchanged.');
 }catch(e){fail(e);finishMusicJob('error',e.message||'Music generation needs attention');}finally{busy=false;renderDocument();renderPartner();}}
function importSong(){const input=h('input',{type:'file',accept:'application/json,.json'});input.addEventListener('change',safe(async()=>{if(busy)throw new Error('Wait for generation to finish.');if(!input.files[0])return;const data=JSON.parse(await input.files[0].text()),s=data.song;if(data.app!=='mcc-music'||data.schemaVersion!==1||!s||!Array.isArray(s.sections)||s.sections.some(a=>typeof a.lyrics!=='string'||typeof a.name!=='string'))throw new Error('Invalid song export.');const fresh=blankSong(SONG_PREFIX+uid('song'),now());const imported={...fresh,...s,id:fresh.id,sonic:{...fresh.sonic,...s.sonic},profile:{...fresh.profile,...s.profile}};for(const k of ['versions','alternatives','history','arrangement'])if(!Array.isArray(imported[k]))imported[k]=[];await put('meta',imported);await refreshLibrary();await choose(imported.id);}));input.click();}
async function start(){await initDB();settings=await getSettings();document.documentElement.dataset.theme=settings.theme||'cyberpunk';model=settings.ai?.model||'';const stored=await get('meta','music:profile');profile=stored?.text||PROFILE_DEFAULT;await refreshLibrary();const active=await get('meta','music:active');song=library.find(s=>s.id===active?.songId)||library[0];if(!song)await newSong();else{mode=hasContent(song)?'refine':'create';render();tell('Song loaded locally');}window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue='';}});}
start().catch(fail);

installStudioUI();

window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.source!=='mcc-host-013'||event.data.type!=='select-song')return;safe(()=>choose(event.data.id))();});
