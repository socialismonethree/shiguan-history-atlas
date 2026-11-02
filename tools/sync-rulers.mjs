import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'docs/rulers');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),write=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n');
const D=read(path.join(root,'docs/history-data.json')),ctx=vm.createContext({window:{HISTORY_DATA:D}});
for(const area of ['expanded','narratives'])for(const f of read(path.join(root,'docs',area,'manifest.json')).scripts)vm.runInContext(fs.readFileSync(path.join(root,'docs',f),'utf8'),ctx);
const N=ctx.window.HISTORY_NARRATIVES.records,sourceMap=new Map(D.sources.map(s=>[s.id,s])),personMap=new Map(D.people.map(p=>[p.id,p]));
const events=new Map([...D.events,...D.worldEvents].map(e=>[e.id,e]));
vm.runInContext(fs.readFileSync(path.join(root,'docs/book-data.js'),'utf8'),ctx);
const books=new Map(ctx.window.HISTORY_BOOKS.volumes.map(v=>[v.id,v]));
function bookSources(refs=[]){return refs.map(ref=>{const v=books.get(ref.volume);return{title:v?`${v.author}《${v.title}》`:'《中国断代史系列》',url:'',note:[ref.chapter,ref.section,ref.lineStart?'用户提供合并整理本第'+ref.lineStart+'—'+ref.lineEnd+'行':''].filter(Boolean).join('；')}})}
const datasets=fs.readdirSync(path.join(dir,'source')).filter(f=>f.endsWith('.json')).sort().map(f=>read(path.join(dir,'source',f)));
const regimes=datasets.flatMap(d=>d.regimes),rulers=datasets.flatMap(d=>d.rulers);
assert.equal(new Set(regimes.map(r=>r.id)).size,regimes.length,'Duplicate polity');assert.equal(new Set(rulers.map(p=>p.id)).size,rulers.length,'Duplicate person');
const groups=new Map(regimes.map(r=>[r.id,r]));
const year=y=>y==null?'年代未定':y<0?'前'+-y+'年':y+'年';
const source=s=>({title:s.title||'资料',url:s.url||'',note:[s.author,s.note].filter(Boolean).join('；')});
const uniqueSources=ss=>[...new Map(ss.filter(Boolean).map(source).map(s=>[s.title+'|'+s.url,s])).values()];
const generic=/^(此条以个人行动和制度环境相联系|此条主要记录继承位置|名录条目用于定位)/;
function related(id){const e=events.get(id);if(!e)return null;const n=N[id];return{id:e.id,title:e.title,date:e.dateLabel||e.date||year(e.start),summary:e.summary||'',paragraphs:n?[n.background,...(n.process||[]).map(s=>s.text),n.result,n.impact].filter(Boolean):[e.summary,e.importance,e.outcome].filter(Boolean),note:n?.debate||e.note||'',sources:uniqueSources([...bookSources(e.bookRefs),...[...(e.sourceIds||[]),...(n?.sourceIds||[])].map(id=>sourceMap.get(id))])}}
for(const p of rulers){
 const r=groups.get(p.regimeId);assert(r,p.id+' unknown polity');
 p.life=[...new Set((p.life||[]).filter(Boolean))];p.highlights=p.highlights||[];p.uncertainties=p.uncertainties||[];p.aliases=[...new Set((p.aliases||[]).filter(s=>s&&s!==p.name))];
 p.reigns=p.reigns||[];assert(p.reigns.length,p.id+' no reign');
 for(const x of p.reigns){for(const k of ['start','end'])assert(x[k]==null||(Number.isInteger(x[k])&&x[k]!==0),p.id+' invalid '+k);assert(x.start==null||x.end==null||x.start<=x.end,p.id+' reversed reign');}
 const explicit=(p.existingPersonIds||[]).map(id=>personMap.get(id)).filter(Boolean);
 const names=[p.name,p.personalName,...p.aliases].filter(Boolean);
 const matches=explicit.length?explicit:D.people.filter(x=>names.includes(x.name)&&x.scope===r.scope&&
  (r.scope==='china'?(x.periodIds||[]).some(id=>(r.periodIds||[]).includes(id)):(x.regionIds||[]).includes(r.regionId)));
 const n=matches.map(x=>N[x.id]).find(x=>x?.kind==='person');
 if(p.highlights.length<3){
  const matchedIds=new Set(matches.map(x=>x.id)),present=new Set(p.highlights.map(h=>h.eventId));
  const candidates=[...new Set(matches.flatMap(x=>x.eventIds||[]))].map(id=>events.get(id)).filter(e=>e&&!present.has(e.id)&&(e.personIds||[]).some(id=>matchedIds.has(id))&&p.reigns.some(r=>r.start!=null&&r.end!=null&&e.start>=r.start&&e.start<=r.end)).sort((a,b)=>a.start-b.start);
  for(const e of candidates.slice(0,6-p.highlights.length))p.highlights.push({year:e.start,date:e.dateLabel||year(e.start),title:e.title+'（任内史事）',text:[e.summary,e.outcome].filter(Boolean).join(''),eventId:e.id});
 }
 // Activity ranges in the original people index are deliberately never read as birth/death or reign.
 if(n){
  if(p.life.join('').length<430)p.life=[n.overview,...(n.lifeStages||[]).map(x=>x.text),...(n.contributions||[]).map(x=>x.text)].filter(Boolean);
  if(!p.assessment||generic.test(p.assessment))p.assessment=n.legacy||'';
  if(n.debate&&!p.uncertainties.includes(n.debate))p.uncertainties.push(n.debate);
  if(!p.birthPlace||/本版|未|不详/.test(p.birthPlace))p.birthPlace=n.origin||p.birthPlace;
  p.works=(n.works||[]).map(x=>({title:x.title,note:x.note}));
 }
 if(generic.test(p.assessment||''))p.assessment='';
 if(p.family?.startsWith('亲属与继承关系见生平叙述'))p.family='本版尚未系统核录亲属资料；承继关系不等于父子关系。';
 p.sources=uniqueSources([...(p.sources||[]),...(r.sources||[]),...(n?.sourceIds||[]).map(id=>sourceMap.get(id))]);
 p.relatedEvents=[...new Set([...p.highlights.map(h=>h.eventId).filter(Boolean),...matches.flatMap(x=>x.eventIds||[])])].map(related).filter(Boolean);
 const chars=p.life.join('').length+p.highlights.map(x=>x.text||'').join('').length+(p.assessment||'').length;
 p.detailLabel=chars>=430&&p.life.length>=2?'生平详读':chars>=100?'生平梗概':'纪年与有限史料';p.narrativeCharacters=chars;
 for(const s of p.sources)assert(!s.url||s.url.startsWith('https://'),p.id+' unsafe source');
 assert(p.life.length,p.id+' empty life');
}
const order=new Map(D.periods.map((p,i)=>[p.id,i])),regionOrder=new Map(D.regions.map((r,i)=>[r.id,i]));
regimes.sort((a,b)=>a.scope!==b.scope?(a.scope==='china'?-1:1):a.scope==='china'?Math.min(...a.periodIds.map(id=>order.get(id)??100))-Math.min(...b.periodIds.map(id=>order.get(id)??100))||(a.start??0)-(b.start??0):(regionOrder.get(a.regionId)??100)-(regionOrder.get(b.regionId)??100)||(a.start??0)-(b.start??0));
fs.mkdirSync(path.join(dir,'content'),{recursive:true});const counts={detailed:0,overviews:0,indexed:0};
for(const r of regimes){
 const ps=rulers.filter(p=>p.regimeId===r.id).sort((a,b)=>{const aa=a.reigns.map(x=>x.start).filter(x=>x!=null),bb=b.reigns.map(x=>x.start).filter(x=>x!=null);return aa.length&&bb.length?Math.min(...aa)-Math.min(...bb):0});
 assert(ps.length,r.id+' empty');r.count=ps.length;r.details={detailed:0,overviews:0,indexed:0};for(const p of ps){const k=p.detailLabel==='生平详读'?'detailed':p.detailLabel==='生平梗概'?'overviews':'indexed';r.details[k]++;counts[k]++;}
 write(path.join(dir,'content',r.id+'.json'),{id:r.id,people:ps});
}
const culturalNotes=[
 {title:'夏、早商与古史人物',text:'传世王表可以展示承继叙事，却不能为每位人物制造精确出生、死亡和在位公历年。夏代名录按传统次序阅读，确年未定者不加入年度在位检索。'},
 {title:'世界区域不等于单一王朝',text:'南亚、东南亚、非洲、美洲和大洋洲长期存在并行的政治共同体。这里依各序列明确的起讫与资料范围编排；没有收录的国家、城邦和地方政权不能视为不存在。'},
 {title:'从名录到详传，持续扩展',text:'本版已把中国夏至清主要王统与多个并立政权展开；同期世界按已核实的王朝或元首序列建设。部分世界政权和古代城邦仍待补列，不宣称全球历任统治者已全部收齐。资料较少的条目保留纪年与可证事迹，后续按人物补充带来源的传记，不用相同套话填满。'}
];
const regionThemes=Object.fromEntries(D.regions.map(r=>[r.id,{accent:r.accent,deep:r.deep,gold:'#ac9360',paper:'#f0ebdf',wash:'#e6dfce'}]));
const C={version:'0.20.0',periods:D.periods.map(({id,title,label,focus,start,end})=>({id,title,label,focus,start,end})),regions:D.regions.map(({id,name})=>({id,name})),regionThemes,regimes:regimes.map(({id,name,scope,regionId,periodIds,worldIds,start,end,intro,coverage,count,details})=>({id,name,scope,regionId,periodIds,worldIds,start,end,intro,coverage,count,details})),people:rulers.map(p=>({id:p.id,regimeId:p.regimeId,name:p.name,search:[p.name,p.personalName,...p.aliases,groups.get(p.regimeId).name,...p.highlights.map(h=>h.title),...p.life].join(' '),reigns:p.reigns})),stats:{...counts,reignPhases:rulers.reduce((n,p)=>n+p.reigns.length,0)},culturalNotes};
fs.writeFileSync(path.join(dir,'catalog.js'),'window.RULER_CATALOG='+JSON.stringify(C)+';\n');
const files=fs.readdirSync(path.join(dir,'content')).sort().map(f=>{const b=fs.readFileSync(path.join(dir,'content',f));return{path:'content/'+f,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}});
write(path.join(dir,'manifest.json'),{version:C.version,reviewedAt:'2026-11-02',regimes:regimes.length,people:rulers.length,chinaPeople:rulers.filter(p=>groups.get(p.regimeId).scope==='china').length,worldPeople:rulers.filter(p=>groups.get(p.regimeId).scope==='world').length,...C.stats,biographyCharacters:rulers.reduce((n,p)=>n+p.narrativeCharacters,0),relatedEventLinks:rulers.reduce((n,p)=>n+p.relatedEvents.length,0),files});
console.log(JSON.stringify(read(path.join(dir,'manifest.json')),(_k,v)=>_k==='files'?v.length:v));
