from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import json,os,re,hashlib
routes=set(json.loads(Path('.qa/routes.json').read_text()))
class Doc(HTMLParser):
 def __init__(self): super().__init__();self.tags=[];self.attrs=[]
 def handle_starttag(self,tag,attrs):self.tags.append(tag);self.attrs.append((tag,dict(attrs)))
count=0
for file in Path('.qa/rendered').glob('*.html'):
 d=Doc();text=file.read_text();d.feed(text)
 assert d.tags.count('h1')==1, (file,'heading')
 assert '&lt;br/&gt;' not in text,(file,'literal line break')
 ids=[a['id'] for t,a in d.attrs if 'id' in a]
 assert len(ids)==len(set(ids)),(file,'duplicate ids')
 for tag,a in d.attrs:
  if tag=='a':
   href=a.get('href','');assert href and href!='#',(file,'empty link')
   if href.startswith('/') and not href.startswith('//'): assert urlparse(href).path in routes,(file,href)
   if href.startswith('#'):assert href[1:] in ids,(file,href)
  if tag=='img':
   assert 'alt' in a,(file,'missing alt')
   assert Path('public'+a['src']).is_file(),(file,a['src'])
  if tag=='source':
   for src in a.get('srcset','').split(','):
    assert Path('public'+src.strip().split()[0]).is_file(),(file,src)
  if tag=='label' and 'for' in a:assert a['for'] in ids,(file,'label target')
 count+=1
metadata=json.loads(Path('.qa/metadata.json').read_text())
assert len({m['title'] for m in metadata})==42
assert len({m['description'] for m in metadata})==42
# Brand files must be byte-identical to the owner's originals (DeltaWave-Logo).
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
logo_dir=Path(os.environ.get('DELTAWAVE_LOGO_DIR','../DeltaWave-Logo'))
if logo_dir.is_dir():
 originals=sorted(logo_dir.glob('*.png'))
 assert originals,(logo_dir,'no original PNG files')
 for o in originals:assert digest(Path('public/brand')/o.name)==digest(o),('brand file differs',o.name)
 for f in ('ELNATH.otf','ELNATH.ttf'):assert digest(Path('public/fonts')/f)==digest(logo_dir/f),('font differs',f)
 brand_note=f'{len(originals)} brand PNGs and 2 ELNATH files match {logo_dir}.'
else:
 brand_note=f'Original logo folder {logo_dir} not found: brand byte comparison NOT run.'
# Sharp corners and reduced motion, public site and CMS.
site_css=''.join(Path(p).read_text() for p in ('styles/fonts.css','styles/tokens.css','components/brand/brand.css','app/(frontend)/globals.css'))
admin_css=Path('app/(payload)/custom.scss').read_text()
for css in (site_css,admin_css):
 assert re.search(r'border-radius:\s*0\s*!important',css)
 assert all(v.strip()=='0 !important' for v in re.findall(r'border-radius:([^;}]+)',css))
 assert re.search(r'prefers-reduced-motion:\s*reduce',css)
assert all(v.strip()=='0px' for v in re.findall(r'--style-radius-[sml]:([^;]+)',admin_css))
print(f'{count} rendered documents checked: headings, links, image sources, form labels, unique IDs and metadata. {brand_note}')
