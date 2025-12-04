// Shared Theme Management for All Pages
(function() {
    // Theme Management
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        // Add no-transition class to prevent animation on page load
        document.documentElement.classList.add('no-transition');
        
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        updateThemeIcon(savedTheme);
        
        // Remove no-transition class after a brief delay
        setTimeout(() => {
            document.documentElement.classList.remove('no-transition');
        }, 100);
    }

    window.toggleTheme = function(event) {
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        
        // Get button position for ripple effect
        const button = event?.target?.closest('button') || document.querySelector('[onclick*="toggleTheme"]');
        const rect = button?.getBoundingClientRect() || { left: window.innerWidth / 2, top: 50 };
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // Create ripple overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed pointer-events-none z-[9999] theme-ripple';
        overlay.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            width: 100px;
            height: 100px;
            margin-left: -50px;
            margin-top: -50px;
            border-radius: 50%;
            background: ${newTheme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
        `;
        
        document.body.appendChild(overlay);
        
        // Create full-screen fade overlay
        const fadeOverlay = document.createElement('div');
        fadeOverlay.className = 'fixed inset-0 pointer-events-none z-[9998]';
        fadeOverlay.style.cssText = `
            background: ${newTheme === 'dark' 
                ? 'linear-gradient(135deg, rgba(88, 28, 135, 0.3), rgba(15, 23, 42, 0.5))'
                : 'linear-gradient(135deg, rgba(249, 168, 212, 0.2), rgba(255, 255, 255, 0.4))'};
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        `;
        document.body.appendChild(fadeOverlay);
        
        // Trigger fade animation
        requestAnimationFrame(() => {
            fadeOverlay.style.opacity = '1';
        });
        
        // Switch theme during animation
        setTimeout(() => {
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        }, 250);
        
        // Clean up overlays
        setTimeout(() => {
            fadeOverlay.style.opacity = '0';
        }, 400);
        
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            if (document.body.contains(fadeOverlay)) {
                document.body.removeChild(fadeOverlay);
            }
            if (typeof showToast === 'function') {
                showToast(`Switched to ${newTheme} mode`, 'success');
            }
        }, 900);
    };

    function updateThemeIcon(theme) {
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    // Initialize theme on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
})();
