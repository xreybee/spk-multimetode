/* C:\Users\Reyhan\Documents\spk\dss-logic.js */

// Saaty's Random Consistency Index (RI) table
const RI_TABLE = {
    1: 0.00,
    2: 0.00,
    3: 0.58,
    4: 0.90,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49
};

/**
 * Standardize weight sum to 1.
 * Useful for SAW, WP, MOORA
 */
function normalizeWeights(weights) {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum === 0) return weights.map(() => 0);
    return weights.map(w => w / sum);
}

/**
 * 1. Simple Additive Weighting (SAW)
 */
function calculateSAW(project) {
    const { criteria, alternatives, directRatings } = project;
    const numAlt = alternatives.length;
    const numCrit = criteria.length;
    
    if (numAlt === 0 || numCrit === 0 || directRatings.length === 0) return null;
    
    // 1. Get raw weights
    const rawWeights = criteria.map(c => Number(c.weight) || 0);
    const weightsNorm = normalizeWeights(rawWeights);
    
    // 2. Normalization Matrix
    const normalizedMatrix = Array(numAlt).fill(null).map(() => Array(numCrit).fill(0));
    
    for (let j = 0; j < numCrit; j++) {
        const isBenefit = criteria[j].type === 'benefit';
        const colValues = directRatings.map(row => Number(row[j]) || 0);
        
        const maxVal = Math.max(...colValues);
        const minVal = Math.min(...colValues);
        
        for (let i = 0; i < numAlt; i++) {
            const val = Number(directRatings[i][j]) || 0;
            if (isBenefit) {
                normalizedMatrix[i][j] = maxVal !== 0 ? val / maxVal : 0;
            } else {
                normalizedMatrix[i][j] = val !== 0 ? minVal / val : 0;
            }
        }
    }
    
    // 3. Score Calculation
    const scores = [];
    for (let i = 0; i < numAlt; i++) {
        let score = 0;
        for (let j = 0; j < numCrit; j++) {
            score += normalizedMatrix[i][j] * weightsNorm[j];
        }
        scores.push({
            index: i,
            name: alternatives[i].name,
            score: score,
            details: normalizedMatrix[i]
        });
    }
    
    // 4. Rank
    const ranked = [...scores].sort((a, b) => b.score - a.score);
    ranked.forEach((item, rankIdx) => {
        item.rank = rankIdx + 1;
    });
    
    return {
        method: "SAW",
        weights: weightsNorm,
        normalizedMatrix,
        scores,
        ranked
    };
}

/**
 * 2. Analytical Hierarchy Process (AHP)
 */
function calculateAHP(project) {
    const { criteria, alternatives, criteriaPairwise, alternativesPairwise } = project;
    const numAlt = alternatives.length;
    const numCrit = criteria.length;
    
    if (numAlt === 0 || numCrit === 0 || !criteriaPairwise || criteriaPairwise.length === 0) return null;
    
    // 1. Calculate Criteria Weights
    const criteriaResult = solveAHPMatrix(criteriaPairwise);
    if (!criteriaResult) return null;
    const criteriaWeights = criteriaResult.weights;
    
    // 2. Calculate Alternatives Priority Vectors under each criterion
    const altWeightsPerCrit = []; // Size: numCrit x numAlt
    const altMatricesResults = [];
    
    for (let j = 0; j < numCrit; j++) {
        const matrix = alternativesPairwise ? alternativesPairwise[j] : null;
        if (!matrix || matrix.length === 0) return null;
        const res = solveAHPMatrix(matrix);
        if (!res) return null;
        altWeightsPerCrit.push(res.weights);
        altMatricesResults.push(res);
    }
    
    // 3. Synthesis
    const scores = [];
    for (let i = 0; i < numAlt; i++) {
        let score = 0;
        for (let j = 0; j < numCrit; j++) {
            score += altWeightsPerCrit[j][i] * criteriaWeights[j];
        }
        scores.push({
            index: i,
            name: alternatives[i].name,
            score: score
        });
    }
    
    // 4. Rank
    const ranked = [...scores].sort((a, b) => b.score - a.score);
    ranked.forEach((item, rankIdx) => {
        item.rank = rankIdx + 1;
    });
    
    return {
        method: "AHP",
        criteriaWeights,
        criteriaResult,
        altWeightsPerCrit,
        altMatricesResults,
        scores,
        ranked
    };
}

