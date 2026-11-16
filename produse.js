'use strict';
/* V30: raportul „Produse” din bonurile scanate — ce cumperi des, pe ce dai mulți bani,
   ce s-a scumpit, unde e mai ieftin și istoricul de preț al fiecărui produs. */
let prodSel='',prodPer='12';
const PR=(()=>{
const P=window.BonParser;
// cheie de grupare: numele fără cantități/gramaje, primele 3 cuvinte (ex. „KEFIR 1,5% 330G” și „Kefir 1.5%” -> KEFIR)
const key=n=>{const k=(P?P.cheieInvatare(n):String(n).toUpperCase()).split(' ').filter(w=>w.length>1).slice(0,3).join(' ');return k||String(n).toUpperCase()};
const cap=s=>s.length>2&&s===s.toUpperCase()?s.charAt(0)+s.slice(1).toLowerCase():s;
// toate produsele cumpărate, cu dată, magazin și preț pe unitate
const all=()=>{const o=[],from=prodPer==='all'?'':addM(month,-(+prodPer)+1)+'-01',to=addM(month,1)+'-01';
 data.transactions.forEach(t=>{if(t.type!=='expense'||!t.items||!t.items.length)return;if(from&&t.date<from||t.date>=to)return;
  t.items.forEach(i=>{if(!(i.s>0))return;const q=i.q&&i.q>0?i.q:1;o.push({n:i.n,k:key(i.n),s:i.s,q,u:(i.u||'').toUpperCase(),pu:i.pu||val(i.s/q),date:t.date,mag:(t.bon&&t.bon.mag)||t.note||'—',cat:t.category,bon:t.bon&&t.bon.id||t.id})})});
 return o};
const groups=l=>{const g={};l.forEach(i=>{const x=g[i.k]=g[i.k]||{k:i.k,names:{},c:0,s:0,l:[]};x.names[i.n]=(x.names[i.n]||0)+1;x.c++;x.s=val(x.s+i.s);x.l.push(i)});
 return Object.values(g).map(x=>{x.n=cap(Object.entries(x.names).sort((a,b)=>b[1]-a[1])[0][0]);x.l.sort((a,b)=>a.date.localeCompare(b.date));x.avg=val(sum(x.l,i=>i.pu)/x.l.length);x.u=x.l[x.l.length-1].u;return x})};
const unit=u=>u==='KG'?'/kg':u==='L'?'/l':'';
const pct=x=>(x>0?'+':'')+Math.round(x*100)+'%';
// scumpiri/ieftiniri: ultimul preț față de media cumpărărilor anterioare (minim 2 cumpărări, în zile diferite)
const changes=G=>G.map(x=>{const l=x.l;if(l.length<2)return null;const last=l[l.length-1],prev=l.filter(i=>i.date<last.date);if(!prev.length)return null;
 const a=sum(prev,i=>i.pu)/prev.length;if(!(a>0))return null;return{x,last,a:val(a),d:(last.pu-a)/a}}).filter(c=>c&&Math.abs(c.d)>=.05).sort((a,b)=>b.d-a.d);
// același produs la magazine diferite: unde e mai ieftin
const stores=G=>G.map(x=>{const m={};x.l.forEach(i=>{(m[i.mag]=m[i.mag]||[]).push(i.pu)});const e=Object.entries(m).map(([k,v])=>[k,val(sum(v,y=>y)/v.length),v.length]);if(e.length<2)return null;
 e.sort((a,b)=>a[1]-b[1]);const lo=e[0],hi=e[e.length-1];return hi[1]>lo[1]?{x,lo,hi,d:(hi[1]-lo[1])/hi[1]}:null}).filter(Boolean).sort((a,b)=>b.d-a.d);
const row=(l,r,sm)=>`<div class="row"><span>${l}${sm?`<small>${sm}</small>`:''}</span><b>${r}</b></div>`;
const view=()=>{const L=all(),G=groups(L),bonuri=new Set(L.map(i=>i.bon)).size,per=`<select id="prodPer" class="pr-per">${[['3','Ultimele 3 luni'],['6','Ultimele 6 luni'],['12','Ultimele 12 luni'],['all','Tot istoricul']].map(([k,n])=>`<option value="${k}" ${prodPer===k?'selected':''}>${n}</option>`).join('')}</select>`;
 if(!L.length)return `<div class="dash"><div class="card s12"><h2>Produse</h2>${per}<div class="empty">Încă nu ai produse în perioada aleasă. Scanează câteva bonuri (📷 Scanează bon) și aici vezi ce cumperi des, ce s-a scumpit și unde e mai ieftin.</div><button class="btn" data-go="scan" style="margin-top:10px">📷 Scanează un bon</button></div></div>`;
 const ch=changes(G),up=ch.filter(c=>c.d>0),dn=ch.filter(c=>c.d<0).reverse(),st=stores(G),often=[...G].sort((a,b)=>b.c-a.c||b.s-a.s).slice(0,8),big=[...G].sort((a,b)=>b.s-a.s).slice(0,8),mx=Math.max(...big.map(x=>x.s),1);
 if(!prodSel||!G.some(x=>x.k===prodSel))prodSel=often[0].k;const S=G.find(x=>x.k===prodSel),pmx=Math.max(...S.l.map(i=>i.pu),.01),pmn=Math.min(...S.l.map(i=>i.pu));
 return `<div class="dash"><div class="card s12 pr-top"><h2>Produse din bonurile scanate</h2>${per}</div>
 <div class="card kpi s3"><small>Bonuri scanate</small><b>${bonuri}</b></div><div class="card kpi s3"><small>Produse diferite</small><b>${G.length}</b></div><div class="card kpi s3"><small>Cumpărături</small><b>${L.length}</b></div><div class="card kpi s3"><small>Cheltuit pe produse</small><b class="er">${money(sum(L,i=>i.s))}</b></div>
 <div class="card s6"><h2>📈 S-au scumpit</h2>${up.slice(0,6).map(c=>row(esc(c.x.n),`<span class="er">${pct(c.d)}</span>`,`${money(c.a)}${unit(c.x.u)} în medie → ${money(c.last.pu)}${unit(c.x.u)} la ${esc(c.last.mag)}, ${c.last.date}`)).join('')||'<div class="empty">Nicio scumpire de peste 5%. Apare aici când cumperi același produs de cel puțin două ori.</div>'}
  ${dn.length?`<h2 style="margin-top:16px">📉 S-au ieftinit</h2>${dn.slice(0,4).map(c=>row(esc(c.x.n),`<span class="ok">${pct(c.d)}</span>`,`${money(c.a)} → ${money(c.last.pu)}${unit(c.x.u)}`)).join('')}`:''}</div>
 <div class="card s6"><h2>🏷 Unde e mai ieftin</h2>${st.slice(0,6).map(c=>row(esc(c.x.n),`<span class="ok">−${Math.round(c.d*100)}%</span>`,`${esc(c.lo[0])} ${money(c.lo[1])}${unit(c.x.u)} · ${esc(c.hi[0])} ${money(c.hi[1])}${unit(c.x.u)}`)).join('')||'<div class="empty">Apare când cumperi același produs de la cel puțin două magazine.</div>'}</div>
 <div class="card s6"><h2>🔁 Ce cumperi cel mai des</h2>${often.map(x=>row(`<a href="#" data-prod="${esc(x.k)}">${esc(x.n)}</a>`,`${x.c}×`,`${money(x.s)} în total · ${money(x.avg)}${unit(x.u)} în medie`)).join('')}</div>
 <div class="card s6"><h2>💰 Pe ce dai cei mai mulți bani</h2>${big.map(x=>`<div class="pr-bar"><div><a href="#" data-prod="${esc(x.k)}">${esc(x.n)}</a><b>${money(x.s)}</b></div><div class="bar"><i style="width:${x.s/mx*100}%"></i></div></div>`).join('')}</div>
 <div class="card s12" id="prodIst"><h2>Istoricul de preț</h2><select id="prodSel">${[...G].sort((a,b)=>a.n.localeCompare(b.n,'ro')).map(x=>`<option value="${esc(x.k)}" ${x.k===prodSel?'selected':''}>${esc(x.n)} (${x.c})</option>`).join('')}</select>
  <div class="pr-k"><div><small>Cel mai mic</small><b class="ok">${money(pmn)}${unit(S.u)}</b></div><div><small>Media</small><b>${money(S.avg)}${unit(S.u)}</b></div><div><small>Cel mai mare</small><b class="er">${money(pmx)}${unit(S.u)}</b></div><div><small>Total cheltuit</small><b>${money(S.s)}</b></div></div>
  <div class="pr-hist">${[...S.l].reverse().map(i=>`<div class="pr-pt"><span>${i.date}<small>${esc(i.mag)}${i.q!==1?` · ${i.q} ${esc((i.u||'buc').toLowerCase())}`:''}</small></span><div class="bar"><i style="width:${Math.max(4,i.pu/pmx*100)}%"></i></div><b>${money(i.pu)}${unit(i.u)}</b></div>`).join('')}</div>
  ${Object.keys(S.names).length>1?`<small class="mu">Grupat din: ${Object.keys(S.names).map(esc).join(', ')}</small>`:''}</div></div>`};
document.addEventListener('change',e=>{if(e.target.id==='prodSel'){prodSel=e.target.value;render();setTimeout(()=>$('prodIst')?.scrollIntoView({block:'start'}),0)}else if(e.target.id==='prodPer'){prodPer=e.target.value;render()}});
document.addEventListener('click',e=>{const a=e.target.closest('[data-prod]');if(!a)return;e.preventDefault();prodSel=a.dataset.prod;render();setTimeout(()=>$('prodIst')?.scrollIntoView({block:'start',behavior:'smooth'}),0)});
subs.push(['prod','Produse']);RS.prod=view;
return{all,groups,key}})();
