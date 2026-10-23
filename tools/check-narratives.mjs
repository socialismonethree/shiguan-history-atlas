import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),docs=path.join(root,'docs');
const manifest=JSON.parse(fs.readFileSync(path.join(docs,'narratives/manifest.json'),'utf8'));
function load(skip){const c={window:{},document:{addEventListener(){}}};vm.createContext(c);for(const s of manifest.scripts)if(s!==skip)vm.runInContext(fs.readFileSync(path.join(docs,s),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(docs,'narrative.js'),'utf8'),c);return c;}
const c=load(),N=c.window.HISTORY_NARRATIVES;
assert.equal(Object.keys(N.records).length,Object.values(manifest.counts).reduce((a,n)=>a+n,0));
assert(Object.keys(N.sources).length===manifest.sourceCount);
for(const n of Object.values(N.records)){assert(n.citations.length>0);for(const ref of n.citations)assert(N.sources[ref.sourceId]);assert(n.sourceIds.every(id=>N.sources[id]));}
// One lost payload disables the whole overlay, without creating a partial set of details.
const incomplete=load(manifest.scripts.find(x=>x.includes('entries-')));
assert.equal(incomplete.window.HISTORY_NARRATIVES,undefined);assert.equal(incomplete.window.HISTORY_NARRATIVES_LOAD_ERROR,true);
assert.equal(vm.runInContext('narrativeMatches({id:"unknown"})',c),true);
assert.equal(vm.runInContext('narrativeOnly=true;narrativeMatches({id:"unknown"})',c),false);
c.sampleId=Object.keys(N.records)[0];assert.equal(vm.runInContext('narrativeMatches({id:sampleId})',c),true);
const html=fs.readFileSync(path.join(docs,'index.html'),'utf8');for(const s of manifest.scripts)assert(html.includes('defer src="'+s+'?'));assert(html.indexOf('narratives/99-commit')<html.indexOf('src="narrative.js'));assert(html.indexOf('src="narrative.js')<html.indexOf('src="app.js'));
console.log(JSON.stringify({counts:manifest.counts,sourceCount:manifest.sourceCount,totalCharacters:manifest.totalCharacters,knownEntityLinks:'passed',sourceLinks:'passed',missingChunkFallback:'passed',readingFilter:'passed',scriptOrder:'passed'}));
// Render every actual article: a valid record must be readable through both China/world paths.
const base=JSON.parse(fs.readFileSync(path.join(docs,'history-data.json'),'utf8'));
const runtime={window:{HISTORY_DATA:base}};vm.createContext(runtime);
for(const s of JSON.parse(fs.readFileSync(path.join(docs,'expanded/manifest.json'),'utf8')).scripts)vm.runInContext(fs.readFileSync(path.join(docs,s),'utf8'),runtime);
const knowledge=runtime.window.HISTORY_DATA;
c.D=knowledge;c.periodId='tang';c.E=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
c.by=(type,id)=>knowledge[type].find(x=>x.id===id);c.theme=()=>({});c.worldRegionTheme=()=>({});c.worldRegionNames=()=> '区域';c.bookRelated=()=>'';c.notebook=()=>'';c.historySources=()=>'';c.entryRow=(type,e)=>'<span>'+c.E(e.title)+'</span>';c.$=()=>({classList:{add(){}}});c.showDetail=html=>{c.rendered=html;};
for(const n of Object.values(N.records)){const entity=c.by('people',n.id)||c.by('events',n.id)||c.by('worldEvents',n.id);c.entity=entity;c.world=entity.scope==='world'||!!entity.regionId;const result=vm.runInContext(n.kind==='person'?'narrativePersonDetail(entity,world)':'narrativeEventDetail(entity,world)',c);assert.equal(result,true);assert(!c.rendered.includes('undefined'));assert(c.rendered.includes('正文依据与阅读边界'));if(n.kind==='person')assert(c.rendered.includes(c.E(n.lifespan)));else assert(c.rendered.includes(c.E(n.time)));}
const person=Object.values(N.records).find(n=>n.kind==='person');if(person){c.entity={...c.by('people',person.id),name:'<script>unsafe</script>'};vm.runInContext('narrativePersonDetail(entity,entity.scope==="world")',c);assert(!c.rendered.includes('<script>unsafe'));assert(c.rendered.includes('&lt;script&gt;'));}
console.log('All real articles render; lifespan/time and evidence present; HTML escaping passed.');
