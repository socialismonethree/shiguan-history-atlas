/* Era palettes are an interpretive visual design, not a claim of uniform historical colours.
   Keep all China-era colour edits here; knowledge data stays in history-data.json. */
window.ERA_PALETTES = Object.fromEntries([
  ['xia','陶土赭','聚落、夯土与早期礼制','#80593e','#c2a077','#382a20','#e4d4be','#f3eadc'],
  ['shang','青铜绿','青铜礼器与庄严祭祀','#3d695c','#b8ae7c','#203b32','#cdded4','#e8efe8'],
  ['zhou','礼器古金','礼乐秩序与铭文','#78612e','#c7b47b','#38301d','#e4dabc','#f1eddd'],
  ['eastern','百家烟紫','思想交锋与诸侯竞逐','#69536e','#baa3b4','#352b3b','#ddd0df','#eee8ef'],
  ['qin','玄墨','简牍、石刻与统一秩序','#454742','#bab39a','#202522','#d4d5cc','#ebede6'],
  ['han','漆朱','漆器、汉阙与开拓气象','#813e37','#c8a17d','#40251f','#e7cdc3','#f5e8df'],
  ['xin','古币铜灰','制度改作与两汉转折','#666f5a','#b6b08b','#30372b','#dbdfc9','#edf0e3'],
  ['eastern-han','陶阙赭橙','画像砖、陶楼与士人社会','#8a5838','#c7a181','#422f22','#e8d6bf','#f5eddf'],
  ['three-kingdoms','铁甲橄榄','鼎立、军旅与山河争衡','#61673a','#b7b184','#32371e','#dce0bf','#edf0de'],
  ['western-jin','温玉灰绿','士族、玉质与短暂一统','#63796e','#b5b99e','#2c3d34','#d4e0d3','#eaf1e9'],
  ['eastern-jin','山岚灰蓝','江南山水与迁徙流动','#526e84','#aebac0','#293a49','#d1dce6','#e8eef4'],
  ['north-south','石窟砂褐','石窟造像与南北交融','#806b52','#c0ad8c','#403425','#e3d8c6','#f2ecdf'],
  ['sui','运河水碧','水路贯通与重新整合','#3d7270','#9fbbaf','#213e3c','#c8e0db','#e3efec'],
  ['tang','锦绣绛紫','织锦、都城与开放交流','#794a62','#c4a18e','#3e2636','#e4ccd8','#f2e5ed'],
  ['five-dynasties','烟雨茶褐','乱世更迭与地方文化生长','#77645d','#bca89c','#3c302c','#ddd1cb','#efe8e4'],
  ['song-liao-xia-jin','青瓷粉青','瓷釉、书卷与多元并立','#527c79','#b7b999','#293f3c','#d0e3de','#eaf3ef'],
  ['yuan','苍穹蓝','草原视野与欧亚交通','#465f84','#b5b4a2','#26344d','#cdd8e9','#e5edf5'],
  ['ming','宫阙赭金','宫阙、工艺与城市生活','#826426','#c7b07c','#45351d','#e5d8b4','#f5efdc'],
  ['qing','黛靛','宫廷陈设与晚期帝国转折','#4b4f70','#b5a6b4','#292c45','#d5d3e6','#eceaf4']
].map(([id,name,mood,accent,gold,deep,wash,paper]) => [id,{id,name,mood,accent,gold,deep,wash,paper}]));
