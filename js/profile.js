let currentUserId = null;
let base64Photo = null;

// Verify user is authenticated and load profile data
auth_onStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.php';
        return;
    }

    currentUserId = user.uid;
    document.getElementById('prof-name').value = user.name || '';
    document.getElementById('prof-username').value = user.username || '';
    document.getElementById('prof-profession').value = user.profession || 'Mahasiswa';
    
    if (user.photoUrl && user.photoUrl !== '') {
        document.getElementById('profile-pic').src = user.photoUrl;
        base64Photo = user.photoUrl;
    } else {
        document.getElementById('profile-pic').src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
    }
});

// Handle avatar photo selection and convert to Base64
document.getElementById('avatar-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
        showToast("Ukuran file terlalu besar! Maksimal 1 MB.", "error");
        this.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
            // Resize logic to max 256x256
            const MAX_WIDTH = 256;
            const MAX_HEIGHT = 256;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            base64Photo = canvas.toDataURL('image/jpeg', 0.8);
            document.getElementById('profile-pic').src = base64Photo;
            showToast("Foto berhasil dimuat dan diperkecil ukurannya. Klik Simpan untuk memperbarui.", "success");
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
});

// Handle form submission
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUserId) return;
    
    const name = document.getElementById('prof-name').value.trim();
    const username = document.getElementById('prof-username').value.trim();
    const profession = document.getElementById('prof-profession').value;
    const password = document.getElementById('prof-password').value;
    const btn = document.getElementById('btn-save-profile');
    
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="animate-spin" style="width:18px; height:18px;"></i> Menyimpan...`;
    if (window.lucide) lucide.createIcons();

    try {
        const result = await auth_updateProfile(currentUserId, name, username, password, profession, base64Photo);
        
        if (result.success) {
            showToast("Profil berhasil diperbarui!", "success");
            document.getElementById('prof-password').value = '';
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showToast("Gagal memperbarui profil: " + result.error, "error");
        }
    } catch (err) {
        showToast("Terjadi kesalahan sistem: " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save" style="width:18px; height:18px;"></i> Simpan Perubahan`;
        if (window.lucide) lucide.createIcons();
    }
});


// Theme selection handler
const themeSelect = document.getElementById('theme-select');
if (themeSelect) {
    // Set initial value
    const savedTheme = localStorage.getItem('spk_theme') || 'default';
    themeSelect.value = savedTheme;

    themeSelect.addEventListener('change', (e) => {
        const newTheme = e.target.value;
        
        // Remove all theme classes first
        document.documentElement.classList.remove('theme-aqua', 'theme-light');
        
        // Add new theme class if not default
        if (newTheme !== 'default') {
            document.documentElement.classList.add(`theme-${newTheme}`);
        }
        
        // Save to local storage
        localStorage.setItem('spk_theme', newTheme);
        
        // Dispatch themechange event
        window.dispatchEvent(new Event('themechange'));
    });
}
