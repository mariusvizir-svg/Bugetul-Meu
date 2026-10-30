/* V22: Card editing/archiving, and person/creditor ledger. Storage key unchanged. */
(()=>{'use strict';
const E=id=>document.getElementById(id), text=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Math.round((Number(v)||0)*100)/100, fmt=v=>money(num(v)), cards=()=>data.v14?.cards||[], moves=()=>data.v14?.cardMoves||[];
const uuid=()=>('v22_'+Date.now()+'_'+Math.random().toString(36).slice(2));
const editor=document.createElement('dialog');editor.className='v22-modal';editor.innerHTML=`<form id="v22CardForm"><h2>Editează cardul</h2><label>Denumire<input name="name" required maxlength="60"></label><label>Tip<select name="type"><option value="meal">Card de masă</option><option value="gift">Card cadou</option><option value="other">Alt beneficiu</option></select></label><label>Emitent<input name="issuer" maxlength="70"></label><label>Sold inițial (lei)<input name="opening" type="number" step="0.01" min="0" required></label><p class="muted">Soldul inițial poate fi corectat; alimentările și plățile deja efectuate se păstrează.</p><div class="actions"><button type="button" class="btn secondary" id="v22Cancel">Anulează</button><button type="submit" class="btn">Salvează</button></div></form>`;
document.body.appendChild(editor);
let editing=null;
E('v22Cancel').onclick=()=>editor.close();
function cardBalance(c){const m=moves().filter(t=>t.cardId===c.id).reduce((a,t)=>a+(t.kind==='load'?1:-1)*num(t.amount),0);const expenses=(data.transactions||[]).filter(t=>t.type==='expense'&&t.account==='voucher:'+c.id).reduce((a,t)=>a+num(t.amount),0);return num(c.opening)+m-expenses}
const cardList=E('v14CardList');
function actions(){
 if(!cardList)return;
 const rows=[...cardList.querySelectorAll('.v14-row')];
 const items=cards();
 rows.forEach((row,i)=>{
   const c=items[i];if(!c)return;
   const old=row.querySelector('[data-v14delcard]');if(old)old.remove();
   row.querySelector('.v22-card-actions')?.remove();
   const div=document.createElement('div');div.className='v22-card-actions';
   div.innerHTML=`<button type="button" data-v22edit="${text(c.id)}">Editează</button><button type="button" data-v22archive="${text(c.id)}">${c.archived?'Reactivează':'Arhivează'}</button><button type="button" class="danger" data-v22delete="${text(c.id)}">Șterge</button>`;
   row.append(div);if(c.archived)row.style.opacity='.62';else row.style.opacity='';
 });
}
cardList?.addEventListener('click',e=>{
 const btn=e.target.closest('[data-v22edit],[data-v22archive],[data-v22delete]');if(!btn)return;
 const id=btn.dataset.v22edit||btn.dataset.v22archive||btn.dataset.v22delete,c=cards().find(x=>String(x.id)===String(id));if(!c)return;
 if(btn.hasAttribute('data-v22edit')){
   editing=id;for(const key of ['name','type','issuer','opening'])editor.querySelector('[name="'+key+'"]').value=c[key]??(key==='opening'?0:'');editor.showModal();return;
 }
 if(btn.hasAttribute('data-v22archive')){
   c.archived=!c.archived;persist();refresh();return;
 }
 if(btn.hasAttribute('data-v22delete')){
   const hasMoves=moves().some(t=>String(t.cardId)===String(id));
   const hasOps=(data.transactions||[]).some(t=>t.account==='voucher:'+id);
   if(hasMoves||hasOps){alert('Cardul are operațiuni și nu poate fi șters fără a altera istoricul financiar. Folosește „Arhivează” pentru a-l scoate din lista cardurilor active, păstrând tranzacțiile.');return;}
   if(!confirm('Ștergi definitiv cardul „'+c.name+'”?'))return;
   data.v14.cards=cards().filter(x=>String(x.id)!==String(id));persist();refresh();
 }
});
E('v22CardForm').addEventListener('submit',e=>{
 e.preventDefault();const c=cards().find(x=>String(x.id)===String(editing));if(!c)return;
 const f=e.target,opening=num(f.elements.opening.value),oldBalance=cardBalance(c);if(opening<0||!Number.isFinite(opening))return alert('Sold inițial invalid.');
 const future=num(oldBalance+opening-num(c.opening));if(future < -0.001&&!confirm('Cu acest sold inițial, cardul va avea sold negativ ('+fmt(future)+'). Continui?'))return;
 c.name=f.elements.name.value.trim();c.type=f.elements.type.value;c.issuer=f.elements.issuer.value.trim();c.opening=opening;
 editor.close();persist();refresh();
});
// Keep archived cards out of new payment selection while preserving their history.
function refresh(){
 // v14 and v20 select population occurs during each render; strip archived options afterwards.
 const selection=E('txAccount');if(selection){for(const c of cards().filter(c=>c.archived)){const opt=[...selection.options].find(o=>o.value==='voucher:'+c.id);if(opt)opt.remove();}}
 const cardSelect=E('v14CardSelect');if(cardSelect){for(const c of cards().filter(c=>c.archived)){const opt=[...cardSelect.options].find(o=>o.value===String(c.id));if(opt)opt.remove();}}
 const mini=E('v20Cards');if(mini)for(const c of cards().filter(c=>c.archived)){[...mini.querySelectorAll('[data-v20card]')].find(el=>el.dataset.v20card===String(c.id))?.remove()}
 actions();drawLedger();
}
const normalize=s=>String(s||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('ro-RO');
function entries(){
 const map=new Map();
 function person(name){const key=normalize(name)||'necunoscut';if(!map.has(key))map.set(key,{name:name||'Necunoscut',borrowed:0,returned:0,lent:0,collected:0,details:[],flags:new Set()});return map.get(key)}
 for(const d of data.debts||[]){const p=person(d.name);p.borrowed+=num(d.amount);p.flags.add('Creditor / datorie');p.details.push({date:'—',name:'Sold inițial datorie',amount:num(d.amount),direction:'Primit / datorat'});for(const t of data.transactions||[]){if(t.type==='debt'&&String(t.debtId)===String(d.id)){p.returned+=num(t.amount);p.details.push({date:t.date,name:t.note||'Rambursare datorie',amount:num(t.amount),direction:'Restituit'})}}}
 for(const l of data.loans||[]){const p=person(l.person||l.name);const borrowed=l.direction==='borrowed';p.flags.add('Împrumuturi');if(borrowed)p.borrowed+=num(l.amount);else p.lent+=num(l.amount);
 p.details.push({date:l.date,name:borrowed?'Împrumut primit':'Împrumut acordat',amount:num(l.amount),direction:borrowed?'Primit':'Acordat'});
 for(const t of data.transactions||[]){if(String(t.loanId)!==String(l.id))continue;if(t.type==='loan_repay'){p.returned+=num(t.amount);p.details.push({date:t.date,name:t.note||'Rambursare împrumut',amount:num(t.amount),direction:'Restituit'});}if(t.type==='loan_collect'){p.collected+=num(t.amount);p.details.push({date:t.date,name:t.note||'Recuperare împrumut',amount:num(t.amount),direction:'Recuperat'});}}
 }
 return [...map.values()].map(p=>({...p,borrowed:num(p.borrowed),returned:num(p.returned),lent:num(p.lent),collected:num(p.collected),owe:num(p.borrowed-p.returned),receivable:num(p.lent-p.collected)})).sort((a,b)=>Math.abs(b.owe)+Math.abs(b.receivable)-Math.abs(a.owe)-Math.abs(a.receivable));
}
function drawLedger(){
 const list=E('v22People'),summary=E('v22Summary');if(!list||!summary)return;
 const all=entries(),q=normalize(E('v22Search')?.value);const people=all.filter(p=>normalize(p.name).includes(q));
 const owe=all.reduce((a,p)=>a+p.owe,0),rec=all.reduce((a,p)=>a+p.receivable,0);
 summary.innerHTML=`<div class="v22-sum"><span>Total de dat</span><strong class="red">${fmt(owe)}</strong></div><div class="v22-sum"><span>Total de primit</span><strong class="green">${fmt(rec)}</strong></div><div class="v22-sum"><span>Sold net (de primit − de dat)</span><strong>${fmt(rec-owe)}</strong></div>`;
 list.innerHTML=people.length?people.map(p=>{
  const detail=p.details.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const side=(label,a,b,rest,credit)=>`<div class="v22-ledger"><b>${label}</b><div><span>${credit?'Am acordat':'Am primit / datorat'}</span><strong>${fmt(a)}</strong></div><div><span>${credit?'Am recuperat':'Am restituit'}</span><strong>${fmt(b)}</strong></div><div class="v22-due"><span>${credit?'Rămas de primit':'Rămas de dat'}</span><strong class="${credit?'green':'red'}">${fmt(rest)}</strong></div></div>`;
  return `<article class="v22-person"><h3>${text(p.name)}</h3><div class="v22-type">${text([...p.flags].join(' · '))}</div><div class="v22-columns">${side('Datorii și bani primiți',p.borrowed,p.returned,p.owe,false)}${side('Bani împrumutați altora',p.lent,p.collected,p.receivable,true)}</div><details><summary>Istoric detaliat (${detail.length} operațiuni)</summary>${detail.map(t=>`<div class="v22-line"><span>${text(t.date)}</span><span>${text(t.direction)} · ${text(t.name)}</span><strong>${fmt(t.amount)}</strong></div>`).join('')}</details></article>`;
 }).join(''):'<div class="empty">Nu există persoane sau creditori pentru căutarea curentă.</div>';
}
E('v22Search')?.addEventListener('input',drawLedger);
E('v22BalancesCSV')?.addEventListener('click',()=>{
 const rows=[['Persoană','Primit/Datorat','Restituit','Rămas de dat','Acordat','Recuperat','Rămas de primit'],...entries().map(p=>[p.name,p.borrowed,p.returned,p.owe,p.lent,p.collected,p.receivable])];
 const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='solduri-persoane-'+localDate()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
const oldRender=render;render=function(){oldRender();refresh()};
const version=document.querySelector('.version-pill');if(version)version.textContent='V22';
refresh();
})();
