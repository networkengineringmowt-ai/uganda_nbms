import os
import re

replacements = {
    # Branding
    'Uganda National Roads Authority (UNRA)': 'Ministry of Works and Transport',
    'Uganda National Roads Authority': 'Ministry of Works and Transport',
    'UNRA UBMS': 'National Roads BMS',
    'UNRA Emerald': 'MoWT Blue',
    'UNRA BMS': 'National Roads BMS',
    'UNRA Table 3': 'Department Table 3',
    'UNRA/WKS': 'MoWT/WKS',
    'UNRA': 'Department of National Roads, Ministry of Works and Transport',
    'Department of National Roads, Ministry of Works and Transport Table 3': 'Department Table 3',
    
    # Colors
    '#10b981': '#3b82f6',
    '#059669': '#1d4ed8',
    '#08784d': '#1e40af',
    'rgba(16, 185, 129, 0.1)': 'rgba(59, 130, 246, 0.1)',
    'rgba(16, 185, 129, 0.2)': 'rgba(59, 130, 246, 0.2)',
    '#005a5b': '#0f172a',
    'kpi-icon green': 'kpi-icon blue',
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    # Order matters: replace longer strings first
    keys = sorted(replacements.keys(), key=len, reverse=True)
    for old in keys:
        new_content = new_content.replace(old, replacements[old])
        
    if new_content != content:
        print(f"Updated {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.js', '.css')):
            replace_in_file(os.path.join(root, file))

# MapDashboard tiles update
map_file = os.path.join('src', 'components', 'MapDashboard.jsx')
with open(map_file, 'r', encoding='utf-8') as f:
    map_content = f.read()

# Replace ESRI tiles with OpenStreetMap
old_tiles = """<TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri'
        />
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution='Labels &copy; Esri'
        />"""

new_tiles = """<TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />"""

if old_tiles in map_content:
    map_content = map_content.replace(old_tiles, new_tiles)
    with open(map_file, 'w', encoding='utf-8') as f:
        f.write(map_content)
    print("Updated MapDashboard.jsx tiles")
else:
    print("Could not find old tiles in MapDashboard.jsx")
