'use strict';
/* V29–V31: Scanare bonuri — poză → decupare → citire text pe telefon (Tesseract, limba română) →
   produse încadrate pe categoriile tale → salvare pe categorii. Venit/transfer din chitanța de la bancă.
   Ce corectezi la categorii se ține minte în data.scanner.learn. */
data.scanner={learn:{},...(data.scanner||{})};
const SC=(()=>{
const P=window.BonParser;
let S={step:'start',tip:'expense'},worker=null,workerP=null,tessP=null;
const reset=()=>{S={step:'start',tip:S.tip||'expense'}};

/* ---------- categorii: cheile cititorului -> categoriile tale ---------- */
const nrm=s=>P.norm(s).replace(/[^A-Z]/g,'');
const PREF={alimente:['Alimente','Mâncare'],bauturi:['Băuturi','Bauturi','Mâncare'],casa:['Cumpărături casă','Casă','Curățenie'],igiena:['Igienă','Igienă și cosmetice','Cosmetice','Cumpărături casă'],
 sanatate:['Sănătate','Farmacie'],masina:['Mașină','Carburant','Benzină','Transport'],restaurant:['Restaurant','Cafea','Ieșiri și distracție'],haine:['Îmbrăcăminte','Haine'],
 animale:['Animale','Altele'],electronice:['Electronice','Cumpărături casă'],tutun:['Țigări','Tutun','Altele'],altele:['Altele']};
const mapCat=k=>{const cs=expCats(),by=Object.fromEntries(cs.map(c=>[nrm(c),c]));for(const p of PREF[k]||['Altele']){if(by[nrm(p)])return by[nrm(p)]}return cs.includes('Altele')?'Altele':cs[cs.length-1]};
const catOf=(name,storeKey)=>{const r=P.incadreaza(name,data.scanner.learn,storeKey);return{cat:r.sursa==='invatat'&&expCats().includes(r.categorie)?r.categorie:mapCat(r.sursa==='invatat'?'altele':r.categorie),src:r.sursa}};

/* ---------- OCR (încărcat doar la prima scanare) ---------- */
const base=()=>location.href.replace(/[^/]*([?#].*)?$/,'');
const loadTess=()=>tessP||(tessP=new Promise((ok,no)=>{if(window.Tesseract)return ok();const s=document.createElement('script');s.src='tesseract.min.js';s.onload=ok;s.onerror=()=>{tessP=null;no(new Error('Nu am putut încărca cititorul de text'))};document.head.append(s)}));
const simd=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]))}catch{return false}};
const prog=(p,m)=>{S.prog=p;if(m)S.msg=m;const b=$('scBar');if(b)b.style.width=Math.round(p*100)+'%';const t=$('scMsg');if(t&&m)t.textContent=m};
const getWorker=()=>workerP||(workerP=loadTess().then(()=>Tesseract.createWorker('ron',1,{workerPath:base()+'worker.min.js',corePath:base()+(simd()?'tesseract-core-simd-lstm.wasm.js':'tesseract-core-lstm.wasm.js'),langPath:base().replace(/\/$/,''),gzip:false,workerBlobURL:false,
 logger:m=>{if(m.status==='recognizing text')prog(S.pas+m.progress*(S.pasL||.7),'Citesc textul… '+Math.round(m.progress*100)+'%');else if(/load|init/.test(m.status))prog(.05+(m.progress||0)*.2,'Pregătesc cititorul de text…')}}))
 .then(w=>w.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'}).then(()=>worker=w)).catch(e=>{workerP=null;throw e}));

/* ---------- imagine ---------- */
const loadImg=f=>new Promise((ok,no)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{const mx=2400,s=Math.min(1,mx/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*s);c.height=Math.round(im.naturalHeight*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c)};im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('Poza nu poate fi deschisă'))};im.src=u});
const rotate=c=>{const r=document.createElement('canvas');r.width=c.height;r.height=c.width;const x=r.getContext('2d');x.translate(r.width,0);x.rotate(Math.PI/2);x.drawImage(c,0,0);return r};
const gray=(c,W)=>{const s=W/c.width,w=Math.max(1,Math.round(c.width*s)),h=Math.max(1,Math.round(c.height*s)),t=document.createElement('canvas');t.width=w;t.height=h;const x=t.getContext('2d',{willReadFrequently:true});x.drawImage(c,0,0,w,h);const d=x.getImageData(0,0,w,h).data,g=new Float32Array(w*h);for(let i=0,j=0;j<w*h;i+=4,j++)g[j]=(d[i]*299+d[i+1]*587+d[i+2]*114)/1000;return{w,h,g}};
// propunere de chenar: 1) hârtia = zona mare, deschisă și fără culoare (bonul pe masă, pe lemn etc.);
// 2) dacă nu se distinge (fundal la fel de deschis), unde sunt muchii clare de litere
const paperCrop=c=>{const s=200/Math.max(c.width,c.height),w=Math.max(1,Math.round(c.width*s)),h=Math.max(1,Math.round(c.height*s)),t=document.createElement('canvas');t.width=w;t.height=h;const x=t.getContext('2d',{willReadFrequently:true});x.drawImage(c,0,0,w,h);const d=x.getImageData(0,0,w,h).data,m=new Uint8Array(w*h);
 for(let i=0,j=0;j<w*h;i+=4,j++){const mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);m[j]=mx>110&&(mx-mn)/Math.max(mx,1)<.22?1:0}
 const lab=new Int32Array(w*h),q=new Int32Array(w*h);let best=null,cur=0;
 for(let j=0;j<w*h;j++){if(!m[j]||lab[j])continue;cur++;let a=0,b=0,n=0,x0=w,x1=0,y0=h,y1=0;q[b++]=j;lab[j]=cur;
  while(a<b){const k=q[a++],yy=(k/w)|0,xx=k-yy*w;n++;if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(yy<y0)y0=yy;if(yy>y1)y1=yy;
   for(const nb of[xx>0?k-1:-1,xx<w-1?k+1:-1,yy>0?k-w:-1,yy<h-1?k+w:-1])if(nb>=0&&m[nb]&&!lab[nb]){lab[nb]=cur;q[b++]=nb}}
  if(!best||n>best.n)best={n,x0,x1,y0,y1}}
 if(!best)return null;const ar=(best.x1-best.x0+1)*(best.y1-best.y0+1)/(w*h);if(ar<.06||ar>.9)return null;const p=2;
 return{x0:Math.max(0,best.x0-p)/w,y0:Math.max(0,best.y0-p)/h,x1:Math.min(w,best.x1+1+p)/w,y1:Math.min(h,best.y1+1+p)/h}};
