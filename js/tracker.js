/**
 * KTA AI Studio - Analytics Tracker
 * Hidden tracking for audience data.
 */

(function() {
    // Configuration
    const AUTH_PASSWORD = '1a2s3d_komal';
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    // State
    let visitorId = localStorage.getItem('kta_visitor_id');
    if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('kta_visitor_id', visitorId);
    }
    
    let sessionStart = Date.now();
    let currentTask = null;
    let taskStartTime = Date.now();

    // LocalStorage fallback for non-Firebase environments
    function saveToLocal(event) {
        try {
            const logs = JSON.parse(localStorage.getItem('kta_analytics_local') || '[]');
            logs.push(event);
            // Keep last 1000 events to prevent bloat
            if (logs.length > 1000) logs.shift();
            localStorage.setItem('kta_analytics_local', JSON.stringify(logs));
        } catch (e) {
            console.error('LocalStorage overflow or error');
        }
    }

    let firestoreInstance = null;
    async function getDb() {
        if (firestoreInstance) return firestoreInstance;
        try {
            const { db: getFirebaseDb } = await import('./firebase-init.js');
            const result = await getFirebaseDb();
            firestoreInstance = result.db;
            return firestoreInstance;
        } catch (e) {
            return null;
        }
    }

    async function trackEvent(type, data = {}) {
        const timestamp = new Date().toISOString();
        const event = {
            visitorId,
            type,
            url: window.location.pathname,
            timestamp,
            ua: navigator.userAgent,
            ...data
        };

        saveToLocal(event);

        const firestore = await getDb();
        if (firestore) {
            try {
                const { collection, addDoc } = await import('firebase/firestore');
                await addDoc(collection(firestore, 'analytics_events'), event);
            } catch (e) {
                console.error('Failed to send tracking event:', e);
            }
        }
    }

    // Initial page view with country detection
    async function initTracking() {
        let country = 'Unknown';
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            country = data.country_name || data.country || 'Unknown';
        } catch (e) {
            console.warn('Country detection failed');
        }
        
        // Save country to visitor session
        sessionStorage.setItem('kta_visitor_country', country);
        trackEvent('page_view', { country });
    }

    // Track project interactions
    function setupInteractions() {
        // Tag as admin if authenticated
        const isAdmin = sessionStorage.getItem('kta_admin_authed') === 'true';

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && (link.href.includes('behance.net') || link.classList.contains('overlay-content-link'))) {
                const projectCard = link.closest('.project-card');
                const h3 = projectCard ? projectCard.querySelector('h3') : null;
                const projectName = h3 ? h3.innerText : 'Unknown Project';
                
                trackEvent('project_click', { 
                    project: projectName, 
                    target: link.href,
                    country: sessionStorage.getItem('kta_visitor_country'),
                    isAdmin: isAdmin
                });
            }
        });

        // Secret Admin Trigger: The yellow dot in "KTA." in footer
        // The structure is <a>KTA<span>.</span></a>
        const footerLogo = document.querySelector('footer .logo');
        if (footerLogo) {
            const dot = footerLogo.querySelector('span');
            if (dot) {
                dot.style.cursor = 'pointer';
                dot.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const pass = prompt('Enter Admin Password:');
                    if (pass === AUTH_PASSWORD) {
                        window.location.href = 'admin.html';
                    } else if (pass !== null) {
                        alert('Unauthorized');
                    }
                });
            }
        }
    }

    // Start
    initTracking();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupInteractions);
    } else {
        setupInteractions();
    }

    // Track session end / duration
    window.addEventListener('beforeunload', () => {
        const duration = Math.floor((Date.now() - sessionStart) / 1000);
        trackEvent('session_end', { duration });
    });

})();
