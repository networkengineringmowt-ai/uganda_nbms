import docx
import json
import re

doc_path = r"G:\My Drive\MOWT\Uganda National Road Network Repository\Bridge stuff\Project Status Report for April 2026 - Bridges.docx"
out_path = r"D:\OneDrive\Bridge stuff\uganda_bms\public\data\bridge_works.json"

doc = docx.Document(doc_path)
data = []

for table in doc.tables:
    for i, row in enumerate(table.rows):
        cells = [cell.text.strip() for cell in row.cells]
        if len(cells) == 7:
            if "S/N" in cells[0] and "Bridge" in cells[1]:
                continue # Header row
            
            sn = cells[0]
            bridge = cells[1]
            if not bridge or bridge.lower() == "bridge":
                continue
            
            funder = cells[2]
            contractor = cells[3]
            financials = cells[4]
            status = cells[5]
            compensation = cells[6]
            
            entry = {
                "sn": sn,
                "bridge": bridge,
                "funder": funder,
                "contractor_consultant": contractor,
                "financial_status": financials,
                "status": status,
                "compensation": compensation
            }
            
            # Check for duplicates by bridge name
            if not any(e["bridge"] == entry["bridge"] for e in data):
                data.append(entry)

with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print(f"Successfully wrote {len(data)} projects to {out_path}")