const autoCrop=c=>paperCrop(c)||edgeCrop(c);
const edgeCrop=c=>{const W=400/Math.max(c.width,c.height)*c.width,{w,h,g}=gray(c,Math.max(40,Math.round(W)));const col=new Float32Array(w),e=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w-1;x++){const v=Math.abs(g[y*w+x+1]-g[y*w+x])>40?1:0;e[y*w+x]=v;col[x]+=v}
 const span=(v,fr,gap)=>{const n=v.length,k=new Float32Array(n);for(let i=0;i<n;i++){let s=0,c2=0;for(let j=Math.max(0,i-2);j<=Math.min(n-1,i+2);j++){s+=v[j];c2++}k[i]=s/c2}const m=Math.max(...k);if(!m)return[0,n-1];const on=[...k].map(x=>x>m*fr);let best=null,i=0;
  while(i<n){if(on[i]){let j=i;while(j+1<n&&(on[j+1]||on.slice(j+1,j+1+gap).some(Boolean)))j++;let s=0;for(let q=i;q<=j;q++)s+=k[q];if(!best||s>best[2])best=[i,j,s];i=j+1}else i++}return best?[best[0],best[1]]:[0,n-1]};
 const[x0,x1]=span(col,.15,Math.round(w*.22)),row=new Float32Array(h);for(let y=0;y<h;y++)for(let x=x0;x<=x1;x++)row[y]+=e[y*w+x];const[y0,y1]=span(row,.08,Math.round(h*.06)),p=4;
 const r={x0:Math.max(0,x0-p)/w,y0:Math.max(0,y0-p)/h,x1:Math.min(w,x1+p)/w,y1:Math.min(h,y1+p)/h};return(r.x1-r.x0<.2||r.y1-r.y0<.2)?{x0:0,y0:0,x1:1,y1:1}:r};
