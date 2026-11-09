'use strict';
const partyLibrary = import('../reading-library.js?v=0.22.0').then(module => module.loadLibrary()).catch(() => null);
(() => {
 const C=window.PARTY_HISTORY_CATALOG;
 if(!C)return;
 const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const base=document.body.dataset.partyBase||'',year=Number(document.body.dataset.partyYear)||null;
 let readingDepth = {};
 let supplementalProfiles = {};
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
  try{matches=(await index()).filter(e=>[e.title,e.summary,e.year,e.date,e.category,...e.people,...(readingDepth.events?.[e.id]?.paragraphs || [])].join(' ').toLocaleLowerCase().includes(q));matches.forEach(e=>matchedYears.add(e.year));}catch{limited=true;}
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
 function depthArticle(entry, heading) {
  if (!entry?.paragraphs?.length) return '';
  const refs = entry.references || [];
  return '<section class="party-reading"><h3>' + E(heading) + '</h3>' +
   entry.paragraphs.map(paragraph => '<p>' + E(paragraph) + '</p>').join('') +
   (refs.length ? '<details class="event-evidence"><summary>补充正文的资料依据</summary>' +
    refs.map(ref => '<p>' + (/^https:\/\//.test(ref.url || '')
      ? '<a href="' + E(ref.url) + '" target="_blank" rel="noopener noreferrer">' + E(ref.label) + ' ↗</a>'
      : E(ref.label)) + (ref.note ? '<small>' + E(ref.note) + '</small>' : '') + '</p>').join('') + '</details>' : '') +
   '</section>';
 }
 let activeProfile;
 function profile(name){
  const canonical=C.personAliases?.[name]||name,p=C.people.find(p=>p.name===canonical);if(!p)return;
  activeProfile = canonical;
  const all=p.occurrences,local=year?all.filter(e=>e.year===year):[],years=[...new Set(all.map(e=>e.year))];
  const links=list=>list.map(e=>'<a class="event-link" href="'+url(e.year,e.id)+'">'+E(e.year+' · '+e.date)+'<br><strong>'+E(e.title)+'</strong> →</a>').join('');
  $('#partyProfileBody').innerHTML='<p class="eyebrow">'+(p.overview || supplementalProfiles[canonical]?'人物介绍':'史事关联索引')+'</p><h2>'+E(name)+'</h2>'+(p.lifespan?'<p class="profile-meta">'+E(p.lifespan)+'</p>':'')+(readingDepth.people?.[canonical] ? depthArticle(readingDepth.people[canonical], '生平与历史处境') : supplementalProfiles[canonical] ? '' : (p.overview?'<p>'+E(p.overview)+'</p>':'<p class="source-note">此处展示本库具体史事中具名的行动与关联，尚未整理独立生平。不能据事件年份推断生卒年或将关联等同于主导作用。</p>'))+(p.contributions?.length?'<h3>重要贡献与代表事迹</h3><ul>'+p.contributions.map(c=>'<li>'+E(c)+'</li>').join('')+'</ul>':'')+(p.locator?'<div class="editorial-note">'+E(p.locator)+'</div>':'')+(p.sourceIds?.length?'<div class="source-links">'+sourceLinks(p.sourceIds)+'</div>':'')+(local.length?'<h3>与 '+year+' 年史事的关联</h3>'+links(local):'')+'<h3>沿年份追踪</h3><div class="people-year-list">'+years.map(y=>'<a href="'+url(y)+'">'+y+' 年 ↗</a>').join('')+'</div>'+(!local.length?links(all.slice(0,35)):'')+(all.length>35&&!local.length?'<p class="source-note">此处先列35项。可进入上方相关年份查看完整已录条目。</p>':'');
  const body = $('#partyProfileBody');
  body.querySelector('h2').insertAdjacentHTML('afterend',
   '<atlas-reading data-ids="party-person:' + E(canonical) + '"></atlas-reading>');
  const biography = readingDepth.leaders?.[canonical];
  if (biography) body.insertAdjacentHTML('beforeend', '<p><a class="event-link" href="' +
   E(base + biography) + '">打开' + E(canonical) + '个人纪年 ↗</a></p>');
  const dialog=$('#partyProfile');if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
  const highlights = local.length ? local.slice(0, 3) : all.length <= 4 ? all
   : [all[0], all[Math.floor(all.length / 3)], all[Math.floor(all.length * 2 / 3)], all[all.length - 1]];
  if (highlights.length) {
   const context = document.createElement('section');
   context.className = 'party-reading';
   const heading = body.querySelector('.party-reading, .editorial-note, .source-links');
   if (heading) heading.after(context);
   else body.querySelector('h2').after(context);
   index().then(rows => {
    if (!context.isConnected || !dialog.open || activeProfile !== canonical) return;
    const chosen = highlights.map(item => rows.find(row => row.id === item.id)).filter(Boolean);
    if (chosen.length) context.innerHTML = '<h3>从具名史事读人物</h3>' + chosen.map(item =>
     '<p><a href="' + url(item.year, item.id) + '">' + E(item.date + ' · ' + item.title) +
     ' ↗</a><br>' + E(item.summary) + '</p>').join('');
   }).catch(() => {});
  }
 }
 document.addEventListener('click',e=>{const p=e.target.closest('[data-party-person]');if(p)profile(p.dataset.partyPerson);else if(e.target.closest('#partyProfile a.event-link,#partyProfile .people-year-list a,#partyProfile .party-reading a:not([target])'))$('#partyProfile').close();});
 const dialog=$('#partyProfile');dialog?.querySelector('.close').addEventListener('click',()=>dialog.close());dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 if(query.get('name'))profile(query.get('name'));
 function filterPeople(){const q=($('#partyPeopleSearch')?.value||'').trim().toLocaleLowerCase(),scope=$('#partyPeopleScope')?.value||'all';let n=0;for(const card of document.querySelectorAll('#partyPeopleGrid [data-party-person]')){const p=C.people.find(p=>p.name===card.dataset.partyPerson);card.hidden=!(card.dataset.personSearch.toLocaleLowerCase().includes(q)&&(scope!=='profile'||Boolean((p?.overview || readingDepth.people?.[p?.name] || supplementalProfiles[p?.name]))));if(!card.hidden)n++;}if($('#partyPeopleStatus'))$('#partyPeopleStatus').textContent='显示 '+n+' 位人物 · 独立介绍与史事索引分别标注';if($('#partyPeopleEmpty'))$('#partyPeopleEmpty').hidden=n>0;}
 $('#partyPeopleSearch')?.addEventListener('input',filterPeople);$('#partyPeopleScope')?.addEventListener('change',filterPeople);
 $('#partyCopyYear')?.addEventListener('click',async()=>{try{if(!navigator.clipboard?.writeText)throw Error('clipboard');const u=new URL(location.href);u.search='';u.hash='';await navigator.clipboard.writeText(u.href);toast('这一年的固定链接已复制');}catch{toast('当前浏览器限制复制，可直接复制地址栏中的年度网址');}});
 function insertReadingDepth(data) {
  readingDepth = data;
  const annual = data.years?.[year];
  const yearHeader = $('.year-hero');
  if (annual && yearHeader) yearHeader.insertAdjacentHTML('afterend',
    '<div class="intro-card">' + depthArticle(annual, '年度脉络') + '</div>');
  for (const article of document.querySelectorAll('.event[data-event-search]')) {
   const entry = data.events?.[article.id];
   const summary = article.querySelector('.event-summary');
   summary?.insertAdjacentHTML('afterend', '<atlas-reading data-ids="party:' + E(article.id) + '"></atlas-reading>');
   if (entry && summary) {
    summary.insertAdjacentHTML('afterend', depthArticle(entry, '史事详读'));
    article.dataset.eventSearch += ' ' + entry.paragraphs.join(' ');
   }
   const thread = data.threads?.[data.eventThreads?.[article.id]];
   if (!thread) continue;
   article.insertAdjacentHTML('beforeend', '<details class="event-evidence"' + (entry ? '' : ' open') + '><summary>跨年连读 · ' +
    E(thread.title) + '</summary><p>' + E(thread.intro) + '</p>' +
    thread.events.filter(event => event.id !== article.id).map(event => '<p><a href="' + url(event.year, event.id) + '">' +
     E(event.date + ' · ' + event.title) + ' ↗</a><br>' + E(event.summary) + '</p>').join('') + '</details>');
  }
  if ($('#partyProfile')?.open && activeProfile) profile(activeProfile);
  if ($('#partyEventSearch')?.value) filterEvents();
  if ($('#partySearch')?.value) search();
 }
 if (year || $('#partyProfile') || $('#partySearch')) {
  fetch(base + 'reading-depth.json?v=0.21.0').then(response => {
   if (!response.ok) throw Error('Reading depth unavailable');
   return response.json();
  }).then(insertReadingDepth).catch(error => console.warn(error.message));
 }
 partyLibrary.then(data => {
  if (!data) return;
  for (const [id, entry] of Object.entries(data.entries)) {
   if (id.startsWith('party-person:')) supplementalProfiles[id.slice('party-person:'.length)] = entry;
  }
  for (const card of document.querySelectorAll('#partyPeopleGrid [data-party-person]')) {
   const entry = supplementalProfiles[card.dataset.partyPerson];
   if (!entry) continue;
   card.dataset.personSearch += ' ' + entry.paragraphs.join(' ');
   const label = card.querySelector('small');
   if (label) label.textContent = label.textContent.replace('关联人物索引', '人物介绍');
  }
  if ($('#partyPeopleSearch')?.value || $('#partyPeopleScope')?.value === 'profile') filterPeople();
  if ($('#partyProfile')?.open && activeProfile) profile(activeProfile);
 });
 $('#partyPrint')?.addEventListener('click',()=>window.print());
})();
