import os
import json
import xml.etree.ElementTree as ET

ROOT_DIR = r"D:\OneDrive\Bridge stuff"
BMS_DIR = os.path.join(ROOT_DIR, "uganda_bms")
DATA_DIR = os.path.join(BMS_DIR, "public", "data")

print("Loading data...")
with open(os.path.join(DATA_DIR, "bridges.json"), "r", encoding="utf-8") as f:
    bridges = json.load(f)
with open(os.path.join(DATA_DIR, "culverts.json"), "r", encoding="utf-8") as f:
    culverts = json.load(f)

# 1. Load GeoJSON shapes
b_geo = []
c_geo = []
try:
    with open(os.path.join(DATA_DIR, "spatial", "bridges.geojson"), "r", encoding="utf-8") as f:
        b_geo = json.load(f).get("features", [])
    with open(os.path.join(DATA_DIR, "spatial", "major_culverts.geojson"), "r", encoding="utf-8") as f:
        c_geo = json.load(f).get("features", [])
except Exception as e: print("GeoJSON missing:", e)

# 2. Load KML
kml_coords = {}
try:
    tree = ET.parse(os.path.join(ROOT_DIR, "uganda_corrected_bridge_database (2).kml"))
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    for p in tree.getroot().findall('.//kml:Placemark', ns):
        name = p.find('kml:name', ns)
        coords = p.find('.//kml:coordinates', ns)
        if name is not None and coords is not None and name.text and coords.text:
            import re
            m = re.search(r'[BC]\d{3}', name.text)
            if m:
                parts = coords.text.strip().split(',')
                if len(parts) >= 2:
                    kml_coords[m.group(0)] = (float(parts[1]), float(parts[0])) # lat, lon
except Exception as e: print("KML missing:", e)

try:
    from pyproj import Proj, transform
    inProj = Proj('epsg:32636') # UTM 36N
    outProj = Proj('epsg:4326') # WGS84
    has_proj = True
except:
    has_proj = False

b_count = 0
for b in bridges:
    b_id = b.get("BridgeNumber")
    lat, lon = None, None
    
    # 1. Try GeoJSON
    feat = next((f for f in b_geo if f.get("properties", {}).get("BridgeNumb") == b_id), None)
    if feat and feat.get("geometry"):
        lon, lat = feat["geometry"]["coordinates"]
    
    # 2. Try KML
    if not lat and b_id in kml_coords:
        lat, lon = kml_coords[b_id]
        
    # 3. Try Legacy
    if not lat and b.get("LegacyData"):
        leg = b["LegacyData"]
        lat = leg.get("location_corrected_lat") or leg.get("map_y")
        lon = leg.get("location_corrected_lon") or leg.get("map_x")
        
    # 4. Try UTM Conversion
    if not lat and has_proj and b.get('CoOrdinateE') and b.get('CoOrdinateS'):
        try:
            E = float(b['CoOrdinateE'])
            N = float(b['CoOrdinateS'])
            if E > 1000 and N > 1000:
                lon, lat = transform(inProj, outProj, E, N)
        except: pass
        
    b["Lat"] = lat
    b["Lon"] = lon
    if lat: b_count += 1

c_count = 0
for c in culverts:
    c_id = c.get("CulvertNumber")
    lat, lon = None, None
    
    # 1. Try GeoJSON
    feat = next((f for f in c_geo if f.get("properties", {}).get("Culvert__N") == c_id), None)
    if feat and feat.get("geometry"):
        lon, lat = feat["geometry"]["coordinates"]
        
    # 2. Try UTM Conversion
    if not lat and has_proj and c.get('CoOrdinateE') and c.get('CoOrdinateS'):
        try:
            E = float(c['CoOrdinateE'])
            N = float(c['CoOrdinateS'])
            if E > 1000 and N > 1000:
                lon, lat = transform(inProj, outProj, E, N)
        except: pass
        
    c["Lat"] = lat
    c["Lon"] = lon
    if lat: c_count += 1

print(f"Bridges with coords: {b_count}/{len(bridges)}")
print(f"Culverts with coords: {c_count}/{len(culverts)}")

with open(os.path.join(DATA_DIR, "bridges.json"), "w", encoding="utf-8") as f:
    json.dump(bridges, f, separators=(',', ':'))
with open(os.path.join(DATA_DIR, "culverts.json"), "w", encoding="utf-8") as f:
    json.dump(culverts, f, separators=(',', ':'))

print("Coords injected successfully.")
