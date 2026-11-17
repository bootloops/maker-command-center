import {attachMusicProgress} from './integration.js';
// MCC progress 013
// Music Studio streaming adapter: retains the fetch/Response interface used by patch 006.
export async function studioChat(url, init={}) {
 const controller=new AbortController();
 let cancelled=false, timedOut=false, completed=false, fragments='',events=0;
 const started=Date.now();
 const parentAbort=()=>{controller.abort();};
 if(init.signal?.aborted)controller.abort();
 else init.signal?.addEventListener('abort',parentAbort,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},20*60*1000);
 const panel=document.createElement('section');panel.setAttribute('role','status');
 panel.style.cssText='position:fixed;bottom:16px;right:16px;z-index:1000;width:min(440px,calc(100vw - 32px));padding:16px;border:1px solid var(--accent,#00e5ff);border-radius:12px;background:var(--panel-solid,#101520);color:var(--text,#eee);box-shadow:0 8px 32px #0008;';
 const label=document.createElement('div');
 const detail=document.createElement('small');detail.style.cssText='display:block;margin:8px 0;white-space:pre-wrap;overflow-wrap:anywhere;max-height:100px;overflow:auto;';
 const stop=document.createElement('button');stop.type='button';stop.textContent='Stop generation';stop.className='btn small';
 stop.onclick=()=>{cancelled=true;controller.abort();};
 panel.append(label,detail,stop);attachMusicProgress(panel);
 const tick=()=>{label.textContent=`${events?'Receiving model output':'Waiting for model / prompt processing'} · ${Math.floor((Date.now()-started)/1000)}s · ${fragments.length} characters received`;};
 tick();detail.textContent='First output may take time while Ollama loads the model and processes the prompt. No song edits are applied during generation.';
 const clock=setInterval(tick,1000);
 try{
  const payload=JSON.parse(init.body||'{}');
  payload.stream=true;
  payload.keep_alive=payload.keep_alive||'10m';
  payload.options={...payload.options,num_predict:payload.options?.num_predict??3072};
  const response=await fetch(url,{...init,body:JSON.stringify(payload),signal:controller.signal});
  if(!response.ok){const text=await response.text();throw new Error(`Ollama HTTP ${response.status}: ${text.slice(0,2000)||response.statusText}. Check Ollama's log for the corresponding request.`);}
  if(!response.body)throw new Error('This browser did not provide a streaming response body.');
  const reader=response.body.getReader(),decoder=new TextDecoder();let pending='';let final={};
  function consume(line){
   if(!line.trim())return;
   let chunk;try{chunk=JSON.parse(line);}catch{throw new Error('Ollama returned a malformed stream record. No AI edits were applied.');}
   if(chunk.error)throw new Error('Ollama: '+chunk.error);
   if(chunk.message?.content){fragments+=chunk.message.content;events++;detail.textContent=fragments.slice(-350);tick();}
   if(chunk.message?.thinking&&!fragments){events++;detail.textContent='Model reports reasoning activity; awaiting the final structured answer.';tick();}
   if(chunk.done){completed=true;final=chunk;}
  }
  while(true){const {value,done}=await reader.read();if(done)break;pending+=decoder.decode(value,{stream:true});let cut;while((cut=pending.indexOf('\n'))>=0){consume(pending.slice(0,cut));pending=pending.slice(cut+1);}}
  pending+=decoder.decode();if(pending.trim())consume(pending);
  if(!completed)throw new Error('Ollama connection ended before the completion marker. No AI edits were applied.');
  if(final.done_reason==='length')throw new Error('The model reached the 3072-token response limit before completion. Request one section or fewer alternatives, then retry. No AI edits were applied.');
  if(!fragments.trim())throw new Error('Ollama completed without returning response text. Try a simpler request or another installed model.');
  return new Response(JSON.stringify({...final,message:{role:'assistant',content:fragments}}),{status:200,headers:{'Content-Type':'application/json'}});
 }catch(error){
  if(cancelled)throw new Error('Generation stopped by you. No proposed edits were applied.');
  if(timedOut)throw new Error('Generation exceeded the 20-minute client limit. Try one section, fewer alternatives, or a smaller model. Check the Ollama log for server errors.');
  if(error?.name==='AbortError'||controller.signal.aborted)throw new Error('The request was cancelled or its outer timeout elapsed. No proposed edits were applied. Check whether the tab was reloaded or the request exceeded 20 minutes.');
  throw error;
 }finally{
  clearTimeout(timer);clearInterval(clock);init.signal?.removeEventListener('abort',parentAbort);panel.remove();
 }
}
