// c:\Users\Reyhan\Documents\spk\test-dss.js
const fs = require('fs');
const path = require('path');

// Read the dss-logic file content and evaluate it to load functions
const dssCode = fs.readFileSync(path.join(__dirname, 'dss-logic.js'), 'utf8');
eval(dssCode);

// Mock project dataset: Selection of Best SmartPhone
// 3 Alternatives: Phone A, Phone B, Phone C
// 3 Criteria: Price (Cost, Weight 0.5), Camera (Benefit, Weight 0.3), Battery (Benefit, Weight 0.2)
const testProject = {
    name: "Smartphone Selection Test",
    activeMethod: "saw",
    weightScale: "0-1",
    criteria: [
        { name: "Harga", type: "cost", weight: 0.5 },
        { name: "Kamera", type: "benefit", weight: 0.3 },
        { name: "Baterai", type: "benefit", weight: 0.2 }
    ],
    alternatives: [
        { name: "Phone A" },
        { name: "Phone B" },
        { name: "Phone C" }
    ],
    // Direct ratings grid:
    // Phone A: Price=800, Camera=8, Battery=4
    // Phone B: Price=600, Camera=6, Battery=5
    // Phone C: Price=1000, Camera=9, Battery=3
    directRatings: [
        [800, 8, 4],
        [600, 6, 5],
        [1000, 9, 3]
    ],
    // AHP Pairwise Criteria matrix (3x3)
    criteriaPairwise: [
        [1, 2, 3],
        [0.5, 1, 2],
        [0.333, 0.5, 1]
    ],
    // AHP Pairwise Alternatives matrix (3 criteria x 3x3)
    alternativesPairwise: [
        // Price (Cost)
        [
            [1, 0.75, 1.25],
            [1.333, 1, 1.667],
            [0.8, 0.6, 1]
        ],
        // Camera (Benefit)
        [
            [1, 1.333, 0.889],
            [0.75, 1, 0.667],
            [1.125, 1.5, 1]
        ],
        // Battery (Benefit)
        [
            [1, 0.8, 1.333],
            [1.25, 1, 1.667],
            [0.75, 0.6, 1]
        ]
    ]
};

console.log("=== RUNNING SPK CALCULATIONS VERIFICATION ===");

// 1. SAW Test
const sawRes = calculateSAW(testProject);
console.log("\n1. SAW Results:");
sawRes.ranked.forEach(item => {
    console.log(`- ${item.name}: Score = ${item.score.toFixed(4)}, Rank = ${item.rank}`);
});

// 2. AHP Test
const ahpRes = calculateAHP(testProject);
console.log("\n2. AHP Results:");
console.log(`- Criteria CR: ${ahpRes.criteriaResult.CR.toFixed(4)} (Consistent: ${ahpRes.criteriaResult.isConsistent})`);
ahpRes.ranked.forEach(item => {
    console.log(`- ${item.name}: Score = ${item.score.toFixed(4)}, Rank = ${item.rank}`);
});

// 3. Hybrid SAW-AHP Test
const hybridRes = calculateHybrid(testProject);
console.log("\n3. Hybrid SAW-AHP Results:");
hybridRes.ranked.forEach(item => {
    console.log(`- ${item.name}: Score = ${item.score.toFixed(4)}, Rank = ${item.rank}`);
});

// 4. WP Test
const wpRes = calculateWP(testProject);
console.log("\n4. WP Results:");
wpRes.ranked.forEach(item => {
    console.log(`- ${item.name}: Score = ${item.score.toFixed(4)}, Rank = ${item.rank}`);
});

// 5. MOORA Test
const mooraRes = calculateMOORA(testProject);
console.log("\n5. MOORA Results:");
mooraRes.ranked.forEach(item => {
    console.log(`- ${item.name}: Score = ${item.score.toFixed(4)}, Rank = ${item.rank}`);
});

console.log("\n=== VERIFICATION COMPLETED SUCCESSFULLY ===");
