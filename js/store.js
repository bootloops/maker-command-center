const DB_NAME='maker-command-center';const DB_VERSION=1;
export const STORES=['projects','tasks','ideas','builds','testLogs','parts','references','aiThreads','settings','meta'];
let db;
export function uid(prefix='id'){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`}
export function now(){return new Date().toISOString()}
export function initDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const database=request.result;for(const store of STORES){if(!database.objectStoreNames.contains(store))database.createObjectStore(store,{keyPath:'id'})}};request.onsuccess=()=>{db=request.result;resolve(db)};request.onerror=()=>reject(request.error)})}
function tx(store,mode='readonly'){if(!db)throw new Error('Database is not initialized');return db.transaction(store,mode).objectStore(store)}
export function getAll(store){return new Promise((resolve,reject)=>{const request=tx(store).getAll();request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>reject(request.error)})}
export function get(store,id){return new Promise((resolve,reject)=>{const request=tx(store).get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error)})}
export function put(store,value){return new Promise((resolve,reject)=>{const record={...value,updatedAt:now()};const request=tx(store,'readwrite').put(record);request.onsuccess=()=>resolve(record);request.onerror=()=>reject(request.error)})}
export function remove(store,id){return new Promise((resolve,reject)=>{const request=tx(store,'readwrite').delete(id);request.onsuccess=()=>resolve(true);request.onerror=()=>reject(request.error)})}
export function clearStore(store){return new Promise((resolve,reject)=>{const request=tx(store,'readwrite').clear();request.onsuccess=()=>resolve(true);request.onerror=()=>reject(request.error)})}
export async function getSettings(){const settings=await get('settings','app');return settings||{id:'app',theme:'cyberpunk',ai:{provider:'ollama',baseUrl:'http://localhost:11434',model:'',temperature:0.4,systemPrompt:'You are a practical maker and engineering partner. Be concise, specific, safety-aware, and action-oriented. Prefer testable next steps over vague advice.',allowAutoActions:false}}}
export async function saveSettings(settings){return put('settings',{...settings,id:'app'})}
