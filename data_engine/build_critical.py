import os
import json
import docx

S_DRIVE_DOC = r"S:\ANNUAL DATA COLLECTION\LIST OF CRITICAL STRUCTURES 2024.docx"
OUT_FILE = r"D:\OneDrive\Bridge stuff\uganda_bms\public\data\critical_structures.json"
os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)

try:
    doc = docx.Document(S_DRIVE_DOC)
    critical_data = []

    # Assuming the first row is headers: S/N, Bridge No., Bridge Name, Link ID, Link Name, Maintenance Station, Bridge Length, Bridge Width, Overall Rating, Pictorial Evidence, Commment
    for table in doc.tables:
        for i, row in enumerate(table.rows):
            if i == 0:
                continue # Skip header
            
            cells = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
            if len(cells) >= 11:
                structure = {
                    "BridgeNumber": cells[1],
                    "BridgeName": cells[2],
                    "LinkID": cells[3],
                    "LinkName": cells[4],
                    "MaintenanceStation": cells[5],
                    "BridgeLength": cells[6],
                    "BridgeWidth": cells[7],
                    "OverallRating": cells[8],
                    "Comment": cells[10]
                }
                if structure["BridgeNumber"]:
                    critical_data.append(structure)
    
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(critical_data, f, indent=2)
    print(f"Successfully extracted {len(critical_data)} critical structures.")

except Exception as e:
    print(f"Failed to parse critical structures: {e}")