// bucata decupată, la o lățime bună pentru citire, în gri cu contrast întins; opțional prag adaptiv (anti-umbre)
const prep=(c,cr,prag)=>{const sx=Math.round(cr.x0*c.width),sy=Math.round(cr.y0*c.height),sw=Math.max(10,Math.round((cr.x1-cr.x0)*c.width)),sh=Math.max(10,Math.round((cr.y1-cr.y0)*c.height));
 let s=Math.min(2.2,Math.max(.5,1300/sw));if(sh*s>6000)s=6000/sh;const w=Math.round(sw*s),h=Math.round(sh*s),o=document.createElement('canvas');o.width=w;o.height=h;const x=o.getContext('2d',{willReadFrequently:true});x.imageSmoothingQuality='high';x.drawImage(c,sx,sy,sw,sh,0,0,w,h);
 const im=x.getImageData(0,0,w,h),d=im.data,n=w*h,g=new Float32Array(n),hist=new Uint32Array(256);for(let i=0,j=0;j<n;i+=4,j++){g[j]=(d[i]*299+d[i+1]*587+d[i+2]*114)/1000;hist[g[j]|0]++}
 let a=0,lo=0,hi=255;for(let i=0;i<256;i++){a+=hist[i];if(a>n*.02){lo=i;break}}a=0;for(let i=255;i>=0;i--){a+=hist[i];if(a>n*.02){hi=i;break}}const k=255/Math.max(1,hi-lo);for(let j=0;j<n;j++)g[j]=Math.max(0,Math.min(255,(g[j]-lo)*k));
 if(!prag){for(let j=0;j<n;j++)d[j*4]=d[j*4+1]=d[j*4+2]=g[j]}
 else{const I=new Float64Array((w+1)*(h+1));for(let y=1;y<=h;y++){let r=0;for(let xx=1;xx<=w;xx++){r+=g[(y-1)*w+xx-1];I[y*(w+1)+xx]=I[(y-1)*(w+1)+xx]+r}}const R=Math.max(8,Math.round(w/20));
  for(let y=0;y<h;y++){const y1=Math.max(0,y-R),y2=Math.min(h,y+R+1);for(let xx=0;xx<w;xx++){const x1=Math.max(0,xx-R),x2=Math.min(w,xx+R+1),cnt=(x2-x1)*(y2-y1),sm=I[y2*(w+1)+x2]-I[y1*(w+1)+x2]-I[y2*(w+1)+x1]+I[y1*(w+1)+x1];d[(y*w+xx)*4]=d[(y*w+xx)*4+1]=d[(y*w+xx)*4+2]=g[y*w+xx]*cnt<sm*.88?0:255}}}
 x.putImageData(im,0,0);return o};

/* ---------- citire ---------- */
const parse=(tip,t)=>tip==='income'?P.citesteVenit(t):P.citesteBon(t,{invatare:{}});
const score=(r,tip)=>tip==='income'?(r.total==null?1e9:0):(r.total==null||!r.produse.length?1e8-r.produse.length:Math.abs(r.diferenta)*100-r.produse.length*.01);
const read=async()=>{S.step='busy';S.pas=.25;S.pasL=.7;prog(.03,'Pregătesc poza…');render();
 try{const w=await getWorker(),c1=prep(S.img,S.crop,false);let r=await w.recognize(c1),t=r.data.text||'',best={t,r:parse(S.tip,t),c:c1,v:'gri',conf:r.data.confidence};
  if(score(best.r,S.tip)>=.5){S.pas=.6;S.pasL=.38;prog(.6,'Mai încerc o dată, cu alt filtru…');const c2=prep(S.img,S.crop,true);r=await w.recognize(c2);const t2=r.data.text||'',r2=parse(S.tip,t2);if(score(r2,S.tip)<score(best.r,S.tip))best={t:t2,r:r2,c:c2,v:'alb-negru',conf:r.data.confidence}}
  // diagnostic: poza exact cum a ajuns la cititor (micșorată), dimensiuni, încredere
  try{const k=Math.min(1,700/best.c.width),d=document.createElement('canvas');d.width=best.c.width*k;d.height=best.c.height*k;d.getContext('2d').drawImage(best.c,0,0,d.width,d.height);
   S.diag={img:d.toDataURL('image/jpeg',.8),info:`poza ${S.img.width}×${S.img.height} · citit ${best.c.width}×${best.c.height} · filtru ${best.v} · încredere ${Math.round(best.conf||0)}% · ${simd()?'SIMD':'fără SIMD'}`}}catch(e){S.diag=null}
  fromText(best.t,S.tip,best.r)}
 catch(e){console.error(e);S.step='crop';render();alert(navigator.onLine?'Nu am putut citi bonul: '+(e.message||e):'Prima scanare are nevoie de internet, ca să descarce dicționarul românesc (aprox. 10 MB).')}};

