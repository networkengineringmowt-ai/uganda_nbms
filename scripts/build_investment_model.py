"""
Compute the UNRA Bridge Investment Model from the authoritative 2026 inventory
and emit public/data/bridge_investment.json for the Investment Planning view.

Replicates UNRA_Bridge_Investment_Model.xlsx (26 Bridges Concept) exactly:
  route weights A1.3/B1.15/C1.0 · urgency Good0.6/Fair1.0/Poor1.5/Critical2.0/
  NoData1.1 · unit costs Routine40 & Preventive220 (UGX Mn/bridge), Major Rehab
  3.5 & Replacement 6.5 (UGX Mn/m2 of deck) · priority score & FY planning window.
"""
import openpyxl, json, os
from collections import defaultdict

XL = r"G:\My Drive\MOWT\Uganda National Road Network Repository\Bridge stuff\Bridges and Culverts 2026-FINAL 3.xlsx"
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "public", "data", "bridge_investment.json")

ROUTE_W = {"A": 1.3, "B": 1.15, "C": 1.0, "M": 1.0}
ROUTE_BONUS = {"A": 30, "B": 20, "C": 10, "M": 10}
URGENCY = {"Good": 0.6, "Fair": 1.0, "Poor": 1.5, "Critical": 2.0, "No Data": 1.1}
COST_ROUTINE, COST_PREVENTIVE = 40.0, 220.0
COST_REHAB_M2, COST_REPLACE_M2 = 3.5, 6.5


def num(v):
    try:
        f = float(v); return f if f == f else None
    except (TypeError, ValueError):
        return None


def clean(v):
    s = str(v).strip() if v is not None else ""
    return "" if s in ("-", "None") else s


def band(rating):
    if rating is None:
        return "No Data"
    if rating < 3:
        return "Critical"
    if rating < 5:
        return "Poor"
    if rating < 7:
        return "Fair"
    return "Good"


INTERVENTION = {"Critical": "Bridge Replacement", "Poor": "Major Rehabilitation",
                "Fair": "Preventive Repair", "Good": "Routine Maintenance",
                "No Data": "Routine Maintenance"}
PHASE = {"Critical": "Phase 1 - Emergency / replacement preparation",
         "Poor": "Phase 1 - Rehabilitation design and works",
         "Fair": "Phase 2 - Preventive repairs",
         "Good": "Phase 3 - Routine preservation",
         "No Data": "Phase 3 - Routine preservation"}
WINDOW = {"Critical": "FY 2026/27", "Poor": "FY 2026/27 - 2027/28",
          "Fair": "FY 2027/28 - 2028/29", "Good": "Routine annual programme",
          "No Data": "Inspect & rate"}

wb = openpyxl.load_workbook(XL, read_only=True, data_only=True)
ws = wb["BRIDGES 2026"]
bridges = []
for r in ws.iter_rows(min_row=2, values_only=True):
    if not (clean(r[0]) or clean(r[1]) or clean(r[10])):
        continue
    cat = clean(r[77])
    if cat.lower().startswith("under"):
        rating = None
    else:
        rating = num(r[76])
    b = band(rating)
    rcls = (clean(r[54]) or "C").upper()[:1]
    if rcls not in ROUTE_W:
        rcls = "C"
    length = num(r[44])
    width = num(r[45])
    deck = round(length * width, 1) if (length and width) else None
    interv = INTERVENTION[b]
    if interv == "Bridge Replacement":
        cost = round(deck * COST_REPLACE_M2, 1) if deck else None
    elif interv == "Major Rehabilitation":
        cost = round(deck * COST_REHAB_M2, 1) if deck else None
    elif interv == "Preventive Repair":
        cost = COST_PREVENTIVE
    else:
        cost = COST_ROUTINE
    km = num(r[14])
    if rating is not None:
        kmb = 10 if (km and km > 40) else (5 if (km and km > 20) else 0)
        score = round((10 - rating) * 20 * ROUTE_W[rcls] * URGENCY[b] + ROUTE_BONUS[rcls] + kmb, 1)
    else:
        score = None
    bridges.append({
        "bridge_no": clean(r[1]) or clean(r[0]),
        "name": clean(r[10]),
        "link_id": clean(r[53]) or clean(r[13]),
        "link_name": clean(r[55]) or clean(r[12]),
        "region": clean(r[61]),
        "station": clean(r[60]),
        "road_class": rcls,
        "km": round(km, 2) if km is not None else None,
        "rating": rating,
        "band": b,
        "length_m": length,
        "width_m": width,
        "deck_area_m2": deck,
        "intervention": interv,
        "phase": PHASE[b],
        "planning_window": WINDOW[b],
        "indicative_cost_ugx_mn": cost,
        "priority_score": score,
    })

# Rank by priority score (desc) among rated bridges
rated = [b for b in bridges if b["priority_score"] is not None]
rated.sort(key=lambda x: -x["priority_score"])
for i, b in enumerate(rated):
    b["priority_rank"] = i + 1
for b in bridges:
    b.setdefault("priority_rank", None)

# ── Summary aggregates ───────────────────────────────────────────────────────
def money(bs):
    return round(sum(b["indicative_cost_ugx_mn"] or 0 for b in bs), 1)

by_band = defaultdict(int)
by_interv = defaultdict(lambda: {"count": 0, "cost": 0.0})
by_region = defaultdict(lambda: {"count": 0, "cost": 0.0})
by_window = defaultdict(lambda: {"count": 0, "cost": 0.0})
for b in bridges:
    by_band[b["band"]] += 1
    by_interv[b["intervention"]]["count"] += 1
    by_interv[b["intervention"]]["cost"] += b["indicative_cost_ugx_mn"] or 0
    if b["region"]:
        by_region[b["region"]]["count"] += 1
        by_region[b["region"]]["cost"] += b["indicative_cost_ugx_mn"] or 0
    by_window[b["planning_window"]]["count"] += 1
    by_window[b["planning_window"]]["cost"] += b["indicative_cost_ugx_mn"] or 0

rnd = lambda d: {k: {"count": v["count"], "cost": round(v["cost"], 1)} for k, v in d.items()}
out = {
    "meta": {
        "source": "UNRA Bridge Investment Model applied to Bridges and Culverts 2026-FINAL 3.xlsx",
        "analysis_year": 2026,
        "currency": "UGX Million",
        "assumptions": {
            "route_weight": ROUTE_W, "urgency_factor": URGENCY,
            "unit_costs": {"routine_mn": COST_ROUTINE, "preventive_mn": COST_PREVENTIVE,
                           "major_rehab_mn_per_m2": COST_REHAB_M2, "replacement_mn_per_m2": COST_REPLACE_M2},
        },
    },
    "summary": {
        "total_bridges": len(bridges),
        "total_cost_ugx_mn": money(bridges),
        "total_cost_ugx_bn": round(money(bridges) / 1000, 2),
        "by_band": dict(by_band),
        "by_intervention": rnd(by_interv),
        "by_region": rnd(by_region),
        "by_planning_window": rnd(by_window),
    },
    "bridges": bridges,
}
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
print(f"bridges: {len(bridges)} | total capital need: UGX {out['summary']['total_cost_ugx_bn']} Bn")
print("by intervention:", {k: v["count"] for k, v in out["summary"]["by_intervention"].items()})
print("by band:", dict(by_band))
print("top 5 priority:", [(b["bridge_no"], b["name"], b["priority_score"], b["intervention"]) for b in rated[:5]])
