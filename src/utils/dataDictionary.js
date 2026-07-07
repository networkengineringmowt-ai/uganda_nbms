/* Auto-generated Data Dictionary from Official UNRA BMS Manuals */

export const TYPE_CROSSING = {
  '01': "Road over river",
  '02': "Road over rail",
  '03': "Road over road",
  '04': "Road over canal",
  '05': "Rail over road",
  '06': "Canal/Pipe over road",
  '07': "Pedestrian over road",
  '08': "Road over pedestrian",
  '09': "Agricultural underpass",
  '10': "Road over Water pipes",
  '11': "Road over conveyer belt",
  '12': "Conveyer belt over road",
  '13': "Other",
  '?': "Unknown",
};

export const TYPE_BRIDGE = {
  '01': "Simply supported span",
  '02': "Continuous span",
  '03': "Double cantilevered span",
  '04': "Single cantilevered span",
  '05': "Single suspended simply supported span",
  '06': "Suspended span",
  '07': "Portal frame",
  '08': "Cantilevered construction",
  '09': "Strut frame",
  '10': "Supported cantilevered construction",
  '11': "Suspension bridge",
  '12': "Three hinged arch rib",
  '13': "Three hinged arch slab",
  '14': "Two hinged arch rib",
  '15': "Two hinged arch slab",
  '16': "Bowstring",
  '17': "Fixed arch slab",
  '18': "Fixed arch - deck at crown",
  '19': "Fixed arch - deck at intermediate level",
  '20': "Lattice girder truss",
  '21': "Vierendeel truss",
  '22': "Girdled frame",
  '23': "Cable stayed bridge",
  '24': "Box culvert (in-situ concrete)",
  '25': "Box culvert (precast concrete)",
  '26': "Concrete pipe culvert",
  '27': "Corrugated metal pipe culvert",
  '28': "Corrugated metal arch (Armco) culvert",
  '29': "Concrete arch culvert",
  '98': "Other",
  '?': "Unknown",
};

export const TYPE_DECK = {
  '01': "Solid slab",
  '02': "Voided slab",
  '03': "Inverted T-beams with infill",
  '04': "Inverted T-beams (Pseudo box)",
  '05': "Box beams",
  '06': "Beam and slab deck",
  '07': "Monolithic beam and slab deck",
  '08': "Rib deck",
  '09': "Voided spine beam",
  '10': "Solid spine beam",
  '11': "Twin beam and slab",
  '12': "Box girder \u2013 Box beam",
  '13': "Multiple box girder Box beam",
  '14': "Twin box and slab",
  '15': "Multiple box and slab",
  '16': "Steel I-beams encased in concrete",
  '17': "Steel I-beam ribs (Jacked arch)",
  '18': "Composite steel and concrete",
  '19': "Non-composite steel and concrete",
  '20': "Steel with any other material",
  '21': "Solid slab with balustrade beam",
  '22': "Cell structure",
  '98': "Other",
  '?': "Unknown",
};

export const TYPE_DECK_MATERIAL = {
  '01': "Pre/post-stressed concrete",
  '02': "Precast units (cell structures)",
  '03': "Reinforced concrete",
  '04': "Precast beams",
  '05': "Structural steel",
  '06': "Steel and concrete",
  '07': "Timber",
  '98': "Other",
  '?': "Unknown",
};

export const TYPE_ABUTMENT = {
  '01': "Mass concrete gravity type",
  '02': "Reinforced Concrete",
  '03': "R C wall with RC wingwalls",
  '04': "Spill through",
  '05': "Seating beam/stub column",
  '06': "Frame (only bridges, not cell structures)",
  '07': "Buttressed concrete wall",
  '08': "Masonry wall",
  '09': "Integral pile cap",
  '10': "Reinforced earth",
  '11': "Counterforte RC",
  '12': "Cell structure",
  '13': "Multiple V-type",
  '14': "Perched abutment",
  '22': "Solid RC cantilever/wingwall",
  '23': "Solid RC cantilever/returnwall",
  '97': "None",
  '98': "Other",
  '?': "Unknown",
};

export const TYPE_PIERS = {
  '20': "Solid R C wall",
  '21': "Cellular R C Wall",
  '22': "Single R C column",
  '23': "Single RC hollow column",
  '24': "Multiple R C columns",
  '25': "Multiple R C columns (Beam on top)",
  '26': "Masonry wall",
  '27': "Mass concrete wall",
  '28': "Steel lattice",
  '29': "Single RC splayed pier",
  '30': "Multiple RC splayed piers",
  '31': "Single RCV shape",
  '32': "Multiple RCV shape",
  '97': "None",
  '98': "Other",
  '?': "Unknown",
};

