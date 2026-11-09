const base = new URL('.', import.meta.url);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
let library;

export function loadLibrary() {
  library ??= fetch(new URL('reading-library.json?v=0.22.0', base))
    .then(response => {
      if (!response.ok) throw new Error('Unable to load reading library');
      return response.json();
    })
    .catch(error => {
      library = undefined;
      throw error;
    });
  return library;
}

function references(items) {
  if (!items?.length) return '';
  return `<details class="atlas-reading-sources"><summary>资料依据与定位</summary><ul>${items.map(item => {
    const label = escape(item.label);
    const citation = item.url?.startsWith('https://')
      ? `<a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`
      : label;
    return `<li>${citation}${item.note ? `<small>${escape(item.note)}</small>` : ''}</li>`;
  }).join('')}</ul></details>`;
}

function internalLink(item) {
  if (!item?.path || /^(?:[a-z]+:|\/)/i.test(item.path)) return '';
  const target = new URL(item.path, base);
  if (!target.href.startsWith(base.href)) return '';
  return `<li><a href="${escape(target.href)}">${escape(item.title)} ↗</a></li>`;
}

function prose(entry) {
  return entry.paragraphs.map(paragraph => `<p>${escape(paragraph)}</p>`).join('');
}

class AtlasReading extends HTMLElement {
  async connectedCallback() {
    this.hidden = true;
    try {
      const data = await loadLibrary();
      if (!this.isConnected) return;
      const ids = this.dataset.ids.split('|').filter(Boolean);
      const topics = [...new Set(ids.flatMap(id => data.lookup[id] || []))];
      const direct = ids.map(id => data.entries[id]).filter(Boolean).slice(0, 1);
      const year = Number(this.dataset.year);
      const linked = topics.map(index => data.topics[index]).filter(topic =>
        !year || !topic.range || (year >= topic.range[0] && year <= topic.range[1])
      );
      if (!direct.length && !linked.length) return;
      const renderTopic = (topic, index) => {
        const links = topic.ids.filter(id => !ids.includes(id)).map(id => internalLink(data.targets[id])).filter(Boolean);
        return `<details class="atlas-reading-topic"${!direct.length && index === 0 ? ' open' : ''}>
          <summary>${escape(topic.title)}</summary>${prose(topic)}${references(topic.references)}
          ${links.length ? `<details class="atlas-reading-sources"><summary>沿专题读原条目</summary><ul>${links.join('')}</ul></details>` : ''}
        </details>`;
      };
      this.innerHTML = `<section aria-label="补充阅读">${direct.map(entry =>
        `<h3>${escape(entry.title || '正文补充')}</h3>${prose(entry)}${references(entry.references)}`
      ).join('')}${linked.length ? `<h3>${escape(this.dataset.title || '专题脉络')}</h3>${linked.map(renderTopic).join('')}` : ''}</section>`;
      this.hidden = false;
    } catch {
      // Existing material remains readable if the optional anthology is unavailable.
    }
  }
}

if (!customElements.get('atlas-reading')) {
  const style = document.createElement('style');
  style.textContent = `
    atlas-reading:not([hidden]) { display: block; margin: 1.65rem 0; }
    atlas-reading[hidden] { display: none; }
    atlas-reading > section { border-block: 1px solid var(--line, #a39a8a80); padding: 1.2rem 0; }
    atlas-reading h3 { font-family: var(--serif, "Songti SC", serif); font-size: 1.23rem; margin: .4rem 0 .9rem; }
    atlas-reading p { max-width: 76ch; font-size: max(13px, .92rem); line-height: 1.9; margin: .85rem 0; overflow-wrap: anywhere; }
    atlas-reading .atlas-reading-topic { padding: .65rem .8rem; margin: .75rem 0; border-inline-start: 2px solid var(--accent, var(--red-dark, #aa8b65)); }
    atlas-reading summary { cursor: pointer; line-height: 1.65; font-weight: 600; }
    atlas-reading .atlas-reading-sources { font-size: .84rem; margin: .8rem 0; }
    atlas-reading .atlas-reading-sources small { display: block; }
    atlas-reading ul { padding-inline-start: 1.2rem; }
    atlas-reading li { margin: .35rem 0; overflow-wrap: anywhere; }
  `;
  document.head.append(style);
  customElements.define('atlas-reading', AtlasReading);
}

export function attachChronology() {
  const route = location.pathname.match(/\/party-history\/(?:leaders\/([a-z]+)\/|(mao)\/)(?:(?:year\/)(\d{4})\.html|index\.html)?$/);
  const hero = document.querySelector('.mao-year-hero, .mao-hero');
  if (!route || !hero) return;
  const person = route[1] || route[2];
  const year = Number(route[3]);
  const panel = document.createElement('atlas-reading');
  panel.dataset.ids = 'leader:' + person;
  panel.dataset.title = '按人生阶段读';
  if (year) panel.dataset.year = year;
  hero.after(panel);
  if (!year) return;

  const folder = 'party-history/' + (person === 'mao' ? 'mao' : 'leaders/' + person) + '/';
  const index = new URL(folder + 'search-index.json', base);
  fetch(index).then(response => {
    if (!response.ok) throw new Error('Chronology unavailable');
    return response.json();
  }).then(years => {
    const documented = years.filter(row => row.events?.length);
    const earlier = documented.filter(row => row.year < year).at(-1);
    const later = documented.find(row => row.year > year);
    const nearby = [earlier, later].filter(row => row && Math.abs(row.year - year) <= 8);
    if (!nearby.length) return;
    const details = document.createElement('details');
    details.className = 'event-evidence';
    details.innerHTML = `<summary>前后有据纪事</summary><p>沿此人的原有纪年连读。下列年份各自对应史料记录。</p>${nearby.map(row => {
      const event = row.events[0];
      const path = folder + 'year/' + row.year + '.html#' + encodeURIComponent(event.id);
      return `<section><h3><a href="${escape(new URL(path, base).href)}">${row.year}年 · ${escape(event.title)} ↗</a></h3>
        <p>${escape(event.date)}${event.place ? ' · ' + escape(event.place) : ''}</p><p>${escape(event.description)}</p></section>`;
    }).join('')}`;
    panel.after(details);
  }).catch(() => {});
}
