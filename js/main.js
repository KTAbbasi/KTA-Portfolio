document.addEventListener('DOMContentLoaded', () => {
    // Custom Cursor
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    
    document.addEventListener('mousemove', (e) => {
        dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        setTimeout(() => {
            ring.style.transform = `translate(${e.clientX - 8}px, ${e.clientY - 8}px)`;
        }, 50);
    });

    // Cursor interaction with links
    const links = document.querySelectorAll('a, button, .clickable');
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            ring.style.width = '40px';
            ring.style.height = '40px';
            ring.style.transform = `translate(${link.getBoundingClientRect().left}px, ${link.getBoundingClientRect().top}px)`;
            ring.style.borderWidth = '2px';
        });
        link.addEventListener('mouseleave', () => {
            ring.style.width = '24px';
            ring.style.height = '24px';
            ring.style.borderWidth = '1px';
        });
    });

    // Page Loader
    const loader = document.querySelector('.loader');
    const loaderLogo = document.querySelector('.loader-logo');
    
    gsap.to(loaderLogo, {
        opacity: 1,
        duration: 0.8,
        delay: 0.2
    });

    setTimeout(() => {
        gsap.to(loader, {
            yPercent: -100,
            duration: 0.8,
            ease: "power4.inOut"
        });
    }, 1500);

    // Mobile Navigation
    const navToggle = document.querySelector('.mobile-nav-toggle');
    const navOverlay = document.querySelector('.mobile-nav-overlay');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navOverlay.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Scroll to Top on Page Load
    window.onbeforeunload = function () {
        window.scrollTo(0, 0);
    };

    // Smooth Scroll for Nav Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });
});
