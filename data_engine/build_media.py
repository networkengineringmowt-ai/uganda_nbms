import os
import shutil
import json

S_DRIVE_PHOTOS = r"S:\ANNUAL DATA COLLECTION\Databases\BMS Capture Module\Photos"
BMS_DIR = r"D:\OneDrive\Bridge stuff\uganda_bms"
GALLERY_OUT_DIR = os.path.join(BMS_DIR, "public", "gallery", "images")
os.makedirs(GALLERY_OUT_DIR, exist_ok=True)

images = []
count = 0

for root, dirs, files in os.walk(S_DRIVE_PHOTOS):
    # Extract the bridge/culvert ID from the folder name (e.g. B001, C054)
    folder_name = os.path.basename(root)
    structure_id = None
    if folder_name.startswith('B') or folder_name.startswith('C'):
        structure_id = folder_name

    for f in files:
        if f.lower().endswith((".jpg", ".png", ".jpeg")):
            src = os.path.join(root, f)
            # Prepend the structure ID to the filename to avoid collisions!
            safe_filename = f"{folder_name}_{f}" if structure_id else f
            dst = os.path.join(GALLERY_OUT_DIR, safe_filename)
            
            if not os.path.exists(dst):
                try:
                    shutil.copy2(src, dst)
                except Exception as e:
                    print(f"Failed to copy {src}: {e}")
                    continue
                    
            images.append({
                "filename": safe_filename,
                "url": f"/uganda_bms/gallery/images/{safe_filename}",
                "original_path": src,
                "structure_id": structure_id
            })
            count += 1

with open(os.path.join(BMS_DIR, "public", "gallery", "index.json"), "w", encoding="utf-8") as f:
    json.dump(images, f, ensure_ascii=False)

print(f"Media engine complete. Processed {count} images from S: drive.")
