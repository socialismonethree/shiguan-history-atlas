'use strict';
(()=>{
 const $=s=>document.querySelector(s), E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const battleNames={'gallipoli':'加里波利战役','battle-shanghai-1937':'淞沪会战','battle-taierzhuang':'台儿庄战役','battle-hundred-regiments':'百团大战','battle-midway-1942':'中途岛海战','battle-stalingrad':'斯大林格勒战役','imphal-kohima':'英帕尔—科希马战役','battle-normandy':'诺曼底战役'};const D=window.WORLD_WARS;
 if(!D?.wars?.length){$('#count').textContent='专题资料暂未完整载入，请刷新重试。';return}
 const countries=new Map(D.countries.map(c=>[c.id,c])),sources=new Map(D.sources.map(s=>[s.id,s])),profiles=new Map(D.people.map(p=>[p.name,p]));
 let war=D.wars[0],date=war.default;
 const fmt=d=>{const[y,m]=d.split('-');return `${y}年${Number(m)}月`};
 const phase=m=>war.phases.filter(p=>p[0]<=m.date).at(-1)?.[1]??'战争前史';
 function sourceHTML(ref){const s=sources.get(ref.id);if(!s)return '';return `<div class="source"><a href="${E(s.url)}" target="_blank" rel="noopener noreferrer">${E(s.title)} ↗</a><p>${E(s.publisher)}${ref.locator?' · 定位：'+E(ref.locator):''}</p><p>${E(s.note)}</p></div>`}
 function init(){
  document.body.dataset.war=war.id;
  $('#warTabs').innerHTML=D.wars.map(w=>`<button data-war="${w.id}" aria-pressed="${w.id===war.id}"><b>${E(w.years)}</b><strong>${E(w.name)}</strong><small>${w.months.length} 个月度节点 · ${E(w.subtitle)}</small><i>↗</i></button>`).join('');
  $('#warScope').textContent=war.coverage;$('#warHeading').textContent=war.subtitle;$('#warIntro').textContent=war.intro;
  $('#year').innerHTML='<option value="all">全部年份</option>'+[...new Set(war.months.map(m=>m.date.slice(0,4)))].map(y=>`<option value="${y}">${y}年</option>`).join('');
  $('#country').innerHTML='<option value="all">各国并观</option>'+D.countries.filter(c=>c.views[war.id]).map(c=>`<option value="${c.id}">${E(c.name)}</option>`).join('');
  $('#theater').innerHTML='<option value="all">全部战场与主题</option>'+[...new Set(war.months.flatMap(m=>m.theaters))].map(t=>`<option value="${E(t)}">${E(t)}</option>`).join('');
  $('#query').value='';$('#year').value=date.slice(0,4);
 }
 function filtered(includeYear=true){
  const y=$('#year').value,c=$('#country').value,t=$('#theater').value,q=$('#query').value.trim().toLowerCase();
  return war.months.filter(m=>(!includeYear||y==='all'||m.date.startsWith(y))&&(c==='all'||m.countries.includes(c))&&(t==='all'||m.theaters.includes(t))&&[m.date,fmt(m.date),m.title,...m.people,...m.theaters,...m.countries.map(i=>countries.get(i)?.name),...m.story,...m.perspectives.map(p=>p.text)].join(' ').toLowerCase().includes(q));
 }
 function url(m,c=$('#country').value){return '#'+war.id+'/'+m.date+(c==='all'?'':'/'+c)}
 function updateHash(){history.replaceState(null,'','#'+war.id+'/'+date+($('#country').value==='all'?'':'/'+$('#country').value))}
 function render(){
  const list=filtered(),country=$('#country').value;
  if(!list.some(m=>m.date===date)&&list.length)date=list[0].date;
  const m=list.find(m=>m.date===date);
  $('#count').textContent=`当前范围 ${list.length} / 本卷 ${war.months.length} 个月度节点`;
  $('#monthList').innerHTML=list.map(x=>`<button data-month="${x.date}" aria-current="${x.date===date}"><time>${fmt(x.date)}</time><span>${E(x.title)}</span></button>`).join('');
  const activeMonth=$('#monthList [aria-current="true"]'),monthRail=$('#monthList');if(activeMonth){monthRail.scrollTop=Math.max(0,activeMonth.offsetTop-monthRail.clientHeight/2);monthRail.scrollLeft=Math.max(0,activeMonth.offsetLeft-monthRail.clientWidth/2+activeMonth.offsetWidth/2);}
  $('#phaseNav').innerHTML=war.phases.map((p,i)=>`<button data-phase="${p[0]}" ${m&&phase(m)===p[1]?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span>${E(p[1])}</button>`).join('');
  $('#scopeNote').innerHTML=country==='all'?`<p>${E(war.name)} · 主战期逐月连续，前史与余波选编。沿前后节点阅读，或选择国家追踪其经历。</p>`:`<h3>${E(countries.get(country).name)}：这一卷中的处境</h3><p>${E(countries.get(country).views[war.id])}</p>`;
  $('#empty').hidden=!!m;$('#chapter').hidden=!m;
  if(!m){$('#chapter').innerHTML='';$('#adjacent').innerHTML='';return}
  $('#chapter').innerHTML=`<header class="chapter-head"><p class="eyebrow">${E(war.name)} / ${E(phase(m))}</p><div class="chapter-date">${fmt(m.date)}<small>${m.date<war.start?'战争前史':m.date>war.end?'战后余波':'主战期 · 月度叙事'}</small></div><h2>${E(m.title)}</h2><div class="chapter-meta">${m.theaters.map(t=>`<span>${E(t)}</span>`).join('')}${m.countries.map(i=>`<button data-country="${i}" title="追踪${E(countries.get(i).name)}">${E(countries.get(i).name)}</button>`).join('')}</div></header><div class="story">${m.story.map(p=>`<p>${E(p)}</p>`).join('')}</div>${m.relatedBattles?.length?`<nav class="related-battles" aria-label="相关战役档案">相连的战役档案：${m.relatedBattles.map(id=>`<a href="../battles/index.html?v=0.16.0#battle/${encodeURIComponent(id)}">${E(battleNames[id])} ↗</a>`).join(' · ')}</nav>`:''}<section class="lenses"><div class="section-label"><h3>同一节点，不同处境</h3><span>基于史实的编辑解读 · 并非当事人自述</span></div><div class="lens-grid">${m.perspectives.map(p=>`<div class="lens"><h4>${E(countries.get(p.country).name)}</h4><p>${E(p.text)}</p></div>`).join('')}</div></section><section class="people"><h3>人物与选择</h3><div class="people-buttons">${m.people.map(n=>`<button data-person="${E(n)}">${E(n)}<small>${profiles.has(n)?'人物展签 · '+E(profiles.get(n).role):'追踪本卷相关事件'}</small></button>`).join('')}</div></section><details class="sources"><summary>查阅史料、定位与编写边界（${m.sources.length} 项）</summary>${m.sources.map(sourceHTML).join('')}<p class="source">正文为原创史实叙述，连接和评价属于编辑归纳。来源按本月事件与主题交叉阅读，并不表示每份概述均逐句支持全部解释。</p></details><a class="chapter-share" href="${url(m)}">本月固定链接 ↗</a>`;
  const chain=filtered(false),i=chain.findIndex(x=>x.date===m.date);
  $('#adjacent').innerHTML=[[-1,'← 前一节点'],[1,'后一节点 →']].map(([d,label])=>{const x=chain[i+d];return x?`<button data-month="${x.date}"><small>${label} · ${fmt(x.date)}</small>${E(x.title)}</button>`:'<span></span>'}).join('');
  updateHash();
 }
 function jump(d,{reset=false,focus=true}={}){
  const m=war.months.find(m=>m.date===d);if(!m)return;
  if(reset){$('#country').value='all';$('#theater').value='all';$('#query').value=''}
  if(!filtered(false).some(x=>x.date===d)){$('#country').value='all';$('#theater').value='all';$('#query').value=''}
  date=d;$('#year').value=d.slice(0,4);render();
  if(focus){$('#chapter').scrollIntoView({block:'start',behavior:'instant'});$('#chapter').focus({preventScroll:true})}
 }
 function setWar(id,d,c,focus=true){
  const w=D.wars.find(w=>w.id===id);if(!w)return;
  if(w.id!==war.id){war=w;date=d??w.default;init()}
  if(c&&countries.get(c)?.views[war.id])$('#country').value=c;
  jump(d??war.default,{focus});
 }
 function person(name){
  const p=profiles.get(name),links=war.months.filter(m=>m.people.includes(name));
  $('#personBody').innerHTML=`<p class="eyebrow">${p?'人物展签':'人物事件索引'}</p><h2 id="personName">${E(name)}</h2>${p?`<p class="role">${E(p.life)} · ${E(p.role)}</p><p>${E(p.bio)}</p>`:'<p>从以下月度事件追踪其在本卷中的行动与角色。此处为事件索引，未作为完整生平介绍。</p>'}<h3>沿月份追踪</h3><div class="person-links">${links.map(m=>`<a data-jump="${m.date}" href="${url(m)}">${fmt(m.date)} · ${E(m.title)} ↗</a>`).join('')}</div><p class="role">相关史料随各月正文列出；人物评价区分不同历史阶段，不以单一功过代替全部经历。</p>`;
  $('#personDialog').showModal();$('#personDialog').scrollTop=0;
 }
 function route(focus=true){
  const [w,d,c]=location.hash.slice(1).split('/');if(D.wars.some(x=>x.id===w))setWar(w,d,c,focus);
 }
 document.addEventListener('click',e=>{
  const w=e.target.closest('button[data-war]'),m=e.target.closest('[data-month]'),p=e.target.closest('[data-person]'),c=e.target.closest('[data-country]'),phase=e.target.closest('[data-phase]'),j=e.target.closest('[data-jump]');
  if(w){history.pushState(null,'','#'+w.dataset.war);setWar(w.dataset.war,undefined,undefined,false);$('#reader').scrollIntoView({block:'start',behavior:'instant'})}
  else if(m){history.pushState(null,'','#'+war.id+'/'+m.dataset.month);jump(m.dataset.month)}
  else if(p)person(p.dataset.person);
  else if(c){$('#country').value=c.dataset.country;$('#year').value='all';render();$('#reader').scrollIntoView({block:'start',behavior:'instant'})}
  else if(phase){const d=war.months.find(m=>m.date>=phase.dataset.phase)?.date;if(d)jump(d,{reset:true})}
  else if(j){e.preventDefault();$('#personDialog').close();jump(j.dataset.jump,{reset:true})}
 });
 $('#personDialog .close').addEventListener('click',()=>$('#personDialog').close());
 for(const id of ['year','country','theater','query'])$('#'+id).addEventListener(id==='query'?'input':'change',()=>{if(id!=='year')$('#year').value='all';render()});
 $('#clear').addEventListener('click',()=>{init();date=war.default;jump(date,{reset:true,focus:false})});
 $('#sourceList').innerHTML=D.sources.map(s=>sourceHTML({id:s.id})).join('');
 window.addEventListener('hashchange',()=>route());window.addEventListener('popstate',()=>route());
 init();if(D.wars.some(w=>location.hash.startsWith('#'+w.id)))route(false);else render();
})();
