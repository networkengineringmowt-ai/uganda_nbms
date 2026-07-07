// BMS Algorithms and Engineering Logic ported from UNRA Asset Management System 2017 Manual

// --- OVERALL CONDITION RATING: BRIDGES ---
// Table 3: System Parameters/Overall Rating Variables for Bridges
const getBridgeWeight = (component, rating) => {
  if (rating === null || rating === undefined) return 0;
  
  if (rating <= 2) {
    switch (component) {
      case 'Approaches': return 6;
      case 'Waterway': return 8;
      case 'Substructure': return 8;
      case 'Superstructure': return 8;
      case 'Roadway': return 6;
      default: return 0;
    }
  } else if (rating <= 4) {
    switch (component) {
      case 'Approaches': return 2;
      case 'Waterway': return 2;
      case 'Substructure': return 4;
      case 'Superstructure': return 4;
      case 'Roadway': return 2;
      default: return 0;
    }
  } else {
    // 5 to 9
    switch (component) {
      case 'Approaches': return 0.25;
      case 'Waterway': return 1;
      case 'Substructure': return 2;
      case 'Superstructure': return 2;
      case 'Roadway': return 0.5;
      default: return 0;
    }
  }
};

/**
 * Calculates the Overall Condition Rating for a bridge (0-9)
 * @param {Object} ratings - { approaches: number, waterway: number, substructure: number, superstructure: number, roadway: number }
 */
export const calculateBridgeOverallRating = (ratings) => {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [component, rating] of Object.entries(ratings)) {
    if (rating != null && !isNaN(rating)) {
      // capitalize first letter to match switch statement
      const compKey = component.charAt(0).toUpperCase() + component.slice(1);
      const weight = getBridgeWeight(compKey, rating);
      totalWeight += weight;
      weightedSum += (weight * rating);
    }
  }

  if (totalWeight === 0) return null;
  return Math.round(weightedSum / totalWeight);
};

// --- OVERALL CONDITION RATING: CULVERTS ---
/**
 * Calculates the Overall Condition Rating for a major culvert (0-9)
 * @param {Object} ratings - { waterway: number, inletOutlet: number, structure: number, roadway: number }
 */
export const calculateCulvertOverallRating = (ratings) => {
  const weights = {
    waterway: 0.20,
    inletOutlet: 0.25,
    structure: 0.45,
    roadway: 0.10
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [component, rating] of Object.entries(ratings)) {
    if (rating != null && !isNaN(rating) && weights[component]) {
      totalWeight += weights[component];
      weightedSum += (weights[component] * rating);
    }
  }

  if (totalWeight === 0) return null;
  // Normalize if some components are missing
  return Math.round(weightedSum / totalWeight);
};

// --- ASSET VALUATION (CRC & CDRC) ---
const UNIT_COST_UGX = 3500000; // Estimated 3.5M UGX per square meter as placeholder

const getPierHeightFactor = (maxPierHeight) => {
  if (!maxPierHeight) return 1;
  if (maxPierHeight <= 8) return 1;
  if (maxPierHeight <= 30) return 1.5;
  return 2;
};

const getFillHeightFactor = (maxFillHeight) => {
  if (!maxFillHeight) return 1;
  if (maxFillHeight <= 3) return 1;
  if (maxFillHeight <= 6) return 1.2;
  if (maxFillHeight <= 10) return 1.4;
  return 1.6;
};

/**
 * Calculates Current Replacement Cost (CRC) and Current Depreciated Replacement Cost (CDRC)
 * @param {Object} structure - The parsed structure object
 * @param {boolean} isCulvert - True if structure is a major culvert
 * @returns {Object} { crc: number, cdrc: number }
 */
export const calculateAssetValue = (structure, isCulvert) => {
  let length = parseFloat(structure['Overall Length'] || structure.length || structure.bridge_len || structure.culvert_len) || 0;
  let width = parseFloat(structure['Overall Width'] || structure.width || structure.bridge_wid || structure.overall_width) || 0;
  
  if (length === 0 || width === 0) return null;
  
  const area = length * width;
  let crc;

  if (isCulvert) {
    const pipes = parseFloat(structure.NoOfPipesOrCells || structure.no_of_pipes) || 1;
    const fillHeight = parseFloat(structure.FillHeight || structure.fill_height) || 0;
    const factor = getFillHeightFactor(fillHeight);
    crc = area * UNIT_COST_UGX * pipes * factor;
  } else {
    // For bridges, assume pier height defaults to <8m if unknown
    // In legacy DB this might be derived from elevation diffs or fields not always populated
    const factor = getPierHeightFactor(0); 
    crc = area * UNIT_COST_UGX * factor;
  }

  const rating = parseFloat(structure.OverallConditionRating || structure.LegacyData?.overall_rating || structure['Overall Rating']);
  let cdrc = crc;
  if (!isNaN(rating)) {
    cdrc = (crc * rating) / 9;
  }

  return { crc, cdrc };
};

// --- DEFICIENCY INDEX RANKING ---
// D = DHC + DVC + DAA + DC
// Implementing DC (Bridge Condition Deficiency) as the primary index since full traffic 
// and geometry data (ADTO, VCG, VCM) for clearance formulas is rarely fully populated in the sample sets.
// DC = WC * sum(wi * ki) / sum(wi) 
const COMPONENT_WEIGHTS = {
  superstructure: 1.0,
  substructure: 1.0,
  roadway: 0.5,
  approach: 0.25,
  waterway: 0.83
};

const getConditionCoefficient = (rating) => {
  // Table 10 from manual
  if (rating === 0 || rating === 1 || rating === 2) return 1.0;
  if (rating === 3) return 0.5;
  if (rating === 4) return 0.25;
  if (rating === 5) return 0.1;
  if (rating === 6) return 0.025;
  return 0.0;
};

/**
 * Approximates the Bridge Condition Deficiency (DC). 0 = Perfect, 100 = Critical.
 */
export const calculateBridgeDeficiencyIndex = (ratings) => {
  let num = 0;
  let den = 0;
  
  for (const [comp, rating] of Object.entries(ratings)) {
    const w = COMPONENT_WEIGHTS[comp.toLowerCase()];
    if (w && rating != null && !isNaN(rating)) {
      const k = getConditionCoefficient(rating);
      num += (w * k);
      den += w;
    }
  }
  
  if (den === 0) return null;
  // Scaled out of 100
  return (num / den) * 100;
};
