'use strict';

const $ = (selector) => document.querySelector(selector);
const escapeText = (value) => String(value).replace(/[&<>"']/g, (char) =>
  ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char]);
const E = escapeText;
const countryPath = (country, period) => '#country/' + country.id + (period ? '/' + period.id : '');
const chapterPath = (country, period) => countryPath(country, period) + '/chapter';
const normalize = (value) => value.toLowerCase().replace(/[\s·・—－-]/g, '');
const regions = ['欧洲', '亚洲', '非洲', '北美洲', '拉丁美洲', '大洋洲'];
const landmarks = [1492, 1776, 1789, 1848, 1868, 1914, 1919, 1939, 1945, 1947, 1960, 1989, 1991, 2001];
const chineseEras = [
  [-2070, 'xia', '夏代参考框架'], [-1600, 'shang', '商'], [-1046, 'zhou', '西周'],
  [-770, 'eastern', '春秋战国'], [-221, 'qin', '秦'],
  [-206, 'han', '西汉'], [9, 'xin', '新与两汉之际'], [25, 'eastern-han', '东汉'], [220, 'three-kingdoms', '三国'],
  [265, 'western-jin', '西晋'], [317, 'eastern-jin', '东晋与五胡十六国'], [420, 'north-south', '南北朝'],
  [581, 'sui', '隋'], [618, 'tang', '唐'], [907, 'five-dynasties', '五代十国'],
  [960, 'song-liao-xia-jin', '宋辽夏金'], [1271, 'yuan', '元'], [1368, 'ming', '明'], [1644, 'qing', '清']
];
let countryList = [];
let selectedRegion = '';
let selectedYear;
let eventsByYear = new Map();
let readingLoaded = false;

function parseYear(label) {
  const result = label.match(/^(公元前|前)?\s*(\d{1,4})(?=\s*(?:年|[.\/-]|$))/);
  if (!result) return null;
  const rest = label.slice(result[0].length);
  return /^(?:\s*年)?\s*[—–～~至]/.test(rest) ? null : Number(result[2]) * (result[1] ? -1 : 1);
}

function externalLinks(year) {
  if (!year) return '';
  const era = chineseEras.findLast(([start]) => start <= year);
  const links = [];
  if (year <= 1912 && era) {
    links.push('<a href="../index.html#annals/' + era[1] + '/' + year + '/1/all/window/0">同期中国 · ' + era[2] + ' →</a>');
  }
  if (year >= 1921 && year <= 2021) {
    links.push('<a href="../party-history/year/' + year + '.html">同期党史 · ' + year + '年 →</a>');
  }
  if (year >= 1914 && year <= 1918 || year >= 1939 && year <= 1945) {
    links.push('<a href="../world-wars/index.html#' + (year < 1919 ? 'ww1/' + year + (year === 1914 ? '-07' : '-01') : 'ww2/' + year + (year === 1939 ? '-09' : '-01')) + '">两次世界大战专题 →</a>');
  }
  return links.join('');
}

