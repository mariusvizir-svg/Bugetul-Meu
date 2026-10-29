/* V13 visual calendar and navigation; no changes to financial data or storage */
(function(){'use strict';
const el=id=>document.getElementById(id);
const encode=s=>esc(String(s??''));
const fmt=x=>money(Number(x)||0);
let selectedDay=null;
function drawCalendar(){
 const root=el('v13Calendar');if(!root)return;
 const current=el('month')?.value||new Date().toISOString().slice(0,7);
 if(!/^\d{4}-\d{2}$/.test(current))return;
 const [y,m]=current.split('-').map(Number);const first=new Date(y,m-1,1);const length=new Date(y,m,0).getDate();
 const shift=(first.getDay()+6)%7;const plans=Array.isArray(data.v11?.plans)?data.v11.plans:[];
 const today=new Date();const sameMonth=today.getFullYear()===y&&today.getMonth()+1===m;
 if(!selectedDay||selectedDay>length)selectedDay=Math.min(today.getDate(),length);
 let html='';for(let n=0;n<Math.ceil((shift+length)/7)*7;n++){
 const day=n-shift+1;if(day<1||day>length){html+='<span class="v13-day outside"></span>';continue;}
 const events=plans.filter(p=>Math.min(Number(p.day)||1,length)===day);
 const isToday=sameMonth&&today.getDate()===day;
 html+='<button type="button" class="v13-day'+(isToday?' today':'')+(selectedDay===day?' selected':'')+'" data-v13day="'+day+'" aria-label="Ziua '+day+', '+events.length+' evenimente"><span class="v13-num">'+day+'</span><span class="v13-pips">'+events.slice(0,4).map(p=>'<i class="v13-pip '+(p.kind==='expense'?'expense':'')+'"></i>').join('')+'</span></button>';
 }
 root.innerHTML=html;const chosen=plans.filter(p=>Math.min(Number(p.day)||1,length)===selectedDay);
 el('v13CalendarSelection').innerHTML='<b>Ziua '+selectedDay+' '+new Intl.DateTimeFormat('ro-RO',{month:'long'}).format(first)+'</b>'+(chosen.length?chosen.map(p=>'<div class="v13-event"><span>'+encode(p.title)+' <small>('+ (p.kind==='income'?'încasare':'plată')+')</small></span><b>'+fmt(p.amount)+'</b></div>').join(''):'<p class="muted">Niciun eveniment planificat în această zi.</p>');
}
el('v13Calendar')?.addEventListener('click',e=>{const day=e.target.closest('[data-v13day]');if(day){selectedDay=Number(day.dataset.v13day);drawCalendar()}});
el('month')?.addEventListener('change',()=>{selectedDay=null;drawCalendar()});
const oldRender=render;render=function(){oldRender();drawCalendar()};
// After a new planned event is saved, the existing V11 handler persists; refresh calendar.
el('v11PlanForm')?.addEventListener('submit',()=>setTimeout(drawCalendar,0));
drawCalendar();
})();