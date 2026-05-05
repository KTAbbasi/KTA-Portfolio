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
    const loaderLine = document.querySelector('.loader-line');
    
    if (loaderLogo && loaderLine) {
        const loaderTl = gsap.timeline();
        
        loaderTl.to(loaderLogo, {
            opacity: 1,
            duration: 0.8,
            delay: 0.2
        })
        .to(loaderLine, {
            width: '120px',
            duration: 1,
            ease: "power2.inOut"
        }, "-=0.3");

        setTimeout(() => {
            gsap.to(loader, {
                yPercent: -100,
                duration: 0.8,
                ease: "power4.inOut"
            });
        }, 2200);
    } else if (loader) {
        // Fallback if elements not found
        setTimeout(() => {
            gsap.to(loader, {
                yPercent: -100,
                duration: 0.8,
                ease: "power4.inOut"
            });
        }, 1500);
    }

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

    // Hidden Admin Trigger
    const adminDot = document.createElement('div');
    adminDot.id = 'admin-trigger';
    adminDot.style.cssText = `
        position: fixed;
        bottom: 5px;
        right: 5px;
        width: 15px;
        height: 15px;
        background: transparent;
        border: 1px solid rgba(201, 168, 76, 0.05);
        border-radius: 50%;
        cursor: pointer;
        z-index: 99999;
        transition: all 0.3s;
    `;
    // Add inner dot
    const innerDot = document.createElement('div');
    innerDot.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 4px;
        height: 4px;
        background: #C9A84C;
        border-radius: 50%;
        opacity: 0.1;
    `;
    adminDot.appendChild(innerDot);

    adminDot.addEventListener('mouseenter', () => {
        innerDot.style.opacity = '0.8';
        adminDot.style.background = 'rgba(201, 168, 76, 0.1)';
    });
    adminDot.addEventListener('mouseleave', () => {
        innerDot.style.opacity = '0.1';
        adminDot.style.background = 'transparent';
    });
    adminDot.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/admin.html';
    });
    document.body.appendChild(adminDot);
});

// Portfolio Filter Function
function filterPortfolio(category) {
    const items = document.querySelectorAll('.project-card');
    const btns = document.querySelectorAll('.tab-btn');
    
    btns.forEach(btn => btn.classList.remove('active'));
    
    // Update active button state
    btns.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${category}'`)) {
            btn.classList.add('active');
        }
    });

    const toShow = [];
    const toHide = [];

    items.forEach(item => {
        const itemCat = item.getAttribute('data-category') || '';
        if (category === 'all' || itemCat.includes(category)) {
            toShow.push(item);
        } else {
            toHide.push(item);
        }
    });

    // Animate Hiding items
    if (toHide.length > 0) {
        gsap.to(toHide, {
            opacity: 0,
            scale: 0.9,
            duration: 0.3,
            display: 'none',
            ease: 'power2.in',
            overwrite: true
        });
    }

    // Animate Showing items with a slight stagger for "engaging" feel
    if (toShow.length > 0) {
        // Set initial state for showing items if they were hidden
        gsap.set(toShow, { display: 'block' });
        
        gsap.fromTo(toShow, 
            { opacity: 0, scale: 0.9 },
            { 
                opacity: 1, 
                scale: 1, 
                duration: 0.5, 
                stagger: 0.08, 
                ease: 'back.out(1.2)',
                delay: 0.1, // Slight delay to let hiding finishes
                clearProps: "transform,opacity",
                overwrite: true
            }
        );
    }
}
