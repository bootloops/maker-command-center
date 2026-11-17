export function mountProgressPanel(panel){
 const old=document.getElementById('mcc-generation-widget');if(old)old.remove();
 const widget=document.createElement('details');widget.id='mcc-generation-widget';widget.open=false;
 widget.style.cssText='position:fixed;top:12px;left:12px;z-index:160;width:min(390px,calc(100vw - 24px));max-height:55dvh;overflow:auto;background:var(--panel-solid,#111827);color:var(--text,#eee);border:1px solid var(--accent,#00e5ff);border-radius:12px;box-shadow:0 8px 30px #0007;';
 const summary=document.createElement('summary');summary.style.cssText='cursor:pointer;padding:10px 12px;font-size:.78rem;overflow-wrap:anywhere;';summary.textContent='Music generation running — expand';
 const short=document.createElement('span');short.setAttribute('role','status');short.setAttribute('aria-live','polite');summary.replaceChildren(short);
 const body=document.createElement('div');body.style.cssText='padding:0 10px 10px';
 panel.style.cssText='position:static;width:auto;max-height:none;margin:0;padding:8px;border:0;background:transparent;color:inherit;box-shadow:none;';
 panel.removeAttribute('role');panel.setAttribute('aria-label','Detailed generation progress');
 widget.append(summary,body);body.append(panel);document.body.append(widget);
 function update(){const label=panel.querySelector('div')?.textContent||'Music generation running';short.textContent=label+' · '+(widget.open?'collapse':'expand');}
 widget.addEventListener('toggle',update);
 let timer=setInterval(update,1000);update();
 const removal=new MutationObserver(()=>{if(!panel.isConnected){clearInterval(timer);removal.disconnect();widget.remove();}});removal.observe(document.body,{childList:true,subtree:true});
 return widget;
}
