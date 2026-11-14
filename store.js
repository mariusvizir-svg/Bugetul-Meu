'use strict';
/* Bugetul Meu — stocare sigură: IndexedDB + copie localStorage, sumă de control,
   instantanee zilnice, criptare AES-256-GCM cu parolă și blocare Face ID (WebAuthn). */
const Store=(()=>{
const KEY='bugetul-meu-v1',MK=KEY+'.meta',SK='bm-sec',DBN='bugetul-meu',TE=new TextEncoder(),TD=new TextDecoder();
let db=null,key=null,sec={mode:'none',lockAfter:60},ref=null,q=Promise.resolve(),notes=[],persisted=null,hiddenAt=0;
const b64=u=>{let s='';new Uint8Array(u).forEach(c=>s+=String.fromCharCode(c));return btoa(s)},ub=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),rnd=n=>crypto.getRandomValues(new Uint8Array(n));
const sha=async s=>b64(await crypto.subtle.digest('SHA-256',TE.encode(s)));
const pk=pw=>crypto.subtle.importKey('raw',TE.encode(pw),'PBKDF2',false,['deriveKey','deriveBits']);
const aes=async(pw,salt,it)=>crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:it,hash:'SHA-256'},await pk(pw),{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
const vh=async(pw,salt)=>b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},await pk(pw),256));
/* ---- IndexedDB ---- */
const open=()=>new Promise(r=>{const tm=setTimeout(()=>r(null),4000);const done=v=>{clearTimeout(tm);r(v)};try{const q=indexedDB.open(DBN,1);q.onupgradeneeded=()=>{q.result.createObjectStore('kv');q.result.createObjectStore('snap')};q.onsuccess=()=>done(q.result);q.onerror=q.onblocked=()=>done(null)}catch{done(null)}});
const run=(st,mode,fn)=>new Promise((res,rej)=>{if(!db)return res(null);try{const t=db.transaction(st,mode),r=fn(t.objectStore(st));t.oncomplete=()=>res(r&&r.result!==undefined?r.result:null);t.onerror=t.onabort=()=>rej(t.error||new Error('IndexedDB'))}catch(e){rej(e)}});
const get=(s,k)=>run(s,'readonly',o=>o.get(k)),put=(s,k,v)=>run(s,'readwrite',o=>o.put(v,k)),del=(s,k)=>run(s,'readwrite',o=>o.delete(k)),all=s=>run(s,'readonly',o=>o.getAll()).then(x=>x||[]);
/* ---- plic (envelope) ---- */
const pack=async(json,at=Date.now())=>{if(sec.mode==='pass'){if(!key)throw new Error('Aplicația este blocată');const iv=rnd(12),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,TE.encode(json));return{enc:1,savedAt:at,iv:b64(iv),ct:b64(ct)}}return{v:1,savedAt:at,hash:await sha(json),json}};
const unpack=async env=>{if(!env)return null;if(env.enc){if(!key)throw new Error('locked');const p=await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(env.iv)},key,ub(env.ct));return{json:TD.decode(p),savedAt:env.savedAt}}if(env.json!==undefined){if(env.hash&&await sha(env.json)!==env.hash)throw new Error('hash');return{json:env.json,savedAt:env.savedAt}}return null};
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
/* ---- instantanee ---- */
const snap=async(env,label)=>{if(!db)return;const k=label?'m'+Date.now():today();if(!label&&await get('snap',k))return;await put('snap',k,{k,savedAt:env.savedAt,label:label||'automat',n:env.n,env});const l=(await all('snap')).sort((a,b)=>b.savedAt-a.savedAt);for(const s of l.slice(20))await del('snap',s.k)};
const snapNow=async(label,data)=>{const env=await pack(JSON.stringify(data));env.n=(data.transactions||[]).length;await snap(env,label)};
const wipeSnaps=async()=>{if(!db)return;for(const s of await all('snap'))await del('snap',s.k)};
/* ---- scriere ---- */
const write=async data=>{const json=JSON.stringify(data),at=Date.now();let le=null,ie=null;
 if(sec.mode!=='pass'){try{localStorage.setItem(KEY,json);localStorage.setItem(MK,JSON.stringify({savedAt:at,hash:null}))}catch(e){le=e}}
 const env=await pack(json,at);env.n=(data.transactions||[]).length;
 if(sec.mode==='pass'){try{localStorage.setItem(KEY,JSON.stringify(env));localStorage.setItem(MK,JSON.stringify({savedAt:at,hash:null}))}catch(e){le=e}}
 else{try{localStorage.setItem(MK,JSON.stringify({savedAt:at,hash:env.hash}))}catch{}}
 try{await put('kv','data',env)}catch(e){ie=e}
 if(!db)ie=ie||new Error('IndexedDB indisponibil');
 if(le&&ie)throw new Error('Salvarea a eșuat în ambele locuri');
 try{await snap(env)}catch{}
 return env};
