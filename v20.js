/* V20: One unified expense entry for bank/cash and voucher cards. Existing storage schema preserved. */
(()=>{'use strict';
const get=id=>document.getElementById(id);
const voucherPrefix='voucher:';
const safe=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const cards=()=>Array.isArray(data.v14?.cards)?data.v14.cards:[];
const cardById=id=>cards().find(c=>String(c.id)===String(id));
const legacyKind=id=>id==='legacy:meal'?'meal':id==='legacy:gift'?'gift':null;
const legacyMoves=kind=>Array.isArray(data.v11?.vouchers)?data.v11.vouchers.filter(t=>t.account===kind):[];
const legacyBalance=kind=>Math.round((legacyMoves(kind).reduce((sum,t)=>sum+(t.kind==='load'?1:-1)*(Number(t.amount)||0),0)-data.transactions.filter(t=>t.type==='expense'&&t.account===voucherPrefix+'legacy:'+kind).reduce((sum,t)=>sum+(Number(t.amount)||0),0))*100)/100;
const voucherLabel=acc=>{const id=String(acc||'').slice(voucherPrefix.length);const kind=legacyKind(id);return kind?(kind==='meal'?'Card de masă (existent)':'Card cadou (existent)'):(cardById(id)?.name||'Card de tichete');};
const cardBalance=c=>{
 if(!c)return 0;
 let initial=Number(c.opening)||0;
 const moves=(data.v14?.cardMoves||[]).filter(t=>t.cardId===c.id).reduce((sum,t)=>sum+(t.kind==='load'?1:-1)*(Number(t.amount)||0),0);
 const spends=data.transactions.filter(t=>t.type==='expense'&&t.account===voucherPrefix+c.id).reduce((sum,t)=>sum+(Number(t.amount)||0),0);
 return Math.round((initial+moves-spends)*100)/100;
};
let versionLabel=document.querySelector('.version-pill');if(versionLabel)versionLabel.textContent='V21';
const accountField=get('txAccount');const accountLabel=get('accountLabel');
const cardHint=document.createElement('p');cardHint.id='v20AccountHint';cardHint.className='v20-account-hint';accountField.closest('.field').append(cardHint);
function updateAccounts(){
 const old=accountField.value;
 const expense=entryType==='expense';
 accountField.innerHTML='<option value="Card">💳 Card bancar</option><option value="Numerar">💵 Numerar</option>'+
 (expense?('<option value="voucher:legacy:meal">🎟 Card de masă (existent)</option><option value="voucher:legacy:gift">🎁 Card cadou (existent)</option>'+cards().map(c=>`<option value="${safe(voucherPrefix+c.id)}">🎟 ${safe(c.name)} (${safe(c.issuer||'Tichete')})</option>`).join('')):'');
 if([...accountField.options].some(x=>x.value===old))accountField.value=old;
 cardHint.textContent='';
 updateHint();
}
function updateHint(){const v=accountField.value;if(v.startsWith(voucherPrefix)){const id=v.slice(voucherPrefix.length),kind=legacyKind(id),c=cardById(id);cardHint.textContent=kind?'Disponibil pe '+voucherLabel(v)+': '+money(legacyBalance(kind))+'. Plata intră în Istoric și Rapoarte.':c?'Disponibil pe '+c.name+': '+money(cardBalance(c))+'. Plata intră în Istoric și Rapoarte.':'Cardul nu mai există.'}else cardHint.textContent=''}
accountField.addEventListener('change',updateHint);
const priorUpdate=updateType;updateType=function(t){priorUpdate(t);updateAccounts()};
const form=get('entryForm');
form.addEventListener('submit',event=>{
 if(entryType!=='expense'||!accountField.value.startsWith(voucherPrefix))return;
 const id=accountField.value.slice(voucherPrefix.length),kind=legacyKind(id),c=cardById(id);const amount=Math.round((Number(get('txAmount').value)||0)*100)/100;
 const available=kind?legacyBalance(kind):cardBalance(c);if(!(kind||c)||amount<=0||amount>available+0.001){event.preventDefault();event.stopImmediatePropagation();alert(!(kind||c)?'Cardul de bonuri nu există.':amount<=0?'Introdu o sumă pozitivă.':'Sold insuficient pe cardul selectat.');return;}
},true);
const oldRender=render;
render=function(){oldRender();updateHint();drawVoucherSummary()};
function drawVoucherSummary(){
 const root=get('v20Cards');if(!root)return;
 const cs=cards();
 const legacy=['meal','gift'].map(kind=>{const label=kind==='meal'?'Card de masă':'Card cadou',b=legacyBalance(kind);return `<button class="v20-mini-card" type="button" data-v20card="legacy:${kind}"><span>${kind==='gift'?'🎁':'🎟'} CARD EXISTENT</span><strong>${label}</strong><b>${money(b)}</b><small>Plătește acum →</small></button>`}).join('');
 root.innerHTML=legacy+cs.map(c=>`<button class="v20-mini-card" type="button" data-v20card="${safe(c.id)}"><span>🎟 ${safe(c.type==='meal'?'Masă':c.type==='gift'?'Cadou':'Beneficiu')}</span><strong>${safe(c.name)}</strong><b>${money(cardBalance(c))}</b><small>${safe(c.issuer||'Card de tichete')} · Plătește acum →</small></button>`).join('');
}
const dash=get('dashboard');
if(dash){const section=document.createElement('div');section.className='surface v20-accounts';section.innerHTML='<div class="section-head"><div><h2>Conturile mele</h2><p class="muted">Carduri de bonuri și solduri separate</p></div><button type="button" class="btn secondary small" id="v20ManageCards">Administrează</button></div><div id="v20Cards" class="v20-cards"></div>';
 const anchor=get('v18DashboardCharts')||dash.querySelector('.monthly-v2');(anchor||dash).insertAdjacentElement('afterend',section);
 get('v20ManageCards').addEventListener('click',()=>setTab('v14accounts'));
 section.addEventListener('click',e=>{const button=e.target.closest('[data-v20card]');if(!button)return;setTab('add');updateType('expense');accountField.value=voucherPrefix+button.dataset.v20card;updateHint()});
}
updateAccounts();render();
})();
