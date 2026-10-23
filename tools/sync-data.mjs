import fs from 'node:fs';
import path from 'node:path';
import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),D=JSON.parse(fs.readFileSync(path.join(root,'docs/history-data.json'),'utf8'));
const corpusPath=path.join(root,'docs/book-data.json'),bookCorpus=fs.existsSync(corpusPath)?JSON.parse(fs.readFileSync(corpusPath,'utf8')):null;
const types=['periods','events','places','people','objects','worldEntries','worldEvents','regions','themes','sources'],maps={};
for(const type of types){if(!Array.isArray(D[type]))throw Error('Missing '+type);maps[type]=new Map();for(const x of D[type]){if(!x.id||maps[type].has(x.id))throw Error('Duplicate ID '+type+'/'+x.id);maps[type].set(x.id,x);}}
function has(t,id){if(!maps[t].has(id))throw Error('Broken reference '+t+'/'+id);}
function refs(x){if(!x.sourceIds?.length&&!x.bookRefs?.length)throw Error('Unsourced '+x.id);for(const id of x.sourceIds||[])has('sources',id);for(const r of x.bookRefs||[]){if(!bookCorpus?.volumes.some(v=>v.id===r.volume)||!r.chapter||!Number.isInteger(r.lineStart)||!Number.isInteger(r.lineEnd)||r.lineStart<1||r.lineEnd<r.lineStart||r.lineEnd>bookCorpus.source.lineCount)throw Error('Bad book reference '+x.id);}}
function dates(x){if(!Number.isInteger(x.start)||!Number.isInteger(x.end)||x.start===0||x.end===0||x.start>x.end)throw Error('Bad dates '+x.id);}
function point(p){if(!Number.isFinite(p.lon)||!Number.isFinite(p.lat)||Math.abs(p.lon)>180||Math.abs(p.lat)>90||!p.precision)throw Error('Bad map point '+p.id);}
for(const p of D.periods){dates(p);refs(p);has('places',p.placeId);has('themes',p.id);if(!p.sections?.length||!p.subperiods?.length||!p.summary)throw Error('Incomplete period '+p.id);if(p.focus<p.start||p.focus>p.end||p.focus===0)throw Error('Bad focus '+p.id);for(const s of p.subperiods)dates(s);}
for(const p of D.periods)for(const id of p.keyPersonIds||[])has('people',id);
for(const e of D.events){for(const id of e.relatedPeriodIds||[])has('periods',id);if(e.start===null&&e.end===null){if(!e.dateLabel||!e.note)throw Error('Unlabelled undated event '+e.id);}else dates(e);refs(e);has('periods',e.periodId);if(e.placeId)has('places',e.placeId);for(const id of e.personIds)has('people',id);if(e.coreEntry&&(!e.summary||!e.importance||!e.outcome||!e.category))throw Error('Incomplete core event '+e.id);}
for(const e of D.worldEvents){dates(e);refs(e);has('regions',e.regionId);for(const id of e.worldEntryIds)has('worldEntries',id);for(const id of e.personIds){has('people',id);if(maps.people.get(id).scope!=='world')throw Error('Non-world person '+id);}if(!e.summary||!e.importance||!e.outcome||!e.category||!e.note)throw Error('Incomplete world event '+e.id);}
for(const p of D.people.filter(p=>p.scope==='world'))for(const id of p.eventIds)if(!maps.worldEvents.get(id).personIds.includes(p.id))throw Error('Nonreciprocal world link '+p.id+'/'+id);
for(const e of D.worldEvents)for(const id of e.personIds)if(!maps.people.get(id).eventIds.includes(e.id))throw Error('Nonreciprocal world link '+e.id+'/'+id);
for(const p of D.places)point(p);
for(const p of D.people){refs(p);for(const id of p.periodIds)has('periods',id);for(const id of p.eventIds)has(p.scope==='world'?'worldEvents':'events',id);if(p.scope==='world'){dates(p);for(const id of p.regionIds)has('regions',id);for(const id of p.worldEntryIds)has('worldEntries',id);}if(p.coreEntry&&(!p.role||!p.description||!p.contribution||!p.context))throw Error('Incomplete core person '+p.id);}
for(const o of D.objects){refs(o);has('periods',o.periodId);if(!o.lookingPoints?.length||!o.note)throw Error('Unlabelled object '+o.id);}
for(const e of D.worldEntries){dates(e);refs(e);has('regions',e.regionId);point(e.place);refs(e.art);if(!e.note)throw Error('World entry lacks boundary note '+e.id);}
for(const t of D.themes){refs(t);has('periods',t.id);for(const id of t.eventIds)has('events',id);if(!fs.existsSync(path.join(root,'docs',t.image)))throw Error('Missing artwork '+t.image);if(!t.designNote||!t.imageCredit)throw Error('Unlabelled artwork '+t.id);}
for(const s of D.sources)if(!s.url.startsWith('https://'))throw Error('Invalid URL '+s.id);
const gaps=[];for(const p of D.periods)for(const r of D.regions)if(!D.worldEntries.some(e=>e.regionId===r.id&&e.start<=p.end&&e.end>=p.start))gaps.push(p.id+'/'+r.id);
if(gaps.length)throw Error('Coverage gaps '+gaps.join(', '));
if(D.questions||D.chapters)throw Error('Remove teaching-only collections');
// Book-derived editorial entries remain independent from the source manuscript.
const bookPath=path.join(root,'docs/book-data.json');
if(fs.existsSync(bookPath)){
 const B=JSON.parse(fs.readFileSync(bookPath,'utf8')),ids=new Set(),volumes=new Set(B.volumes.map(v=>v.id));
 if(volumes.size!==B.volumes.length)throw Error('Duplicate book volume');
 for(const s of B.stories){
  if(!s.id||ids.has(s.id))throw Error('Duplicate story '+s.id);ids.add(s.id);has('periods',s.periodId);
  if(!s.title||!s.subtitle||!s.intro||s.scenes.length<3||s.scenes.length>5)throw Error('Incomplete story '+s.id);
  if(!s.sourceRefs?.length)throw Error('Unsourced story '+s.id);
  for(const r of s.sourceRefs)if(!volumes.has(r.volume)||!r.chapter||!Number.isInteger(r.lineStart)||!Number.isInteger(r.lineEnd)||r.lineStart<1||r.lineEnd<r.lineStart||r.lineEnd>B.source.lineCount)throw Error('Bad book locator '+s.id);
  for(const x of s.scenes)if(!x.title||!x.label||!x.body)throw Error('Empty story scene '+s.id);
  for(const x of s.peopleProfiles)for(const k of ['name','role','context','choice','limit'])if(!x[k])throw Error('Empty person context '+s.id+'/'+k);
  for(const id of s.eventIds)has('events',id);for(const id of s.objectIds)has('objects',id);
  for(const k of ['basis','interpretation','limit'])if(!s.evidence[k])throw Error('Missing interpretation boundary '+s.id);
 }
 const missing=D.periods.filter(p=>!B.stories.some(s=>s.periodId===p.id));if(missing.length)throw Error('Missing book stories '+missing.map(p=>p.id).join(','));
 fs.writeFileSync(path.join(root,'docs/book-data.js'),'window.HISTORY_BOOKS = '+JSON.stringify(B,null,2)+';\n');
 console.log(`Validated ${B.stories.length} editorial stories and ${B.stories.reduce((n,s)=>n+s.peopleProfiles.length,0)} person contexts from ${B.volumes.length} indexed volumes.`);
}
fs.writeFileSync(path.join(root,'docs/data.js'),'window.HISTORY_DATA = '+JSON.stringify(D,null,2)+';\n');
console.log(`Validated ${D.periods.length} periods, ${D.events.length} Chinese events, ${D.worldEvents.length} world events, ${D.worldEntries.length} world entries, ${D.objects.length} objects, ${D.people.length} people, ${D.sources.length} sources; ${D.periods.length*D.regions.length} region-period cells covered.`);
