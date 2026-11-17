export const PROFILE_DEFAULT='Write original, emotionally grounded songs with strong rhythmic identity. Let meaning emerge through scenes, metaphor, melody and contrast rather than instruction or lectures. Favor fresh imagery, memorable hooks, purposeful builds and drops, and detailed but uncluttered production direction. Avoid recycling distinctive lines or concepts. Spiritual or metaphysical ideas are creative themes, not medical or scientific claims. Adapt to this song; do not force one genre or mood onto every track.';
export const FLOW_SCHEMA={type:'object',additionalProperties:false,required:['explanation','recommended','alternatives'],properties:{explanation:{type:'string'},recommended:{$ref:'#/$defs/draft'},alternatives:{type:'array',maxItems:2,items:{$ref:'#/$defs/draft'}}},$defs:{draft:{type:'object',additionalProperties:false,required:['title','style','sections'],properties:{title:{type:'string'},style:{type:'string'},sections:{type:'array',minItems:1,maxItems:20,items:{type:'object',additionalProperties:false,required:['id','name','lyrics'],properties:{id:{type:'string'},name:{type:'string'},lyrics:{type:'string'}}}}}}}};
function key(s){return String(s||'').trim().toLowerCase().replace(/\s+/g,' ');}
// IDs are application metadata, not lyrics. Repair them without modifying creative text.
export function validateDraft(d,current=null,warnings=[]) {
 if(!d||typeof d.title!=='string'||typeof d.style!=='string'||!Array.isArray(d.sections)||!d.sections.length||d.sections.length>20)throw new Error('The response needs a title, style and 1–20 lyric sections. Original response retained in Response recovery.');
 if(d.style.length>20000)throw new Error('Style exceeds the draft size limit. Original response retained.');
 const original=current?.sections||[];
 const used=new Set();
 const reserved=new Set(original.map(s=>s.id));
 let repaired=0;
 const sections=d.sections.map((s,i)=>{
  if(!s||typeof s.name!=='string'||typeof s.lyrics!=='string')throw new Error('Section '+(i+1)+' needs text name and lyrics fields. Original response retained in Response recovery.');
  let id=typeof s.id==='string'?s.id.trim():'';
  const matches=original.filter(o=>key(o.name)===key(s.name));
  // Unique names provide a stronger identity signal than model-generated IDs.
  if(matches.length===1&&!used.has(matches[0].id)) {
   if(id!==matches[0].id)repaired++;
   id=matches[0].id;
  }else{
   const namedOriginal=original.find(o=>o.id===id);
   // Never let a copied ID impersonate a different existing section.
   if(!id||used.has(id)||(namedOriginal&&key(namedOriginal.name)!==key(s.name))){
    let suffix=1;id='ai_section_'+(i+1);
    while(used.has(id)||reserved.has(id))id='ai_section_'+(i+1)+'_'+suffix++;
    repaired++;
   }
  }
  used.add(id);return {id,name:s.name,lyrics:s.lyrics};
 });
 if(sections.reduce((n,s)=>n+s.lyrics.length,0)>60000)throw new Error('Lyrics exceed the draft size limit. Original response retained.');
 if(repaired)warnings.push('Repaired '+repaired+' section identifier(s); lyric text was preserved.');
 return {title:d.title,style:d.style,sections};
}
export function protectDraft(current,draft,{style=false,title=false,sections=[]}={}) {
 const result=validateDraft(draft,current);
 if(style)result.style=current.style;if(title)result.title=current.title;
 const locked=new Set(sections);
 for(let i=0;i<current.sections.length;i++){
  const old=current.sections[i];if(!locked.has(old.id))continue;
  const match=result.sections.findIndex(s=>s.id===old.id);
  if(match>=0)result.sections[match]={...old};else result.sections.splice(Math.min(i,result.sections.length),0,{...old});
 }
 return result;
}
export function validateResult(v,current=null) {
 if(!v||typeof v.explanation!=='string'||!Array.isArray(v.alternatives)||v.alternatives.length>2)throw new Error('Response is not the expected revision package. Original output is available in Response recovery.');
 const warnings=[];
 const recommended=validateDraft(v.recommended,current,warnings);
 const alternatives=[];
 // A malformed optional alternative must not discard a good recommended draft.
 for(const a of v.alternatives){try{alternatives.push(validateDraft(a,current,warnings));}catch(e){warnings.push('An invalid optional alternative was skipped; the original remains in Response recovery.');}}
 return {explanation:v.explanation+(warnings.length?'\n\n'+[...new Set(warnings)].join('\n'):''),recommended,alternatives};
}
export function lyricView(d){return d.sections.map(s=>'['+s.name+']\n'+s.lyrics).join('\n\n');}
export function repetitionReport(song){const seen=new Map();for(const s of song.sections){for(const line of s.lyrics.split('\n')){const text=line.trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ');if(text.length<12)continue;const entry=seen.get(text)||{line:line.trim(),sections:[]};entry.sections.push(s.name);seen.set(text,entry);}}return [...seen.values()].filter(v=>v.sections.length>1);}
