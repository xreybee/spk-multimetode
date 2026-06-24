<?php
include 'header.php';
?>

<div class="container">
    <!-- Active Project Loading State / Empty State -->
    <div id="dashboard-loading" class="archive-loading-container">
        <div class="loading-spinner-large"></div>
        <p class="text-muted-color">Sedang memuat data SPK Anda...</p>
    </div>

    <!-- Empty State (No Active Project) -->
    <div id="dashboard-empty" class="glass-panel empty-state" style="display: none;">
        <i data-lucide="folder-open" class="empty-icon"></i>
        <h2 class="empty-title">Belum Ada Data Penilaian</h2>
        <p class="empty-desc">Sistem memerlukan data alternatif, kriteria, dan bobot untuk melakukan kalkulasi SPK. Silakan input data baru terlebih dahulu.</p>
        <a href="input.php" class="btn btn-primary">
            <i data-lucide="plus-circle" class="icon-18"></i> Mulai Input Data
        </a>
    </div>

    <!-- Active Dashboard Interface -->
    <div id="dashboard-content" style="display: none;">
        <!-- Header Info -->
        <div class="dashboard-header">
            <div>
                <h1 id="project-title-heading">Nama Proyek SPK</h1>
                <p id="project-meta-info" class="archive-header-desc">
                    Dibuat pada: - | Metode Awal: -
                </p>
            </div>
            
            <div class="dashboard-actions">
                <button id="btn-input-new" class="btn btn-accent">
                    <i data-lucide="plus-circle" class="icon-18"></i> Input Data Lain
                </button>
            </div>
        </div>

        <!-- Dynamic Method Switcher Section -->
        <div class="method-switcher-container">
            <button id="method-switcher-toggle" class="method-toggle-btn">
                <span>Metode: SAW (Simple Additive Weighting)</span> <i data-lucide="chevron-down" class="icon-16"></i>
            </button>
            <div id="method-switcher-options" class="method-options">
                <button class="method-opt" data-method="saw">SAW (Simple Additive Weighting)</button>
                <button class="method-opt" data-method="ahp">AHP (Analytical Hierarchy Process)</button>
                <button class="method-opt" data-method="hybrid">Hybrid SAW-AHP</button>
                <button class="method-opt" data-method="wp">WP (Weighted Product)</button>
                <button class="method-opt" data-method="moora">MOORA</button>
            </div>
        </div>

        <!-- Dashboard Grid (Visualizations & Rankings) -->
        <div class="dashboard-grid">
            <!-- Left Side: Chart Visualization -->
            <div class="glass-panel card-p-2">
                <h3 class="card-title">
                    <i data-lucide="bar-chart-3" class="icon-stroke-primary"></i> 
                    Grafik Perbandingan Nilai Alternatif
                </h3>
                <div class="chart-container">
                    <canvas id="scoresChart"></canvas>
                </div>
            </div>

            <!-- Right Side: Rankings -->
            <div class="glass-panel card-p-2">
                <h3 class="card-title">
                    <i data-lucide="trophy" class="icon-stroke-primary"></i> 
                    Ranking Hasil Akhir
                </h3>
                <div id="rankings-list-container" class="ranking-list">
                    <!-- Dynamic Ranking List -->
                </div>
            </div>
        </div>

        <!-- Conclusion Banner -->
        <div class="glass-panel conclusion-card mt-1-5">
            <div class="flex-start-gap-1">
                <i data-lucide="check-check" class="icon-success-28"></i>
                <div>
                    <h4 class="conclusion-title">Kesimpulan Rekomendasi</h4>
                    <p id="conclusion-summary-text" class="conclusion-text">
                        Berdasarkan perhitungan metode <strong>SAW</strong>, Alternatif <strong>A</strong> direkomendasikan sebagai pilihan terbaik dengan skor tertinggi sebesar <strong>0.00</strong>.
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="js/dashboard.js"></script>

<?php
include 'footer.php';
?>
