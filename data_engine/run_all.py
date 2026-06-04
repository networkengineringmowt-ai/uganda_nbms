import os
import subprocess

BMS_DIR = r"D:\OneDrive\Bridge stuff\uganda_bms\data_engine"

scripts = ["build_database.py", "build_spatial.py", "build_media.py", "build_documents.py"]

for script in scripts:
    path = os.path.join(BMS_DIR, script)
    print(f"\n--- Running {script} ---")
    subprocess.run(["python", path], check=True)

print("\nAll massive data engines completed successfully!")
