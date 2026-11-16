import sys, os
from PIL import Image
out = sys.argv[1]; names = [n for n in sys.argv[2:] if os.path.exists(n)]
ims = [Image.open(n) for n in names]
w, h = ims[0].size; sc = 640 / w
ims = [im.resize((640, int(im.size[1] * 640 / im.size[0])), Image.NEAREST) for im in ims]
h2 = ims[0].size[1]; rows = (len(ims) + 2) // 3
S = Image.new('RGB', (3 * 640 + 12, rows * h2 + (rows - 1) * 6), (40, 40, 40))
for i, im in enumerate(ims): S.paste(im, ((i % 3) * 646, (i // 3) * (h2 + 6)))
S.save(out); print(out, len(names))
