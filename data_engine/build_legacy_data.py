import os
import json

ROOT_DIR = r"D:\OneDrive\Bridge stuff"
BMS_DIR = os.path.join(ROOT_DIR, "uganda_bms")
DATA_OUT_DIR = os.path.join(BMS_DIR, "public", "data")

def extract_js_object(path, var_name):
    if not os.path.exists(path): return {}
    with open(path, 'r', encoding='utf-8') as f: content = f.read()
    marker = f"const {var_name} = "
    start = content.find(marker)
    if start < 0: return {}
    i = content.find("{", start)
    if i < 0:
        i = content.find("[", start)
        if i < 0: return {}
        char_open, char_close = "[", "]"
    else:
        char_open, char_close = "{", "}"
        
    depth = 0
    in_string = None
    escape = False
    for pos in range(i, len(content)):
        ch = content[pos]
        if in_string:
            if escape: escape = False
            elif ch == "\\": escape = True
            elif ch == in_string: in_string = None
            continue
        if ch in ("'", '"'): in_string = ch
        elif ch == char_open: depth += 1
        elif ch == char_close:
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(content[i : pos + 1])
                except Exception as e:
                    print("Parse error", e)
                    return {}
    return {}

print("Extracting water_data.js...")
water = extract_js_object(os.path.join(ROOT_DIR, 'water_data.js'), 'WATER_GEOMETRY')
features = []
for lake in water.get('lakes', []):
    features.append({'type': 'Feature', 'geometry': {'type': 'Polygon', 'coordinates': [lake]}, 'properties': {'type': 'lake'}})
for river in water.get('rivers', []):
    features.append({'type': 'Feature', 'geometry': {'type': 'LineString', 'coordinates': river}, 'properties': {'type': 'river'}})

with open(os.path.join(DATA_OUT_DIR, 'spatial', 'water.geojson'), 'w', encoding='utf-8') as f:
    json.dump({'type': 'FeatureCollection', 'features': features}, f)

print("Extracting bridge_works_data.js...")
works = extract_js_object(os.path.join(ROOT_DIR, 'bridge_works_data.js'), 'BRIDGE_WORKS_DATA')
with open(os.path.join(DATA_OUT_DIR, 'bridge_works.json'), 'w', encoding='utf-8') as f:
    json.dump(works, f)

print("Legacy data engine complete.")
