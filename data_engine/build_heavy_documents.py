import os
import json
import re
from docx import Document

ROOT_DIR = r"D:\OneDrive\Bridge stuff"
BMS_DIR = os.path.join(ROOT_DIR, "uganda_bms")
DATA_OUT_DIR = os.path.join(BMS_DIR, "public", "data")

heavy_docs = [
    "Bridgeinspection report0808225.docx",
    "FULL INSPECTION REPORT DRAFT(KITGUM-MOYO-GULU)03032026.doc",
    "uganda_all_bridges_traffic_statistics_report (2).pdf",
    "uganda_all_bridges_traffic_statistics_report (3).pdf"
]

results = []

for doc_name in heavy_docs:
    path = os.path.join(ROOT_DIR, doc_name)
    if not os.path.exists(path):
        print(f"File not found: {doc_name}")
        continue
        
    print(f"Parsing {doc_name}...")
    size_mb = round(os.path.getsize(path)/(1024*1024), 2)
    snippet = ""
    
    if doc_name.endswith(".docx"):
        try:
            doc = Document(path)
            # Just extract the first 100 paragraphs to prevent memory issues
            texts = [p.text.strip() for p in doc.paragraphs[:100] if p.text.strip()]
            snippet = " ".join(texts)[:5000]
        except Exception as e:
            snippet = f"Error reading docx: {e}"
            
    elif doc_name.endswith(".doc"):
        try:
            # Fallback binary string extraction for .doc files
            with open(path, "rb") as f:
                content = f.read()
                # Find sequences of printable ascii chars
                strings = re.findall(b"[a-zA-Z0-9\s\.\,\:\;\(\)\[\]]{5,}", content)
                snippet = " ".join([s.decode('ascii', errors='ignore') for s in strings[:200]])[:5000]
        except Exception as e:
            snippet = f"Error reading doc: {e}"
            
    elif doc_name.endswith(".pdf"):
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(path)
            if len(reader.pages) > 0:
                snippet = reader.pages[0].extract_text()[:5000]
        except Exception as e:
            snippet = f"Error reading pdf: {e}"
            
    results.append({
        "filename": doc_name,
        "type": doc_name.split('.')[-1].upper(),
        "snippet": snippet,
        "size_mb": size_mb
    })

# We append these to the existing documents.json if it exists
docs_file = os.path.join(DATA_OUT_DIR, "documents.json")
existing_docs = []
if os.path.exists(docs_file):
    with open(docs_file, "r", encoding="utf-8") as f:
        existing_docs = json.load(f)

# Replace if already exists, else append
for res in results:
    match = next((d for d in existing_docs if d["filename"] == res["filename"]), None)
    if match:
        match["snippet"] = res["snippet"]
        match["size_mb"] = res["size_mb"]
    else:
        existing_docs.append(res)

with open(docs_file, "w", encoding="utf-8") as f:
    json.dump(existing_docs, f, ensure_ascii=False)

print("Heavy document engine complete.")
