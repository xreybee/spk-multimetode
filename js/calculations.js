/* c:/Users/Reyhan/Documents/spk/js/calculations.js */
let activeProject = null;
let allCalculations = null;
let currentCalcMethod = 'saw';

auth_onStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.php';
        return;
    }

    activeProject = await db_getActiveProject(user.uid);
    document.getElementById('calc-loading').style.display = 'none';

    if (!activeProject) {
        document.getElementById('calc-empty').style.display = 'block';
        document.getElementById('calc-content').style.display = 'none';
    } else {
        document.getElementById('calc-empty').style.display = 'none';
        document.getElementById('calc-content').style.display = 'block';
        
        document.getElementById('calc-meta-info').textContent = `Kalkulasi Rinci | Proyek: ${activeProject.name}`;
        
        // Read active method from URL param if exists, otherwise default to project method
        const urlParams = new URLSearchParams(window.location.search);
        const methodParam = urlParams.get('method');
        if (methodParam && ['saw', 'ahp', 'hybrid', 'wp', 'moora'].includes(methodParam)) {
            currentCalcMethod = methodParam;
        } else {
            currentCalcMethod = activeProject.activeMethod || 'saw';
        }

        // Sync with cross-method data structure (defined in dashboard)
        prepareCrossMethodData();
        
        // Compute
        allCalculations = runAllDSSCalculations(activeProject);
        
        // Render Selected Method calculations
        switchCalcTab(currentCalcMethod);
    }
});

// Compatibility check (re-use from dashboard logic)
function prepareCrossMethodData() {
    const numCrit = activeProject.criteria.length;
    const numAlt = activeProject.alternatives.length;

    if (activeProject.directRatings && activeProject.directRatings.length > 0) {
        if (!activeProject.alternativesPairwise || activeProject.alternativesPairwise.length === 0) {
            activeProject.alternativesPairwise = Array(numCrit).fill(null).map((_, c) => 
                Array(numAlt).fill(null).map((_, i) => 
                    Array(numAlt).fill(null).map((_, j) => {
                        if (i === j) return 1;
                        const ratingI = Number(activeProject.directRatings[i][c]) || 0.001;
                        const ratingJ = Number(activeProject.directRatings[j][c]) || 0.001;
                        const ratio = ratingI / ratingJ;
                        if (ratio === 1) return 1;
                        if (ratio > 1) return Math.min(9, Math.round(ratio));
                        else return 1 / Math.min(9, Math.round(1 / ratio));
                    })
                )
            );
        }
        if (!activeProject.criteriaPairwise || activeProject.criteriaPairwise.length === 0) {
            const rawWeights = activeProject.criteria.map(c => Number(c.weight) || 1);
            activeProject.criteriaPairwise = Array(numCrit).fill(null).map((_, i) => 
                Array(numCrit).fill(null).map((_, j) => {
                    if (i === j) return 1;
                    const ratio = rawWeights[i] / rawWeights[j];
                    if (ratio === 1) return 1;
                    if (ratio > 1) return Math.min(9, Math.round(ratio));
                    else return 1 / Math.min(9, Math.round(1 / ratio));
                })
            );
        }
    }
    
    if (activeProject.criteriaPairwise && activeProject.criteriaPairwise.length > 0 && 
        (!activeProject.directRatings || activeProject.directRatings.length === 0)) {
        
        const criteriaRes = solveAHPMatrix(activeProject.criteriaPairwise);
        if (criteriaRes) {
            activeProject.criteria.forEach((c, idx) => {
                c.weight = criteriaRes.weights[idx];
            });
        }

        const derivedRatings = Array(numAlt).fill(null).map(() => Array(numCrit).fill(0));
        for (let j = 0; j < numCrit; j++) {
            const altMatrix = activeProject.alternativesPairwise ? activeProject.alternativesPairwise[j] : null;
            if (altMatrix) {
                const altRes = solveAHPMatrix(altMatrix);
                if (altRes) {
                    for (let i = 0; i < numAlt; i++) {
                        derivedRatings[i][j] = altRes.weights[i];
                    }
                }
            }
        }
        activeProject.directRatings = derivedRatings;
    }
}

