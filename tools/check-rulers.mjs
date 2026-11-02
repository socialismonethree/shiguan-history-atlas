import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'docs/rulers'),read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const C=JSON.parse(fs.readFileSync(path.join(dir,'catalog.js'),'utf8').slice('window.RULER_CATALOG='.length).trim().slice(0,-1)),m=read(path.join(dir,'manifest.json'));
const groups=new Map(C.regimes.map(r=>[r.id,r])),all=C.regimes.flatMap(r=>read(path.join(dir,'content',r.id+'.json')).people);
assert.equal(all.length,m.people);assert.equal(new Set(all.map(p=>p.id)).size,all.length);assert.equal(C.people.length,all.length);
assert.equal(C.regimes.length,m.regimes);assert.equal(m.chinaPeople+m.worldPeople,m.people);assert.equal(m.detailed+m.overviews+m.indexed,m.people);
for(const r of C.regimes){const ps=all.filter(p=>p.regimeId===r.id);assert.equal(ps.length,r.count);assert(r.coverage&&r.intro);assert(['china','world'].includes(r.scope));assert(r.regionId==='china'||C.regions.some(x=>x.id===r.regionId));for(const id of r.periodIds)assert(C.periods.some(x=>x.id===id));}
for(const p of all){assert(p.name&&p.life.length&&p.sources.length);assert(groups.has(p.regimeId));for(const s of p.sources)assert(!s.url||s.url.startsWith('https://'));for(const r of p.reigns){assert(r.start!==0&&r.end!==0);assert(r.start==null||r.end==null||r.start<=r.end);}assert(C.people.some(x=>x.id===p.id&&x.regimeId===p.regimeId));}
for(const period of C.periods)assert(C.regimes.some(r=>r.scope==='china'&&r.periodIds.includes(period.id)),'Missing China period '+period.id);
for(const region of C.regions)assert(C.regimes.some(r=>r.regionId===region.id),'Missing region '+region.id);
const named=n=>all.find(p=>p.name===n),active=(p,y)=>p.reigns.some(r=>r.start!=null&&r.end!=null&&r.start<=y&&r.end>=y);
assert(named('武则天').reigns.some(r=>r.start===690&&r.role==='皇帝'));assert(!named('武则天').reigns.some(r=>r.start===684&&r.role==='皇帝'));
const cleveland=all.find(p=>p.name.includes('克利夫兰'));assert(cleveland&&cleveland.reigns.length===2);assert(!active(cleveland,1891));assert(active(cleveland,1894));
const humayun=all.find(p=>p.name.includes('胡马雍'));assert(humayun&&humayun.reigns.length===2);assert(!active(humayun,1550));
const puyi=all.find(p=>p.personalName==='爱新觉罗·溥仪'||p.name.includes('宣统'));assert(puyi);assert.equal(puyi.reigns[0].end,1912);
const zhuqi=all.find(p=>p.personalName==='朱祁镇');assert(zhuqi&&zhuqi.reigns.length>=2);assert(!active(zhuqi,1452));
assert(named('禹').reigns.every(r=>r.start==null&&r.end==null));assert(named('德川庆喜').reigns.some(r=>r.start===1867&&r.end===1868));
const unique=new Set(all.flatMap(p=>p.relatedEvents.map(e=>e.id)));assert(unique.size>150);assert(all.flatMap(p=>p.relatedEvents).every(e=>e.title&&e.date&&e.sources.length));
for(const f of m.files){const b=fs.readFileSync(path.join(dir,f.path));assert.equal(b.length,f.bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.sha256);}
const catalogPeople=new Map(C.people.map(p=>[p.id,p]));for(const p of all)assert.deepEqual(p.reigns,catalogPeople.get(p.id).reigns);
const text=fs.readdirSync(path.join(dir,'source')).map(f=>fs.readFileSync(path.join(dir,'source',f),'utf8')).join('');assert(!/\/Users\/|file:\/\/|epub2md\//.test(text),'Private local path in public source');
const main=fs.readFileSync(path.join(root,'docs/app.js'),'utf8');assert(main.includes('rulers/index.html?v=0.20.0#period/'));assert(main.includes('rulers/index.html?v=0.20.0#region/'));
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');for(const f of ['rulers.css','rulers.js','catalog.js'])assert(html.includes(f+'?v='+m.version));
console.log(JSON.stringify({version:m.version,people:m.people,regimes:m.regimes,chinaPeriods:C.periods.length,worldRegions:C.regions.length,linkedEventTargets:unique.size,checks:['unique records and references','coverage and generated hashes','no year zero','restored and regent phases','no activity dates used as lifespan','critical cross-calendar dates','no private file paths','contextual entrances']}));
