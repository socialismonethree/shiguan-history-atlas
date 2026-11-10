'use strict';

const viewNames = {
  overview: '全史导读',
  chronicle: '大事长卷',
  people: '人物馆',
  archives: '史料架'
};
const countryColors = {
  uk:'#303e54', france:'#3b415c', germany:'#444741', italy:'#663e32', spain:'#683638',
  russia:'#463b53', portugal:'#324c52', netherlands:'#514536', poland:'#613d46', greece:'#334b65',
  japan:'#623533', india:'#5d4727', korea:'#40466a', turkey:'#644033', iran:'#31514e',
  vietnam:'#514835', indonesia:'#503e34', israel:'#375268', 'saudi-arabia':'#364638',
  pakistan:'#25473d', thailand:'#4d3c57', philippines:'#3b4e58',
  egypt:'#6b4d32', 'south-africa':'#42513d', ethiopia:'#5b482e', nigeria:'#365348', morocco:'#693c34',
  usa:'#273f54', canada:'#583840', mexico:'#504d34', brazil:'#3b5040', argentina:'#415067',
  australia:'#614630', 'new-zealand':'#354d50'
};
const roomPath = (country, view) => view === 'overview' ? countryPath(country) : countryPath(country) + '/view/' + view;
const personPath = (country, index) => roomPath(country, 'people') + '/' + (index + 1);
const findPeriod = (country, id) => country.periods.find((period) => period.id === id);
const paragraphs = (body) => body.map((line) => '<p class="prose">' + E(line) + '</p>').join('');
const milestone = (country, title) => country.reading?.milestones?.find((item) => item.title === title);

function references(sources) {
  return '<ul class="source-list">' + sources.map(([label, url]) =>
    '<li><a rel="noopener" href="' + E(url) + '">' + E(label) + '</a></li>').join('') + '</ul>';
}

function cover(country, panel) {
  const events = country.periods.reduce((total, item) => total + item.events.length, 0);
  const profiles = country.reading?.figures?.length || 0;
  return '<header class="country-cover"><p class="kicker">' + E(country.region) + ' · 国别档案</p><h2>' + E(country.name) +
    '</h2>' + (country.reading ? '<p class="lead-question">' + E(country.reading.question) + '</p>' : '') + '<p>' + E(country.intro) +
    '</p><div class="cover-meta"><span>' + country.periods.length + ' 个分期</span><span>' + events + ' 个关键节点</span>' +
    (profiles ? '<span>' + profiles + ' 份人物详传</span>' : '') + '</div></header>' +
    '<nav class="room-nav" aria-label="国别阅览方式">' + Object.entries(viewNames).map(([key, label]) =>
      '<a href="' + roomPath(country, key) + '"' + (panel === key ? ' aria-current="page"' : '') + '>' + label + '</a>').join('') + '</nav>';
}

function eras(country, active) {
  return '<ol class="era-line">' + country.periods.map((period, index) =>
    '<li><a href="' + chapterPath(country, period) + '"' + (active === period ? ' aria-current="page"' : '') +
    '><b>卷 ' + String(index + 1).padStart(2, '0') + '</b><strong>' + E(period.title) + '</strong><small>' + E(period.range) + '</small></a></li>').join('') + '</ol>';
}

function chapterJump(country, period) {
  return '<a class="jump-link" href="' + chapterPath(country, period) + '">进入「' + E(period.title) + '」 →</a>';
}

function feature(country, item, index) {
  const period = findPeriod(country, item.period);
  return '<details class="story-tab"' + (index === 0 ? ' open' : '') + '><summary>' + E(item.title) +
    '</summary><div class="story-body">' + paragraphs(item.body) + references(item.sources) + chapterJump(country, period) + '</div></details>';
}

function overview(country) {
  const reading = country.reading;
  return '<section id="room-content" class="folio" tabindex="-1"><p class="kicker">01 · 全史导读</p><h2>从何处读起</h2>' +
    '<p class="intro">这些分期沿本国历史转折排列。点开任一卷，可看正文、事件、人物与史料。</p>' + eras(country) +
    (reading?.threads?.length ? '<h3 class="folio-subhead">理解这部国史的几条线</h3>' + reading.threads.map((item, index) => feature(country, item, index)).join('') +
      '<h3 class="folio-subhead">代表人物</h3><div class="figure-list">' + reading.figures.map((figure, index) =>
      '<a href="' + personPath(country, index) + '"><strong>' + E(figure.name) + '</strong><span>' + E(figure.life) + '</span><span>' +
      E(figure.role) + '</span></a>').join('') + '</div>' : '') +
    '<div class="lens-links"><a class="jump-link" href="' + roomPath(country, 'chronicle') + '">翻阅大事长卷 →</a>' +
    '<a class="jump-link" href="' + roomPath(country, 'people') + '">查阅本国人物 →</a></div></section>';
}

