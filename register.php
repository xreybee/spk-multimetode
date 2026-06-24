<!-- C:\Users\Reyhan\Documents\spk\register.php -->
<?php
include 'header.php';
?>

<div class="auth-wrapper auth-wrapper-custom">
    <div class="glass-panel auth-card auth-card-custom">
        <div class="auth-header">
            <i data-lucide="user-plus" class="icon-primary-42"></i>
            <h2>Daftar Akun Baru</h2>
            <p>Buat akun Anda untuk mulai mengimplementasikan metode SPK</p>
        </div>
        
        <form id="register-form">
            <div class="form-group">
                <label for="name">Nama Lengkap</label>
                <input type="text" id="name" class="form-control" placeholder="Nama Lengkap Anda" required>
            </div>
            
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" class="form-control" placeholder="username_anda" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" class="form-control" placeholder="nama@domain.com" required>
            </div>
            
            <div class="form-group">
                <label for="profession">Profesi</label>
                <select id="profession" class="form-control" required>
                    <option value="" disabled selected>Pilih Profesi</option>
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Dosen">Dosen</option>
                    <option value="Praktisi">Praktisi</option>
                    <option value="Umum">Umum</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="password">Kata Sandi</label>
                <input type="password" id="password" class="form-control" placeholder="Minimal 6 karakter" required minlength="6">
            </div>
            
            <button type="submit" id="btn-submit" class="btn btn-primary btn-block btn-mt-1">
                <span>Daftar Akun</span> <i data-lucide="arrow-right" class="icon-18"></i>
            </button>
        </form>
        
        <div class="auth-footer-text">
            Sudah punya akun? <a href="login.php" class="auth-link">Masuk di sini</a>
        </div>
    </div>
</div>

<script src="js/register.js"></script>

<?php
include 'footer.php';
?>
