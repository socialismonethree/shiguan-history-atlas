# 时观 · 纵横历史知识库

一个中文、可视化、可交互的历史知识库，纵览中国夏至清，横向对照同期世界文明。保留事件、人物、器物、历史现场、来源与争议说明；收藏和札记保存在各自浏览器。

## 网站发布

发布源为 GitHub Pages 的 `main` 分支、`/docs` 目录。配置路径：Settings → Pages → Deploy from a branch → main → /docs → Save。后续更新该目录即触发发布，无需购买域名。

页面使用相对资源路径与哈希导航，支持项目网址下的子目录。`docs/.nojekyll` 保留为空文件，使静态网页直接发布。

## 内容维护

编辑 `docs/history-data.json` 和 `docs/book-data.json` 后，在本目录运行：

```sh
node tools/sync-data.mjs
```

脚本校验时期、事件、人物、史料引用、图片、世界区域及关联，再生成浏览器使用的数据脚本。一起提交数据和生成文件。

## 收藏和札记

个人记录保存在浏览器本地。旧站与新域名之间不会自动同步；在原浏览器导出后到新站恢复。原站打不开时请保留原浏览器数据，待恢复后再导出。

## 内容与图像边界

本站包含原创概述和来源索引，没有发布原著全文。主视觉为时代意绘，不是文物实物照片或考据复原。地图使用现代陆地轮廓和近似地点，不表示古代疆域。同期关系不自动构成因果。

资料归属和许可按网站来源条目及 `docs/assets/README.md` 标注；本仓库未对第三方资料或图像作统一开源授权。

GitHub Pages 提供公开网站；大陆实际可达性应在移动网络和宽带上验收，不承诺永久零故障。


## 朝代配色

19个中国时期的主题配色统一维护于 `docs/era-palettes.js`，由 `app.js` 合并到原主题。页面材质、卡片、侧栏、时间轴及入口色标随时代联动。色彩基于材质和文化意象作视觉表达，不表示一个朝代的全部审美或统一历史用色。新增时期时同步补充独立色组；正文、主按钮应保持足够对比度。

## 编年扩展0.7

编年长卷支持一年/五年窗口、八个世界区域筛选、人物与事件联动、长期背景和覆盖说明。新增知识会接入原有搜索、收藏、札记、时期与世界索引。内容维护与证据边界见 [CONTENT_GUIDE.md](CONTENT_GUIDE.md)。

按 `docs/expanded/data.json` 清单修改 `docs/expanded/source/` 中相应时期、区域或人物文件后运行 `node tools/sync-expanded.mjs`，一起提交生成的数据脚本与HTML索引。新增配色继续在 `docs/era-palettes.js` 维护。

## 0.8 事件与人物叙事详解

249篇分段正文（143事件、106人物）通过稳定ID与既有编年库相连，新增时间地点、生平阶段、过程与影响、代表事迹或作品、段落资料定位。只看详解的筛选、全文检索与段落导航可从事件人物及世界文明进入。详解范围、依据和局限见`docs/narratives/README.md`；维护入口为`docs/narratives/source/catalog.json`及`tools/sync-narratives.mjs`。原有编年条目、配色、锦纹、收藏札记继续使用。

## 0.9 博物馆选藏

新增78件/组藏品（中国54、世界24），十九个中国时期与八个世界区域均有具体作品，52件配开放许可实物图（0.9.1新增29件）。器物赏鉴支持中国/世界、时期/同期、区域、门类及馆藏机构检索。展签有作品概述、重要性、三点赏鉴、馆藏信息、年代/归属说明、机构资料链接、收藏札记及分享链接；实物图可放大。原有19项时代意象另列，不能与实物照片混用。

数据与许可说明见`docs/collections/README.md`；维护命令`node tools/sync-collections.mjs`、`node tools/check-collections.mjs`。更新后同时运行原有编年与叙事检查，保留既有编年数据、249篇叙事、配色及锦纹。网站仍由GitHub Pages的`main:/docs`公开发布。

## 0.10 中共党史独立板块

新增1921—2021逐年知识库，101个年度各有独立静态页面，使用正红色主题。入口为`docs/party-history/index.html`，与原有夏至清通史分开组织；原站导航和搜索都能进入新板块。总览支持年代定位、年份直达及跨年全文检索；年度页支持主题筛选、按月定位、人物关联、逐项资料展开、前后年跳转、固定链接分享和打印。

逐年原创事实稿与人物资料位于`docs/party-history/source/`。主要依据中央党史和文献研究院、原中央党史研究室编研资料，2021年补到全年；来源记录编写机构、刊载平台、核对日期和具体定位。人物介绍与仅有史事关联的索引分别标明。维护与整理范围见`docs/party-history/README.md`；生成及检查命令为`node tools/sync-party-history.mjs`、`node tools/check-party-history.mjs`。

## 0.10.1 十九时期侧栏暗纹

侧栏随当前时期切换十九幅独立原创SVG暗纹，色彩延续原时代配色。图案及单件参考依据登记在`docs/assets/era-patterns/catalog.json`；`era-patterns.css`维护重复尺寸与低对比度，`era-patterns.js`提供“时代暗纹·赏纹寻源”展签。参照具体器物、织绣或博物馆纹饰研究重新设计，不宣称文物复原、时期独占或各地区艺术完全一致。旧通用锦纹保留作加载降级。

## 0.10.2 朝代锦绣侧栏

十九幅图案重新绘制为彩色密织满地效果，采用主纹、辅花、纹带、经纬底理和金线针理分层；不再用单色线条遮罩。参考重点转向历史织绣和服饰，早期实物不足则明确借用器物纹饰。展签补充“纹样与寓意”“锦绣层次”，跨期材料不强行断到某一朝代。数据仍在`docs/assets/era-patterns/catalog.json`，着色SVG可独立修改；更新SVG后同步调整样式中的资源版本参数。


## 0.11 毛泽东生平纪年

党史板块增设1893—1976年个人生平纪年，84个年度各有独立页面；支持按年浏览、关键词检索、相邻年份跳转、逐条查看资料出处，以及与原党史资料交叉阅读。来源与整理边界见`docs/party-history/mao/README.md`。

维护时修改`docs/party-history/mao/source/`的分期数据，然后运行`node tools/sync-mao-chronology.mjs`和`node tools/check-mao-chronology.mjs`；党史首页模板改动后另运行`node tools/sync-party-history.mjs`及`node tools/check-party-history.mjs`。


## 0.12 党史人物生平纪年

新增人物总入口，保留毛泽东原年表，并增加朱德、周恩来、邓小平、刘少奇、陈云、任弼时和习仲勋的逐年页面。每位人物可按年份或关键词浏览，个人纪事标注资料、定位，并与原党史库关联；没有确年纪事的年份明确标待补。

维护说明见 `docs/party-history/leaders/README.md`。数据在 `docs/party-history/leaders/source/`，生成与检查命令为 `node tools/sync-leader-chronologies.mjs`、`node tools/check-leader-chronologies.mjs`。


## 0.13 中外战役专题

新增独立战役专题，按时间浏览中国与世界重要战役，支持地区筛选、关键词检索、详情和分享链接。每场记录时间、地点、起因、经过、结果、影响、主要参战人物及来源；存在争议之处单独注明。资料为选编，不宣称穷尽全部战役。

数据位于 `docs/battles/source/`；维护后运行 `node tools/sync-battles.mjs` 和 `node tools/check-battles.mjs`。