function eventNote(country, [date, title, text], index) {
  const year = parseYear(date);
  const peer = eventsByYear.get(year)?.some((event) => event.country !== country);
  const external = externalLinks(year);
  const note = country.reading?.events?.[title];
  const citation = note?.sources || milestone(country, title)?.sources;
  return '<details class="story-tab"' + (index === 0 ? ' open' : '') + '><summary class="event-title"><span class="event-date">' +
    E(date) + '</span>' + E(title) + (citation ? '<span class="file-mark">档案解读</span>' : '') +
    '</summary><div class="story-body"><p>' + E(text) + '</p>' + (note ? paragraphs(note.body) : '') + (citation ? references(citation) : '') +
    ((peer || external) ? '<div class="outside">' + (peer ? '<a href="#compare/' + year + '">跨国同年对读 →</a>' : '') + external + '</div>' : '') +
    '</div></details>';
}

function chronicle(country) {
  return '<section id="room-content" class="folio" tabindex="-1"><p class="kicker">02 · 大事长卷</p><h2>沿时间看转折</h2>' +
    '<p class="intro">点开事件看其意义。各阶段保持本国历史分期，能够确定同一年的条目附跨国对读或同期资料。</p>' +
    '<label for="eraPicker">定位到某个分期</label> <select id="eraPicker"><option value="">选择分期</option>' + country.periods.map((period) =>
      '<option value="' + E(period.id) + '">' + E(period.title) + '</option>').join('') + '</select><div class="event-index">' +
    country.periods.map((period) => '<section class="event-section" id="stop-' + E(period.id) + '" tabindex="-1"><h3><a href="' + chapterPath(country, period) + '">' + E(period.title) +
      '</a></h3><p class="range">' + E(period.range) + '</p>' + period.events.map((item, index) => eventNote(country, item, index)).join('') +
      '</section>').join('') + '</div></section>';
}

function peopleRoom(country, chosen) {
  const figures = country.reading?.figures || [];
  return '<section id="room-content" class="folio" tabindex="-1"><p class="kicker">03 · 人物馆</p><h2>在时代中看人物</h2>' +
    '<p class="intro">先读有独立传记的人物，再按姓名检索各时代人物。打开详传后可以回到其主要活动所在的章节。</p>' +
    '<div class="figure-list">' + figures.map((figure, index) =>
      '<a href="' + personPath(country, index) + '" aria-current="' + (index === chosen) + '"><strong>' + E(figure.name) +
      '</strong><span>' + E(figure.role) + '</span></a>').join('') + '</div>' +
    figures.map((figure, index) => '<details class="story-tab" id="profile-' + (index + 1) + '"' + (index === (chosen ?? 0) ? ' open' : '') +
      '><summary><span class="figure-name"><strong>' + E(figure.name) + '</strong><small>' + E(figure.life) +
      '</small></span></summary><div class="story-body figure-body"><p class="role">' + E(figure.role) + '</p>' + paragraphs(figure.body) +
      references(figure.sources) + chapterJump(country, findPeriod(country, figure.period)) + '</div></details>').join('') +
    '<h3>分期人物索引</h3><label for="personFilter">按姓名或事迹查找</label><input id="personFilter" class="people-filter" type="search" placeholder="输入姓名或关键词">' +
    '<p class="muted" id="personCount" role="status"></p>' +
    country.periods.map((period) => '<section class="person-group"><h3><a href="' + chapterPath(country, period) + '">' + E(period.title) +
      '</a></h3><ul>' + period.people.map(([name, note]) => '<li><strong>' + E(name) + '</strong> · ' + E(note) + '</li>').join('') +
      '</ul></section>').join('') + '</section>';
}

