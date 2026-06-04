"""
Build MDB: Extract bridge/culvert data from Access databases and merge
with the existing bridges.json and culverts.json.
"""
import os
import json
import pyodbc
import datetime

BMS_DIR = r"D:\OneDrive\Bridge stuff\uganda_bms"
CAPTURE_DB = r"S:\ANNUAL DATA COLLECTION\Databases\BMS Capture Module\BMS_Data2015_UNRA_Capture .mdb"
FRONTEND_DB = r"S:\ANNUAL DATA COLLECTION\Databases\BMS\BMSFrontend2000.MDB"

BRIDGES_JSON = os.path.join(BMS_DIR, "public", "data", "bridges.json")
CULVERTS_JSON = os.path.join(BMS_DIR, "public", "data", "culverts.json")

def connect(db_path):
    conn_str = rf'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={db_path};'
    return pyodbc.connect(conn_str)

def serialise(val):
    if isinstance(val, (datetime.datetime, datetime.date)):
        return val.isoformat()
    if isinstance(val, bytes):
        return None
    return val

def table_to_dicts(conn, table, key_col=None):
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM [{table}]")
    cols = [d[0] for d in cursor.description]
    rows = []
    for row in cursor.fetchall():
        d = {c: serialise(v) for c, v in zip(cols, row)}
        rows.append(d)
    if key_col:
        return {r[key_col]: r for r in rows if r.get(key_col)}
    return rows

# ── 1. Read existing JSON ───────────────────────────────────────────
with open(BRIDGES_JSON, encoding="utf-8") as f:
    bridges = json.load(f)
with open(CULVERTS_JSON, encoding="utf-8") as f:
    culverts = json.load(f)

bridges_by_id = {b["BridgeNumber"]: b for b in bridges if b.get("BridgeNumber")}
culverts_by_id = {c["CulvertNumber"]: c for c in culverts if c.get("CulvertNumber")}

print(f"Existing bridges: {len(bridges_by_id)}, culverts: {len(culverts_by_id)}")

# ── 2. Extract from Capture Module DB ───────────────────────────────
try:
    cap = connect(CAPTURE_DB)
    
    # Bridge inventory
    cap_bridges = table_to_dicts(cap, "tblB_Bridge", "BridgeNumber")
    print(f"Capture DB bridges: {len(cap_bridges)}")
    
    # Culvert inventory
    cap_culverts = table_to_dicts(cap, "tblCul_Culvert", "CulvertNumber")
    print(f"Capture DB culverts: {len(cap_culverts)}")
    
    # Bridge inspections
    cap_inspections = table_to_dicts(cap, "tblI_Inspec", "BridgeNumber")
    print(f"Capture DB bridge inspections: {len(cap_inspections)}")
    
    # Culvert inspections
    cap_cul_inspections = table_to_dicts(cap, "tblICul_Inspec", "CulvertNumber")
    print(f"Capture DB culvert inspections: {len(cap_cul_inspections)}")
    
    # Bridge conditions
    cap_conditions = table_to_dicts(cap, "tblI_Condition")
    print(f"Capture DB bridge condition records: {len(cap_conditions)}")
    
    # Culvert conditions
    cap_cul_conditions = table_to_dicts(cap, "tblICul_Condition")
    print(f"Capture DB culvert condition records: {len(cap_cul_conditions)}")
    
    cap.close()
except Exception as e:
    print(f"Error reading Capture DB: {e}")
    cap_bridges = {}
    cap_culverts = {}
    cap_inspections = {}
    cap_cul_inspections = {}
    cap_conditions = []
    cap_cul_conditions = []

# ── 3. Extract from Frontend DB ─────────────────────────────────────
try:
    fe = connect(FRONTEND_DB)
    
    # Coordinates
    fe_coords = table_to_dicts(fe, "Bridge_Coordinate_ver2", "BRIDGE_NUM")
    print(f"Frontend DB coordinates: {len(fe_coords)}")
    
    # ADHOC report data (bridge names / road numbers)
    fe_adhoc = table_to_dicts(fe, "xtblT_ADHOCRepData", "BridgeNumber")
    print(f"Frontend DB ADHOC records: {len(fe_adhoc)}")
    
    fe.close()
except Exception as e:
    print(f"Error reading Frontend DB: {e}")
    fe_coords = {}
    fe_adhoc = {}

# ── 4. Merge into bridges ──────────────────────────────────────────
merged_bridge_count = 0
new_bridge_count = 0