// Switch Tabs
window.switchCalcTab = function(method) {
    currentCalcMethod = method;
    
    // Highlight active tab
    document.querySelectorAll('#calc-method-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeTabBtn = document.getElementById(`tab-${method}`);
    if (activeTabBtn) activeTabBtn.classList.add('active');

    // Render calculations details based on method
    const wrapper = document.getElementById('calc-steps-wrapper');
    wrapper.innerHTML = '';

    if (method === 'saw') renderSAWSteps(wrapper);
    if (method === 'ahp') renderAHPSteps(wrapper);
    if (method === 'hybrid') renderHybridSteps(wrapper);
    if (method === 'wp') renderWPSteps(wrapper);
    if (method === 'moora') renderMOORASteps(wrapper);
    
    if (window.lucide) lucide.createIcons();
};

// --- MATH RENDERING FUNCTIONS ---

function renderSAWSteps(el) {
    const data = allCalculations.saw;
    const numCrit = activeProject.criteria.length;
    const numAlt = activeProject.alternatives.length;

    // Step 1: Decision Matrix
    let step1Html = `
        <div class="calc-step glass-panel p-2">
            <h3 class="calc-step-title"><span class="step-num">1</span> Matriks Keputusan (X)</h3>
            <p class="calc-step-desc">Matriks berisi nilai performa alternatif pada setiap kriteria:</p>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr><th>Alternatif / Kriteria</th>${activeProject.criteria.map(c => `<th>${c.name}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${activeProject.alternatives.map((alt, i) => `
                            <tr>
                                <td><strong>${alt.name}</strong></td>
                                ${activeProject.directRatings[i].map(val => `<td>${val}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Step 2: Normalization
    let step2Html = `
        <div class="calc-step glass-panel calc-step-panel">
            <h3 class="calc-step-title"><span class="step-num">2</span> Matriks Normalisasi (R)</h3>
            <div class="calc-formula">
                Rumus Normalisasi SAW:<br>
                Benefit: rij = xij / max(xkj) | Cost: rij = min(xkj) / xij
            </div>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr><th>Alternatif / Kriteria</th>${activeProject.criteria.map(c => `<th>${c.name} (${c.type.toUpperCase()})</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${activeProject.alternatives.map((alt, i) => `
                            <tr>
                                <td><strong>${alt.name}</strong></td>
                                ${data.normalizedMatrix[i].map(val => `<td>${val.toFixed(4)}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Step 3: Preference multiplication and Ranking
    let step3Html = `
        <div class="calc-step glass-panel calc-step-panel">
            <h3 class="calc-step-title"><span class="step-num">3</span> Perhitungan Nilai Preferensi (V) & Ranking</h3>
            <div class="calc-formula">
                Rumus Preferensi: Vi = &Sigma; (wj * rij)<br>
                Bobot Ternormalisasi (wj): [${data.weights.map(w => w.toFixed(4)).join(', ')}]
            </div>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Alternatif</th>
                            <th>Proses Kalkulasi (Perkalian Bobot)</th>
                            <th>Skor Akhir (V)</th>
                            <th>Ranking</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.ranked.map((item) => {
                            const details = item.details.map((val, cIdx) => `(${val.toFixed(2)} * ${data.weights[cIdx].toFixed(2)})`).join(' + ');
                            return `
                                <tr>
                                    <td><strong>${item.name}</strong></td>
                                    <td class="calc-process-text">${details}</td>
                                    <td class="calc-score-text">${item.score.toFixed(4)}</td>
                                    <td><span class="ranking-badge ${item.rank === 1 ? 'rank-1' : 'rank-other'} m-0">${item.rank}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    el.innerHTML = step1Html + step2Html + step3Html;
}

function renderAHPSteps(el) {
    const data = allCalculations.ahp;
    const numCrit = activeProject.criteria.length;
    const numAlt = activeProject.alternatives.length;

    // Step 1: Criteria Pairwise Matrix & Priority Weights
    const isConsistentStr = data.criteriaResult.isConsistent ? 
        `<span class="text-success-bold"><i data-lucide="check-circle" class="icon-14-vm"></i> KONSISTEN (CR < 0.1)</span>` : 
        `<span class="text-danger-bold"><i data-lucide="alert-triangle" class="icon-14-vm"></i> TIDAK KONSISTEN (CR >= 0.1)</span>`;
        
    let step1Html = `
        <div class="calc-step glass-panel p-2">
            <h3 class="calc-step-title"><span class="step-num">1</span> Matriks Perbandingan Berpasangan Kriteria & Konsistensi</h3>
            <p class="calc-step-desc">Matriks perbandingan berpasangan (AHP Saaty Matrix) kriteria:</p>
            <div class="table-responsive">
                <table class="table-custom text-center">
                    <thead>
                        <tr><th>Kriteria</th>${activeProject.criteria.map(c => `<th>${c.name}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${activeProject.criteria.map((cRow, i) => `
                            <tr>
                                <td><strong>${cRow.name}</strong></td>
                                ${activeProject.criteriaPairwise[i].map(val => `<td>${val >= 1 ? Math.round(val) : `1/${Math.round(1/val)}`}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <h5 class="calc-section-title">Bobot Prioritas Kriteria (Eigenvector) & Hasil Uji Konsistensi</h5>
            <div class="table-responsive mb-1">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Kriteria</th>
                            <th>Bobot Prioritas (w)</th>
                            <th>Eigen Value / w</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activeProject.criteria.map((c, i) => `
                            <tr>
                                <td><strong>${c.name}</strong></td>
                                <td class="calc-priority-text">${(data.criteriaWeights[i]*100).toFixed(2)}% (${data.criteriaWeights[i].toFixed(4)})</td>
                                <td>${((data.criteriaResult.lambdaMax)).toFixed(4)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="glass-panel grid-4col calc-grid-panel">
                <div>
                    <span class="calc-grid-label">Principal Eigenvalue (&lambda; max):</span>
                    <strong>${data.criteriaResult.lambdaMax.toFixed(4)}</strong>
                </div>
                <div>
                    <span class="calc-grid-label">Consistency Index (CI):</span>
                    <strong>${data.criteriaResult.CI.toFixed(4)}</strong>
                </div>
                <div>
                    <span class="calc-grid-label">Consistency Ratio (CR):</span>
                    <strong>${data.criteriaResult.CR.toFixed(4)}</strong>
                </div>
                <div>
                    <span class="calc-grid-label">Status Konsistensi:</span>
                    ${isConsistentStr}
                </div>
            </div>
        </div>
    `;

    // Step 2: Alternative Pairwise Matrices (Tabs / Cards list)
    let step2Html = `
        <div class="calc-step glass-panel calc-step-panel">
            <h3 class="calc-step-title"><span class="step-num">2</span> Prioritas Alternatif untuk Setiap Kriteria</h3>
            <p class="calc-step-desc">Menghitung bobot prioritas lokal alternatif di bawah masing-masing kriteria:</p>
            <div class="flex-col-gap-1-5">
                ${activeProject.criteria.map((c, cIdx) => {
                    const res = data.altMatricesResults[cIdx];
                    const cIsConsistent = res.isConsistent ? 
                        `<span style="color:var(--success); font-size:0.8rem;">Konsisten (CR = ${res.CR.toFixed(3)})</span>` : 
                        `<span style="color:var(--danger); font-size:0.8rem;">Tidak Konsisten (CR = ${res.CR.toFixed(3)})</span>`;
                    return `
                        <div class="glass-panel calc-ahp-card">
                            <div class="calc-ahp-card-header">
                                <h5 class="calc-ahp-card-title">Kriteria: ${c.name}</h5>
                                ${cIsConsistent}
                            </div>
                            <div class="grid-calc-ahp">
                                <div class="table-responsive">
                                    <table class="table-custom text-sm">
                                        <thead>
                                            <tr><th>Alternatif</th>${activeProject.alternatives.map(a => `<th>${a.name}</th>`).join('')}</tr>
                                        </thead>
                                        <tbody>
                                            ${activeProject.alternatives.map((altR, i) => `
                                                <tr>
                                                    <td><strong>${altR.name}</strong></td>
                                                    ${activeProject.alternativesPairwise[cIdx][i].map(val => `<td>${val >= 1 ? Math.round(val) : `1/${Math.round(1/val)}`}</td>`).join('')}
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                <div class="table-responsive">
                                    <table class="table-custom text-sm">
                                        <thead>
                                            <tr><th>Alternatif</th><th>Bobot Prioritas (v)</th></tr>
                                        </thead>
                                        <tbody>
                                            ${activeProject.alternatives.map((altR, i) => `
                                                <tr>
                                                    <td><strong>${altR.name}</strong></td>
                                                    <td class="calc-priority-text">${res.weights[i].toFixed(4)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    // Step 3: Synthesis & Ranking
    let step3Html = `
        <div class="calc-step glass-panel calc-step-panel">
            <h3 class="calc-step-title"><span class="step-num">3</span> Matriks Sintesis & Hasil Akhir AHP</h3>
            <p class="calc-step-desc">Mengalikan bobot lokal alternatif dengan bobot prioritas kriteria:</p>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Alternatif</th>
                            ${activeProject.criteria.map((c, cIdx) => `<th>${c.name} (w = ${data.criteriaWeights[cIdx].toFixed(3)})</th>`).join('')}
                            <th>Skor Akhir AHP (V)</th>
                            <th>Ranking</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.ranked.map((item) => {
                            const idx = item.index;
                            return `
                                <tr>
                                    <td><strong>${item.name}</strong></td>
                                    ${activeProject.criteria.map((_, cIdx) => `<td>${data.altWeightsPerCrit[cIdx][idx].toFixed(4)}</td>`).join('')}
                                    <td class="calc-score-text">${item.score.toFixed(4)}</td>
                                    <td><span class="ranking-badge ${item.rank === 1 ? 'rank-1' : 'rank-other'} m-0">${item.rank}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    el.innerHTML = step1Html + step2Html + step3Html;
}

function renderHybridSteps(el) {
    const data = allCalculations.hybrid;
    const numCrit = activeProject.criteria.length;
    const numAlt = activeProject.alternatives.length;

    // Step 1: AHP weights
    let step1Html = `
        <div class="calc-step glass-panel p-2">
            <h3 class="calc-step-title"><span class="step-num">1</span> Bobot Kriteria AHP (Prioritas Global)</h3>
            <p class="calc-step-desc">Bobot kriteria dicari melalui matriks perbandingan berpasangan AHP:</p>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama Kriteria</th>
                            <th>Tipe</th>
                            <th>Bobot Prioritas Terhitung (w)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activeProject.criteria.map((c, i) => `
                            <tr>
                                <td>${i+1}</td>
                                <td><strong>${c.name}</strong></td>
                                <td>${c.type.toUpperCase()}</td>
                                <td class="calc-priority-text">${(data.criteriaWeights[i]*100).toFixed(2)}% (${data.criteriaWeights[i].toFixed(4)})</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <p class="calc-ahp-cr-text">Consistency Ratio (CR) Kriteria: <strong>${data.ahpResult.CR.toFixed(4)}</strong> (CR < 0.1: Konsisten)</p>
        </div>
    `;

    // Step 2: SAW Normalization
    let step2Html = `
        <div class="calc-step glass-panel calc-step-panel">
            <h3 class="calc-step-title"><span class="step-num">2</span> Normalisasi Alternatif (SAW R Matrix)</h3>
            <p class="calc-step-desc">Melakukan normalisasi nilai rating alternatif sesuai dengan tipe kriteria (Benefit / Cost):</p>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr><th>Alternatif / Kriteria</th>${activeProject.criteria.map(c => `<th>${c.name} (${c.type.toUpperCase()})</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${activeProject.alternatives.map((alt, i) => `
                            <tr>
                                <td><strong>${alt.name}</strong></td>
                                ${data.normalizedMatrix[i].map(val => `<td>${val.toFixed(4)}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Step 3: Synthesis & Ranking
    let step3Html = `
        <div class="calc-step glass-panel calc-step-panel">
            <h3 class="calc-step-title"><span class="step-num">3</span> Sintesis Hybrid (R x w AHP) & Ranking</h3>
            <div class="calc-formula">
                Mengalikan matriks normalisasi SAW dengan bobot prioritas kriteria yang didapatkan dari AHP.
            </div>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Alternatif</th>
                            <th>Kalkulasi Preferensi (SAW R * AHP w)</th>
                            <th>Skor Akhir</th>
                            <th>Ranking</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.ranked.map((item) => {
                            const idx = item.index;
                            const processText = data.normalizedMatrix[idx].map((rVal, cIdx) => `(${rVal.toFixed(2)} * ${data.criteriaWeights[cIdx].toFixed(2)})`).join(' + ');
                            return `
                                <tr>
                                    <td><strong>${item.name}</strong></td>
                                    <td class="calc-process-text">${processText}</td>
                                    <td class="calc-score-text">${item.score.toFixed(4)}</td>
                                    <td><span class="ranking-badge ${item.rank === 1 ? 'rank-1' : 'rank-other'} m-0">${item.rank}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    el.innerHTML = step1Html + step2Html + step3Html;
}

function renderWPSteps(el) {
    const data = allCalculations.wp;
    const numCrit = activeProject.criteria.length;
    const numAlt = activeProject.alternatives.length;

    // Step 1: Weight Normalization and adjustment
    let step1Html = `
        <div class="calc-step glass-panel p-2">
            <h3 class="calc-step-title"><span class="step-num">1</span> Normalisasi & Penyesuaian Bobot Kriteria (w)</h3>
            <p class="calc-step-desc">Bobot dinormalisasi sehingga total bernilai 1. Kriteria COST disesuaikan menjadi bernilai negatif:</p>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Kriteria</th>
                            <th>Bobot Awal</th>
                            <th>Tipe</th>
                            <th>Bobot Ternormalisasi (w')</th>
                            <th>Bobot Penyesuaian (w*)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activeProject.criteria.map((c, i) => `
                            <tr>
                                <td><strong>${c.name}</strong></td>
                                <td>${c.weight}</td>
                                <td>${c.type.toUpperCase()}</td>
                                <td>${data.weights[i].toFixed(4)}</td>
                                <td class="calc-priority-text">${data.adjustedWeights[i].toFixed(4)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Step 2: Vector S and V Calculation
    let step2Html = `
        <div class="calc-step glass-panel calc-step-panel">
            <h3 class="calc-step-title"><span class="step-num">2</span> Perhitungan Nilai Vektor S & Vektor V</h3>
            <div class="calc-formula">
                Rumus Vektor S: Si = &Pi; (xij)^wj* (Perkalian nilai alternatif berpangkat bobot penyesuaian)<br>
                Rumus Vektor V: Vi = Si / &Sigma; Sk (Proporsi nilai alternatif terhadap total Vektor S)
            </div>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Alternatif</th>
                            <th>Proses Perhitungan Vektor S (x^w)</th>
                            <th>Vektor S (S)</th>
                            <th>Vektor V (Skor Akhir)</th>
                            <th>Ranking</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.ranked.map((item) => {
                            const idx = item.index;
                            const processText = activeProject.directRatings[idx].map((rVal, cIdx) => {
                                return `(${rVal}^${data.adjustedWeights[cIdx].toFixed(2)})`;
                            }).join(' * ');
                            return `
                                <tr>
                                    <td><strong>${item.name}</strong></td>
                                    <td class="calc-process-text">${processText}</td>
                                    <td>${item.vectorS.toFixed(6)}</td>
                                    <td class="calc-score-text">${item.score.toFixed(4)}</td>
                                    <td><span class="ranking-badge ${item.rank === 1 ? 'rank-1' : 'rank-other'} m-0">${item.rank}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    el.innerHTML = step1Html + step2Html;
}

function renderMOORASteps(el) {
    const data = allCalculations.moora;
    const numCrit = activeProject.criteria.length;
    const numAlt = activeProject.alternatives.length;

    // Step 1: Decision Matrix
    let step1Html = `
        <div class="calc-step glass-panel p-2">
            <h3 class="calc-step-title"><span class="step-num">1</span> Matriks Keputusan (X)</h3>
            <p class="calc-step-desc">Matriks performa awal sebelum normalisasi:</p>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr><th>Alternatif</th>${activeProject.criteria.map(c => `<th>${c.name}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${activeProject.alternatives.map((alt, i) => `
                            <tr>
                                <td><strong>${alt.name}</strong></td>
                                ${activeProject.directRatings[i].map(val => `<td>${val}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Step 2: MOORA Ratio Normalization Matrix
    let step2Html = `
        <div class="calc-step glass-panel calc-step-panel">
            <h3 class="calc-step-title"><span class="step-num">2</span> Matriks Normalisasi (Ratio System)</h3>
            <div class="calc-formula">
                Rumus Normalisasi MOORA:<br>
                rij = xij / &radic;[ &Sigma;_k xkj^2 ] (Membagi nilai dengan akar jumlah kuadrat kriteria)
            </div>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr><th>Alternatif</th>${activeProject.criteria.map(c => `<th>${c.name}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${activeProject.alternatives.map((alt, i) => `
                            <tr>
                                <td><strong>${alt.name}</strong></td>
                                ${data.normalizedMatrix[i].map(val => `<td>${val.toFixed(4)}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Step 3: Weighted Normalization & Final Optimisation (Yi)
    let step3Html = `
        <div class="calc-step glass-panel calc-step-panel">
            <h3 class="calc-step-title"><span class="step-num">3</span> Nilai Optimasi MOORA (Yi) & Ranking</h3>
            <div class="calc-formula">
                Rumus Optimasi: Yi = &Sigma;_benefit (wj * rij) - &Sigma;_cost (wj * rij)<br>
                Bobot Ternormalisasi (wj): [${data.weights.map(w => w.toFixed(4)).join(', ')}]
            </div>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Alternatif</th>
                            <th>Total Benefit (&Sigma; w*r)</th>
                            <th>Total Cost (&Sigma; w*r)</th>
                            <th>Nilai Akhir (Yi)</th>
                            <th>Ranking</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.ranked.map((item) => {
                            const idx = item.index;
                            
                            // Calc details manually for display
                            let sumBenefit = 0;
                            let sumCost = 0;
                            activeProject.criteria.forEach((c, cIdx) => {
                                const val = data.normalizedMatrix[idx][cIdx] * data.weights[cIdx];
                                if (c.type === 'benefit') sumBenefit += val;
                                else sumCost += val;
                            });

                            return `
                                <tr>
                                    <td><strong>${item.name}</strong></td>
                                    <td>${sumBenefit.toFixed(4)}</td>
                                    <td>${sumCost.toFixed(4)}</td>
                                    <td class="calc-score-text">${item.score.toFixed(4)}</td>
                                    <td><span class="ranking-badge ${item.rank === 1 ? 'rank-1' : 'rank-other'} m-0">${item.rank}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    el.innerHTML = step1Html + step2Html + step3Html;
}
