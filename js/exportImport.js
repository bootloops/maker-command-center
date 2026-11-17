import {STORES,getAll,now} from './store.js';
import {toast} from './ui.js';
export async function exportData(){
 const data={schemaVersion:1,exportedAt:now(),app:'maker-command-center'};
 for(const store of STORES)data[store]=await getAll(store);
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='maker-command-center-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Full backup exported, including Music Studio');
}
export async function importData(file){
 if(!file)return;
 const data=JSON.parse(await file.text());
 if(data.app!=='maker-command-center'||data.schemaVersion!==1)throw new Error('Incompatible backup.');
 const stores=STORES.filter(s=>Object.prototype.hasOwnProperty.call(data,s));
 for(const store of stores){if(!Array.isArray(data[store]))throw new Error('Invalid collection: '+store);const ids=new Set();for(const r of data[store]){if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id))throw new Error('Invalid or duplicate record ID in '+store);ids.add(r.id);}}
 if(!stores.length)throw new Error('Backup contains no data collections.');
 if(!confirm('Replace collections contained in this backup? Export a current backup first. Older backups without Music Studio data will leave Music Studio unchanged.'))return;
 await new Promise((resolve,reject)=>{
 const req=indexedDB.open('maker-command-center');
 req.onerror=()=>reject(req.error);
 req.onsuccess=()=>{const db=req.result;let tx;try{tx=db.transaction(stores,'readwrite');for(const name of stores){const store=tx.objectStore(name);store.clear();for(const r of data[name])store.put(r);}}catch(e){if(tx)tx.abort();db.close();reject(e);return;}
 tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>{const e=tx.error||new Error('Import aborted; original data retained.');db.close();reject(e);};tx.onerror=()=>{};};
 });
 toast('Workspace imported');location.reload();
}
