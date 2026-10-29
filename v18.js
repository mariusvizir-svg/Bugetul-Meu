/* V18 dashboard charts: pie / donut widgets */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const chartColors=['#2563eb','#0f766e','#f59e0b','#7c3aed','#ef4444','#06b6d4','#84cc16','#ec4899'];
 const safe=s=>typeof esc==='function'?esc(String(s??'')):String(s??'');
 function fmt(n){return typeof money==='function'?money(Number(n)||0):String(Number(n)||0)}
 function total(list){return list.reduce((a,b)=>a+(Number(b.value)||0),0)}
 function topItems(items,limit=6){return items.filter(x=>(Number(x.value)||0)>0).sort((a,b)=>b.value-a.value).slice(0,limit)}
 function polar(cx,cy,r,angle){const rad=(angle-90)*Math.PI/180;return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}}
 function arcPath(cx,cy,r,start,end){const s=polar(cx,cy,r,end),e=polar(cx,cy,r,start);const large=end-start<=180?0:1;return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${large} 0 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`}
 function donutSvg(items,centerTitle,centerValue){
   const filtered=items.filter(x=>x.value>0);
   if(!filtered.length)return `<div class="pie-empty">Nu există suficiente date pentru grafic în luna selectată.</div>`;
   const sumV=total(filtered)||1, radius=46, stroke=24, cx=72, cy=72;
   let start=0;
   const slices=filtered.map((item,idx)=>{
     const angle=(item.value/sumV)*360;
     const end=start+angle;
     const p=`<path d="${arcPath(cx,cy,radius,start,end)}" stroke="${item.color||chartColors[idx%chartColors.length]}" stroke-width="${stroke}" stroke-linecap="butt" fill="none"></path>`;
     start=end;
     return p;
   }).join('');
   const svg = `<svg class="pie-chart" viewBox="0 0 144 144" role="img" aria-label="Grafic tip plăcintă"><circle cx="72" cy="72" r="46" fill="none" stroke="#e9eef5" stroke-width="24"></circle>${slices}<circle cx="72" cy="72" r="27" fill="#fff"></circle><text x="72" y="64" text-anchor="middle" font-size="9" fill="#6b7b90">${safe(centerTitle)}</text><text x="72" y="82" text-anchor="middle" font-size="12" font-weight="800" fill="#16263d">${safe(centerValue)}</text></svg>`;
   return svg;
 }
 function legend(items, grandTotal){
   return `<div class="pie-legend">${items.map((item,idx)=>`<div class="pie-legend-item"><span class="pie-dot" style="background:${item.color||chartColors[idx%chartColors.length]}"></span><span class="pie-name">${safe(item.name)}</span><span class="pie-value">${fmt(item.value)}<br><small>${grandTotal?Math.round(item.value/grandTotal*100):0}%</small></span></div>`).join('')}</div>`;
 }
 function card(title,sub,items,centerTitle,centerValue,foot){
   const filtered=items.filter(x=>x.value>0);
   const gTotal=total(filtered);
   return `<div class="pie-card"><h3>${safe(title)}</h3><div class="muted">${safe(sub)}</div><div class="pie-layout"><div class="pie-visual">${donutSvg(filtered,centerTitle,centerValue)}</div>${filtered.length?legend(filtered,gTotal):'<div class="pie-empty">Nu ai date pentru această secțiune.</div>'}</div><div class="pie-foot">${safe(foot)}</div></div>`;
 }
 function ticketItems(){
   const cards=((data||{}).v14||{}).cards||[];
   const moves=((data||{}).v14||{}).cardMoves||[];
   function balance(c){
     const opening=Number(c.opening)||0;
     const diff=moves.filter(t=>t.cardId===c.id).reduce((sum,t)=>sum + ((t.kind==='load'?1:-1)*(Number(t.amount)||0)),0);
     const paid=data.transactions.filter(t=>t.type==='expense'&&t.account==='voucher:'+c.id).reduce((sum,t)=>sum+(Number(t.amount)||0),0);return Math.round((opening+diff-paid)*100)/100;
   }
   return cards.map(c=>({name:c.name, value:balance(c)})).filter(x=>x.value>0);
 }
 function ensureWrap(){
   const dash=$('dashboard'); if(!dash) return null;
   let wrap=$('v18DashboardCharts');
   if(!wrap){
     wrap=document.createElement('div');
     wrap.id='v18DashboardCharts';
     wrap.className='pie-grid';
     const anchor=dash.querySelector('.monthly-v2')||dash.querySelector('#statCards');
     if(anchor) anchor.insertAdjacentElement('afterend',wrap); else dash.appendChild(wrap);
   }
   return wrap;
 }
 const prev=renderDashboard;
 renderDashboard=function(){
   prev();
   const wrap=ensureWrap(); if(!wrap) return;
   const inc=Number(sum(byType(month(),'income')))||0;
   const exp=Number(sum(byType(month(),'expense')))||0;
   const debt=Number(sum(byType(month(),'debt')))||0;
   const save=Math.max(0, inc-exp-debt);
   const b=typeof balances==='function'?balances():{Card:0,Numerar:0};
   const expenseItems=topItems(expenseCategories.map((name,idx)=>({name,value:Number(totalCat(month(),name))||0,color:chartColors[idx%chartColors.length]})),6);
   const flowItems=topItems([
     {name:'Cheltuieli de trai', value:exp, color:'#ef4444'},
     {name:'Rambursări datorii', value:debt, color:'#3b82f6'},
     {name:'Economisire netă', value:save, color:'#10b981'}
   ],6);
   const funds=[
     {name:'Card bancar', value:Number(b.Card)||0, color:'#2563eb'},
     {name:'Numerar', value:Number(b.Numerar)||0, color:'#7c3aed'},
     ...ticketItems().map((x,i)=>({name:x.name,value:x.value,color:chartColors[(i+2)%chartColors.length]}))
   ].filter(x=>x.value>0);
   wrap.innerHTML =
     card('Plăcintă cheltuieli','Unde se duc banii în luna selectată',expenseItems,'Total',fmt(exp),'Primele categorii de cheltuieli. Dacă nu vezi o categorie, înseamnă că nu are sume luna aceasta sau nu intră în top.')+
     card('Plăcintă flux lunar','Cum se împarte venitul acestei luni',flowItems,'Venituri',fmt(inc),inc>0?'Compară imediat cât consumi, cât plătești la datorii și cât reușești să păstrezi.':'Adaugă venituri pentru a vedea împărțirea lunară a banilor.')+
     card('Plăcintă disponibil','Cum sunt împărțiți banii disponibili',funds,'Disponibil',fmt((Number(b.Card)||0)+(Number(b.Numerar)||0)),'Include Card, Numerar și cardurile de bonuri/tichete configurate în aplicație.');
   const pill=document.querySelector('.version-pill'); if(pill) pill.textContent='V19';
  };
  if(document.readyState!=='loading') renderDashboard();
})();
