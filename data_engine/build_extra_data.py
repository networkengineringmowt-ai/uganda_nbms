import os
import json
import pandas as pd

ROOT_DIR = r"D:\OneDrive\Bridge stuff"
BMS_DIR = os.path.join(ROOT_DIR, "uganda_bms")
DATA_OUT_DIR = os.path.join(BMS_DIR, "public", "data")

def df_to_json_safe(df):
    for col in df.select_dtypes(include=['datetime', 'datetimetz']).columns:
        df[col] = df[col].astype(str)
    return df.fillna("").to_dict(orient="records")

print("Parsing Hosea's Bridge Registry...")
try:
    df_hosea = pd.read_excel(os.path.join(ROOT_DIR, "List of Bridges - hosea kahigwa.xlsx"))
    hosea_data = df_to_json_safe(df_hosea)
    with open(os.path.join(DATA_OUT_DIR, "hosea_registry.json"), "w", encoding="utf-8") as f:
        json.dump(hosea_data, f, ensure_ascii=False)
except Exception as e:
    print("Error parsing Hosea registry:", e)

print("Parsing National Road Network NDPIV...")
try:
    df_network = pd.read_excel(os.path.join(ROOT_DIR, "National Road Network_FY25-26(NDPIV) - draft.xlsx"))
    network_data = df_to_json_safe(df_network)
    with open(os.path.join(DATA_OUT_DIR, "road_network.json"), "w", encoding="utf-8") as f:
        json.dump(network_data, f, ensure_ascii=False)
except Exception as e:
    print("Error parsing Road Network:", e)

print("Loading Legacy JSON overrides...")
legacy_files = [
    "bridge_extra_traffic_data.json",
    "bridge_remaining_legacy_backfill.json",
    "road_link_raw_tis_overrides.json"
]
overrides = {}
for file in legacy_files:
    try:
        with open(os.path.join(ROOT_DIR, file), "r", encoding="utf-8") as f:
            overrides[file] = json.load(f)
    except Exception as e:
        print(f"Error loading {file}:", e)

with open(os.path.join(DATA_OUT_DIR, "legacy_overrides.json"), "w", encoding="utf-8") as f:
    json.dump(overrides, f, ensure_ascii=False)

print("Extra data engine complete.")