/**
 * Core matrix solver for AHP
 */
function solveAHPMatrix(matrix) {
    const size = matrix.length;
    if (size === 0) return null;
    
    // 1. Sum columns
    const colSums = Array(size).fill(0);
    for (let j = 0; j < size; j++) {
        for (let i = 0; i < size; i++) {
            colSums[j] += Number(matrix[i][j]) || 1;
        }
    }
    
    // 2. Normalization & compute weights (Priority Vector)
    const normalizedMatrix = Array(size).fill(null).map(() => Array(size).fill(0));
    const weights = Array(size).fill(0);
    
    for (let i = 0; i < size; i++) {
        let rowSum = 0;
        for (let j = 0; j < size; j++) {
            const cellVal = Number(matrix[i][j]) || 1;
            normalizedMatrix[i][j] = colSums[j] !== 0 ? cellVal / colSums[j] : 0;
            rowSum += normalizedMatrix[i][j];
        }
        weights[i] = rowSum / size;
    }
    
    // 3. Calculate Consistency Index (CI) and Consistency Ratio (CR)
    // Multiply matrix * weights to get A * w
    const Aw = Array(size).fill(0);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            Aw[i] += (Number(matrix[i][j]) || 1) * weights[j];
        }
    }
    
    // Compute lambda max
    let lambdaMax = 0;
    let validLambdas = 0;
    for (let i = 0; i < size; i++) {
        if (weights[i] !== 0) {
            lambdaMax += Aw[i] / weights[i];
            validLambdas++;
        }
    }
    lambdaMax = validLambdas !== 0 ? lambdaMax / validLambdas : size;
    
    const CI = size > 1 ? (lambdaMax - size) / (size - 1) : 0;
    const RI = RI_TABLE[size] || 1.49;
    const CR = RI !== 0 ? CI / RI : 0;
    
    return {
        weights,
        normalizedMatrix,
        lambdaMax,
        CI,
        CR,
        isConsistent: CR < 0.1
    };
}

/**
 * 3. Hybrid SAW-AHP
 * Evaluates weights using AHP (pairwise comparison), and ranks alternatives using SAW (ratings).
 */
function calculateHybrid(project) {
    const { criteria, alternatives, directRatings, criteriaPairwise } = project;
    const numAlt = alternatives.length;
    const numCrit = criteria.length;
    
    if (numAlt === 0 || numCrit === 0 || directRatings.length === 0 || !criteriaPairwise || criteriaPairwise.length === 0) return null;
    
    // 1. Calculate weights using AHP
    const ahpResult = solveAHPMatrix(criteriaPairwise);
    if (!ahpResult) return null;
    const criteriaWeights = ahpResult.weights;
    
    // 2. Perform SAW normalization on direct ratings
    const normalizedMatrix = Array(numAlt).fill(null).map(() => Array(numCrit).fill(0));
    
    for (let j = 0; j < numCrit; j++) {
        const isBenefit = criteria[j].type === 'benefit';
        const colValues = directRatings.map(row => Number(row[j]) || 0);
        
        const maxVal = Math.max(...colValues);
        const minVal = Math.min(...colValues);
        
        for (let i = 0; i < numAlt; i++) {
            const val = Number(directRatings[i][j]) || 0;
            if (isBenefit) {
                normalizedMatrix[i][j] = maxVal !== 0 ? val / maxVal : 0;
            } else {
                normalizedMatrix[i][j] = val !== 0 ? minVal / val : 0;
            }
        }
    }
    
    // 3. Weighted SAW multiplication
    const scores = [];
    for (let i = 0; i < numAlt; i++) {
        let score = 0;
        for (let j = 0; j < numCrit; j++) {
            score += normalizedMatrix[i][j] * criteriaWeights[j];
        }
        scores.push({
            index: i,
            name: alternatives[i].name,
            score: score
        });
    }
    
    // 4. Rank
    const ranked = [...scores].sort((a, b) => b.score - a.score);
    ranked.forEach((item, rankIdx) => {
        item.rank = rankIdx + 1;
    });
    
    return {
        method: "Hybrid SAW-AHP",
        criteriaWeights,
        ahpResult,
        normalizedMatrix,
        scores,
        ranked
    };
}

/**
 * 4. Weighted Product (WP)
 */