for bid, cap_data in cap_bridges.items():
    if bid in bridges_by_id:
        b = bridges_by_id[bid]
        # Enrich with Capture Module fields that are missing
        if not b.get("Inspector") and cap_data.get("Inspector"):
            b["Inspector"] = cap_data["Inspector"]
        if not b.get("InspectionDate") and cap_data.get("DateModified"):
            b["InspectionDate"] = cap_data["DateModified"]
        if not b.get("Remarks") and cap_data.get("Remarks"):
            b["Remarks"] = cap_data["Remarks"]
        if not b.get("CompletionYear") and cap_data.get("CompletionYear"):
            b["CompletionYear"] = cap_data["CompletionYear"]
        if not b.get("NumberOfSpans") and cap_data.get("NumberOfSpans"):
            b["NumberOfSpans"] = cap_data["NumberOfSpans"]
        if not b.get("NumberOfLanes") and cap_data.get("NumberOfLanes"):
            b["NumberOfLanes"] = cap_data["NumberOfLanes"]
        if not b.get("ScourRisk") and cap_data.get("ScourRisk"):
            b["ScourRisk"] = cap_data["ScourRisk"]
        # Coordinates from Capture Module (WGS84)
        if (not b.get("Lat") or b.get("Lat") == 0) and cap_data.get("CoOrdinateS"):
            b["Lat"] = cap_data["CoOrdinateS"]
            b["Lon"] = cap_data.get("CoOrdinateE")
        merged_bridge_count += 1
    else:
        # New bridge not in our dataset — add it
        new_bridge = {
            "BridgeNumber": bid,
            "BridgeName": cap_data.get("BridgeName", ""),
            "RoadNumberPrincipal": cap_data.get("RoadNumberPrincipal", ""),
            "KmPrincipal": cap_data.get("KmPrincipal"),
            "OverallBridgeLength": cap_data.get("OverallBridgeLength"),
            "OverallBridgeWidth": cap_data.get("OverallBridgeWidth"),
            "NumberOfSpans": cap_data.get("NumberOfSpans"),
            "NumberOfLanes": cap_data.get("NumberOfLanes"),
            "ScourRisk": cap_data.get("ScourRisk"),
            "Inspector": cap_data.get("Inspector"),
            "InspectionDate": cap_data.get("DateModified"),
            "Remarks": cap_data.get("Remarks"),
            "CompletionYear": cap_data.get("CompletionYear"),
            "Lat": cap_data.get("CoOrdinateS"),
            "Lon": cap_data.get("CoOrdinateE"),
        }
        bridges_by_id[bid] = new_bridge
        new_bridge_count += 1

# Also merge Frontend DB coordinates where missing
for bid, coord in fe_coords.items():
    if bid in bridges_by_id:
        b = bridges_by_id[bid]
        if (not b.get("Lat") or b.get("Lat") == 0) and coord.get("S"):
            b["Lat"] = coord["S"]
            b["Lon"] = coord["E"]
        if not b.get("LinkID") and coord.get("LinkID"):
            b["LinkID"] = coord["LinkID"]

print(f"Merged {merged_bridge_count} bridges, added {new_bridge_count} new bridges")

# ── 5. Merge into culverts ─────────────────────────────────────────
merged_cul_count = 0
new_cul_count = 0

for cid, cap_data in cap_culverts.items():
    if cid in culverts_by_id:
        c = culverts_by_id[cid]
        if not c.get("Inspector") and cap_data.get("Inspector"):
            c["Inspector"] = cap_data["Inspector"]
        if not c.get("InspectionDate") and cap_data.get("DateModified"):
            c["InspectionDate"] = cap_data["DateModified"]
        if not c.get("Remarks") and cap_data.get("Remarks"):
            c["Remarks"] = cap_data["Remarks"]
        if (not c.get("Lat") or c.get("Lat") == 0) and cap_data.get("CoOrdinateS"):
            c["Lat"] = cap_data["CoOrdinateS"]
            c["Lon"] = cap_data.get("CoOrdinateE")
        merged_cul_count += 1
    else:
        new_cul = {
            "CulvertNumber": cid,
            "CulvertName": cap_data.get("CulvertName", ""),
            "RoadNumberPrincipal": cap_data.get("RoadNumberPrincipal", ""),
            "KmPrincipal": cap_data.get("KmPrincipal"),
            "Inspector": cap_data.get("Inspector"),
            "InspectionDate": cap_data.get("DateModified"),
            "Remarks": cap_data.get("Remarks"),
            "Lat": cap_data.get("CoOrdinateS"),
            "Lon": cap_data.get("CoOrdinateE"),
        }
        culverts_by_id[cid] = new_cul
        new_cul_count += 1

print(f"Merged {merged_cul_count} culverts, added {new_cul_count} new culverts")

# ── 6. Write back ──────────────────────────────────────────────────
final_bridges = list(bridges_by_id.values())
final_culverts = list(culverts_by_id.values())

with open(BRIDGES_JSON, "w", encoding="utf-8") as f:
    json.dump(final_bridges, f, ensure_ascii=False, default=str)
with open(CULVERTS_JSON, "w", encoding="utf-8") as f:
    json.dump(final_culverts, f, ensure_ascii=False, default=str)

print(f"\nFinal output: {len(final_bridges)} bridges, {len(final_culverts)} culverts")
