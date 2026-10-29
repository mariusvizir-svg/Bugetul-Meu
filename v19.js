/* V19: charts for Reports + printable detailed report (no external libraries) */
(()=>{
 'use strict';
 const el=id=>document.getElementById(id);
 const colors=['#2563eb','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#64748b'];
 const fmt=v=>money(Math.round((Number(v)||0)*100)/100);
 const safe=v=>esc(String(v??''));
 const val=v=>Number(v)||0;
 const entries=(data)=>data.filter(x=>x.value>0);
 function donut(items){
  const total=items.reduce((v,x)=>v+x.value,0);
  if(total<=0)return '<div class="pie-empty">Nicio operațiune în această perioadă</div>';
  let start=0;
  const paths=items.map((o,i)=>{const size=o.value/total*100;const a=start;start+=size;return `${o.color||colors[i%colors.length]} ${a}% ${start}%`}).join(',');
  return `<div class="v19-donut" role="img" aria-label="Grafic circular" style="border-radius:50%;background:conic-gradient(${paths});display:grid;place-items:center"><div style="width:60%;height:60%;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;color:#193c71;font-size:12px;font-weight:800">${fmt(total)}</div></div>`;
 }
 function legend(items){const total=items.reduce((s,x)=>s+x.value,0);return `<div class="v19-chart-legend">${items.map((x,i)=>`<div class="v19-row"><span class="v19-dot" style="background:${x.color||colors[i%colors.length]}"></span><span>${safe(x.name)} <small>${total?Math.round(x.value/total*100):0}%</small></span><span class="v19-value">${fmt(x.value)}</span></div>`).join('')}</div>`}
 function chart(title,caption,items){return `<section class="v19-chart"><h3>${safe(title)}</h3><div class="v19-help">${safe(caption)}</div><div class="v19-donut-layout">${donut(items)}${legend(items)}</div></section>`}
 function getMonthRows(){const [y,m]=month().split('-').map(Number);return Array.from({length:6},(_,i)=>{const d=new Date(y,m-1-(5-i),1);const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');return {key,label:new Intl.DateTimeFormat('ro-RO',{month:'short'}).format(d),income:val(sum(byType(key,'income'))),expense:val(sum(byType(key,'expense'))),debt:val(sum(byType(key,'debt')))}})}
 function monthly(){const list=getMonthRows(),max=Math.max(1,...list.flatMap(x=>[x.income,x.expense,x.debt]));return `<section class="v19-chart"><h3>Comparație pe 6 luni</h3><div class="v19-help">Venituri, cheltuieli de trai și rambursări</div><div class="v19-bar-group">${list.map(x=>`<div class="v19-month"><b>${safe(x.label)}</b><div class="v19-bars">${[['income','#10b981'],['expense','#ef4444'],['debt','#2563eb']].map(([k,c])=>`<div class="v19-track" title="${safe(k)}: ${fmt(x[k])}"><span style="width:${x[k]/max*100}%;background:${c}"></span></div>`).join('')}</div></div>`).join('')}</div><div class="v19-axis"><span><i style="background:#10b981"></i>Venituri</span><span><i style="background:#ef4444"></i>Trai</span><span><i style="background:#2563eb"></i>Rambursări</span></div></section>`}
 function makeCharts(){
  const exp=val(sum(byType(month(),'expense'))),repay=val(sum(byType(month(),'debt'))),income=val(sum(byType(month(),'income')));
  const category=entries(expenseCategories.map(c=>({name:c,value:val(totalCat(month(),c))}))).sort((a,b)=>b.value-a.value);
  const top=category.slice(0,5);const other=category.slice(5).reduce((s,x)=>s+x.value,0);if(other>0)top.push({name:'Alte categorii',value:other});
  const flow=entries([{name:'Cheltuieli',value:exp,color:'#ef4444'},{name:'Rambursări',value:repay,color:'#2563eb'},{name:'Rămas din venit',value:Math.max(0,income-exp-repay),color:'#10b981'}]);
  return {screen:chart('Structura cheltuielilor','Pe categorii · luna '+month(),top)+chart('Împărțirea veniturilor','Rambursările nu sunt cheltuieli de trai',flow)+monthly(),print:chart('Cheltuieli pe categorii','Luna '+month(),top)+chart('Flux lunar','Încasări repartizate',flow)+monthly()};
 }
 function update(){
  const charts=makeCharts();
  const root=el('v19ReportsCharts');if(root)root.innerHTML=charts.screen;
  const detailed=el('v14ReportBody');if(detailed){let target=el('v19PrintCharts');if(!target){target=document.createElement('div');target.id='v19PrintCharts';target.className='v19-print-chart';detailed.insertBefore(target,detailed.firstChild)}target.innerHTML='<h3>Analiză vizuală</h3><div class="v19-charts">'+charts.print+'</div>'}
 }
 const report=el('reports');if(!report)return;
 const wrapper=document.createElement('div');wrapper.className='v19-charts-screen';wrapper.innerHTML='<div class="v19-heading"><h2>Grafice financiare</h2><span class="muted">Luna selectată</span></div><div class="v19-charts" id="v19ReportsCharts"></div>';
 report.insertBefore(wrapper,report.firstChild);
 // Report rendering from v14.js runs with persist; wrap render after all prior enhancements.
 const previous=render;
 render=function(){previous();update()};
 el('month')?.addEventListener('change',()=>queueMicrotask(update));
 el('v14Print')?.addEventListener('click',update,{capture:true});
 // Explicit print-with-charts action. Browser print lets the user save PDF on devices that support it.
 const bar=el('v14report')?.querySelector('.v14-toolbar');
 if(bar){const button=document.createElement('button');button.className='btn secondary';button.type='button';button.textContent='📊 PDF cu grafice';button.addEventListener('click',()=>{update();setTab('reports');window.print()});bar.appendChild(button)}
 window.addEventListener('beforeprint',update);
 update();
})();
