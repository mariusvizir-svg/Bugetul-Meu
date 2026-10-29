/* V12 enhancement. Preserves existing data schema and localStorage key. */
(function(){
'use strict';
const $v=id=>document.getElementById(id);
const safeText=x=>esc(String(x??''));
const n=x=>Number(x)||0;
const toMonthDate=(y,m,d)=>new Date(y,m,Math.min(d,new Date(y,m+1,0).getDate()));
function nextDate(day,from){const y=from.getFullYear(),m=from.getMonth();let date=toMonthDate(y,m,day);if(date<new Date(y,m,from.getDate()))date=toMonthDate(y,m+1,day);return date}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function detail(label,sub,amount,positive){return '<div class="v12-row"><div><b>'+safeText(label)+'</b><small>'+safeText(sub)+'</small></div><div class="v12-amount '+(positive?'pos':'neg')+'">'+money(amount)+'</div></div>'}
function calc(){
 const d=data.v11||{plans:[],vouchers:[],goals:[]};const plans=Array.isArray(d.plans)?d.plans:[];
 const vouchers=Array.isArray(d.vouchers)?d.vouchers:[];const goals=Array.isArray(d.goals)?d.goals:[];
 const today=new Date();today.setHours(0,0,0,0);const stop=new Date(today);stop.setDate(stop.getDate()+30);
 const upcoming=[];
 for(const p of plans){const day=Number(p.day);if(!Number.isInteger(day)||day<1||day>31)continue;const date=nextDate(day,today);if(date<=stop)upcoming.push({...p,next:iso(date)});}
 upcoming.sort((a,b)=>a.next.localeCompare(b.next));
 const b=balances();
 const voucherBalance=(acc)=>vouchers.filter(t=>t.account===acc).reduce((a,t)=>a+(t.kind==='load'?1:-1)*n(t.amount),0);
 const saved=goals.reduce((sum,g)=>sum+(g.moves||[]).reduce((a,m)=>a+(m.kind==='deposit'?1:-1)*n(m.amount),0),0);
 const incoming=upcoming.filter(x=>x.kind==='income').reduce((a,x)=>a+n(x.amount),0);
 const outgoing=upcoming.filter(x=>x.kind==='expense').reduce((a,x)=>a+n(x.amount),0);
 return{upcoming,b,meal:voucherBalance('meal'),gift:voucherBalance('gift'),saved,incoming,outgoing};
}
function metric(title,value,note){return '<div class="v12-metric"><small>'+safeText(title)+'</small><strong>'+money(value)+'</strong><em>'+safeText(note)+'</em></div>'}
function draw(){const root=$v('v12Metrics');if(!root)return;const x=calc();const cash=n(x.b.Card)+n(x.b.Numerar);
 root.innerHTML=metric('Disponibil card + numerar',cash,'Sold efectiv din operațiunile înregistrate')+metric('Încasări planificate · 30 zile',x.incoming,'Nu sunt încă încasate')+metric('Plăți planificate · 30 zile',x.outgoing,'Nu sunt încă achitate');
 $v('v12Upcoming').innerHTML=x.upcoming.length?x.upcoming.map(p=>detail(p.title,p.next+' · '+(p.kind==='income'?'Încasare planificată':'Plată planificată'),n(p.amount),p.kind==='income')).join(''):'<div class="v12-empty">Nu ai încasări sau plăți planificate în următoarele 30 de zile.</div>';
 $v('v12Accounts').innerHTML=detail('Card bancar','Sold disponibil',n(x.b.Card),true)+detail('Numerar','Sold disponibil',n(x.b.Numerar),true)+detail('Tichete de masă','Sold separat, utilizare limitată',x.meal,true)+detail('Card cadou','Sold separat',x.gift,true)+detail('Economii urmărite','Nu scad automat din soldul bancar',x.saved,true);
}
// Keep original render logic, add the V12 overview without affecting transaction calculations.
const priorRender=render;
render=function(){priorRender();draw()};
$v('month').addEventListener('change',draw);
document.addEventListener('click',e=>{const element=e.target.closest('button');if(element&&element.getAttribute('onclick')?.includes('v12overview'))requestAnimationFrame(draw)});
draw();
})();
