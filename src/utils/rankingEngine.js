/**
 * National Roads BMS Ranking & Deficiency Engine
 * Based on the Department of National Roads, Ministry of Works and Transport Bridge Management System User Manual (January 2017)
 */

// Table 3: System Parameters / Overall Rating Variables for Bridges
// Weights x_ij for component i, condition j (0-9)
const OVERALL_RATING_WEIGHTS = {
  approaches: [6, 6, 6, 2, 2, 0.25, 0.25, 0.25, 0.25, 0.25],
  waterway: [8, 8, 8, 2, 2, 1, 1, 1, 1, 1],
  substructure: [8, 8, 8, 4, 4, 2, 2, 2, 2, 2],
  superstructure: [8, 8, 8, 4, 4, 2, 2, 2, 2, 2],
  roadway: [6, 6, 6, 2, 2, 0.5, 0.5, 0.5, 0.5, 0.5]
};

/**
 * Calculates the Overall Condition Rating for a bridge (0 to 9).
 * Ratings are 0 (Beyond Repair) to 9 (Excellent).
 * @param {Object} ratings - { approaches, waterway, substructure, superstructure, roadway }
 * @returns {number|null} Overall rating (rounded to integer) or null if insufficient data.
 */
export function calculateOverallRating(ratings) {
  let numerator = 0;
  let denominator = 0;
  
  const components = ['approaches', 'substructure', 'superstructure', 'roadway'];
  // Waterway is optional depending on crossing type, but we include it if provided.
  if (ratings.waterway !== undefined && ratings.waterway !== null) {
    components.push('waterway');
  }

  let hasData = false;

  for (const comp of components) {
    const y_i = ratings[comp];
    if (y_i !== undefined && y_i !== null && y_i >= 0 && y_i <= 9) {
      hasData = true;
      const x_ij = OVERALL_RATING_WEIGHTS[comp][Math.round(y_i)];
      numerator += x_ij * y_i;
      denominator += x_ij;
    }
  }

  if (!hasData || denominator === 0) return null;

  const rawRating = numerator / denominator;
  return Math.round(rawRating);
}

/**
 * Maps an overall rating (0-9) to a string category.
 */
export function getConditionCategory(rating) {
  if (rating == null) return 'Unknown';
  if (rating <= 1) return 'Critical';
  if (rating <= 3) return 'Poor';
  if (rating <= 5) return 'Marginal';
  if (rating === 6) return 'Satisfactory';
  return 'Good'; // 7 to 9
}

// -------------------------------------------------------------
// Deficiency Index Calculations
// -------------------------------------------------------------

// Constants (Table 8)
const K = {
  ADTB: 5400,
  K1: 0.4,
  K2: 1.5,
  K3: 1.5,
  K4: 0.2
};

// Weighting factors for bridge condition deficiency (Table 9)
const CONDITION_WEIGHTS = {
  superstructure: 1.00,
  substructure: 1.00,
  roadway: 0.50,
  approach: 0.25,
  waterway: 0.83
};

// Bridge Component Condition Rating Coefficient (Ki) (Table 10)
const K_I_COEFFICIENTS = {
  superstructure: [1.0, 1.0, 1.0, 0.5, 0.25, 0.1, 0.025, 0, 0, 0],
  substructure:   [1.0, 1.0, 1.0, 0.5, 0.25, 0.1, 0.025, 0, 0, 0],
  roadway:        [1.0, 1.0, 1.0, 0.625, 0.425, 0.25, 0.125, 0, 0, 0],
  approach:       [1.0, 1.0, 1.0, 0.7, 0.45, 0.25, 0.1, 0, 0, 0],
  waterway:       [1.0, 1.0, 1.0, 0.425, 0.2, 0.1, 0.03, 0, 0, 0]
};

/**
 * Calculates Bridge Condition Deficiency (DC)
 * DC = WC * (ADTO / ADTB)^K4 * F_SI * Sum(ki * wi)
 * Assuming WC = 100 for a purely condition-based index, F_SI = 1.0 for simplicity if not provided.
 */
export function calculateConditionDeficiency(ratings, adto = 1000) {
  let sumKiWi = 0;
  
  if (ratings.superstructure != null) sumKiWi += K_I_COEFFICIENTS.superstructure[ratings.superstructure] * CONDITION_WEIGHTS.superstructure;
  if (ratings.substructure != null) sumKiWi += K_I_COEFFICIENTS.substructure[ratings.substructure] * CONDITION_WEIGHTS.substructure;
  if (ratings.roadway != null) sumKiWi += K_I_COEFFICIENTS.roadway[ratings.roadway] * CONDITION_WEIGHTS.roadway;
  if (ratings.approaches != null) sumKiWi += K_I_COEFFICIENTS.approach[ratings.approaches] * CONDITION_WEIGHTS.approach;
  if (ratings.waterway != null) sumKiWi += K_I_COEFFICIENTS.waterway[ratings.waterway] * CONDITION_WEIGHTS.waterway;

  const trafficFactor = Math.pow((adto / K.ADTB), K.K4);
  
  const DC = 100 * trafficFactor * sumKiWi; // Assuming WC = 100
  return Math.min(100, Math.max(0, DC)); // Clamp between 0 and 100
}
