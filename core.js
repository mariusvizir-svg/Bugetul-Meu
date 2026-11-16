'use strict';
/* Bugetul Meu · core: date, helperi, calcule de solduri, ecranele de bază */
const KEY='bugetul-meu-v1',$=id=>document.getElementById(id),val=x=>Math.round((Number(x)||0)*100)/100,
money=n=>new Intl.NumberFormat('ro-RO',{style:'currency',currency:'RON'}).format(n||0),
esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)},
sum=(a,f=x=>x.amount)=>a.reduce((s,x)=>s+(Number(f(x))||0),0),COL=['#1a4d9c','#16a37a','#f08c2e','#8b5cf6','#e5484d','#0ea5c6','#d946a8','#84a30f'];
let data=window.__DATA__||{};
data={transactions:[],debts:[],loans:[],budgets:{},...data};data.opening={Card:0,Numerar:0,...data.opening};
data.v14=data.v14||{};data.v14.cards=data.v14.cards||[];data.v14.cardMoves=data.v14.cardMoves||[];
const BASE=['Garsonieră și utilități','Internet și telefon','Mâncare','Transport','Tenis și sport','Sănătate','Îmbrăcăminte','Ieșiri și distracție','Cumpărături casă','Altele'],
uniq=a=>[...new Set(a.filter(Boolean))],
expCats=()=>uniq([...BASE,...(data.customCategories?.expense||[]),...Object.keys(data.budgets||{}),...data.transactions.filter(t=>t.type==='expense').map(t=>t.category)]),
incCats=()=>uniq(['Salariu card','Venit cash','Alte venituri',...(data.customCategories?.income||[]),...data.transactions.filter(t=>t.type==='income').map(t=>t.category)]);
const TYPES={expense:'Cheltuială',income:'Încasare',debt:'Rambursare',transfer:'Transfer',loan_lent:'Împrumut acordat',loan_received:'Împrumut primit',loan_repay:'Rambursare împrumut',loan_collect:'Recuperare împrumut'},
CREDIT=['income','loan_received','loan_collect'];
let tab='home',kind='all',q='',entry='expense',month=today().slice(0,7);
const save=()=>{Store.save(data).catch(()=>alert('Nu s-au putut salva datele! Fă imediat un backup din Setări.'));render()},
tx=(m=month)=>data.transactions.filter(t=>t.date?.slice(0,7)===m),by=(m,t)=>tx(m).filter(x=>x.type===t),
remaining=d=>Math.max(0,val(d.amount-sum(data.transactions.filter(t=>t.type==='debt'&&t.debtId===d.id)))),
balances=()=>{const b={Card:val(data.opening.Card),Numerar:val(data.opening.Numerar)};for(const t of data.transactions){const a=t.amount;if(t.type==='transfer'){if(t.account in b)b[t.account]-=a;if(t.to in b)b[t.to]+=a}else if(t.account in b)b[t.account]+=CREDIT.includes(t.type)?a:-a}return b},
spent=id=>sum(data.transactions.filter(t=>t.type==='expense'&&t.account==='voucher:'+id)),
legacy=k=>val(sum((data.v11?.vouchers||[]).filter(t=>t.account===k),t=>(t.kind==='load'?1:-1)*t.amount)-spent('legacy:'+k)),
cardBal=c=>val((+c.opening||0)+sum(data.v14.cardMoves.filter(m=>m.cardId===c.id),m=>(m.kind==='load'?1:-1)*m.amount)-spent(c.id)),
accounts=()=>[['Card','💳 Card bancar'],['Numerar','💵 Numerar'],...(data.v11?.vouchers?.length||spent('legacy:meal')||spent('legacy:gift')?[['voucher:legacy:meal','🎟 Card de masă (existent)'],['voucher:legacy:gift','🎁 Card cadou (existent)']]:[]),...data.v14.cards.filter(c=>!c.archived).map(c=>['voucher:'+c.id,'🎟 '+c.name])],
vbal=a=>{const id=a.slice(8);return id.startsWith('legacy:')?legacy(id.slice(7)):cardBal(data.v14.cards.find(c=>c.id===id)||{})};
const cat=(m)=>{const o={};by(m,'expense').forEach(t=>o[t.category||'Altele']=(o[t.category||'Altele']||0)+t.amount);return Object.entries(o).sort((a,b)=>b[1]-a[1])};
const addM=(m,k)=>{const[y,o]=m.split('-').map(Number),d=new Date(y,o-1+k,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const NAV=[['home','🏠','Acasă'],['add','＋','Adaugă'],['hist','🧾','Istoric'],['rep','📊','Rapoarte'],['plan','🗓','Planificare'],['goal','🎯','Economii'],['pers','👥','Persoane'],['debt','🏦','Datorii'],['cards','🎟','Carduri tichete'],['set','⚙️','Setări']];
const V={
home(){const b=balances(),inc=sum(by(month,'income')),ex=sum(by(month,'expense')),db=sum(by(month,'debt')),c=cat(month),tot=sum(c,x=>x[1]);let ac=0;const g=c.map(([n,v],i)=>{const s=ac;ac+=v/tot*100;return COL[i%8]+' '+s+'% '+ac+'%'}).join(',');
const bud=Object.entries(data.budgets||{}).filter(([,v])=>v>0).map(([n,l])=>{const s=sum(by(month,'expense').filter(t=>t.category===n)),p=s/l*100;return `<div style="margin:12px 0"><div class="row" style="border:0;padding:0"><span>${esc(n)}</span><b class="${p>100?'er':''}">${money(s)} / ${money(l)}</b></div><div class="bar"><i class="${p>100?'x':''}" style="width:${Math.min(100,p)}%"></i></div></div>`}).join('');
return `<div class="hero"><small>Disponibil card + numerar</small><b>${money(b.Card+b.Numerar)}</b><div><span>💳 ${money(b.Card)}</span><span>💵 ${money(b.Numerar)}</span></div></div>
<div class="grid"><div class="card kpi"><small>Venituri</small><b class="ok">${money(inc)}</b></div><div class="card kpi"><small>Cheltuieli</small><b class="er">${money(ex)}</b></div><div class="card kpi"><small>Rambursări</small><b>${money(db)}</b></div><div class="card kpi"><small>Rămas luna asta</small><b>${money(inc-ex-db)}</b></div></div>
<div class="card"><h2>Unde merg banii</h2>${c.length?`<div class="donut"><div class="ring" style="background:conic-gradient(${g})"><span>${money(tot)}</span></div><div class="leg">${c.slice(0,7).map(([n,v],i)=>`<div class="row"><span><i class="dot" style="background:${COL[i%8]}"></i>${esc(n)}</span><b>${money(v)} · ${Math.round(v/tot*100)}%</b></div>`).join('')}</div></div>`:'<div class="empty">Nicio cheltuială în luna selectată.</div>'}</div>
${bud?`<div class="card"><h2>Bugete pe categorii</h2>${bud}</div>`:''}
<div class="card"><h2>Ultimele operațiuni</h2>${txRows([...tx()].sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created).slice(0,6),false)}</div>`},
add(){const ac=accounts(),isT=entry==='transfer',isD=entry==='debt',cs=entry==='income'?incCats():expCats();
return `<div class="card"><div class="seg" id="seg">${['expense','income','debt','transfer'].map(t=>`<button class="${entry===t?'on':''}" data-type="${t}">${TYPES[t]}</button>`).join('')}</div>
<form id="f" class="form" style="margin-top:16px"><label>Sumă (RON)<input name="amount" type="number" step="0.01" min="0.01" inputmode="decimal" required></label><label>Data<input name="date" type="date" value="${today()}" required></label>
<label>${isT?'Din contul':'Cont'}<select name="account">${(entry==='expense'?ac:ac.slice(0,2)).map(([v,l])=>`<option value="${esc(v)}">${l}</option>`).join('')}</select></label>
${isT?`<label>În contul<select name="to"><option value="Numerar">💵 Numerar</option><option value="Card">💳 Card bancar</option></select></label>`:isD?`<label>Creditor<select name="debtId">${data.debts.map(d=>`<option value="${esc(d.id)}">${esc(d.name)} · ${money(remaining(d))}</option>`).join('')}</select></label>`:`<label>Categorie<select name="category">${cs.map(c=>`<option>${esc(c)}</option>`).join('')}</select></label>`}
<label class="w">Notă<input name="note" maxlength="120" placeholder="opțional"></label><button class="btn w">Salvează</button></form></div>`},
hist(){const l=[...tx()].filter(t=>(kind==='all'||t.type===kind)&&(`${t.note||''} ${t.category||''} ${TYPES[t.type]}`).toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created);
return `<div class="card"><input id="q" placeholder="🔍 Caută…" value="${esc(q)}"><div class="seg" id="chips" style="margin:12px 0">${[['all','Toate'],['income','Venituri'],['expense','Cheltuieli'],['debt','Rambursări'],['transfer','Transferuri']].map(([k,n])=>`<button class="${kind===k?'on':''}" data-kind="${k}">${n}</button>`).join('')}</div>${txRows(l,true)}</div>`},
rep(){const ms=[...Array(6)].map((_,i)=>addM(month,i-5)),vals=ms.map(m=>sum(by(m,'expense'))),mx=Math.max(...vals,1);
return `<div class="card"><h2>Cheltuieli · ultimele 6 luni</h2><div class="cols">${ms.map((m,i)=>`<div><b>${Math.round(vals[i])}</b><i style="height:${vals[i]/mx*100}%"></i>${m.slice(5)}</div>`).join('')}</div></div>
<div class="card"><h2>Pe categorii · ${month}</h2>${cat(month).map(([n,v])=>`<div class="row"><span>${esc(n)}</span><b>${money(v)}</b></div>`).join('')||'<div class="empty">Fără date.</div>'}</div>
<div style="display:flex;gap:10px"><button class="btn" data-act="print">🖨 Tipărește / PDF</button><button class="btn s" data-act="csv">⬇ Export CSV</button></div>`},
debt(){return `<div class="card"><h2>Datorii</h2>${data.debts.map(d=>`<div class="row"><div>${esc(d.name)}<small>din ${money(d.amount)}</small></div><b>${money(remaining(d))}</b></div>`).join('')||'<div class="empty">Nicio datorie.</div>'}</div>
<form id="df" class="card form"><label>Creditor<input name="name" required></label><label>Sumă totală<input name="amount" type="number" step="0.01" min="0" required></label><button class="btn w">Adaugă datorie</button></form>`},
cards(){const L=[['Card de masă (existent)',legacy('meal')],['Card cadou (existent)',legacy('gift')]].filter(x=>x[1]);return `<div class="card"><h2>Carduri de tichete</h2>${[...L,...data.v14.cards.map(c=>[c.name+(c.archived?' (arhivat)':''),cardBal(c)])].map(([n,v])=>`<div class="row"><span>🎟 ${esc(n)}</span><b>${money(v)}</b></div>`).join('')||'<div class="empty">Niciun card.</div>'}</div>
<form id="cf" class="card form"><label>Denumire<input name="name" required></label><label>Sold inițial<input name="opening" type="number" step="0.01" min="0" value="0"></label><button class="btn w">Adaugă card</button></form>
${data.v14.cards.length?`<form id="lf" class="card form"><label>Alimentează cardul<select name="cardId">${data.v14.cards.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label><label>Sumă<input name="amount" type="number" step="0.01" min="0.01" required></label><button class="btn w">Alimentează</button></form>`:''}`},
set(){return `<form id="of" class="card form"><h2 class="w">Solduri inițiale</h2><label>Card<input name="Card" type="number" step="0.01" value="${data.opening.Card}"></label><label>Numerar<input name="Numerar" type="number" step="0.01" value="${data.opening.Numerar}"></label><button class="btn w">Salvează</button></form>
<div class="card"><h2>Backup</h2><p style="color:var(--mu)">Datele stau doar pe acest dispozitiv. Nu urca backup-ul pe GitHub.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-act="backup">⬇ Descarcă backup JSON</button><label class="btn s" style="cursor:pointer;color:var(--ac)">⬆ Importă<input type="file" id="imp" accept=".json" hidden></label></div></div>`}};
function txRows(l,del){return l.map(t=>`<div class="row"><div>${esc(t.note||t.category||TYPES[t.type])}<small>${t.date} · ${TYPES[t.type]} · ${esc(String(t.account).replace('voucher:','🎟 '))}</small></div><div style="text-align:right"><b class="${CREDIT.includes(t.type)?'ok':t.type==='transfer'?'':'er'}">${CREDIT.includes(t.type)?'+':t.type==='transfer'?'':'−'}${money(t.amount)}</b>${del?`<div><button class="btn d" data-edit="${esc(t.id)}">✎</button><button class="btn d" data-dup="${esc(t.id)}" aria-label="Duplică">⧉</button><button class="btn d" data-del="${esc(t.id)}" aria-label="Șterge">🗑</button></div>`:''}</div></div>`).join('')||'<div class="empty">Nicio operațiune.</div>'}

