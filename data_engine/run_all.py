import os
import subprocess

BMS_DIR = r"D:\OneDrive\Bridge stuff\uganda_bms\data_engine"

scripts = [
    "build_database.py", 
    "build_extra_data.py",
    "build_legacy_data.py",
    "build_mdb.py",
    "build_critical.py",
    "build_traffic_history.py",
    "build_analytics.py",
    "build_spatial.py", 
    "build_coords.py",
    "build_media.py", 
    "build_documents.py",
    "build_heavy_documents.py"
]

for script in scripts:
    path = os.path.join(BMS_DIR, script)
    print(f"\n--- Running {script} ---")
    subprocess.run(["python", path], check=True)

print("\nAll massive data engines completed successfully!")
