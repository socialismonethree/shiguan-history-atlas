import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'docs/geo');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const g=read(path.join(dir,'source.json')),base=read(path.join(dir,'base.json')),bm=read(path.join(dir,'base-manifest.json'));
assert.equal(fs.readFileSync(path.join(dir,'data.js'),'utf8'),'window.GEO_DATA='+JSON.stringify(g)+';\n','Generated data must match the canonical source');
const D=read(path.join(root,'docs/history-data.json'));
const context={window:{HISTORY_DATA:D}};vm.createContext(context);
const expanded=read(path.join(root,'docs/expanded/manifest.json'));
for(const s of expanded.scripts)vm.runInContext(fs.readFileSync(path.join(root,'docs',s),'utf8'),context);
const unique=(xs,label)=>assert.equal(new Set(xs).size,xs.length,'Duplicate '+label);
const ids=key=>new Set(D[key].map(x=>x.id));
const periods=ids('periods'),events=ids('events'),world=ids('worldEntries'),regions=ids('regions');
unique(g.places.map(p=>p.id),'place');unique(g.chapters.map(c=>c.periodId),'chapter');unique(g.world.map(w=>w.worldId),'world reference');unique(g.sources.map(s=>s.id),'source');
assert.equal(g.chapters.length,periods.size);assert.equal(g.world.length,world.size);
const places=new Set(g.places.map(p=>p.id)),sources=new Set(g.sources.map(s=>s.id));
function coordinate(p){assert(Number.isFinite(p.lon)&&p.lon>=-180&&p.lon<=180,'Bad longitude');assert(Number.isFinite(p.lat)&&p.lat>=-90&&p.lat<=90,'Bad latitude');}
function sourceRefs(x){assert(x.sourceIds?.length,'Missing sources');for(const id of x.sourceIds)assert(sources.has(id),'Missing source '+id);}
for(const p of g.places){coordinate(p);assert(p.name&&p.modern&&p.kind&&p.why&&p.accuracy&&p.coordinateBasis);for(const id of Object.keys(p.eraNames||{}))assert(periods.has(id));}
let stops=0,links=0;
for(const c of g.chapters){assert(periods.has(c.periodId));sourceRefs(c);assert(c.title&&c.question&&c.intro&&c.steps.length>=3);for(const [i,s] of c.steps.entries()){stops++;assert(places.has(s.placeId));assert(Number.isInteger(s.year)&&s.year!==0&&s.year>=-2070&&s.year<=1912);assert(!i||s.year>=c.steps[i-1].year,'Unordered stops');assert(s.title&&s.body.length>=25);for(const l of s.links||[]){links++;assert(events.has(l.id),'Dangling event '+l.id);assert(l.title);}}}
for(const w of g.world){assert(world.has(w.worldId));assert(regions.has(w.regionId));coordinate(w);sourceRefs(w);assert(w.name&&w.why&&w.accuracy);assert(w.start<=w.end&&w.start!==0&&w.end!==0);if(w.variants){const vs=w.variants;assert.equal(vs[0].start,w.start);assert.equal(vs.at(-1).end,w.end);for(const [i,v] of vs.entries()){coordinate(v);assert(v.name&&v.start<=v.end);assert(!i||v.start===vs[i-1].end+1,'Variant gap or overlap');}}}
function at(id,y){const w=g.world.find(w=>w.worldId===id);return w.variants?.find(v=>v.start<=y&&v.end>=y)?.name||w.name;}
assert.match(at('w-nara-heian',713),/奈良/);assert.match(at('w-nara-heian',785),/长冈/);assert.match(at('w-nara-heian',800),/京都/);
assert.match(at('w-caliphates',713),/大马士革/);assert.match(at('w-caliphates',800),/巴格达/);assert.match(at('w-caliphates',850),/萨迈拉/);
assert.notEqual(at('w-ottoman-safavid',1400),at('w-ottoman-safavid',1500));
assert.notEqual(at('w-angkor-maritime',700),at('w-angkor-maritime',900));
for(const id of ['changanhan','changantang','hanluoyang','suitangluoyang'])assert(places.has(id),'Separated archaeological city sites');
const qin=g.chapters.find(c=>c.periodId==='qin');assert.equal(qin.steps[0].year,-230);assert.equal(qin.steps.at(-1).year,-221);
let vertices=0;
function coords(c){if(typeof c[0]==='number'){coordinate({lon:c[0],lat:c[1]});vertices++;}else for(const x of c)coords(x);}
function rings(geometry){let rs=geometry.type==='Polygon'?geometry.coordinates:geometry.type==='MultiPolygon'?geometry.coordinates.flat():[];for(const r of rs){assert(r.length>=4);assert.deepEqual(r[0],r.at(-1),'Open polygon ring');}}
for(const [k,n] of [['land','landFeatures'],['rivers','riverFeatures'],['terrain','terrainFeatures']]){assert.equal(base[k].type,'FeatureCollection');assert.equal(base[k].features.length,bm[n]);for(const f of base[k].features){coords(f.geometry.coordinates);rings(f.geometry);}}
assert.equal(fs.statSync(path.join(dir,'base.json')).size,bm.baseBytes);for(const l of base.labels){coordinate(l);assert(l.name&&l.zoom>=0);}
const html=fs.readFileSync(path.join(root,'docs/index.html'),'utf8'),app=fs.readFileSync(path.join(root,'docs/app.js'),'utf8');
for(const file of ['atlas.js','atlas.css','data.js'])assert(html.includes('geo/'+file+'?v='+g.version));
assert(app.includes("['map','⌖','历史地图']"));assert(!app.includes('function mapSVG()'));
const manifest={version:g.version,chapters:g.chapters.length,chinaPlaces:g.places.length,narrativeStops:stops,eventLinks:links,worldReferences:g.world.length,datedWorldSeries:g.world.filter(w=>w.variants).length,sourceRecords:g.sources.length,riverFeatures:bm.riverFeatures,terrainFeatures:bm.terrainFeatures,vertices,naturalLabels:base.labels.length,baseSHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'base.json'))).digest('hex'),checks:['source-generated parity','source/event/period/place references','WGS84 coordinates and polygon rings','chronological order and dated world variants','critical capital dates','entry points and asset versions']};
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest,null,2));