function currentRoute() {
  const match = location.hash.match(/^#country\/([a-z0-9-]+)(?:\/view\/(chronicle|people|archives)(?:\/(\d+))?|\/([a-z0-9-]+)(?:\/chapter)?)?$/);
  const query = new URLSearchParams(location.search);
  const country = countryList.find((entry) => entry.id === (match?.[1] || query.get('country'))) ||
    countryList.find((entry) => entry.region === query.get('region')) || countryList.find((entry) => entry.id === 'usa') || countryList[0];
  const period = country.periods.find((entry) => entry.id === match?.[4]) || country.periods[0];
  const person = Number(match?.[3]) - 1;
  return {country, period, panel: match?.[2] || 'overview', chapter: Boolean(match?.[4]), person: person >= 0 ? person : undefined};
}

function filterDirectory() {
  const {country} = currentRoute();
  const search = normalize($('#search').value);
  $('#regions').innerHTML = [['', '全部'], ...regions.map((name) => [name, name])]
    .filter(([id]) => !id || countryList.some((item) => item.region === id))
    .map(([id, title]) => '<button type="button" data-region="' + id + '" aria-pressed="' + (selectedRegion === id) + '">' + title + '</button>').join('');

  const list = countryList.filter((item) => !selectedRegion || item.region === selectedRegion)
    .map((item) => ({item, matches: search ? item.periods.filter((period) => period.search.includes(search)) : [],
      figures: search ? (item.reading?.figures || []).map((figure, index) => ({figure, index}))
        .filter(({figure}) => normalize([figure.name, figure.role, ...figure.body].join(' ')).includes(search)) : []}))
    .filter(({item, matches, figures}) => !search || item.search.includes(search) || matches.length || figures.length);
  $('#catalogCount').textContent = '显示 ' + list.length + ' / ' + countryList.length + ' 个国别入口';
  $('#countries').innerHTML = list.map(({item, matches, figures}) => {
    const match = item.names.includes(search) ? null : matches[0];
    const link = item.names.includes(search) ? countryPath(item) : figures.length ? personPath(item, figures[0].index) : match ? chapterPath(item, match) : countryPath(item);
    const description = figures.length && !item.names.includes(search) ? figures[0].figure.name : match ? match.title + (matches.length > 1 ? ' · 共 ' + matches.length + ' 章' : '') : item.region + ' · ' + item.periods.length + ' 章';
    return '<a href="' + link + '" aria-current="' + (item === country) + '">' + E(item.name) + '<small>' + E(description) + '</small></a>';
  }).join('') || '<p>没有匹配条目，可尝试另一种译名或切换地区。</p>';

  const countryNameMatches = list.some(({item}) => item.names.includes(search));
  const hits = search && !countryNameMatches ? list.flatMap(({item, matches}) => matches.map((period) => ({item, period}))) : [];
  $('#searchMatches')?.remove();
  const portraits = search && !countryNameMatches ? list.flatMap(({item, figures}) => figures.map(({figure, index}) => ({item, figure, index}))) : [];
  if (hits.length || portraits.length) {
    $('#countries').insertAdjacentHTML('afterend', '<div id="searchMatches">' +
      (portraits.length ? '<h3>人物详传</h3>' + portraits.slice(0, 8).map(({item, figure, index}) =>
        '<div class="match"><a href="' + personPath(item, index) + '">' + E(figure.name) + '</a><small>' + E(item.name) + '</small></div>').join('') : '') +
      (hits.length ? '<h3>匹配章节</h3>' : '') + hits.slice(0, 12).map(({item, period}) =>
      '<div class="match"><a href="' + chapterPath(item, period) + '">' + E(item.name + ' · ' + period.title) + '</a><small>' + E(period.range) + '</small></div>').join('') +
      (hits.length > 12 ? '<p>仅显示前 12 章，可缩小检索范围。</p>' : '') + '</div>');
  }
}

function renderCompare() {
  const candidates = [...eventsByYear.entries()].filter(([, entries]) => new Set(entries.map(({country}) => country)).size >= 2);
  const chosen = [...new Set([selectedYear, ...landmarks.filter((year) => candidates.some(([key]) => key === year))])].sort((a, b) => a - b);
  $('#years').innerHTML = chosen.map((year) => '<button type="button" data-year="' + year + '" aria-pressed="' + (year === selectedYear) + '">' +
    (year < 0 ? '前' + Math.abs(year) : year) + '年</button>').join('');
  $('#yearSelect').innerHTML = [...new Set([selectedYear, ...candidates.map(([year]) => year)])].sort((a, b) => a - b).map((year) =>
    '<option value="' + year + '"' + (year === selectedYear ? ' selected' : '') + '>' +
    (year < 0 ? '前' + Math.abs(year) : year) + '年</option>').join('');
  const rows = eventsByYear.get(selectedYear) || [];
  const grouped = new Map();
  for (const row of rows) {
    const list = grouped.get(row.country) || [];
    list.push(row);
    grouped.set(row.country, list);
  }
  $('#comparison').innerHTML = '<div class="compare-grid">' + [...grouped].map(([country, entries]) =>
    '<article class="compare-card"><p class="kicker">' + E(country.region) + '</p><h3>' + E(country.name) + '</h3>' + entries.map(({period, event}) =>
      '<div class="match"><a href="' + chapterPath(country, period) + '">' + E(event[1]) + ' →</a><small>' + E(event[2]) + '</small></div>').join('') + '</article>').join('') +
    '</div><div class="outside">' + externalLinks(selectedYear) + '</div>';
}

function renderRoute(shouldScroll = false) {
  const route = currentRoute();
  const countryHash = /^#country\//.test(location.hash);
  const compareMatch = location.hash.match(/^#compare\/(-?\d+)$/);
  if (compareMatch && eventsByYear.has(Number(compareMatch[1]))) selectedYear = Number(compareMatch[1]);
  if (!readingLoaded || countryHash) {
    renderRoom(route);
    filterDirectory();
    readingLoaded = true;
  }
  renderCompare();
  if (countryHash && shouldScroll) {
    const profile = route.panel === 'people' && route.person !== undefined ? $('#profile-' + (route.person + 1)) : null;
    const target = profile || (route.chapter ? $('#chapter') : route.panel === 'overview' ? $('#reading') : $('#room-content'));
    target.scrollIntoView();
    (profile?.querySelector('summary') || target).focus({preventScroll:true});
  }
  if (compareMatch && shouldScroll) $('#compare').scrollIntoView();
  if (!location.hash && (new URLSearchParams(location.search).has('q') || selectedRegion)) $('#directory').scrollIntoView();
}

async function initialize() {
  try {
    const load = async (path) => {
      const response = await fetch(path + '?v=' + (path.startsWith('reading/') ? '0.24.0' : '0.23.0'));
      if (!response.ok) throw new Error('HTTP ' + response.status + ' · ' + path);
      return response.json();
    };
    const datasets = await load('data/index.json');
    const additions = load('reading/index.json').then((files) => Promise.allSettled(files.map((file) => load('reading/' + file))))
      .then((outcomes) => outcomes.flatMap((outcome) => outcome.status === 'fulfilled' ? outcome.value : [])).catch(() => []);
    countryList = (await Promise.all(datasets.map((file) => load('data/' + file)))).flat();
    const reading = new Map((await additions).map((entry) => [entry.id, entry]));
    for (const country of countryList) {
      country.reading = reading.get(country.id);
      country.names = [country.name, ...(country.aliases || [])].map(normalize);
      country.search = country.names.join(' ');
      for (const period of country.periods) {
        for (const item of country.reading?.milestones || []) {
          if (item.period !== period.id) continue;
          const year = parseYear(item.date);
          const next = period.events.findIndex(([date]) => parseYear(date) > year);
          period.events.splice(next === -1 ? period.events.length : next, 0, [item.date, item.title, item.body[0]]);
        }
        const expanded = country.reading?.chapters?.[period.id];
        const themes = country.reading?.threads?.filter((item) => item.period === period.id) || [];
        period.search = normalize([expanded?.title, ...(expanded?.body || []), ...themes.flatMap((item) => [item.title, ...item.body]), period.title, period.range, ...period.body, ...period.events.flat(), ...period.people.flat(), ...period.sources.map(([label]) => label)].join(' '));
        for (const event of period.events) {
          const year = parseYear(event[0]);
          if (!year) continue;
          const entries = eventsByYear.get(year) || [];
          entries.push({country, period, event});
          eventsByYear.set(year, entries);
        }
      }
    }
    selectedYear = eventsByYear.has(1945) ? 1945 : eventsByYear.keys().next().value;
    const query = new URLSearchParams(location.search);
    const initialQuery = query.get('q');
    if (initialQuery) $('#search').value = initialQuery;
    if (regions.includes(query.get('region'))) selectedRegion = query.get('region');
    renderRoute(true);
    $('#search').addEventListener('input', filterDirectory);
    $('#regions').addEventListener('click', (event) => {
      const button = event.target.closest('[data-region]');
      if (!button) return;
      selectedRegion = button.dataset.region;
      filterDirectory();
      $('#regions').querySelector('[data-region="' + selectedRegion + '"]')?.focus();
    });
    $('#years').addEventListener('click', (event) => {
      const button = event.target.closest('[data-year]');
      if (!button) return;
      selectedYear = Number(button.dataset.year);
      history.replaceState(null, '', '#compare/' + selectedYear);
      renderCompare();
      $('#years').querySelector('[data-year="' + selectedYear + '"]')?.focus();
    });
    $('#yearSelect').addEventListener('change', (event) => {
      selectedYear = Number(event.target.value);
      history.replaceState(null, '', '#compare/' + selectedYear);
      renderCompare();
    });
    addEventListener('hashchange', () => renderRoute(true));
  } catch (error) {
    console.error(error);
    $('#catalogCount').textContent = '国别目录加载失败';
    $('#reading').removeAttribute('aria-busy');
    $('#reading').innerHTML = '<p>国别史资料暂未载入。请刷新页面，或<a href="../index.html">返回主站</a>。</p>';
  }
}

initialize();
