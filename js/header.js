/* c:/Users/Reyhan/Documents/spk/js/header.js */

// Check Auth and update Navbar
auth_onStateChanged((user) => {
    const navbar = document.getElementById('main-navbar');
    const mobileNavbar = document.getElementById('mobile-navbar');
    const currentPage = window.location.pathname.split('/').pop();
    
    // Removed logic that hides theme toggle button, as it is now specific to the profile page
    
    if (user) {
        // User logged in
        navbar.style.display = 'flex';
        if (mobileNavbar) mobileNavbar.classList.add('logged-in');
        
        const nameEl = document.getElementById('nav-user-name');
        const profEl = document.getElementById('nav-user-profession');
        const avatarEl = document.getElementById('nav-user-avatar');
        
        if (nameEl) nameEl.textContent = user.name || 'User';
        if (profEl) profEl.textContent = user.profession || 'Mahasiswa';
        if (avatarEl) {
            if (user.photoUrl && user.photoUrl !== '') {
                avatarEl.src = user.photoUrl;
            } else {
                avatarEl.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
            }
        }
        
        // Active nav link styling
        const pageIdMap = {
            'dashboard.php': 'nav-dashboard',
            'input.php': 'nav-input',
            'calculations.php': 'nav-calculations',
            'archive.php': 'nav-archive'
        };
        if (pageIdMap[currentPage]) {
            const activeEl = document.getElementById(pageIdMap[currentPage]);
            if (activeEl) activeEl.classList.add('active');
        }
        
        // Active mobile bottom nav link styling
        const mobilePageIdMap = {
            'dashboard.php': 'mob-nav-dashboard',
            'input.php': 'mob-nav-input',
            'calculations.php': 'mob-nav-calculations',
            'archive.php': 'mob-nav-archive',
            'profile.php': 'mob-nav-profile'
        };
        if (mobilePageIdMap[currentPage]) {
            const activeEl = document.getElementById(mobilePageIdMap[currentPage]);
            if (activeEl) activeEl.classList.add('active');
        }
    } else {
        if (navbar) navbar.style.display = 'none';
        if (mobileNavbar) mobileNavbar.classList.remove('logged-in');
        
        // If the page is not login.php or register.php, redirect
        if (currentPage !== 'login.php' && currentPage !== 'register.php' && currentPage !== 'index.php' && currentPage !== '') {
            window.location.href = 'login.php';
        }
    }
    
    // Re-render lucide icons if defined
    if (window.lucide) {
        lucide.createIcons();
    }
});

// Theme switching handler removed from here because the button is now only in profile.php and handled by profile.js
