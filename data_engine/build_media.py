import os
import shutil
import json

ROOT_DIR = r"D:\OneDrive\Bridge stuff"
BMS_DIR = os.path.join(ROOT_DIR, "uganda_bms")
GALLERY_OUT_DIR = os.path.join(BMS_DIR, "public", "gallery", "images")
os.makedirs(GALLERY_OUT_DIR, exist_ok=True)

images = []
count = 0

for root, dirs, files in os.walk(ROOT_DIR):
    if "uganda_bms" in root:
        continue
    for f in files:
        if f.lower().endswith(".jpg") or f.lower().endswith(".png"):
            if count >= 200: # Limit to 200 for now to prevent massive build times while testing
                break
            src = os.path.join(root, f)
            dst = os.path.join(GALLERY_OUT_DIR, f)
            if not os.path.exists(dst):
                try:
                    shutil.copy2(src, dst)
                except:
                    continue
            images.append({
                "filename": f,
                "url": f"/uganda_bms/gallery/images/{f}",
                "original_path": src
            })
            count += 1
    if count >= 200:
        break

with open(os.path.join(BMS_DIR, "public", "gallery", "index.json"), "w", encoding="utf-8") as f:
    json.dump(images, f, ensure_ascii=False)

print(f"Media engine complete. Processed {len(images)} images.")
