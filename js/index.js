/* c:/Users/Reyhan/Documents/spk/js/index.js */
auth_onStateChanged((user) => {
    setTimeout(() => {
        if (user) {
            window.location.href = 'dashboard.php';
        } else {
            window.location.href = 'login.php';
        }
    }, 800);
});
