import docx
import json
import os

doc_path = r"G:\My Drive\MOWT\Uganda National Road Network Repository\Bridge stuff\Project Status Report for April 2026 - Bridges.docx"
out_path = r"D:\OneDrive\Bridge stuff\uganda_bms\public\data\bridge_works.json"

doc = docx.Document(doc_path)
data = []

# Load existing if it's an array, or put the single dict in an array
if os.path.exists(out_path):
    with open(out_path, 'r', encoding='utf-8') as f:
        try:
            existing = json.load(f)
            if isinstance(existing, dict):
                data.append(existing)
            elif isinstance(existing, list):
                data.extend(existing)
        except json.JSONDecodeError:
            pass

for table in doc.tables:
    # Skip header row if it contains 'Project' or similar, assuming rows[1:]
    # Actually, we can check the first cell of the row
    for row in table.rows:
        cells = [cell.text.strip() for cell in row.cells]
        if len(cells) >= 6:
            # Check if this looks like a header
            if "Contract Sum" in cells[3] or "Amount Certified" in cells[3] or "JICA" in cells[3]:
                # It's a data row
                entry = {
                    "sn": "",
                    "bridge": cells[0],
                    "funder": cells[1],
                    "contractor_consultant": cells[2],
                    "financial_status": cells[3],
                    "status": cells[4],
                    "compensation": cells[5]
                }
                
                # Check for duplicates by bridge name
                if not any(e["bridge"] == entry["bridge"] for e in data):
                    data.append(entry)

with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print(f"Successfully wrote {len(data)} projects to {out_path}")
