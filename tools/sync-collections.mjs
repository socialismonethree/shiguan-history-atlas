import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),docs=path.join(root,'docs'),dir=path.join(docs,'collections');
const catalogue=JSON.parse(fs.readFileSync(path.join(dir,'source/catalog.json'),'utf8'));
const records=catalogue.files.flatMap(f=>JSON.parse(fs.readFileSync(path.join(dir,'source',f),'utf8')));
const D=JSON.parse(fs.readFileSync(path.join(docs,'history-data.json'),'utf8'));
const knownSources=new Set(catalogue.sources.map(s=>s.id)),seen=new Set(),baseIds=new Set(D.objects.map(o=>o.id));
if(knownSources.size!==catalogue.sources.length)throw Error('Duplicate museum source');
for(const s of catalogue.sources)if(!s.id||!s.title||!s.author||!s.checkedAt||!/^https:\/\//.test(s.url))throw Error('Invalid museum source '+s.id);
const coverage={},regions={};
for(const o of records){
 if(!/^treasure-[a-z0-9-]+$/.test(o.id)||seen.has(o.id)||baseIds.has(o.id))throw Error('Invalid/colliding object '+o.id);seen.add(o.id);
 if(!['china','world'].includes(o.scope))throw Error('Invalid scope '+o.id);
 if(o.scope==='china'){if(!D.periods.some(p=>p.id===o.periodId))throw Error('Unknown period '+o.id);coverage[o.periodId]=(coverage[o.periodId]||0)+1;}else{if(!D.regions.some(r=>r.id===o.regionId)||o.periodId)throw Error('Invalid world region '+o.id);regions[o.regionId]=(regions[o.regionId]||0)+1;}
 for(const k of ['title','dateLabel','material','category','museum','description','significance','note'])if(typeof o[k]!=='string'||!o[k].trim())throw Error('Missing '+k+' '+o.id);
 if(!Number.isInteger(o.start)||!Number.isInteger(o.end)||o.start===0||o.end===0||o.start>o.end||o.start>1912||o.end>1930)throw Error('Invalid date '+o.id);
 if(!o.sourceIds?.length||o.sourceIds.some(id=>!knownSources.has(id))||!o.citations?.length||o.citations.some(c=>!o.sourceIds.includes(c.sourceId)||!c.locator))throw Error('Missing evidence '+o.id);
 if(o.lookingPoints?.length!==3||o.lookingPoints.some(p=>typeof p!=='string'||p.length<10))throw Error('Missing looking points '+o.id);
 if(o.image&&(!/^https:\/\//.test(o.image.url)||!o.image.credit||!o.image.license||!o.image.sourceUrl))throw Error('Image rights missing '+o.id);
 o.expandedObject=true;
}
for(const p of D.periods)if((coverage[p.id]||0)<2)throw Error('Missing dynasty objects '+p.id);
for(const r of D.regions)if((regions[r.id]||0)<3)throw Error('Missing world objects '+r.id);
const scripts=[];const write=(name,body)=>{fs.writeFileSync(path.join(dir,name),body+'\n');scripts.push('collections/'+name);};
// Stage independently so a lost chunk never commits a partial catalogue or its sources.
write('00-stage.js','window.HISTORY_COLLECTION_STAGE={objects:[],sources:'+JSON.stringify(catalogue.sources)+'};');
let chunk=[],bytes=0,index=0;function flush(){if(!chunk.length)return;write('objects-'+String(++index).padStart(2,'0')+'.js','window.HISTORY_COLLECTION_STAGE.objects.push(...'+JSON.stringify(chunk)+');');chunk=[];bytes=0;}
for(const o of records){const size=Buffer.byteLength(JSON.stringify(o));if(bytes+size>80000)flush();chunk.push(o);bytes+=size;}flush();
write('99-commit.js',`{const C=window.HISTORY_COLLECTION_STAGE,D=window.HISTORY_DATA;if(C&&D&&C.objects.length===${records.length}&&C.sources.length===${catalogue.sources.length}&&new Set(C.objects.map(o=>o.id)).size===${records.length}&&!C.objects.some(o=>D.objects.some(x=>x.id===o.id))&&!C.sources.some(s=>D.sources.some(x=>x.id===s.id))){D.objects.push(...C.objects);D.sources.push(...C.sources);D.collectionsReady=true;}else if(D)D.collectionsReady=false;delete window.HISTORY_COLLECTION_STAGE;}`);
const manifest={version:'0.9.0',scripts,objects:records.length,china:records.filter(o=>o.scope==='china').length,world:records.filter(o=>o.scope==='world').length,sources:catalogue.sources.length,licensedImages:records.filter(o=>o.image).length,coverage,regions};
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
let html=fs.readFileSync(path.join(docs,'index.html'),'utf8').replace(/<!-- collections:start -->[\s\S]*?<!-- collections:end -->/,'');html=html.replace('<script defer src="cabinet.js','<!-- collections:start -->'+scripts.map(s=>`<script defer src="${s}?v=0.9.0"></script>`).join('')+'<!-- collections:end --><script defer src="cabinet.js');fs.writeFileSync(path.join(docs,'index.html'),html);
console.log(JSON.stringify(manifest));
