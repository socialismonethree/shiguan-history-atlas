'use strict';
(()=>{
 const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const base=document.body.dataset.maoBase||'';
 $('#maoYearJump')?.addEventListener('change',e=>{const y=Number(e.target.value);if(Number.isInteger(y)&&y>=1893&&y<=1976)location.href=base+'year/'+y+'.html';});
 let cache=null,serial=0;
 async function search(){const q=($('#maoSearch')?.value||'').trim().toLocaleLowerCase(),seq=++serial,cards=[...document.querySelectorAll('[data-mao-year]')],sections=[...document.querySelectorAll('.year-decade')],out=$('#maoSearchResults'),status=$('#maoSearchStatus');if(!q){cards.forEach(c=>c.hidden=false);sections.forEach(s=>s.hidden=false);out.hidden=true;out.innerHTML='';status.textContent='共 84 个年份；资料不足的年份明确标注待补。';return;}
 let data,limited=false;try{cache??=await fetch(base+'search-index.json?v=0.11.0').then(r=>{if(!r.ok)throw Error('index');return r.json();});data=cache;}catch{data=cards.map(c=>({year:Number(c.dataset.maoYear),overview:'',events:[]}));limited=true;}if(seq!==serial)return;
 const matches=[],ys=new Set();for(const y of data){if((String(y.year)+' '+y.overview).toLocaleLowerCase().includes(q))ys.add(y.year);for(const e of y.events)if([e.title,e.date,e.place,e.description].join(' ').toLocaleLowerCase().includes(q)){ys.add(y.year);matches.push({year:y.year,...e});}}
 cards.forEach(c=>c.hidden=!ys.has(Number(c.dataset.maoYear)));sections.forEach(s=>s.hidden=![...s.querySelectorAll('[data-mao-year]')].some(c=>!c.hidden));status.textContent=limited?'全文索引暂不可用，当前仅检索年份；可刷新后重试。':ys.size+' 个相关年份 · '+matches.length+' 条纪事匹配';out.hidden=false;out.innerHTML=matches.length?'<h3>匹配的纪事</h3>'+matches.slice(0,50).map(e=>'<a class="mao-cross-link" href="'+base+'year/'+e.year+'.html#'+E(e.id)+'"><span>'+E(e.year+' · '+e.date)+'</span><strong>'+E(e.title)+'</strong><small>查看纪事 ↗</small></a>').join('')+(matches.length>50?'<p class="source-note">显示前 50 条结果，可进入匹配年份继续阅读。</p>':''):'<p class="source-note">'+(ys.size?'可从下方年份进入阅读。':'暂无匹配结果，请更换关键词。')+'</p>';}
 let timer;$('#maoSearch')?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,160)});$('#maoReset')?.addEventListener('click',()=>{$('#maoSearch').value='';search();$('#maoSearch').focus();});
 function filter(){const q=$('#maoEventSearch').value.trim().toLocaleLowerCase(),items=[...document.querySelectorAll('.mao-event')];let n=0;for(const el of items){el.hidden=!el.dataset.search.includes(q);if(!el.hidden)n++;}$('#maoEventStatus').textContent='显示 '+n+' / '+items.length+' 条纪事';$('#maoEventEmpty').hidden=n>0;}
 $('#maoEventSearch')?.addEventListener('input',filter);
})();
