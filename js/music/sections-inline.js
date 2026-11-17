import {snapshot} from './core.js';
const TYPES=['Verse','Chorus','Hook','Pre-Chorus','Post-Chorus','Bridge','Intro','Outro','Instrumental','Breakdown','Drop','Interlude','Custom'];
export function suggestedName(type,sections){const names=new Set(sections.map(s=>s.name.trim().toLowerCase()));if(type!=='Verse'&&!names.has(type.toLowerCase()))return type;let n=1;while(names.has((type+' '+n).toLowerCase()))n++;return type+' '+n;}
export function moveSection(song,id,offset){const i=song.sections.findIndex(s=>s.id===id),j=i+offset;if(i<0||j<0||j>=song.sections.length)return false;[song.sections[i],song.sections[j]]=[song.sections[j],song.sections[i]];return true;}
function node(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
function button(text,fn){const b=node('button',text);b.className='btn small';b.type='button';b.addEventListener('click',fn);return b;}
function styles(){if(document.getElementById('section-inline-css'))return;const link=document.createElement('link');link.id='section-inline-css';link.rel='stylesheet';link.href=new URL('../../styles/section-inline.css',import.meta.url).href;document.head.append(link);}
export function sectionInsertButton({song,save,refresh,afterId=null}){styles();return button(afterId?'Add section below':'Add section',()=>openInsert({song,save,refresh,afterId}));}
function openInsert({song,save,refresh,afterId}){
 const previous=document.activeElement,d=node('dialog');d.className='section-dialog';d.setAttribute('aria-label','Add song section');
 const heading=node('h2','Add song section'),hint=node('p','Choose a section type, then adjust its name if you like.');
 const form=node('form');form.method='dialog';const type=node('select');type.setAttribute('aria-label','Section type');for(const name of TYPES){const o=node('option',name);o.value=name;type.append(o);}
 const name=node('input');name.type='text';name.maxLength=100;name.setAttribute('aria-label','Section name');const error=node('p');error.className='section-inline-error';error.setAttribute('role','alert');
 function update(){name.value=type.value==='Custom'?'':suggestedName(type.value,song.sections);name.placeholder=type.value==='Custom'?'Enter a section name':'';}
 type.addEventListener('change',update);update();
 const controls=node('div');controls.className='section-inline-actions';let saving=false;
 function close(){if(saving)return;d.close();d.remove();previous?.focus?.();}
 const cancel=button('Cancel',close),add=node('button','Add section');add.className='btn primary';add.type='submit';controls.append(cancel,add);
 form.append(node('label','Section type'),type,node('label','Section name'),name,error,controls);d.append(heading,hint,form);
 form.addEventListener('submit',async e=>{e.preventDefault();if(saving)return;const title=name.value.trim();if(!title){error.textContent='Please enter a section name.';name.focus();return;}
  let index=afterId===null?song.sections.length:song.sections.findIndex(s=>s.id===afterId)+1;
  if(afterId!==null&&index===0){error.textContent='The insertion point no longer exists. Close and reopen the dialog.';return;}
  saving=true;add.disabled=true;cancel.disabled=true;
  const old=song.sections.slice(),oldVersions=song.versions.slice();
  try{song.versions.push(snapshot(song,'Before adding '+title));song.sections.splice(index,0,{id:'section_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9),name:title,lyrics:''});await save();d.close();d.remove();refresh();}
  catch(err){song.sections=old;song.versions=oldVersions;error.textContent=err.message||String(err);}
  finally{saving=false;add.disabled=false;cancel.disabled=false;}
 });
 d.addEventListener('cancel',e=>{e.preventDefault();close();});document.body.append(d);d.showModal();type.focus();
}
export function decorateSection({container,section,song,save,refresh,onRemoved}){
 styles();container.classList.add('section-inline');
 const label=container.querySelector('label'),textarea=container.querySelector('textarea');
 if(!label||!textarea)return;
 const header=node('div');header.className='section-inline-head';
 label.classList.add('section-edit-label');label.title='Click to rename this section';
 const edit=button('Edit name',startRename);edit.setAttribute('aria-label','Rename '+section.name);
 const menu=node('details');menu.className='section-inline-menu';const summary=node('summary','Section options');menu.append(summary);
 const panel=node('div');panel.className='section-inline-actions';menu.append(panel);
 const error=node('p');error.className='section-inline-error';error.setAttribute('role','alert');
 let working=false,renaming=false;
 async function change(labelText,fn){if(working)return;working=true;error.textContent='';const before=JSON.parse(JSON.stringify(song.sections)),versions=song.versions.slice();
  try{song.versions.push(snapshot(song,labelText));fn();await save();refresh();}
  catch(e){song.sections=before;song.versions=versions;error.textContent=e.message||String(e);}
  finally{working=false;}
 }
 const index=song.sections.findIndex(s=>s.id===section.id);
 const up=button('Move up',()=>change('Before moving '+section.name,()=>moveSection(song,section.id,-1)));up.disabled=index<=0;
 const down=button('Move down',()=>change('Before moving '+section.name,()=>moveSection(song,section.id,1)));down.disabled=index===song.sections.length-1;
 panel.append(up,down,sectionInsertButton({song,save,refresh,afterId:section.id}),button('Remove section',()=>{
  if(!confirm('Remove ['+section.name+']? A recovery version will be saved.'))return;
  change('Before removing '+section.name,()=>{song.sections=song.sections.filter(s=>s.id!==section.id);onRemoved?.(section.id);});
 }));
 label.parentNode.insertBefore(header,label);header.append(label,edit,menu);container.append(error);
 label.addEventListener('click',e=>{e.preventDefault();startRename();});
 function startRename(){if(renaming||working)return;renaming=true;label.hidden=true;edit.hidden=true;menu.hidden=true;
  const group=node('div');group.className='section-inline-rename';const input=node('input');input.type='text';input.value=section.name;input.maxLength=100;input.setAttribute('aria-label','Edit section name');
  let committing=false;
  function cancel(){if(committing)return;group.remove();label.hidden=false;edit.hidden=false;menu.hidden=false;renaming=false;error.textContent='';edit.focus();}
  const cancelButton=button('Cancel',cancel);
  const saveButton=button('Save',async()=>{if(committing)return;const value=input.value.trim();if(!value){error.textContent='Section name cannot be empty.';input.focus();return;}
   if(value===section.name){cancel();return;}
   committing=true;saveButton.disabled=true;cancelButton.disabled=true;
   const old=section.name,versions=song.versions.slice();
   try{song.versions.push(snapshot(song,'Before renaming '+old));section.name=value;await save();refresh();}
   catch(e){section.name=old;song.versions=versions;error.textContent=e.message||String(e);}
   finally{committing=false;saveButton.disabled=false;cancelButton.disabled=false;}
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();saveButton.click();}else if(e.key==='Escape'){e.preventDefault();cancel();}});
  group.append(input,saveButton,cancelButton);header.append(group);input.focus();input.select();
 }
}
