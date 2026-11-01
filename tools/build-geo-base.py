import json,pathlib,math,hashlib,sys
root=pathlib.Path(__file__).resolve().parents[1]; downloads=pathlib.Path(sys.argv[1]);out=root/'docs/geo'
def simplify(points,tol=.008):
 if len(points)<4:return points
 # Iterative Douglas-Peucker; retained vertices keep source geographic coordinates.
 keep={0,len(points)-1};stack=[(0,len(points)-1)]
 while stack:
  a,b=stack.pop();x,y=points[a][:2];u,v=points[b][:2];dx=u-x;dy=v-y;den=dx*dx+dy*dy;best=tol*tol;idx=None
  for i in range(a+1,b):
   px,py=points[i][:2];t=max(0,min(1,((px-x)*dx+(py-y)*dy)/den)) if den else 0;dist=(px-x-t*dx)**2+(py-y-t*dy)**2
   if dist>best:best=dist;idx=i
  if idx is not None:keep.add(idx);stack.extend([(a,idx),(idx,b)])
 return [[round(c,4) for c in points[i][:2]] for i in sorted(keep)]
def geom(g):
 t=g['type'];c=g['coordinates']
 if t=='LineString':c=simplify(c)
 elif t=='MultiLineString':c=[simplify(x) for x in c]
 elif t=='Polygon':c=[ring(x) for x in c]
 elif t=='MultiPolygon':c=[[ring(x) for x in p] for p in c]
 return {'type':t,'coordinates':c}
def ring(x):
 s=simplify(x);return s if len(s)>=4 else [[round(v,4) for v in p[:2]] for p in x]
def fc(features):return {'type':'FeatureCollection','features':features}
land=json.loads((downloads/'land-10m.json').read_text());land=fc([{'type':'Feature','properties':{},'geometry':geom(f['geometry'])} for f in land['features']])
riverNames={'Yangtze':'长江（今道）','Yellow':'黄河（今道）','Huang':'黄河（今道）','Wei':'渭河（今道）','Han':'汉江（今道）','Pearl':'珠江水系（今道）','Nile':'尼罗河','White Nile':'白尼罗河','Blue Nile':'青尼罗河','Ganges':'恒河','Indus':'印度河','Tigris':'底格里斯河','Euphrates':'幼发拉底河','Danube':'多瑙河','Rhine':'莱茵河','Seine':'塞纳河','Thames':'泰晤士河','Niger':'尼日尔河','Congo':'刚果河','Zambezi':'赞比西河','Mississippi':'密西西比河','Amazonas':'亚马孙河','Amazon':'亚马孙河','Mekong':'湄公河','Salween':'怒江—萨尔温江','Irrawaddy':'伊洛瓦底江','Amu Darya':'阿姆河','Syr Darya':'锡尔河','Tarim':'塔里木河','Tibet':'雅鲁藏布江水系','Volga':'伏尔加河','Don':'顿河','Dnieper':'第聂伯河','Garonne':'加龙河','Loire':'卢瓦尔河'}
rivers=[]
for f in json.loads((downloads/'rivers-10m.json').read_text())['features']:
 p=f['properties'];name=p.get('name_en') or p.get('name') or '';rank=float(p.get('scalerank') or 10)
 if name not in riverNames and rank>5:continue
 rivers.append({'type':'Feature','properties':{'name':riverNames.get(name,name),'rank':rank},'geometry':geom(f['geometry'])})
terrain=[];labels=[]
for f in json.loads((downloads/'regions-10m.json').read_text())['features']:
 p=f['properties'];kind=p['FEATURECLA'];rank=p['SCALERANK'];name=p.get('NAME_ZH') or p.get('NAME_EN') or p['NAME']
 if kind not in ['Range/mtn','Plateau','Desert','Plain','Basin','Lowland','Valley'] or rank>6:continue
 terrain.append({'type':'Feature','properties':{'name':name,'kind':kind,'rank':rank},'geometry':geom(f['geometry'])})
 if rank<=3 or p['NAME'] in ['Qinling Mountains','Taihang Mts.','Loess Plateau']:
  def points(c):
   if isinstance(c[0],(float,int)):return [c]
   return [v for sub in c for v in points(sub)]
  pts=points(f['geometry']['coordinates']);xs=[x[0] for x in pts];ys=[x[1] for x in pts];labels.append({'name':name,'lon':(min(xs)+max(xs))/2,'lat':(min(ys)+max(ys))/2,'kind':kind,'zoom':3 if rank<=2 else 4})
riverLabels={}
for f in rivers:
 name=f['properties']['name']
 if name not in ['长江（今道）','黄河（今道）','渭河（今道）','尼罗河','恒河','印度河','底格里斯河','幼发拉底河','多瑙河','莱茵河','尼日尔河','湄公河','密西西比河','亚马孙河']:continue
 lines=f['geometry']['coordinates'] if f['geometry']['type']=='MultiLineString' else [f['geometry']['coordinates']]
 line=max(lines,key=len)
 if name not in riverLabels or len(line)>riverLabels[name][0]:riverLabels[name]=(len(line),line[len(line)//2])
for name,(_,point) in riverLabels.items():labels.append({'name':name,'lon':point[0],'lat':point[1],'kind':'river','zoom':4})
base={'land':land,'rivers':fc(rivers),'terrain':fc(terrain),'labels':labels,'metadata':{'source':'Natural Earth 1:10m physical vectors','license':'Public domain','coordinateSystem':'WGS84 longitude/latitude','simplificationDegrees':.008,'note':'现代自然地理参照；不重建古河道、海岸线和政治边界。地形色块为地理区域，非高程或疆域。'}}
(out/'base.json').write_text(json.dumps(base,ensure_ascii=False,separators=(',',':'))+'\n')
manifest={'landFeatures':len(land['features']),'riverFeatures':len(rivers),'terrainFeatures':len(terrain),'baseBytes':(out/'base.json').stat().st_size,'inputs':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in downloads.glob('*-10m.json')}}
(out/'base-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(manifest)
