/* c:/Users/Reyhan/Documents/spk/js/register.js */

// Redirect if already logged in
auth_onStateChanged((user) => {
    if (user) {
        window.location.href = 'dashboard.php';
    }
});

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const profession = document.getElementById('profession').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('btn-submit');
        
        if (btn) {
            btn.disabled = true;
            const btnSpan = btn.querySelector('span');
            if (btnSpan) btnSpan.textContent = 'Mendaftarkan...';
        }
        
        const result = await auth_signUp(email, password, name, username, profession);
        
        if (result.success) {
            showToast("Registrasi berhasil! Silakan login.", "success");
            setTimeout(() => {
                window.location.href = 'login.php';
            }, 1500);
        } else {
            showToast(result.error, "error");
            if (btn) {
                btn.disabled = false;
                const btnSpan = btn.querySelector('span');
                if (btnSpan) btnSpan.textContent = 'Daftar Akun';
            }
        }
    });
}