const save=data=>{ref=data;const p=q.then(()=>write(data));q=p.catch(()=>{});return p};
const saveSec=async()=>{try{localStorage.setItem(SK,JSON.stringify(sec))}catch{}try{await put('kv','sec',sec)}catch{}};
/* ---- citire ---- */
const readCands=async()=>{const c=[];try{const e=await get('kv','data');if(e)c.push({src:'IndexedDB',env:e})}catch{}
 try{const raw=localStorage.getItem(KEY);if(raw){const j=JSON.parse(raw),m=JSON.parse(localStorage.getItem(MK)||'null')||{};c.push({src:'localStorage',env:(j.enc||j.json!==undefined)&&!Array.isArray(j.transactions)?j:{v:1,savedAt:m.savedAt||0,json:raw}})}}catch{c.push({src:'localStorage',env:null,bad:1})}
 return c};
const pick=async c=>{const ok=[];for(const x of c){try{const u=await unpack(x.env);if(!u)throw new Error('gol');const d=JSON.parse(u.json);if(!d||!Array.isArray(d.transactions))throw new Error('format');ok.push({...x,u,d})}catch(e){notes.push(x.src+': '+(e.message==='hash'?'copie coruptă (suma de control diferă)':'copie ilizibilă'))}}return ok.sort((a,b)=>b.u.savedAt-a.u.savedAt)};
const fromSnap=async()=>{if(!db)return null;for(const s of (await all('snap')).sort((a,b)=>b.savedAt-a.savedAt)){if(String(s.label).startsWith('corupt'))continue;try{const u=await unpack(s.env),d=JSON.parse(u.json);if(Array.isArray(d.transactions))return{d,k:new Date(s.savedAt).toLocaleString('ro-RO')}}catch{}}return null};
/* ---- ecran de blocare ---- */
const faceAuth=async()=>{if(!navigator.credentials)throw new Error('WebAuthn indisponibil (necesită HTTPS)');await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{id:ub(sec.cred),type:'public-key',transports:['internal']}],userVerification:'required',rpId:location.hostname,timeout:60000}});return true};
const lockScreen=(verify,face)=>new Promise(res=>{let o=document.getElementById('lock');if(!o){o=document.createElement('div');o.id='lock';document.body.append(o)}
 o.innerHTML=`<div class="lockbox"><div class="lockico">🔒</div><h2>Bugetul Meu</h2><p>${face?'Folosește Face ID sau introdu parola de rezervă':'Introdu parola pentru a deschide aplicația'}</p>${face?'<button class="btn" id="lface">Deblochează cu Face ID</button>':''}<input type="password" id="lpw" autocomplete="current-password" placeholder="Parolă"><div class="lerr" id="lerr"></div><button class="btn ${face?'s':''}" id="lgo">Deblochează cu parola</button></div>`;
 const err=m=>o.querySelector('#lerr').textContent=m,go=async fn=>{try{if(await fn()){o.remove();res()}else err('Parolă greșită.')}catch(e){err('Nu a mers: '+(e.message||e))}};
 o.querySelector('#lgo').onclick=()=>go(()=>verify(o.querySelector('#lpw').value));o.querySelector('#lpw').onkeydown=e=>{if(e.key==='Enter')o.querySelector('#lgo').click()};
 const f=o.querySelector('#lface');if(f)f.onclick=()=>go(faceAuth);setTimeout(()=>o.querySelector(face?'#lface':'#lpw').focus(),60)});
