# 地图底图来源

- 数据：Natural Earth，1:110m land（现代陆地轮廓，无政治边界）。
- 数据仓库：https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson
- 许可说明：https://www.naturalearthdata.com/about/ （public domain）。
- 本地快照：ne_110m_land.geojson，获取日期 2026-10-22。
- 派生文件：../land.js。将经纬度转换为720×360的等距圆柱投影SVG路径，x=(lon+180)*2，y=(90-lat)*2。
- 此底图不是古代海岸线重建，不含任何古代疆域或势力范围。低分辨率轮廓不适合精细地理判断。
- 地点标记由内容数据单独提供，均标为近似点；未进行考古测绘级别坐标核验。
