import {getAll, get, put, uid, now} from '../store.js';

// Task destination picker. Does not modify the chat context or browser route.
export async function chooseTaskMission({selectedId='',heading='Where should these tasks go?'}={}) {
 const projects=(await getAll('projects')).filter(p=>p.status!=='archived');
 return new Promise((resolve,reject)=>{
  const previous=document.activeElement;
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-label',heading);
  dialog.style.cssText='width:min(540px,calc(100vw - 24px));max-height:88dvh;overflow:auto;background:var(--panel-solid,#111827);color:var(--text,#eee);border:1px solid var(--accent,#00e5ff);border-radius:16px;padding:22px;box-shadow:0 20px 70px #0008;';
  function node(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
  function field(label,input){const box=node('div');box.style.margin='12px 0';const l=node('label',label);const id='task-dest-'+Math.random().toString(36).slice(2);input.id=id;l.htmlFor=id;l.style.cssText='display:block;font-size:.85rem;margin-bottom:6px;color:var(--muted,#aaa)';box.append(l,input);return box;}
  function button(text,fn,primary=false){const b=node('button',text);b.type='button';b.className='btn'+(primary?' primary':'');b.onclick=fn;return b;}
  let finished=false;
  function finish(value){if(finished)return;finished=true;dialog.close();dialog.remove();previous?.focus?.();resolve(value);}
  const title=node('h2',heading),description=node('p','Choose a task destination without changing or losing this conversation.');description.style.cssText='font-size:.9rem;color:var(--muted,#aaa)';
  const tabs=node('div');tabs.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
  const existing=node('div'),fresh=node('div');
  const select=node('select');select.style.width='100%';select.append(new Option('Choose an existing mission…',''));
  for(const p of projects){const option=new Option(p.name+(p.status&&p.status!=='active'?' ('+p.status+')':''),p.id);select.append(option);}
  select.value=projects.some(p=>p.id===selectedId)?selectedId:'';
  existing.append(field('Existing mission',select));
  const name=node('input');name.type='text';name.maxLength=160;name.placeholder='e.g. Futuristic music player';name.style.width='100%';
  const vision=node('textarea');vision.rows=3;vision.maxLength=4000;vision.placeholder='Optional purpose or goal';vision.style.width='100%';
  fresh.append(field('Mission name',name),field('Purpose / vision (optional)',vision));
  const error=node('p');error.setAttribute('role','alert');error.style.color='var(--danger,#ff6b81)';
  let mode=projects.length?'existing':'new',working=false;
  const submit=button('',async()=>{
   if(working)return;
   error.textContent='';
   if(mode==='existing'&&!select.value){error.textContent='Choose a mission first.';return;}
   if(mode==='new'&&!name.value.trim()){error.textContent='Enter a mission name.';name.focus();return;}
   working=true;submit.disabled=true;
   try {
    if(mode==='existing'){
     const p=await get('projects',select.value);
     if(!p)throw new Error('That mission no longer exists. Close and reopen this picker.');
     finish({id:p.id,name:p.name,created:false});
    }else{
     const p={id:uid('proj'),name:name.value.trim(),vision:vision.value.trim(),status:'active',type:'other',tags:[],createdAt:now()};
     await put('projects',p);
     finish({id:p.id,name:p.name,created:true});
    }
   }catch(e){error.textContent=e.message||String(e);}finally{working=false;submit.disabled=false;}
  },true);
  const oldTab=button('Existing mission',()=>setMode('existing')),newTab=button('New mission',()=>setMode('new'));
  function setMode(value){mode=value;existing.hidden=value!=='existing';fresh.hidden=value!=='new';oldTab.setAttribute('aria-pressed',String(value==='existing'));newTab.setAttribute('aria-pressed',String(value==='new'));submit.textContent=value==='existing'?'Use this mission':'Create mission & use it';error.textContent='';}
  tabs.append(oldTab,newTab);const controls=node('div');controls.style.cssText='display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:16px';controls.append(button('Cancel',()=>{if(!working)finish(null);}),submit);
  dialog.append(title,description,tabs,existing,fresh,error,controls);
  dialog.addEventListener('cancel',e=>{e.preventDefault();if(!working)finish(null);});
  document.body.append(dialog);setMode(mode);
  try{dialog.showModal();(mode==='new'?name:select).focus();}catch(e){dialog.remove();reject(e);}
 });
}
