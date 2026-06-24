/* c:/Users/Reyhan/Documents/spk/js/input.js */
let currentStep = 1;
let userId = null;

// Form States
let criteria = [];
let alternatives = [];
let directRatings = []; // A x C
let criteriaPairwise = []; // C x C
let alternativesPairwise = []; // C x A x A (only for AHP)
let activeAHPTabCrit = 0; // Current criteria index being edited in AHP alternative pairwise comparisons

// Check Authentication state
auth_onStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.php';
        return;
    }
    userId = user.uid;
});

// Enforce matching scale rules dynamically based on method
const projMethodSelect = document.getElementById('proj-method');
if (projMethodSelect) {
    projMethodSelect.addEventListener('change', function() {
        const method = this.value;
        const scaleSelect = document.getElementById('weight-scale');
        
        if (method === 'ahp' || method === 'hybrid') {
            scaleSelect.value = 'pairwise';
            scaleSelect.disabled = false;
        } else {
            if (scaleSelect.value === 'pairwise') {
                scaleSelect.value = '0-1';
            }
        }
    });
}

// Next/Prev Buttons event handling
const btnNext = document.getElementById('btn-next');
if (btnNext) {
    btnNext.addEventListener('click', () => {
        if (currentStep < 5) {
            if (validateStep(currentStep)) {
                saveStepData(currentStep);
                currentStep++;
                renderStep(currentStep);
            }
        } else {
            saveAllData();
        }
    });
}

const btnPrev = document.getElementById('btn-prev');
if (btnPrev) {
    btnPrev.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            renderStep(currentStep);
        }
    });
}

