import {installStudioUI} from './studio-ui.js';
// Preserve the actual partner node and closures; never rebuild the Studio or restart a request.
let retainedPartner=null,lastOpen=false,queued=false,repairing=false;
function capture(){const n=document.querySelector('#songwriter-dock .flow-partner')||document.querySelector('#studio .flow-partner');if(n)retainedPartner=n;const toggle=document.querySelector('#songwriter-dock .songwriter-dock-bar button');if(toggle)lastOpen=toggle.getAttribute('aria-expanded')==='true';}
function repair(){
 if(repairing)return;repairing=true;
 try{
  const root=document.getElementById('studio');if(!root)return;
  let dock=document.getElementById('songwriter-dock');
  const live=document.querySelector('.flow-partner');if(live)retainedPartner=live;
  if(!dock){
   if(retainedPartner&&!retainedPartner.isConnected)root.append(retainedPartner);
   installStudioUI();dock=document.getElementById('songwriter-dock');
   if(lastOpen){const toggle=dock?.querySelector('.songwriter-dock-bar button');if(toggle?.getAttribute('aria-expanded')!=='true')toggle?.click();}
  }
  if(dock){
   const body=document.getElementById('songwriter-dock-body');
   if(body&&retainedPartner&&!body.contains(retainedPartner))body.append(retainedPartner);
  }
  capture();
 }finally{repairing=false;}
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair();});}
function start(){capture();repair();
 // Only structural changes trigger repair; no model calls, timers or layout polling.
 const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('click',e=>{if(e.target.closest?.('#songwriter-dock .songwriter-dock-bar'))requestAnimationFrame(capture);});
 window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.source!=='mcc-host-013'||event.data.type!=='studio-visible')return;schedule();});
 window.addEventListener('pageshow',schedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
