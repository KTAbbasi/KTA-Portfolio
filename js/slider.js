document.addEventListener('DOMContentLoaded', () => {
    // Project Sliders
    const projectSliders = document.querySelectorAll('.project-carousel');
    projectSliders.forEach(container => {
        const slides = container.querySelectorAll('.swiper-slide');
        const hasMultipleSlides = slides.length > 1;
        const projectCard = container.closest('.project-card');

        const swiper = new Swiper(container, {
            effect: "fade",
            fadeEffect: { crossFade: true },
            grabCursor: hasMultipleSlides,
            loop: hasMultipleSlides,
            autoplay: hasMultipleSlides ? {
                delay: 3000,
                disableOnInteraction: false,
            } : false,
            pagination: {
                el: container.querySelector('.swiper-pagination'),
                clickable: true,
                dynamicBullets: true,
            },
            navigation: {
                nextEl: container.querySelector('.swiper-button-next'),
                prevEl: container.querySelector('.swiper-button-prev'),
            },
        });

        // Initialize autoplay as stopped if multiple slides
        if (hasMultipleSlides) {
            swiper.autoplay.stop();
        }

        if (!hasMultipleSlides) {
            container.querySelector('.swiper-button-next')?.remove();
            container.querySelector('.swiper-button-prev')?.remove();
            container.querySelector('.swiper-pagination')?.remove();
        } else {
            // Start autoplay on hover
            projectCard.addEventListener('mouseenter', () => {
                swiper.autoplay.start();
            });

            projectCard.addEventListener('mouseleave', () => {
                swiper.autoplay.stop();
                swiper.slideTo(0);
            });
        }

        // Handle Card Click (Ignore swiper controls)
        projectCard.addEventListener('click', (e) => {
            const isControl = e.target.closest('.swiper-button-next') || 
                              e.target.closest('.swiper-button-prev') || 
                              e.target.closest('.swiper-pagination-bullet');
            
            if (!isControl) {
                const link = projectCard.querySelector('.card-link-overlay')?.getAttribute('href') || 
                             projectCard.dataset.link;
                if (link) {
                    window.open(link, '_blank');
                }
            }
        });
    });

    // Before/After Slider
    const baContainer = document.querySelector('.ba-slider-container');
    if (baContainer) {
        const slider = baContainer.querySelector('.ba-slider');
        const handle = baContainer.querySelector('.ba-handle');
        const afterImg = baContainer.querySelector('.after-image');
        
        let isResizing = false;

        const setPosition = (x) => {
            const rect = baContainer.getBoundingClientRect();
            let position = ((x - rect.left) / rect.width) * 100;
            
            if (position < 0) position = 0;
            if (position > 100) position = 100;
            
            handle.style.left = `${position}%`;
            afterImg.style.clipPath = `inset(0 0 0 ${position}%)`;
        };

        handle.addEventListener('mousedown', () => isResizing = true);
        window.addEventListener('mouseup', () => isResizing = false);
        window.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            setPosition(e.clientX);
        });

        // Touch support
        handle.addEventListener('touchstart', () => isResizing = true);
        window.addEventListener('touchend', () => isResizing = false);
        window.addEventListener('touchmove', (e) => {
            if (!isResizing) return;
            setPosition(e.touches[0].clientX);
        });
    }
});
