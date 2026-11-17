export function normalizeBaseUrl(url){const value=(url||'').trim().replace(/\/+$/,'');return value||'http://localhost:11434'}
export async function listOllamaModels(baseUrl){const response=await fetch(`${normalizeBaseUrl(baseUrl)}/api/tags`);if(!response.ok)throw new Error(`Ollama responded ${response.status}`);const data=await response.json();return(data.models||[]).map(model=>({name:model.name,size:model.size,modifiedAt:model.modified_at,details:model.details||{}}))}
export async function chatWithOllama({baseUrl,model,messages,temperature=0.4,onToken}){const response=await fetch(`${normalizeBaseUrl(baseUrl)}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages,stream:true,options:{temperature}})});if(!response.ok){const text=await response.text().catch(()=>'');throw new Error(`Ollama request failed (${response.status}). ${text.slice(0,300)}`)}
if(!response.body)throw new Error('Streaming is not supported by this browser.');
const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';let full='';
while(true){const{value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()||'';
for(const line of lines){if(!line.trim())continue;try{const chunk=JSON.parse(line);const token=chunk?.message?.content||'';if(token){full+=token;onToken?.(token,full)}}catch{}}}
return full}