function archive(country) {
  return '<section id="room-content" class="folio archives" tabindex="-1"><p class="kicker">04 · 史料架</p><h2>从原始记录重读历史</h2>' +
    '<p class="intro">来源按相关分期归档。法令、官方档案、馆藏与研究资料记录了不同侧面，可回到正文对照它们支持的结论。</p>' +
    country.periods.map((period, index) => {
      const extras = country.reading?.chapters?.[period.id]?.sources || [];
      const readings = [...(country.reading?.threads || []), ...(country.reading?.figures || [])]
        .filter((entry) => entry.period === period.id).flatMap((entry) => entry.sources);
      const eventSources = period.events.flatMap(([, title]) => country.reading?.events?.[title]?.sources || milestone(country, title)?.sources || []);
      const sources = [...new Map([...period.sources, ...extras, ...readings, ...eventSources].map((row) => [row[1], row])).values()];
      return '<details class="story-tab"' + (index === 0 ? ' open' : '') + '><summary>' + E(period.title) + ' · ' +
        sources.length + ' 项资料</summary><div class="story-body">' + references(sources) + chapterJump(country, period) + '</div></details>';
    }).join('') + '</section>';
}

function chapterRoom(country, period) {
  const index = country.periods.indexOf(period);
  const extra = country.reading?.chapters?.[period.id];
  const figures = (country.reading?.figures || []).map((figure, index) => ({figure, index})).filter(({figure}) => figure.period === period.id);
  const neighbors = [[index - 1, '← 上一卷'], [index + 1, '下一卷 →']];
  return '<section class="folio" aria-label="分期导航"><p class="kicker">分期索引</p>' + eras(country, period) + '</section>' +
    '<article class="chapter" id="chapter" tabindex="-1"><p class="kicker">第 ' + (index + 1) + ' 卷 / 共 ' + country.periods.length +
    ' 卷</p><h2>' + E(period.title) + '</h2><p class="range">' + E(period.range) + '</p>' + paragraphs(period.body) +
    (extra ? '<section class="chapter-extra"><p class="kicker">章内专题</p><h3>' + E(extra.title) + '</h3>' + paragraphs(extra.body) +
      '<details><summary>本专题资料</summary>' + references(extra.sources) + '</details></section>' : '') +
    '<div class="facts"><section><h3>关键节点</h3>' + period.events.map((event, index) => eventNote(country, event, index)).join('') +
    '</section><section><h3>关键人物</h3><dl>' + period.people.map(([name, text]) =>
      '<dt>' + E(name) + '</dt><dd>' + E(text) + '</dd>').join('') + '</dl>' + figures.map(({figure, index}) =>
      '<a class="jump-link" href="' + personPath(country, index) + '">读' + E(figure.name) + '详传 →</a>').join('') +
    '</section></div><details class="sources" open><summary>本章史料与进一步阅读</summary>' + references(period.sources) +
    '</details><nav class="chapters-nav" aria-label="翻阅相邻章节"><a href="' + countryPath(country) + '">↑ 全史导读</a>' +
    neighbors.filter(([i]) => country.periods[i]).map(([i, label]) => '<a href="' + chapterPath(country, country.periods[i]) + '">' +
      label + ' · ' + E(country.periods[i].title) + '</a>').join('') + '</nav></article>';
}

function filterPeople(value) {
  const query = normalize(value);
  let count = 0;
  for (const group of document.querySelectorAll('.person-group')) {
    let matches = 0;
    for (const row of group.querySelectorAll('li')) {
      row.hidden = !normalize(row.textContent).includes(query);
      if (!row.hidden) matches++;
    }
    group.hidden = !matches;
    count += matches;
  }
  $('#personCount').textContent = count ? '显示 ' + count + ' 条分期人物记录' : '没有匹配人物，可试姓名的另一种译法。';
}

function renderRoom({country, period, panel, chapter, person}) {
  const reading = $('#reading');
  reading.style.setProperty('--era', countryColors[country.id] || '#34463d');
  const rooms = {overview, chronicle, people: peopleRoom, archives: archive};
  reading.innerHTML = cover(country, chapter ? 'chapter' : panel) +
    (chapter ? chapterRoom(country, period) : rooms[panel](country, person));
  $('#eraPicker')?.addEventListener('change', (event) => {
    const stop = document.getElementById('stop-' + event.target.value);
    if (stop) {
      stop.scrollIntoView();
      stop.focus({preventScroll:true});
    }
  });
  const input = $('#personFilter');
  if (input) {
    input.addEventListener('input', (event) => filterPeople(event.target.value));
    filterPeople('');
  }
  reading.removeAttribute('aria-busy');
}
