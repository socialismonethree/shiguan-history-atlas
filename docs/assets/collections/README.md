# 馆藏实物照片

此目录仅包含明确开放许可的实际藏品照片，不含AI意绘或复原图。

- Cleveland Museum of Art（7件）：官方Open Access API `share_license_status=CC0`、`images.web.url`。政策与接口：https://www.clevelandart.org/open-access，https://openaccess-api.clevelandart.org/。
- The Metropolitan Museum of Art（17件）：官方具体藏品页面的Public Domain/Open Access标记及馆藏API核对。政策：https://www.metmuseum.org/hubs/open-access，API：https://metmuseum.github.io/。

逐件标题、收藏编号、原始图像URL、图像来源页、credit及license保存在`docs/collections/source/`相应条目的`image`字段，本站缓存路径为`image.localUrl`。未将馆藏照片与网站原创代码作统一许可。下载核查记录见`docs/collections/image-audit.json`；若馆方之后修订归属、来源或图像信息，应同步更新对应条目并保留稳定ID。

图片按馆方提供版本保存，未修改其内容。开放许可不等于馆方为本站赏鉴文字背书；原住民社群知识和文化权利仍应尊重。

## 0.9.1 补图

新增29件，合计52件。其他来源包括Wikimedia Commons逐件登记的CC0、Public Domain、CC BY或CC BY-SA照片，以及台北故宫开放图像。必须以具体image字段记录为准，不能将本目录统一声明为CC0。保留署名、许可页和照片来源链接；局部、半卷、册页在展签中标明。来源本身已裁切的版本照原样保存，本站未再编辑。新增下载与身份核对记录见`docs/collections/image-completion-audit.json`。
