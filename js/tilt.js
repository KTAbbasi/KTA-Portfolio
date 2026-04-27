document.addEventListener('DOMContentLoaded', () => {
    // 3D Tilt for Cards
    const serviceCards = document.querySelectorAll('.service-card.tilt-card');
    const projectCards = document.querySelectorAll('.project-card.tilt-card');
    
    if (window.innerWidth > 768) {
        // High impact tilt for service cards
        VanillaTilt.init(serviceCards, {
            max: 15,
            speed: 600,
            glare: true,
            "max-glare": 0.2,
            scale: 1.05
        });

        // subtler tilt for project cards
        VanillaTilt.init(projectCards, {
            max: 5,
            speed: 400,
            glare: false,
            scale: 1.02
        });
    }
});
