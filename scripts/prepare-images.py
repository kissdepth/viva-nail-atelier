"""Create responsive WebP copies; keep original JPEGs for reference downloads."""
from pathlib import Path
import re
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
index = root / "dist/index.html"
html = index.read_text()
dimensions = {}
used = sorted(set(re.findall(r'src="assets/(photo-\d+\.jpg)"', html)))
original_total = responsive_total = 0
for filename in used:
    path = root / "dist/assets" / filename
    image = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    dimensions[filename] = image.width
    original_total += path.stat().st_size
    for target in [480, 960]:
        width = min(target, image.width)
        height = round(image.height * width / image.width)
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        output = path.with_name(f"{path.stem}-{target}.webp")
        resized.save(output, "WEBP", quality=82, method=6)
        if target == 960:
            responsive_total += output.stat().st_size

def responsive(match):
    tag = match.group(0)
    filename = match.group(1)
    stem = Path(filename).stem
    before = html[max(0, match.start() - 200):match.start()]
    if "cover-photo" in before:
        sizes = "(max-width: 700px) 26vw, 40vw"
    elif 'id="mood-photo"' in tag:
        sizes = "(max-width: 700px) 46vw, 34vw"
    else:
        sizes = "(max-width: 700px) 46vw, (max-width: 1020px) 23vw, 300px"
    tag = re.sub(r'\s(?:srcset|sizes|decoding)="[^"]*"', "", tag)
    srcset = f"assets/{stem}-480.webp 480w, assets/{stem}-960.webp {min(960, dimensions[filename])}w"
    return tag[:-1] + f' srcset="{srcset}" sizes="{sizes}" decoding="async">'

html = re.sub(r'<img\b[^>]*src="assets/(photo-\d+\.jpg)"[^>]*>', responsive, html)
index.write_text(html)
print(f"Responsive images: {len(used)} photographs, {original_total:,} JPEG bytes → {responsive_total:,} WebP bytes at up to 960px.")