// Step verification & rendering
function validateStep(step) {
    if (step === 1) {
        const name = document.getElementById('proj-name').value.trim();
        const numCrit = parseInt(document.getElementById('num-criteria').value);
        const numAlt = parseInt(document.getElementById('num-alternatives').value);
        
        if (name === '') {
            showToast("Nama proyek evaluasi wajib diisi!", "error");
            return false;
        }
        if (isNaN(numCrit) || numCrit < 2 || numCrit > 10) {
            showToast("Jumlah kriteria tidak valid (2 - 10)!", "error");
            return false;
        }
        if (isNaN(numAlt) || numAlt < 2 || numAlt > 15) {
            showToast("Jumlah alternatif tidak valid (2 - 15)!", "error");
            return false;
        }
        return true;
    }
    
    if (step === 2) {
        // Verify all names are filled
        const numCrit = parseInt(document.getElementById('num-criteria').value);
        const numAlt = parseInt(document.getElementById('num-alternatives').value);
        
        for (let i = 0; i < numCrit; i++) {
            const critName = document.getElementById(`crit-name-${i}`).value.trim();
            if (critName === '') {
                showToast(`Nama Kriteria ${i+1} tidak boleh kosong!`, "error");
                return false;
            }
        }
        for (let i = 0; i < numAlt; i++) {
            const altName = document.getElementById(`alt-name-${i}`).value.trim();
            if (altName === '') {
                showToast(`Nama Alternatif ${i+1} tidak boleh kosong!`, "error");
                return false;
            }
        }
        return true;
    }
    
    if (step === 3) {
        const scale = document.getElementById('weight-scale').value;
        const numCrit = criteria.length;
        
        if (scale !== 'pairwise') {
            for (let i = 0; i < numCrit; i++) {
                const weightVal = parseFloat(document.getElementById(`crit-weight-${i}`).value);
                if (isNaN(weightVal) || weightVal <= 0) {
                    showToast(`Bobot kriteria ${criteria[i].name} harus berupa angka positif!`, "error");
                    return false;
                }
                if (scale === '0-1' && weightVal > 1) {
                    showToast(`Bobot kriteria ${criteria[i].name} tidak boleh melebihi 1 pada skala 0-1!`, "error");
                    return false;
                }
                if (scale === '10-100' && (weightVal < 10 || weightVal > 100)) {
                    showToast(`Bobot kriteria ${criteria[i].name} harus di antara 10 - 100!`, "error");
                    return false;
                }
            }
        }
        return true;
    }
    
    if (step === 4) {
        const method = document.getElementById('proj-method').value;
        const numCrit = criteria.length;
        const numAlt = alternatives.length;
        
        if (method !== 'ahp') {
            for (let i = 0; i < numAlt; i++) {
                for (let j = 0; j < numCrit; j++) {
                    const val = parseFloat(document.getElementById(`rating-${i}-${j}`).value);
                    if (isNaN(val) || val < 0) {
                        showToast(`Nilai alternatif ${alternatives[i].name} untuk kriteria ${criteria[j].name} harus berupa angka positif!`, "error");
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    return true;
}

function saveStepData(step) {
    const numCrit = parseInt(document.getElementById('num-criteria').value);
    const numAlt = parseInt(document.getElementById('num-alternatives').value);
    const scale = document.getElementById('weight-scale').value;
    const method = document.getElementById('proj-method').value;

    if (step === 1) {
        // Resize criteria array safely (keeping existing items)
        const newCriteria = [];
        for (let i = 0; i < numCrit; i++) {
            newCriteria.push(criteria[i] || { name: `Kriteria ${i+1}`, type: 'benefit', weight: 0 });
        }
        criteria = newCriteria;

        // Resize alternatives array safely
        const newAlternatives = [];
        for (let i = 0; i < numAlt; i++) {
            newAlternatives.push(alternatives[i] || { name: `Alternatif ${i+1}` });
        }
        alternatives = newAlternatives;

        // Resize criteriaPairwise matrix (C x C)
        const newCriteriaPairwise = [];
        for (let i = 0; i < numCrit; i++) {
            const row = [];
            for (let j = 0; j < numCrit; j++) {
                if (i === j) {
                    row.push(1);
                } else {
                    row.push((criteriaPairwise[i] && criteriaPairwise[i][j]) || 1);
                }
            }
            newCriteriaPairwise.push(row);
        }
        criteriaPairwise = newCriteriaPairwise;

        // Resize directRatings matrix (A x C)
        const newDirectRatings = [];
        for (let i = 0; i < numAlt; i++) {
            const row = [];
            for (let j = 0; j < numCrit; j++) {
                row.push((directRatings[i] && directRatings[i][j]) || 0);
            }
            newDirectRatings.push(row);
        }
        directRatings = newDirectRatings;

        // Resize alternativesPairwise matrix (C x A x A)
        const newAltPairwise = [];
        for (let c = 0; c < numCrit; c++) {
            const cMatrix = [];
            for (let i = 0; i < numAlt; i++) {
                const row = [];
                for (let j = 0; j < numAlt; j++) {
                    if (i === j) {
                        row.push(1);
                    } else {
                        row.push((alternativesPairwise[c] && alternativesPairwise[c][i] && alternativesPairwise[c][i][j]) || 1);
                    }
                }
                cMatrix.push(row);
            }
            newAltPairwise.push(cMatrix);
        }
        alternativesPairwise = newAltPairwise;
    }
    
    if (step === 2) {
        // Read Names
        for (let i = 0; i < numCrit; i++) {
            criteria[i].name = document.getElementById(`crit-name-${i}`).value;
            criteria[i].type = document.getElementById(`crit-type-${i}`).value;
        }
        for (let i = 0; i < numAlt; i++) {
            alternatives[i].name = document.getElementById(`alt-name-${i}`).value;
        }
    }
    
    if (step === 3) {
        // Read Weights
        if (scale !== 'pairwise') {
            for (let i = 0; i < numCrit; i++) {
                criteria[i].weight = parseFloat(document.getElementById(`crit-weight-${i}`).value);
            }
        }
    }
    
    if (step === 4) {
        // Read Ratings
        if (method !== 'ahp') {
            for (let i = 0; i < numAlt; i++) {
                for (let j = 0; j < numCrit; j++) {
                    directRatings[i][j] = parseFloat(document.getElementById(`rating-${i}-${j}`).value);
                }
            }
        }
    }
}

function renderStep(step) {
    // Toggle Active pane
    document.querySelectorAll('.step-pane').forEach(p => p.style.display = 'none');
    document.getElementById(`pane-${step}`).style.display = 'block';
    
    // Update Indicator
    document.querySelectorAll('.wizard-step').forEach((ws, idx) => {
        ws.classList.remove('active', 'completed');
        if (idx + 1 < step) ws.classList.add('completed');
        if (idx + 1 === step) ws.classList.add('active');
    });
    
    // Navigation Button Label & States
    document.getElementById('btn-prev').disabled = (step === 1);
    const nextBtn = document.getElementById('btn-next');
    if (step === 5) {
        nextBtn.innerHTML = `<span>Simpan & Hitung</span> <i data-lucide="save" class="icon-18"></i>`;
    } else {
        nextBtn.innerHTML = `<span>Selanjutnya</span> <i data-lucide="arrow-right" class="icon-18"></i>`;
    }
    if (window.lucide) lucide.createIcons();

    // Perform step-specific builds
    if (step === 2) buildStep2();
    if (step === 3) buildStep3();
    if (step === 4) buildStep4();
    if (step === 5) buildStep5();
}

// Step DOM Builders
function buildStep2() {
    const numCrit = parseInt(document.getElementById('num-criteria').value);
    const numAlt = parseInt(document.getElementById('num-alternatives').value);
    
    // Build Criteria name inputs
    const critContainer = document.getElementById('criteria-names-container');
    critContainer.innerHTML = '';
    for (let i = 0; i < numCrit; i++) {
        const data = criteria[i] || { name: `Kriteria ${i+1}`, type: 'benefit' };
        critContainer.innerHTML += `
            <div class="form-group" style="margin-bottom:0.75rem;">
                <label style="font-size:0.8rem;">Kriteria ${i+1}</label>
                <div style="display:flex; gap:0.5rem;">
                    <input type="text" id="crit-name-${i}" class="form-control" value="${data.name}" placeholder="Nama Kriteria" style="flex:2;" required>
                    <select id="crit-type-${i}" class="form-control" style="flex:1;">
                        <option value="benefit" ${data.type === 'benefit' ? 'selected' : ''}>Benefit</option>
                        <option value="cost" ${data.type === 'cost' ? 'selected' : ''}>Cost</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    // Build Alternatives name inputs
    const altContainer = document.getElementById('alternatives-names-container');
    altContainer.innerHTML = '';
    for (let i = 0; i < numAlt; i++) {
        const name = alternatives[i] ? alternatives[i].name : `Alternatif ${i+1}`;
        altContainer.innerHTML += `
            <div class="form-group" style="margin-bottom:0.75rem;">
                <label style="font-size:0.8rem;">Alternatif ${i+1}</label>
                <input type="text" id="alt-name-${i}" class="form-control" value="${name}" placeholder="Nama Alternatif" required>
            </div>
        `;
    }
}

function buildStep3() {
    const scale = document.getElementById('weight-scale').value;
    const numCrit = criteria.length;
    
    const directCont = document.getElementById('direct-weight-container');
    const pairCont = document.getElementById('pairwise-weight-container');
    const desc = document.getElementById('weight-description');
    
    if (scale === 'pairwise') {
        desc.textContent = "Bandingkan kepentingan kriteria secara berpasangan. Isi nilai di atas garis diagonal utama (1). Nilai kebalikannya otomatis terisi.";
        directCont.style.display = 'none';
        pairCont.style.display = 'block';
        
        // Build Matrix table
        const header = document.getElementById('pairwise-weight-header');
        const body = document.getElementById('pairwise-weight-body');
        
        header.innerHTML = `<tr><th>Kriteria</th>${criteria.map(c => `<th>${c.name}</th>`).join('')}</tr>`;
        
        body.innerHTML = '';
        for (let i = 0; i < numCrit; i++) {
            let rowHtml = `<tr><td><strong>${criteria[i].name}</strong></td>`;
            for (let j = 0; j < numCrit; j++) {
                if (i === j) {
                    rowHtml += `<td class="bg-faint-bold">1</td>`;
                } else if (i < j) {
                    // Upper triangular is input
                    const val = criteriaPairwise[i][j];
                    rowHtml += `
                        <td>
                            <select id="pairwise-w-${i}-${j}" class="form-control pairwise-select" onchange="updatePairwiseReciprocity('w', ${i}, ${j}, this.value)">
                                <option value="1" ${val === 1 ? 'selected' : ''}>1</option>
                                <option value="2" ${val === 2 ? 'selected' : ''}>2</option>
                                <option value="3" ${val === 3 ? 'selected' : ''}>3</option>
                                <option value="4" ${val === 4 ? 'selected' : ''}>4</option>
                                <option value="5" ${val === 5 ? 'selected' : ''}>5</option>
                                <option value="6" ${val === 6 ? 'selected' : ''}>6</option>
                                <option value="7" ${val === 7 ? 'selected' : ''}>7</option>
                                <option value="8" ${val === 8 ? 'selected' : ''}>8</option>
                                <option value="9" ${val === 9 ? 'selected' : ''}>9</option>
                                <option value="0.5" ${Math.abs(val - 0.5) < 0.01 ? 'selected' : ''}>1/2</option>
                                <option value="0.333" ${Math.abs(val - 0.333) < 0.01 ? 'selected' : ''}>1/3</option>
                                <option value="0.25" ${Math.abs(val - 0.25) < 0.01 ? 'selected' : ''}>1/4</option>
                                <option value="0.2" ${Math.abs(val - 0.2) < 0.01 ? 'selected' : ''}>1/5</option>
                                <option value="0.167" ${Math.abs(val - 0.167) < 0.01 ? 'selected' : ''}>1/6</option>
                                <option value="0.143" ${Math.abs(val - 0.143) < 0.01 ? 'selected' : ''}>1/7</option>
                                <option value="0.125" ${Math.abs(val - 0.125) < 0.01 ? 'selected' : ''}>1/8</option>
                                <option value="0.111" ${Math.abs(val - 0.111) < 0.01 ? 'selected' : ''}>1/9</option>
                            </select>
                        </td>
                    `;
                } else {
                    // Lower triangular is reciprocal label
                    const val = criteriaPairwise[i][j];
                    const displayVal = val >= 1 ? Math.round(val) : `1/${Math.round(1/val)}`;
                    rowHtml += `<td id="pairwise-w-lbl-${i}-${j}" class="pairwise-label">${displayVal}</td>`;
                }
            }
            rowHtml += '</tr>';
            body.innerHTML += rowHtml;
        }
    } else {
        desc.textContent = `Masukkan bobot kriteria dalam skala ${scale === '0-1' ? '0 sampai 1' : '10 sampai 100'}.`;
        directCont.style.display = 'block';
        pairCont.style.display = 'none';
        
        directCont.innerHTML = '';
        for (let i = 0; i < numCrit; i++) {
            const w = criteria[i].weight || (scale === '0-1' ? 0.3 : 30);
            directCont.innerHTML += `
                <div class="form-group crit-weight-row">
                    <span class="crit-weight-label">${criteria[i].name} (${criteria[i].type.toUpperCase()})</span>
                    <input type="number" id="crit-weight-${i}" class="form-control crit-weight-input" value="${w}" step="any" min="0.001" required>
                </div>
            `;
        }
    }
}

// Ensure updatePairwiseReciprocity is globally accessible for inline onchange events
window.updatePairwiseReciprocity = function(type, i, j, value) {
    const parsedVal = parseFloat(value);
    const reciprocalVal = parsedVal !== 0 ? 1 / parsedVal : 1;
    
    if (type === 'w') {
        criteriaPairwise[i][j] = parsedVal;
        criteriaPairwise[j][i] = reciprocalVal;
        
        const labelEl = document.getElementById(`pairwise-w-lbl-${j}-${i}`);
        if (labelEl) {
            labelEl.textContent = parsedVal >= 1 ? `1/${Math.round(parsedVal)}` : Math.round(reciprocalVal);
        }
    } else if (type === 'a') {
        alternativesPairwise[activeAHPTabCrit][i][j] = parsedVal;
        alternativesPairwise[activeAHPTabCrit][j][i] = reciprocalVal;
        
        const labelEl = document.getElementById(`pairwise-a-lbl-${j}-${i}`);
        if (labelEl) {
            labelEl.textContent = parsedVal >= 1 ? `1/${Math.round(parsedVal)}` : Math.round(reciprocalVal);
        }
    }
};

function buildStep4() {
    const method = document.getElementById('proj-method').value;
    const numCrit = criteria.length;
    const numAlt = alternatives.length;
    
    const directCont = document.getElementById('direct-matrix-container');
    const pairCont = document.getElementById('pairwise-matrix-container');
    const titleEl = document.getElementById('pane-4-title');
    const descEl = document.getElementById('pane-4-desc');
    
    if (method === 'ahp') {
        titleEl.innerHTML = `<i data-lucide="table" class="icon-stroke-primary"></i> Langkah 4: Perbandingan Berpasangan Alternatif (AHP)`;
        descEl.textContent = "Bandingkan kepentingan antar alternatif secara berpasangan untuk masing-masing kriteria. Gunakan tab kriteria di bawah.";
        directCont.style.display = 'none';
        pairCont.style.display = 'block';
        
        // Build Tabs
        const tabContainer = document.getElementById('ahp-crit-tabs');
        tabContainer.innerHTML = '';
        for (let c = 0; c < numCrit; c++) {
            tabContainer.innerHTML += `
                <button class="tab-btn ${c === activeAHPTabCrit ? 'active' : ''}" onclick="window.switchAHPTab(${c})">
                    ${criteria[c].name}
                </button>
            `;
        }
        
        renderPairwiseAltMatrix();
    } else {
        titleEl.innerHTML = `<i data-lucide="table" class="icon-stroke-primary"></i> Langkah 4: Matriks Penilaian Alternatif`;
        descEl.textContent = "Isi performa rating langsung untuk setiap alternatif terhadap kriteria yang tersedia. Input bebas antara 0 - 100.";
        directCont.style.display = 'block';
        pairCont.style.display = 'none';
        
        const header = document.getElementById('direct-matrix-header');
        const body = document.getElementById('direct-matrix-body');
        
        header.innerHTML = `<tr><th>Alternatif</th>${criteria.map(c => `<th>${c.name} (${c.type.toUpperCase()})</th>`).join('')}</tr>`;
        
        body.innerHTML = '';
        for (let i = 0; i < numAlt; i++) {
            let rowHtml = `<tr><td><strong>${alternatives[i].name}</strong></td>`;
            for (let j = 0; j < numCrit; j++) {
                const ratingVal = directRatings[i][j] || 0;
                rowHtml += `
                    <td>
                        <input type="number" id="rating-${i}-${j}" class="form-control" value="${ratingVal}" step="any" min="0" required>
                    </td>
                `;
            }
            rowHtml += '</tr>';
            body.innerHTML += rowHtml;
        }
    }
    if (window.lucide) lucide.createIcons();
}

window.switchAHPTab = function(critIdx) {
    activeAHPTabCrit = critIdx;
    document.querySelectorAll('#ahp-crit-tabs .tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === critIdx);
    });
    renderPairwiseAltMatrix();
};

function renderPairwiseAltMatrix() {
    const numAlt = alternatives.length;
    const c = activeAHPTabCrit;
    
    const header = document.getElementById('pairwise-alt-header');
    const body = document.getElementById('pairwise-alt-body');
    
    header.innerHTML = `<tr><th>Alternatif</th>${alternatives.map(a => `<th>${a.name}</th>`).join('')}</tr>`;
    
    body.innerHTML = '';
    for (let i = 0; i < numAlt; i++) {
        let rowHtml = `<tr><td><strong>${alternatives[i].name}</strong></td>`;
        for (let j = 0; j < numAlt; j++) {
            if (i === j) {
                rowHtml += `<td class="bg-faint-bold">1</td>`;
            } else if (i < j) {
                const val = alternativesPairwise[c][i][j];
                rowHtml += `
                    <td>
                        <select id="pairwise-a-${i}-${j}" class="form-control pairwise-select" onchange="updatePairwiseReciprocity('a', ${i}, ${j}, this.value)">
                            <option value="1" ${val === 1 ? 'selected' : ''}>1</option>
                            <option value="2" ${val === 2 ? 'selected' : ''}>2</option>
                            <option value="3" ${val === 3 ? 'selected' : ''}>3</option>
                            <option value="4" ${val === 4 ? 'selected' : ''}>4</option>
                            <option value="5" ${val === 5 ? 'selected' : ''}>5</option>
                            <option value="6" ${val === 6 ? 'selected' : ''}>6</option>
                            <option value="7" ${val === 7 ? 'selected' : ''}>7</option>
                            <option value="8" ${val === 8 ? 'selected' : ''}>8</option>
                            <option value="9" ${val === 9 ? 'selected' : ''}>9</option>
                            <option value="0.5" ${Math.abs(val - 0.5) < 0.01 ? 'selected' : ''}>1/2</option>
                            <option value="0.333" ${Math.abs(val - 0.333) < 0.01 ? 'selected' : ''}>1/3</option>
                            <option value="0.25" ${Math.abs(val - 0.25) < 0.01 ? 'selected' : ''}>1/4</option>
                            <option value="0.2" ${Math.abs(val - 0.2) < 0.01 ? 'selected' : ''}>1/5</option>
                            <option value="0.167" ${Math.abs(val - 0.167) < 0.01 ? 'selected' : ''}>1/6</option>
                            <option value="0.143" ${Math.abs(val - 0.143) < 0.01 ? 'selected' : ''}>1/7</option>
                            <option value="0.125" ${Math.abs(val - 0.125) < 0.01 ? 'selected' : ''}>1/8</option>
                            <option value="0.111" ${Math.abs(val - 0.111) < 0.01 ? 'selected' : ''}>1/9</option>
                        </select>
                    </td>
                `;
            } else {
                const val = alternativesPairwise[c][i][j];
                const displayVal = val >= 1 ? Math.round(val) : `1/${Math.round(1/val)}`;
                rowHtml += `<td id="pairwise-a-lbl-${i}-${j}" class="pairwise-label">${displayVal}</td>`;
            }
        }
        rowHtml += '</tr>';
        body.innerHTML += rowHtml;
    }
}

function buildStep5() {
    const name = document.getElementById('proj-name').value.trim();
    const method = document.getElementById('proj-method').value;
    const scale = document.getElementById('weight-scale').value;
    
    document.getElementById('rev-name').textContent = name;
    document.getElementById('rev-method').textContent = method.toUpperCase();
    
    const scaleLabels = { '0-1': 'Direct (0 - 1)', '10-100': 'Direct (10 - 100)', 'pairwise': 'AHP Pairwise Matrix' };
    document.getElementById('rev-scale').textContent = scaleLabels[scale];

    // 1. Criteria Review Table
    const critBody = document.getElementById('rev-criteria-body');
    critBody.innerHTML = '';
    
    // Calculate priority weights to display if AHP/Hybrid
    let displayWeights = criteria.map(c => c.weight);
    if (scale === 'pairwise') {
        const ahpRes = solveAHPMatrix(criteriaPairwise);
        if (ahpRes) {
            displayWeights = ahpRes.weights;
        }
    }
    
    criteria.forEach((c, idx) => {
        const wt = scale === 'pairwise' ? `Calculated priority: ${(displayWeights[idx]*100).toFixed(1)}%` : c.weight;
        critBody.innerHTML += `
            <tr>
                <td>${idx+1}</td>
                <td><input type="text" value="${c.name}" class="review-crit-input" onchange="window.updateCriteriaName(${idx}, this.value)"></td>
                <td>
                    <select class="review-crit-select" onchange="window.updateCriteriaType(${idx}, this.value)">
                        <option value="benefit" ${c.type === 'benefit' ? 'selected' : ''}>Benefit</option>
                        <option value="cost" ${c.type === 'cost' ? 'selected' : ''}>Cost</option>
                    </select>
                </td>
                <td>
                    ${scale === 'pairwise' ? `<span style="font-size:0.85rem; color:var(--secondary); font-weight:600;">${wt}</span>` : `<input type="number" step="any" value="${c.weight}" class="review-crit-input" onchange="window.updateCriteriaWeight(${idx}, this.value)">`}
                </td>
            </tr>
        `;
    });

    // 2. Alternatives & Performance matrix table review
    const matrixTitle = document.getElementById('rev-matrix-title');
    const matrixHeader = document.getElementById('rev-matrix-header');
    const matrixBody = document.getElementById('rev-matrix-body');
    const ahpNote = document.getElementById('rev-ahp-note');
    
    if (method === 'ahp') {
        matrixTitle.textContent = "Daftar Alternatif (AHP Standar)";
        ahpNote.style.display = 'block';
        
        matrixHeader.innerHTML = `<tr><th>No</th><th>Nama Alternatif</th></tr>`;
        matrixBody.innerHTML = '';
        alternatives.forEach((alt, idx) => {
            matrixBody.innerHTML += `
                <tr>
                    <td>${idx+1}</td>
                    <td><input type="text" value="${alt.name}" class="review-alt-input" onchange="window.updateAltName(${idx}, this.value)"></td>
                </tr>
            `;
        });
    } else {
        matrixTitle.textContent = "Matriks Penilaian Alternatif";
        ahpNote.style.display = 'none';
        
        matrixHeader.innerHTML = `<tr><th>Alternatif</th>${criteria.map(c => `<th>${c.name}</th>`).join('')}</tr>`;
        
        matrixBody.innerHTML = '';
        alternatives.forEach((alt, idx) => {
            let rowHtml = `<tr>
                <td><input type="text" value="${alt.name}" class="review-alt-input" onchange="window.updateAltName(${idx}, this.value)"></td>`;
            for (let j = 0; j < criteria.length; j++) {
                rowHtml += `
                    <td>
                        <input type="number" step="any" value="${directRatings[idx][j]}" class="review-rating-input" onchange="window.updateRating(${idx}, ${j}, this.value)">
                    </td>
                `;
            }
            rowHtml += '</tr>';
            matrixBody.innerHTML += rowHtml;
        });
    }
}

// Global exposure for inline event handlers
window.updateCriteriaName = function(idx, val) { criteria[idx].name = val; };
window.updateCriteriaType = function(idx, val) { criteria[idx].type = val; };
window.updateCriteriaWeight = function(idx, val) { criteria[idx].weight = parseFloat(val); };
window.updateAltName = function(idx, val) { alternatives[idx].name = val; };
window.updateRating = function(i, j, val) { directRatings[i][j] = parseFloat(val); };

async function saveAllData() {
    if (!userId) {
        showToast("Anda harus login terlebih dahulu!", "error");
        return;
    }

    const name = document.getElementById('proj-name').value.trim();
    const method = document.getElementById('proj-method').value;
    const scale = document.getElementById('weight-scale').value;
    const btn = document.getElementById('btn-next');
    
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Menyimpan...';

    const projectData = {
        name: name,
        activeMethod: method,
        weightScale: scale,
        criteria: criteria,
        alternatives: alternatives,
        directRatings: directRatings,
        criteriaPairwise: criteriaPairwise,
        alternativesPairwise: alternativesPairwise,
        status: "active"
    };
    
    const result = await db_saveProject(userId, projectData);
    
    if (result.success) {
        showToast("Data berhasil disimpan! Mengkalkulasi...", "success");
        setTimeout(() => {
            window.location.href = 'dashboard.php';
        }, 1000);
    } else {
        showToast("Gagal menyimpan data: " + result.error, "error");
        btn.disabled = false;
        btn.querySelector('span').textContent = 'Simpan & Hitung';
    }
}

// Initialize View
renderStep(currentStep);
