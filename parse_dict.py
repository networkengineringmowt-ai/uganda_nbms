import re
import json
import os

input_file = r'G:\My Drive\MOWT\Uganda National Road Network Repository\Bridge stuff\bms_bridge_data_dictionary_text.txt'
output_file = r'D:\OneDrive\Bridge stuff\uganda_bms\src\utils\dataDictionary.js'

with open(input_file, 'r', encoding='utf-8') as f:
    text = f.read()

# Sections we want to parse
sections = [
    ("TYPE_CROSSING", "1.3  TYPE CROSSING"),
    ("TYPE_BRIDGE", "1.16  TYPE BRIDGE"),
    ("TYPE_DECK", "1.17  TYPE DECK"),
    ("TYPE_DECK_MATERIAL", "1.18  TYPE DECK MATERIAL"),
    ("TYPE_ABUTMENT", "1.19  TYPE ABUTMENT (LEFT/RIGHT)"),
    ("TYPE_PIERS", "1.20  TYPE PIERS"),
    ("TYPE_PARAPET_RAILING", "1.21  TYPE PARAPET/RAILING"),
    ("TYPE_WEARING_SURFACE", "1.22  TYPE WEARING SURFACE"),
    ("TYPE_EXPANSION_JOINTS", "1.23  TYPE EXPANSION JOINTS"),
    ("TYPE_BEARINGS", "1.26  TYPE BEARINGS")
]

parsed_dicts = {}

# Skip TOC
start_search_idx = text.find('SECTION 1')
if start_search_idx == -1:
    start_search_idx = 0

for i, (dict_name, section_header) in enumerate(sections):
    # Find the start of the section
    start_idx = text.find(section_header, start_search_idx)
    if start_idx == -1:
        continue
    
    # Find the end of the section (the next section header)
    # Just look for the next "1.xx " pattern
    end_idx = len(text)
    match = re.search(r'\n1\.\d+\s+', text[start_idx + len(section_header):])
    if match:
        end_idx = start_idx + len(section_header) + match.start()
        
    section_text = text[start_idx:end_idx]
    
    # Parse codes and values
    # e.g., "01 Road over river"
    # or "? Unknown"
    # or "98 Other"
    
    code_map = {}
    lines = section_text.split('\n')
    for line in lines:
        line = line.strip()
        # Match '01 Something' or '? Unknown' or '98 Other'
        m = re.match(r'^([0-9]{2}|\?)\s+(.*)', line)
        if m:
            code = m.group(1).strip()
            val = m.group(2).strip()
            
            # Clean up the value
            # e.g. "Road over rail"
            if val:
                code_map[code] = val
                
    parsed_dicts[dict_name] = code_map

# Also parse bms_10_point_condition_ratings.txt into condition dictionary
cond_file = r'G:\My Drive\MOWT\Uganda National Road Network Repository\Bridge stuff\bms_10_point_condition_ratings.txt'
cond_map = {}
if os.path.exists(cond_file):
    with open(cond_file, 'r', encoding='utf-8') as f:
        cond_text = f.read()
    
    # Just grab the base 9 to 0 text
    cond_map = {
        '9': 'EXCELLENT',
        '8': 'VERY GOOD',
        '7': 'GOOD',
        '6': 'SATISFACTORY',
        '5': 'FAIR',
        '4': 'MARGINAL',
        '3': 'POOR',
        '2': 'VERY POOR',
        '1': 'CRITICAL',
        '0': 'BEYOND REPAIR'
    }

# Generate JS file
js_content = "/* Auto-generated Data Dictionary from Official UNRA BMS Manuals */\n\n"

for dict_name, code_map in parsed_dicts.items():
    js_content += f"export const {dict_name} = {{\n"
    for code, val in code_map.items():
        js_content += f"  '{code}': {json.dumps(val)},\n"
    js_content += "};\n\n"

js_content += "export const CONDITION_RATINGS = {\n"
for code, val in cond_map.items():
    js_content += f"  {code}: '{val}',\n"
js_content += "};\n\n"

js_content += """
export const getDictionaryLabel = (dictionary, code) => {
  if (!code) return '-';
  // Attempt to pad with 0 if it's a single digit integer passed as number/string
  let strCode = String(code).trim();
  if (strCode.length === 1 && !isNaN(strCode)) {
    strCode = '0' + strCode;
  }
  return dictionary[strCode] || dictionary[code] || code;
};
"""

os.makedirs(os.path.dirname(output_file), exist_ok=True)
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully generated {output_file} with {len(parsed_dicts)} dictionaries.")
