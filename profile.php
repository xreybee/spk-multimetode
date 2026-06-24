<?php
include 'header.php';
?>

<div class="container">
    <div class="dashboard-header">
        <h1>Profil Pengguna</h1>
        <a href="dashboard.php" class="btn btn-secondary">
            <i data-lucide="arrow-left" class="icon-16"></i> Kembali ke Dashboard
        </a>
    </div>

    <div class="glass-panel profile-container">
        <form id="profile-form" class="profile-grid">
            <!-- Left Side: Photo -->
            <div class="profile-avatar-section glass-panel profile-avatar-bg">
                <img id="profile-pic" class="profile-avatar-display" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" alt="Profile Picture">
                
                <label class="btn btn-secondary avatar-upload-btn btn-mt-1">
                    <i data-lucide="camera" class="icon-16"></i> Ubah Foto
                    <input type="file" id="avatar-input" accept="image/*">
                </label>
                <p class="avatar-help-text">Maksimal ukuran file: 1 MB (PNG, JPG)</p>
            </div>

            <!-- Right Side: Details -->
            <div class="flex-col-gap-1">
                <h3 class="section-title">Informasi Personal</h3>
                
                <div class="form-group">
                    <label for="prof-name">Nama Lengkap</label>
                    <input type="text" id="prof-name" class="form-control" required>
                </div>

                <div class="form-group">
                    <label for="prof-username">Username</label>
                    <input type="text" id="prof-username" class="form-control" required>
                </div>

                <div class="form-group">
                    <label for="prof-profession">Profesi</label>
                    <select id="prof-profession" class="form-control" required>
                        <option value="Mahasiswa">Mahasiswa</option>
                        <option value="Dosen">Dosen</option>
                        <option value="Praktisi">Praktisi</option>
                        <option value="Umum">Umum</option>
                    </select>
                </div>

                <div class="form-group btn-mt-1">
                    <h3 class="section-title">Pengaturan Tema</h3>
                    <select id="theme-select" class="form-control" style="width: 100%;">
                        <option value="default">Default (Dark Purple)</option>
                        <option value="aqua">Aqua (Dark Cyan)</option>
                        <option value="light">Light (White/Bright)</option>
                    </select>
                    <p class="avatar-help-text" style="text-align: left; margin-top: 0.5rem;">Pilih tema tampilan aplikasi yang Anda inginkan.</p>
                </div>

                <div class="form-group btn-mt-1">
                    <h3 class="section-title">Ganti Kata Sandi (Opsional)</h3>
                    <label for="prof-password">Kata Sandi Baru</label>
                    <input type="password" id="prof-password" class="form-control" placeholder="Biarkan kosong jika tidak ingin mengganti">
                </div>

                <button type="submit" id="btn-save-profile" class="btn btn-primary btn-mt-1 align-start">
                    <i data-lucide="save" class="icon-18"></i> Simpan Perubahan
                </button>
            </div>
        </form>
    </div>
</div>

<script src="js/profile.js"></script>

<?php
include 'footer.php';
?>
