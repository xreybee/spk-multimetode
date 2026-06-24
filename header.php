<!-- C:\Users\Reyhan\Documents\spk\header.php -->
<?php
// Start session for local server features if needed
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPK Multi-Metode (SAW, AHP, Hybrid, WP, MOORA)</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z'/%3E%3Cpath d='M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z'/%3E%3Cpath d='M12 13h4.5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3'/%3E%3Ccircle cx='13.5' cy='22' r='2.5'/%3E%3C/svg%3E">
    
    <!-- CSS -->
    <link rel="stylesheet" href="css/style.css">
    
    <script src="js/header-init.js"></script>
    
    <!-- Icons (Lucide Icons via CDN) -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Firebase Compat SDKs -->
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
</head>
<body>
    <!-- Toast Notifications Container -->
    <div id="toast-container" class="toast-container"></div>

    <!-- Firebase configuration & local database adapters -->
    <script src="config.js"></script>
    <script src="auth.js"></script>
    <script src="db.js"></script>
    <script src="dss-logic.js"></script>

    <!-- Header Navigation -->
    <header class="navbar nav-hidden" id="main-navbar">
        <a href="dashboard.php" class="nav-brand">
            <i data-lucide="brain-circuit" class="icon-primary-28"></i>
            <span>SPK</span><span>MultiMetode</span>
        </a>
        
        <ul class="nav-links">
            <li><a href="dashboard.php" id="nav-dashboard"><i data-lucide="layout-dashboard" class="nav-icon-link"></i>Dashboard</a></li>
            <li><a href="input.php" id="nav-input"><i data-lucide="plus-circle" class="nav-icon-link"></i>Input Data</a></li>
            <li><a href="calculations.php" id="nav-calculations"><i data-lucide="calculator" class="nav-icon-link"></i>Perhitungan</a></li>
            <li><a href="archive.php" id="nav-archive"><i data-lucide="archive" class="nav-icon-link"></i>Arsip</a></li>
        </ul>
        
        <div class="nav-user">
            <div class="nav-user-info">
                <span id="nav-user-name" class="nav-user-name-text">Nama User</span>
                <span id="nav-user-profession" class="nav-user-prof-text">Profesi</span>
            </div>
            <a href="profile.php">
                <img id="nav-user-avatar" class="nav-avatar" src="" alt="Avatar" onerror="this.src='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'">
            </a>
            <button onclick="auth_signOut()" class="btn btn-secondary btn-logout">
                <i data-lucide="log-out" class="icon-14"></i> Keluar
            </button>
        </div>
    </header>

    <!-- Mobile Bottom Navigation Bar -->
    <nav class="mobile-bottom-nav" id="mobile-navbar">
        <a href="dashboard.php" class="mobile-nav-link" id="mob-nav-dashboard">
            <i data-lucide="layout-dashboard"></i>
            <span>Dashboard</span>
        </a>
        <a href="input.php" class="mobile-nav-link" id="mob-nav-input">
            <i data-lucide="plus-circle"></i>
            <span>Input</span>
        </a>
        <a href="calculations.php" class="mobile-nav-link" id="mob-nav-calculations">
            <i data-lucide="calculator"></i>
            <span>Hitung</span>
        </a>
        <a href="archive.php" class="mobile-nav-link" id="mob-nav-archive">
            <i data-lucide="archive"></i>
            <span>Arsip</span>
        </a>
        <a href="profile.php" class="mobile-nav-link" id="mob-nav-profile">
            <i data-lucide="user"></i>
            <span>Profil</span>
        </a>
    </nav>

    <script src="js/header.js"></script>
