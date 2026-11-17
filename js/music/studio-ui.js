import {snapshot} from './core.js';
export function renderSectionManager({song,save,refresh,onRemoved}) {
 const box=document.createElement('section');box.className='flow-section-manager';
 const title=document.createElement('strong');title.textContent='Song structure';
 const row=document.createElement('div');row.className='flow-row';
 const select=document.createElement('select');select.setAttribute('aria-label','Section to edit');
 const name=document.createElement('input');name.setAttribute('aria-label','Section name');name.placeholder='Section name';
 const note=document.createElement('p');note.className='flow-help';note.textContent='Choose a section, rename it, or move it. Editing lyrics stays in the song document below.';
 const msg=document.createElement('p');msg.setAttribute('role','status');msg.className='flow-help';
 function chosen(){return song.sections.find(s=>s.id===select.value);}
 function sync(){name.value=chosen()?.name||'';name.disabled=!chosen();}
 for(const s of song.sections){const o=document.createElement('option');o.value=s.id;o.textContent=s.name;select.append(o);}
 select.addEventListener('change',()=>{sync();const target=[...document.querySelectorAll('[data-music-section-id]')].find(n=>n.dataset.musicSectionId===select.value);target?.scrollIntoView({behavior:'smooth',block:'center'});});
 async function act(fn){try{await fn();}catch(e){console.error(e);msg.textContent=e.message||String(e);}}
 function button(label,fn){const b=document.createElement('button');b.className='btn small';b.type='button';b.textContent=label;b.onclick=()=>act(fn);return b;}
 name.addEventListener('change',()=>act(async()=>{const s=chosen();if(!s)return;const v=name.value.trim();if(!v){msg.textContent='A section name is required.';sync();return;}s.name=v;await save();refresh();}));
 async function move(direction){const i=song.sections.findIndex(s=>s.id===select.value),j=i+direction;if(i<0||j<0||j>=song.sections.length)return;song.versions.push(snapshot(song,'Before reordering sections'));[song.sections[i],song.sections[j]]=[song.sections[j],song.sections[i]];await save();refresh();}
 row.append(select,name,button('Move up',()=>move(-1)),button('Move down',()=>move(1)),button('Add section',async()=>{const id='section_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);song.sections.push({id,name:'New section',lyrics:''});await save();refresh();}),button('Remove',async()=>{const s=chosen();if(!s||!confirm('Remove ['+s.name+']? A recovery version will be saved.'))return;song.versions.push(snapshot(song,'Before removing '+s.name));song.sections=song.sections.filter(x=>x.id!==s.id);onRemoved?.(s.id);await save();refresh();}));
 box.append(title,row,note,msg);sync();return box;
}

export function installStudioUI(){
 if(document.getElementById('songwriter-dock'))return;
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('../../styles/studio-dock.css',import.meta.url).href;document.head.append(css);
 const dock=document.createElement('aside');dock.id='songwriter-dock';dock.setAttribute('aria-label','Songwriting partner');
 const bar=document.createElement('div');bar.className='songwriter-dock-bar';
 const toggle=document.createElement('button');toggle.className='btn primary';toggle.type='button';toggle.textContent='Songwriting partner';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','songwriter-dock-body');
 const config=document.createElement('button');config.className='btn';config.type='button';config.textContent='Settings';config.setAttribute('aria-expanded','false');
 const close=document.createElement('button');close.className='btn';close.type='button';close.textContent='Close';
 const body=document.createElement('div');body.id='songwriter-dock-body';body.hidden=true;
 const settings=document.createElement('div');settings.className='songwriter-settings';settings.hidden=true;settings.setAttribute('aria-label','Songwriter settings');
 const settingsTitle=document.createElement('h2');settingsTitle.textContent='Songwriter settings';
 settings.append(settingsTitle);
 let open=false,settingsOpen=false;
 function apply(){body.hidden=!open;settings.hidden=!open||!settingsOpen;dock.classList.toggle('is-open',open);dock.classList.toggle('settings-open',settingsOpen&&open);toggle.setAttribute('aria-expanded',String(open));config.setAttribute('aria-expanded',String(settingsOpen&&open));close.hidden=!open;}
 toggle.onclick=()=>{open=!open;apply();if(open&&!settingsOpen)body.querySelector('.flow-partner textarea')?.focus();};
 config.onclick=()=>{open=true;settingsOpen=!settingsOpen;apply();};close.onclick=()=>{open=false;apply();toggle.focus();};
 dock.addEventListener('keydown',e=>{if(e.key==='Escape'){open=false;apply();toggle.focus();}});
 bar.append(toggle,config,close);dock.append(bar,body);body.append(settings);document.body.append(dock);
 const root=document.getElementById('studio');
 function update(){
  const partner=root?.querySelector('.flow-partner');
  if(partner&&partner.parentNode!==body)body.append(partner);
  const actual=body.querySelector('.flow-partner');
  if(actual){
   const details=[...actual.querySelectorAll('details')].find(n=>n.querySelector('summary')?.textContent==='Model & creative preferences');
   if(details){while(settings.children.length>1)settings.lastChild.remove();details.open=true;settings.append(details);}
  }
  apply();
 }
 let queued=false;
 const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update();});});
 // Observe DOM changes, not attributes; prevents a loop while toggling dock state.
 observer.observe(root,{childList:true,subtree:true});observer.observe(body,{childList:true,subtree:true});
 update();
}
