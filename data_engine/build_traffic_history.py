import os
import json
import pandas as pd

S_DRIVE = r"S:\ANNUAL DATA COLLECTION"
OUT_FILE = r"D:\OneDrive\Bridge stuff\uganda_bms\public\data\historical_traffic.json"

years = ["2016", "2017", "2018", "2020-21", "2021-22", "2022-23", "2023-24", "2025-26"]
historical_data = []

count = 0
for year in years:
    year_dir = os.path.join(S_DRIVE, year)
    if not os.path.exists(year_dir):
        continue
    
    # We will just sample up to 10 files per year to prevent massive memory usage for now,
    # and extract basic link traffic info if it exists.
    files_processed = 0
    for root, dirs, files in os.walk(year_dir):
        for f in files:
            if f.endswith('.xlsx') and not f.startswith('~'):
                if files_processed >= 10:
                    break
                path = os.path.join(root, f)
                try:
                    # Read the first sheet
                    df = pd.read_excel(path, nrows=50)
                    
                    # Try to find an AADT or Traffic column
                    aadt_cols = [c for c in df.columns if 'AADT' in str(c).upper() or 'TRAFFIC' in str(c).upper()]
                    link_cols = [c for c in df.columns if 'LINK' in str(c).upper() or 'ROAD' in str(c).upper()]
                    
                    if aadt_cols and link_cols:
                        for _, row in df.dropna(subset=[aadt_cols[0], link_cols[0]]).iterrows():
                            historical_data.append({
                                "Year": year,
                                "FileSource": f,
                                "Link": str(row[link_cols[0]]),
                                "AADT": str(row[aadt_cols[0]])
                            })
                        files_processed += 1
                        count += 1
                except Exception as e:
                    pass

with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(historical_data, f, indent=2)

print(f"Historical traffic extraction complete. Found {len(historical_data)} traffic records across {count} files.")
