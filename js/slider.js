document.addEventListener('DOMContentLoaded', () => {
    // Project Sliders
    const projectSliders = document.querySelectorAll('.project-carousel');
    projectSliders.forEach(container => {
        new Swiper(container, {
            effect: "cards",
            grabCursor: true,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            pagination: {
                el: container.querySelector('.swiper-pagination'),
                clickable: true,
            },
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
