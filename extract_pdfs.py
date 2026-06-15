import os
import PyPDF2

folder = r"G:\My Drive\MOWT\Uganda National Road Network Repository\Bridge stuff\BMS Document folder\Inventory and Inspection manuals"
output_file = r"D:\OneDrive\Bridge stuff\uganda_bms\manuals_extracted.txt"

pdf_files = [f for f in os.listdir(folder) if f.lower().endswith('.pdf')]

with open(output_file, 'w', encoding='utf-8') as out:
    for filename in pdf_files:
        filepath = os.path.join(folder, filename)
        out.write(f"\n{'='*50}\n{filename}\n{'='*50}\n")
        try:
            with open(filepath, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for i, page in enumerate(reader.pages):
                    text = page.extract_text()
                    if text:
                        out.write(f"\n--- Page {i+1} ---\n")
                        out.write(text)
        except Exception as e:
            out.write(f"\nError reading {filename}: {e}\n")

print(f"Extracted {len(pdf_files)} PDFs to {output_file}")
