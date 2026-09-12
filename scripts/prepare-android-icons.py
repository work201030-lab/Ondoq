from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
src=root/'mobile/ondoq-icon-source.png'
res=root/'mobile/android/app/src/main/res'
if not src.exists(): raise SystemExit('Missing mobile/ondoq-icon-source.png')
if not res.exists(): raise SystemExit('Run npx cap add android first')
im=Image.open(src).convert('RGBA')
m=min(im.size); left=(im.width-m)//2; top=(im.height-m)//2; im=im.crop((left,top,left+m,top+m))
for folder,size in [('mipmap-mdpi',48),('mipmap-hdpi',72),('mipmap-xhdpi',96),('mipmap-xxhdpi',144),('mipmap-xxxhdpi',192)]:
    d=res/folder; d.mkdir(parents=True,exist_ok=True)
    out=im.resize((size,size),Image.Resampling.LANCZOS)
    out.save(d/'ic_launcher.png'); out.save(d/'ic_launcher_round.png')
print('ONDOQ icons prepared.')
