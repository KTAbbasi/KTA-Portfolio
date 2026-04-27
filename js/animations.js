// GSAP and ScrollTrigger initialization
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
    
    // Hero Text Animations
    const heroTl = gsap.timeline({delay: 1.8});
    heroTl.from(".hero-text .badge", {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    })
    .from(".hero-text h1 span", {
        y: 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power4.out"
    }, "-=0.4")
    .from(".hero-text .subtitle-container", {
        opacity: 0,
        duration: 0.6
    }, "-=0.4")
    .from(".hero-text .ctas a", {
        y: 20,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8
    }, "-=0.4")
    .from(".scroll-indicator", {
        opacity: 0,
        duration: 0.5
    });

    // Parallax effect for Hero Image
    if (window.innerWidth > 768) {
        document.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth / 2 - e.clientX) / 50;
            const y = (window.innerHeight / 2 - e.clientY) / 50;
            
            gsap.to(".hero-image-wrapper img", {
                x: x,
                y: y,
                duration: 1,
                ease: "power2.out"
            });
            
            gsap.to(".hero-image-glow", {
                x: x * 1.5,
                y: y * 1.5,
                duration: 1.5,
                ease: "power2.out"
            });
        });
    }

    // Number counters
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const unit = counter.getAttribute('data-unit') || '';
        
        ScrollTrigger.create({
            trigger: counter,
            start: "top 80%",
            onEnter: () => {
                let count = 0;
                const duration = 2000;
                const startTime = performance.now();
                
                function update(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easedProgress = 1 - Math.pow(1 - progress, 4); // EaseOutQuart
                    
                    count = Math.floor(easedProgress * target);
                    counter.innerText = count + unit;
                    
                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        counter.innerText = target + unit;
                    }
                }
                requestAnimationFrame(update);
            }
        });
    });

    // AOS Initialization fallback if not using AOS library directly but we will use it
    AOS.init({
        duration: 800,
        once: true,
        offset: 100,
        easing: 'ease-out'
    });
});
