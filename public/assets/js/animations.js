// Page Preloader and Animation Management
(function() {
    'use strict';

    // Page Preloader
    function initPreloader() {
        const preloader = document.getElementById('pagePreloader');
        if (!preloader) return;

        let hasHidden = false;

        function hidePreloader() {
            if (hasHidden) return;
            hasHidden = true;

            setTimeout(() => {
                preloader.classList.add('hidden');
                // Remove from DOM after transition
                setTimeout(() => {
                    if (preloader.parentNode) {
                        preloader.remove();
                    }
                }, 500);
            }, 300); // Minimum display time
        }

        // Hide on window load
        window.addEventListener('load', hidePreloader);

        // Fallback: Hide after 3 seconds if load event doesn't fire
        setTimeout(hidePreloader, 3000);

        // Also hide on DOMContentLoaded as backup
        if (document.readyState === 'complete') {
            hidePreloader();
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(hidePreloader, 500);
            });
        }
    }

    // Button Loading State Management
    window.setButtonLoading = function(button, loading = true) {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.classList.add('btn-loading');
            
            // Store original content
            if (!button.dataset.originalContent) {
                button.dataset.originalContent = button.innerHTML;
            }
            
            // Add loading spinner
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-spinner fa-spin';
            }
        } else {
            button.disabled = false;
            button.classList.remove('btn-loading');
            
            // Restore original content
            if (button.dataset.originalContent) {
                button.innerHTML = button.dataset.originalContent;
            }
        }
    };

    // Auto-add loading state to form submissions
    function initFormLoadingStates() {
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function(e) {
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.classList.contains('no-loading')) {
                    setButtonLoading(submitBtn, true);
                    
                    // Auto-restore after 5 seconds as fallback
                    setTimeout(() => {
                        setButtonLoading(submitBtn, false);
                    }, 5000);
                }
            });
        });
    }

    // Add ripple effect to buttons
    function initRippleEffect() {
        document.querySelectorAll('.btn, button').forEach(button => {
            if (!button.classList.contains('no-ripple')) {
                button.classList.add('ripple');
            }
        });
    }

    // Smooth scroll for anchor links
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || href === '#!') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Intersection Observer for fade-in animations
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements with animate-on-scroll class
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    // Add loading state to async buttons
    window.handleAsyncButton = async function(button, asyncFunction) {
        setButtonLoading(button, true);
        try {
            await asyncFunction();
        } catch (error) {
            console.error('Async button error:', error);
            // Add shake animation on error
            button.classList.add('shake');
            setTimeout(() => button.classList.remove('shake'), 500);
        } finally {
            setButtonLoading(button, false);
        }
    };

    // Add loading overlay for page navigation
    window.showPageLoading = function() {
        const overlay = document.createElement('div');
        overlay.id = 'navigationLoader';
        overlay.className = 'page-preloader';
        overlay.innerHTML = `
            <div class="preloader-logo">
                <i class="fas fa-umbrella-beach"></i>
            </div>
            <div class="preloader-spinner"></div>
            <div class="preloader-text">Loading<span class="loading-dots"></span></div>
        `;
        document.body.appendChild(overlay);
    };

    // Enhanced link navigation with loading
    function initNavigationLoading() {
        document.querySelectorAll('a[href]:not([href^="#"]):not([target="_blank"])').forEach(link => {
            if (!link.classList.contains('no-loading')) {
                link.addEventListener('click', function(e) {
                    // Only show loading for internal navigation
                    if (this.hostname === window.location.hostname) {
                        showPageLoading();
                    }
                });
            }
        });
    }

    // Add transition classes to page elements
    function initPageTransitions() {
        // Add fade-in to main content
        const mainContent = document.querySelector('.main-content, main, .container');
        if (mainContent) {
            mainContent.classList.add('page-transition');
        }

        // Add card transitions
        document.querySelectorAll('.stat-card, .booking-card, .team-card, .content-card').forEach(card => {
            card.classList.add('card-transition');
        });
    }

    // Skeleton loading for dynamic content
    window.showSkeleton = function(container, count = 3) {
        if (!container) return;
        
        const skeletonHTML = `
            <div class="skeleton" style="height: 100px; border-radius: 10px; margin-bottom: 1rem;"></div>
        `.repeat(count);
        
        container.innerHTML = skeletonHTML;
    };

    window.hideSkeleton = function(container, content) {
        if (!container) return;
        container.innerHTML = content;
    };

    // Progress bar for long operations
    window.showProgressBar = function() {
        let progressBar = document.getElementById('globalProgressBar');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'globalProgressBar';
            progressBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: linear-gradient(90deg, #9333ea, #7e22ce);
                z-index: 99999;
                transform: translateX(-100%);
            `;
            document.body.appendChild(progressBar);
        }
        
        progressBar.style.display = 'block';
        progressBar.classList.add('progress-bar-animated');
    };

    window.hideProgressBar = function() {
        const progressBar = document.getElementById('globalProgressBar');
        if (progressBar) {
            progressBar.classList.remove('progress-bar-animated');
            progressBar.style.transform = 'translateX(0)';
            setTimeout(() => {
                progressBar.style.display = 'none';
                progressBar.style.transform = 'translateX(-100%)';
            }, 300);
        }
    };

    // Add bounce animation to elements
    window.bounceElement = function(element) {
        if (!element) return;
        element.classList.add('bounce');
        setTimeout(() => element.classList.remove('bounce'), 600);
    };

    // Add glow effect to elements
    window.glowElement = function(element, duration = 2000) {
        if (!element) return;
        element.classList.add('glow');
        setTimeout(() => element.classList.remove('glow'), duration);
    };

    // Initialize all animations
    function init() {
        // Initialize preloader immediately
        initPreloader();
        
        // Wait for DOM to be ready for other features
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initFormLoadingStates();
                initRippleEffect();
                initSmoothScroll();
                initScrollAnimations();
                initNavigationLoading();
                initPageTransitions();
            });
        } else {
            initFormLoadingStates();
            initRippleEffect();
            initSmoothScroll();
            initScrollAnimations();
            initNavigationLoading();
            initPageTransitions();
        }
    }

    // Initialize immediately
    init();

    // Export functions to window
    window.animations = {
        setButtonLoading,
        handleAsyncButton,
        showPageLoading,
        showSkeleton,
        hideSkeleton,
        showProgressBar,
        hideProgressBar,
        bounceElement,
        glowElement
    };
})();
