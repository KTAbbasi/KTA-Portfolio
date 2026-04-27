document.addEventListener('DOMContentLoaded', () => {
    // 3D Tilt for Cards
    const tiltElements = document.querySelectorAll('.tilt-card');
    
    if (window.innerWidth > 768) {
        VanillaTilt.init(tiltElements, {
            max: 8,
            speed: 400,
            glare: true,
            "max-glare": 0.15,
            scale: 1.02
        });
    }
});
