import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),docs=path.join(root,'docs'),manifest=JSON.parse(fs.readFileSync(path.join(docs,'collections/manifest.json'),'utf8'));
function load(skip){const base=JSON.parse(fs.readFileSync(path.join(docs,'history-data.json'),'utf8')),c={window:{HISTORY_DATA:base},document:{addEventListener(){}}};vm.createContext(c);for(const s of manifest.scripts)if(s!==skip)vm.runInContext(fs.readFileSync(path.join(docs,s),'utf8'),c);return c;}
const c=load(),D=c.window.HISTORY_DATA,objects=D.objects.filter(o=>o.expandedObject);assert.equal(D.collectionsReady,true);assert.equal(objects.length,manifest.objects);assert.equal(new Set(D.objects.map(o=>o.id)).size,D.objects.length);assert.equal(new Set(D.sources.map(s=>s.id)).size,D.sources.length);
for(const p of D.periods)assert(objects.filter(o=>o.periodId===p.id).length>=2,p.id);for(const r of D.regions)assert(objects.filter(o=>o.regionId===r.id).length>=3,r.id);
for(const o of objects){assert(o.sourceIds.every(id=>D.sources.some(s=>s.id===id)));assert.equal(o.lookingPoints.length,3);assert(o.description.length>=80,o.id);if(o.scope==='world')assert(!o.periodId);if(o.image){assert(/CC0|Public [Dd]omain|CC BY(?:-SA|-NC-SA)? [234]\.0/.test(o.image.license));if(o.image.localUrl)assert(fs.existsSync(path.join(docs,o.image.localUrl)));}}
// A missing payload keeps the old index intact, with no partially committed sources.
const incomplete=load(manifest.scripts.find(s=>s.includes('objects-')));assert.equal(incomplete.window.HISTORY_DATA.objects.length,19);assert.equal(incomplete.window.HISTORY_DATA.collectionsReady,false);
c.D=D;c.periodId='sui';c.by=(type,id)=>D[type]?.find(x=>x.id===id);c.period=()=>c.by('periods',c.periodId);c.theme=()=>({id:'sui',accent:'#786241',deep:'#38382c'});c.worldRegionTheme=c.theme;c.overlap=(a,b)=>a.start<=b.end&&a.end>=b.start;
c.E=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));c.section=(s,en)=>`<h2>${s}</h2>`;c.sources=()=>'';c.notebook=()=>'';c.showDetail=html=>{c.rendered=html;};c.$=()=>({classList:{add(){}},close(){}});
vm.runInContext(fs.readFileSync(path.join(docs,'cabinet.js'),'utf8'),c);
for(const o of objects){c.o=o;vm.runInContext('cabinetDetail(o)',c);assert(c.rendered.includes(c.E(o.title)));assert(c.rendered.includes('三处值得细看'));assert(!c.rendered.includes('undefined'),o.id);assert(!c.rendered.includes('时代意绘'),o.id);assert(c.rendered.includes('查看实物与机构资料'));}
assert.equal(vm.runInContext('cabinetObjects().filter(o=>cabinetMatches(o)).length',c),manifest.coverage.sui);
assert.equal(vm.runInContext('cabinetObjects().filter(o=>cabinetMatches(o,{scope:"world",range:"all"})).length',c),manifest.world);
assert.equal(vm.runInContext('cabinetObjects().filter(o=>cabinetMatches(o,{scope:"world",region:"africa",range:"all"})).length',c),3);
assert.equal(vm.runInContext('cabinetObjects().filter(o=>cabinetMatches(o,{scope:"world",range:"sync"})).every(o=>overlap(o,period()))',c),true);
assert.equal(vm.runInContext('cabinetObjects().filter(o=>cabinetMatches(o,{scope:"china",range:"all",query:"克利夫兰"})).length',c),6);
assert.equal(vm.runInContext('cabinetObjects().filter(o=>cabinetMatches(o,{scope:"china",range:"all",material:"陶瓷"})).every(o=>o.category==="陶瓷")',c),true);
c.o={...objects[0],title:'<img src=x onerror=alert(1)>'};vm.runInContext('cabinetDetail(o)',c);assert(!c.rendered.includes('<img src=x'));assert(c.rendered.includes('&lt;img'));
const html=fs.readFileSync(path.join(docs,'index.html'),'utf8');assert(html.indexOf('collections/99-commit')<html.indexOf('src="cabinet.js'));assert(html.indexOf('src="cabinet.js')<html.indexOf('src="app.js'));for(const s of manifest.scripts)assert(html.includes('defer src="'+s+'?'));
// Gallery links preserve scope and selected period, including direct world-entry navigation.
const app=fs.readFileSync(path.join(docs,'app.js'),'utf8');c.pages=[['objects']];c.location={hash:'#objects/tang/world/africa/all'};c.year=0;vm.runInContext(app.slice(app.indexOf('function readRoute()'),app.indexOf('\nfunction chime()')),c);vm.runInContext('readRoute()',c);assert.equal(vm.runInContext('cabinetScope',c),'world');assert.equal(vm.runInContext('cabinetRegion',c),'africa');assert.equal(c.periodId,'tang');
// Notes for stable object IDs survive a temporarily missing collection download.
const guard=app.slice(app.indexOf('function validItem('),app.indexOf('\nfunction clean('));c.D={...D,collectionsReady:false};vm.runInContext(guard,c);assert.equal(vm.runInContext('validItem("treasure-open-sui")',c),true);
console.log(JSON.stringify({objects:objects.length,coverage:manifest.coverage,regions:manifest.regions,licensedImages:manifest.licensedImages,allExhibitRendering:'passed',filterAndDeepLinks:'passed',missingChunkFallback:'passed',savedObjectGuard:'passed',htmlEscaping:'passed'}));
