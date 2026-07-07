import os
import json
from docx import Document
from PyPDF2 import PdfReader

ROOT_DIR = r"D:\OneDrive\Bridge stuff"
BMS_DIR = os.path.join(ROOT_DIR, "uganda_bms")
DOCS_OUT_DIR = os.path.join(BMS_DIR, "public", "data")
os.makedirs(DOCS_OUT_DIR, exist_ok=True)

docs = []
count = 0

for root, dirs, files in os.walk(ROOT_DIR):
    if "uganda_bms" in root:
        continue
    for f in files:
        if f.startswith("~$"): continue
        path = os.path.join(root, f)
        ext = f.lower().split('.')[-1]
        
        if ext in ['docx', 'pdf']:
            if count >= 50: # Limit to 50 documents to prevent massive build times
                break
                
            snippet = ""
            try:
                if ext == 'docx':
                    doc = Document(path)
                    texts = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
                    snippet = " ".join(texts[:5])[:500]
                elif ext == 'pdf':
                    reader = PdfReader(path)
                    if len(reader.pages) > 0:
                        snippet = reader.pages[0].extract_text()[:500]
            except Exception as e:
                snippet = f"Error reading document: {e}"
                
            docs.append({
                "filename": f,
                "type": ext.upper(),
                "snippet": snippet,
                "size_mb": round(os.path.getsize(path)/(1024*1024), 2)
            })
            count += 1
            print(f"Parsed {f}")
            
    if count >= 50:
        break

with open(os.path.join(DOCS_OUT_DIR, "documents.json"), "w", encoding="utf-8") as f:
    json.dump(docs, f, ensure_ascii=False)

print(f"Document engine complete. Processed {len(docs)} documents.")
