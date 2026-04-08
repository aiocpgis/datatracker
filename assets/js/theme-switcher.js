/**
 * Single Button Theme Toggler
 * Cycles between Light -> Dark -> Super Dark
 */

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('themeToggleBtn');
    const toggleIcon = document.getElementById('themeToggleIcon');
    const body = document.body;
    
    // Theme Cycle Definition
    const themes = [
        { name: 'light', icon: 'fa-sun', color: 'text-amber-500' },
        { name: 'dark', icon: 'fa-moon', color: 'text-slate-400' },
        { name: 'accent', icon: 'fa-circle-dot', color: 'text-white' }
    ];

    // Initial State Setup
    let currentThemeName = body.getAttribute('data-theme') || localStorage.getItem('selected-theme') || 'light';
    let currentIndex = themes.findIndex(t => t.name === currentThemeName);
    if (currentIndex === -1) currentIndex = 0;

    applyThemeUI(themes[currentIndex], false);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            const nextIndex = (currentIndex + 1) % themes.length;
            const nextTheme = themes[nextIndex];
            
            // View Transitions API
            if (!document.startViewTransition) {
                currentIndex = nextIndex;
                applyThemeUI(nextTheme, true);
                return;
            }

            const x = e.clientX;
            const y = e.clientY;
            const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

            const transition = document.startViewTransition(() => {
                currentIndex = nextIndex;
                applyThemeUI(nextTheme, true);
            });

            transition.ready.then(() => {
                const clipPath = [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${endRadius}px at ${x}px ${y}px)`
                ];
                document.documentElement.animate(
                    { clipPath: clipPath },
                    {
                        duration: 700,
                        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                        pseudoElement: '::view-transition-new(root)',
                    }
                );
            });
        });
    }

    function applyThemeUI(theme, save = true) {
        // Apply Data Attribute
        body.setAttribute('data-theme', theme.name);
        if (save) localStorage.setItem('selected-theme', theme.name);

        // Update Icon Classes
        if (toggleIcon) {
            toggleIcon.className = `fa-solid ${theme.icon} ${theme.color} text-lg transition-all duration-300`;
        }

        // Update body class for legacy support if needed
        if (theme.name === 'dark') body.classList.add('dark');
        else body.classList.remove('dark');
    }
});