export const TYPE_PARAPET_RAILING = {
  '01': "Guard blocks / Guide blocks",
  '02': "Steel stanchion and railing (1)",
  '03': "Steel stanchion and railing (2)",
  '04': "RC stanchion / steel railing",
  '05': "RC stanchion / aluminium railing",
  '06': "RC wall less than 300mm",
  '07': "RC \u2018New Jersey\u2019 balustrade",
  '08': "RC \u2018New Jersey\u2019 plus steel rail",
  '09': "RC solid balustrade",
  '10': "RC \u2018New Jersey\u2019 plus guardrail",
  '11': "Guardrail only",
  '12': "Steel stanchion and grid",
  '13': "RC wall more than 300mm high",
  '14': "RC wall less than 300mm high plus",
  '15': "RC wall more than 300mm high plus",
  '16': "RC wall less than 300mm high plus",
  '17': "RC wall more than 300mm high plus",
  '97': "None",
  '98': "Other",
  '?': "Unknown",
};

export const TYPE_WEARING_SURFACE = {
  '01': "Premixed asphalt  03    Concrete  98    Other",
  '02': "Chip-and-spray 04    Gravel ?     Unknown",
};

export const TYPE_EXPANSION_JOINTS = {
  '01': "Concrete nosing with compression seal",
  '02': "Concrete nosing with steel edge and",
  '03': "Concrete nosing with gland in metal/steel runner",
  '04': "Concrete nosing with joint filler",
  '05': "Concrete nosing with silicone sealant",
  '06': "Elastomeric concrete nosing with compression",
  '07': "Epoxy nosing with compression seal",
  '08': "Epoxy nosing with steel edge and compression",
  '09': "Open joint with steel edge",
  '10': "Open joint with concrete nosing and steel edge",
  '11': "Open joint with concrete nosing only",
  '12': "Open joint with no steel edge or",
  '13': "Bolt down joint",
  '14': "Metal finger joint",
  '15': "Sliding steel plates",
  '16': "Modular joint",
  '17': "Custom built",
  '18': "Buried under surfacing",
  '19': "Steel plate buried under surfacing",
  '20': "Asphaltic plug-type joint (Thorma)",
  '21': "Hot-poured bitumen rubber sealant",
  '97': "None",
  '98': "Other",
  '?': "Unknown",
};

export const TYPE_BEARINGS = {
  '01': "Pot-bearings/PTFE-Type/Teflon",
  '02': "Elastomeric rubber pads",
  '03': "Roofing felt / Malthoid (slip membrane)",
  '04': "Concrete rocker type",
  '05': "Steel roller",
  '06': "Steel hinge",
  '07': "Concrete hinge",
  '08': "Steel/ copper plates",
  '97': "None",
  '98': "Other",
  '?': "Unknown",
};

export const CONDITION_RATINGS = {
  9: 'Excellent',
  8: 'Very Good',
  7: 'Good',
  6: 'Satisfactory',
  5: 'Fair',
  4: 'Marginal',
  3: 'Poor',
  2: 'Very Poor',
  1: 'Critical',
  0: 'Beyond Repair',
};

export const getConditionLabel = (score) => {
  if (score === null || score === undefined || score === '') return 'Unknown';
  const numericScore = Number(score);
  if (Number.isFinite(numericScore)) {
    const rating = Math.min(9, Math.max(0, Math.round(numericScore)));
    return CONDITION_RATINGS[rating] || 'Unknown';
  }
  const normalized = String(score).trim().toUpperCase();
  const knownLabel = Object.values(CONDITION_RATINGS).find((label) => label.toUpperCase() === normalized);
  return knownLabel || String(score);
};

export const CONDITION_COLORS = {
  'EXCELLENT': '#22c55e',
  'VERY GOOD': '#22c55e',
  'GOOD': '#4ade80',
  'SATISFACTORY': '#84cc16',
  'FAIR': '#facc15',
  'MARGINAL': '#eab308',
  'POOR': '#f97316',
  'VERY POOR': '#f87171',
  'CRITICAL': '#ef4444',
  'BEYOND REPAIR': '#ef4444',
  'UNKNOWN': 'var(--text-secondary)'
};

export const getConditionColor = (label) => {
  if (!label) return 'var(--text-secondary)';
  return CONDITION_COLORS[String(label).toUpperCase()] || 'var(--text-secondary)';
};


export const getDictionaryLabel = (dictionary, code) => {
  if (!code) return '-';
  // Attempt to pad with 0 if it's a single digit integer passed as number/string
  let strCode = String(code).trim();
  if (strCode.length === 1 && !isNaN(strCode)) {
    strCode = '0' + strCode;
  }
  return dictionary[strCode] || dictionary[code] || code;
};

export const TYPE_CULVERT = {
  '01': "Box culvert (in situ concrete)",
  '02': "Box culvert (precast units)",
  '03': "Concrete pipe culvert",
  '04': "Corrugated metal pipe culvert",
  '05': "Corrugated metal arch (Armco) culvert",
  '06': "Concrete arch culvert",
  '98': "Unknown"
};
