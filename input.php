<!-- C:\Users\Reyhan\Documents\spk\input.php -->
<?php
include 'header.php';
?>

<div class="container container-1000">
    <div class="dashboard-header">
        <h1>Input Data Evaluasi Baru</h1>
        <a href="dashboard.php" class="btn btn-secondary">
            <i data-lucide="x" class="icon-16"></i> Batal
        </a>
    </div>

    <!-- Wizard Steps Indicator -->
    <div class="glass-panel wizard-steps wizard-steps-container">
        <div class="wizard-step active" id="w-step-1">
            <div class="step-num">1</div>
            <div class="step-label">Konfigurasi</div>
        </div>
        <div class="wizard-step" id="w-step-2">
            <div class="step-num">2</div>
            <div class="step-label">Kriteria & Alternatif</div>
        </div>
        <div class="wizard-step" id="w-step-3">
            <div class="step-num">3</div>
            <div class="step-label">Bobot</div>
        </div>
        <div class="wizard-step" id="w-step-4">
            <div class="step-num">4</div>
            <div class="step-label">Matriks Penilaian</div>
        </div>
        <div class="wizard-step" id="w-step-5">
            <div class="step-num">5</div>
            <div class="step-label">Tinjau & Simpan</div>
        </div>
    </div>

    <!-- Wizard Panel -->
    <div class="glass-panel wizard-content" id="wizard-panel">
        
        <!-- STEP 1: CONFIGURATION -->
        <div class="step-pane active" id="pane-1">
            <h3 class="card-title"><i data-lucide="settings" class="icon-stroke-primary"></i> Langkah 1: Konfigurasi Evaluasi</h3>
            <p class="step-desc-text">
                Tentukan nama proyek evaluasi Anda, metode utama yang digunakan, serta dimensi kriteria dan alternatif.
            </p>
            
            <div class="form-group">
                <label for="proj-name">Nama Proyek Evaluasi</label>
                <input type="text" id="proj-name" class="form-control" placeholder="Contoh: Penerimaan Beasiswa 2026, Pemilihan Laptop" required>
            </div>

            <div class="grid-2col">
                <div class="form-group">
                    <label for="proj-method">Metode Utama</label>
                    <select id="proj-method" class="form-control">
                        <option value="saw" selected>SAW (Simple Additive Weighting)</option>
                        <option value="ahp">AHP (Analytical Hierarchy Process)</option>
                        <option value="hybrid">Hybrid SAW-AHP</option>
                        <option value="wp">WP (Weighted Product)</option>
                        <option value="moora">MOORA</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="weight-scale">Skala Pengisian Bobot</label>
                    <select id="weight-scale" class="form-control">
                        <option value="0-1" selected>Rentang 0 - 1</option>
                        <option value="10-100">Rentang 10 - 100</option>
                        <option value="pairwise">Perbandingan Berpasangan (AHP)</option>
                    </select>
                </div>
            </div>

            <div class="grid-2col mt-0-5">
                <div class="form-group">
                    <label for="num-criteria">Jumlah Kriteria (2 - 10)</label>
                    <input type="number" id="num-criteria" class="form-control" value="3" min="2" max="10" required>
                </div>
                
                <div class="form-group">
                    <label for="num-alternatives">Jumlah Alternatif (2 - 15)</label>
                    <input type="number" id="num-alternatives" class="form-control" value="3" min="2" max="15" required>
                </div>
            </div>
        </div>

        <!-- STEP 2: CRITERIA & ALTERNATIVES NAMES -->
        <div class="step-pane" id="pane-2" style="display: none;">
            <h3 class="card-title"><i data-lucide="edit-3" class="icon-stroke-primary"></i> Langkah 2: Detail Kriteria & Alternatif</h3>
            <p class="step-desc-text">
                Masukkan nama untuk masing-masing kriteria dan alternatif, serta tentukan tipe kriteria.
            </p>

            <div class="grid-2col">
                <div>
                    <h4 class="list-title">Daftar Kriteria</h4>
                    <div id="criteria-names-container" class="flex-col-gap-1">
                        <!-- JS injected -->
                    </div>
                </div>
                <div>
                    <h4 class="list-title">Daftar Alternatif</h4>
                    <div id="alternatives-names-container" class="flex-col-gap-1">
                        <!-- JS injected -->
                    </div>
                </div>
            </div>
        </div>

        <!-- STEP 3: WEIGHT INPUT -->
        <div class="step-pane" id="pane-3" style="display: none;">
            <h3 class="card-title"><i data-lucide="bar-chart-2" class="icon-stroke-primary"></i> Langkah 3: Pengisian Bobot Kriteria</h3>
            <p id="weight-description" class="step-desc-text">
                Masukkan bobot untuk setiap kriteria.
            </p>

            <!-- Direct Weight Inputs -->
            <div id="direct-weight-container" class="direct-weight-container" style="display: none;">
                <!-- JS Injected -->
            </div>

            <!-- Pairwise Weight Inputs (AHP) -->
            <div id="pairwise-weight-container" style="display: none;">
                <div class="table-responsive">
                    <table class="table-custom text-center">
                        <thead id="pairwise-weight-header">
                            <!-- JS Injected -->
                        </thead>
                        <tbody id="pairwise-weight-body">
                            <!-- JS Injected -->
                        </tbody>
                    </table>
                </div>
                <div class="glass-panel saaty-guide-panel">
                    <h5 class="saaty-guide-title"><i data-lucide="info" class="icon-14-vm"></i> Panduan Skala Saaty (1-9):</h5>
                    <ul class="saaty-guide-list">
                        <li><strong>1:</strong> Sama pentingnya</li>
                        <li><strong>3:</strong> Kriteria baris sedikit lebih penting dari kriteria kolom</li>
                        <li><strong>5:</strong> Kriteria baris lebih penting dari kriteria kolom</li>
                        <li><strong>7:</strong> Kriteria baris sangat penting dibandingkan kriteria kolom</li>
                        <li><strong>9:</strong> Kriteria baris mutlak lebih penting dibandingkan kriteria kolom</li>
                        <li><strong>Nilai genap (2, 4, 6, 8):</strong> Nilai tengah di antaranya</li>
                        <li><strong>Pecahan (1/3, 1/5, dll):</strong> Kebalikan dari hubungan di atas</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- STEP 4: PERFORMANCE RATINGS / ALTERNATIVES PAIRWISE -->
        <div class="step-pane" id="pane-4" style="display: none;">
            <h3 class="card-title" id="pane-4-title"><i data-lucide="table" class="icon-stroke-primary"></i> Langkah 4: Matriks Penilaian Alternatif</h3>
            <p id="pane-4-desc" class="step-desc-text">
                Isilah data performa alternatif pada setiap kriteria yang ada.
            </p>

            <!-- Direct Rating Matrix (SAW/WP/MOORA/Hybrid) -->
            <div id="direct-matrix-container" style="display: none;">
                <div class="table-responsive">
                    <table class="table-custom">
                        <thead id="direct-matrix-header">
                            <!-- JS Injected -->
                        </thead>
                        <tbody id="direct-matrix-body">
                            <!-- JS Injected -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Pairwise Alternatives Matrix (AHP) -->
            <div id="pairwise-matrix-container" style="display: none;">
                <div class="tab-container" id="ahp-crit-tabs">
                    <!-- JS Injected tabs for each criteria -->
                </div>
                <div class="table-responsive mt-1">
                    <table class="table-custom text-center">
                        <thead id="pairwise-alt-header">
                            <!-- JS Injected -->
                        </thead>
                        <tbody id="pairwise-alt-body">
                            <!-- JS Injected -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- STEP 5: REVIEW & SAVE -->
        <div class="step-pane" id="pane-5" style="display: none;">
            <h3 class="card-title"><i data-lucide="check-circle" class="icon-stroke-primary"></i> Langkah 5: Tinjau & Simpan</h3>
            <p class="step-desc-text">
                Periksa kembali data Anda. Anda dapat mengedit langsung pada kolom jika ada kesalahan input/typo sebelum menekan Simpan.
            </p>

            <h4 class="review-section-title">Informasi Umum</h4>
            <div class="glass-panel grid-3col review-info-panel">
                <div>
                    <span class="review-label">Nama Proyek:</span>
                    <strong id="rev-name">Proyek Beasiswa</strong>
                </div>
                <div>
                    <span class="review-label">Metode:</span>
                    <strong id="rev-method">SAW</strong>
                </div>
                <div>
                    <span class="review-label">Skala Bobot:</span>
                    <strong id="rev-scale">0 - 1</strong>
                </div>
            </div>

            <h4 class="review-section-title">Tinjauan Kriteria & Bobot</h4>
            <div class="table-responsive mb-1-5">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama Kriteria</th>
                            <th>Tipe</th>
                            <th>Bobot Terinput</th>
                        </tr>
                    </thead>
                    <tbody id="rev-criteria-body">
                        <!-- JS Injected -->
                    </tbody>
                </table>
            </div>

            <h4 class="review-section-title" id="rev-matrix-title">Matriks Penilaian Alternatif</h4>
            <div class="table-responsive mb-1-5">
                <table class="table-custom">
                    <thead id="rev-matrix-header">
                        <!-- JS Injected -->
                    </thead>
                    <tbody id="rev-matrix-body">
                        <!-- JS Injected -->
                    </tbody>
                </table>
            </div>
            
            <div id="rev-ahp-note" class="glass-panel ahp-note-panel" style="display: none;">
                <p class="ahp-note-text">
                    <i data-lucide="info" class="icon-16-vm-primary"></i> Untuk Metode AHP standar, matriks perbandingan berpasangan alternatif akan disimpan langsung untuk kalkulasi eigen. Anda dapat melihat detail perhitungannya di menu Perhitungan setelah data disimpan.
                </p>
            </div>
        </div>

        <!-- Wizard Navigation -->
        <div class="wizard-nav">
            <button class="btn btn-secondary" id="btn-prev" disabled>
                <i data-lucide="arrow-left" class="icon-18"></i> Sebelumnya
            </button>
            <button class="btn btn-primary" id="btn-next">
                <span>Selanjutnya</span> <i data-lucide="arrow-right" class="icon-18"></i>
            </button>
        </div>
    </div>
</div>

<script src="js/input.js"></script>

<?php
include 'footer.php';
?>
