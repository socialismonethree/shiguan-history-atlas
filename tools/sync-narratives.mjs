import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..'),docs=path.join(root,'docs'),dir=path.join(docs,'narratives');
const input=JSON.parse(fs.readFileSync(path.join(dir,'source/catalog.json'),'utf8'));
const base=JSON.parse(fs.readFileSync(path.join(docs,'history-data.json'),'utf8'));
const context={window:{HISTORY_DATA:base}};vm.createContext(context);
const expanded=JSON.parse(fs.readFileSync(path.join(docs,'expanded/manifest.json'),'utf8'));
for(const s of expanded.scripts)vm.runInContext(fs.readFileSync(path.join(docs,s),'utf8'),context);
const D=context.window.HISTORY_DATA,entities=new Map([...D.events,...D.worldEvents,...D.people].map(x=>[x.id,x]));
const sources=input.sources,knownSources=new Set(sources.map(s=>s.id));
if(knownSources.size!==sources.length)throw Error('Duplicate narrative source');
for(const s of sources)if(D.sources.some(x=>x.id===s.id))throw Error('Source collides with index '+s.id);
for(const s of sources)if(!s.id||!s.title||!s.author||!s.type||!(s.url&&/^https:\/\//.test(s.url)||!s.url&&s.type==='用户提供著作'))throw Error('Incomplete source '+s.id);
const records=input.files.flatMap(file=>JSON.parse(fs.readFileSync(path.join(dir,'source',file),'utf8')));
const seen=new Set(),counts={events:0,worldEvents:0,people:0},coverage={},regions={},chinaPeopleByPeriod={};
const texts=n=>{const fields=n.kind==='person'?['lifespan','origin','overview','lifeStages','contributions','works','legacy','debate']:['time','location','background','process','result','impact','debate'];return fields.map(k=>typeof n[k]==='string'?n[k]:(n[k]||[]).map(x=>[x.label,x.title,x.text,x.note].filter(Boolean).join(' ')).join(' ')).join(' ');};
for(const n of records){const e=entities.get(n.id);if(!e||seen.has(n.id))throw Error('Unknown/duplicate narrative entity '+n.id);seen.add(n.id);const person=D.people.some(p=>p.id===n.id);if(person!==(n.kind==='person'))throw Error('Wrong narrative kind '+n.id);if(!n.sourceIds?.length||!n.citations?.length)throw Error('No evidence '+n.id);for(const id of n.sourceIds)if(!knownSources.has(id))throw Error('Missing source '+id);for(const c of n.citations)if(!n.sourceIds.includes(c.sourceId)||!c.fields?.length||!c.locator)throw Error('Bad evidence '+n.id);
 const required=person?['lifespan','origin','overview','legacy']:['time','location','background','result','impact'];for(const k of required)if(typeof n[k]!=='string'||!n[k].trim())throw Error('Missing '+k+' '+n.id);if(person&&!Array.isArray(n.works))throw Error('Invalid works '+n.id);for(const k of person?['lifeStages','contributions']:['process'])if(!Array.isArray(n[k])||!n[k].length)throw Error('Missing steps '+n.id+'/'+k);
 const evidenceFields=person?['lifespan','origin','overview','lifeStages','contributions','works','legacy']:['time','location','background','process','result','impact'];for(const field of evidenceFields.filter(f=>f!=='works'||n.works?.length))if(!n.citations.some(c=>c.fields.includes(field)))throw Error('No paragraph evidence '+n.id+'/'+field);
 n.searchText=texts(n);n.wordCount=n.searchText.replace(/\s/g,'').length;if(n.wordCount<(person?280:320))throw Error('Narrative too short '+n.id+' '+n.wordCount);
 counts[person?'people':D.events.some(x=>x.id===e.id)?'events':'worldEvents']++;if(person&&e.scope!=='world')for(const id of e.periodIds)chinaPeopleByPeriod[id]=(chinaPeopleByPeriod[id]||0)+1;if(!person&&D.events.some(x=>x.id===e.id))coverage[e.periodId]=(coverage[e.periodId]||0)+1;if(e.scope==='world'||e.regionId)for(const id of e.regionIds||[e.regionId])regions[id]=(regions[id]||0)+1;
}
for(const f of fs.readdirSync(dir))if(f.endsWith('.js'))fs.unlinkSync(path.join(dir,f));
const scripts=[];const write=(name,body)=>{fs.writeFileSync(path.join(dir,name),body+'\n');scripts.push('narratives/'+name);};
write('00-stage.js','window.HISTORY_NARRATIVE_STAGE={records:[],sources:'+JSON.stringify(sources)+'};');
let chunk=[],bytes=0,index=0;function flush(){if(!chunk.length)return;write('entries-'+String(++index).padStart(2,'0')+'.js','window.HISTORY_NARRATIVE_STAGE.records.push(...'+JSON.stringify(chunk)+');');chunk=[];bytes=0;}
for(const n of records){const {searchText,...clean}=n;const size=Buffer.byteLength(JSON.stringify(clean));if(bytes+size>95000)flush();chunk.push(clean);bytes+=size;}flush();
// Keep the original knowledge index usable if any narrative payload is missing.
write('99-commit.js','{const X=window.HISTORY_NARRATIVE_STAGE;if(X&&X.records.length==='+records.length+'&&X.sources.length==='+sources.length+'){for(const n of X.records)n.searchText=JSON.stringify(n);window.HISTORY_NARRATIVES={records:Object.fromEntries(X.records.map(n=>[n.id,n])),sources:Object.fromEntries(X.sources.map(s=>[s.id,s])),counts:'+JSON.stringify(counts)+'};if(window.HISTORY_DATA)window.HISTORY_DATA.sources.push(...X.sources);}else window.HISTORY_NARRATIVES_LOAD_ERROR=true;delete window.HISTORY_NARRATIVE_STAGE;}');
const manifest={version:'0.8.0',scripts,counts,sourceCount:sources.length,totalCharacters:records.reduce((a,n)=>a+n.wordCount,0),coverage,chinaPeopleByPeriod,regions};fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const entry=path.join(docs,'index.html');let html=fs.readFileSync(entry,'utf8').replace(/<!-- narratives:start -->[\s\S]*?<!-- narratives:end -->/,'');const tags='<!-- narratives:start -->'+scripts.map(s=>`<script defer src="${s}?v=0.8.0"></script>`).join('')+'<!-- narratives:end -->';html=html.replace('<script defer src="narrative.js',tags+'<script defer src="narrative.js');fs.writeFileSync(entry,html);console.log(JSON.stringify(manifest));