/* ---------- din text -> ecran de verificare ---------- */
const fromText=(text,tip,r)=>{if(S.step!=='busy')S.diag=null;S.tip=tip;S.text=text;r=r||parse(tip,text);
 if(tip==='income'){const ic=incCats(),d=(r.descriere||'').toLowerCase(),pick=(...n)=>n.find(x=>ic.includes(x))||ic[0];
  S.inc={note:r.descriere||'',amount:r.total,date:r.date||r.data||'',kind:'income',account:'Card',category:/salar/.test(d)?pick('Salariu card'):/depunere/.test(d)?pick('Venit cash','Alte venituri'):pick('Alte venituri')};S.dataGasita=!!r.data;S.step='inc'}
 else{const k=r.categorieMagazin;S.bon={mag:r.magazin||'',date:r.data||today(),total:r.totalGasit===false?'':r.total,storeKey:k,items:r.produse.map(p=>{const c=catOf(p.nume,k);return{n:p.nume,s:p.suma,q:p.cantitate,u:p.um,pu:p.pretUnitar,red:p.reducere,sgr:p.sgr,est:p.estimat,adj:p.ajustat,nec:p.necitit,fix:p.corectat?p.sumaCitita:null,cat:c.cat,src:c.src}})};
  const ac=accounts().map(a=>a[0]),v=ac.find(a=>a.startsWith('voucher:'));S.bon.account=r.plata==='numerar'?'Numerar':r.plata==='tichete'&&v?v:'Card';S.dataGasita=!!r.data;S.totalLipsa=r.totalGasit===false;S.peCat=true;S.step='exp'}
 tab='scan';render();scrollTo(0,0)};