function calculateWP(project) {
    const { criteria, alternatives, directRatings } = project;
    const numAlt = alternatives.length;
    const numCrit = criteria.length;
    
    if (numAlt === 0 || numCrit === 0 || directRatings.length === 0) return null;
    
    // 1. Normalize weights
    const rawWeights = criteria.map(c => Number(c.weight) || 0);
    const weightsNorm = normalizeWeights(rawWeights);
    
    // 2. Adjust weights for benefit vs cost (negative for cost)
    const adjustedWeights = weightsNorm.map((w, j) => {
        return criteria[j].type === 'benefit' ? w : -w;
    });
    
    // 3. Calculate Vector S
    const S = [];
    for (let i = 0; i < numAlt; i++) {
        let sProduct = 1;
        for (let j = 0; j < numCrit; j++) {
            const val = Number(directRatings[i][j]) || 1; // standard WP requires values > 0
            sProduct *= Math.pow(val, adjustedWeights[j]);
        }
        S.push(sProduct);
    }
    
    // 4. Calculate Vector V (relative preference)
    const sumS = S.reduce((a, b) => a + b, 0);
    const scores = [];
    for (let i = 0; i < numAlt; i++) {
        const score = sumS !== 0 ? S[i] / sumS : 0;
        scores.push({
            index: i,
            name: alternatives[i].name,
            score: score,
            vectorS: S[i]
        });
    }
    
    // 5. Rank
    const ranked = [...scores].sort((a, b) => b.score - a.score);
    ranked.forEach((item, rankIdx) => {
        item.rank = rankIdx + 1;
    });
    
    return {
        method: "WP",
        weights: weightsNorm,
        adjustedWeights,
        S,
        scores,
        ranked
    };
}

/**
 * 5. Multi-Objective Optimization on the basis of Ratio Analysis (MOORA)
 */
function calculateMOORA(project) {
    const { criteria, alternatives, directRatings } = project;
    const numAlt = alternatives.length;
    const numCrit = criteria.length;
    
    if (numAlt === 0 || numCrit === 0 || directRatings.length === 0) return null;
    
    // 1. Get weights
    const rawWeights = criteria.map(c => Number(c.weight) || 0);
    const weightsNorm = normalizeWeights(rawWeights);
    
    // 2. Vector optimization (Square Root of Sum of Squares normalization)
    const normalizedMatrix = Array(numAlt).fill(null).map(() => Array(numCrit).fill(0));
    
    for (let j = 0; j < numCrit; j++) {
        let sumSq = 0;
        for (let i = 0; i < numAlt; i++) {
            sumSq += Math.pow(Number(directRatings[i][j]) || 0, 2);
        }
        const denom = Math.sqrt(sumSq);
        
        for (let i = 0; i < numAlt; i++) {
            const val = Number(directRatings[i][j]) || 0;
            normalizedMatrix[i][j] = denom !== 0 ? val / denom : 0;
        }
    }
    
    // 3. Weighted normalized matrix & score calculation (Yi = sum of benefit - sum of cost)
    const scores = [];
    for (let i = 0; i < numAlt; i++) {
        let sumBenefit = 0;
        let sumCost = 0;
        
        for (let j = 0; j < numCrit; j++) {
            const weightedVal = normalizedMatrix[i][j] * weightsNorm[j];
            if (criteria[j].type === 'benefit') {
                sumBenefit += weightedVal;
            } else {
                sumCost += weightedVal;
            }
        }
        
        const score = sumBenefit - sumCost;
        scores.push({
            index: i,
            name: alternatives[i].name,
            score: score,
            details: normalizedMatrix[i]
        });
    }
    
    // 4. Rank
    const ranked = [...scores].sort((a, b) => b.score - a.score);
    ranked.forEach((item, rankIdx) => {
        item.rank = rankIdx + 1;
    });
    
    return {
        method: "MOORA",
        weights: weightsNorm,
        normalizedMatrix,
        scores,
        ranked
    };
}

/**
 * Universal runner to execute all calculations
 */
function runAllDSSCalculations(project) {
    if (!project) return null;
    
    const results = {};
    results.saw = calculateSAW(project);
    results.ahp = calculateAHP(project);
    results.hybrid = calculateHybrid(project);
    results.wp = calculateWP(project);
    results.moora = calculateMOORA(project);
    
    return results;
}
