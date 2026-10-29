import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'docs/world-wars');
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,'source',n+'.json'),'utf8'));
const sources=read('sources'),countries=read('countries'),people=read('people');
const wars=[
 {id:'ww1',name:'第一次世界大战',years:'1914—1918',subtitle:'从七月危机，到战壕与帝国的终局',coverage:'1914年7月—1918年11月，53个月连续；另列刺杀前史与1919年和会。',intro:'一场巴尔干危机为什么成为世界战争？联盟、动员、帝国竞争与决策失误互相推动；速胜失效后，战壕、封锁、工业与社会动员把战争拖入长期消耗。',start:'1914-07',end:'1918-11',default:'1914-07',phases:[['1914-06','危机与开战'],['1915-01','扩大与僵持'],['1916-01','消耗战之年'],['1917-01','革命与新力量'],['1918-01','攻势、崩溃与停战'],['1919-01','和平的难题']]},
 {id:'ww2',name:'第二次世界大战',years:'1939—1945',subtitle:'从侵略扩张，到全球抵抗与艰难和平',coverage:'1939年9月—1945年9月，73个月连续；另列1931年以来亚洲与欧洲前史。',intro:'侵略并非不可避免的自然灾害。独裁、种族主义、帝国扩张与集体安全失效，逐步把各地区战争连成全球冲突；抵抗、联盟与社会动员最终击败轴心国，却留下巨大的平民灾难与未解的战后问题。',start:'1939-09',end:'1945-09',default:'1939-09',phases:[['1931-09','前史：侵略的扩张'],['1939-09','欧洲开战与轴心推进'],['1941-06','战争全球化'],['1942-11','转折与同盟合作'],['1944-01','多线反攻'],['1945-06','终战与战后秩序']]}
].map(w=>({...w,months:read(w.id)}));
const sids=new Set(sources.map(s=>s.id)),cids=new Set(countries.map(c=>c.id));
const next=d=>{let[y,m]=d.split('-').map(Number);if(++m===13){y++;m=1}return `${y}-${String(m).padStart(2,'0')}`};
for(const w of wars){
 const dates=new Set();for(const m of w.months){assert(!dates.has(m.date),m.id);dates.add(m.date);assert(/^\d{4}-\d{2}$/.test(m.date));assert(m.title&&m.theaters.length&&m.countries.length);assert(m.story.length>=2&&m.story.every(p=>p.trim().length>=30),m.id);assert(m.perspectives.length>=2);assert(m.countries.every(c=>cids.has(c)));assert(m.perspectives.every(p=>cids.has(p.country)&&p.text));assert(m.sources.length&&m.sources.every(s=>sids.has(s.id)),m.id)}
 for(let d=w.start;d<=w.end;d=next(d))assert(dates.has(d),`${w.id} missing month ${d}`);
}
assert.equal(new Set(people.map(p=>p.name)).size,people.length);
const related={'ww1-1915-04':['gallipoli'],'ww2-1937-08':['battle-shanghai-1937'],'ww2-1938-04':['battle-taierzhuang'],'ww2-1940-08':['battle-hundred-regiments'],'ww2-1942-06':['battle-midway-1942'],'ww2-1942-11':['battle-stalingrad'],'ww2-1943-02':['battle-stalingrad'],'ww2-1944-03':['imphal-kohima'],'ww2-1944-06':['battle-normandy']};for(const w of wars)for(const m of w.months)m.relatedBattles=related[m.id]??[];const data={version:'0.17.0',wars,sources,countries,people,note:'逐月叙事为史实基础上的原创整理；国家处境是编辑解读，不是虚构当事人自述。主战期每月连续，前史与余波选编；并非逐日全史。无虚构对白、现场感官细节或人物内心独白。'};
fs.writeFileSync(path.join(dir,'war-data.js'),'window.WORLD_WARS='+JSON.stringify(data)+';\n');
const report={version:data.version,months:wars.reduce((n,w)=>n+w.months.length,0),continuousMainWarMonths:126,wars:wars.map(w=>({id:w.id,months:w.months.length})),countryProfiles:countries.length,featuredPeople:people.length,indexedPeople:new Set(wars.flatMap(w=>w.months.flatMap(m=>m.people))).size,sources:sources.length};
fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