/* ---------- ecrane ---------- */
const ICO='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/><path d="M8 9h8M8 12h8M8 15h5"/></svg>';
NAV.splice(2,0,['scan',ICO,'Scanează bon']);
const groups=items=>{const o={};items.filter(i=>i.s).forEach(i=>{(o[i.cat]=o[i.cat]||{cat:i.cat,s:0,n:[]}).s=val(o[i.cat].s+i.s);o[i.cat].n.push(i.n)});return Object.values(o).sort((a,b)=>b.s-a.s)};
const catOpts=(sel)=>expCats().map(c=>`<option ${c===sel?'selected':''}>${esc(c)}</option>`).join('');
V.scan=()=>{queueMicrotask(after);
 if(S.step==='start')return `<div class="card sc-start"><div class="seg">${[['expense','Cheltuială'],['income','Venit de la bancă']].map(([k,n])=>`<button class="${S.tip===k?'on':''}" data-sctip="${k}">${n}</button>`).join('')}</div>
  <p class="mu">${S.tip==='income'?'Fotografiază chitanța de la bancă (depunere numerar, alimentare cont). Suma intră la venituri sau, dacă vrei, ca transfer din numerar în card.':'Fotografiază bonul de cumpărături. Citesc produsele și le pun pe categoriile tale. Tu doar verifici și salvezi.'}</p>
  <label class="btn sc-big">📷 Fă o poză bonului<input type="file" id="scCam" accept="image/*" capture="environment" hidden></label>
  <label class="btn s sc-big2">🖼 Alege o poză din galerie<input type="file" id="scGal" accept="image/*" hidden></label>
  <details class="sc-paste"><summary>📋 Lipește textul bonului (citit de iPhone)</summary><p class="mu">Deschide poza bonului în <b>Poze</b>, apasă iconița de text din colțul pozei (Live Text), apoi <b>Selectează tot → Copiază</b> și lipește aici.</p><textarea id="scPaste" rows="7" placeholder="Lipește aici textul bonului"></textarea><button class="btn s m" data-scact="paste" style="margin-top:8px">Citește textul</button></details>
  <details class="sc-tips"><summary>Sfaturi pentru o citire bună</summary><ul><li>Câte un bon pe poză, cât mai aproape, să umple ecranul.</li><li>Netezește bonul cu palma: cutele strică citirea.</li><li>Pune-l pe o suprafață închisă la culoare.</li><li>Lumină bună, fără umbră peste bon și fără blitz direct.</li><li>Telefonul drept deasupra bonului, ca bonul să umple poza.</li><li>Bonurile lungi: poză din două bucăți, salvate pe rând.</li></ul></details>
  <small class="mu">Textul se citește pe telefon, iar bonul nu pleacă nicăieri. La prima scanare se descarcă o singură dată dicționarul românesc (aprox. 10 MB).</small></div>`;
 if(S.step==='crop')return `<div class="card"><h2>Încadrează bonul</h2><p class="mu">Trage colțurile albastre ca chenarul să cuprindă doar bonul, cu tot cu sumele din dreapta.</p>
  <div class="sc-crop" id="scCrop"><canvas id="scCv"></canvas><div class="sc-dim" id="scBox"><i data-h="tl"></i><i data-h="tr"></i><i data-h="bl"></i><i data-h="br"></i></div></div>
  <div class="acts sc-tools"><button class="btn s m" data-scact="rot">↻ Rotește</button><button class="btn s m" data-scact="auto">Chenar automat</button><button class="btn s m" data-scact="full">Toată poza</button></div>
  <div class="acts" style="margin-top:12px"><button class="btn s" data-scact="cancel">Renunță</button><button class="btn" data-scact="read">Citește bonul</button></div></div>`;
 if(S.step==='busy')return `<div class="card" style="text-align:center"><canvas id="scPrev" class="sc-prev"></canvas><p id="scMsg">${esc(S.msg||'Citesc…')}</p><div class="bar"><i id="scBar" style="width:${Math.round((S.prog||0)*100)}%"></i></div><small class="mu">Durează câteva secunde. Prima dată, puțin mai mult.</small></div>`;
 if(S.step==='inc'){const v=S.inc,tr=v.kind==='transfer';return `<div class="card"><h2>Chitanță bancă</h2>${!S.text?'':v.amount==null?'<div class="warn sc-w">Nu am găsit suma pe chitanță. Scrie-o tu.</div>':'<div class="warn sc-w">Verifică suma: cifrele de pe chitanțe se pot citi greșit.</div>'}
  <div class="form"><label>Sumă (RON)<input type="number" step="0.01" inputmode="decimal" data-scf="amount" value="${v.amount??''}"></label><label>Data<input type="date" data-scf="date" value="${v.date||today()}"></label>
  <label class="w">Notă<input data-scf="note" maxlength="120" value="${esc(v.note)}"></label></div>
  <div class="seg" style="margin-top:14px">${[['income','Venit'],['transfer','Transfer numerar → card']].map(([k,n])=>`<button class="${v.kind===k?'on':''}" data-sckind="${k}">${n}</button>`).join('')}</div>
  <p class="mu" style="margin:8px 0 0">${tr?'Banii erau deja ai tăi în numerar și i-ai pus pe card: soldul de numerar scade, cel de card crește, iar veniturile lunii nu se modifică.':'Suma intră la veniturile lunii.'}</p>
  ${tr?'':`<div class="form"><label>Categorie<select data-scf="category">${incCats().map(c=>`<option ${c===v.category?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label>Cont<select data-scf="account">${accounts().slice(0,2).map(([a,n])=>`<option value="${esc(a)}" ${a===v.account?'selected':''}>${n}</option>`).join('')}</select></label></div>`}</div>
  ${txtCard()}<div class="acts sc-save"><button class="btn s" data-scact="cancel">Renunță</button><button class="btn" data-scact="saveinc">Salvează</button></div>`}
 const b=S.bon,dup=data.transactions.some(t=>t.bon&&t.date===b.date&&t.bon.total===b.total&&(t.bon.mag||'')===(b.mag||''))&&b.total!=null;
 return `<div class="card"><h2>Verifică bonul</h2>${dup?'<div class="warn sc-w">Se pare că ai salvat deja un bon de la acest magazin, cu aceeași dată și același total.</div>':''}${S.text&&S.totalLipsa?'<div class="warn sc-w" id="scTotW">Nu am putut citi <b>TOTALUL</b> de pe bon. Scrie-l tu mai jos, la „Total pe bon”, și îți arăt dacă lipsește vreun produs.</div>':''}${S.text&&!S.dataGasita?'<div class="warn sc-w">Nu am găsit data pe bon. Am pus data de azi.</div>':''}
  <div class="form"><label>Magazin<input data-scb="mag" value="${esc(b.mag)}" placeholder="ex. Lidl"></label><label>Data<input type="date" data-scb="date" value="${b.date}"></label>
  <label>Plătit din<select data-scb="account">${accounts().map(([a,n])=>`<option value="${esc(a)}" ${a===b.account?'selected':''}>${n}</option>`).join('')}</select></label><label>Total pe bon<input type="number" step="0.01" inputmode="decimal" data-scb="total" value="${b.total??''}"></label></div>
  <div id="scDif"></div></div>
 <div class="card"><div class="sc-head"><h2>Produse <span class="mu" id="scSum"></span></h2><small class="mu">alege categoria de sub fiecare produs</small></div>
  ${b.items.map((i,k)=>`<div class="sc-it${i.est||i.nec?' est':''}"><input data-sci="${k}" data-k="n" value="${esc(i.n)}" placeholder="Produs"><input type="number" step="0.01" inputmode="decimal" data-sci="${k}" data-k="s" value="${i.s||''}"><button class="btn d" data-scdel="${k}" aria-label="Șterge produsul">✕</button>
   <select data-sci="${k}" data-k="cat" class="${i.src==='magazin'||i.src==='necunoscut'?'gh':''}">${catOpts(i.cat)}</select>${det(i)?`<small class="mu">${det(i)}</small>`:''}</div>`).join('')||'<div class="empty">Nu am găsit produse. Adaugă-le sau completează doar totalul.</div>'}
  <button class="btn s m" data-scact="additem" style="margin-top:10px">＋ Adaugă produs</button></div>
 <div class="card"><h2>Se salvează așa</h2><div id="scGr"></div><label class="sc-ck"><input type="checkbox" id="scPeCat" ${S.peCat?'checked':''}> Câte o operațiune pe fiecare categorie (recomandat)</label></div>
 ${txtCard()}<div class="acts sc-save"><button class="btn s" data-scact="cancel">Renunță</button><button class="btn" data-scact="saveexp">Salvează</button></div>`};
const det=i=>[i.q&&i.q!==1?`${i.q}${i.u?' '+i.u.toLowerCase():''} × ${money(i.pu)}`:'',i.red?'reducere '+money(i.red):'',i.sgr?'garanție SGR '+money(i.sgr):'',i.nec?'⚠ numele nu s-a putut citi: scrie-l tu':'',i.est?'⚠ suma nu s-a citit, am calculat-o: verific-o':'',i.adj?'suma completată din total: verific-o':'',i.fix!=null?`am corectat suma (citisem ${money(i.fix)}) după cantitate × preț și total`:''].filter(Boolean).map(esc).join(' · ');
const txtCard=()=>S.text?`<details class="card sc-txt"><summary>Textul citit de pe bon</summary>${S.diag?`<p class="mu" style="margin:8px 0 6px;font-size:12px">${esc(S.diag.info)}</p><img src="${S.diag.img}" alt="Poza citită" class="sc-diag">`:''}<pre>${esc(S.text)}</pre></details>`:'';

/* ---------- după randare: poze, chenar, totaluri ---------- */
function after(){document.body.classList.toggle('scanning',tab==='scan');if(tab!=='scan')return;
 if(S.step==='busy'&&S.img){const c=$('scPrev');if(c){const r=S.crop,sw=(r.x1-r.x0)*S.img.width,sh=(r.y1-r.y0)*S.img.height,s=Math.min(1,260/sh,600/sw);c.width=sw*s;c.height=sh*s;c.getContext('2d').drawImage(S.img,r.x0*S.img.width,r.y0*S.img.height,sw,sh,0,0,c.width,c.height)}}
 if(S.step==='crop'&&S.img){const c=$('scCv');if(!c)return;const s=Math.min(1,900/S.img.width);c.width=S.img.width*s;c.height=S.img.height*s;c.getContext('2d').drawImage(S.img,0,0,c.width,c.height);box()}
 if(S.step==='exp')totals()}
const box=()=>{const b=$('scBox');if(!b)return;const r=S.crop;Object.assign(b.style,{left:r.x0*100+'%',top:r.y0*100+'%',width:(r.x1-r.x0)*100+'%',height:(r.y1-r.y0)*100+'%'})};
function totals(){const b=S.bon,s=val(sum(b.items,i=>i.s)),t=Number(b.total),d=$('scDif'),g=$('scGr'),ss=$('scSum'),tw=$('scTotW');if(ss)ss.textContent='· '+money(s);if(tw)tw.hidden=b.total!==''&&b.total!=null;
 if(d)d.innerHTML=b.total!==''&&b.total!=null&&Math.abs(t-s)>=.01?`<div class="warn sc-w">Produsele adunate dau <b>${money(s)}</b>, iar pe bon scrie <b>${money(t)}</b> (diferență ${money(val(t-s))}). Poate o sumă a fost citită greșit, verifică produsele. <button class="btn s m" data-scact="diff">Pune diferența la „Altele”</button></div>`:'';
 if(g){const gr=groups(b.items);g.innerHTML=S.peCat?gr.map(x=>`<div class="row"><span>${esc(x.cat)}<small>${x.n.length} ${x.n.length===1?'produs':'produse'}</small></span><b>${money(x.s)}</b></div>`).join('')||'<div class="empty">Nimic de salvat.</div>'
  :`<div class="row"><span>${esc(gr[0]?.cat||'Altele')}<small>tot bonul ca o singură operațiune</small></span><b>${money(b.total!==''&&b.total!=null?t:s)}</b></div>`}}

/* ---------- evenimente ---------- */
const pick=async f=>{if(!f)return;try{S.img=await loadImg(f);S.crop=autoCrop(S.img);S.step='crop';render();scrollTo(0,0)}catch(e){alert(e.message)}};
document.addEventListener('change',e=>{const t=e.target;if(t.id==='scCam'||t.id==='scGal'){pick(t.files[0]);t.value='';return}if(tab!=='scan')return;
 if(t.id==='scPeCat'){S.peCat=t.checked;totals()}
 else if(t.dataset.sci&&t.dataset.k==='cat'){const i=S.bon.items[+t.dataset.sci];i.cat=t.value;i.manual=true;i.src='manual';t.classList.remove('gh');totals()}
 else if(t.dataset.scb==='account'){S.bon.account=t.value}
 else if(t.dataset.scf){S.inc[t.dataset.scf]=t.value}});
document.addEventListener('input',e=>{const t=e.target;if(tab!=='scan')return;
 if(t.dataset.sci){const i=S.bon.items[+t.dataset.sci];if(t.dataset.k==='n')i.n=t.value;else if(t.dataset.k==='s'){i.s=val(t.value);i.est=false;totals()}}
 else if(t.dataset.scb){const k=t.dataset.scb;S.bon[k]=k==='total'?(t.value===''?'':val(t.value)):t.value;if(k==='total')totals()}
 else if(t.dataset.scf){S.inc[t.dataset.scf]=t.dataset.scf==='amount'?(t.value===''?null:val(t.value)):t.value}});
// la schimbarea numelui unui produs, reîncadrez (dacă nu ai ales tu categoria)
document.addEventListener('focusout',e=>{const t=e.target;if(tab!=='scan'||!t.dataset||t.dataset.k!=='n')return;const i=S.bon.items[+t.dataset.sci];if(!i||i.manual||!i.n)return;const c=catOf(i.n,S.bon.storeKey);if(c.cat!==i.cat){i.cat=c.cat;i.src=c.src;const s=document.querySelector(`select[data-sci="${t.dataset.sci}"]`);if(s)s.value=c.cat;totals()}});
document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;const d=t.dataset;
 if(d.scan!==undefined){S={step:'start',tip:d.scan||'expense'};tab='scan';render();scrollTo(0,0);return}
 if(d.sctip){S.tip=d.sctip;render()}
 else if(d.sckind){S.inc.kind=d.sckind;render()}
 else if(d.scdel!==undefined){S.bon.items.splice(+d.scdel,1);render()}
 else if(d.scact){const a=d.scact;
  if(a==='cancel'){reset();render()}
  else if(a==='rot'){S.img=rotate(S.img);S.crop=autoCrop(S.img);render()}
  else if(a==='auto'){S.crop=autoCrop(S.img);box()}
  else if(a==='full'){S.crop={x0:0,y0:0,x1:1,y1:1};box()}
  else if(a==='read')read();
  else if(a==='paste'){const t=($('scPaste')?.value||'').trim();if(!t)return alert('Lipește întâi textul bonului.');S.diag=null;fromText(t,S.tip)}
  else if(a==='additem'){S.bon.items.push({n:'',s:0,cat:mapCat(S.bon.storeKey||'alimente'),src:'manual'});render();const l=document.querySelectorAll('[data-k="n"]');l[l.length-1]?.focus()}
  else if(a==='diff'){const s=val(sum(S.bon.items,i=>i.s)),df=val(Number(S.bon.total)-s);if(df)S.bon.items.push({n:'Diferență bon',s:df,cat:mapCat('altele'),src:'manual',manual:true});render()}
  else if(a==='saveexp')saveExp();else if(a==='saveinc')saveInc()}});
// trasul colțurilor chenarului
let drag=null;
document.addEventListener('pointerdown',e=>{const h=e.target.closest('#scBox i');if(!h)return;e.preventDefault();drag=h.dataset.h;h.setPointerCapture?.(e.pointerId)});
document.addEventListener('pointermove',e=>{if(!drag)return;const c=$('scCrop');if(!c)return;const r=c.getBoundingClientRect(),x=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y=Math.min(1,Math.max(0,(e.clientY-r.top)/r.height)),k=S.crop,m=.05;
 if(drag[1]==='l')k.x0=Math.min(x,k.x1-m);else k.x1=Math.max(x,k.x0+m);if(drag[0]==='t')k.y0=Math.min(y,k.y1-m);else k.y1=Math.max(y,k.y0+m);box()});
document.addEventListener('click',e=>{if(e.target.closest('[data-go]'))document.body.classList.remove('scanning')},true);
document.addEventListener('pointerup',()=>{drag=null});document.addEventListener('pointercancel',()=>{drag=null});

/* ---------- salvare ---------- */
function saveExp(){const b=S.bon,items=b.items.filter(i=>i.s&&(i.n||'').trim()),s=val(sum(items,i=>i.s)),hasT=b.total!==''&&b.total!=null,t=hasT?val(b.total):s;
 if(!items.length&&!hasT)return alert('Nu e nimic de salvat.');if(!b.date)return alert('Alege data.');
 if(hasT&&items.length&&Math.abs(t-s)>=.01&&!confirm(`Produsele dau ${money(s)}, iar totalul bonului e ${money(t)}.\nSalvez produsele așa cum sunt (${money(s)})?`))return;
 const amount=items.length?s:t;if(b.account.startsWith('voucher:')&&amount>vbal(b.account))return alert('Sold insuficient pe cardul ales.');
 items.forEach(i=>{if(i.manual)P.invata(data.scanner.learn,i.n,i.cat)});
 const bon={id:id(),total:hasT?t:null,mag:b.mag.trim()},note=b.mag.trim()||'Bon',now=Date.now(),mk=(cat,am,its,k)=>({id:id(),created:now+k,date:b.date,type:'expense',amount:val(am),account:b.account,note,category:cat,debtId:'',to:'',items:its.map(i=>({n:i.n.trim(),s:i.s,...(i.q&&i.q!==1?{q:i.q,u:i.u||'',pu:i.pu}:{})})),bon});
 const add=!items.length?[mk(mapCat(b.storeKey||'altele'),t,[],0)]:S.peCat?groups(items).map((g,k)=>mk(g.cat,g.s,items.filter(i=>i.cat===g.cat),k)):[mk(groups(items)[0].cat,s,items,0)];
 data.transactions.push(...add);const ids=new Set(add.map(x=>x.id));month=b.date.slice(0,7);reset();tab='home';document.body.classList.remove('scanning');save();scrollTo(0,0);
 toast(`Bon salvat: ${add.length} ${add.length===1?'operațiune':'operațiuni'}, ${money(sum(add))}`,()=>{data.transactions=data.transactions.filter(x=>!ids.has(x.id));save()})}
function saveInc(){const v=S.inc,n=val(v.amount);if(!(n>0))return alert('Scrie suma.');if(!v.date)return alert('Alege data.');
 const t=v.kind==='transfer'?{id:id(),created:Date.now(),date:v.date,type:'transfer',amount:n,account:'Numerar',note:(v.note||'').trim()||'Depunere numerar',category:'',debtId:'',to:'Card'}
  :{id:id(),created:Date.now(),date:v.date,type:'income',amount:n,account:v.account||'Card',note:(v.note||'').trim(),category:v.category||incCats()[0],debtId:'',to:''};
 data.transactions.push(t);month=v.date.slice(0,7);reset();tab='home';document.body.classList.remove('scanning');save();scrollTo(0,0);toast((t.type==='transfer'?'Transfer salvat: ':'Venit salvat: ')+money(n),()=>{data.transactions=data.transactions.filter(x=>x!==t);save()})}

/* ---------- butonul din „Adaugă” și cardul din Setări ---------- */
const add2=V.add;V.add=()=>{const h=add2();return(entry==='expense'||entry==='income')?h.replace('<form id="f"',`<button type="button" class="btn s sc-addbtn" data-scan="${entry}">📷 ${entry==='income'?'Scanează chitanța de la bancă':'Scanează bonul în loc să scrii'}</button><form id="f"`):h};
const set2=V.set;V.set=()=>{const L=Object.entries(data.scanner.learn).filter(([k])=>k[0]!=='~');const h=set2(),A='<div class="card"><h2>🔐 Securitate</h2>',B='<div class="card"><h2>Backup</h2>',at=h.includes(A)?A:B;return h.replace(at,`<div class="card"><h2>Scanare bonuri</h2><p class="mu" style="margin-top:0">${L.length?`Am învățat ${L.length} produse din corecturile tale. Data viitoare le încadrez singur.`:'Când schimbi categoria unui produs scanat, o țin minte pentru data viitoare.'}</p>${L.slice(-15).reverse().map(([k,c])=>`<div class="row"><span>${esc(k)}</span><b>${esc(c)}</b></div>`).join('')}${L.length?'<button class="btn s m" data-scforget="1" style="margin-top:10px">Uită ce am învățat</button>':''}</div>${at}`)};
document.addEventListener('click',e=>{const t=e.target.closest('[data-scforget]');if(!t)return;if(confirm('Uit toate categoriile învățate de la bonuri?')){data.scanner.learn={};save()}});
return{fromText,state:()=>S}})();
