<?php
include 'header.php';
?>

<div class="container container-1100">
    <!-- Active Project Loading State -->
    <div id="calc-loading" class="calc-loading-container">
        <div class="calc-spinner"></div>
        <p class="calc-loading-text">Sedang menghitung langkah-langkah matematis...</p>
    </div>

    <!-- Empty State -->
    <div id="calc-empty" class="glass-panel empty-state" style="display: none;">
        <i data-lucide="calculator" class="empty-icon"></i>
        <h2 class="empty-title">Belum Ada Data Untuk Dihitung</h2>
        <p class="empty-desc">Silakan input data kriteria dan alternatif terlebih dahulu agar langkah-langkah perhitungan dapat ditampilkan.</p>
        <a href="input.php" class="btn btn-primary">
            <i data-lucide="plus-circle" class="icon-18"></i> Mulai Input Data
        </a>
    </div>

    <!-- Main Calculation Layout -->
    <div id="calc-content" style="display: none;">
        <div class="dashboard-header">
            <div>
                <h1>Langkah Perhitungan SPK</h1>
                <p id="calc-meta-info" class="calc-meta-text">
                    Kalkulasi Matematis Rinci | Proyek: Beasiswa
                </p>
            </div>
        </div>

        <!-- Method Switcher Tabs -->
        <div class="tab-container mb-2" id="calc-method-tabs">
            <button class="tab-btn" id="tab-saw" onclick="switchCalcTab('saw')">SAW</button>
            <button class="tab-btn" id="tab-ahp" onclick="switchCalcTab('ahp')">AHP</button>
            <button class="tab-btn" id="tab-hybrid" onclick="switchCalcTab('hybrid')">Hybrid SAW-AHP</button>
            <button class="tab-btn" id="tab-wp" onclick="switchCalcTab('wp')">WP</button>
            <button class="tab-btn" id="tab-moora" onclick="switchCalcTab('moora')">MOORA</button>
        </div>

        <!-- CALCULATIONS DYNAMIC VIEW CONTAINER -->
        <div id="calc-steps-wrapper">
            <!-- Steps are dynamically injected here in JS -->
        </div>
    </div>
</div>

<script src="js/calculations.js"></script>

<?php
include 'footer.php';
?>
