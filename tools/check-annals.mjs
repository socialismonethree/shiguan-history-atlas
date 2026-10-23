import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),docs=path.join(root,'docs');
const base=JSON.parse(fs.readFileSync(path.join(docs,'history-data.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(docs,'expanded/manifest.json'),'utf8'));
function load(skip){const c={window:{HISTORY_DATA:structuredClone(base)}};vm.createContext(c);for(const s of manifest.scripts)if(s!==skip)vm.runInContext(fs.readFileSync(path.join(docs,s),'utf8'),c);return c.window.HISTORY_DATA;}
const D=load();assert.equal(D.expansionReady,true);assert.equal(D.events.length,manifest.counts.chinaEvents);assert.equal(D.people.length,manifest.counts.people);
const failure=load(manifest.scripts.find(s=>s.includes('/events-')));assert.equal(failure.events.length,base.events.length);assert.equal(failure.people.length,base.people.length);assert.equal(failure.expansionLoadError,true);
const c={D,document:{addEventListener(){}},period:()=>D.periods.find(p=>p.id==='tang'),worldEvents:()=>D.worldEvents,by:(k,id)=>D[k].find(e=>e.id===id)};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(docs,'annals.js'),'utf8'),c);
assert.equal(vm.runInContext('annalsCalendar(annalsOrdinal(-1)+1)',c),1);
assert.equal(JSON.stringify(vm.runInContext('annalsYear=-1;annalsStep=5;annalsBounds()',c)),JSON.stringify([-1,4]));
assert.equal(JSON.stringify(vm.runInContext('annalsYear=1912;annalsBounds()',c)),JSON.stringify([1912,1912]));
const list=vm.runInContext('annalsYear=755;annalsStep=5;annalsRegion="china";annalsMode="window";annalsSelected()',c);assert(list.length>0);assert(list.every(e=>e.start>=755&&e.start<=759&&e.annalsRegion==='china'));
for(const r of D.regions){c.testRegion=r.id;assert(vm.runInContext('annalsRegion=testRegion;annalsMode="all";annalsSelected().every(e=>e.annalsRegion===testRegion)',c));}
const people=new Map(D.people.map(p=>[p.id,p]));for(const e of [...D.events,...D.worldEvents])for(const id of e.personIds){assert(people.has(id));if(e.expanded)assert(people.get(id).eventIds.includes(e.id));}
const html=fs.readFileSync(path.join(docs,'index.html'),'utf8');for(const s of manifest.scripts)assert(html.includes('defer src="'+s+'?'));assert(html.indexOf('expanded/99-links')<html.indexOf('src="app.js'));
console.log(JSON.stringify({runtimeCounts:manifest.counts,yearBoundaryTests:'passed',regionalFilters:'passed',reciprocalPeopleLinks:'passed',incompleteLoadFallback:'passed',scriptDependencies:'passed'}));
