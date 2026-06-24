<!-- C:\Users\Reyhan\Documents\spk\login.php -->
<?php
include 'header.php';
?>

<div class="auth-wrapper">
    <div class="glass-panel auth-card">
        <div class="auth-header">
            <i data-lucide="lock" class="icon-primary-42"></i>
            <h2>Selamat Datang</h2>
            <p>Silakan masuk ke akun Sistem Penunjang Keputusan Anda</p>
        </div>
        
        <form id="login-form">
            <div class="form-group">
                <label for="email">Email atau Username</label>
                <input type="text" id="email" class="form-control" placeholder="nama@email.com / username" required>
            </div>
            
            <div class="form-group">
                <label for="password">Kata Sandi</label>
                <input type="password" id="password" class="form-control" placeholder="••••••••" required>
            </div>
            
            <button type="submit" id="btn-submit" class="btn btn-primary btn-block btn-mt-1">
                <span>Masuk</span> <i data-lucide="log-in" class="icon-18"></i>
            </button>
        </form>
        
        <div class="auth-footer-text">
            Belum punya akun? <a href="register.php" class="auth-link">Daftar di sini</a>
        </div>
    </div>
</div>

<script src="js/login.js"></script>

<?php
include 'footer.php';
?>
