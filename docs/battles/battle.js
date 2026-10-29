'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data = window.BATTLE_DATA;
  if (!data?.threads || !Array.isArray(data.battles) || data.battles.some(b => !b.narrative?.length || !b.thread || !b.polities)) {
    $('#status').textContent = '战役时间线暂未完整载入，请刷新重试。';
    return;
  }
  const records = [...data.battles].sort((a,b) => a.year-b.year || (a.sequence ?? 0)-(b.sequence ?? 0) || a.name.localeCompare(b.name,'zh-CN'));
  const byId = new Map(records.map(b => [b.id,b]));
  const threads = new Map(data.threads.map(t => [t.id,t]));
  const sources = new Map(data.sources.map(s => [s.id,s]));
  const eras = [
    {id:'ancient',title:'古代文明',range:'前1046—前1',start:-Infinity,end:-1},
    {id:'empires',title:'帝国与分合',range:'1—999',start:1,end:999},
    {id:'medieval',title:'王朝与征服',range:'1000—1499',start:1000,end:1499},
    {id:'earlymodern',title:'海陆重组',range:'1500—1799',start:1500,end:1799},
    {id:'modern',title:'革命与扩张',range:'1800—1913',start:1800,end:1913},
    {id:'worldwars',title:'世界大战时期',range:'1914—1945',start:1914,end:1945},
    {id:'postwar',title:'战后格局',range:'1946—1952',start:1946,end:Infinity}
  ];
  let eraId = 'all';
  const opened = new Set();
  const yearLabel = year => year < 0 ? `前${-year}` : String(year);
  const orderedThread = id => records.filter(b => b.thread === id);
  const eventLink = (b,label) => `<a data-event="${E(b.id)}" href="#event/${encodeURIComponent(b.id)}">${label ?? E(b.name)}</a>`;

  function notes(b) {
    return `<aside class="reading-notes" aria-label="${E(b.name)}阅读补充"><details><summary>人物索引 <span>${b.people.length} 位关联人物</span></summary><p class="people-index">${E(b.people.join(' · '))}</p></details><details><summary>史料与不同记载 <span>查看出处与辨析</span></summary>${b.dispute ? `<div class="source-note"><h3>史料辨析</h3><p>${E(b.dispute)}</p></div>` : ''}<div class="detail-sources"><h3>资料来源</h3>${b.sources.map(id => sources.get(id)).filter(Boolean).map(s => `<p>${s.unavailable ? E(s.title)+'（链接此前未通过访问核验，暂不跳转）' : `<a href="${E(s.url)}" target="_blank" rel="noopener noreferrer">${E(s.title)} ↗</a>`}<br><span>${E(s.publisher)}</span></p>`).join('')}</div></details></aside>`;
  }
  function story(b) {
    return `<article class="battle-story" aria-label="${E(b.name)}叙事">${b.narrative.map(p => `<p>${E(p)}</p>`).join('')}</article>`;
  }
  function connections(b) {
    const chain = orderedThread(b.thread), i = chain.findIndex(x => x.id === b.id);
    return `<nav class="next-links" aria-label="${E(b.name)}关联战役">${i>0 ? eventLink(chain[i-1],`← 同脉络前一场：${E(chain[i-1].name)}`) : ''}${i<chain.length-1 ? eventLink(chain[i+1],`同脉络后一场：${E(chain[i+1].name)} →`) : ''}</nav>`;
  }
  function node(b) {
    const t = threads.get(b.thread);
    return `<details class="battle-node ${b.region==='中国'?'is-china':''}" id="event-${E(b.id)}" data-battle="${E(b.id)}" ${opened.has(b.id)?'open':''}><summary><time class="node-year">${Math.abs(b.year)}<small>${b.year<0?'公元前':'公元'}</small></time><div class="node-top"><span class="area-tag">${E(b.area)}</span><span class="polities">${E(b.polities)}</span></div><h4>${E(b.name)}</h4><p class="node-place">${E(b.date)}　·　${E(b.location)}</p><p class="node-context"><span>时代背景</span>${E(b.cause)}</p><span class="node-open"><span>${E(t.title)}</span><span class="when-closed">原位展开故事 ↓</span><span class="when-open">收起故事 ↑</span></span><span class="open-indicator" aria-hidden="true">＋</span></summary><div class="inline-story"><div class="story-top"><span>${E(t.kind)} · ${E(t.title)}</span><button data-thread="${E(t.id)}">只看这条脉络 ↗</button></div>${story(b)}${connections(b)}${notes(b)}<a class="detail-link" href="#battle/${encodeURIComponent(b.id)}">独立展签与分享 ↗</a></div></details>`;
  }
  function render() {
    const q = $('#query').value.trim().toLowerCase(), area = $('#region').value, tid = $('#thread').value;
    const era = eras.find(e => e.id===eraId);
    const list = records.filter(b => (!era || b.year>=era.start && b.year<=era.end) && (area==='all'||b.area===area) && (tid==='all'||b.thread===tid) && [b.name,b.date,b.location,b.period,b.region,b.area,b.polities,b.cause,b.process,b.result,b.impact,threads.get(b.thread).title,...b.narrative,...b.people].join(' ').toLowerCase().includes(q));
    $('#eraNav').innerHTML = [{id:'all',title:'全局长卷',range:'全部年代'},...eras].map(e => `<button data-era="${e.id}" aria-pressed="${e.id===eraId}"><span>${e.title}<small>${e.range}</small></span><b>${e.id==='all'?records.length:records.filter(b=>b.year>=e.start&&b.year<=e.end).length}</b></button>`).join('');
    const t = threads.get(tid);
    $('#contextPanel').innerHTML = t ? `<span class="context-label">${E(t.kind)} · ${orderedThread(t.id).length} 场已收录战役</span><h3>${E(t.title)}</h3><p>${E(t.context)}</p><nav class="thread-path" aria-label="脉络中的战役">${orderedThread(t.id).map(b=>eventLink(b,`<span>${yearLabel(b.year)}</span>${E(b.name)}`)).join('')}</nav>` : `<span class="context-label">${era ? E(era.range)+' · 年代切片' : '全局时间线 · 中国与世界同期展开'}</span><p class="overview-copy">点开节点原位读故事；选择战争脉络，追踪同一条历史线索的前后。</p>`;
    $('#timelineTitle').textContent = t ? t.title : '中外战役时间线';
    $('#status').textContent = `当前 ${list.length} / ${records.length} 场战役 · 按开始时间或主要阶段排列 · 展开节点即可阅读`;
    $('#empty').hidden = !!list.length;
    $('#timeline').innerHTML = eras.map(e => {
      const items = list.filter(b => b.year>=e.start&&b.year<=e.end);
      return items.length ? `<section class="era-section" aria-labelledby="era-title-${e.id}"><header class="era-heading"><h3 id="era-title-${e.id}">${E(e.title)}</h3><span>${E(e.range)}</span><small>${items.length} 场</small></header>${items.map(node).join('')}</section>` : '';
    }).join('');
  }
  function reset() {
    eraId='all';$('#query').value='';$('#region').value='all';$('#thread').value='all';
  }
  function navigate(hash) {
    if (location.hash!==hash) history.pushState(null,'',hash);
    route();
  }
  function focusEvent(id) {
    const b = byId.get(id);if(!b)return;
    let target = document.getElementById('event-'+id);
    if (!target) { reset();render();target=document.getElementById('event-'+id); }
    opened.add(id);target.open=true;
    target.scrollIntoView({block:'start',behavior:'instant'});
    target.querySelector('summary').focus({preventScroll:true});
  }
  function openDetail(id) {
    const b=byId.get(id);if(!b)return;
    const t=threads.get(b.thread);
    $('#detailContent').innerHTML=`<header class="detail-head"><p class="kicker">${E(b.area)} · ${E(t.title)}</p><h2 id="detailTitle">${E(b.name)}</h2><p class="detail-parties">${E(b.polities)}</p><p class="detail-meta">${E(b.date)}　｜　${E(b.location)}</p></header>${story(b)}${connections(b)}${notes(b)}<div class="permalink-row">${eventLink(b,'回到首页时间线定位 ↗')}<a class="detail-link" href="#battle/${encodeURIComponent(b.id)}">本条分享链接 ↗</a></div>`;
    if(!$('#detail').open)$('#detail').showModal();$('#detail').scrollTop=0;
  }
  function route() {
    const [kind,raw] = location.hash.slice(1).split('/');
    let id;try{id=decodeURIComponent(raw??'')}catch{return}
    if(kind==='battle'){openDetail(id);return}
    if($('#detail').open)$('#detail').close();
    if(kind==='thread' && threads.has(id)) {
      reset();$('#thread').value=id;render();$('#collection').scrollIntoView({block:'start',behavior:'instant'});
    } else if(kind==='event') focusEvent(id);
    else if(kind==='era' && (id==='all'||eras.some(e=>e.id===id))) {
      reset();eraId=id;render();$('#collection').scrollIntoView({block:'start',behavior:'instant'});
    }
  }
  const areas=['中国','欧洲','东亚','南亚','中亚','西亚与北非','非洲','北美','南美','太平洋'];
  $('#region').innerHTML += areas.map(a=>`<option value="${E(a)}">${E(a)}</option>`).join('');
  $('#thread').innerHTML += data.threads.map(t=>`<option value="${E(t.id)}">${E(t.title)}</option>`).join('');
  $('#query').addEventListener('input',render);
  $('#region').addEventListener('change',render);
  $('#thread').addEventListener('change',()=>{
    const tid=$('#thread').value;
    if(tid==='all'){history.replaceState(null,'','#collection');render()}
    else navigate('#thread/'+encodeURIComponent(tid));
  });
  document.addEventListener('click',e=>{
    const thread=e.target.closest('button[data-thread]');
    const era=e.target.closest('button[data-era]');
    const link=e.target.closest('a[data-event]');
    if(thread) navigate('#thread/'+encodeURIComponent(thread.dataset.thread));
    else if(era) navigate('#era/'+era.dataset.era);
    else if(link && !e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){e.preventDefault();navigate(link.getAttribute('href'))}
    else if(e.target.closest('#reset,[data-reset]')){reset();history.replaceState(null,'','#collection');render()}
  });
  $('#timeline').addEventListener('toggle',e=>{
    const node=e.target;if(!node.matches('.battle-node')||!node.isConnected)return;
    if(node.open)opened.add(node.dataset.battle);else opened.delete(node.dataset.battle);
  },true);
  $('#detail .close').addEventListener('click',()=>$('#detail').close());
  $('#detail').addEventListener('close',()=>{if(location.hash.startsWith('#battle/'))history.replaceState(null,'','#collection')});
  window.addEventListener('hashchange',route);window.addEventListener('popstate',route);
  render();route();
})();