const checkPw=async pw=>(await vh(pw,ub(sec.vsalt)))===sec.vh;
const unlockInitial=()=>lockScreen(async pw=>{if(!await checkPw(pw))return false;if(sec.mode==='pass')key=await aes(pw,ub(sec.salt),sec.it);return true},sec.mode==='face');
const lock=()=>{if(sec.mode==='none'||document.getElementById('lock'))return Promise.resolve();return lockScreen(checkPw,sec.mode==='face')};
document.addEventListener('visibilitychange',()=>{if(sec.mode==='none')return;if(document.hidden){hiddenAt=Date.now();if(sec.lockAfter===0)lock()}else if(sec.lockAfter>=0&&hiddenAt&&Date.now()-hiddenAt>=sec.lockAfter*1000)lock()});
/* ---- pornire ---- */
const boot=async()=>{db=await open();
 try{sec=JSON.parse(localStorage.getItem(SK)||'null')||(db&&await get('kv','sec'))||sec}catch{}
 sec={lockAfter:60,...sec};
 if(sec.mode!=='none')await unlockInitial();
 const c=await readCands(),ok=await pick(c);let data={};
 if(ok.length){data=ok[0].d;if(ok.length>1&&Math.abs(ok[0].u.savedAt-ok[1].u.savedAt)>2000)notes.push('Copiile aveau versiuni diferite; am folosit '+ok[0].src+' (cea mai recentă).');if(!db)notes.push('IndexedDB indisponibil: datele se păstrează doar în localStorage.')}
 else{if(db)for(const x of c)if(x.env)try{await put('snap','c'+Date.now()+x.src,{k:'c'+Date.now()+x.src,savedAt:Date.now(),label:'corupt-'+x.src,n:0,env:x.env})}catch{}
  const r=await fromSnap();if(r){data=r.d;notes.push('Datele principale erau corupte sau lipseau. Am recuperat din instantaneul '+r.k+'.')}else if(c.length)notes.push('Datele salvate nu pot fi citite. Importă un backup din Setări.')}
 window.__DATA__=data;
 try{persisted=navigator.storage&&navigator.storage.persist?await Promise.race([navigator.storage.persist(),new Promise(r=>setTimeout(()=>r(null),3000))]):null}catch{}
 ref=data;if(Array.isArray(data.transactions))try{await save(data)}catch(e){notes.push('Salvare inițială eșuată: '+e.message)}};
const init=async()=>{try{await boot()}catch(e){notes.push('Pornire: '+e.message);if(!window.__DATA__)try{window.__DATA__=JSON.parse(localStorage.getItem(KEY))||{}}catch{window.__DATA__={}}}};
/* ---- API ---- */
const enablePass=async pw=>{const salt=rnd(16),vs=rnd(16),it=250000;key=await aes(pw,salt,it);sec={...sec,mode:'pass',salt:b64(salt),it,vsalt:b64(vs),vh:await vh(pw,vs),cred:undefined};await saveSec();await wipeSnaps();await write(ref)};
const enableFace=async pw=>{if(!navigator.credentials||!window.PublicKeyCredential)throw new Error('Face ID necesită HTTPS și iOS 16 sau mai nou.');
 const c=await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'Bugetul Meu',id:location.hostname},user:{id:rnd(16),name:'bugetul-meu',displayName:'Bugetul Meu'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'preferred'},timeout:60000,attestation:'none'}});
 const vs=rnd(16);key=null;sec={...sec,mode:'face',cred:b64(c.rawId),vsalt:b64(vs),vh:await vh(pw,vs),salt:undefined,it:undefined};await saveSec();await wipeSnaps();await write(ref)};
