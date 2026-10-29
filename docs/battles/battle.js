'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const data = window.BATTLE_DATA;
  if (!data || !Array.isArray(data.battles) || data.battles.some(x => !Array.isArray(x.narrative) || x.narrative.length < 3)) {
    $('#status').textContent = '战役正文暂未完整载入，请刷新重试。';
    return;
  }
  const records = data.battles;
  const source = new Map(data.sources.map(s => [s.id, s]));

  function render() {
    const q = $('#query').value.trim().toLowerCase();
    const region = $('#region').value;
    const list = records.filter(x => (region === 'all' || x.region === region) &&
      [x.name, x.date, x.period, x.location, x.cause, x.process, x.result, x.impact, ...x.narrative, ...x.people].join(' ').toLowerCase().includes(q));
    list.sort($('#sort').value === 'name'
      ? (a, b) => a.name.localeCompare(b.name, 'zh-CN')
      : (a, b) => a.year - b.year || (a.order ?? a.sortOrder ?? 999) - (b.order ?? b.sortOrder ?? 999) || a.name.localeCompare(b.name, 'zh-CN'));
    $('#status').textContent = `显示 ${list.length} / ${records.length} 场已整理战役 · 中国与世界`;
    $('#empty').hidden = list.length > 0;
    $('#cards').innerHTML = list.map(x => `<button class="card" data-id="${E(x.id)}"><span class="card-top"><span>${E(x.region)} · ${E(x.period)}</span><span>${E(x.date)}</span></span><h3>${E(x.name)}</h3><p>${E(x.narrative[0].slice(0, 88))}${x.narrative[0].length > 88 ? '…' : ''}</p><small>读这场战役 ↗</small></button>`).join('');
  }

  function open(id) {
    const x = records.find(v => v.id === id);
    if (!x) return;
    $('#detailContent').innerHTML = `
      <header class="detail-head"><p class="kicker">${E(x.region)} · ${E(x.period)} / 战役纵览</p><h2 id="detailTitle">${E(x.name)}</h2><p class="detail-meta">${E(x.date)}　｜　${E(x.location)}</p></header>
      <article class="battle-story" aria-label="战役叙事">${x.narrative.map(p => `<p>${E(p)}</p>`).join('')}</article>
      <aside class="reading-notes" aria-label="阅读补充">
        <details><summary>人物索引 <span>${x.people.length} 位关联人物</span></summary><p class="people-index">${E(x.people.join(' · '))}</p></details>
        <details><summary>史料与不同记载 <span>查看出处与辨析</span></summary>
          ${x.dispute ? `<div class="source-note"><h3>史料辨析</h3><p>${E(x.dispute)}</p></div>` : ''}
          <div class="detail-sources"><h3>资料来源</h3>${x.sources.map(id => source.get(id)).filter(Boolean).map(s => `<p>${s.unavailable ? E(s.title) + '（链接此前未通过访问核验，暂不跳转）' : `<a href="${E(s.url)}" target="_blank" rel="noopener noreferrer">${E(s.title)} ↗</a>`}<br><span>${E(s.publisher)}</span></p>`).join('')}</div>
        </details>
      </aside>
      <a class="detail-link" href="#battle/${encodeURIComponent(x.id)}">本条分享链接 ↗</a>`;
    const dialog = $('#detail');
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }

  $('#cards').addEventListener('click', e => {
    const card = e.target.closest('[data-id]');
    if (card) {
      history.pushState(null, '', '#battle/' + encodeURIComponent(card.dataset.id));
      open(card.dataset.id);
    }
  });
  $('#detail .close').addEventListener('click', () => $('#detail').close());
  $('#detail').addEventListener('close', () => {
    if (location.hash.startsWith('#battle/')) history.replaceState(null, '', '#collection');
  });
  for (const id of ['query', 'region', 'sort']) $('#'+id).addEventListener(id === 'query' ? 'input' : 'change', render);
  $('#reset').addEventListener('click', () => {
    $('#query').value = '';
    $('#region').value = 'all';
    $('#sort').value = 'time';
    render();
  });
  function route() {
    if (location.hash.startsWith('#battle/')) {
      try { open(decodeURIComponent(location.hash.slice(8))); } catch { /* Ignore malformed external fragments. */ }
    } else if ($('#detail').open) $('#detail').close();
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  render();
  route();
})();
