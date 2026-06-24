/* c:/Users/Reyhan/Documents/spk/js/dashboard.js */

let activeProject = null;
let allCalculations = null;
let selectedMethod = 'saw';
let myChart = null;

// Load active evaluation dataset
auth_onStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.php';
        return;
    }

    activeProject = await db_getActiveProject(user.uid);
    
    const loadingEl = document.getElementById('dashboard-loading');
    const emptyEl = document.getElementById('dashboard-empty');
    const contentEl = document.getElementById('dashboard-content');
    
    if (loadingEl) loadingEl.style.display = 'none';

    if (!activeProject) {
        if (emptyEl) emptyEl.style.display = 'flex';
        if (contentEl) contentEl.style.display = 'none';
    } else {
        if (emptyEl) emptyEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
        
        // Render basic UI
        const titleEl = document.getElementById('project-title-heading');
        const metaEl = document.getElementById('project-meta-info');
        
        if (titleEl) titleEl.textContent = activeProject.name;
        
        const formattedDate = new Date(activeProject.createdAt).toLocaleDateString('id-ID', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        if (metaEl) metaEl.textContent = `Dibuat pada: ${formattedDate} | Metode Utama: ${activeProject.activeMethod.toUpperCase()}`;
        
        // Set initial selected method to active method of the project
        selectedMethod = activeProject.activeMethod || 'saw';
        updateMethodSwitcherLabel();
        
        // Prepare hybrid rating mapping for calculations compatibility
        prepareCrossMethodData();

        // Run calculations
        allCalculations = runAllDSSCalculations(activeProject);
        
        // Initialize Dashboard View
        renderDashboardData();
    }
});

// Helper: Map data between AHP (pairwise) and SAW/WP/MOORA (ratings) to allow cross-method calculations
function prepareCrossMethodData() {
    if (!activeProject) return;
    const numCrit = activeProject.criteria.length;
    const numAlt = activeProject.alternatives.length;

    // Case A: User entered SAW/WP/MOORA data (directRatings) but switches to AHP
    // We generate alternative pairwise comparisons based on their direct ratings ratios
    if (activeProject.directRatings && activeProject.directRatings.length > 0) {
        if (!activeProject.alternativesPairwise || activeProject.alternativesPairwise.length === 0) {
            activeProject.alternativesPairwise = Array(numCrit).fill(null).map((_, c) => 
                Array(numAlt).fill(null).map((_, i) => 
                    Array(numAlt).fill(null).map((_, j) => {
                        if (i === j) return 1;
                        const ratingI = Number(activeProject.directRatings[i][c]) || 0.001;
                        const ratingJ = Number(activeProject.directRatings[j][c]) || 0.001;
                        const ratio = ratingI / ratingJ;
                        
                        // Map ratio to Saaty scale 1 to 9
                        if (ratio === 1) return 1;
                        if (ratio > 1) {
                            return Math.min(9, Math.round(ratio));
                        } else {
                            return 1 / Math.min(9, Math.round(1 / ratio));
                        }
                    })
                )
            );
        }

        if (!activeProject.criteriaPairwise || activeProject.criteriaPairwise.length === 0) {
            // Generate criteria pairwise based on direct weights ratio
            const rawWeights = activeProject.criteria.map(c => Number(c.weight) || 1);
            activeProject.criteriaPairwise = Array(numCrit).fill(null).map((_, i) => 
                Array(numCrit).fill(null).map((_, j) => {
                    if (i === j) return 1;
                    const wI = rawWeights[i];
                    const wJ = rawWeights[j];
                    const ratio = wI / wJ;
                    if (ratio === 1) return 1;
                    if (ratio > 1) {
                        return Math.min(9, Math.round(ratio));
                    } else {
                        return 1 / Math.min(9, Math.round(1 / ratio));
                    }
                })
            );
        }
    }
    
    // Case B: User entered AHP (pairwise) data, but switches to SAW/WP/MOORA
    // We solve AHP first, and use the solved priority vectors of alternatives under each criterion
    // as the "direct ratings" matrix so SAW/WP/MOORA can process it!
    if (activeProject.criteriaPairwise && activeProject.criteriaPairwise.length > 0 && 
        (!activeProject.directRatings || activeProject.directRatings.length === 0)) {
        
        // Solve AHP weights to get direct weights
        const criteriaRes = solveAHPMatrix(activeProject.criteriaPairwise);
        if (criteriaRes) {
            activeProject.criteria.forEach((c, idx) => {
                c.weight = criteriaRes.weights[idx];
            });
        }

        // Generate direct ratings from alternative priority weights
        const derivedRatings = Array(numAlt).fill(null).map(() => Array(numCrit).fill(0));
        for (let j = 0; j < numCrit; j++) {
            const altMatrix = activeProject.alternativesPairwise ? activeProject.alternativesPairwise[j] : null;
            if (altMatrix) {
                const altRes = solveAHPMatrix(altMatrix);
                if (altRes) {
                    for (let i = 0; i < numAlt; i++) {
                        derivedRatings[i][j] = altRes.weights[i]; // values are 0-1 priority scores
                    }
                }
            }
        }
        activeProject.directRatings = derivedRatings;
    }
}

// Toggle dropdown switcher
const switcherToggle = document.getElementById('method-switcher-toggle');
const switcherOptions = document.getElementById('method-switcher-options');

