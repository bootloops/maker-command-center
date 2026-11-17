import {mountProgressPanel} from './progress-panel.js';
// MCC top-left progress 015
import {getAll} from '../store.js';
const isStudio=/\/music-studio\.html$/.test(location.pathname);
const embedded=isStudio&&window.parent!==window&&new URLSearchParams(location.search).get('embedded')==='1';
let frame=null,job=null,completion=null,lastSent=0;
const origin=location.origin;
function node(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;}
function send(type,data={}){if(embedded)parent.postMessage({source:'mcc-music-013',type,...data},origin);}
export function finishMusicJob(state,message){
 const data={state,message:message|| (state==='complete'?'Music revision ready':'Music generation needs attention'),at:Date.now()};
 if(embedded)send('job',data);else showLocalCompletion(data);
}
function showLocalCompletion(data){let n=document.getElementById('music-local-notice');if(!n){n=node('div');n.id='music-local-notice';document.body.append(n);}n.textContent=data.message;}
export function attachMusicProgress(panel){
 mountProgressPanel(panel);
 const update=()=>{if(Date.now()-lastSent<700)return;lastSent=Date.now();send('job',{state:'running',message:panel.querySelector('div')?.textContent||'Music generation running',at:Date.now()});};
 send('job',{state:'running',message:'Music generation started',at:Date.now()});
 const observer=new MutationObserver(update);observer.observe(panel,{childList:true,subtree:true,characterData:true});
 const removal=new MutationObserver(()=>{if(!panel.isConnected){observer.disconnect();removal.disconnect();send('job',{state:'processing',message:'Checking and saving the music response…',at:Date.now()});}});removal.observe(document.body,{childList:true,subtree:true});
}
function injectStyles(){if(document.getElementById('music-integration-style'))return;const s=node('style');s.id='music-integration-style';s.textContent=`
#mcc-studio-frame{display:block;width:100%;height:calc(100dvh - 78px);border:0;background:var(--bg);min-height:400px}#mcc-studio-frame[hidden]{display:none!important}.mcc-music-banner{border:1px solid var(--line);border-radius:9px;padding:8px 12px;background:var(--panel-solid);font-size:.8rem;display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 14px}.mcc-music-banner[hidden]{display:none!important}.mcc-music-banner button{font:inherit;padding:5px 9px;background:transparent;color:var(--accent);border:1px solid var(--line);border-radius:7px;cursor:pointer}.music-dashboard-card{margin-top:18px}.music-dashboard-card .music-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px;border-bottom:1px solid var(--line)}.music-dashboard-card .music-row a{overflow-wrap:anywhere}.music-dashboard-card select{width:auto;max-width:100%}.music-dashboard-card small{color:var(--muted);display:block}#music-generation-progress small{max-height:75px!important}#music-generation-progress{flex:none;max-height:170px;overflow:auto}#music-local-notice{padding:10px 16px;color:var(--accent)}
`;document.head.append(s);}
function startStudioBridge(){injectStyles();
 if(!embedded){
  // Future Studio visits use the persistent host. Do not interrupt an existing loaded page.
  const link=node('a','Open integrated Command Center');link.href='./index.html#/music';link.style.cssText='display:block;padding:8px 20px;font-size:.8rem';document.querySelector('.studio-top')?.append(link);
  return;
 }
 document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||a.target==='_blank')return;const u=new URL(a.href,location.href);if(u.origin===origin&&/\/index\.html$/.test(u.pathname)){e.preventDefault();send('navigate',{hash:u.hash||'#/'});}},true);
 send('ready');

}
function startMain(){injectStyles();const main=document.querySelector('.main'),view=document.getElementById('view');if(!main||!view)return;
 const banner=node('div');banner.className='mcc-music-banner';banner.hidden=true;main.insertBefore(banner,view);
 let pendingSong=null,ready=false,sort='newest',lastFingerprint='',polling=false;
 function showBanner(){banner.replaceChildren();if(!job&&!completion){banner.hidden=true;return;}banner.hidden=false;const item=job||completion;banner.append(node('span',item.message));const open=node('button',job?'Open Music Studio':'View result');open.onclick=()=>{location.hash='#/music';};banner.append(open);if(!job){const dismiss=node('button','Dismiss');dismiss.onclick=()=>{completion=null;showBanner();};banner.append(dismiss);}}
 function openSong(id){pendingSong=id;location.hash='#/music';sync();}
 function sync(){const music=(location.hash.split('?')[0]==='#/music');
  if(music&&!frame){frame=document.createElement('iframe');frame.id='mcc-studio-frame';frame.title='Music Studio';frame.src='./music-studio.html?embedded=1';main.append(frame);}
  if(frame){frame.hidden=!music;if(music&&ready)frame.contentWindow.postMessage({source:'mcc-host-013',type:'studio-visible'},origin);}
  view.style.display=music?'none':'';
  document.querySelectorAll('.nav a').forEach(a=>{if(a.id==='musicStudioLink')a.classList.toggle('active',music);});
  if(music&&pendingSong&&ready){frame.contentWindow.postMessage({source:'mcc-host-013',type:'select-song',id:pendingSong},origin);pendingSong=null;}
  showBanner();refreshMusic();
 }
 document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||a.target==='_blank')return;const u=new URL(a.href,location.href);if(u.origin===origin&&/\/music-studio\.html$/.test(u.pathname)){e.preventDefault();e.stopPropagation();location.hash='#/music';sync();}},true);
 window.addEventListener('message',e=>{if(e.origin!==origin||!frame||e.source!==frame.contentWindow||e.data?.source!=='mcc-music-013')return;const data=e.data;
  if(data.type==='ready'){ready=true;sync();}
  if(data.type==='navigate'){const hash=String(data.hash||'#/');if(hash.startsWith('#/'))location.hash=hash;}
  if(data.type==='job'){
   if(data.state==='running'||data.state==='processing'){job={state:data.state,message:String(data.message||'Music generation running')};completion=null;}
   else {job=null;completion={state:data.state,message:String(data.message||'Music request finished')};lastFingerprint='';}
   showBanner();refreshMusic();
  }
 });
 window.addEventListener('beforeunload',e=>{if(job){e.preventDefault();e.returnValue='';}});
 window.addEventListener('hashchange',()=>{requestAnimationFrame(sync);});
 async function refreshMusic(){
  const hash=location.hash||'#/';if(!['#/','#',''].includes(hash)&&!hash.startsWith('#/ai'))return;if(polling)return;polling=true;
  try{
   const songs=(await getAll('meta')).filter(s=>s.id.startsWith('music:song:'));
   if((location.hash||'#/')!==hash)return;
   songs.sort((a,b)=>sort==='name'?String(a.title).localeCompare(String(b.title)):sort==='activity'?new Date(b.updatedAt||b.createdAt)-new Date(a.updatedAt||a.createdAt):new Date(b.createdAt||b.updatedAt)-new Date(a.createdAt||a.updatedAt));
   const key=JSON.stringify({hash,sort,songs:songs.map(s=>[s.id,s.title,s.updatedAt,s.createdAt])});
   let card=view.querySelector('.music-dashboard-card');if(card&&lastFingerprint===key)return;
   if(!card){card=node('section');card.className='card music-dashboard-card';view.append(card);}card.replaceChildren();lastFingerprint=key;
   card.append(node('h2','Music projects'));
   const sub=node('p','Your saved Music Studio songs. Newest created first by default.');sub.className='item-meta';card.append(sub);
   const controls=node('div');controls.className='row';const order=node('select');order.setAttribute('aria-label','Sort music projects');for(const [value,label]of [['newest','Newest created'],['activity','Recently edited'],['name','Title A–Z']])order.append(new Option(label,value));order.value=sort;order.onchange=()=>{sort=order.value;lastFingerprint='';refreshMusic();};
   const open=node('button','Open Music Studio');open.className='btn small';open.onclick=()=>{location.hash='#/music';sync();};controls.append(order,open);card.append(controls);
   if(!songs.length)card.append(node('p','No songs yet. Open Music Studio to start one.'));
   for(const s of songs){const row=node('div');row.className='music-row';const text=node('div');const a=node('a',s.title||'Untitled song');a.href='#/music';a.onclick=e=>{e.preventDefault();openSong(s.id);};text.append(a,node('small','Created '+new Date(s.createdAt||s.updatedAt).toLocaleString()+' · Edited '+new Date(s.updatedAt||s.createdAt).toLocaleString()));row.append(text);card.append(row);}
  }catch(e){/* Store initialization may not be finished when the module first loads. */}
  finally{polling=false;}
 }
 const observer=new MutationObserver(()=>{requestAnimationFrame(()=>{if(location.hash==='#/music')view.style.display='none';refreshMusic();});});observer.observe(view,{childList:true});
 setInterval(refreshMusic,5000);sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>isStudio?startStudioBridge():startMain(),{once:true});else if(isStudio)startStudioBridge();else startMain();
