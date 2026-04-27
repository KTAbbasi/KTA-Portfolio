document.addEventListener('DOMContentLoaded', () => {
    // 3D Tilt for Cards
    const tiltElements = document.querySelectorAll('.tilt-card');
    
    if (window.innerWidth > 768) {
        VanillaTilt.init(tiltElements, {
            max: 15,
            speed: 600,
            glare: true,
            "max-glare": 0.2,
            scale: 1.05
        });
    }
});
