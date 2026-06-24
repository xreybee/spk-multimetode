<?php
include 'header.php';
?>

<div class="container">
    <div class="dashboard-header">
        <div>
            <h1>Arsip Proyek SPK</h1>
            <p class="archive-header-desc">
                Daftar evaluasi keputusan terdahulu yang telah disimpan.
            </p>
        </div>
        <a href="input.php" class="btn btn-primary">
            <i data-lucide="plus-circle" class="icon-18"></i> Proyek Baru
        </a>
    </div>

    <!-- Loading Screen -->
    <div id="archive-loading" class="archive-loading-container">
        <div class="loading-spinner-large"></div>
        <p class="text-muted-color">Memuat daftar arsip...</p>
    </div>

    <!-- Empty State -->
    <div id="archive-empty" class="glass-panel empty-state archive-empty-panel" style="display: none;">
        <i data-lucide="archive" class="empty-icon"></i>
        <h2 class="empty-title">Belum Ada Proyek Diarsipkan</h2>
        <p class="empty-desc">Proyek Anda akan diarsipkan di sini ketika Anda mengeklik "Input Data Lain" di halaman Dashboard.</p>
    </div>

    <!-- Archive List Grid -->
    <div id="archive-content" class="archive-list" style="display: none;">
        <!-- JS Injected Cards -->
    </div>
</div>

<script src="js/archive.js"></script>

<?php
include 'footer.php';
?>
