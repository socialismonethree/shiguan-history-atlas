# 历史地理 v0.19.0

原“把此刻，放回地理”板块与侧栏“历史地图”共用同一个地图。无需账号、地图服务密钥或外部瓦片服务；底图、地图工具和知识数据均随 GitHub Pages 托管。长河页的自然底图接近可见范围时才加载。

## 内容与维护

- `source.json` 是知识数据唯一维护入口。`places` 保存古城/遗址/区域的位置、古今名称、精度说明和地理意义；`chapters` 保存十九时期的地理叙事及既有事件链接；`world` 保存同期文化参照点，可用 `variants` 随年代更换城市和名称；`sources` 保存来源。
- 修改后运行 `node tools/sync-geo.mjs`，再运行 `node tools/check-geo.mjs`。后者核对位置范围、时期与事件链接、年代序列、城市切换、图形闭合及生成文件一致性，输出 `manifest.json`。
- 经纬度为 WGS84。中国点位是人工整理的历史地名与现代位置对应，明确区分汉长安/隋唐长安、汉魏洛阳/隋唐洛阳；城市点精度限于片区，区域点不随放大变成精确遗址坐标。尚未达到考古测绘标准；继续补充时应优先使用遗产申报图、考古报告、权威历史地理成果，并记录坐标出处与精度。
- 年代为选读节点，部分是近似观察切片，并非所有节点都有一个在该年发生的单独事件。近似切片已单独注明。秦统一节点包含前230—前221年前史。世界参照点不代表文明的唯一中心、起源或国家疆域。
- 日本奈良/长冈/京都、伊斯兰历代中心、奥斯曼中心等按年代切换；不把713年的参照点放到尚未建立的巴格达或京都。部分文明跨度过大时使用地区或遗址名称，避免把整个时段误画成同一活跃城市。

## 底图、许可与精度

`base.json` 由 Natural Earth 1:10m 自然地理矢量生成：陆地海岸、主要河流和山地/平原/荒漠等地理区域，全部为公有领域。来源：

- https://www.naturalearthdata.com/downloads/10m-physical-vectors/
- https://www.naturalearthdata.com/about/terms-of-use/
- https://github.com/nvkelso/natural-earth-vector/tree/master/geojson

使用 `ne_10m_land.geojson`、`ne_10m_rivers_lake_centerlines.geojson`、`ne_10m_geography_regions_polys.geojson`。下载后分别命名为 `land-10m.json`、`rivers-10m.json`、`regions-10m.json`，运行 `python3 tools/build-geo-base.py /path/to/input-directory`，并重新校验。输入校验和见 `base-manifest.json`。几何以0.008度阈值简化，保留原坐标；并非街道级精度。

现代河道、海岸仅作方位参照，明确不等于秦汉或其他时期的河道与疆界。地形色块为地理区域，非高程数据。未引入现代国界来冒充历史边界，未根据城市点自动推导古代疆域。阅读虚线不是行军、商旅或运河路线。距离为两个参照点之间的球面距离，不能用来推算历史旅行里程。

地图工具 Leaflet 1.9.4 使用 BSD-2-Clause 许可，原文见 `LEAFLET-LICENSE.txt`。交互无需第三方地图请求；Leaflet 和 Natural Earth 的署名保留在地图内。

## 发布前浏览器检查

检查：历史长河嵌入图与独立地图、十九时期切换、年份分享、古今地名检索、图层开关、相邻地点展开、地点和事件关联、两点距离、逐站展开与暂停、全屏退出、390px布局及控制台。地图和原有知识库内容分别维护，不重新生成战役、党史、世界大战等无关数据。
