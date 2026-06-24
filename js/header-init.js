/* c:/Users/Reyhan/Documents/spk/js/header-init.js */
(function() {
    const savedTheme = localStorage.getItem('spk_theme') || 'default';
    if (savedTheme === 'aqua') {
        document.documentElement.classList.add('theme-aqua');
    } else if (savedTheme === 'light') {
        document.documentElement.classList.add('theme-light');
    }
})();
