'use strict';
(() => {
 const C=window.PARTY_HISTORY_CATALOG;
 if(!C)return;
 const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const base=document.body.dataset.partyBase||'',year=Number(document.body.dataset.partyYear)||null;
 const knownYears=new Set(C.years.map(y=>y.year));
 const url=(y,id='')=>base+'year/'+y+'.html'+(id?'#'+encodeURIComponent(id):'');
 function toast(message){const box=$('#partyToast');if(!box)return;box.textContent=message;box.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{box.hidden=true;},3800);}
 $('#partyYearJump')?.addEventListener('change',e=>{const y=Number(e.target.value);if(knownYears.has(y))location.href=url(y);});
 let fullIndex=null,searchSequence=0;
 async function index(){return fullIndex??=fetch(base+'search-index.json?v=0.10.0').then(r=>{if(!r.ok)throw Error('index');return r.json();}).catch(e=>{fullIndex=null;throw e;});}
 async function search(){
  const input=$('#partySearch');if(!input)return;
  const q=input.value.trim().toLocaleLowerCase(),sequence=++searchSequence;
  const cards=[...document.querySelectorAll('[data-year-card]')],groups=[...document.querySelectorAll('.year-decade')],box=$('#partyGlobalMatches'),status=$('#partySearchStatus');
  if(!q){cards.forEach(c=>c.hidden=false);groups.forEach(g=>g.hidden=false);box.hidden=true;box.innerHTML='';status.textContent='共 '+C.counts.years+' 个年份，'+C.counts.events+' 项史事。选取主要事实，持续补充逐项证据。';return;}
  const matchedYears=new Set(cards.filter(c=>c.dataset.yearSearch.toLocaleLowerCase().includes(q)).map(c=>Number(c.dataset.yearCard)));
  let matches=[];let limited=false;
  try{matches=(await index()).filter(e=>[e.title,e.summary,e.year,e.date,e.category,...e.people].join(' ').toLocaleLowerCase().includes(q));matches.forEach(e=>matchedYears.add(e.year));}catch{limited=true;}
  if(sequence!==searchSequence)return;
  cards.forEach(c=>c.hidden=!matchedYears.has(Number(c.dataset.yearCard)));groups.forEach(g=>g.hidden=![...g.querySelectorAll('[data-year-card]')].some(c=>!c.hidden));
  status.textContent=matchedYears.size+' 个相关年份'+(!limited?' · '+matches.length+' 项史事匹配':' · 全文索引暂未载入，当前按年份、标题与人物索引检索，可重试');
  box.hidden=false;box.innerHTML=matches.length?'<div class="section-head"><h2>找到的史事</h2><p>显示前 '+Math.min(matches.length,60)+' 项，点击进入对应年度的具体位置。</p></div>'+matches.slice(0,60).map(e=>'<a class="search-event" href="'+url(e.year,e.id)+'"><span>'+E(e.year+' · '+e.date)+'</span><strong>'+E(e.title)+'</strong><small>'+E(e.summary.slice(0,90))+(e.summary.length>90?'…':'')+'</small><b>进入此年 →</b></a>').join(''):matchedYears.size?'<p class="source-note">以下年份与检索词相关，可进入查看具体史事。</p>':'<p class="empty">没有匹配的已录资料。可换用年份、全名或事件简称。</p>';
 }
 let debounce;
 $('#partySearch')?.addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(search,180);});
 $('#partySearchReset')?.addEventListener('click',()=>{$('#partySearch').value='';search();$('#partySearch').focus();});
 function filterEvents(){const q=($('#partyEventSearch')?.value||'').trim().toLocaleLowerCase(),category=$('#partyCategory')?.value||'all',events=[...document.querySelectorAll('.event[data-event-search]')];let n=0;for(const e of events){e.hidden=!((category==='all'||e.dataset.category===category)&&e.dataset.eventSearch.toLocaleLowerCase().includes(q));if(!e.hidden)n++;}if($('#partyEventStatus'))$('#partyEventStatus').textContent='显示 '+n+' / '+events.length+' 项史事'+(category!=='all'?' · '+category:'');if($('#partyEventEmpty'))$('#partyEventEmpty').hidden=n>0;}
 $('#partyEventSearch')?.addEventListener('input',filterEvents);$('#partyCategory')?.addEventListener('change',filterEvents);$('#partyEventReset')?.addEventListener('click',()=>{$('#partyEventSearch').value='';$('#partyCategory').value='all';filterEvents();});
 const query=new URLSearchParams(location.search);
 if(query.get('q')&&$('#partySearch')){$('#partySearch').value=query.get('q');search();}
 if(query.get('q')&&$('#partyEventSearch')){$('#partyEventSearch').value=query.get('q');filterEvents();}
 const sourceLinks=ids=>(ids||[]).map(id=>C.sources.find(s=>s.id===id)).filter(Boolean).map(s=>'<a href="'+E(s.url)+'" target="_blank" rel="noopener noreferrer">'+E(s.title)+' · '+E(s.author)+' ↗</a>').join('');
 function profile(name){
  const canonical=C.personAliases?.[name]||name,p=C.people.find(p=>p.name===canonical);if(!p)return;
  const all=p.occurrences,local=year?all.filter(e=>e.year===year):[],years=[...new Set(all.map(e=>e.year))];
  const links=list=>list.map(e=>'<a class="event-link" href="'+url(e.year,e.id)+'">'+E(e.year+' · '+e.date)+'<br><strong>'+E(e.title)+'</strong> →</a>').join('');
  $('#partyProfileBody').innerHTML='<p class="eyebrow">'+(p.overview?'人物介绍':'史事关联索引')+'</p><h2>'+E(name)+'</h2>'+(p.lifespan?'<p class="profile-meta">'+E(p.lifespan)+'</p>':'')+(p.overview?'<p>'+E(p.overview)+'</p>':'<p class="source-note">此处展示本库具体史事中具名的行动与关联，尚未整理独立生平。不能据事件年份推断生卒年或将关联等同于主导作用。</p>')+(p.contributions?.length?'<h3>重要贡献与代表事迹</h3><ul>'+p.contributions.map(c=>'<li>'+E(c)+'</li>').join('')+'</ul>':'')+(p.locator?'<div class="editorial-note">'+E(p.locator)+'</div>':'')+(p.sourceIds?.length?'<div class="source-links">'+sourceLinks(p.sourceIds)+'</div>':'')+(local.length?'<h3>与 '+year+' 年史事的关联</h3>'+links(local):'')+'<h3>沿年份追踪</h3><div class="people-year-list">'+years.map(y=>'<a href="'+url(y)+'">'+y+' 年 ↗</a>').join('')+'</div>'+(!local.length?links(all.slice(0,35)):'')+(all.length>35&&!local.length?'<p class="source-note">此处先列35项。可进入上方相关年份查看完整已录条目。</p>':'');
  const dialog=$('#partyProfile');if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
 }
 document.addEventListener('click',e=>{const p=e.target.closest('[data-party-person]');if(p)profile(p.dataset.partyPerson);else if(e.target.closest('#partyProfile a.event-link,#partyProfile .people-year-list a'))$('#partyProfile').close();});
 const dialog=$('#partyProfile');dialog?.querySelector('.close').addEventListener('click',()=>dialog.close());dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 if(query.get('name'))profile(query.get('name'));
 function filterPeople(){const q=($('#partyPeopleSearch')?.value||'').trim().toLocaleLowerCase(),scope=$('#partyPeopleScope')?.value||'all';let n=0;for(const card of document.querySelectorAll('#partyPeopleGrid [data-party-person]')){const p=C.people.find(p=>p.name===card.dataset.partyPerson);card.hidden=!(card.dataset.personSearch.toLocaleLowerCase().includes(q)&&(scope!=='profile'||Boolean(p?.overview)));if(!card.hidden)n++;}if($('#partyPeopleStatus'))$('#partyPeopleStatus').textContent='显示 '+n+' 位人物 · 独立介绍与史事索引分别标注';if($('#partyPeopleEmpty'))$('#partyPeopleEmpty').hidden=n>0;}
 $('#partyPeopleSearch')?.addEventListener('input',filterPeople);$('#partyPeopleScope')?.addEventListener('change',filterPeople);
 $('#partyCopyYear')?.addEventListener('click',async()=>{try{if(!navigator.clipboard?.writeText)throw Error('clipboard');const u=new URL(location.href);u.search='';u.hash='';await navigator.clipboard.writeText(u.href);toast('这一年的固定链接已复制');}catch{toast('当前浏览器限制复制，可直接复制地址栏中的年度网址');}});
 $('#partyPrint')?.addEventListener('click',()=>window.print());
})();
