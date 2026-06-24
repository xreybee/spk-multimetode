/* c:/Users/Reyhan/Documents/spk/js/login.js */

// Redirect if already logged in
auth_onStateChanged((user) => {
    if (user) {
        window.location.href = 'dashboard.php';
    }
});

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const btn = document.getElementById('btn-submit');
        
        if (btn) {
            btn.disabled = true;
            const btnSpan = btn.querySelector('span');
            if (btnSpan) btnSpan.textContent = 'Memproses...';
        }
        
        // Handle login helper
        const result = await auth_signIn(email, password);
        
        if (result.success) {
            showToast("Login berhasil! Mengalihkan...", "success");
            setTimeout(() => {
                window.location.href = 'dashboard.php';
            }, 1000);
        } else {
            showToast(result.error, "error");
            if (btn) {
                btn.disabled = false;
                const btnSpan = btn.querySelector('span');
                if (btnSpan) btnSpan.textContent = 'Masuk';
            }
        }
    });
}
