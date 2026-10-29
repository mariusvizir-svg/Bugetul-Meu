/* V15 UI enhancement. Existing transaction schema untouched. */
(()=>{
 'use strict';
 const $id=id=>document.getElementById(id);
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const navTarget=$id('more')||$id('dashboard');
 if(navTarget){const links=document.createElement('div');links.className='v15-jump';links.id='v15QuickLinks';links.innerHTML=`<button data-v15page="v14accounts"><span>💳</span>Carduri tichete</button><button data-v15page="v14operators"><span>👥</span>Operatori</button><button data-v15page="v14report"><span>▤</span>Raport complet</button>`;navTarget.insertBefore(links,navTarget.firstChild);links.addEventListener('click',e=>{const b=e.target.closest('[data-v15page]');if(b){setTab(b.dataset.v15page);window.scrollTo(0,0)}})}
 const dashboard=$id('dashboard');
 const explanation=document.createElement('div');explanation.className='v15-explain';explanation.id='v15BalanceExplain';explanation.setAttribute('aria-live','polite');
 const hero=dashboard?.querySelector('.hero-v2');if(hero)hero.insertAdjacentElement('afterend',explanation);
 const priorDashboard=renderDashboard;
 renderDashboard=function(){priorDashboard();if(!explanation.isConnected)return;
   const opening=data.opening||{Card:0,Numerar:0};
   const movements={Card:0,Numerar:0};
   for(const t of data.transactions||[]){let a=Number(t.amount)||0;if(!Number.isFinite(a))continue;
     if(t.type==='transfer'){if(t.account in movements)movements[t.account]-=a;if(t.to in movements)movements[t.to]+=a}
     else if(t.account in movements){movements[t.account]+=['income','loan_received','loan_collect'].includes(t.type)?a:-a}
   }
   const b=balances();let total=(b.Card||0)+(b.Numerar||0);
   explanation.innerHTML='<header><h3>De unde vine soldul?</h3><button class="btn secondary small" type="button" data-v15balances>Detalii</button></header>'+
   '<div class="v15-money-line"><span>Sold inițial Card + Numerar</span><b>'+money((Number(opening.Card)||0)+(Number(opening.Numerar)||0))+'</b></div>'+
   '<div class="v15-money-line"><span>Mișcări înregistrate de la început</span><b>'+money(movements.Card+movements.Numerar)+'</b></div>'+
   '<div class="v15-money-line"><strong>Disponibil calculat</strong><strong class="'+(total<0?'red':'green')+'">'+money(total)+'</strong></div>'+
   '<p class="v15-caption">Transferurile între card și numerar nu schimbă totalul. Dacă soldul nu corespunde realității, verifică soldurile inițiale și operațiunile introduse.</p>';
   explanation.querySelector('[data-v15balances]').onclick=()=>{if(typeof v9OpenDetail==='function')v9OpenDetail('balance');else setTab('settings')};
 };
 let kind='all';
 function newHistory(){const el=$id('historyTable');if(!el)return;
  const q=($id('searchTx')?.value||'').toLowerCase().trim();
  const legacyType=$id('filterType')?.value||'all';
  let list=sortedTx(month()).filter(t=>{const ttype=kind==='all'?legacyType:kind;return (ttype==='all'||t.type===ttype)&&`${t.note||''} ${txLabel(t)} ${t.account||''}`.toLowerCase().includes(q)});
  let lastDate='';let html='';
  for(const t of list){let day=t.date||'Fără dată';if(day!==lastDate){html+='<div class="v15-day">'+safe(day)+'</div>';lastDate=day}
   let credit=['income','loan_received','loan_collect'].includes(t.type),transfer=t.type==='transfer';
   let symbol=transfer?'⇄':credit?'↙':'↗';
   let title=txLabel(t)||'Operațiune',sub=(t.note||'')+' · '+(t.account||'');
   html+='<article class="v15-item"><div class="v15-symbol">'+symbol+'</div><div class="v15-main"><strong>'+safe(title)+'</strong><small>'+safe(sub)+'</small></div><div class="v15-side '+(credit?'green':transfer?'':'red')+'">'+(credit?'+':transfer?'':'−')+money(t.amount)+'</div></article>';
  }
  el.innerHTML=html||'<div class="v15-empty"><strong>Nicio operațiune în această selecție</strong>Adaugă o tranzacție sau schimbă filtrele.</div>';
 }
 const historyPanel=$id('history');if(historyPanel){let bar=document.createElement('div');bar.className='v15-chips';bar.id='v15Filters';let chips=[['all','Toate'],['income','Venituri'],['expense','Cheltuieli'],['debt','Rambursări'],['transfer','Transferuri'],['loan_lent','Împrumuturi']];bar.innerHTML=chips.map(([id,label])=>'<button type="button" data-v15kind="'+id+'" class="'+(id==='all'?'selected':'')+'">'+label+'</button>').join('');const search=$id('searchTx');const heading=search?.closest('.surface')||historyPanel;$id('historyTable').parentNode.insertBefore(bar,$id('historyTable'));bar.onclick=e=>{const btn=e.target.closest('[data-v15kind]');if(!btn)return;kind=btn.dataset.v15kind;bar.querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b===btn));newHistory()};search?.addEventListener('input',()=>queueMicrotask(newHistory));$id('filterType')?.addEventListener('change',()=>queueMicrotask(newHistory));}
 const renderPrior=render;render=function(){renderPrior();newHistory()};
 render();
})();
