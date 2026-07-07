import os
import json
from collections import defaultdict, Counter

BMS_DIR = r"D:\OneDrive\Bridge stuff\uganda_bms"

def load_json(filename):
    with open(os.path.join(BMS_DIR, "public", "data", filename), "r") as f:
        return json.load(f)

bridges = load_json("bridges.json")
culverts = load_json("culverts.json")

# Helper dictionaries
analytics = {
    "bridges_by_region": defaultdict(int),
    "culverts_by_region": defaultdict(int),
    "traffic_bins": {"<1k":0, "1k-5k":0, "5k-10k":0, ">10k":0},
    "condition_overall": defaultdict(int),
    "condition_substructure": defaultdict(int),
    "condition_superstructure": defaultdict(int),
    "condition_waterway": defaultdict(int),
    "deck_materials": defaultdict(int),
    "bridge_types": defaultdict(int),
    "construction_timeline": defaultdict(int),
    "traffic_growth_scatter": [], # [aadt, growth_rate, length]
    "bridge_lengths": {"<10m":0, "10-30m":0, "30-50m":0, ">50m":0},
    "bridge_width_scatter": [], # [width, lanes]
    "scour_risk": defaultdict(int),
    "maintenance_stations": defaultdict(int),
    "culvert_spans": defaultdict(int),
    "culvert_conditions": defaultdict(int),
    "bridge_owners": defaultdict(int),
    "superload_routes": defaultdict(int),
    "critical_counts": {"Bridges": 49, "Major Culverts": 4}
}

for b in bridges:
    leg = b.get("LegacyData", {})
    if not isinstance(leg, dict): leg = {}
    
    reg = leg.get("region", "Unknown")
    analytics["bridges_by_region"][reg] += 1
    analytics["maintenance_stations"][leg.get("maintenanc", "Unknown")] += 1
    analytics["bridge_owners"][leg.get("owner", "Unknown")] += 1
    analytics["scour_risk"][leg.get("scour_risk", "Unknown")] += 1
    analytics["superload_routes"][leg.get("superload_route", "Unknown")] += 1
    
    # Conditions
    analytics["condition_overall"][leg.get("overall_rating", "Unknown")] += 1
    analytics["condition_substructure"][leg.get("substructure_rating", "Unknown")] += 1
    analytics["condition_superstructure"][leg.get("superstructure_rating", "Unknown")] += 1
    analytics["condition_waterway"][leg.get("waterway_rating", "Unknown")] += 1
    
    # Types
    analytics["deck_materials"][leg.get("type_deck_material", "Unknown")] += 1
    analytics["bridge_types"][leg.get("type_bridge", "Unknown")] += 1
    
    # Timeline
    year = leg.get("year_compl")
    if year and isinstance(year, (int, float)) and year > 1900:
        analytics["construction_timeline"][int(year)] += 1
        
    # Sizes
    length = leg.get("length") or leg.get("bridge_len")
    if length:
        if length < 10: analytics["bridge_lengths"]["<10m"] += 1
        elif length < 30: analytics["bridge_lengths"]["10-30m"] += 1
        elif length < 50: analytics["bridge_lengths"]["30-50m"] += 1
        else: analytics["bridge_lengths"][">50m"] += 1
        
    width = leg.get("width") or leg.get("bridge_wid")
    lanes = leg.get("no_of_lane")
    if width and lanes:
        analytics["bridge_width_scatter"].append([width, lanes])
        
    # Traffic
    traffic = b.get("Traffic", {})
    if traffic:
        aadt = traffic.get("aadt_2026")
        growth = traffic.get("growth_rate")
        if aadt is not None:
            if aadt < 1000: analytics["traffic_bins"]["<1k"] += 1
            elif aadt < 5000: analytics["traffic_bins"]["1k-5k"] += 1
            elif aadt < 10000: analytics["traffic_bins"]["5k-10k"] += 1
            else: analytics["traffic_bins"][">10k"] += 1
            
            if growth is not None and length:
                analytics["traffic_growth_scatter"].append([aadt, growth, length])

for c in culverts:
    reg = c.get("Maintenance_Region", "Unknown")
    analytics["culverts_by_region"][reg] += 1
    
    cond = c.get("Overall Rating", "Unknown")
    analytics["culvert_conditions"][cond] += 1
    
    span = c.get("SpanOrDiameter")
    if span:
        analytics["culvert_spans"][span] += 1

# Clean up dictionaries for JSON (convert defaultdict to dict)
def clean_dict(d):
    return {str(k): v for k, v in d.items() if str(k) != "Unknown" and str(k) != "nan"}

analytics["bridges_by_region"] = clean_dict(analytics["bridges_by_region"])
analytics["culverts_by_region"] = clean_dict(analytics["culverts_by_region"])
analytics["condition_overall"] = clean_dict(analytics["condition_overall"])
analytics["condition_substructure"] = clean_dict(analytics["condition_substructure"])
analytics["condition_superstructure"] = clean_dict(analytics["condition_superstructure"])
analytics["condition_waterway"] = clean_dict(analytics["condition_waterway"])
analytics["deck_materials"] = clean_dict(analytics["deck_materials"])
analytics["bridge_types"] = clean_dict(analytics["bridge_types"])
analytics["construction_timeline"] = dict(sorted(clean_dict(analytics["construction_timeline"]).items()))
analytics["scour_risk"] = clean_dict(analytics["scour_risk"])
analytics["maintenance_stations"] = clean_dict(analytics["maintenance_stations"])
analytics["culvert_spans"] = clean_dict(analytics["culvert_spans"])
analytics["culvert_conditions"] = clean_dict(analytics["culvert_conditions"])
analytics["bridge_owners"] = clean_dict(analytics["bridge_owners"])
analytics["superload_routes"] = clean_dict(analytics["superload_routes"])

out_path = os.path.join(BMS_DIR, "public", "data", "analytics.json")
with open(out_path, "w") as f:
    json.dump(analytics, f)

print("Analytics engine built 20 charts datasets.")