const disable=async()=>{key=null;sec={lockAfter:sec.lockAfter,mode:'none'};await saveSec();await wipeSnaps();await write(ref)};
const changePass=async(old,nw)=>{if(!await checkPw(old))throw new Error('Parola veche este greșită');await enablePass(nw)};
const list=async()=>(await all('snap')).sort((a,b)=>b.savedAt-a.savedAt).map(s=>({k:s.k,savedAt:s.savedAt,label:s.label,n:s.n,enc:!!(s.env&&s.env.enc)}));
const restore=async k=>{const s=await get('snap',k);if(!s)throw new Error('Instantaneul nu există');const u=await unpack(s.env),d=JSON.parse(u.json);await snapNow('înainte de restaurare',ref);await write(d);return d};
const replace=async obj=>{await snapNow('înainte de import',ref);await write(obj);ref=obj};
const estimate=async()=>{let e={};try{e=navigator.storage&&navigator.storage.estimate?await navigator.storage.estimate():{}}catch{}let p=null;try{p=navigator.storage&&navigator.storage.persisted?await navigator.storage.persisted():null}catch{}return{usage:e.usage||0,quota:e.quota||0,persisted:p}};
const health=async()=>{const r=[],add=(ok,l,d)=>r.push({ok,l,d});
 add(window.isSecureContext,'Context securizat (HTTPS)',window.isSecureContext?'da':'nu: criptarea și Face ID nu funcționează');
 add(!!db,'IndexedDB disponibil',db?'da':'indisponibil, se folosește doar localStorage');
 if(db)try{const t=String(Date.now());await put('kv','_t',t);const g=await get('kv','_t');await del('kv','_t');add(g===t,'Test scriere/citire IndexedDB',g===t?'reușit':'valori diferite')}catch(e){add(false,'Test scriere/citire IndexedDB',e.message)}
 try{const t='x'+Date.now();localStorage.setItem('_t',t);const o=localStorage.getItem('_t')===t;localStorage.removeItem('_t');add(o,'Test scriere/citire localStorage',o?'reușit':'eșuat')}catch(e){add(false,'localStorage',e.message)}
 const c=await readCands(),before=notes.length,ok=await pick(c);notes.length=before;
 add(c.length>0&&ok.length===c.length,'Integritate copii salvate',c.map(x=>x.src+': '+(ok.find(o=>o.src===x.src)?'ok':'PROBLEMĂ')).join(' · ')||'nicio copie');
 if(ok.length===2)add(ok[0].u.json===ok[1].u.json,'Cele două copii coincid',ok[0].u.json===ok[1].u.json?'identice':'diferă ușor, se va folosi cea mai recentă');
 if(ref&&ok.length){const n=ok[0].d.transactions.length;add(n===(ref.transactions||[]).length,'Salvat = în aplicație',n+' operațiuni salvate, '+(ref.transactions||[]).length+' în aplicație')}
 const e=await estimate();add(e.persisted===true?true:null,'Stocare persistentă',e.persisted===true?'da':'nu: pe iPhone adaugă aplicația pe ecranul principal');
 add(true,'Spațiu folosit',(e.usage/1024).toFixed(0)+' KB'+(e.quota?' din '+(e.quota/1048576).toFixed(0)+' MB':''));
 const s=await list();add(s.length>0?true:null,'Instantanee automate',s.length?s.length+' (ultimul: '+new Date(s[0].savedAt).toLocaleString('ro-RO')+')':'niciunul încă');
 return r};
return{init,save,lock,enablePass,enableFace,disable,changePass,list,restore,replace,estimate,health,
 snapshot:snapNow,persist:async()=>{try{return await navigator.storage.persist()}catch{return false}},
 getSec:()=>({mode:sec.mode,lockAfter:sec.lockAfter}),setLockAfter:async n=>{sec.lockAfter=n;await saveSec()},notes:()=>notes.slice()}})();
