import os
import json
import geopandas as gpd

ROOT_DIR = r"D:\OneDrive\Bridge stuff"
BMS_DIR = os.path.join(ROOT_DIR, "uganda_bms")
SPATIAL_OUT_DIR = os.path.join(BMS_DIR, "public", "data", "spatial")
os.makedirs(SPATIAL_OUT_DIR, exist_ok=True)

# Important Shapefiles
shapefiles = [
    {"name": "network2026", "file": "network2026.shp"},
    {"name": "bridges", "file": "Bridges_shp/Bridges.shp"}
]

def find_file(name):
    for root, dirs, files in os.walk(ROOT_DIR):
        if name in files:
            return os.path.join(root, name)
    return None

for shp in shapefiles:
    print(f"Processing {shp['name']}...")
    path = find_file(shp["file"].split('/')[-1])
    if path:
        try:
            gdf = gpd.read_file(path)
            # Convert to WGS84 for Leaflet
            gdf = gdf.to_crs(epsg=4326)
            out_path = os.path.join(SPATIAL_OUT_DIR, f"{shp['name']}.geojson")
            # Save optimized GeoJSON
            gdf.to_file(out_path, driver="GeoJSON")
            print(f"Saved {out_path}")
        except Exception as e:
            print(f"Failed to process {shp['name']}: {e}")
    else:
        print(f"Could not find {shp['file']}")

print("Spatial engine complete.")
