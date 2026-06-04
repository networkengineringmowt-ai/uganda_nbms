import os
import re
import json
import pandas as pd
from docx import Document

ROOT_DIR = r"D:\OneDrive\Bridge stuff"
BMS_DIR = os.path.join(ROOT_DIR, "uganda_bms")
DATA_OUT_DIR = os.path.join(BMS_DIR, "public", "data")
os.makedirs(DATA_OUT_DIR, exist_ok=True)

HTML_FILE = os.path.join(ROOT_DIR, "bridge_traffic_analytics.html")
SQLBOT_FILE = os.path.join(ROOT_DIR, "bridge_traffic_sqlbot_payload.js")
EXCEL_FILE = os.path.join(ROOT_DIR, "Bridges and Culverts 2026-FINAL 1.xlsx")
CS_FILE = os.path.join(ROOT_DIR, "CS 2026.docx")
INVESTMENT_FILE = os.path.join(ROOT_DIR, "INVESTMENT PLAN B&MC 2026.docx")

def extract_js_array(content, const_name):
    marker = f"const {const_name} = "
    start = content.find(marker)
    if start < 0: return []
    i = content.find("[", start)
    if i < 0: return []
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
        elif ch == "[": depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(content[i : pos + 1])
                except Exception as e:
                    print("Error parsing json array", e)
                    return []
    return []

def extract_js_object(content, const_name):
    marker = f"const {const_name} = "
    start = content.find(marker)
    if start < 0: return {}
    i = content.find("{", start)
    if i < 0: return {}
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
        elif ch == "{": depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(content[i : pos + 1])
                except Exception as e:
                    print("Error parsing json object", e)
                    return {}
    return {}

def read_docx(path):
    if not os.path.exists(path): return []
    doc = Document(path)
    return [p.text.strip() for p in doc.paragraphs if p.text.strip()]

print("Loading legacy BRIDGES array...")
with open(HTML_FILE, "r", encoding="utf-8") as f:
    html_content = f.read()
legacy_bridges = extract_js_array(html_content, "BRIDGES")

print("Loading SQLBOT traffic payload...")
with open(SQLBOT_FILE, "r", encoding="utf-8") as f:
    sqlbot_content = f.read()
sqlbot = extract_js_object(sqlbot_content, "SQLBOT_TRAFFIC_INTELLIGENCE")

print("Parsing 2026 Excel Data...")
try:
    xls = pd.ExcelFile(EXCEL_FILE)
    df_bridges = pd.read_excel(xls, "BRIDGES 2026")
    df_culverts = pd.read_excel(xls, "MAJOR CULVERTS 2026")
    
    # Convert datetime columns to strings
    for col in df_bridges.select_dtypes(include=['datetime', 'datetimetz']).columns:
        df_bridges[col] = df_bridges[col].astype(str)
    for col in df_culverts.select_dtypes(include=['datetime', 'datetimetz']).columns:
        df_culverts[col] = df_culverts[col].astype(str)
        
    excel_bridges = df_bridges.fillna("").to_dict(orient="records")
    excel_culverts = df_culverts.fillna("").to_dict(orient="records")
except Exception as e:
    print(f"Failed to read Excel: {e}")
    excel_bridges = []
    excel_culverts = []

print("Parsing 2026 DOCX files...")
cs_texts = read_docx(CS_FILE)
investment_texts = read_docx(INVESTMENT_FILE)

# Merge logic for bridges
# legacy_bridges have `_id`, `bridge_no`, `bridge_nam`
# excel_bridges have `BridgeNumber`, `BridgeName`, `TypeCrossing`, `RoadDescrPrincipal`, `Link ID`
merged_bridges = []
for eb in excel_bridges:
    bnum = str(eb.get("BridgeNumber", "")).strip()
    match = next((lb for lb in legacy_bridges if str(lb.get("bridge_no")) == bnum), None)
    
    # Traffic stats from SQLBot
    traffic = None
    if match and sqlbot.get("bridge_predictions"):
        traffic = sqlbot["bridge_predictions"].get(match.get("_id"))
        
    merged_bridges.append({
        "BridgeNumber": bnum,
        "BridgeName": eb.get("BridgeName") or (match.get("bridge_nam") if match else ""),
        "TypeCrossing": eb.get("TypeCrossing"),
        "RoadDescrPrincipal": eb.get("RoadDescrPrincipal"),
        "LinkID": eb.get("Link ID") or eb.get("Link ID "),
        "KmPrincipal": eb.get("KmPrincipal"),
        "Firm": eb.get("Firm"),
        "Inspector": eb.get("Inspector"),
        "DateModified": str(eb.get("DateModified", "")),
        "LegacyData": match,
        "Traffic": traffic
    })

# Add legacy bridges that weren't in the Excel
excel_bnums = {b["BridgeNumber"] for b in merged_bridges}
for lb in legacy_bridges:
    if lb.get("bridge_no") not in excel_bnums:
        traffic = sqlbot["bridge_predictions"].get(lb.get("_id")) if sqlbot.get("bridge_predictions") else None
        merged_bridges.append({
            "BridgeNumber": lb.get("bridge_no"),
            "BridgeName": lb.get("bridge_nam"),
            "TypeCrossing": "Unknown",
            "RoadDescrPrincipal": lb.get("road_no"),
            "LinkID": lb.get("link_no"),
            "KmPrincipal": "",
            "Firm": "",
            "Inspector": "",
            "DateModified": "",
            "LegacyData": lb,
            "Traffic": traffic
        })

print("Writing JSON outputs...")
with open(os.path.join(DATA_OUT_DIR, "bridges.json"), "w", encoding="utf-8") as f:
    json.dump(merged_bridges, f, ensure_ascii=False)
    
with open(os.path.join(DATA_OUT_DIR, "culverts.json"), "w", encoding="utf-8") as f:
    json.dump(excel_culverts, f, ensure_ascii=False)

with open(os.path.join(DATA_OUT_DIR, "investment.json"), "w", encoding="utf-8") as f:
    json.dump({
        "critical_structures": cs_texts,
        "investment_plan": investment_texts,
        "sqlbot_kpis": {
            "bridge_prediction_count": sqlbot.get("bridge_prediction_count", 0),
            "file_count": sqlbot.get("file_count", 0)
        }
    }, f, ensure_ascii=False)

print("Database built successfully.")
