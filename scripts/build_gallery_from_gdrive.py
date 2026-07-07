"""
Build a web-deployable photo gallery for the NBMS app from the master photo
archive on G: (Bridge stuff/PHOTOS). The full archive is ~20k images / several
GB; here we generate a bounded, optimised set so every structure shows real
inspection evidence without bloating the Pages deploy.

  - up to N_CRIT photos for Critical/Poor structures, N_GEN for the rest
  - each image resized to <=720px (q72) -> gallery/images/<filename>
  - a <=300px thumbnail (q66)          -> gallery/thumbnails/<filename>.jpg
  - gallery/index.json rewritten to reference ONLY generated photos

Parallelised (thread pool) to hide the cloud-drive read latency.
"""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
from PIL import Image, ImageOps

BS = r"G:\My Drive\MOWT\Uganda National Road Network Repository\Bridge stuff\PHOTOS"
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAL = os.path.join(HERE, "public", "gallery")
IMG_DIR = os.path.join(GAL, "images")
THUMB_DIR = os.path.join(GAL, "thumbnails")
os.makedirs(IMG_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)

N_GEN = 3      # photos per ordinary structure
N_CRIT = 5     # photos per Critical/Poor structure
IMG_MAX = 720
THUMB_MAX = 300

idx = json.load(open(os.path.join(GAL, "index.json"), encoding="utf-8"))
try:
    crit = json.load(open(os.path.join(HERE, "public", "data", "critical_structures.json"), encoding="utf-8"))
    CRIT_IDS = {c.get("BridgeNumber") for c in crit}
except Exception:
    CRIT_IDS = set()

# Group non-duplicate photos by structure, ordered by (year, sequence).
groups = {}
for p in idx:
    sid = p.get("structure_id")
    srp = p.get("source_relative_path")
    if not sid or p.get("duplicate_of") or not srp:
        continue
    groups.setdefault(sid, []).append(p)
for sid in groups:
    groups[sid].sort(key=lambda x: (x.get("capture_year") or 0, x.get("sequence") or 0))

# Select a spread of photos per structure.
selected = []
for sid, photos in groups.items():
    cap = N_CRIT if sid in CRIT_IDS else N_GEN
    if len(photos) <= cap:
        chosen = photos
    else:
        step = len(photos) / cap
        chosen = [photos[int(i * step)] for i in range(cap)]
    selected.extend(chosen)

print(f"structures={len(groups)} selected={len(selected)} (crit ids={len(CRIT_IDS)})", flush=True)

lock = Lock()
done = [0]
kept = []


def process(p):
    srp = p["source_relative_path"].replace("/", os.sep)
    src = os.path.join(BS, srp)
    out_img = os.path.join(IMG_DIR, p["filename"])
    thumb_name = os.path.splitext(p["filename"])[0] + ".jpg"
    out_thumb = os.path.join(THUMB_DIR, thumb_name)
    try:
        if not os.path.exists(src):
            return None
        if os.path.exists(out_img) and os.path.exists(out_thumb):
            return p  # already generated (resume)
        im = Image.open(src)
        im.draft("RGB", (IMG_MAX, IMG_MAX))
        im = ImageOps.exif_transpose(im).convert("RGB")
        big = im.copy()
        big.thumbnail((IMG_MAX, IMG_MAX), Image.LANCZOS)
        big.save(out_img, "JPEG", quality=72, optimize=True, progressive=True)
        th = im.copy()
        th.thumbnail((THUMB_MAX, THUMB_MAX), Image.LANCZOS)
        th.save(out_thumb, "JPEG", quality=66, optimize=True)
        return p
    except Exception as e:
        sys.stderr.write(f"fail {srp}: {e}\n")
        return None
    finally:
        with lock:
            done[0] += 1
            if done[0] % 100 == 0:
                print(f"  processed {done[0]}/{len(selected)}", flush=True)


with ThreadPoolExecutor(max_workers=12) as ex:
    for res in ex.map(process, selected):
        if res:
            kept.append(res)

# Rewrite index.json to only the photos we actually generated.
kept_out = []
for p in kept:
    q = dict(p)
    q["path"] = f"gallery/images/{p['filename']}"
    q["thumbnail"] = f"gallery/thumbnails/{os.path.splitext(p['filename'])[0]}.jpg"
    kept_out.append(q)
json.dump(kept_out, open(os.path.join(GAL, "index.json"), "w", encoding="utf-8"), ensure_ascii=False)

img_bytes = sum(os.path.getsize(os.path.join(IMG_DIR, f)) for f in os.listdir(IMG_DIR))
th_bytes = sum(os.path.getsize(os.path.join(THUMB_DIR, f)) for f in os.listdir(THUMB_DIR))
print(f"DONE: generated {len(kept_out)} photos across {len({p['structure_id'] for p in kept_out})} structures", flush=True)
print(f"images={img_bytes/1e6:.1f}MB thumbnails={th_bytes/1e6:.1f}MB total={(img_bytes+th_bytes)/1e6:.1f}MB", flush=True)
