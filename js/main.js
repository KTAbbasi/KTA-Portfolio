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

    // Typewriter Animation
    const typewriter = document.getElementById('typewriter');
    if (typewriter) {
        const words = [
            "AI Product Photography",
            "AI Beauty Campaigns",
            "AI Food Photography",
            "AI Campaign Visuals",
            "AI Fashion Campaigns"
        ];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typeSpeed = 100;

        function type() {
            const currentWord = words[wordIndex];
            
            if (isDeleting) {
                typewriter.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
                typeSpeed = 50;
            } else {
                typewriter.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
                typeSpeed = 100;
            }

            if (!isDeleting && charIndex === currentWord.length) {
                isDeleting = true;
                typeSpeed = 3000; // 3 seconds pause at the end
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500;
            }

            setTimeout(type, typeSpeed);
        }

        setTimeout(type, 1000);
    }
});

// Portfolio Filter Function
function filterPortfolio(category) {
    const items = document.querySelectorAll('.project-card');
    const btns = document.querySelectorAll('.tab-btn');
    
    btns.forEach(btn => btn.classList.remove('active'));
    // Find the button that was clicked (based on its onclick attribute)
    btns.forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${category}'`)) {
            btn.classList.add('active');
        }
    });

    items.forEach(item => {
        if (category === 'all' || item.getAttribute('data-category').includes(category)) {
            gsap.to(item, {opacity: 1, scale: 1, duration: 0.4, display: 'block'});
        } else {
            gsap.to(item, {opacity: 0, scale: 0.8, duration: 0.4, display: 'none'});
        }
    });
}
