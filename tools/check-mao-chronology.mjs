import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'docs/party-history/mao');
const index=fs.readFileSync(path.join(dir,'index.html'),'utf8'),m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')),search=JSON.parse(fs.readFileSync(path.join(dir,'search-index.json'),'utf8'));
assert.equal(m.years,84);assert.equal(search.length,84);assert.equal(search[0].year,1893);assert.equal(search.at(-1).year,1976);assert.equal(search.reduce((n,y)=>n+y.events.length,0),m.events);assert.equal(search.filter(y=>y.events.length).length,m.coveredYears);
const checkLinks=(body,file)=>{for(const match of body.matchAll(/(?:href|src)="([^"]+)"/g)){const link=match[1].replaceAll('&amp;','&');if(link.startsWith('#')||/^https?:/.test(link))continue;const target=link.split(/[?#]/)[0];assert.ok(fs.existsSync(path.resolve(path.dirname(file),target)),`Broken local link ${file}: ${link}`)}};
checkLinks(index,path.join(dir,'index.html'));checkLinks(fs.readFileSync(path.join(dir,'references.html'),'utf8'),path.join(dir,'references.html'));
for(const [i,y] of search.entries()){
 assert.equal(y.year,1893+i);const file=path.join(dir,'year',y.year+'.html');assert.ok(fs.existsSync(file));const html=fs.readFileSync(file,'utf8');assert.ok(index.includes(`href="year/${y.year}.html"`));checkLinks(html,file);
 assert.ok(html.includes(`data-mao-page="year"`));assert.ok(html.includes(`${y.events.length} 条已整理纪事`));
 for(const e of y.events){assert.ok(html.includes(`id="${e.id}"`));assert.ok(html.includes(e.title));}
 if(y.year>1893)assert.ok(html.includes(`href="${y.year-1}.html"`));if(y.year<1976)assert.ok(html.includes(`href="${y.year+1}.html"`));if(!y.events.length)assert.ok(html.includes('本年待补'));
 for(const item of html.matchAll(/href="\.\.\/\.\.\/year\/(\d+)\.html#([^"#]+)"/g)){const other=fs.readFileSync(path.join(root,'docs/party-history/year',item[1]+'.html'),'utf8');assert.ok(other.includes(`id="${item[2]}"`),`Broken party cross-reference ${item[0]}`);}
}
const chron1934=fs.readFileSync(path.join(dir,'year/1934.html'),'utf8'),chron1952=fs.readFileSync(path.join(dir,'year/1952.html'),'utf8'),chron1966=fs.readFileSync(path.join(dir,'year/1966.html'),'utf8');assert.ok(chron1934.includes('黎平会议')&&chron1934.includes('表述存在差异'));assert.ok(chron1952.includes('11月20日')&&chron1952.includes('1953年12月5日'));assert.ok(chron1966.includes('文化大革命'));
assert.ok(fs.readFileSync(path.join(root,'docs/party-history/index.html'),'utf8').includes('href="mao/index.html"'));
console.log(JSON.stringify({years:m.years,events:m.events,coveredYears:m.coveredYears,blankYears:m.years-m.coveredYears,sourceCount:m.sources,crossReferences:m.crossReferences,staticPages:'passed',sourceLinks:'checked during generation',localLinks:'passed',partyLinks:'passed',sensitiveDateChecks:'passed'}));
