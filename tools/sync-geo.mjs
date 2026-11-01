import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve(import.meta.dirname,'../docs/geo');
const data=JSON.parse(fs.readFileSync(path.join(dir,'source.json'),'utf8'));
fs.writeFileSync(path.join(dir,'data.js'),'window.GEO_DATA='+JSON.stringify(data)+';\n');
console.log(JSON.stringify({version:data.version,chapters:data.chapters.length,places:data.places.length,stops:data.chapters.reduce((n,c)=>n+c.steps.length,0),worldReferences:data.world.length}));