if (switcherToggle && switcherOptions) {
    switcherToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        switcherOptions.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        switcherOptions.classList.remove('active');
    });
}

// Handle switching methods
document.querySelectorAll('.method-opt').forEach(opt => {
    opt.addEventListener('click', function() {
        selectedMethod = this.getAttribute('data-method');
        updateMethodSwitcherLabel();
        renderDashboardData();
    });
});

function updateMethodSwitcherLabel() {
    if (!switcherToggle) return;
    const methodLabels = {
        'saw': 'Metode: SAW (Simple Additive Weighting)',
        'ahp': 'Metode: AHP (Analytical Hierarchy Process)',
        'hybrid': 'Metode: Hybrid SAW-AHP',
        'wp': 'Metode: WP (Weighted Product)',
        'moora': 'Metode: MOORA'
    };
    const spanEl = switcherToggle.querySelector('span');
    if (spanEl) spanEl.textContent = methodLabels[selectedMethod];
    
    // Active item class in dropdown
    document.querySelectorAll('.method-opt').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-method') === selectedMethod);
    });
}

// Render data on the page dynamically
function renderDashboardData() {
    if (!allCalculations) return;
    
    const calcData = allCalculations[selectedMethod];
    if (!calcData) {
        showToast("Perhitungan gagal untuk metode: " + selectedMethod, "error");
        return;
    }

    const rankedData = calcData.ranked;
    
    // 1. Draw/Update Chart
    const labels = rankedData.map(item => item.name);
    const dataValues = rankedData.map(item => item.score);
    
    const style = getComputedStyle(document.documentElement);
    const primaryColor = style.getPropertyValue('--primary').trim() || '#8b5cf6';
    const primaryGlow = style.getPropertyValue('--primary-glow').trim() || 'rgba(139, 92, 246, 0.4)';
    const secondaryColor = style.getPropertyValue('--secondary').trim() || '#06b6d4';
    const secondaryGlow = style.getPropertyValue('--secondary-glow').trim() || 'rgba(6, 182, 212, 0.4)';
    
    const chartCanvas = document.getElementById('scoresChart');
    if (chartCanvas) {
        if (myChart) {
            myChart.data.labels = labels;
            myChart.data.datasets[0].data = dataValues;
            myChart.data.datasets[0].label = `Skor Akhir (${selectedMethod.toUpperCase()})`;
            myChart.data.datasets[0].backgroundColor = primaryGlow;
            myChart.data.datasets[0].borderColor = primaryColor;
            myChart.data.datasets[0].hoverBackgroundColor = secondaryGlow;
            myChart.data.datasets[0].hoverBorderColor = secondaryColor;
            myChart.update();
        } else {
            const ctx = chartCanvas.getContext('2d');
            myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Skor Akhir (${selectedMethod.toUpperCase()})`,
                        data: dataValues,
                        backgroundColor: primaryGlow,
                        borderColor: primaryColor,
                        borderWidth: 2,
                        borderRadius: 8,
                        hoverBackgroundColor: secondaryGlow,
                        hoverBorderColor: secondaryColor
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#9ca3af' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#9ca3af' }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#f3f4f6', font: { family: 'Inter' } }
                        }
                    }
                }
            });
        }
    }

    // 2. Render Rankings List
    const rankContainer = document.getElementById('rankings-list-container');
    if (rankContainer) {
        rankContainer.innerHTML = '';
        
        rankedData.forEach((item, idx) => {
            const rank = idx + 1;
            let rankClass = 'rank-other';
            if (rank === 1) rankClass = 'rank-1';
            if (rank === 2) rankClass = 'rank-2';
            if (rank === 3) rankClass = 'rank-3';
            
            rankContainer.innerHTML += `
                <div class="ranking-item">
                    <span class="ranking-badge ${rankClass}">${rank}</span>
                    <span class="ranking-name">${item.name}</span>
                    <span class="ranking-score">${item.score.toFixed(4)}</span>
                </div>
            `;
        });
    }

    // 3. Render Conclusion
    const bestAlt = rankedData[0];
    const methodNameStr = selectedMethod.toUpperCase();
    const conclusionEl = document.getElementById('conclusion-summary-text');
    if (conclusionEl) {
        conclusionEl.innerHTML = `
            Berdasarkan perhitungan menggunakan metode <strong>${methodNameStr}</strong>, alternatif terbaik yang direkomendasikan adalah <strong>${bestAlt.name}</strong> dengan perolehan skor tertinggi sebesar <strong>${bestAlt.score.toFixed(4)}</strong>.
        `;
    }
}

// Input data lain handler (archive current & redirect)
const btnInputNew = document.getElementById('btn-input-new');
if (btnInputNew) {
    btnInputNew.addEventListener('click', async () => {
        if (!activeProject || !window.auth.currentUser) return;
        
        const confirmArchive = confirm("Apakah Anda ingin memasukkan data evaluasi baru? Data saat ini otomatis tersimpan di arsip.");
        if (confirmArchive) {
            await db_archiveAllActive(window.auth.currentUser.uid);
            showToast("Proyek saat ini diarsipkan. Mengalihkan ke input form...", "success");
            setTimeout(() => {
                window.location.href = 'input.php';
            }, 1000);
        }
    });
}

// Redraw chart when theme changes
window.addEventListener('themechange', () => {
    if (activeProject && allCalculations) {
        renderDashboardData();
    }
});
