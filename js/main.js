import './music/integration.js';
import { initDB, getSettings } from './store.js';
import { renderRoute } from './router.js';
import { openProjectForm } from './features/projects.js';
import { openIdeaForm } from './features/ideas.js';
async function updateAiStatus(){const s=await getSettings();const n=document.getElementById('aiStatus');if(n)n.textContent=s.ai?.model?'AI: '+s.ai.model:'AI: not configured';}
async function start(){await initDB();const settings=await getSettings();document.documentElement.dataset.theme=settings.theme||'cyberpunk';await updateAiStatus();
 const nav=document.querySelector('.nav');if(nav&&!document.getElementById('musicStudioLink')){const a=document.createElement('a');a.id='musicStudioLink';a.href='./music-studio.html';a.textContent='Music Studio';nav.append(a);}
 const sidebar=document.getElementById('sidebar'),menu=document.getElementById('menuButton');const close=()=>{sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');};
 menu.addEventListener('click',e=>{e.stopPropagation();const open=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
 document.addEventListener('click',e=>{if(sidebar.classList.contains('open')&&!sidebar.contains(e.target)&&!menu.contains(e.target))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',close));
 window.addEventListener('hashchange',()=>{close();renderRoute().catch(console.error);});
 document.getElementById('newProjectButton').addEventListener('click',()=>openProjectForm(null,()=>{renderRoute();updateAiStatus();}));
 document.getElementById('quickCapture').addEventListener('click',()=>openIdeaForm(null,renderRoute));
 const search=document.getElementById('globalSearch');search.addEventListener('keydown',e=>{if(e.key==='Enter')location.hash='#/search?q='+encodeURIComponent(search.value.trim());});
 if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
 await renderRoute();}
start().catch(e=>{console.error(e);const view=document.getElementById('view');if(view)view.textContent='Could not open workspace: '+e.message;});
