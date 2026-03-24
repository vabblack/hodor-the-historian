document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('hidden');
        });
    }

    // Scroll reveal animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe all elements with animation classes
    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });

    // Add animation delay to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navMenu && !navMenu.classList.contains('hidden')) {
                    navMenu.classList.add('hidden');
                }
            }
        });
    });

    // Parallax effect for features section background
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY;
            const featuresPosition = featuresSection.offsetTop;
            const distance = scrollPosition - featuresPosition;
            
            if (distance > -500 && distance < 500) {
                const grid = featuresSection.querySelector('.features-grid');
                const glow1 = featuresSection.querySelector('.features-glow-1');
                const glow2 = featuresSection.querySelector('.features-glow-2');
                
                if (grid) grid.style.transform = `translateY(${distance * 0.05}px)`;
                if (glow1) glow1.style.transform = `translate(${distance * 0.02}px, ${distance * 0.01}px)`;
                if (glow2) glow2.style.transform = `translate(${-distance * 0.02}px, ${-distance * 0.01}px)`;
            }
        });
    }
}); 