import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'docs/party-history'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(dir,'catalog.js'),'utf8'),context);const C=context.window.PARTY_HISTORY_CATALOG;
assert(!fs.readFileSync(path.join(dir,'index.html'),'utf8').includes('本地预览'));assert.equal(C.years.length,101);assert.equal(manifest.years,101);assert.equal(new Set(C.years.map(y=>y.year)).size,101);
const search=JSON.parse(fs.readFileSync(path.join(dir,'search-index.json'),'utf8'));assert.equal(search.length,manifest.events);assert.equal(new Set(search.map(e=>e.id)).size,manifest.events);
const sources=new Set(C.sources.map(s=>s.id));for(const s of C.sources){assert(s.author&&s.title&&s.checkedAt);assert(/^https:\/\//.test(s.url));}
let staticEvents=0;const localURLs=new Set();
for(let year=1921;year<=2021;year++){
 const name='year/'+year+'.html',page=fs.readFileSync(path.join(dir,name),'utf8');assert(page.includes('data-party-year="'+year+'"'));
 const entries=search.filter(e=>e.year===year),count=(page.match(/class="event" id=/g)||[]).length;assert.equal(count,manifest.coverage[year]);assert.equal(count,entries.length);assert(count>0);staticEvents+=count;
 assert(page.includes('本年资料与整理说明'));assert(page.includes('data-party-person=')||entries.every(e=>e.people.length===0));
 if(year>1921)assert(page.includes('rel="prev" href="'+(year-1)+'.html"'));else assert(!page.includes('href="1920.html"'));
 if(year<2021)assert(page.includes('rel="next" href="'+(year+1)+'.html"'));else assert(!page.includes('href="2022.html"'));
 for(const e of entries){assert(page.includes('id="'+e.id+'"'));assert(e.summary.length>=30,e.id+' is too brief');for(const person of e.people)assert(C.people.some(p=>p.name===person));}
 for(const m of page.matchAll(/(?:href|src)="([^"]+)"/g)){
  const link=m[1];if(/^(https?:|#|mailto:)/.test(link))continue;const target=link.split(/[?#]/)[0];if(target)localURLs.add(path.resolve(dir,'year',target));
 }
}
assert.equal(staticEvents,manifest.events);
for(const name of ['index.html','people.html','references.html']){
 const page=fs.readFileSync(path.join(dir,name),'utf8');assert(page.includes('lang="zh-CN"'));assert(page.includes('party.css?v=0.10.0'));
 for(const m of page.matchAll(/(?:href|src)="([^"]+)"/g)){
  const link=m[1];if(/^(https?:|#|mailto:)/.test(link))continue;const target=link.split(/[?#]/)[0];if(target)localURLs.add(path.resolve(dir,target));
 }
}
for(const file of localURLs)assert(fs.existsSync(file),'Broken local link '+file);
for(const person of C.people)if(person.overview){assert(person.sourceIds.length);assert(person.sourceIds.every(id=>sources.has(id)));assert(person.contributions?.length>0,person.name);}
const aliasPerson=C.people.find(p=>p.name==='博古（秦邦宪）');assert(aliasPerson&&aliasPerson.occurrences.some(e=>e.year===1946)&&aliasPerson.occurrences.some(e=>e.year===1935));
const home=fs.readFileSync(path.join(dir,'index.html'),'utf8');for(let y=1921;y<=2021;y++)assert(home.includes('href="year/'+y+'.html"'));
assert(fs.readFileSync(path.join(root,'docs/app.js'),'utf8').includes('href="party-history/index.html"'));assert(fs.readFileSync(path.join(root,'docs/app.js'),'utf8').includes('party-search-link'));
// The new archive is independent of the original period model and its saved IDs.
const mainData=JSON.parse(fs.readFileSync(path.join(root,'docs/history-data.json'),'utf8'));assert.equal(mainData.periods.length,19);assert(mainData.periods.every(p=>p.end<=1912));
const last=fs.readFileSync(path.join(dir,'year/2021.html'),'utf8');assert(/7月1日/.test(last),'2021 July coverage missing');assert(/11月/.test(last),'2021 November coverage missing');assert(/12月/.test(last),'2021 December coverage missing');
const keyYears={1927:/南昌|秋收/,1935:/遵义/,1949:/中华人民共和国/,1958:/大跃进|大躍進/,1966:/文化大革命/,1978:/三中全会/,1989:/政治风波|政治風波|风波|風波/,2021:/六中全会|历史决议/};
for(const [year,pattern] of Object.entries(keyYears))assert(pattern.test(fs.readFileSync(path.join(dir,'year/'+year+'.html'),'utf8')),'Important historical context missing '+year);
console.log(JSON.stringify({version:manifest.version,...C.counts,yearRange:'1921–2021',all101StaticPages:'passed',sourceAndPeopleLinks:'passed',adjacentYearNavigation:'passed',localAssets:'passed',full2021Coverage:'passed',keyHistoricalContext:'passed',originalPeriodBoundary:'preserved'}));
