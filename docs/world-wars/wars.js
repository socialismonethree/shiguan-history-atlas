'use strict';
(()=>{
 const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const battleNames={'gallipoli':'加里波利战役','battle-shanghai-1937':'淞沪会战','battle-taierzhuang':'台儿庄战役','battle-hundred-regiments':'百团大战','battle-midway-1942':'中途岛海战','battle-stalingrad':'斯大林格勒战役','imphal-kohima':'英帕尔—科希马战役','battle-normandy':'诺曼底战役'},D=window.WORLD_WARS;
 if(!D?.wars?.length){$('#count').textContent='专题资料暂未完整载入，请刷新重试。';return}
 const countries=new Map(D.countries.map(c=>[c.id,c])),sources=new Map(D.sources.map(s=>[s.id,s])),profiles=new Map(D.people.map(p=>[p.name,p]));
 let war=D.wars[0],date=war.default,activePath=null,focused=false;
 const fmt=d=>{const[y,m]=d.split('-');return `${y}年${Number(m)}月`};
 const phase=m=>war.phases.filter(p=>p[0]<=m.date).at(-1)?.[1]??'战争前史';
 const currentPath=()=>D.paths.find(p=>p.id===activePath&&p.war===war.id);
 function sourceHTML(ref){const s=sources.get(ref.id);return s?`<div class="source"><a href="${E(s.url)}" target="_blank" rel="noopener noreferrer">${E(s.title)} ↗</a><p>${E(s.publisher)}${ref.locator?' · 定位：'+E(ref.locator):''}</p><p>${E(s.note)}</p></div>`:''}
 function init(){
  document.body.dataset.war=war.id;
  $('#warTabs').innerHTML=D.wars.map(w=>`<button data-war="${w.id}" aria-pressed="${w.id===war.id}"><b>${E(w.years)}</b><strong>${E(w.name)}</strong><small>${w.months.length} 个月度节点 · ${E(w.subtitle)}</small><i>↗</i></button>`).join('');
  $('#warScope').textContent=war.coverage;$('#warHeading').textContent=war.subtitle;$('#warIntro').textContent=war.intro;
  $('#year').innerHTML='<option value="all">全部年份</option>'+[...new Set(war.months.map(m=>m.date.slice(0,4)))].map(y=>`<option value="${y}">${y}年</option>`).join('');
  $('#country').innerHTML='<option value="all">各国并观</option>'+D.countries.filter(c=>c.views[war.id]).map(c=>`<option value="${c.id}">${E(c.name)}</option>`).join('');
  $('#theater').innerHTML='<option value="all">全部战场与主题</option>'+[...new Set(war.months.flatMap(m=>m.theaters))].map(t=>`<option value="${E(t)}">${E(t)}</option>`).join('');
  resetFilters();$('#year').value=date.slice(0,4);
 }
 function resetFilters(){$('#year').value='all';$('#country').value='all';$('#theater').value='all';$('#query').value=''}
 function filtered(includeYear=true){
  const y=$('#year').value,c=$('#country').value,t=$('#theater').value,q=$('#query').value.trim().toLowerCase(),p=currentPath();
  return war.months.filter(m=>(!p||p.steps.some(s=>s.date===m.date))&&(!includeYear||y==='all'||m.date.startsWith(y))&&(c==='all'||m.countries.includes(c))&&(t==='all'||m.theaters.includes(t))&&[m.date,fmt(m.date),m.title,...m.people,...m.theaters,...m.countries.map(i=>countries.get(i)?.name),...m.story,m.continuity.before,m.continuity.after,...m.perspectives.map(p=>p.text)].join(' ').toLowerCase().includes(q));
 }
 function url(m,c=$('#country').value,p=activePath){return '#'+war.id+'/'+m.date+((c!=='all'||p)?'/'+c:'')+(p?'/'+p:'')}
 function syncHash(mode='replace'){const m=war.months.find(m=>m.date===date);if(m)history[mode+'State'](null,'',url(m))}
 function monthButton(m,label,extra=''){return m?`<button data-month="${m.date}" ${extra}><small>${label} · ${fmt(m.date)}</small><span>${E(m.title)}</span></button>`:'<span></span>'}
 function renderPaths(m){
  const p=currentPath();
  $('#pathCards').innerHTML=D.paths.filter(p=>p.war===war.id).map((p,i)=>`<button class="path-card" data-path="${p.id}" aria-pressed="${activePath===p.id}"><span class="path-index">线索 ${String(i+1).padStart(2,'0')} <i>↗</i></span><strong>${E(p.title)}</strong><span class="path-question">${E(p.question)}</span><small>${p.steps[0].date} — ${p.steps.at(-1).date} · ${p.steps.length} 个节点</small></button>`).join('');
  $('#pathTrail').hidden=!p;
  if(p){const step=p.steps.findIndex(s=>s.date===m?.date);$('#pathTrail').innerHTML=`<div class="trail-heading"><p class="eyebrow">当前线索 · ${step<0?'筛选中':`${step+1} / ${p.steps.length}`}</p><button data-path="all">返回完整月度长卷 ↗</button></div><h2>${E(p.title)}</h2><p>${E(p.intro)}</p><nav class="thread-stops" aria-label="主题线索节点">${p.steps.map((s,i)=>`<button data-month="${s.date}" aria-current="${s.date===m?.date?'step':'false'}" title="${E(s.connection)}"><b>${String(i+1).padStart(2,'0')}</b><time>${s.date}</time></button>`).join('')}</nav>${step>=0?`<p class="thread-connection"><span>读到这里</span>${E(p.steps[step].connection)}</p>`:''}`}
 }
 function render(mode='replace'){
  const list=filtered(),country=$('#country').value;
  if(!list.some(m=>m.date===date)&&list.length)date=list[0].date;
  const m=list.find(m=>m.date===date),p=currentPath();
  renderPaths(m);
  $('#count').textContent=`当前范围 ${list.length} / 本卷 ${war.months.length} 个月度节点`;
  $('#monthList').innerHTML=list.map(x=>`<button data-month="${x.date}" aria-current="${x.date===date}"><time>${fmt(x.date)}</time><span>${E(x.title)}</span></button>`).join('');
  const selected=$('#monthList [aria-current="true"]'),rail=$('#monthList');if(selected){rail.scrollTop=Math.max(0,selected.offsetTop-rail.clientHeight/2);rail.scrollLeft=Math.max(0,selected.offsetLeft-rail.clientWidth/2+selected.offsetWidth/2)}
  $('#phaseNav').innerHTML=war.phases.map((s,i)=>`<button data-phase="${s[0]}" ${m&&phase(m)===s[1]?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span>${E(s[1])}</button>`).join('');
  $('#readingContext').textContent=p?`主题选读 · ${p.title}`:`${war.name} · 月度长卷`;
  $('#scopeNote').innerHTML=country==='all'?`<p>${p?'正在沿主题线索阅读；前后按钮连接本线索节点，可随时返回完整长卷。':'主战期逐月连续；前史与余波选编。各月先看全局，再沿人物、国家和主题继续追踪。'}</p>`:`<h3>${E(countries.get(country).name)}：这一卷中的处境</h3><p>${E(countries.get(country).views[war.id])}</p>`;
  $('#empty').hidden=!!m;$('#chapter').hidden=!m;$('#readingDock').hidden=!m;
  if(!m){$('#chapter').innerHTML='';$('#adjacent').innerHTML='';return}
  const chain=filtered(false),idx=chain.findIndex(x=>x.date===m.date),previous=chain[idx-1],next=chain[idx+1],fullidx=war.months.indexOf(m),priorMonth=war.months[fullidx-1],nextMonth=war.months[fullidx+1];
  $('#chapter').innerHTML=`<header class="chapter-head"><p class="eyebrow">${E(war.name)} / ${E(phase(m))}</p><div class="chapter-date">${fmt(m.date)}<small>${m.date<war.start?'战争前史':m.date>war.end?'战后余波':'主战期 · 月度叙事'}</small></div><h2>${E(m.title)}</h2><div class="chapter-meta">${m.theaters.map(t=>`<span>${E(t)}</span>`).join('')}${m.countries.map(i=>`<button data-country="${i}" title="追踪${E(countries.get(i).name)}">${E(countries.get(i).name)}</button>`).join('')}</div></header><aside class="continuity before"><span class="continuity-label">承前 · 这一月从何而来</span><p>${E(m.continuity.before)}</p>${priorMonth?`<button data-context="${priorMonth.date}">回看 ${fmt(priorMonth.date)} ↗</button>`:''}</aside><nav class="chapter-anchors" aria-label="本月阅读目录"><a href="#storyText" data-anchor="storyText">进入叙事</a><a href="#lenses" data-anchor="lenses">同期处境</a><a href="#people" data-anchor="people">人物</a><a href="#monthSources" data-anchor="monthSources">史料</a></nav><div class="story" id="storyText">${m.story.map((s,i)=>`<p><span class="paragraph-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${E(s)}</p>`).join('')}</div><aside class="continuity after"><span class="continuity-label">续后 · 尚未解决的问题</span><p>${E(m.continuity.after)}</p>${nextMonth?`<button data-context="${nextMonth.date}">接着看 ${fmt(nextMonth.date)} →</button>`:''}</aside>${m.relatedBattles?.length?`<nav class="related-battles" aria-label="相关战役档案">深入相关战役：${m.relatedBattles.map(id=>`<a href="../battles/index.html?v=0.16.0#battle/${encodeURIComponent(id)}">${E(battleNames[id])} ↗</a>`).join(' · ')}</nav>`:''}<section class="lenses" id="lenses"><div class="section-label"><h3>同一节点，不同处境</h3><span>基于史实的编辑解读 · 并非当事人自述</span></div><div class="lens-grid">${m.perspectives.map(s=>`<div class="lens"><h4>${E(countries.get(s.country).name)}</h4><p>${E(s.text)}</p><button data-country="${s.country}">沿${E(countries.get(s.country).name)}的经历追踪 →</button></div>`).join('')}</div></section><section class="people" id="people"><h3>人物与选择</h3><div class="people-buttons">${m.people.map(n=>`<button data-person="${E(n)}">${E(n)}<small>${profiles.has(n)?'人物展签 · '+E(profiles.get(n).role):'追踪本卷相关事件'}</small></button>`).join('')}</div></section>${!p?`<section class="connected-threads"><h3>把这一月放进更长的线索</h3>${D.paths.filter(p=>p.war===war.id&&p.steps.some(s=>s.date===m.date)).map(p=>`<button data-path="${p.id}" data-start="${m.date}"><strong>${E(p.title)} ↗</strong><span>${E(p.steps.find(s=>s.date===m.date).connection)}</span></button>`).join('')||'<p>可从上方主题目录另选一条阅读线索。</p>'}</section>`:''}<details class="sources" id="monthSources"><summary>查阅史料、定位与编写边界（${m.sources.length} 项）</summary>${m.sources.map(sourceHTML).join('')}<p class="source">正文为原创史实叙述，连接和评价属于编辑归纳。来源按本月事件与主题交叉阅读，并不表示每份概述均逐句支持全部解释。主题线索是选读顺序；承前、续后概括局势，日期相邻本身不代表直接因果。</p></details><a class="chapter-share" href="${url(m)}">复制地址栏即可分享此处阅读位置 ↗</a>`;
  $('#adjacent').innerHTML=monthButton(previous,p?'← 线索上一节点':'← 前一节点')+monthButton(next,p?'线索下一节点 →':'后一节点 →');
  $('#readingDock').innerHTML=`${monthButton(previous,'← 上一节点','aria-label="阅读上一节点"')}<div class="dock-current"><small>${p?E(p.title):E(war.name)} · ${idx+1}/${chain.length}</small><strong>${fmt(m.date)}</strong><button id="dockFocus">${focused?'退出专注 · 返回目录':'专注阅读 ↗'}</button></div>${monthButton(next,'下一节点 →','aria-label="阅读下一节点"')}`;
  document.title=`${fmt(m.date)} · ${m.title} — 两次世界大战 · 时观`;syncHash(mode);requestAnimationFrame(updateMeter);
 }
 function jump(d,{reset=false,focus=true,mode='push'}={}){
  if(!war.months.some(m=>m.date===d))return;
  if(reset)resetFilters();
  if(currentPath()&&!currentPath().steps.some(s=>s.date===d))activePath=null;
  if(!filtered(false).some(m=>m.date===d))resetFilters();
  date=d;$('#year').value=currentPath()?'all':date.slice(0,4);render(mode);
  if(focus){$('#chapter').scrollIntoView({block:'start',behavior:'instant'});$('#chapter').focus({preventScroll:true})}
 }
 function selectPath(id,start){activePath=id==='all'?null:id;resetFilters();const p=currentPath();jump(start??(p?p.steps[0].date:date),{focus:false});const target=p?$('#pathTrail'):$('#chapter');target.scrollIntoView({block:'start',behavior:'instant'});target.focus({preventScroll:true})}
 function person(name){const p=profiles.get(name),links=war.months.filter(m=>m.people.includes(name));$('#personBody').innerHTML=`<p class="eyebrow">${p?'人物展签':'人物事件索引'}</p><h2 id="personName">${E(name)}</h2>${p?`<p class="role">${E(p.life)} · ${E(p.role)}</p><p>${E(p.bio)}</p>`:'<p>从以下月度事件追踪其在本卷中的行动与角色。此处为事件索引，未作为完整生平介绍。</p>'}<h3>沿月份追踪</h3><div class="person-links">${links.map(m=>`<a data-jump="${m.date}" href="${url(m,'all',null)}">${fmt(m.date)} · ${E(m.title)} ↗</a>`).join('')}</div><p class="role">相关史料随各月正文列出；人物评价区分不同历史阶段，不以单一功过代替全部经历。</p>`;$('#personDialog').showModal();$('#personDialog').scrollTop=0}
 function toggleFocus(){focused=!focused;document.body.classList.toggle('focused',focused);$('#focusButton').setAttribute('aria-pressed',focused);$('#focusButton').textContent=focused?'退出专注阅读':'进入专注阅读 ↗';const b=$('#dockFocus');if(b)b.textContent=focused?'退出专注 · 返回目录':'专注阅读 ↗';$('#chapter').scrollIntoView({block:'start',behavior:'instant'});$('#chapter').focus({preventScroll:true})}
 function route(focus=false){const[w,d,c,p]=location.hash.slice(1).split('/'),target=D.wars.find(x=>x.id===w);if(!target)return;war=target;date=war.months.some(m=>m.date===d)?d:war.default;activePath=D.paths.some(x=>x.id===p&&x.war===w)?p:null;init();if(countries.get(c)?.views[w])$('#country').value=c;jump(date,{focus,mode:'replace'})}
 function updateMeter(){const el=$('#storyText');if(!el){$('#readingMeter').style.width='0';return}const rect=el.getBoundingClientRect(),read=Math.max(0,Math.min(1,(innerHeight*.35-rect.top)/rect.height));$('#readingMeter').style.width=(read*100)+'%'}
 document.addEventListener('click',e=>{
  const w=e.target.closest('button[data-war]'),m=e.target.closest('[data-month]'),p=e.target.closest('[data-person]'),c=e.target.closest('[data-country]'),ph=e.target.closest('[data-phase]'),j=e.target.closest('[data-jump]'),th=e.target.closest('[data-path]'),ctx=e.target.closest('[data-context]'),anchor=e.target.closest('[data-anchor]');
  if(w){war=D.wars.find(x=>x.id===w.dataset.war);date=war.default;activePath=null;init();jump(date,{focus:false});$('#reader').scrollIntoView({block:'start',behavior:'instant'})}
  else if(th)selectPath(th.dataset.path,th.dataset.start);
  else if(m)jump(m.dataset.month);
  else if(p)person(p.dataset.person);
  else if(c){activePath=null;resetFilters();$('#country').value=c.dataset.country;render('push');$('#reader').scrollIntoView({block:'start',behavior:'instant'})}
  else if(ph){activePath=null;const d=war.months.find(m=>m.date>=ph.dataset.phase)?.date;if(d)jump(d,{reset:true})}
  else if(j){e.preventDefault();$('#personDialog').close();activePath=null;jump(j.dataset.jump,{reset:true})}
  else if(ctx){activePath=null;jump(ctx.dataset.context,{reset:true})}
  else if(anchor){e.preventDefault();const target=$('#'+anchor.dataset.anchor);if(target?.tagName==='DETAILS')target.open=true;target?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
  else if(e.target.closest('#focusButton,#dockFocus'))toggleFocus();
 });
 $('#personDialog .close').addEventListener('click',()=>$('#personDialog').close());
 for(const id of ['year','country','theater','query'])$('#'+id).addEventListener(id==='query'?'input':'change',()=>{if(id!=='year')$('#year').value='all';render()});
 $('#clear').addEventListener('click',()=>{activePath=null;init();jump(war.default,{reset:true,focus:false})});
 $('#sourceList').innerHTML=D.sources.map(s=>sourceHTML({id:s.id})).join('');
 window.addEventListener('popstate',()=>route());window.addEventListener('hashchange',()=>route());window.addEventListener('scroll',updateMeter,{passive:true});window.addEventListener('resize',updateMeter);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&focused&&!$('#personDialog').open)toggleFocus();if(!e.altKey||!['ArrowLeft','ArrowRight'].includes(e.key)||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||$('#personDialog').open)return;const chain=filtered(false),i=chain.findIndex(m=>m.date===date),m=chain[i+(e.key==='ArrowRight'?1:-1)];if(m){e.preventDefault();jump(m.date)}});
 init();if(D.wars.some(w=>location.hash.startsWith('#'+w.id)))route(true);else render();
})();
